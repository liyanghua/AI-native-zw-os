import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { initLocalSandboxDatabase } from "../server/db/init.mjs";
import { seedLocalSandboxDatabase } from "../server/db/seed.mjs";
import { startLocalSandboxApiServer } from "../server/api/server.mjs";

export default async function run() {
  const dir = await mkdtemp(join(tmpdir(), "pilot-sandbox-execution-api-"));
  const dbPath = join(dir, "sandbox.sqlite");

  try {
    await initLocalSandboxDatabase({ dbPath });
    await seedLocalSandboxDatabase({ dbPath });
    const serverHandle = await startLocalSandboxApiServer({ dbPath, port: 0 });

    try {
      const approveResponse = await fetch(
        `${serverHandle.baseUrl}/api/actions/action-growth-budget-reallocation/approve`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            approvedBy: "老板王敏",
            reason: "允许继续执行 ROI 止损与预算重配试验。",
          }),
        },
      );
      assert.equal(approveResponse.status, 200);
      const approveJson = await approveResponse.json();
      assert.equal(approveJson.action.actionId, "action-growth-budget-reallocation");
      assert.equal(approveJson.action.approvalStatus, "approved");
      assert.equal(approveJson.approval.approvalStatus, "approved");

      const triggerResponse = await fetch(`${serverHandle.baseUrl}/api/agent/trigger`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          projectId: "local-growth-travel-pro",
          actionId: "action-growth-budget-reallocation",
        }),
      });
      assert.equal(triggerResponse.status, 200);
      const triggerJson = await triggerResponse.json();
      assert.equal(triggerJson.action.actionId, "action-growth-budget-reallocation");
      assert.equal(triggerJson.run.actionDomain, "operations");
      assert.equal(triggerJson.run.resultStatus, "queued");

      const mockRunResponse = await fetch(`${serverHandle.baseUrl}/api/execution/mock-run`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          projectId: "local-growth-travel-pro",
          actionId: "action-growth-budget-reallocation",
          runId: triggerJson.run.runId,
        }),
      });
      assert.equal(mockRunResponse.status, 200);
      const mockRunJson = await mockRunResponse.json();
      assert.equal(mockRunJson.run.resultStatus, "completed");
      assert.equal(mockRunJson.executionResult.actionDomain, "operations");
      assert.ok(mockRunJson.executionResult.changedMetrics.length >= 1);

      const writebackResponse = await fetch(
        `${serverHandle.baseUrl}/api/execution/${triggerJson.run.runId}/writeback`,
        {
          method: "POST",
        },
      );
      assert.equal(writebackResponse.status, 200);
      const writebackJson = await writebackResponse.json();
      assert.equal(writebackJson.action.executionStatus, "completed");
      assert.equal(writebackJson.writebackRecord.resultStatus, "succeeded");
      assert.ok(writebackJson.updatedKpis.length >= 1);
      assert.ok(writebackJson.updatedProjectSnapshot.currentProblem.includes("ROI"));

      const reviewResponse = await fetch(`${serverHandle.baseUrl}/api/review/generate`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          projectId: "local-growth-travel-pro",
          actionId: "action-growth-budget-reallocation",
          runId: triggerJson.run.runId,
        }),
      });
      assert.equal(reviewResponse.status, 200);
      const reviewJson = await reviewResponse.json();
      assert.equal(reviewJson.review.projectId, "local-growth-travel-pro");
      assert.equal(reviewJson.review.sourceRunId, triggerJson.run.runId);

      const assetResponse = await fetch(`${serverHandle.baseUrl}/api/assets/publish-candidate`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          projectId: "local-growth-travel-pro",
          reviewId: reviewJson.review.reviewId,
        }),
      });
      assert.equal(assetResponse.status, 200);
      const assetJson = await assetResponse.json();
      assert.equal(assetJson.assetCandidate.projectId, "local-growth-travel-pro");
      assert.equal(assetJson.assetCandidate.sourceReviewId, reviewJson.review.reviewId);

      const lineageResponse = await fetch(
        `${serverHandle.baseUrl}/api/projects/local-growth-travel-pro/lineage`,
      );
      assert.equal(lineageResponse.status, 200);
      const lineageJson = await lineageResponse.json();
      assert.equal(lineageJson.projectId, "local-growth-travel-pro");
      assert.equal(lineageJson.actions.length, 1);
      assert.equal(lineageJson.actions[0].action.actionId, "action-growth-budget-reallocation");
      assert.ok(lineageJson.actions[0].runs.length >= 1);
      assert.ok(lineageJson.actions[0].logs.length >= 3);
      assert.equal(lineageJson.actions[0].latestReview.reviewId, reviewJson.review.reviewId);
      assert.equal(lineageJson.actions[0].assetCandidates[0].sourceReviewId, reviewJson.review.reviewId);

      const invalidTriggerResponse = await fetch(`${serverHandle.baseUrl}/api/agent/trigger`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          projectId: "local-launch-breeze-bag",
          actionId: "action-launch-adjust-launch-plan",
        }),
      });
      assert.equal(invalidTriggerResponse.status, 400);
      const invalidTriggerJson = await invalidTriggerResponse.json();
      assert.equal(invalidTriggerJson.error.code, "invalid_action_state");
    } finally {
      await serverHandle.close();
    }
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
