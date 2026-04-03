import { chunkMarkdownAsset } from "./knowledge.mjs";
import { getProjectDetail } from "./projects.mjs";

function now() {
  return new Date().toISOString();
}

function domainError(code, message, statusCode = 400, details) {
  const error = new Error(message);
  error.code = code;
  error.statusCode = statusCode;
  error.details = details;
  return error;
}

function parseJson(value, fallback = {}) {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function slugFromId(id, prefix) {
  return id.startsWith(prefix) ? id.slice(prefix.length) : id;
}

function scoreAverage(rows) {
  if (rows.length === 0) {
    return 0;
  }
  const total = rows.reduce((sum, row) => sum + row.score, 0);
  return Number((total / rows.length).toFixed(1));
}

function getProjectRow(db, projectId) {
  return db.prepare("SELECT * FROM projects WHERE project_id = ?").get(projectId);
}

function getReviewRow(db, reviewId) {
  return db.prepare("SELECT * FROM reviews WHERE review_id = ?").get(reviewId);
}

function getAssetCandidateRow(db, candidateId) {
  return db.prepare("SELECT * FROM asset_candidates WHERE candidate_id = ?").get(candidateId);
}

function getPublishedAssetRow(db, assetId) {
  return db.prepare("SELECT * FROM published_assets WHERE asset_id = ?").get(assetId);
}

function getSourceActionRow(db, actionId) {
  if (!actionId) {
    return null;
  }
  return db.prepare("SELECT * FROM actions WHERE action_id = ?").get(actionId);
}

function buildReviewQuality(row) {
  const outcome = parseJson(row.outcome_json);
  let score = 0;
  if ((row.review_summary ?? "").trim()) {
    score += 35;
  }
  if ((outcome.keyOutcome ?? "").trim()) {
    score += 25;
  }
  if ((outcome.nextSuggestion ?? "").trim()) {
    score += 20;
  }
  if (row.source_action_id || row.source_run_id) {
    score += 20;
  }
  return score;
}

function buildAssetReusability({
  sourceReviewId,
  assetType,
  contentMarkdown,
  publishStatus,
  feedbackToKnowledge,
}) {
  let score = 0;
  if (sourceReviewId) {
    score += 20;
  }
  if (assetType) {
    score += 20;
  }
  if ((contentMarkdown ?? "").trim().length > 120) {
    score += 25;
  }
  if (publishStatus === "published") {
    score += 20;
  }
  if (feedbackToKnowledge === "synced") {
    score += 15;
  }
  return score;
}

function mapActionCenterRow(row) {
  return {
    actionId: row.action_id,
    projectId: row.project_id,
    projectName: row.project_name,
    role: row.role,
    actionDomain: row.action_domain,
    actionType: row.action_type,
    description: row.description,
    approvalStatus: row.approval_status,
    executionStatus: row.execution_status,
    workflowId: row.workflow_id ?? null,
    workflowStatus: row.workflow_status ?? null,
    workflowSummary: row.workflow_current_task_type
      ? `${row.workflow_status ?? "unknown"} · ${row.workflow_current_task_type}`
      : row.workflow_status ?? null,
    priority: row.priority,
    owner: row.owner,
    updatedAt: row.updated_at,
  };
}

function mapReviewCenterRow(row) {
  return {
    reviewId: row.review_id,
    projectId: row.project_id,
    projectName: row.project_name,
    sourceActionId: row.source_action_id,
    reviewType: row.review_type,
    reviewStatus: row.review_status,
    reviewQualityScore: row.review_quality_score,
    summary: row.review_summary,
    isPromotedToAsset: Boolean(row.is_promoted_to_asset),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapAssetCandidateItem(row) {
  return {
    kind: "candidate",
    candidateId: row.candidate_id,
    assetId: null,
    projectId: row.project_id,
    projectName: row.project_name,
    sourceReviewId: row.source_review_id,
    assetType: row.asset_type,
    title: row.title,
    publishStatus: row.publish_status,
    reviewStatus: row.review_status,
    reusabilityScore: row.reusability_score,
    feedbackToKnowledge: row.feedback_to_knowledge,
    updatedAt: row.updated_at,
  };
}

function mapPublishedAssetItem(row) {
  return {
    kind: "published",
    candidateId: row.candidate_id,
    assetId: row.asset_id,
    projectId: row.project_id,
    projectName: row.project_name,
    sourceReviewId: row.source_review_id,
    assetType: row.asset_type,
    title: row.title,
    publishStatus: row.publish_status,
    reviewStatus: "approved",
    reusabilityScore: row.reusability_score,
    feedbackToKnowledge: row.feedback_to_knowledge,
    updatedAt: row.updated_at,
  };
}

function mapPublishedAssetRow(row) {
  return {
    assetId: row.asset_id,
    candidateId: row.candidate_id,
    projectId: row.project_id,
    sourceReviewId: row.source_review_id,
    assetType: row.asset_type,
    title: row.title,
    contentMarkdown: row.content_markdown,
    publishStatus: row.publish_status,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapKnowledgeFeedbackRow(row) {
  return {
    feedbackId: row.feedback_id,
    sourceType: row.source_type,
    sourceId: row.source_id,
    targetAssetId: row.target_asset_id,
    feedbackMode: row.feedback_mode,
    status: row.status,
    createdAt: row.created_at,
  };
}

function mapEvaluationRow(row) {
  const score = parseJson(row.score_json, {});
  const relatedObjectType = row.review_id
    ? "review"
    : row.candidate_id
      ? "asset"
      : row.run_id
        ? "execution"
        : row.action_id
          ? "action"
          : "decision";
  const relatedObjectId = row.review_id ?? row.candidate_id ?? row.run_id ?? row.action_id ?? row.decision_id;
  return {
    evaluationId: row.evaluation_id,
    projectId: row.project_id,
    decisionId: row.decision_id,
    actionId: row.action_id,
    runId: row.run_id,
    reviewId: row.review_id,
    candidateId: row.candidate_id,
    evaluationType: row.evaluation_type,
    relatedObjectType,
    relatedObjectId,
    score: typeof score.score === "number" ? score.score : 0,
    scoreJson: score,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

function buildEvaluationSummary(records) {
  return {
    total: records.length,
    averageScore: scoreAverage(records),
    byType: records.reduce((accumulator, record) => {
      accumulator[record.evaluationType] = (accumulator[record.evaluationType] ?? 0) + 1;
      return accumulator;
    }, {}),
  };
}

function listProjectActionRows(db, projectId) {
  return db.prepare(`
    SELECT a.*, p.name AS project_name, p.priority
    FROM actions a
    JOIN projects p ON p.project_id = a.project_id
    WHERE a.project_id = ?
    ORDER BY a.updated_at DESC
  `).all(projectId);
}

function listProjectReviewRows(db, projectId) {
  return db.prepare(`
    SELECT r.*, p.name AS project_name
    FROM reviews r
    JOIN projects p ON p.project_id = r.project_id
    WHERE r.project_id = ?
    ORDER BY r.created_at DESC
  `).all(projectId);
}

function listProjectAssetCandidateRows(db, projectId) {
  return db.prepare(`
    SELECT c.*, p.name AS project_name
    FROM asset_candidates c
    JOIN projects p ON p.project_id = c.project_id
    WHERE c.project_id = ?
    ORDER BY c.updated_at DESC
  `).all(projectId);
}

function listProjectPublishedAssetRows(db, projectId) {
  return db.prepare(`
    SELECT pa.*, p.name AS project_name,
           COALESCE(ac.reusability_score, 0) AS reusability_score,
           COALESCE(ac.feedback_to_knowledge, 'not_started') AS feedback_to_knowledge
    FROM published_assets pa
    JOIN projects p ON p.project_id = pa.project_id
    LEFT JOIN asset_candidates ac ON ac.candidate_id = pa.candidate_id
    WHERE pa.project_id = ?
    ORDER BY pa.updated_at DESC
  `).all(projectId);
}

export function listActionCenter(db, filters = {}) {
  const params = [];
  const clauses = [];

  if (filters.role) {
    clauses.push("a.role = ?");
    params.push(filters.role);
  }
  if (filters.actionDomain) {
    clauses.push("a.action_domain = ?");
    params.push(filters.actionDomain);
  }
  if (filters.approvalStatus) {
    clauses.push("a.approval_status = ?");
    params.push(filters.approvalStatus);
  }
  if (filters.executionStatus) {
    clauses.push("a.execution_status = ?");
    params.push(filters.executionStatus);
  }
  if (filters.projectId) {
    clauses.push("a.project_id = ?");
    params.push(filters.projectId);
  }

  const rows = db.prepare(`
    SELECT
      a.*,
      p.name AS project_name,
      p.priority,
      w.workflow_id,
      w.status AS workflow_status,
      w.current_task_type AS workflow_current_task_type
    FROM actions a
    JOIN projects p ON p.project_id = a.project_id
    LEFT JOIN workflow_runs w ON w.action_id = a.action_id
    ${clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : ""}
    ORDER BY
      CASE
        WHEN a.approval_status = 'pending' THEN 0
        WHEN a.execution_status = 'in_progress' THEN 1
        WHEN a.execution_status = 'queued' THEN 2
        WHEN a.execution_status = 'completed' THEN 3
        ELSE 4
      END,
      p.priority DESC,
      a.updated_at DESC
  `).all(...params);

  const items = rows.map(mapActionCenterRow);
  return {
    items,
    summary: {
      total: items.length,
      pendingApprovals: items.filter((item) => item.approvalStatus === "pending").length,
      queued: items.filter((item) => item.executionStatus === "queued").length,
      inProgress: items.filter((item) => item.executionStatus === "in_progress").length,
      completed: items.filter((item) => item.executionStatus === "completed").length,
    },
    filters: {
      role: filters.role ?? null,
      actionDomain: filters.actionDomain ?? null,
      approvalStatus: filters.approvalStatus ?? null,
      executionStatus: filters.executionStatus ?? null,
      projectId: filters.projectId ?? null,
    },
  };
}

export function listReviewCenter(db, filters = {}) {
  const params = [];
  const clauses = [];

  if (filters.projectId) {
    clauses.push("r.project_id = ?");
    params.push(filters.projectId);
  }
  if (filters.reviewStatus) {
    clauses.push("r.review_status = ?");
    params.push(filters.reviewStatus);
  }
  if (filters.reviewType) {
    clauses.push("r.review_type = ?");
    params.push(filters.reviewType);
  }
  if (filters.sourceActionId) {
    clauses.push("r.source_action_id = ?");
    params.push(filters.sourceActionId);
  }

  const rows = db.prepare(`
    SELECT r.*, p.name AS project_name
    FROM reviews r
    JOIN projects p ON p.project_id = r.project_id
    ${clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : ""}
    ORDER BY r.created_at DESC
  `).all(...params).map((row) => ({
    ...row,
    review_quality_score: row.review_quality_score ?? buildReviewQuality(row),
  }));

  const items = rows.map(mapReviewCenterRow);
  return {
    items,
    summary: {
      total: items.length,
      approved: items.filter((item) => item.reviewStatus === "approved").length,
      generated: items.filter((item) => item.reviewStatus === "generated").length,
      promoted: items.filter((item) => item.isPromotedToAsset).length,
      promoteable: items.filter((item) => !item.isPromotedToAsset && item.reviewQualityScore >= 60).length,
    },
    filters: {
      projectId: filters.projectId ?? null,
      reviewStatus: filters.reviewStatus ?? null,
      reviewType: filters.reviewType ?? null,
      sourceActionId: filters.sourceActionId ?? null,
    },
  };
}

export function promoteReviewToAsset(db, reviewId, input = {}) {
  const review = getReviewRow(db, reviewId);
  if (!review) {
    throw domainError("review_not_found", `Review ${reviewId} not found.`, 404);
  }
  const project = getProjectRow(db, review.project_id);
  if (!project) {
    throw domainError("project_not_found", `Project ${review.project_id} not found.`, 404);
  }

  const assetType = input.assetType ?? "template";
  const slug = slugFromId(reviewId, "review-");
  const candidateId = `candidate-${slug}-${assetType}`;
  const timestamp = now();
  const sourceAction = getSourceActionRow(db, review.source_action_id);
  const contentMarkdown = [
    `# ${project.name} ${assetType === "template" ? "复用模板" : "复盘资产"}`,
    "",
    review.review_summary,
    "",
    "## 关键结果",
    parseJson(review.outcome_json).keyOutcome ?? "待补充关键结果",
    "",
    "## 下一步建议",
    parseJson(review.outcome_json).nextSuggestion ?? "继续在相近项目验证复用效果。",
  ].join("\n");
  const reusabilityScore = buildAssetReusability({
    sourceReviewId: review.review_id,
    assetType,
    contentMarkdown,
    publishStatus: "candidate",
    feedbackToKnowledge: "not_started",
  });

  let candidate = getAssetCandidateRow(db, candidateId);

  if (!candidate) {
    db.prepare(`
      INSERT INTO asset_candidates (
        candidate_id,
        project_id,
        source_review_id,
        title,
        content_markdown,
        status,
        asset_type,
        review_status,
        publish_status,
        reusability_score,
        feedback_to_knowledge,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      candidateId,
      review.project_id,
      review.review_id,
      `${project.name} ${assetType === "template" ? "可复用模板" : "方法资产"}`,
      contentMarkdown,
      "candidate",
      assetType,
      review.review_status ?? "approved",
      "candidate",
      reusabilityScore,
      "not_started",
      timestamp,
      timestamp,
    );
    candidate = getAssetCandidateRow(db, candidateId);
  }

  db.prepare(`
    UPDATE reviews
    SET review_status = ?,
        review_type = COALESCE(review_type, ?),
        review_quality_score = ?,
        is_promoted_to_asset = 1,
        updated_at = ?
    WHERE review_id = ?
  `).run(
    review.review_status ?? "approved",
    sourceAction?.action_domain === "product_rnd" ? "product_review" : sourceAction?.action_domain === "visual" ? "creative_review" : "execution_review",
    review.review_quality_score ?? buildReviewQuality(review),
    timestamp,
    reviewId,
  );

  const updatedReview = getReviewRow(db, reviewId);
  return {
    review: {
      reviewId: updatedReview.review_id,
      projectId: updatedReview.project_id,
      sourceActionId: updatedReview.source_action_id,
      sourceRunId: updatedReview.source_run_id,
      reviewSummary: updatedReview.review_summary,
      keyOutcome: parseJson(updatedReview.outcome_json).keyOutcome,
      metricImpact: parseJson(updatedReview.outcome_json).metricImpact,
      nextSuggestion: parseJson(updatedReview.outcome_json).nextSuggestion,
      outcome: parseJson(updatedReview.outcome_json),
      reviewStatus: updatedReview.review_status,
      reviewType: updatedReview.review_type,
      reviewQualityScore: updatedReview.review_quality_score,
      isPromotedToAsset: Boolean(updatedReview.is_promoted_to_asset),
      createdAt: updatedReview.created_at,
      updatedAt: updatedReview.updated_at,
    },
    assetCandidate: {
      candidateId: candidate.candidate_id,
      projectId: candidate.project_id,
      sourceReviewId: candidate.source_review_id,
      title: candidate.title,
      contentMarkdown: candidate.content_markdown,
      status: candidate.status,
      assetType: candidate.asset_type,
      reviewStatus: candidate.review_status,
      publishStatus: candidate.publish_status,
      reusabilityScore: candidate.reusability_score,
      feedbackToKnowledge: candidate.feedback_to_knowledge,
      createdAt: candidate.created_at,
      updatedAt: candidate.updated_at,
    },
  };
}

export function listAssetLibrary(db, filters = {}) {
  const params = [];
  const candidateClauses = [];
  const publishedClauses = [];

  if (filters.projectId) {
    candidateClauses.push("c.project_id = ?");
    publishedClauses.push("pa.project_id = ?");
    params.push(filters.projectId);
  }
  if (filters.publishStatus) {
    candidateClauses.push("c.publish_status = ?");
    publishedClauses.push("pa.publish_status = ?");
    params.push(filters.publishStatus);
  }
  if (filters.assetType) {
    candidateClauses.push("c.asset_type = ?");
    publishedClauses.push("pa.asset_type = ?");
    params.push(filters.assetType);
  }

  const candidateParams = [...params];
  const publishedParams = [...params];

  const candidates = db.prepare(`
    SELECT c.*, p.name AS project_name
    FROM asset_candidates c
    JOIN projects p ON p.project_id = c.project_id
    ${candidateClauses.length > 0 ? `WHERE ${candidateClauses.join(" AND ")}` : ""}
    ORDER BY c.updated_at DESC
  `).all(...candidateParams).map((row) => ({
    ...row,
    reusability_score: row.reusability_score ?? buildAssetReusability({
      sourceReviewId: row.source_review_id,
      assetType: row.asset_type,
      contentMarkdown: row.content_markdown,
      publishStatus: row.publish_status,
      feedbackToKnowledge: row.feedback_to_knowledge,
    }),
  }));

  const published = db.prepare(`
    SELECT pa.*, p.name AS project_name,
           COALESCE(ac.reusability_score, 0) AS reusability_score,
           COALESCE(ac.feedback_to_knowledge, 'not_started') AS feedback_to_knowledge
    FROM published_assets pa
    JOIN projects p ON p.project_id = pa.project_id
    LEFT JOIN asset_candidates ac ON ac.candidate_id = pa.candidate_id
    ${publishedClauses.length > 0 ? `WHERE ${publishedClauses.join(" AND ")}` : ""}
    ORDER BY pa.updated_at DESC
  `).all(...publishedParams);

  const items = [
    ...candidates.map(mapAssetCandidateItem),
    ...published.map(mapPublishedAssetItem),
  ].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));

  return {
    items,
    summary: {
      total: items.length,
      candidates: items.filter((item) => item.kind === "candidate").length,
      published: items.filter((item) => item.publishStatus === "published").length,
      feedbackSynced: items.filter((item) => item.feedbackToKnowledge === "synced").length,
    },
    filters: {
      projectId: filters.projectId ?? null,
      publishStatus: filters.publishStatus ?? null,
      assetType: filters.assetType ?? null,
    },
  };
}

export function publishAsset(db, candidateId, _input = {}) {
  const candidate = getAssetCandidateRow(db, candidateId);
  if (!candidate) {
    throw domainError("asset_candidate_not_found", `Asset candidate ${candidateId} not found.`, 404);
  }

  const existing = db.prepare("SELECT * FROM published_assets WHERE candidate_id = ?").get(candidateId);
  if (existing) {
    return {
      publishedAsset: mapPublishedAssetRow(existing),
    };
  }

  const timestamp = now();
  const assetId = `asset-${slugFromId(candidateId, "candidate-")}`;
  db.prepare(`
    INSERT INTO published_assets (
      asset_id,
      candidate_id,
      project_id,
      source_review_id,
      asset_type,
      title,
      content_markdown,
      publish_status,
      published_at,
      created_at,
      updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    assetId,
    candidate.candidate_id,
    candidate.project_id,
    candidate.source_review_id,
    candidate.asset_type,
    candidate.title,
    candidate.content_markdown,
    "published",
    timestamp,
    timestamp,
    timestamp,
  );

  db.prepare(`
    UPDATE asset_candidates
    SET publish_status = 'published',
        status = 'published',
        updated_at = ?
    WHERE candidate_id = ?
  `).run(timestamp, candidateId);

  return {
    publishedAsset: mapPublishedAssetRow(getPublishedAssetRow(db, assetId)),
  };
}

function buildFeedbackSource(db, input) {
  if (input.sourceType === "review") {
    const review = getReviewRow(db, input.sourceId);
    if (!review) {
      throw domainError("review_not_found", `Review ${input.sourceId} not found.`, 404);
    }
    const project = getProjectRow(db, review.project_id);
    const action = getSourceActionRow(db, review.source_action_id);
    const outcome = parseJson(review.outcome_json);
    return {
      project,
      stage: project.stage,
      role: action?.role ?? "all",
      assetType: action?.action_domain === "visual" ? "template" : action?.action_domain === "product_rnd" ? "sop" : "case",
      title: `${project.name} 复盘回流知识`,
      contentMarkdown: [
        `# ${project.name} 复盘回流`,
        "",
        review.review_summary,
        "",
        "## 关键结果",
        outcome.keyOutcome ?? "待补充关键结果",
        "",
        "## 下一步建议",
        outcome.nextSuggestion ?? "继续在相近项目验证复用效果。",
      ].join("\n"),
    };
  }

  if (input.sourceType === "asset_candidate") {
    const candidate = getAssetCandidateRow(db, input.sourceId);
    if (!candidate) {
      throw domainError("asset_candidate_not_found", `Asset candidate ${input.sourceId} not found.`, 404);
    }
    const project = getProjectRow(db, candidate.project_id);
    const review = getReviewRow(db, candidate.source_review_id);
    const action = getSourceActionRow(db, review?.source_action_id);
    return {
      project,
      stage: project.stage,
      role: action?.role ?? "all",
      assetType: candidate.asset_type,
      title: `${candidate.title} 知识回流`,
      contentMarkdown: candidate.content_markdown,
    };
  }

  const published = getPublishedAssetRow(db, input.sourceId);
  if (!published) {
    throw domainError("published_asset_not_found", `Published asset ${input.sourceId} not found.`, 404);
  }
  const project = getProjectRow(db, published.project_id);
  const review = getReviewRow(db, published.source_review_id);
  const action = getSourceActionRow(db, review?.source_action_id);
  return {
    project,
    stage: project.stage,
    role: action?.role ?? "all",
    assetType: published.asset_type,
    title: `${published.title} 知识回流`,
    contentMarkdown: published.content_markdown,
  };
}

export function feedbackToKnowledge(db, input = {}) {
  const existing = db.prepare(`
    SELECT *
    FROM knowledge_feedback_records
    WHERE source_type = ? AND source_id = ? AND feedback_mode = ? AND status = 'synced'
    ORDER BY created_at DESC
    LIMIT 1
  `).get(input.sourceType, input.sourceId, input.feedbackMode ?? "promote_to_knowledge");

  if (existing) {
    return {
      feedback: mapKnowledgeFeedbackRow(existing),
    };
  }

  const source = buildFeedbackSource(db, input);
  const timestamp = now();
  const baseId = `${input.sourceType}-${slugFromId(input.sourceId, `${input.sourceType === "published_asset" ? "asset-" : input.sourceType === "asset_candidate" ? "candidate-" : "review-"}`)}`;
  const knowledgeAssetId = `asset-feedback-${baseId}`;
  const applicability = {
    stage: [source.stage],
    role: source.role === "all" ? ["ceo", "growth_director", "product_rd_director", "visual_director"] : [source.role === "boss" ? "ceo" : source.role === "operations_director" ? "growth_director" : source.role === "product_rnd_director" ? "product_rd_director" : "visual_director"],
    assetType: [source.assetType],
    preconditions: [],
    exclusionConditions: [],
  };

  db.prepare(`
    INSERT INTO knowledge_assets (
      asset_id,
      title,
      asset_type,
      stage,
      role,
      source_project_id,
      applicability_json,
      content_markdown,
      created_at,
      updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    knowledgeAssetId,
    source.title,
    source.assetType,
    source.stage,
    source.role,
    source.project.project_id,
    JSON.stringify(applicability),
    source.contentMarkdown,
    timestamp,
    timestamp,
  );

  const keywords = source.title
    .toLowerCase()
    .split(/[\s-_]+/)
    .filter(Boolean)
    .join(" ");
  const chunks = chunkMarkdownAsset({
    assetId: knowledgeAssetId,
    contentMarkdown: source.contentMarkdown,
    keywords,
    stage: source.stage,
    role: source.role,
    assetType: source.assetType,
  });

  const insertChunk = db.prepare(`
    INSERT INTO knowledge_chunks (
      chunk_id,
      asset_id,
      chunk_text,
      chunk_index,
      keywords,
      stage,
      role,
      asset_type
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertFts = db.prepare(`
    INSERT INTO knowledge_chunks_fts (
      chunk_id,
      chunk_text,
      keywords,
      stage,
      role,
      asset_type
    )
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  for (const chunk of chunks) {
    insertChunk.run(
      chunk.chunkId,
      chunk.assetId,
      chunk.chunkText,
      chunk.chunkIndex,
      chunk.keywords,
      chunk.stage,
      chunk.role,
      chunk.assetType,
    );
    insertFts.run(
      chunk.chunkId,
      chunk.chunkText,
      chunk.keywords,
      chunk.stage,
      chunk.role,
      chunk.assetType,
    );
  }

  const feedbackId = `feedback-${baseId}-${timestamp}`;
  db.prepare(`
    INSERT INTO knowledge_feedback_records (
      feedback_id,
      source_type,
      source_id,
      target_asset_id,
      feedback_mode,
      status,
      created_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    feedbackId,
    input.sourceType,
    input.sourceId,
    knowledgeAssetId,
    input.feedbackMode ?? "promote_to_knowledge",
    "synced",
    timestamp,
  );

  if (input.sourceType === "asset_candidate") {
    db.prepare(`
      UPDATE asset_candidates
      SET feedback_to_knowledge = 'synced',
          updated_at = ?
      WHERE candidate_id = ?
    `).run(timestamp, input.sourceId);
  }

  if (input.sourceType === "published_asset") {
    const published = getPublishedAssetRow(db, input.sourceId);
    if (published?.candidate_id) {
      db.prepare(`
        UPDATE asset_candidates
        SET feedback_to_knowledge = 'synced',
            updated_at = ?
        WHERE candidate_id = ?
      `).run(timestamp, published.candidate_id);
    }
  }

  return {
    feedback: mapKnowledgeFeedbackRow(
      db.prepare("SELECT * FROM knowledge_feedback_records WHERE feedback_id = ?").get(feedbackId),
    ),
  };
}

export function listEvaluations(db, filters = {}) {
  const params = [];
  const clauses = [];

  if (filters.projectId) {
    clauses.push("project_id = ?");
    params.push(filters.projectId);
  }
  if (filters.evaluationType) {
    clauses.push("evaluation_type = ?");
    params.push(filters.evaluationType);
  }

  const records = db.prepare(`
    SELECT *
    FROM evaluation_records
    ${clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : ""}
    ORDER BY created_at DESC
  `).all(...params).map(mapEvaluationRow);

  return {
    records,
    summary: buildEvaluationSummary(records),
  };
}

export function runEvaluations(db, input = {}) {
  const detail = getProjectDetail(db, input.projectId);
  if (!detail) {
    throw domainError("project_not_found", `Project ${input.projectId} not found.`, 404);
  }

  const timestamp = now();
  const records = [];

  function insertRecord({
    evaluationType,
    decisionId = null,
    actionId = null,
    runId = null,
    reviewId = null,
    candidateId = null,
    score,
    checks,
    notes,
  }) {
    const evaluationId = `evaluation-${evaluationType}-${detail.project.projectId}-${timestamp}-${records.length + 1}`;
    db.prepare(`
      INSERT INTO evaluation_records (
        evaluation_id,
        project_id,
        decision_id,
        action_id,
        run_id,
        review_id,
        candidate_id,
        evaluation_type,
        score_json,
        notes,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      evaluationId,
      detail.project.projectId,
      decisionId,
      actionId,
      runId,
      reviewId,
      candidateId,
      evaluationType,
      JSON.stringify({ score, checks }),
      notes,
      timestamp,
    );
    records.push(
      mapEvaluationRow(
        db.prepare("SELECT * FROM evaluation_records WHERE evaluation_id = ?").get(evaluationId),
      ),
    );
  }

  const scope = input.scope ?? "decision";
  if (scope === "decision") {
    const factReady = detail.kpis.length > 0;
    const methodReady = detail.assetCandidates.length > 0 || Boolean(detail.latestReview);
    const actionsReady = detail.actions.length > 0;
    const score = (factReady ? 35 : 0) + (methodReady ? 30 : 0) + (actionsReady ? 35 : 0);
    insertRecord({
      evaluationType: "decision_eval",
      decisionId: `decision-${detail.project.projectId}`,
      score,
      checks: { factReady, methodReady, actionsReady },
      notes: "检查决策输入是否具备事实证据、方法证据和推荐动作。",
    });
  }

  if (scope === "action") {
    for (const action of detail.actions) {
      const hasOwner = Boolean(action.owner);
      const hasDomain = Boolean(action.actionDomain);
      const hasMetric = Boolean(action.expectedMetric);
      insertRecord({
        evaluationType: "action_eval",
        decisionId: action.decisionId ?? null,
        actionId: action.actionId,
        score: (hasOwner ? 35 : 0) + (hasDomain ? 30 : 0) + (hasMetric ? 35 : 0),
        checks: { hasOwner, hasDomain, hasMetric },
        notes: "检查动作是否具备 owner、domain 和 expected metric。",
      });
    }
  }

  if (scope === "execution") {
    const actionRows = listProjectActionRows(db, detail.project.projectId);
    const runRows = db.prepare(`
      SELECT *
      FROM execution_runs
      WHERE project_id = ?
      ORDER BY started_at DESC
    `).all(detail.project.projectId);
    for (const action of actionRows) {
      const run = runRows.find((item) => item.action_id === action.action_id);
      const hasApproval = action.required_approval ? action.approval_status === "approved" : true;
      const hasRun = Boolean(run);
      const hasWriteback = Boolean(
        run &&
          db.prepare("SELECT 1 FROM writeback_records WHERE run_id = ? LIMIT 1").get(run.run_id),
      );
      insertRecord({
        evaluationType: "execution_eval",
        decisionId: action.decision_id ?? null,
        actionId: action.action_id,
        runId: run?.run_id ?? null,
        score: (hasApproval ? 30 : 0) + (hasRun ? 35 : 0) + (hasWriteback ? 35 : 0),
        checks: { hasApproval, hasRun, hasWriteback },
        notes: "检查动作是否完成审批、执行和回写。",
      });
    }
  }

  if (scope === "review") {
    const reviewRows = listProjectReviewRows(db, detail.project.projectId);
    for (const review of reviewRows) {
      const outcome = parseJson(review.outcome_json);
      const hasSummary = Boolean(review.review_summary?.trim());
      const hasNextSuggestion = Boolean((outcome.nextSuggestion ?? "").trim());
      insertRecord({
        evaluationType: "review_eval",
        decisionId: `decision-${detail.project.projectId}`,
        actionId: review.source_action_id ?? null,
        runId: review.source_run_id ?? null,
        reviewId: review.review_id,
        score: (hasSummary ? 50 : 0) + (hasNextSuggestion ? 50 : 0),
        checks: { hasSummary, hasNextSuggestion },
        notes: "检查 review 是否形成可继续复用的总结与下一步建议。",
      });
    }
  }

  if (scope === "asset") {
    const candidateRows = listProjectAssetCandidateRows(db, detail.project.projectId);
    const publishedRows = listProjectPublishedAssetRows(db, detail.project.projectId);
    for (const candidate of candidateRows) {
      const published = publishedRows.find((item) => item.candidate_id === candidate.candidate_id);
      const hasCandidate = true;
      const hasPublished = Boolean(published);
      const hasFeedback = candidate.feedback_to_knowledge === "synced";
      insertRecord({
        evaluationType: "asset_eval",
        decisionId: `decision-${detail.project.projectId}`,
        reviewId: candidate.source_review_id ?? null,
        candidateId: candidate.candidate_id,
        score: (hasCandidate ? 30 : 0) + (hasPublished ? 35 : 0) + (hasFeedback ? 35 : 0),
        checks: { hasCandidate, hasPublished, hasFeedback },
        notes: "检查资产是否形成候选、发布，并反馈回知识层。",
      });
    }
  }

  return {
    records,
    summary: buildEvaluationSummary(records),
  };
}

export function getProjectGovernance(db, projectId) {
  if (!getProjectRow(db, projectId)) {
    return null;
  }

  const actions = listProjectActionRows(db, projectId).map(mapActionCenterRow);
  const reviews = listProjectReviewRows(db, projectId).map((row) =>
    mapReviewCenterRow({
      ...row,
      review_quality_score: row.review_quality_score ?? buildReviewQuality(row),
    }),
  );
  const assetCandidates = listProjectAssetCandidateRows(db, projectId).map((row) =>
    mapAssetCandidateItem({
      ...row,
      reusability_score: row.reusability_score ?? buildAssetReusability({
        sourceReviewId: row.source_review_id,
        assetType: row.asset_type,
        contentMarkdown: row.content_markdown,
        publishStatus: row.publish_status,
        feedbackToKnowledge: row.feedback_to_knowledge,
      }),
    }),
  );
  const publishedAssets = listProjectPublishedAssetRows(db, projectId).map(mapPublishedAssetItem);
  const assets = [...assetCandidates, ...publishedAssets].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  const evaluations = listEvaluations(db, { projectId });
  const feedbackRows = db.prepare(`
    SELECT *
    FROM knowledge_feedback_records
    WHERE source_id IN (
      SELECT review_id FROM reviews WHERE project_id = ?
      UNION
      SELECT candidate_id FROM asset_candidates WHERE project_id = ?
      UNION
      SELECT asset_id FROM published_assets WHERE project_id = ?
    )
    ORDER BY created_at DESC
  `).all(projectId, projectId, projectId).map(mapKnowledgeFeedbackRow);

  return {
    projectId,
    actionsSummary: {
      total: actions.length,
      pendingApprovals: actions.filter((action) => action.approvalStatus === "pending").length,
      inProgress: actions.filter((action) => action.executionStatus === "in_progress" || action.executionStatus === "queued").length,
      completed: actions.filter((action) => action.executionStatus === "completed").length,
      latestAction: actions[0] ?? null,
    },
    reviewSummary: {
      total: reviews.length,
      approved: reviews.filter((review) => review.reviewStatus === "approved").length,
      latestReview: reviews[0] ?? null,
    },
    assetSummary: {
      total: assets.length,
      candidates: assets.filter((asset) => asset.kind === "candidate").length,
      published: assets.filter((asset) => asset.publishStatus === "published").length,
      latestAsset: assets[0] ?? null,
    },
    evaluationSummary: {
      ...evaluations.summary,
      latestEvaluation: evaluations.records[0] ?? null,
    },
    feedbackSummary: {
      total: feedbackRows.length,
      synced: feedbackRows.filter((row) => row.status === "synced").length,
      latestFeedback: feedbackRows[0] ?? null,
    },
  };
}
