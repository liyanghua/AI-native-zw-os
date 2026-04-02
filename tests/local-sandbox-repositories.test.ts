import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { initLocalSandboxDatabase } from "../server/db/init.mjs";
import { seedLocalSandboxDatabase } from "../server/db/seed.mjs";
import { startLocalSandboxApiServer } from "../server/api/server.mjs";
import { createApiClient } from "../src/data-access/apiClient";
import { createLocalSandboxRepositories } from "../src/data-access/localSandboxRepositories";

export default async function run() {
  const dir = await mkdtemp(join(tmpdir(), "pilot-sandbox-repo-"));
  const dbPath = join(dir, "sandbox.sqlite");

  try {
    await initLocalSandboxDatabase({ dbPath });
    await seedLocalSandboxDatabase({ dbPath });
    const serverHandle = await startLocalSandboxApiServer({ dbPath, port: 0 });

    try {
      const repositories = createLocalSandboxRepositories(
        createApiClient({ baseUrl: `${serverHandle.baseUrl}/api` }),
      );

      const overview = await repositories.lifecycle.getOverview();
      assert.equal(overview.loading, false);
      assert.ok(overview.data.summary.liveProjects > 0, "expected lifecycle overview summary");
      assert.ok(overview.data.stageCards.length > 0, "expected lifecycle stage cards");

      const stageBoard = await repositories.lifecycle.getStage("launch_validation");
      assert.ok(stageBoard.data.projects.length === 1, "expected launch stage project list");

      const projectDetail = await repositories.projects.getDetail("local-launch-breeze-bag");
      assert.equal(projectDetail.loading, false);
      assert.equal(projectDetail.data.project.projectId, "local-launch-breeze-bag");
      assert.ok(projectDetail.data.metrics.length >= 3, "expected mapped project metrics");
      assert.ok(projectDetail.data.placeholderBlocks.length > 0, "expected Batch 2 placeholders");

      const workbench = await repositories.projects.getWorkbench("local-launch-breeze-bag");
      assert.equal(workbench.loading, false);
      assert.equal(workbench.data.project.projectId, "local-launch-breeze-bag");
      assert.ok(workbench.data.knowledge.resultCount >= 2, "expected workbench knowledge");
      assert.ok(workbench.data.decision.decisionObject.recommendedActions.length >= 1);
      assert.ok(workbench.data.roleStories.boss.role === "boss", "expected boss role story");
      assert.ok(
        workbench.data.roleStories.operations_director.role === "operations_director",
        "expected operations role story",
      );
      assert.ok(
        workbench.data.roleStories.product_rnd_director.role === "product_rnd_director",
        "expected product role story",
      );
      assert.ok(
        workbench.data.roleStories.visual_director.role === "visual_director",
        "expected visual role story",
      );

      const bossDashboard = await repositories.roles.getDashboard("boss");
      assert.equal(bossDashboard.loading, false);
      assert.equal(bossDashboard.data.role, "boss");
      assert.ok(bossDashboard.data.projectCards.length >= 1, "expected boss dashboard cards");

      const operationsDashboard = await repositories.roles.getDashboard("operations_director");
      assert.equal(operationsDashboard.data.role, "operations_director");
      assert.ok(operationsDashboard.data.decisionQueue.length >= 1, "expected operations queue");

      const productDashboard = await repositories.roles.getDashboard("product_rnd_director");
      assert.equal(productDashboard.data.role, "product_rnd_director");
      assert.ok(productDashboard.data.projectCards.length >= 1, "expected product skeleton cards");

      const visualDashboard = await repositories.roles.getDashboard("visual_director");
      assert.equal(visualDashboard.data.role, "visual_director");
      assert.ok(visualDashboard.data.projectCards.length >= 1, "expected visual skeleton cards");
    } finally {
      await serverHandle.close();
    }
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
