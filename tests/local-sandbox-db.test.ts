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
        "asset_candidates",
        "kpi_metrics",
        "knowledge_assets",
        "knowledge_chunks",
        "knowledge_chunks_fts",
        "knowledge_retrieval_logs",
        "ontology_entities",
        "opportunities",
        "project_snapshots",
        "projects",
        "reviews",
        "risk_signals",
        "stage_rules",
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

      const reviewProject = db
        .prepare("SELECT project_id, stage, status FROM projects WHERE project_id = ?")
        .get("local-review-office-classic");
      assert.equal(reviewProject.stage, "review_capture");
      assert.equal(reviewProject.status, "closed");

      const actionCount = db.prepare("SELECT COUNT(*) AS count FROM actions").get().count;
      assert.ok(actionCount >= 1, "expected action placeholder rows");

      const reviewCount = db.prepare("SELECT COUNT(*) AS count FROM reviews").get().count;
      const assetCandidateCount = db.prepare("SELECT COUNT(*) AS count FROM asset_candidates").get().count;
      assert.ok(reviewCount >= 1, "expected review placeholders");
      assert.ok(assetCandidateCount >= 1, "expected asset candidate placeholders");

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
    } finally {
      db.close();
    }
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
