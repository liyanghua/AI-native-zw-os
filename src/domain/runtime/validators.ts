import {
  agentStatuses,
  agentTypes,
  approvalStatuses,
  assetPublishStatuses,
  assetTypes,
  confidenceLevels,
  decisionModes,
  executionModes,
  executionStatuses,
  identityConflictStatuses,
  lifecycleStages,
  projectHealthLevels,
  projectStatuses,
  projectTypes,
  reviewVerdicts,
  riskLevels,
  roleViews,
  signalFreshnessValues,
  writebackStatuses,
} from "./constants";
import type {
  ActionAuditTrail,
  ActionItem,
  DecisionContext,
  DecisionObject,
  ExecutionLog,
  ExecutionWritebackRecord,
  HumanInTheLoopPolicy,
  IdentityResolutionLog,
  KnowledgeAssetDocument,
  PilotSnapshot,
  ProjectIdentity,
  ProjectObject,
  ProjectRealtimeSnapshot,
  ProjectReviewRecord,
  PulseItem,
  ReviewLineage,
  ReviewSummary,
} from "../types/model";

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function assertEnum(value: string | undefined, allowed: string[], label: string) {
  invariant(Boolean(value), `${label} is required`);
  invariant(allowed.includes(value as string), `${label} must be one of ${allowed.join(", ")}`);
}

function assertString(value: unknown, label: string) {
  invariant(typeof value === "string" && value.length > 0, `${label} must be a non-empty string`);
}

function assertOptionalString(value: unknown, label: string) {
  if (value === undefined) return;
  assertString(value, label);
}

function assertNumber(value: unknown, label: string) {
  invariant(typeof value === "number" && Number.isFinite(value), `${label} must be a finite number`);
}

function assertArray(value: unknown, label: string) {
  invariant(Array.isArray(value), `${label} must be an array`);
}

function assertEntityMeta(entity: { id: string; createdAt: string; updatedAt: string }, label: string) {
  assertString(entity.id, `${label}.id`);
  assertString(entity.createdAt, `${label}.createdAt`);
  assertString(entity.updatedAt, `${label}.updatedAt`);
}

function assertApplicability(applicability: {
  stage: string[];
  role: string[];
  assetType: string[];
  preconditions: string[];
  exclusionConditions: string[];
}, label: string) {
  assertArray(applicability.stage, `${label}.stage`);
  applicability.stage.forEach((stage) => assertEnum(stage, lifecycleStages, `${label}.stage[]`));
  assertArray(applicability.role, `${label}.role`);
  applicability.role.forEach((role) => assertEnum(role, roleViews, `${label}.role[]`));
  assertArray(applicability.assetType, `${label}.assetType`);
  applicability.assetType.forEach((assetType) => assertEnum(assetType, assetTypes, `${label}.assetType[]`));
  assertArray(applicability.preconditions, `${label}.preconditions`);
  assertArray(applicability.exclusionConditions, `${label}.exclusionConditions`);
}

function assertEvidencePack(
  evidencePack: {
    factEvidence: unknown[];
    methodEvidence: unknown[];
    refs: unknown[];
    generatedAt: string;
    retrievalTrace: unknown[];
    missingEvidenceFlags: unknown[];
  },
  label: string,
) {
  assertArray(evidencePack.factEvidence, `${label}.factEvidence`);
  assertArray(evidencePack.methodEvidence, `${label}.methodEvidence`);
  assertArray(evidencePack.refs, `${label}.refs`);
  assertString(evidencePack.generatedAt, `${label}.generatedAt`);
  assertArray(evidencePack.retrievalTrace, `${label}.retrievalTrace`);
  assertArray(evidencePack.missingEvidenceFlags, `${label}.missingEvidenceFlags`);
}

export function assertProjectIdentity(identity: ProjectIdentity) {
  assertEntityMeta(identity, "ProjectIdentity");
  assertString(identity.projectId, "ProjectIdentity.projectId");
  assertNumber(identity.identityVersion, "ProjectIdentity.identityVersion");
  assertArray(identity.sourceRefs, "ProjectIdentity.sourceRefs");
  assertEnum(identity.confidence, confidenceLevels, "ProjectIdentity.confidence");
  assertString(identity.resolvedBy, "ProjectIdentity.resolvedBy");
  assertString(identity.resolvedAt, "ProjectIdentity.resolvedAt");
  assertEnum(identity.conflictStatus, identityConflictStatuses, "ProjectIdentity.conflictStatus");
}

export function assertIdentityResolutionLog(log: IdentityResolutionLog) {
  assertEntityMeta(log, "IdentityResolutionLog");
  assertString(log.projectId, "IdentityResolutionLog.projectId");
  assertString(log.previousResolution, "IdentityResolutionLog.previousResolution");
  assertString(log.newResolution, "IdentityResolutionLog.newResolution");
  assertString(log.reason, "IdentityResolutionLog.reason");
  assertString(log.operator, "IdentityResolutionLog.operator");
}

export function assertActionItem(action: ActionItem) {
  assertEntityMeta(action, "ActionItem");
  assertString(action.sourceProjectId, "ActionItem.sourceProjectId");
  assertEnum(action.sourceStage, lifecycleStages, "ActionItem.sourceStage");
  assertString(action.actionType, "ActionItem.actionType");
  assertString(action.decisionId, "ActionItem.decisionId");
  assertNumber(action.actionVersion, "ActionItem.actionVersion");
  assertString(action.idempotencyKey, "ActionItem.idempotencyKey");
  assertString(action.title, "ActionItem.title");
  assertString(action.summary, "ActionItem.summary");
  assertEnum(action.risk, riskLevels, "ActionItem.risk");
  assertEnum(action.approvalStatus, approvalStatuses, "ActionItem.approvalStatus");
  assertEnum(action.executionMode, executionModes, "ActionItem.executionMode");
  assertEnum(action.executionStatus, executionStatuses, "ActionItem.executionStatus");
  assertEnum(action.writebackStatus, writebackStatuses, "ActionItem.writebackStatus");
  assertNumber(action.writebackAttemptCount, "ActionItem.writebackAttemptCount");
  assertOptionalString(action.lastWritebackError, "ActionItem.lastWritebackError");
}

export function assertActionAuditTrail(trail: ActionAuditTrail) {
  assertString(trail.actionId, "ActionAuditTrail.actionId");
  assertArray(trail.entries, "ActionAuditTrail.entries");
  trail.entries.forEach((entry) => {
    assertEntityMeta(entry, "ActionAuditEntry");
    assertString(entry.actionId, "ActionAuditEntry.actionId");
    assertString(entry.eventType, "ActionAuditEntry.eventType");
    assertString(entry.actorId, "ActionAuditEntry.actorId");
    assertString(entry.summary, "ActionAuditEntry.summary");
  });
}

export function assertExecutionLog(log: ExecutionLog) {
  assertEntityMeta(log, "ExecutionLog");
  assertString(log.actionId, "ExecutionLog.actionId");
  assertEnum(log.status, executionStatuses, "ExecutionLog.status");
  assertString(log.summary, "ExecutionLog.summary");
}

export function assertExecutionWritebackRecord(record: ExecutionWritebackRecord) {
  assertEntityMeta(record, "ExecutionWritebackRecord");
  assertString(record.writebackId, "ExecutionWritebackRecord.writebackId");
  assertString(record.actionId, "ExecutionWritebackRecord.actionId");
  assertString(record.idempotencyKey, "ExecutionWritebackRecord.idempotencyKey");
  assertString(record.targetSystem, "ExecutionWritebackRecord.targetSystem");
  assertString(record.targetObjectId, "ExecutionWritebackRecord.targetObjectId");
  assertString(record.payloadHash, "ExecutionWritebackRecord.payloadHash");
  assertEnum(record.resultStatus, writebackStatuses, "ExecutionWritebackRecord.resultStatus");
  assertNumber(record.attemptCount, "ExecutionWritebackRecord.attemptCount");
  assertOptionalString(record.errorMessage, "ExecutionWritebackRecord.errorMessage");
}

export function assertDecisionContext(context: DecisionContext) {
  assertEntityMeta(context, "DecisionContext");
  assertString(context.projectId, "DecisionContext.projectId");
  assertEnum(context.stage, lifecycleStages, "DecisionContext.stage");
  assertString(context.goalSpec, "DecisionContext.goalSpec");
  assertString(context.currentStateSummary, "DecisionContext.currentStateSummary");
  assertString(context.diagnosis, "DecisionContext.diagnosis");
  assertEvidencePack(context.evidencePack, "DecisionContext.evidencePack");
  assertString(context.compiledBy, "DecisionContext.compiledBy");
  assertString(context.compilerVersion, "DecisionContext.compilerVersion");
}

export function assertDecisionObject(decision: DecisionObject) {
  assertEntityMeta(decision, "DecisionObject");
  assertString(decision.projectId, "DecisionObject.projectId");
  assertEnum(decision.stage, lifecycleStages, "DecisionObject.stage");
  assertNumber(decision.decisionVersion, "DecisionObject.decisionVersion");
  assertString(decision.decisionContextId, "DecisionObject.decisionContextId");
  assertString(decision.goalSpec, "DecisionObject.goalSpec");
  assertString(decision.currentStateSummary, "DecisionObject.currentStateSummary");
  assertString(decision.diagnosis, "DecisionObject.diagnosis");
  assertEnum(decision.confidence, confidenceLevels, "DecisionObject.confidence");
  assertArray(decision.options, "DecisionObject.options");
  assertArray(decision.recommendedActions, "DecisionObject.recommendedActions");
  assertArray(decision.risks, "DecisionObject.risks");
  assertArray(decision.approvalsRequired, "DecisionObject.approvalsRequired");
  assertString(decision.expectedImpact, "DecisionObject.expectedImpact");
  assertArray(decision.evidenceRefs, "DecisionObject.evidenceRefs");
  assertEvidencePack(decision.evidencePack, "DecisionObject.evidencePack");
  assertString(decision.compiledAt, "DecisionObject.compiledAt");
  assertString(decision.compiledBy, "DecisionObject.compiledBy");
  assertString(decision.compilerVersion, "DecisionObject.compilerVersion");
}

export function assertProjectRealtimeSnapshot(snapshot: ProjectRealtimeSnapshot) {
  assertString(snapshot.projectId, "ProjectRealtimeSnapshot.projectId");
  assertEnum(snapshot.status, projectStatuses, "ProjectRealtimeSnapshot.status");
  assertEnum(snapshot.health, projectHealthLevels, "ProjectRealtimeSnapshot.health");
  assertEnum(snapshot.riskLevel, riskLevels, "ProjectRealtimeSnapshot.riskLevel");
  assertNumber(snapshot.pendingApprovalCount, "ProjectRealtimeSnapshot.pendingApprovalCount");
  assertNumber(snapshot.runningAgentCount, "ProjectRealtimeSnapshot.runningAgentCount");
  assertNumber(snapshot.criticalExceptionCount, "ProjectRealtimeSnapshot.criticalExceptionCount");
  assertString(snapshot.updatedAt, "ProjectRealtimeSnapshot.updatedAt");
  assertArray(snapshot.kpis.metrics, "ProjectRealtimeSnapshot.kpis.metrics");
}

export function assertReviewSummary(review: ReviewSummary) {
  assertEntityMeta(review, "ReviewSummary");
  assertString(review.projectId, "ReviewSummary.projectId");
  assertEnum(review.verdict, reviewVerdicts, "ReviewSummary.verdict");
  assertArray(review.attributionFactors, "ReviewSummary.attributionFactors");
  assertArray(review.lessonsLearned, "ReviewSummary.lessonsLearned");
  assertArray(review.recommendations, "ReviewSummary.recommendations");
}

export function assertReviewLineage(lineage: ReviewLineage) {
  assertString(lineage.reviewId, "ReviewLineage.reviewId");
  assertString(lineage.projectId, "ReviewLineage.projectId");
  assertArray(lineage.sourceDecisionIds, "ReviewLineage.sourceDecisionIds");
  assertArray(lineage.sourceActionIds, "ReviewLineage.sourceActionIds");
  assertArray(lineage.sourceExecutionLogIds, "ReviewLineage.sourceExecutionLogIds");
  assertString(lineage.generatedAt, "ReviewLineage.generatedAt");
}

export function assertHumanInLoopPolicy(policy: HumanInTheLoopPolicy) {
  assertEntityMeta(policy, "HumanInTheLoopPolicy");
  assertString(policy.actionType, "HumanInTheLoopPolicy.actionType");
  assertEnum(policy.decisionMode, decisionModes, "HumanInTheLoopPolicy.decisionMode");
  assertArray(policy.triggerConditions, "HumanInTheLoopPolicy.triggerConditions");
  assertEnum(policy.riskLevel, riskLevels, "HumanInTheLoopPolicy.riskLevel");
  assertString(policy.fallbackPolicy, "HumanInTheLoopPolicy.fallbackPolicy");
}

export function assertKnowledgeAssetDocument(asset: KnowledgeAssetDocument) {
  assertEntityMeta(asset, "KnowledgeAssetDocument");
  assertEnum(asset.type, assetTypes, "KnowledgeAssetDocument.type");
  assertEnum(asset.assetType, assetTypes, "KnowledgeAssetDocument.assetType");
  assertEnum(asset.stage, lifecycleStages, "KnowledgeAssetDocument.stage");
  assertEnum(asset.status, assetPublishStatuses, "KnowledgeAssetDocument.status");
  assertString(asset.title, "KnowledgeAssetDocument.title");
  assertString(asset.summary, "KnowledgeAssetDocument.summary");
  assertString(asset.sourceInfo, "KnowledgeAssetDocument.sourceInfo");
  assertApplicability(asset.applicability, "KnowledgeAssetDocument.applicability");
}

export function assertProjectReviewRecord(record: ProjectReviewRecord) {
  assertString(record.projectId, "ProjectReviewRecord.projectId");
  assertArray(record.candidates, "ProjectReviewRecord.candidates");
  assertArray(record.publishedAssets, "ProjectReviewRecord.publishedAssets");
  record.review && assertReviewSummary(record.review);
  record.lineage && assertReviewLineage(record.lineage);
  record.candidates.forEach((candidate) => {
    assertEntityMeta(candidate, "AssetCandidate");
    assertEnum(candidate.type, assetTypes, "AssetCandidate.type");
    assertEnum(candidate.approvalStatus, approvalStatuses, "AssetCandidate.approvalStatus");
    assertApplicability(candidate.applicability, "AssetCandidate.applicability");
  });
}

export function assertPulseItem(item: PulseItem) {
  assertEntityMeta(item, "PulseItem");
  assertEnum(item.audience, roleViews, "PulseItem.audience");
  assertEnum(item.freshness, signalFreshnessValues, "PulseItem.freshness");
  assertString(item.summary, "PulseItem.summary");
  if (item.severity) {
    assertEnum(item.severity, riskLevels, "PulseItem.severity");
  }
}

export function assertProjectObject(project: ProjectObject) {
  assertEntityMeta(project, "ProjectObject");
  assertEnum(project.type, projectTypes, "ProjectObject.type");
  assertEnum(project.stage, lifecycleStages, "ProjectObject.stage");
  assertEnum(project.status, projectStatuses, "ProjectObject.status");
  assertEnum(project.health, projectHealthLevels, "ProjectObject.health");
  assertEnum(project.riskLevel, riskLevels, "ProjectObject.riskLevel");
  assertArray(project.stakeholders, "ProjectObject.stakeholders");
  assertProjectIdentity(project.identity);
  assertArray(project.stageExitCriteria, "ProjectObject.stageExitCriteria");
  assertArray(project.availableTransitions, "ProjectObject.availableTransitions");
  assertArray(project.allowedActionsByStage, "ProjectObject.allowedActionsByStage");
  assertArray(project.actions, "ProjectObject.actions");
  assertArray(project.agentStates, "ProjectObject.agentStates");
  project.actions.forEach(assertActionItem);
  project.decisionContext && assertDecisionContext(project.decisionContext);
  project.decisionObject && assertDecisionObject(project.decisionObject);
  project.review && assertReviewSummary(project.review);
  project.reviewLineage && assertReviewLineage(project.reviewLineage);
  project.publishedAssets?.forEach((asset) => {
    assertEnum(asset.type, assetTypes, "ProjectObject.publishedAssets.type");
    assertEnum(asset.status, assetPublishStatuses, "ProjectObject.publishedAssets.status");
  });
  project.agentStates.forEach((agent) => {
    assertEntityMeta(agent, "ProjectObject.agentState");
    assertEnum(agent.agentType, agentTypes, "ProjectObject.agentState.agentType");
    assertEnum(agent.status, agentStatuses, "ProjectObject.agentState.status");
  });
}

export function assertPilotSnapshot(snapshot: PilotSnapshot) {
  assertArray(snapshot.projects, "PilotSnapshot.projects");
  assertArray(snapshot.identities, "PilotSnapshot.identities");
  assertArray(snapshot.identityResolutionLogs, "PilotSnapshot.identityResolutionLogs");
  assertArray(snapshot.transitionRules, "PilotSnapshot.transitionRules");
  assertArray(snapshot.realtimeSnapshots, "PilotSnapshot.realtimeSnapshots");
  assertArray(snapshot.pulses, "PilotSnapshot.pulses");
  assertArray(snapshot.exceptions, "PilotSnapshot.exceptions");
  assertArray(snapshot.liveFeed, "PilotSnapshot.liveFeed");
  assertArray(snapshot.knowledgeAssets, "PilotSnapshot.knowledgeAssets");
  assertArray(snapshot.reviews, "PilotSnapshot.reviews");
  assertArray(snapshot.actionAuditTrails, "PilotSnapshot.actionAuditTrails");
  assertArray(snapshot.executionWritebackRecords, "PilotSnapshot.executionWritebackRecords");
  assertArray(snapshot.hitlPolicies, "PilotSnapshot.hitlPolicies");
  assertArray(snapshot.assetLineages, "PilotSnapshot.assetLineages");
  snapshot.projects.forEach(assertProjectObject);
  snapshot.identities.forEach(assertProjectIdentity);
  snapshot.identityResolutionLogs.forEach(assertIdentityResolutionLog);
  snapshot.realtimeSnapshots.forEach(assertProjectRealtimeSnapshot);
  snapshot.pulses.forEach(assertPulseItem);
  snapshot.knowledgeAssets.forEach(assertKnowledgeAssetDocument);
  snapshot.reviews.forEach(assertProjectReviewRecord);
  snapshot.actionAuditTrails.forEach(assertActionAuditTrail);
  snapshot.executionWritebackRecords.forEach(assertExecutionWritebackRecord);
  snapshot.hitlPolicies.forEach(assertHumanInLoopPolicy);
}
