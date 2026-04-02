import {
  agentStatuses,
  agentTypes,
  approvalStatuses,
  assetPublishStatuses,
  assetTypes,
  confidenceLevels,
  executionModes,
  executionStatuses,
  lifecycleStages,
  projectHealthLevels,
  projectTypes,
  reviewVerdicts,
  riskLevels,
  roleViews,
  signalFreshnessValues,
} from "./constants";
import type {
  ActionItem,
  DecisionObject,
  ExecutionLog,
  KnowledgeAssetDocument,
  PilotSnapshot,
  ProjectObject,
  ProjectRealtimeSnapshot,
  ProjectReviewRecord,
  PulseItem,
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

export function assertActionItem(action: ActionItem) {
  assertEntityMeta(action, "ActionItem");
  assertString(action.sourceProjectId, "ActionItem.sourceProjectId");
  assertEnum(action.sourceStage, lifecycleStages, "ActionItem.sourceStage");
  assertString(action.title, "ActionItem.title");
  assertString(action.summary, "ActionItem.summary");
  assertEnum(action.risk, riskLevels, "ActionItem.risk");
  assertEnum(action.approvalStatus, approvalStatuses, "ActionItem.approvalStatus");
  assertEnum(action.executionMode, executionModes, "ActionItem.executionMode");
  assertEnum(action.executionStatus, executionStatuses, "ActionItem.executionStatus");
}

export function assertExecutionLog(log: ExecutionLog) {
  assertEntityMeta(log, "ExecutionLog");
  assertString(log.actionId, "ExecutionLog.actionId");
  assertEnum(log.status, executionStatuses, "ExecutionLog.status");
  assertString(log.summary, "ExecutionLog.summary");
}

export function assertDecisionObject(decision: DecisionObject) {
  assertEntityMeta(decision, "DecisionObject");
  assertString(decision.projectId, "DecisionObject.projectId");
  assertEnum(decision.stage, lifecycleStages, "DecisionObject.stage");
  assertEnum(decision.confidence, confidenceLevels, "DecisionObject.confidence");
  assertArray(decision.options, "DecisionObject.options");
  assertArray(decision.evidencePack.refs, "DecisionObject.evidencePack.refs");
}

export function assertProjectRealtimeSnapshot(snapshot: ProjectRealtimeSnapshot) {
  assertString(snapshot.projectId, "ProjectRealtimeSnapshot.projectId");
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

export function assertKnowledgeAssetDocument(asset: KnowledgeAssetDocument) {
  assertEntityMeta(asset, "KnowledgeAssetDocument");
  assertEnum(asset.type, assetTypes, "KnowledgeAssetDocument.type");
  assertEnum(asset.assetType, assetTypes, "KnowledgeAssetDocument.assetType");
  assertEnum(asset.stage, lifecycleStages, "KnowledgeAssetDocument.stage");
  assertEnum(asset.status, assetPublishStatuses, "KnowledgeAssetDocument.status");
  assertString(asset.title, "KnowledgeAssetDocument.title");
  assertString(asset.summary, "KnowledgeAssetDocument.summary");
  assertString(asset.sourceInfo, "KnowledgeAssetDocument.sourceInfo");
}

export function assertProjectReviewRecord(record: ProjectReviewRecord) {
  assertString(record.projectId, "ProjectReviewRecord.projectId");
  assertArray(record.candidates, "ProjectReviewRecord.candidates");
  assertArray(record.publishedAssets, "ProjectReviewRecord.publishedAssets");
  record.review && assertReviewSummary(record.review);
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
  assertEnum(project.health, projectHealthLevels, "ProjectObject.health");
  assertEnum(project.riskLevel, riskLevels, "ProjectObject.riskLevel");
  assertArray(project.stakeholders, "ProjectObject.stakeholders");
  assertArray(project.actions, "ProjectObject.actions");
  assertArray(project.agentStates, "ProjectObject.agentStates");
  project.actions.forEach(assertActionItem);
  project.decisionObject && assertDecisionObject(project.decisionObject);
  project.review && assertReviewSummary(project.review);
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
  assertArray(snapshot.realtimeSnapshots, "PilotSnapshot.realtimeSnapshots");
  assertArray(snapshot.pulses, "PilotSnapshot.pulses");
  assertArray(snapshot.exceptions, "PilotSnapshot.exceptions");
  assertArray(snapshot.liveFeed, "PilotSnapshot.liveFeed");
  assertArray(snapshot.knowledgeAssets, "PilotSnapshot.knowledgeAssets");
  assertArray(snapshot.reviews, "PilotSnapshot.reviews");
  snapshot.projects.forEach(assertProjectObject);
  snapshot.realtimeSnapshots.forEach(assertProjectRealtimeSnapshot);
  snapshot.pulses.forEach(assertPulseItem);
  snapshot.knowledgeAssets.forEach(assertKnowledgeAssetDocument);
  snapshot.reviews.forEach(assertProjectReviewRecord);
}
