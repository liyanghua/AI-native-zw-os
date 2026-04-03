import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { openDatabase } from "../server/db/client.mjs";
import { initLocalSandboxDatabase } from "../server/db/init.mjs";
import { seedLocalSandboxDatabase } from "../server/db/seed.mjs";

export default async function run() {
  const dir = await mkdtemp(join(tmpdir(), "pilot-sandbox-db-"));
  const dbPath = join(dir, "sandbox.sqlite");

  try {
    await initLocalSandboxDatabase({ dbPath });
    await seedLocalSandboxDatabase({ dbPath });

    const db = openDatabase(dbPath);
    try {
      const tables = db
        .prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name")
        .all()
        .map((row) => row.name);

      [
        "actions",
        "approvals",
        "asset_candidates",
        "bridge_configs",
        "connector_registry",
        "eval_cases",
        "eval_results",
        "eval_runs",
        "eval_suites",
        "execution_logs",
        "execution_runs",
        "evaluation_records",
        "gate_decisions",
        "kpi_metrics",
        "knowledge_assets",
        "knowledge_chunks",
        "knowledge_chunks_fts",
        "knowledge_feedback_records",
        "knowledge_retrieval_logs",
        "ontology_entities",
        "ontology_registry",
        "ontology_versions",
        "opportunities",
        "policy_objects",
        "published_assets",
        "project_snapshots",
        "projects",
        "retry_records",
        "reviews",
        "risk_signals",
        "runtime_events",
        "skill_objects",
        "source_adapters",
        "stage_rules",
        "task_runs",
        "template_objects",
        "workflow_runs",
        "writeback_records",
      ].forEach((tableName) => {
        assert.ok(tables.includes(tableName), `expected table ${tableName}`);
      });

      const projectCount = db.prepare("SELECT COUNT(*) AS count FROM projects").get().count;
      assert.equal(projectCount, 3, "expected 3 seeded projects");

      const launchProject = db
        .prepare("SELECT project_id, stage FROM projects WHERE project_id = ?")
        .get("local-launch-breeze-bag");
      assert.equal(launchProject.stage, "launch_validation");

      const launchKpis = db
        .prepare("SELECT metric_name, metric_value FROM kpi_metrics WHERE project_id = ? ORDER BY metric_name")
        .all("local-launch-breeze-bag");
      assert.ok(launchKpis.length >= 3, "expected at least 3 KPI rows for launch project");

      const growthProject = db
        .prepare("SELECT project_id, stage FROM projects WHERE project_id = ?")
        .get("local-growth-travel-pro");
      assert.equal(growthProject.stage, "growth_optimization");

      const growthAction = db
        .prepare(`
          SELECT action_id, decision_id, role, action_domain, approval_status, execution_status
          FROM actions
          WHERE project_id = ?
        `)
        .get("local-growth-travel-pro");
      assert.equal(growthAction.action_id, "action-growth-budget-reallocation");
      assert.equal(growthAction.action_domain, "operations");
      assert.equal(growthAction.approval_status, "pending");

      const reviewProject = db
        .prepare("SELECT project_id, stage, status FROM projects WHERE project_id = ?")
        .get("local-review-office-classic");
      assert.equal(reviewProject.stage, "review_capture");
      assert.equal(reviewProject.status, "closed");

      const actionCount = db.prepare("SELECT COUNT(*) AS count FROM actions").get().count;
      assert.ok(actionCount >= 3, "expected action seed rows across all projects");

      const approvalCount = db.prepare("SELECT COUNT(*) AS count FROM approvals").get().count;
      const executionRunCount = db.prepare("SELECT COUNT(*) AS count FROM execution_runs").get().count;
      const executionLogCount = db.prepare("SELECT COUNT(*) AS count FROM execution_logs").get().count;
      assert.ok(approvalCount >= 1, "expected approval seed rows");
      assert.ok(executionRunCount >= 1, "expected execution run seed rows");
      assert.ok(executionLogCount >= 1, "expected execution log seed rows");

      const reviewCount = db.prepare("SELECT COUNT(*) AS count FROM reviews").get().count;
      const assetCandidateCount = db.prepare("SELECT COUNT(*) AS count FROM asset_candidates").get().count;
      const publishedAssetCount = db.prepare("SELECT COUNT(*) AS count FROM published_assets").get().count;
      const evaluationCount = db.prepare("SELECT COUNT(*) AS count FROM evaluation_records").get().count;
      const feedbackCount = db.prepare("SELECT COUNT(*) AS count FROM knowledge_feedback_records").get().count;
      assert.ok(reviewCount >= 1, "expected review placeholders");
      assert.ok(assetCandidateCount >= 1, "expected asset candidate placeholders");
      assert.ok(publishedAssetCount >= 1, "expected published asset placeholders");
      assert.ok(evaluationCount >= 1, "expected evaluation placeholders");
      assert.ok(feedbackCount >= 1, "expected knowledge feedback placeholders");

      const workflowCount = db.prepare("SELECT COUNT(*) AS count FROM workflow_runs").get().count;
      const taskCount = db.prepare("SELECT COUNT(*) AS count FROM task_runs").get().count;
      const runtimeEventCount = db.prepare("SELECT COUNT(*) AS count FROM runtime_events").get().count;
      const retryCount = db.prepare("SELECT COUNT(*) AS count FROM retry_records").get().count;
      assert.ok(workflowCount >= 3, "expected workflow runs for seeded actions");
      assert.ok(taskCount >= 4, "expected task runs for seeded workflows");
      assert.ok(runtimeEventCount >= 4, "expected runtime events");
      assert.ok(retryCount >= 1, "expected at least one retry record");

      const evalCaseCount = db.prepare("SELECT COUNT(*) AS count FROM eval_cases").get().count;
      const evalSuiteCount = db.prepare("SELECT COUNT(*) AS count FROM eval_suites").get().count;
      const evalRunCount = db.prepare("SELECT COUNT(*) AS count FROM eval_runs").get().count;
      const evalResultCount = db.prepare("SELECT COUNT(*) AS count FROM eval_results").get().count;
      const gateDecisionCount = db.prepare("SELECT COUNT(*) AS count FROM gate_decisions").get().count;
      assert.ok(evalCaseCount >= 5, "expected eval cases");
      assert.ok(evalSuiteCount >= 1, "expected eval suites");
      assert.ok(evalRunCount >= 1, "expected eval runs");
      assert.ok(evalResultCount >= 1, "expected eval results");
      assert.ok(gateDecisionCount >= 1, "expected gate decisions");

      const ontologyRegistryCount = db.prepare("SELECT COUNT(*) AS count FROM ontology_registry").get().count;
      const ontologyVersionCount = db.prepare("SELECT COUNT(*) AS count FROM ontology_versions").get().count;
      const policyObjectCount = db.prepare("SELECT COUNT(*) AS count FROM policy_objects").get().count;
      const templateObjectCount = db.prepare("SELECT COUNT(*) AS count FROM template_objects").get().count;
      const skillObjectCount = db.prepare("SELECT COUNT(*) AS count FROM skill_objects").get().count;
      assert.ok(ontologyRegistryCount >= 8, "expected ontology registry rows");
      assert.ok(ontologyVersionCount >= 8, "expected ontology version rows");
      assert.ok(policyObjectCount >= 2, "expected policy objects");
      assert.ok(templateObjectCount >= 1, "expected template objects");
      assert.ok(skillObjectCount >= 1, "expected skill objects");

      const adapterCount = db.prepare("SELECT COUNT(*) AS count FROM source_adapters").get().count;
      const bridgeConfigCount = db.prepare("SELECT COUNT(*) AS count FROM bridge_configs").get().count;
      const syncRecordCount = db.prepare("SELECT COUNT(*) AS count FROM sync_records").get().count;
      const connectorRegistryCount = db.prepare("SELECT COUNT(*) AS count FROM connector_registry").get().count;
      assert.ok(adapterCount >= 3, "expected source adapters");
      assert.ok(bridgeConfigCount >= 3, "expected bridge configs");
      assert.ok(syncRecordCount >= 1, "expected sync records");
      assert.ok(connectorRegistryCount >= 3, "expected connector registry rows");

      const reviewLineage = db
        .prepare("SELECT source_action_id, source_run_id FROM reviews WHERE source_action_id IS NOT NULL LIMIT 1")
        .get();
      assert.ok(reviewLineage.source_action_id, "expected review source action lineage");
      assert.ok(reviewLineage.source_run_id, "expected review source run lineage");

      const assetLineage = db
        .prepare("SELECT source_review_id FROM asset_candidates WHERE source_review_id IS NOT NULL LIMIT 1")
        .get();
      assert.ok(assetLineage.source_review_id, "expected asset candidate source review lineage");

      const reviewGovernance = db
        .prepare(`
          SELECT review_status, review_type, review_quality_score, is_promoted_to_asset, updated_at
          FROM reviews
          WHERE review_id = ?
        `)
        .get("review-office-classic");
      assert.equal(reviewGovernance.review_status, "approved");
      assert.equal(reviewGovernance.review_type, "execution_review");
      assert.ok(reviewGovernance.review_quality_score >= 80, "expected review quality score");
      assert.equal(reviewGovernance.is_promoted_to_asset, 1);
      assert.ok(reviewGovernance.updated_at, "expected review updated_at");

      const candidateGovernance = db
        .prepare(`
          SELECT asset_type, review_status, publish_status, reusability_score, feedback_to_knowledge, updated_at
          FROM asset_candidates
          WHERE candidate_id = ?
        `)
        .get("candidate-office-classic-template");
      assert.equal(candidateGovernance.asset_type, "template");
      assert.equal(candidateGovernance.review_status, "approved");
      assert.equal(candidateGovernance.publish_status, "candidate");
      assert.ok(candidateGovernance.reusability_score >= 70, "expected candidate reusability score");
      assert.equal(candidateGovernance.feedback_to_knowledge, "not_started");
      assert.ok(candidateGovernance.updated_at, "expected candidate updated_at");

      const publishedAsset = db
        .prepare(`
          SELECT candidate_id, source_review_id, asset_type, publish_status
          FROM published_assets
          WHERE asset_id = ?
        `)
        .get("asset-office-classic-playbook");
      assert.equal(publishedAsset.candidate_id, "candidate-office-classic-playbook");
      assert.equal(publishedAsset.source_review_id, "review-office-classic");
      assert.equal(publishedAsset.asset_type, "case");
      assert.equal(publishedAsset.publish_status, "published");

      const evaluationRecord = db
        .prepare(`
          SELECT evaluation_type, notes
          FROM evaluation_records
          WHERE project_id = ?
          LIMIT 1
        `)
        .get("local-review-office-classic");
      assert.ok(evaluationRecord.evaluation_type, "expected evaluation type");
      assert.ok(evaluationRecord.notes, "expected evaluation notes");

      const feedbackRecord = db
        .prepare(`
          SELECT source_type, source_id, target_asset_id, feedback_mode, status
          FROM knowledge_feedback_records
          WHERE source_id = ?
          LIMIT 1
        `)
        .get("asset-office-classic-playbook");
      assert.equal(feedbackRecord.source_type, "published_asset");
      assert.equal(feedbackRecord.feedback_mode, "promote_to_knowledge");
      assert.equal(feedbackRecord.status, "synced");
      assert.ok(feedbackRecord.target_asset_id, "expected feedback target asset");

      const knowledgeAssetCount = db.prepare("SELECT COUNT(*) AS count FROM knowledge_assets").get().count;
      const knowledgeChunkCount = db.prepare("SELECT COUNT(*) AS count FROM knowledge_chunks").get().count;
      assert.ok(knowledgeAssetCount >= 5, "expected seeded knowledge assets");
      assert.ok(knowledgeChunkCount >= 8, "expected seeded knowledge chunks");

      const launchKnowledgeCount = db
        .prepare("SELECT COUNT(*) AS count FROM knowledge_assets WHERE stage = ?")
        .get("launch_validation")
        .count;
      assert.ok(launchKnowledgeCount >= 2, "expected launch stage knowledge");

      const directorAliasCount = db
        .prepare("SELECT COUNT(*) AS count FROM knowledge_assets WHERE role = ?")
        .get("director")
        .count;
      assert.equal(directorAliasCount, 0, "expected canonical concrete roles only");

      const operationsKnowledgeCount = db
        .prepare("SELECT COUNT(*) AS count FROM knowledge_assets WHERE role = ?")
        .get("operations_director")
        .count;
      const productKnowledgeCount = db
        .prepare("SELECT COUNT(*) AS count FROM knowledge_assets WHERE role = ?")
        .get("product_rnd_director")
        .count;
      const visualKnowledgeCount = db
        .prepare("SELECT COUNT(*) AS count FROM knowledge_assets WHERE role = ?")
        .get("visual_director")
        .count;

      assert.ok(operationsKnowledgeCount >= 1, "expected operations knowledge");
      assert.ok(productKnowledgeCount >= 1, "expected product knowledge");
      assert.ok(visualKnowledgeCount >= 1, "expected visual knowledge");

      const retryableTask = db
        .prepare("SELECT task_id, status FROM task_runs WHERE status IN ('retryable', 'failed') LIMIT 1")
        .get();
      assert.ok(retryableTask?.task_id, "expected retryable task");

      const workflowSummary = db
        .prepare("SELECT workflow_id, status FROM workflow_runs WHERE project_id = ? LIMIT 1")
        .get("local-review-office-classic");
      assert.ok(workflowSummary?.workflow_id, "expected project workflow");
      assert.equal(workflowSummary.status, "completed");

      const evalSuite = db
        .prepare("SELECT suite_id, name FROM eval_suites WHERE suite_id = ?")
        .get("eval-suite-batch6-smoke");
      assert.equal(evalSuite.name, "Batch 6 Smoke Suite");

      const ontologyItem = db
        .prepare("SELECT item_type, status, owner, current_version FROM ontology_registry WHERE registry_id = ?")
        .get("ontology-role-profile-boss");
      assert.equal(ontologyItem.item_type, "role_profile");
      assert.equal(ontologyItem.status, "active");
      assert.ok(ontologyItem.owner, "expected ontology owner");
      assert.ok(ontologyItem.current_version >= 1, "expected ontology version");

      const fileBridgeAdapter = db
        .prepare("SELECT adapter_id, mode FROM source_adapters WHERE adapter_id = ?")
        .get("adapter-file-bridge");
      assert.equal(fileBridgeAdapter.mode, "file_bridge");
    } finally {
      db.close();
    }
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
