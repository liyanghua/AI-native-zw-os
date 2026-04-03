export const LOCAL_SANDBOX_TABLES = [
  "projects",
  "project_snapshots",
  "kpi_metrics",
  "opportunities",
  "risk_signals",
  "ontology_entities",
  "stage_rules",
  "actions",
  "approvals",
  "execution_runs",
  "execution_logs",
  "writeback_records",
  "reviews",
  "asset_candidates",
  "knowledge_assets",
  "knowledge_chunks",
  "knowledge_chunks_fts",
  "knowledge_retrieval_logs",
];

export const BATCH1_TABLES = LOCAL_SANDBOX_TABLES;

export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS projects (
  project_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  stage TEXT NOT NULL,
  status TEXT NOT NULL,
  owner TEXT NOT NULL,
  priority INTEGER NOT NULL,
  category TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS project_snapshots (
  snapshot_id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
  summary TEXT NOT NULL,
  current_problem TEXT NOT NULL,
  current_goal TEXT NOT NULL,
  current_risk TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS kpi_metrics (
  metric_id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
  metric_name TEXT NOT NULL,
  metric_value REAL NOT NULL,
  metric_unit TEXT,
  metric_direction TEXT,
  captured_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS opportunities (
  opportunity_id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  signal_type TEXT NOT NULL,
  description TEXT NOT NULL,
  priority INTEGER NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS risk_signals (
  risk_id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
  risk_type TEXT NOT NULL,
  risk_level TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ontology_entities (
  entity_id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_name TEXT NOT NULL,
  entity_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS stage_rules (
  rule_id TEXT PRIMARY KEY,
  stage TEXT NOT NULL,
  rule_type TEXT NOT NULL,
  rule_text TEXT NOT NULL,
  required_fields_json TEXT NOT NULL,
  exit_criteria_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS actions (
  action_id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
  decision_id TEXT,
  role TEXT,
  action_domain TEXT,
  action_type TEXT NOT NULL,
  description TEXT NOT NULL,
  owner TEXT NOT NULL,
  required_approval INTEGER NOT NULL,
  approval_status TEXT NOT NULL,
  execution_status TEXT NOT NULL,
  expected_metric TEXT,
  expected_direction TEXT,
  confidence TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS approvals (
  approval_id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
  action_id TEXT NOT NULL REFERENCES actions(action_id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  approval_status TEXT NOT NULL,
  approved_by TEXT NOT NULL,
  reason TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS execution_runs (
  run_id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
  action_id TEXT NOT NULL REFERENCES actions(action_id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  action_domain TEXT NOT NULL,
  agent_name TEXT NOT NULL,
  connector_name TEXT NOT NULL,
  request_payload_json TEXT NOT NULL,
  response_payload_json TEXT,
  result_status TEXT NOT NULL,
  started_at TEXT NOT NULL,
  finished_at TEXT
);

CREATE TABLE IF NOT EXISTS execution_logs (
  log_id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
  action_id TEXT NOT NULL REFERENCES actions(action_id) ON DELETE CASCADE,
  run_id TEXT NOT NULL REFERENCES execution_runs(run_id) ON DELETE CASCADE,
  log_type TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS writeback_records (
  writeback_id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
  action_id TEXT NOT NULL REFERENCES actions(action_id) ON DELETE CASCADE,
  run_id TEXT NOT NULL REFERENCES execution_runs(run_id) ON DELETE CASCADE,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  payload_hash TEXT NOT NULL,
  result_status TEXT NOT NULL,
  error_message TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS reviews (
  review_id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
  source_action_id TEXT REFERENCES actions(action_id) ON DELETE SET NULL,
  source_run_id TEXT REFERENCES execution_runs(run_id) ON DELETE SET NULL,
  review_summary TEXT NOT NULL,
  outcome_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS asset_candidates (
  candidate_id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
  source_review_id TEXT REFERENCES reviews(review_id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content_markdown TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS knowledge_assets (
  asset_id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  asset_type TEXT NOT NULL,
  stage TEXT NOT NULL,
  role TEXT NOT NULL,
  source_project_id TEXT REFERENCES projects(project_id) ON DELETE SET NULL,
  applicability_json TEXT NOT NULL,
  content_markdown TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS knowledge_chunks (
  chunk_id TEXT PRIMARY KEY,
  asset_id TEXT NOT NULL REFERENCES knowledge_assets(asset_id) ON DELETE CASCADE,
  chunk_text TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  keywords TEXT NOT NULL,
  stage TEXT NOT NULL,
  role TEXT NOT NULL,
  asset_type TEXT NOT NULL
);

CREATE VIRTUAL TABLE IF NOT EXISTS knowledge_chunks_fts USING fts5(
  chunk_id UNINDEXED,
  asset_id UNINDEXED,
  chunk_text,
  keywords,
  stage UNINDEXED,
  role UNINDEXED,
  asset_type UNINDEXED
);

CREATE TABLE IF NOT EXISTS knowledge_retrieval_logs (
  log_id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(project_id) ON DELETE SET NULL,
  query TEXT NOT NULL,
  filters_json TEXT NOT NULL,
  result_count INTEGER NOT NULL,
  created_at TEXT NOT NULL
);
`;
