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
  const dir = await mkdtemp(join(tmpdir(), "pilot-sandbox-governance-repo-"));
  const dbPath = join(dir, "sandbox.sqlite");

  try {
    await initLocalSandboxDatabase({ dbPath });
    await seedLocalSandboxDatabase({ dbPath });
    const serverHandle = await startLocalSandboxApiServer({ dbPath, port: 0 });

    try {
      const repositories = createLocalSandboxRepositories(
        createApiClient({ baseUrl: `${serverHandle.baseUrl}/api` }),
      );

      const actionCenter = await repositories.governance.getActionCenter({
        role: "operations_director",
      });
      assert.equal(actionCenter.error, null);
      assert.ok(actionCenter.data.items.length >= 1, "expected action center items");
      assert.ok(actionCenter.data.summary.total >= actionCenter.data.items.length);

      const reviewCenter = await repositories.governance.getReviewCenter({
        projectId: "local-review-office-classic",
      });
      assert.equal(reviewCenter.error, null);
      assert.ok(reviewCenter.data.items.some((item) => item.reviewId === "review-office-classic"));

      const promoteResult = await repositories.governance.promoteReviewToAsset(
        "review-office-classic",
        {
          assetType: "template",
          operator: "李安",
          reason: "保留办公包详情页可复用模板。",
        },
      );
      assert.equal(promoteResult.error, null);
      assert.equal(promoteResult.data.assetCandidate.candidateId, "candidate-office-classic-template");

      const publishResult = await repositories.governance.publishAsset(
        "candidate-office-classic-template",
        {
          operator: "李安",
          reason: "模板已确认可复用。",
        },
      );
      assert.equal(publishResult.error, null);
      assert.equal(publishResult.data.publishedAsset.publishStatus, "published");

      const feedbackResult = await repositories.governance.feedbackToKnowledge({
        sourceType: "published_asset",
        sourceId: publishResult.data.publishedAsset.assetId,
        feedbackMode: "promote_to_knowledge",
        operator: "李安",
      });
      assert.equal(feedbackResult.error, null);
      assert.equal(feedbackResult.data.feedback.status, "synced");

      const evaluationRun = await repositories.governance.runEvaluations({
        projectId: "local-review-office-classic",
        scope: "asset",
      });
      assert.equal(evaluationRun.error, null);
      assert.ok(evaluationRun.data.records.length >= 1, "expected evaluation records");

      const evaluations = await repositories.governance.getEvaluations({
        projectId: "local-review-office-classic",
      });
      assert.equal(evaluations.error, null);
      assert.ok(evaluations.data.records.length >= 1, "expected persisted evaluations");

      const assetLibrary = await repositories.governance.getAssetLibrary({
        projectId: "local-review-office-classic",
      });
      assert.equal(assetLibrary.error, null);
      assert.ok(
        assetLibrary.data.items.some((item) => item.assetId === publishResult.data.publishedAsset.assetId),
        "expected published asset in asset library",
      );

      const governance = await repositories.governance.getProjectGovernance(
        "local-review-office-classic",
      );
      assert.equal(governance.error, null);
      assert.ok(governance.data.assetSummary.total >= 1);
      assert.ok(governance.data.evaluationSummary.total >= 1);
      assert.ok(governance.data.feedbackSummary.total >= 1);

      const workbench = await repositories.projects.getWorkbench("local-review-office-classic");
      assert.equal(workbench.error, null);
      assert.ok(workbench.data.governance.assetSummary.total >= 1);
      assert.ok(workbench.data.governance.feedbackSummary.total >= 1);

      const bossDashboard = await repositories.roles.getDashboard("boss");
      assert.ok(
        bossDashboard.data.summary.metrics.some((metric) => metric.label.includes("闭环") || metric.label.includes("资产")),
        "expected boss governance-aware summary",
      );
    } finally {
      await serverHandle.close();
    }
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
