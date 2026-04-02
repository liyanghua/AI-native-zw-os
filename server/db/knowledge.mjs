import { getProjectDetail } from "./projects.mjs";
import { normalizeRoleType } from "./roleProfiles.mjs";

function now() {
  return new Date().toISOString();
}

function tokenize(input) {
  return [...new Set(((input ?? "").toLowerCase().match(/[\p{L}\p{N}_-]+/gu) ?? []).filter(Boolean))];
}

function toFtsQuery(input) {
  const tokens = tokenize(input).slice(0, 8);
  if (tokens.length === 0) {
    return null;
  }
  return tokens.map((token) => `"${token.replace(/"/g, '""')}"`).join(" OR ");
}

function toLikePattern(input) {
  const tokens = tokenize(input).slice(0, 5);
  return tokens.length > 0 ? `%${tokens.join("%")}%` : "%";
}

export function chunkMarkdownAsset({
  assetId,
  contentMarkdown,
  keywords,
  stage,
  role,
  assetType,
}) {
  const normalized = contentMarkdown.replace(/\r\n/g, "\n").trim();
  const sections = normalized
    .split(/\n(?=##?\s)/)
    .flatMap((section) => section.split(/\n\n+/))
    .map((section) => section.trim())
    .filter(Boolean);

  return sections.map((section, index) => ({
    chunkId: `${assetId}-chunk-${index + 1}`,
    assetId,
    chunkText: section,
    chunkIndex: index,
    keywords,
    stage,
    role,
    assetType,
  }));
}

function mapAssetRow(row) {
  return {
    id: row.asset_id,
    assetId: row.asset_id,
    title: row.title,
    assetType: row.asset_type,
    stage: row.stage,
    role: row.role,
    sourceProjectId: row.source_project_id ?? undefined,
    applicability: JSON.parse(row.applicability_json),
    contentMarkdown: row.content_markdown,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapChunkRow(row) {
  return {
    chunkId: row.chunk_id,
    assetId: row.asset_id,
    chunkText: row.chunk_text,
    chunkIndex: row.chunk_index,
    keywords: row.keywords.split(/\s+/).filter(Boolean),
    stage: row.stage,
    role: row.role,
    assetType: row.asset_type,
  };
}

function appendApplicabilityFilters(input, clauses, params) {
  if (!input.applicability) {
    return;
  }

  if (input.applicability.businessGoal) {
    clauses.push("json_extract(ka.applicability_json, '$.businessGoal') = ?");
    params.push(input.applicability.businessGoal);
  }

  if (input.applicability.category) {
    clauses.push("json_extract(ka.applicability_json, '$.category') = ?");
    params.push(input.applicability.category);
  }

  if (input.applicability.channel) {
    clauses.push("json_extract(ka.applicability_json, '$.channel') = ?");
    params.push(input.applicability.channel);
  }

  if (input.applicability.priceBand) {
    clauses.push("json_extract(ka.applicability_json, '$.priceBand') = ?");
    params.push(input.applicability.priceBand);
  }

  if (input.applicability.lifecycle) {
    clauses.push("json_extract(ka.applicability_json, '$.lifecycle') = ?");
    params.push(input.applicability.lifecycle);
  }
}

function buildStructuredClauses(input, params, chunkTable = "kc") {
  const clauses = [];

  if (input.stage) {
    clauses.push(`${chunkTable}.stage = ?`);
    params.push(input.stage);
  }

  if (input.role) {
    const normalizedRole = normalizeRoleType(input.role) ?? input.role;
    clauses.push(`(${chunkTable}.role = ? OR ${chunkTable}.role = 'all')`);
    params.push(normalizedRole);
  }

  if (input.assetTypes?.length) {
    clauses.push(`${chunkTable}.asset_type IN (${input.assetTypes.map(() => "?").join(", ")})`);
    params.push(...input.assetTypes);
  }

  if (input.sourceProjectId) {
    clauses.push("ka.source_project_id = ?");
    params.push(input.sourceProjectId);
  }

  appendApplicabilityFilters(input, clauses, params);

  return clauses;
}

function findChunkRows(db, input) {
  const ftsQuery = toFtsQuery(input.query);
  const structuredParams = [];
  const structuredClauses = buildStructuredClauses(input, structuredParams, "knowledge_chunks_fts");
  const retrievalTrace = [];

  if (ftsQuery) {
    const sql = `
      SELECT
        kc.*,
        ka.title,
        ka.source_project_id,
        ka.applicability_json,
        ka.content_markdown,
        ka.created_at AS asset_created_at,
        ka.updated_at AS asset_updated_at
      FROM knowledge_chunks_fts
      JOIN knowledge_chunks kc ON kc.chunk_id = knowledge_chunks_fts.chunk_id
      JOIN knowledge_assets ka ON ka.asset_id = kc.asset_id
      WHERE knowledge_chunks_fts MATCH ?
      ${structuredClauses.length > 0 ? `AND ${structuredClauses.join(" AND ")}` : ""}
      ORDER BY kc.chunk_index ASC
      LIMIT 12
    `;
    const rows = db.prepare(sql).all(ftsQuery, ...structuredParams);
    if (rows.length > 0) {
      retrievalTrace.push(`fts5 match: ${ftsQuery}`);
      return {
        rows,
        retrievalTrace,
      };
    }
    retrievalTrace.push(`fts5 empty, fallback to like: ${ftsQuery}`);
  } else {
    retrievalTrace.push("fts5 skipped: empty query");
  }

  const fallbackParams = [];
  const fallbackClauses = buildStructuredClauses(input, fallbackParams);
  const likePattern = toLikePattern(input.query);
  const sql = `
    SELECT
      kc.*,
      ka.title,
      ka.source_project_id,
      ka.applicability_json,
      ka.content_markdown,
      ka.created_at AS asset_created_at,
      ka.updated_at AS asset_updated_at
    FROM knowledge_chunks kc
    JOIN knowledge_assets ka ON ka.asset_id = kc.asset_id
    WHERE 1 = 1
    ${fallbackClauses.length > 0 ? `AND ${fallbackClauses.join(" AND ")}` : ""}
    ${
      input.query
        ? "AND (lower(kc.chunk_text) LIKE ? OR lower(kc.keywords) LIKE ? OR lower(ka.title) LIKE ?)"
        : ""
    }
    ORDER BY
      CASE WHEN ka.source_project_id = ? THEN 0 ELSE 1 END,
      kc.chunk_index ASC
    LIMIT 12
  `;
  const rows = db.prepare(sql).all(
    ...fallbackParams,
    ...(input.query ? [likePattern, likePattern, likePattern] : []),
    input.projectId ?? "",
  );
  retrievalTrace.push(input.query ? `like fallback: ${likePattern}` : "structured fallback");
  return {
    rows,
    retrievalTrace,
  };
}

function writeRetrievalLog(db, input, resultCount) {
  db.prepare(`
    INSERT INTO knowledge_retrieval_logs (
      log_id,
      project_id,
      query,
      filters_json,
      result_count,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    `retrieval-log-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    input.projectId ?? null,
    input.query ?? "",
    JSON.stringify({
      stage: input.stage ?? null,
      role: input.role ?? null,
      assetTypes: input.assetTypes ?? [],
      sourceProjectId: input.sourceProjectId ?? null,
      applicability: input.applicability ?? null,
    }),
    resultCount,
    now(),
  );
}

const stageQueryDefaults = {
  launch_validation: "ctr cvr conversion pricing creative template",
  growth_optimization: "roi budget growth rule case template",
  review_capture: "review asset template sop evaluation",
  opportunity_pool: "opportunity case rule",
  new_product_incubation: "definition template sop pricing",
  legacy_upgrade: "upgrade template rule",
};

export function searchKnowledge(db, input = {}) {
  const { rows, retrievalTrace } = findChunkRows(db, input);
  const matchedChunks = rows.map(mapChunkRow);
  const matchedAssets = Object.values(
    rows.reduce((accumulator, row) => {
      accumulator[row.asset_id] = mapAssetRow({
        ...row,
        created_at: row.asset_created_at,
        updated_at: row.asset_updated_at,
      });
      return accumulator;
    }, {}),
  );

  const result = {
    projectId: input.projectId,
    query: input.query ?? "",
    matchedAssets,
    matchedChunks,
    retrievalTrace,
    resultCount: matchedChunks.length,
    generatedAt: now(),
  };

  writeRetrievalLog(db, input, result.resultCount);
  return result;
}

export function getProjectKnowledge(db, projectId) {
  const detail = getProjectDetail(db, projectId);
  if (!detail) {
    return null;
  }

  const query = stageQueryDefaults[detail.project.stage] ?? detail.latestSnapshot?.currentProblem ?? "";
  return searchKnowledge(db, {
    projectId,
    query,
    stage: detail.project.stage,
  });
}
