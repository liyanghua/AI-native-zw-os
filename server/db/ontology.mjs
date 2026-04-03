import { getProjectDetail } from "./projects.mjs";
import { listRoleProfiles } from "./roleProfiles.mjs";

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

function mapRegistryRow(row) {
  return {
    registryId: row.registry_id,
    itemType: row.item_type,
    name: row.name,
    status: row.status,
    owner: row.owner,
    currentVersion: row.current_version,
    sourceTable: row.source_table,
    sourceId: row.source_id,
    updatedAt: row.updated_at,
  };
}

function mapVersionRow(row) {
  return {
    versionId: row.version_id,
    registryId: row.registry_id,
    version: row.version,
    payload: parseJson(row.payload_json, {}),
    changeNote: row.change_note,
    createdAt: row.created_at,
  };
}

function getRegistryRow(db, registryId) {
  return db.prepare("SELECT * FROM ontology_registry WHERE registry_id = ?").get(registryId);
}

function listVersionRows(db, registryId) {
  return db.prepare(`
    SELECT *
    FROM ontology_versions
    WHERE registry_id = ?
    ORDER BY version DESC
  `).all(registryId);
}

function loadLatestPayload(db, registry) {
  const version = db.prepare(`
    SELECT payload_json
    FROM ontology_versions
    WHERE registry_id = ?
    ORDER BY version DESC
    LIMIT 1
  `).get(registry.registry_id);

  return parseJson(version?.payload_json, {});
}

function buildLineageReferences(db, registry) {
  if (registry.item_type === "stage_rule") {
    const projects = db.prepare("SELECT project_id, name FROM projects WHERE stage = ?").all(registry.source_id);
    return projects.map((project) => ({
      referenceType: "project",
      referenceId: project.project_id,
      label: project.name,
    }));
  }

  if (registry.item_type === "asset_type") {
    const assets = db.prepare(`
      SELECT asset_id, title
      FROM published_assets
      WHERE asset_type = ?
      ORDER BY updated_at DESC
      LIMIT 5
    `).all(registry.source_id);
    return assets.map((asset) => ({
      referenceType: "published_asset",
      referenceId: asset.asset_id,
      label: asset.title,
    }));
  }

  if (registry.item_type === "review_pattern") {
    const reviews = db.prepare(`
      SELECT review_id, review_summary
      FROM reviews
      WHERE review_type = ?
      ORDER BY updated_at DESC, created_at DESC
      LIMIT 5
    `).all(registry.source_id);
    return reviews.map((review) => ({
      referenceType: "review",
      referenceId: review.review_id,
      label: review.review_summary,
    }));
  }

  if (registry.item_type === "role_profile") {
    return [{
      referenceType: "role_profile",
      referenceId: registry.source_id,
      label: registry.name,
    }];
  }

  const feedback = db.prepare(`
    SELECT feedback_id, source_type, source_id
    FROM knowledge_feedback_records
    ORDER BY created_at DESC
    LIMIT 5
  `).all();
  return feedback.map((item) => ({
    referenceType: item.source_type,
    referenceId: item.source_id,
    label: item.feedback_id,
  }));
}

export function listOntologyRegistry(db, filters = {}) {
  const params = [];
  const clauses = [];
  if (filters.itemType) {
    clauses.push("item_type = ?");
    params.push(filters.itemType);
  }
  if (filters.status) {
    clauses.push("status = ?");
    params.push(filters.status);
  }

  const rows = db.prepare(`
    SELECT *
    FROM ontology_registry
    ${clauses.length ? `WHERE ${clauses.join(" AND ")}` : ""}
    ORDER BY updated_at DESC, name ASC
  `).all(...params);

  return {
    items: rows.map(mapRegistryRow),
    filters: {
      itemType: filters.itemType ?? null,
      status: filters.status ?? null,
    },
  };
}

export function getOntologyRegistryItem(db, registryId) {
  const registry = getRegistryRow(db, registryId);
  if (!registry) {
    return null;
  }

  return {
    item: mapRegistryRow(registry),
    latestPayload: loadLatestPayload(db, registry),
    versions: listVersionRows(db, registryId).map(mapVersionRow),
    lineageReferences: buildLineageReferences(db, registry),
  };
}

function createVersionSnapshot(db, registry, changeNote) {
  const payload = loadLatestPayload(db, registry);
  const nextVersion = Number(registry.current_version) + 1;
  const createdAt = now();
  const versionId = `${registry.registry_id}-v${nextVersion}`;

  db.prepare(`
    INSERT INTO ontology_versions (
      version_id,
      registry_id,
      version,
      payload_json,
      change_note,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    versionId,
    registry.registry_id,
    nextVersion,
    JSON.stringify(payload),
    changeNote,
    createdAt,
  );

  return { versionId, version: nextVersion, createdAt };
}

function updateRegistryStatus(db, registryId, status, operator, reason) {
  const registry = getRegistryRow(db, registryId);
  if (!registry) {
    throw domainError("ontology_item_not_found", `Ontology item ${registryId} not found.`, 404);
  }

  const version = createVersionSnapshot(db, registry, `${status} by ${operator}: ${reason ?? ""}`.trim());
  db.prepare(`
    UPDATE ontology_registry
    SET status = ?, current_version = ?, updated_at = ?
    WHERE registry_id = ?
  `).run(status, version.version, version.createdAt, registryId);

  return getOntologyRegistryItem(db, registryId);
}

export function activateOntologyItem(db, input) {
  if (!input?.registryId) {
    throw domainError("invalid_ontology_input", "registryId is required.");
  }
  return updateRegistryStatus(db, input.registryId, "active", input.operator ?? "system", input.reason);
}

export function deprecateOntologyItem(db, input) {
  if (!input?.registryId) {
    throw domainError("invalid_ontology_input", "registryId is required.");
  }
  return updateRegistryStatus(db, input.registryId, "deprecated", input.operator ?? "system", input.reason);
}

export function getProjectOntologyReferences(db, projectId) {
  const detail = getProjectDetail(db, projectId);
  if (!detail) {
    return null;
  }

  const stageItem = db.prepare(`
    SELECT *
    FROM ontology_registry
    WHERE item_type = 'stage_rule' AND source_id = ?
    LIMIT 1
  `).get(detail.project.stage);

  const actionDomains = [...new Set(detail.actions.map((action) => action.actionDomain).filter(Boolean))];
  const actionPolicies = actionDomains.flatMap((domain) =>
    db.prepare(`
      SELECT *
      FROM ontology_registry
      WHERE item_type = 'action_policy' AND source_id = ?
      LIMIT 1
    `).all(domain),
  );

  const assetTypes = [...new Set(detail.assetCandidates.map((asset) => asset.assetType).filter(Boolean))];
  const assetTypeItems = assetTypes.flatMap((assetType) =>
    db.prepare(`
      SELECT *
      FROM ontology_registry
      WHERE item_type = 'asset_type' AND source_id = ?
      LIMIT 1
    `).all(assetType),
  );

  const roleItems = listRoleProfiles()
    .map((profile) =>
      db.prepare(`
        SELECT *
        FROM ontology_registry
        WHERE item_type = 'role_profile' AND source_id = ?
        LIMIT 1
      `).get(profile.roleId),
    )
    .filter(Boolean);

  const references = [stageItem, ...actionPolicies, ...assetTypeItems, ...roleItems]
    .filter(Boolean)
    .map(mapRegistryRow);

  return {
    projectId,
    references,
  };
}
