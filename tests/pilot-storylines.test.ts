import assert from "node:assert/strict";
import { createPilotRuntime } from "../src/data-access/pilotRuntime";
import { buildRoleDashboardViewModel } from "../src/view-models/dashboards";

export default async function run() {
  const runtime = createPilotRuntime();
  const projectId = "pilot-launch-summer-refresh";
  const pendingAction = runtime.actionGateway.listActions({
    projectId,
    approvalStatus: "pending",
  })[0];

  assert.ok(pendingAction, "expected a pending approval in the launch storyline");

  const ceoBefore = buildRoleDashboardViewModel("ceo", runtime.getSnapshot());
  assert.ok(ceoBefore.summary.pendingApprovals > 0, "expected the boss dashboard to show pending approvals");

  const compiledDecision = runtime.decisionGateway.compileDecisionObject(projectId);
  assert.equal(compiledDecision.confidence, "high", "expected the operating brain to recompile a high-confidence decision");
  assert.ok(compiledDecision.evidencePack.refs.length > 0, "expected compiled decisions to carry evidence");

  runtime.actionGateway.approveAction(pendingAction.id);
  const ceoAfterApproval = buildRoleDashboardViewModel("ceo", runtime.getSnapshot());
  assert.equal(
    ceoAfterApproval.summary.pendingApprovals,
    ceoBefore.summary.pendingApprovals - 1,
    "expected the boss storyline to reflect approval progress",
  );

  runtime.actionGateway.writeExecutionResult(pendingAction.id, {
    actorId: "scenario-agent.launch-optimizer",
    actorType: "agent",
    status: "completed",
    summary: "场景 Agent 已联动执行端完成调价实验并回写结果。",
  });

  const growthDashboard = buildRoleDashboardViewModel("growth_director", runtime.getSnapshot());
  const growthFocusProject = growthDashboard.focusProjects.find((project) => project.id === projectId);
  assert.ok(growthFocusProject, "expected the director storyline to keep tracking the same launch project");
  assert.match(
    growthFocusProject.latestPulse,
    /回写结果|调价实验/,
    "expected the director storyline to show execution writeback in the focus project pulse",
  );

  const reviewRecord = runtime.knowledgeGateway.listProjectReview(projectId);
  assert.ok(
    reviewRecord.candidates.some((candidate) => candidate.title.includes("回写模板")),
    "expected execution writeback to create a review asset candidate",
  );

  const publishedAsset = runtime.knowledgeGateway.publishAssetCandidate(reviewRecord.candidates[0].id);
  assert.equal(publishedAsset.status, "published");

  const ceoAfterAsset = buildRoleDashboardViewModel("ceo", runtime.getSnapshot());
  assert.equal(
    ceoAfterAsset.summary.publishedAssets,
    ceoBefore.summary.publishedAssets + 1,
    "expected boss dashboard to see the newly published asset in the closed loop",
  );
}
