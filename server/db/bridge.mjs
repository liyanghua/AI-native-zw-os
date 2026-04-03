import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
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

function mapAdapterRow(row, configRow, syncRow) {
  return {
    adapterId: row.adapter_id,
    name: row.name,
    mode: row.mode,
    owner: row.owner,
    connectorKey: row.connector_key,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    config: configRow ? parseJson(configRow.config_json, {}) : {},
    latestSync: syncRow ? mapSyncRow(syncRow) : null,
  };
}

function mapSyncRow(row) {
  return {
    syncId: row.sync_id,
    adapterId: row.adapter_id,
    mode: row.mode,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    rowsImported: row.rows_imported,
    mappingErrors: parseJson(row.mapping_errors_json, []),
    freshnessSeconds: row.freshness_seconds,
    status: row.status,
  };
}

function mapConnectorRow(row) {
  return {
    connectorId: row.connector_id,
    connectorKey: row.connector_key,
    mode: row.mode,
    title: row.title,
    status: row.status,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function getAdapterRow(db, adapterId) {
  return db.prepare("SELECT * FROM source_adapters WHERE adapter_id = ?").get(adapterId);
}

function getAdapterConfigRow(db, adapterId) {
  return db.prepare("SELECT * FROM bridge_configs WHERE adapter_id = ? LIMIT 1").get(adapterId);
}

function getLatestSyncRow(db, adapterId) {
  return db.prepare(`
    SELECT *
    FROM sync_records
    WHERE adapter_id = ?
    ORDER BY started_at DESC
    LIMIT 1
  `).get(adapterId);
}

function upsertProject(db, project) {
  db.prepare(`
    INSERT INTO projects (
      project_id, name, stage, status, owner, priority, category, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(project_id) DO UPDATE SET
      name = excluded.name,
      stage = excluded.stage,
      status = excluded.status,
      owner = excluded.owner,
      priority = excluded.priority,
      category = excluded.category,
      updated_at = excluded.updated_at
  `).run(
    project.projectId,
    project.name,
    project.stage,
    project.status,
    project.owner,
    project.priority,
    project.category,
    project.createdAt,
    project.updatedAt,
  );
}

function insertSnapshot(db, snapshot) {
  db.prepare(`
    INSERT OR REPLACE INTO project_snapshots (
      snapshot_id, project_id, summary, current_problem, current_goal, current_risk, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    snapshot.snapshotId,
    snapshot.projectId,
    snapshot.summary,
    snapshot.currentProblem,
    snapshot.currentGoal,
    snapshot.currentRisk,
    snapshot.createdAt,
  );
}

function insertMetric(db, metric) {
  db.prepare(`
    INSERT OR REPLACE INTO kpi_metrics (
      metric_id, project_id, metric_name, metric_value, metric_unit, metric_direction, captured_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    metric.metricId,
    metric.projectId,
    metric.metricName,
    metric.metricValue,
    metric.metricUnit ?? null,
    metric.metricDirection ?? null,
    metric.capturedAt,
  );
}

function insertOpportunity(db, opportunity) {
  db.prepare(`
    INSERT OR REPLACE INTO opportunities (
      opportunity_id, project_id, title, signal_type, description, priority, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    opportunity.opportunityId,
    opportunity.projectId,
    opportunity.title,
    opportunity.signalType,
    opportunity.description,
    opportunity.priority,
    opportunity.createdAt,
  );
}

function insertRisk(db, risk) {
  db.prepare(`
    INSERT OR REPLACE INTO risk_signals (
      risk_id, project_id, risk_type, risk_level, description, created_at
    ) VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    risk.riskId,
    risk.projectId,
    risk.riskType,
    risk.riskLevel,
    risk.description,
    risk.createdAt,
  );
}

function insertAction(db, action) {
  db.prepare(`
    INSERT OR REPLACE INTO actions (
      action_id,
      project_id,
      decision_id,
      role,
      action_domain,
      action_type,
      description,
      owner,
      required_approval,
      approval_status,
      execution_status,
      expected_metric,
      expected_direction,
      confidence,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    action.actionId,
    action.projectId,
    action.decisionId ?? null,
    action.role ?? null,
    action.actionDomain ?? null,
    action.actionType,
    action.description,
    action.owner,
    action.requiredApproval ? 1 : 0,
    action.approvalStatus,
    action.executionStatus,
    action.expectedMetric ?? null,
    action.expectedDirection ?? null,
    action.confidence ?? null,
    action.createdAt,
    action.updatedAt,
  );
}

async function loadFixture(config) {
  const fixturePath = resolve(process.cwd(), config.fixturePath);
  const raw = await readFile(fixturePath, "utf8");
  return JSON.parse(raw);
}

function applyFixture(db, fixture) {
  const mappingErrors = [];
  let rowsImported = 0;

  for (const project of fixture.projects ?? []) {
    if (!project.projectId || !project.name || !project.stage) {
      mappingErrors.push({ scope: "project", projectId: project.projectId ?? null, reason: "missing_required_fields" });
      continue;
    }

    upsertProject(db, project);
    rowsImported += 1;

    if (project.snapshot?.snapshotId) {
      insertSnapshot(db, project.snapshot);
      rowsImported += 1;
    }

    for (const metric of project.kpis ?? []) {
      if (!metric.metricId || !metric.metricName) {
        mappingErrors.push({ scope: "metric", projectId: project.projectId, reason: "missing_metric_fields" });
        continue;
      }
      insertMetric(db, { ...metric, projectId: project.projectId });
      rowsImported += 1;
    }

    for (const opportunity of project.opportunities ?? []) {
      if (!opportunity.opportunityId || !opportunity.title) {
        mappingErrors.push({ scope: "opportunity", projectId: project.projectId, reason: "missing_opportunity_fields" });
        continue;
      }
      insertOpportunity(db, { ...opportunity, projectId: project.projectId });
      rowsImported += 1;
    }

    for (const risk of project.risks ?? []) {
      if (!risk.riskId || !risk.riskType) {
        mappingErrors.push({ scope: "risk", projectId: project.projectId, reason: "missing_risk_fields" });
        continue;
      }
      insertRisk(db, { ...risk, projectId: project.projectId });
      rowsImported += 1;
    }

    for (const action of project.actions ?? []) {
      if (!action.actionId || !action.actionType) {
        mappingErrors.push({ scope: "action", projectId: project.projectId, reason: "missing_action_fields" });
        continue;
      }
      insertAction(db, { ...action, projectId: project.projectId });
      rowsImported += 1;
    }
  }

  return { rowsImported, mappingErrors };
}

export function listBridgeAdapters(db) {
  const rows = db.prepare("SELECT * FROM source_adapters ORDER BY updated_at DESC").all();
  const connectors = db.prepare("SELECT * FROM connector_registry ORDER BY created_at ASC").all().map(mapConnectorRow);
  const adapters = rows.map((row) => mapAdapterRow(row, getAdapterConfigRow(db, row.adapter_id), getLatestSyncRow(db, row.adapter_id)));
  return {
    adapters,
    connectors,
  };
}

export function listSyncRecords(db, filters = {}) {
  const rows = filters.adapterId
    ? db.prepare("SELECT * FROM sync_records WHERE adapter_id = ? ORDER BY started_at DESC").all(filters.adapterId)
    : db.prepare("SELECT * FROM sync_records ORDER BY started_at DESC").all();
  return {
    records: rows.map(mapSyncRow),
    filters: {
      adapterId: filters.adapterId ?? null,
    },
  };
}

export async function runBridgeSync(db, input) {
  if (!input?.adapterId) {
    throw domainError("invalid_bridge_input", "adapterId is required.");
  }

  const adapter = getAdapterRow(db, input.adapterId);
  if (!adapter) {
    throw domainError("adapter_not_found", `Adapter ${input.adapterId} not found.`, 404);
  }

  const configRow = getAdapterConfigRow(db, input.adapterId);
  const config = parseJson(configRow?.config_json, {});
  const startedAt = now();

  let rowsImported = 0;
  let mappingErrors = [];
  if (adapter.mode === "file_bridge") {
    const fixture = await loadFixture(config);
    ({ rowsImported, mappingErrors } = applyFixture(db, fixture));
  } else if (adapter.mode === "local_mock") {
    rowsImported = 3;
    mappingErrors = [];
  } else {
    rowsImported = 0;
    mappingErrors = [{ scope: "adapter", reason: "api_bridge_mock_only" }];
  }

  const finishedAt = now();
  const freshnessSeconds = Math.max(1, Math.round((Date.parse(finishedAt) - Date.parse(startedAt)) / 1000));
  const syncId = `sync-${input.adapterId}-${Date.now()}`;

  db.prepare(`
    INSERT INTO sync_records (
      sync_id,
      adapter_id,
      mode,
      started_at,
      finished_at,
      rows_imported,
      mapping_errors_json,
      freshness_seconds,
      status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    syncId,
    input.adapterId,
    adapter.mode,
    startedAt,
    finishedAt,
    rowsImported,
    JSON.stringify(mappingErrors),
    freshnessSeconds,
    mappingErrors.length > 0 ? "warning" : "completed",
  );

  db.prepare(`
    UPDATE source_adapters
    SET updated_at = ?
    WHERE adapter_id = ?
  `).run(finishedAt, input.adapterId);

  return {
    adapter: mapAdapterRow(adapter, configRow, getLatestSyncRow(db, input.adapterId)),
    syncRecord: mapSyncRow(db.prepare("SELECT * FROM sync_records WHERE sync_id = ?").get(syncId)),
  };
}

export function getProjectBridgeSummary(db, projectId) {
  const detail = getProjectDetail(db, projectId);
  if (!detail) {
    return null;
  }

  const adapterRows = db.prepare("SELECT * FROM source_adapters ORDER BY updated_at DESC").all();
  const adapterSummary = adapterRows.map((row) => {
    const sync = getLatestSyncRow(db, row.adapter_id);
    return {
      adapterId: row.adapter_id,
      name: row.name,
      mode: row.mode,
      status: row.status,
      latestSync: sync ? mapSyncRow(sync) : null,
    };
  });

  return {
    projectId,
    adapterSummary,
  };
}
