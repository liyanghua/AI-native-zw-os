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
  const dir = await mkdtemp(join(tmpdir(), "pilot-sandbox-execution-repo-"));
  const dbPath = join(dir, "sandbox.sqlite");

  try {
    await initLocalSandboxDatabase({ dbPath });
    await seedLocalSandboxDatabase({ dbPath });
    const serverHandle = await startLocalSandboxApiServer({ dbPath, port: 0 });

    try {
      const repositories = createLocalSandboxRepositories(
        createApiClient({ baseUrl: `${serverHandle.baseUrl}/api` }),
      );

      const beforeWorkbench = await repositories.projects.getWorkbench("local-growth-travel-pro");
      assert.equal(beforeWorkbench.loading, false);
      assert.ok(beforeWorkbench.data.actionLineage.actions.length >= 1);
      assert.equal(
        beforeWorkbench.data.actionLineage.actions[0].action.actionId,
        "action-growth-budget-reallocation",
      );
      assert.equal(
        beforeWorkbench.data.actionLineage.actions[0].action.approvalStatus,
        "pending",
      );

      const approveResult = await repositories.execution.approveAction(
        "action-growth-budget-reallocation",
        {
          approvedBy: "老板王敏",
          reason: "允许继续推进闭环验证。",
        },
      );
      assert.equal(approveResult.error, null);
      assert.equal(approveResult.data.action.approvalStatus, "approved");

      const triggerResult = await repositories.execution.triggerAgent({
        projectId: "local-growth-travel-pro",
        actionId: "action-growth-budget-reallocation",
      });
      assert.equal(triggerResult.data.run.actionDomain, "operations");

      const mockRunResult = await repositories.execution.runMockExecution({
        projectId: "local-growth-travel-pro",
        actionId: "action-growth-budget-reallocation",
        runId: triggerResult.data.run.runId,
      });
      assert.equal(mockRunResult.data.executionResult.resultStatus, "completed");

      const writebackResult = await repositories.execution.writebackRun(triggerResult.data.run.runId);
      assert.equal(writebackResult.data.writebackRecord.resultStatus, "succeeded");

      const reviewResult = await repositories.execution.generateReview({
        projectId: "local-growth-travel-pro",
        actionId: "action-growth-budget-reallocation",
        runId: triggerResult.data.run.runId,
      });
      assert.equal(reviewResult.data.review.projectId, "local-growth-travel-pro");

      const publishResult = await repositories.execution.publishAssetCandidate({
        projectId: "local-growth-travel-pro",
        reviewId: reviewResult.data.review.reviewId,
      });
      assert.equal(publishResult.data.assetCandidate.projectId, "local-growth-travel-pro");

      const lineageResult = await repositories.execution.getProjectLineage("local-growth-travel-pro");
      assert.equal(lineageResult.error, null);
      assert.ok(lineageResult.data.actions.length >= 1);
      assert.equal(lineageResult.data.actions[0].assetCandidates.length, 1);

      const afterWorkbench = await repositories.projects.getWorkbench("local-growth-travel-pro");
      assert.equal(
        afterWorkbench.data.actionLineage.actions[0].action.executionStatus,
        "completed",
      );
      assert.ok(afterWorkbench.data.reviews.length >= 1);
      assert.ok(afterWorkbench.data.assetCandidates.length >= 1);

      const bossDashboard = await repositories.roles.getDashboard("boss");
      assert.ok(
        bossDashboard.data.decisionQueue.some((item) => item.executionStatus === "completed"),
        "expected boss dashboard to reflect execution status",
      );

      const operationsDashboard = await repositories.roles.getDashboard("operations_director");
      assert.ok(
        operationsDashboard.data.projectCards.some((item) => item.workflowStatus === "review_ready"),
        "expected operations dashboard workflow summary",
      );
    } finally {
      await serverHandle.close();
    }
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
