import assert from "node:assert/strict";
import { createPilotRuntime } from "../src/data-access/pilotRuntime";

export default async function run() {
  const runtime = createPilotRuntime();
  const launchProjects = runtime.projectGateway.listProjectsByStage("launch_validation");

  assert.ok(launchProjects.length > 0, "expected launch projects to exist");

  const trackedProjectId = launchProjects[0].id;
  const project = runtime.projectGateway.getProject(trackedProjectId);
  const snapshot = runtime.projectGateway.getProjectRealtimeSnapshot(trackedProjectId);

  assert.equal(project.id, trackedProjectId, "project detail should use the same stable projectId");
  assert.equal(snapshot.projectId, trackedProjectId, "realtime snapshot should use the same stable projectId");

  const pendingAction = runtime.actionGateway.listActions({ approvalStatus: "pending" })[0];
  assert.ok(pendingAction, "expected at least one pending action");

  const approvedAction = runtime.actionGateway.approveAction(pendingAction.id);
  assert.equal(approvedAction.approvalStatus, "approved");
  assert.equal(approvedAction.executionStatus, "queued");

  const completedAction = runtime.actionGateway.writeExecutionResult(pendingAction.id, {
    actorId: "automation.executor",
    actorType: "automation",
    status: "completed",
    summary: "自动化执行完成并已回写结果。",
  });

  assert.equal(completedAction.executionStatus, "completed");

  const executionLogs = runtime.actionGateway.listExecutionLogs({ actionId: pendingAction.id });
  assert.ok(
    executionLogs.some((log) => log.status === "completed"),
    "expected execution logs to include the completed writeback event",
  );

  const review = runtime.knowledgeGateway.listProjectReview("pilot-launch-summer-refresh");
  assert.ok(review.review, "expected the pilot project to expose a review record");

  const publishedAsset = runtime.knowledgeGateway.publishAssetCandidate(review.candidates[0].id);
  assert.equal(publishedAsset.status, "published");
  assert.equal(publishedAsset.sourceProjectId, review.candidates[0].projectId);

  const relatedKnowledge = runtime.knowledgeGateway.searchAssets({
    stage: "launch_validation",
    assetType: "rule",
  });
  assert.ok(relatedKnowledge.length > 0, "expected filtered knowledge assets for launch validation");
}
