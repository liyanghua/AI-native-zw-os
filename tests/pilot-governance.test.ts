import assert from "node:assert/strict";
import { createPilotRuntime } from "../src/data-access/pilotRuntime";

export default async function run() {
  const runtime = createPilotRuntime();
  const projectId = "pilot-launch-summer-refresh";

  const identity = runtime.identityGateway.getProjectIdentity(projectId);
  assert.equal(identity.projectId, projectId);
  assert.ok(identity.sourceRefs.length >= 3, "expected unified source refs for the same project");

  const resolvedIdentity = runtime.identityGateway.resolveProjectIdentity({
    sourceSystem: "launch_dashboard",
    sourceObjectType: "project",
    sourceObjectId: "launch-summer-refresh",
    externalKey: "LAUNCH_SUMMER_REFRESH",
  });
  assert.equal(resolvedIdentity.projectId, projectId, "expected source object to resolve to the same projectId");

  const conflictLogs = runtime.identityGateway.listIdentityResolutionLogs("pilot-opp-urban-lite");
  assert.ok(conflictLogs.length > 0, "expected visible identity resolution logs for conflicted pilot projects");

  const decisionContext = runtime.decisionGateway.compileDecisionContext(projectId);
  assert.ok(decisionContext.evidencePack.factEvidence.length > 0, "expected fact evidence");
  assert.ok(decisionContext.evidencePack.methodEvidence.length > 0, "expected method evidence");
  assert.ok(
    Array.isArray(decisionContext.evidencePack.missingEvidenceFlags),
    "expected decision context to expose missing evidence flags",
  );

  const decisionObject = runtime.decisionGateway.compileDecisionObject(projectId);
  assert.ok(decisionObject.recommendedActions.length > 0, "expected executable recommended actions");
  assert.ok(decisionObject.evidenceRefs.length > 0, "expected decision object to point at evidence refs");

  const pendingAction = runtime.actionGateway.listActions({
    projectId,
    approvalStatus: "pending",
  })[0];
  assert.ok(pendingAction, "expected a pending action on the launch project");

  assert.throws(
    () => runtime.projectGateway.transitionProjectStage(projectId, "growth_optimization", "未完成验证前不允许推进"),
    /exit criteria|transition/i,
    "expected invalid stage transition to be blocked before execution writeback",
  );

  runtime.actionGateway.approveAction(pendingAction.id);
  runtime.actionGateway.writeExecutionResult(pendingAction.id, {
    actorId: "execution.adapter",
    actorType: "automation",
    status: "completed",
    summary: "执行端已完成价格实验回写。",
    idempotencyKey: "launch-price-adjustment-v1",
    targetSystem: "pricing_engine",
    targetObjectId: "price-exp-249",
  });
  runtime.actionGateway.writeExecutionResult(pendingAction.id, {
    actorId: "execution.adapter",
    actorType: "automation",
    status: "completed",
    summary: "执行端重复上报同一批写回结果。",
    idempotencyKey: "launch-price-adjustment-v1",
    targetSystem: "pricing_engine",
    targetObjectId: "price-exp-249",
  });

  const writebackRecord = runtime.lineageGateway.getExecutionWritebackRecord(pendingAction.id);
  assert.ok(writebackRecord, "expected writeback record");
  assert.equal(writebackRecord.attemptCount, 2, "expected idempotent duplicate writes to accumulate attempts");

  const auditTrail = runtime.lineageGateway.getActionAuditTrail(pendingAction.id);
  assert.ok(auditTrail.entries.length >= 3, "expected audit trail for approval + writeback");

  const transitionedProject = runtime.projectGateway.transitionProjectStage(
    projectId,
    "growth_optimization",
    "首发验证完成，进入增长优化",
  );
  assert.equal(transitionedProject.stage, "growth_optimization");

  const reviewRecord = runtime.knowledgeGateway.listProjectReview(projectId);
  assert.ok(reviewRecord.review, "expected project review to exist after writeback");

  const reviewLineage = runtime.lineageGateway.getReviewLineage(reviewRecord.review?.id ?? "");
  assert.ok(reviewLineage, "expected review lineage");
  assert.ok(
    reviewLineage?.sourceActionIds.includes(pendingAction.id),
    "expected review lineage to point back to the executed action",
  );

  const publishedAsset = runtime.knowledgeGateway.publishAssetCandidate(reviewRecord.candidates[0].id);
  const assetLineage = runtime.lineageGateway.getAssetLineage(publishedAsset.id);
  assert.ok(assetLineage, "expected asset lineage");
  assert.equal(assetLineage?.sourceProjectId, projectId);

  const applicableAssets = runtime.knowledgeGateway.searchAssets({
    stage: "launch_validation",
    role: "growth_director",
    businessGoal: "提升首发转化",
  });
  assert.ok(applicableAssets.length > 0, "expected structured applicability filters to work");
}
