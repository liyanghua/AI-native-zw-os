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
  "published_assets",
  "knowledge_assets",
  "knowledge_chunks",
  "knowledge_chunks_fts",
  "knowledge_retrieval_logs",
  "evaluation_records",
  "knowledge_feedback_records",
  "workflow_runs",
  "task_runs",
  "runtime_events",
  "retry_records",
  "eval_cases",
  "eval_suites",
  "eval_runs",
  "eval_results",
  "gate_decisions",
  "ontology_registry",
  "ontology_versions",
  "policy_objects",
  "template_objects",
  "skill_objects",
  "source_adapters",
  "bridge_configs",
  "sync_records",
  "connector_registry",
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
  review_status TEXT,
  review_type TEXT,
  review_quality_score REAL,
  is_promoted_to_asset INTEGER,
  outcome_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS asset_candidates (
  candidate_id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
  source_review_id TEXT REFERENCES reviews(review_id) ON DELETE SET NULL,
  asset_type TEXT,
  title TEXT NOT NULL,
  content_markdown TEXT NOT NULL,
  review_status TEXT,
  publish_status TEXT,
  reusability_score REAL,
  feedback_to_knowledge TEXT,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS published_assets (
  asset_id TEXT PRIMARY KEY,
  candidate_id TEXT REFERENCES asset_candidates(candidate_id) ON DELETE SET NULL,
  project_id TEXT NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
  source_review_id TEXT REFERENCES reviews(review_id) ON DELETE SET NULL,
  asset_type TEXT NOT NULL,
  title TEXT NOT NULL,
  content_markdown TEXT NOT NULL,
  publish_status TEXT NOT NULL,
  published_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
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

CREATE TABLE IF NOT EXISTS evaluation_records (
  evaluation_id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(project_id) ON DELETE SET NULL,
  decision_id TEXT,
  action_id TEXT REFERENCES actions(action_id) ON DELETE SET NULL,
  run_id TEXT REFERENCES execution_runs(run_id) ON DELETE SET NULL,
  review_id TEXT REFERENCES reviews(review_id) ON DELETE SET NULL,
  candidate_id TEXT REFERENCES asset_candidates(candidate_id) ON DELETE SET NULL,
  evaluation_type TEXT NOT NULL,
  score_json TEXT NOT NULL,
  notes TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS knowledge_feedback_records (
  feedback_id TEXT PRIMARY KEY,
  source_type TEXT NOT NULL,
  source_id TEXT NOT NULL,
  target_asset_id TEXT REFERENCES knowledge_assets(asset_id) ON DELETE SET NULL,
  feedback_mode TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS workflow_runs (
  workflow_id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
  action_id TEXT NOT NULL REFERENCES actions(action_id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  action_domain TEXT NOT NULL,
  status TEXT NOT NULL,
  current_task_type TEXT,
  started_at TEXT NOT NULL,
  finished_at TEXT,
  last_event_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS task_runs (
  task_id TEXT PRIMARY KEY,
  workflow_id TEXT NOT NULL REFERENCES workflow_runs(workflow_id) ON DELETE CASCADE,
  project_id TEXT NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
  action_id TEXT NOT NULL REFERENCES actions(action_id) ON DELETE CASCADE,
  run_id TEXT REFERENCES execution_runs(run_id) ON DELETE SET NULL,
  task_type TEXT NOT NULL,
  attempt INTEGER NOT NULL,
  status TEXT NOT NULL,
  request_payload_json TEXT,
  response_payload_json TEXT,
  error_message TEXT,
  started_at TEXT NOT NULL,
  finished_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS runtime_events (
  event_id TEXT PRIMARY KEY,
  workflow_id TEXT NOT NULL REFERENCES workflow_runs(workflow_id) ON DELETE CASCADE,
  task_id TEXT REFERENCES task_runs(task_id) ON DELETE SET NULL,
  project_id TEXT NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
  action_id TEXT NOT NULL REFERENCES actions(action_id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  status TEXT NOT NULL,
  summary TEXT NOT NULL,
  payload_json TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS retry_records (
  retry_id TEXT PRIMARY KEY,
  workflow_id TEXT NOT NULL REFERENCES workflow_runs(workflow_id) ON DELETE CASCADE,
  original_task_id TEXT NOT NULL REFERENCES task_runs(task_id) ON DELETE CASCADE,
  new_task_id TEXT NOT NULL REFERENCES task_runs(task_id) ON DELETE CASCADE,
  operator TEXT NOT NULL,
  reason TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS eval_cases (
  case_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  scope TEXT NOT NULL,
  severity TEXT NOT NULL,
  status TEXT NOT NULL,
  rule_spec_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS eval_suites (
  suite_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL,
  case_ids_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS eval_runs (
  run_id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
  suite_id TEXT NOT NULL REFERENCES eval_suites(suite_id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  summary_json TEXT NOT NULL,
  started_at TEXT NOT NULL,
  finished_at TEXT
);

CREATE TABLE IF NOT EXISTS eval_results (
  result_id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL REFERENCES eval_runs(run_id) ON DELETE CASCADE,
  case_id TEXT NOT NULL REFERENCES eval_cases(case_id) ON DELETE CASCADE,
  related_object_type TEXT NOT NULL,
  related_object_id TEXT NOT NULL,
  status TEXT NOT NULL,
  score_json TEXT NOT NULL,
  notes TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS gate_decisions (
  gate_id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL REFERENCES eval_runs(run_id) ON DELETE CASCADE,
  decision TEXT NOT NULL,
  summary TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ontology_registry (
  registry_id TEXT PRIMARY KEY,
  item_type TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL,
  owner TEXT NOT NULL,
  current_version INTEGER NOT NULL,
  source_table TEXT,
  source_id TEXT,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ontology_versions (
  version_id TEXT PRIMARY KEY,
  registry_id TEXT NOT NULL REFERENCES ontology_registry(registry_id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  payload_json TEXT NOT NULL,
  change_note TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS policy_objects (
  policy_id TEXT PRIMARY KEY,
  policy_type TEXT NOT NULL,
  title TEXT NOT NULL,
  owner TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS template_objects (
  template_id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  owner TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS skill_objects (
  skill_id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  owner TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS source_adapters (
  adapter_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  mode TEXT NOT NULL,
  owner TEXT NOT NULL,
  connector_key TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS bridge_configs (
  config_id TEXT PRIMARY KEY,
  adapter_id TEXT NOT NULL REFERENCES source_adapters(adapter_id) ON DELETE CASCADE,
  config_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sync_records (
  sync_id TEXT PRIMARY KEY,
  adapter_id TEXT NOT NULL REFERENCES source_adapters(adapter_id) ON DELETE CASCADE,
  mode TEXT NOT NULL,
  started_at TEXT NOT NULL,
  finished_at TEXT,
  rows_imported INTEGER NOT NULL,
  mapping_errors_json TEXT NOT NULL,
  freshness_seconds INTEGER NOT NULL,
  status TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS connector_registry (
  connector_id TEXT PRIMARY KEY,
  connector_key TEXT NOT NULL,
  mode TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
`;
