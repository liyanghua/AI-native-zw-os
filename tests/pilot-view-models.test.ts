import assert from "node:assert/strict";
import { createPilotRuntime } from "../src/data-access/pilotRuntime";
import { buildProjectDetailViewModel } from "../src/view-models/projectDetail";
import { buildActionCenterViewModel } from "../src/view-models/actionCenter";
import { buildReviewAssetsViewModel } from "../src/view-models/reviewAssets";
import { buildAssetLibraryViewModel } from "../src/view-models/assetLibrary";

export default async function run() {
  const runtime = createPilotRuntime();
  const project = runtime.projectGateway.getProject("pilot-launch-summer-refresh");
  const realtime = runtime.projectGateway.getProjectRealtimeSnapshot(project.id);
  const review = runtime.knowledgeGateway.listProjectReview(project.id);
  const knowledge = runtime.knowledgeGateway.searchAssets({
    sourceProjectId: project.id,
  });
  const auditTrail = runtime.lineageGateway.getActionAuditTrail(project.actions[0].id);
  const writebackRecord = runtime.lineageGateway.getExecutionWritebackRecord(project.actions[0].id);

  const detailVm = buildProjectDetailViewModel({
    project,
    realtime,
    executionLogs: runtime.actionGateway.listExecutionLogs({ projectId: project.id }),
    knowledgeAssets: knowledge,
    review,
    auditTrail,
    writebackRecord,
  });

  assert.equal(detailVm.project.id, project.id);
  assert.ok(detailVm.identitySummary.sourceCount > 0, "expected identity summary");
  assert.ok(detailVm.evidence.fact.length > 0, "expected fact evidence cards");
  assert.ok(detailVm.evidence.method.length > 0, "expected method evidence cards");
  assert.ok(detailVm.audit.entries.length > 0, "expected audit trail summary");
  assert.ok(detailVm.knowledgeHighlights.length > 0, "expected mapped knowledge highlights");
  assert.ok(
    detailVm.stageGovernance.exitCriteria.length > 0,
    "expected stage governance to expose exit criteria",
  );

  const actionVm = buildActionCenterViewModel({
    actions: runtime.actionGateway.listActions(),
    executionLogs: runtime.actionGateway.listExecutionLogs(),
    auditTrails: runtime.getSnapshot().actionAuditTrails,
  });

  assert.ok(actionVm.summary.pending > 0, "expected pending action summary");
  assert.ok(actionVm.columns.pendingApprovals.length > 0, "expected pending approvals column");
  assert.ok(
    actionVm.columns.pendingApprovals[0].idempotencyKey.length > 0,
    "expected action center to expose idempotency",
  );

  const reviewVm = buildReviewAssetsViewModel({
    reviews: runtime.getSnapshot().reviews,
    assets: runtime.getSnapshot().knowledgeAssets,
  });
  assert.ok(reviewVm.reviews[0].lineageLabel.length > 0, "expected review lineage label");
  assert.ok(reviewVm.assets[0].lineageLabel.length > 0, "expected asset lineage label");

  const assetVm = buildAssetLibraryViewModel(runtime.getSnapshot().knowledgeAssets);
  assert.ok(assetVm.groupedByStage[0].assets[0].applicabilityLabel.length > 0, "expected structured applicability labels");
}
