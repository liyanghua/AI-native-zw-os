import assert from "node:assert/strict";
import { createPilotRuntime } from "../src/data-access/pilotRuntime";
import { buildProjectDetailViewModel } from "../src/view-models/projectDetail";
import { buildActionCenterViewModel } from "../src/view-models/actionCenter";

export default async function run() {
  const runtime = createPilotRuntime();
  const project = runtime.projectGateway.getProject("pilot-launch-summer-refresh");
  const realtime = runtime.projectGateway.getProjectRealtimeSnapshot(project.id);
  const review = runtime.knowledgeGateway.listProjectReview(project.id);
  const knowledge = runtime.knowledgeGateway.searchAssets({
    sourceProjectId: project.id,
  });

  const detailVm = buildProjectDetailViewModel({
    project,
    realtime,
    executionLogs: runtime.actionGateway.listExecutionLogs({ projectId: project.id }),
    knowledgeAssets: knowledge,
    review,
  });

  assert.equal(detailVm.project.id, project.id);
  assert.ok(detailVm.decisionEvidence.length > 0, "expected mapped evidence cards");
  assert.ok(detailVm.knowledgeHighlights.length > 0, "expected mapped knowledge highlights");

  const actionVm = buildActionCenterViewModel({
    actions: runtime.actionGateway.listActions(),
    executionLogs: runtime.actionGateway.listExecutionLogs(),
  });

  assert.ok(actionVm.summary.pending > 0, "expected pending action summary");
  assert.ok(actionVm.columns.pendingApprovals.length > 0, "expected pending approvals column");
}
