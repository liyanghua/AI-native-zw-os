import { getLifecycleStageLabel, getProjectStatusLabel } from "../../domain/runtime/labels";
import type {
  ApiActionDto,
  ApiActionLineageItemDto,
  ApiApprovalDto,
  ApiExecutionLogDto,
  ApiExecutionResultDto,
  ApiExecutionRunDto,
  ApiAssetCandidateDto,
  ApiCompileContextResponseDto,
  ApiCompileDecisionResponseDto,
  ApiEvidenceItemDto,
  ApiKpiMetricDto,
  ApiKnowledgeAssetDto,
  ApiKnowledgeChunkDto,
  ApiKnowledgeSearchResultDto,
  ApiOpportunityDto,
  ApiProjectDetailDto,
  ApiProjectLineageResponseDto,
  ApiProjectListItemDto,
  ApiRoleDashboardResponseDto,
  ApiRoleStoryDto,
  ApiReviewDto,
  ApiRiskSignalDto,
  ApiWritebackRecordDto,
} from "../../domain/types/api";
import type {
  ActionDomain,
  ActionLineage,
  ActionItem,
  ApplicabilitySpec,
  ApprovalRecord,
  AssetCandidate,
  AssetType,
  ConfidenceLevel,
  DecisionContext,
  DecisionObject,
  EvidenceItem,
  EvidencePack,
  ExecutionLog,
  ExecutionResult,
  ExecutionRun,
  KpiMetric,
  KnowledgeAsset,
  KnowledgeChunk,
  KnowledgeSearchResult,
  LifecycleStage,
  Opportunity,
  ProjectStatus,
  RoleDashboardResponse,
  RecommendedAction,
  RiskSignal,
  RoleStory,
  RoleStoryRole,
  RoleType,
  ReviewSummary,
  RoleView,
  WritebackRecord,
} from "../../domain/types/model";
import type { QueryIssue, QueryResult } from "../../domain/types/query";
import { createQueryIssue, createQueryResult } from "../queryResult";
import type {
  LocalSandboxLifecycleOverviewData,
  LocalSandboxProjectDetailData,
  LocalSandboxProjectHeader,
  LocalSandboxProjectWorkbenchData,
  LocalSandboxProjectSnapshot,
  LocalSandboxStageBoardData,
} from "./types";

const stageRoutes: Record<LifecycleStage, string> = {
  opportunity_pool: "/opportunity-pool",
  new_product_incubation: "/new-product-incubation",
  launch_validation: "/launch-verification",
  growth_optimization: "/growth-optimization",
  legacy_upgrade: "/product-upgrade",
  review_capture: "/review-assets",
};

const defaultRoles: RoleView[] = ["ceo", "product_rd_director", "growth_director"];

function now() {
  return new Date().toISOString();
}

function toMetricLabel(metricName: string) {
  return metricName.toUpperCase();
}

function mapMetric(dto: ApiKpiMetricDto): KpiMetric {
  return {
    key: dto.metricName as KpiMetric["key"],
    label: toMetricLabel(dto.metricName),
    value: dto.metricValue,
    unit: dto.metricUnit ?? undefined,
    trend: dto.metricDirection ?? undefined,
    freshness: "batch",
  };
}

function mapRisk(dto: ApiRiskSignalDto): RiskSignal {
  return {
    riskId: dto.riskId,
    projectId: dto.projectId,
    riskType: dto.riskType,
    riskLevel: dto.riskLevel,
    description: dto.description,
    createdAt: dto.createdAt,
  };
}

function mapOpportunity(dto: ApiOpportunityDto): Opportunity {
  return {
    opportunityId: dto.opportunityId,
    projectId: dto.projectId,
    title: dto.title,
    signalType: dto.signalType,
    description: dto.description,
    priority: dto.priority,
    createdAt: dto.createdAt,
  };
}

export function mapAction(dto: ApiActionDto, stage: LifecycleStage): ActionItem {
  return {
    id: dto.actionId,
    actionId: dto.actionId,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
    projectId: dto.projectId,
    sourceProjectId: dto.projectId,
    sourceStage: stage,
    actionType: dto.actionType as ActionItem["actionType"],
    actionDomain: (dto.actionDomain ?? "operations") as ActionDomain,
    decisionId: dto.decisionId ?? `batch4-${dto.actionId}`,
    role: dto.role ?? undefined,
    actionVersion: 1,
    idempotencyKey: `local-sandbox:${dto.actionId}`,
    goal: dto.description,
    title: dto.description,
    summary: dto.description,
    description: dto.description,
    expectedImpact: dto.expectedMetric ? `关注 ${dto.expectedMetric}` : "等待 Batch 2 决策编译补充",
    risk: dto.requiredApproval ? "high" : "medium",
    owner: dto.owner,
    approvalStatus: dto.requiredApproval ? dto.approvalStatus : "not_required",
    executionMode: "manual",
    executionStatus: dto.executionStatus,
    expectedMetric: dto.expectedMetric ?? undefined,
    expectedDirection: dto.expectedDirection ?? undefined,
    confidence: dto.confidence ?? undefined,
    writebackStatus: "not_started",
    writebackAttemptCount: 0,
    validationWindow: "待补充",
    rollbackCondition: "待 Batch 2 执行回写补充",
    requiresHumanApproval: dto.requiredApproval,
    triggeredBy: "human",
  };
}

export function mapReview(dto: ApiReviewDto): ReviewSummary {
  const verdict = (dto.outcome.verdict as ReviewSummary["verdict"]) ?? "observe_more";
  const keyLearnings = Array.isArray(dto.outcome.keyLearnings)
    ? dto.outcome.keyLearnings.filter((value): value is string => typeof value === "string")
    : [];

  return {
    id: dto.reviewId,
    reviewId: dto.reviewId,
    projectId: dto.projectId,
    sourceActionId: dto.sourceActionId ?? undefined,
    sourceRunId: dto.sourceRunId ?? undefined,
    createdAt: dto.createdAt,
    updatedAt: dto.createdAt,
    verdict,
    resultSummary: dto.reviewSummary,
    summary: dto.reviewSummary,
    attributionSummary: keyLearnings.join("；") || "Batch 1 仅保留 review 占位摘要。",
    attributionFactors: [],
    lessonsLearned: keyLearnings,
    recommendations: [],
    keyOutcome: dto.keyOutcome ?? undefined,
    metricImpact: dto.metricImpact ?? undefined,
    nextSuggestion: dto.nextSuggestion ?? undefined,
  };
}

function buildApplicability(stage: LifecycleStage, type: AssetType): ApplicabilitySpec {
  return {
    stage: [stage],
    role: defaultRoles,
    assetType: [type],
    preconditions: [],
    exclusionConditions: [],
  };
}

function mapAssetCandidate(dto: ApiAssetCandidateDto, stage: LifecycleStage): AssetCandidate {
  return {
    id: dto.candidateId,
    candidateId: dto.candidateId,
    projectId: dto.projectId,
    sourceReviewId: dto.sourceReviewId ?? undefined,
    createdAt: dto.createdAt,
    updatedAt: dto.createdAt,
    type: "template",
    title: dto.title,
    rationale: "Batch 1 仅保留本地沙箱占位内容，后续由 review / asset flow 接手。",
    approvalStatus: "pending",
    applicability: buildApplicability(stage, "template"),
    contentMarkdown: dto.contentMarkdown,
    status: dto.status,
  };
}

function mapApproval(dto: ApiApprovalDto): ApprovalRecord {
  return {
    id: dto.approvalId,
    projectId: dto.projectId,
    actionId: dto.actionId,
    role: dto.role,
    approver: dto.approvedBy,
    approvedBy: dto.approvedBy,
    status: dto.approvalStatus,
    approvalStatus: dto.approvalStatus,
    reason: dto.reason ?? undefined,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}

export function mapExecutionLog(dto: ApiExecutionLogDto): ExecutionLog {
  return {
    id: dto.logId,
    projectId: dto.projectId,
    actionId: dto.actionId,
    runId: dto.runId,
    actorType: dto.logType.includes("agent") ? "agent" : dto.logType.includes("writeback") ? "automation" : "human",
    actorId: dto.logType,
    status: dto.logType.includes("completed")
      ? "completed"
      : dto.logType.includes("queued")
        ? "queued"
        : dto.logType.includes("writeback")
          ? "completed"
          : "in_progress",
    summary: dto.message,
    logType: dto.logType,
    message: dto.message,
    createdAt: dto.createdAt,
    updatedAt: dto.createdAt,
  };
}

export function mapExecutionRun(dto: ApiExecutionRunDto): ExecutionRun {
  return {
    id: dto.runId,
    runId: dto.runId,
    projectId: dto.projectId,
    actionId: dto.actionId,
    role: dto.role,
    actionDomain: dto.actionDomain,
    agentName: dto.agentName,
    connectorName: dto.connectorName,
    requestPayload: dto.requestPayload,
    responsePayload: dto.responsePayload,
    resultStatus: dto.resultStatus,
    startedAt: dto.startedAt,
    finishedAt: dto.finishedAt,
    createdAt: dto.startedAt,
    updatedAt: dto.finishedAt ?? dto.startedAt,
  };
}

export function mapExecutionResult(dto: ApiExecutionResultDto): ExecutionResult {
  return {
    actionDomain: dto.actionDomain,
    resultStatus: dto.resultStatus,
    changedMetrics: dto.changedMetrics,
    notes: dto.notes,
    riskChange: dto.riskChange,
    stageRecommendation: dto.stageRecommendation,
    productDefinitionUpdate: dto.productDefinitionUpdate,
    launchReadiness: dto.launchReadiness,
    creativeOutcome: dto.creativeOutcome,
    assetHint: dto.assetHint,
  };
}

export function mapWritebackRecord(dto: ApiWritebackRecordDto): WritebackRecord {
  return {
    id: dto.writebackId,
    writebackId: dto.writebackId,
    projectId: dto.projectId,
    actionId: dto.actionId,
    runId: dto.runId,
    targetType: dto.targetType,
    targetId: dto.targetId,
    payloadHash: dto.payloadHash,
    resultStatus: dto.resultStatus as WritebackRecord["resultStatus"],
    errorMessage: dto.errorMessage ?? undefined,
    createdAt: dto.createdAt,
    updatedAt: dto.createdAt,
  };
}

export function mapProjectLineage(dto: ApiProjectLineageResponseDto, stage: LifecycleStage) {
  const actions = dto.actions.map((item: ApiActionLineageItemDto): ActionLineage => ({
    action: mapAction(item.action, stage),
    approvals: item.approvals.map(mapApproval),
    runs: item.runs.map(mapExecutionRun),
    logs: item.logs.map(mapExecutionLog),
    latestReview: item.latestReview ? mapReview(item.latestReview) : null,
    assetCandidates: item.assetCandidates.map((candidate) => mapAssetCandidate(candidate, stage)),
  }));

  return {
    projectId: dto.projectId,
    decisionId: dto.decisionId,
    actions,
  };
}

function mapKnowledgeAsset(dto: ApiKnowledgeAssetDto): KnowledgeAsset {
  return {
    id: dto.assetId,
    assetId: dto.assetId,
    title: dto.title,
    assetType: dto.assetType,
    stage: dto.stage,
    role: dto.role,
    sourceProjectId: dto.sourceProjectId,
    applicability: dto.applicability,
    contentMarkdown: dto.contentMarkdown,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}

function mapKnowledgeChunk(dto: ApiKnowledgeChunkDto): KnowledgeChunk {
  return {
    chunkId: dto.chunkId,
    assetId: dto.assetId,
    chunkText: dto.chunkText,
    chunkIndex: dto.chunkIndex,
    keywords: dto.keywords,
    stage: dto.stage,
    role: dto.role,
    assetType: dto.assetType,
  };
}

function mapEvidenceItem(dto: ApiEvidenceItemDto): EvidenceItem {
  return {
    id: dto.id,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
    type: dto.type,
    layer: dto.layer,
    summary: dto.summary,
    sourceLabel: dto.sourceLabel,
    confidence: dto.confidence,
    relatedProjectId: dto.relatedProjectId,
    updatedAtLabel: dto.updatedAtLabel,
    applicability: dto.applicability,
  };
}

export function mapEvidencePack(dto: ApiCompileDecisionResponseDto["evidencePack"] | ApiCompileContextResponseDto["decisionContext"]["evidencePack"]): EvidencePack {
  const factEvidence = dto.factEvidence.map(mapEvidenceItem);
  const methodEvidence = dto.methodEvidence.map(mapEvidenceItem);
  return {
    factEvidence,
    methodEvidence,
    refs: dto.refs.map(mapEvidenceItem),
    summary: dto.summary,
    generatedAt: dto.generatedAt,
    retrievalTrace: dto.retrievalTrace,
    missingEvidenceFlags: dto.missingEvidenceFlags,
  };
}

export function mapKnowledgeSearchResult(dto: ApiKnowledgeSearchResultDto): KnowledgeSearchResult {
  return {
    projectId: dto.projectId,
    query: dto.query,
    matchedAssets: dto.matchedAssets.map(mapKnowledgeAsset),
    matchedChunks: dto.matchedChunks.map(mapKnowledgeChunk),
    retrievalTrace: dto.retrievalTrace,
    resultCount: dto.resultCount,
    generatedAt: dto.generatedAt,
  };
}

export function mapDecisionContext(dto: ApiCompileContextResponseDto["decisionContext"]): DecisionContext {
  return {
    id: dto.id,
    projectId: dto.projectId,
    stage: dto.stage,
    goalSpec: dto.goalSpec,
    currentStateSummary: dto.currentStateSummary,
    diagnosis: dto.diagnosis,
    evidencePack: mapEvidencePack(dto.evidencePack),
    compiledBy: dto.compiledBy,
    compilerVersion: dto.compilerVersion,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}

function mapRecommendedAction(
  dto: ApiCompileDecisionResponseDto["decisionObject"]["recommendedActions"][number],
): RecommendedAction {
  return {
    actionId: dto.actionId,
    actionType: dto.actionType as RecommendedAction["actionType"],
    description: dto.description,
    owner: dto.owner,
    dueAt: dto.dueAt,
    expectedMetric: dto.expectedMetric,
    expectedDirection: dto.expectedDirection,
    requiredApproval: dto.requiredApproval,
    rollbackHint: dto.rollbackHint,
    confidence: dto.confidence as ConfidenceLevel,
    supportingEvidenceRefs: dto.supportingEvidenceRefs,
  };
}

export function mapDecisionObject(dto: ApiCompileDecisionResponseDto["decisionObject"]): DecisionObject {
  return {
    id: dto.id,
    decisionId: dto.decisionId,
    projectId: dto.projectId,
    stage: dto.stage,
    decisionVersion: dto.decisionVersion,
    decisionContextId: dto.decisionContextId,
    goalSpec: dto.goalSpec,
    currentStateSummary: dto.currentStateSummary,
    diagnosis: dto.diagnosis,
    problemOrOpportunity: dto.problemOrOpportunity,
    rationale: dto.rationale,
    rootCauseSummary: dto.rootCauseSummary,
    options: dto.options,
    recommendedOptionId: dto.recommendedOptionId,
    recommendedActions: dto.recommendedActions.map(mapRecommendedAction),
    risks: dto.risks,
    approvalsRequired: dto.approvalsRequired,
    expectedImpact: dto.expectedImpact,
    validationPlan: dto.validationPlan,
    confidence: dto.confidence,
    requiresHumanApproval: dto.requiresHumanApproval,
    evidencePack: mapEvidencePack(dto.evidencePack),
    evidenceRefs: dto.evidenceRefs,
    pendingQuestions: dto.pendingQuestions,
    compiledAt: dto.compiledAt,
    compiledBy: dto.compiledBy,
    compilerVersion: dto.compilerVersion,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}

export function mapRoleStory(dto: ApiRoleStoryDto): RoleStory {
  return {
    role: dto.role,
    projectId: dto.projectId,
    storySummary: dto.storySummary,
    topIssues: dto.topIssues,
    keyDecisions: dto.keyDecisions,
    recommendedActions: dto.recommendedActions.map(mapRecommendedAction),
    pendingApprovals: dto.pendingApprovals,
    recentOutcomes: dto.recentOutcomes,
  };
}

export function mapRoleDashboard(dto: ApiRoleDashboardResponseDto): RoleDashboardResponse {
  return {
    role: dto.role,
    roleProfile: dto.roleProfile,
    summary: dto.summary,
    projectCards: dto.projectCards,
    decisionQueue: dto.decisionQueue,
    riskCards: dto.riskCards,
    opportunityCards: dto.opportunityCards,
    assetSummary: dto.assetSummary,
  };
}

function emptyOverviewData(): LocalSandboxLifecycleOverviewData {
  return {
    summary: {
      liveProjects: 0,
      blockedProjects: 0,
      highPriorityProjects: 0,
      closedProjects: 0,
    },
    stageCards: [
      "opportunity_pool",
      "new_product_incubation",
      "launch_validation",
      "growth_optimization",
      "review_capture",
    ].map((stage) => ({
      stage: stage as LifecycleStage,
      stageLabel: getLifecycleStageLabel(stage as LifecycleStage),
      total: 0,
      summary: "等待本地项目接入",
      link: stageRoutes[stage as LifecycleStage],
    })),
    featuredProjects: [],
    outOfScopeStage: {
      stageLabel: getLifecycleStageLabel("legacy_upgrade"),
      description: "老品升级仍保留为试点范围外页面，本批次不接 SQLite/API。",
      link: stageRoutes.legacy_upgrade,
    },
  };
}

function emptyStageData(stage: LifecycleStage): LocalSandboxStageBoardData {
  return {
    stage,
    stageLabel: getLifecycleStageLabel(stage),
    summary: {
      total: 0,
      blockedProjects: 0,
      highRiskProjects: 0,
      closedProjects: 0,
    },
    projects: [],
  };
}

function emptyProjectDetail(projectId: string): LocalSandboxProjectDetailData {
  return {
    project: {
      projectId,
      name: "项目未找到",
      stage: "launch_validation",
      stageLabel: getLifecycleStageLabel("launch_validation"),
      status: "blocked",
      statusLabel: getProjectStatusLabel("blocked"),
      owner: "未分配",
      priority: 0,
      category: "未分类",
      createdAt: now(),
      updatedAt: now(),
    },
    latestSnapshot: null,
    metrics: [],
    risks: [],
    opportunities: [],
    actions: [],
    latestReview: null,
    assetCandidates: [],
    placeholderBlocks: placeholderBlocks(),
  };
}

function mapProjectHeader(project: ApiProjectDetailDto["project"]): LocalSandboxProjectHeader {
  return {
    projectId: project.projectId,
    name: project.name,
    stage: project.stage,
    stageLabel: getLifecycleStageLabel(project.stage),
    status: project.status,
    statusLabel: getProjectStatusLabel(project.status),
    owner: project.owner,
    priority: project.priority,
    category: project.category,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  };
}

function mapSnapshot(snapshot: ApiProjectDetailDto["latestSnapshot"]): LocalSandboxProjectSnapshot | null {
  if (!snapshot) {
    return null;
  }
  return {
    snapshotId: snapshot.snapshotId,
    projectId: snapshot.projectId,
    summary: snapshot.summary,
    currentProblem: snapshot.currentProblem,
    currentGoal: snapshot.currentGoal,
    currentRisk: snapshot.currentRisk,
    createdAt: snapshot.createdAt,
  };
}

export function placeholderBlocks() {
  return [
    {
      id: "agent",
      title: "场景 Agent 与执行端",
      description: "Batch 4 已进入 mock trigger / mock connector 阶段，后续继续替换为真实执行端。",
      statusLabel: "Batch 4",
    },
    {
      id: "execution",
      title: "Review / Asset 沉淀",
      description: "当前已支持 mock writeback、review generate 和 asset candidate，后续再接完整资产治理。",
      statusLabel: "Batch 4",
    },
  ];
}

export function buildLifecycleOverviewData(projects: ApiProjectListItemDto[]): LocalSandboxLifecycleOverviewData {
  const stages: LifecycleStage[] = [
    "opportunity_pool",
    "new_product_incubation",
    "launch_validation",
    "growth_optimization",
    "review_capture",
  ];

  return {
    summary: {
      liveProjects: projects.filter((project) => project.status !== "closed").length,
      blockedProjects: projects.filter((project) => project.status === "blocked").length,
      highPriorityProjects: projects.filter((project) => project.priority >= 90).length,
      closedProjects: projects.filter((project) => project.status === "closed").length,
    },
    stageCards: stages.map((stage) => {
      const stageProjects = projects.filter((project) => project.stage === stage);
      const leading = stageProjects[0];
      return {
        stage,
        stageLabel: getLifecycleStageLabel(stage),
        total: stageProjects.length,
        summary: leading?.currentProblem || leading?.latestSnapshotSummary || "等待本地项目接入",
        link: stageRoutes[stage],
      };
    }),
    featuredProjects: [...projects]
      .sort((left, right) => right.priority - left.priority)
      .slice(0, 3)
      .map((project) => ({
        projectId: project.projectId,
        name: project.name,
        stageLabel: getLifecycleStageLabel(project.stage),
        statusLabel: getProjectStatusLabel(project.status),
        reason: project.currentProblem || "等待进一步明确当前经营问题",
        latestSummary: project.latestSnapshotSummary,
        priorityLabel: `P${project.priority}`,
      })),
    outOfScopeStage: {
      stageLabel: getLifecycleStageLabel("legacy_upgrade"),
      description: "老品升级仍保留为试点范围外页面，本批次不接 SQLite/API。",
      link: stageRoutes.legacy_upgrade,
    },
  };
}

export function buildStageBoardData(
  stage: LifecycleStage,
  projects: ApiProjectListItemDto[],
): LocalSandboxStageBoardData {
  return {
    stage,
    stageLabel: getLifecycleStageLabel(stage),
    summary: {
      total: projects.length,
      blockedProjects: projects.filter((project) => project.status === "blocked").length,
      highRiskProjects: projects.filter((project) => project.riskCount > 0).length,
      closedProjects: projects.filter((project) => project.status === "closed").length,
    },
    projects: projects.map((project) => ({
      projectId: project.projectId,
      name: project.name,
      stageLabel: getLifecycleStageLabel(project.stage),
      statusLabel: getProjectStatusLabel(project.status),
      owner: project.owner,
      priority: project.priority,
      category: project.category,
      summary: project.latestSnapshotSummary,
      currentProblem: project.currentProblem,
      currentGoal: project.currentGoal,
      currentRisk: project.currentRisk,
      riskCount: project.riskCount,
      topMetrics: project.kpiSummary.map(mapMetric),
      updatedAt: project.updatedAt,
    })),
  };
}

export function buildProjectDetailData(payload: ApiProjectDetailDto): LocalSandboxProjectDetailData {
  return {
    project: mapProjectHeader(payload.project),
    latestSnapshot: mapSnapshot(payload.latestSnapshot),
    metrics: payload.kpis.map(mapMetric),
    risks: payload.risks.map(mapRisk),
    opportunities: payload.opportunities.map(mapOpportunity),
    actions: payload.actions.map((action) => mapAction(action, payload.project.stage)),
    latestReview: payload.latestReview ? mapReview(payload.latestReview) : null,
    assetCandidates: payload.assetCandidates.map((candidate) =>
      mapAssetCandidate(candidate, payload.project.stage),
    ),
    placeholderBlocks: placeholderBlocks(),
  };
}

export function buildProjectWorkbenchData(input: {
  detail: LocalSandboxProjectDetailData;
  knowledge: KnowledgeSearchResult;
  decisionContext: DecisionContext;
  decision: {
    decisionObject: DecisionObject;
    evidencePack: EvidencePack;
  };
  roleStories: Record<RoleType, RoleStory>;
  actionLineage: {
    projectId: string;
    decisionId: string | null;
    actions: ActionLineage[];
  };
}): LocalSandboxProjectWorkbenchData {
  return {
    ...input.detail,
    knowledge: input.knowledge,
    decisionContext: input.decisionContext,
    decision: input.decision,
    roleStories: input.roleStories,
    actionLineage: input.actionLineage,
    reviews: input.actionLineage.actions
      .map((item) => item.latestReview)
      .filter((review): review is ReviewSummary => Boolean(review)),
  };
}

export function buildErrorIssues(message: string, relatedProjectId?: string): QueryIssue[] {
  return [createQueryIssue("connector_error", "error", message, relatedProjectId)];
}

export function buildOverviewErrorResult(message: string): QueryResult<LocalSandboxLifecycleOverviewData> {
  return createQueryResult({
    data: emptyOverviewData(),
    lastUpdatedAt: now(),
    issues: buildErrorIssues(message),
  });
}

export function buildStageErrorResult(
  stage: LifecycleStage,
  message: string,
): QueryResult<LocalSandboxStageBoardData> {
  return createQueryResult({
    data: emptyStageData(stage),
    lastUpdatedAt: now(),
    issues: buildErrorIssues(message),
  });
}

export function buildProjectErrorResult(
  projectId: string,
  message: string,
): QueryResult<LocalSandboxProjectDetailData> {
  return createQueryResult({
    data: emptyProjectDetail(projectId),
    lastUpdatedAt: now(),
    issues: buildErrorIssues(message, projectId),
  });
}

function emptyKnowledgeSearchResult(projectId?: string): KnowledgeSearchResult {
  return {
    projectId,
    query: "",
    matchedAssets: [],
    matchedChunks: [],
    retrievalTrace: [],
    resultCount: 0,
    generatedAt: now(),
  };
}

function emptyDecisionContext(projectId: string): DecisionContext {
  return {
    id: `decision-context-${projectId}-empty`,
    projectId,
    stage: "launch_validation",
    goalSpec: "等待编译上下文",
    currentStateSummary: "暂无编译结果",
    diagnosis: "暂无诊断",
    evidencePack: {
      factEvidence: [],
      methodEvidence: [],
      refs: [],
      generatedAt: now(),
      retrievalTrace: [],
      missingEvidenceFlags: ["Batch 2 决策上下文暂不可用"],
    },
    compiledBy: "local-brain",
    compilerVersion: "batch2-rule-engine",
    createdAt: now(),
    updatedAt: now(),
  };
}

function emptyDecisionBundle(projectId: string) {
  const evidencePack: EvidencePack = {
    factEvidence: [],
    methodEvidence: [],
    refs: [],
    generatedAt: now(),
    retrievalTrace: [],
    missingEvidenceFlags: ["Batch 2 决策对象暂不可用"],
  };

  const decisionObject: DecisionObject = {
    id: `decision-${projectId}-empty`,
    decisionId: `decision-${projectId}-empty`,
    projectId,
    stage: "launch_validation",
    decisionVersion: 0,
    decisionContextId: `decision-context-${projectId}-empty`,
    goalSpec: "等待编译决策",
    currentStateSummary: "暂无状态摘要",
    diagnosis: "暂无诊断",
    problemOrOpportunity: "暂无问题定义",
    rationale: "暂无依据",
    options: [],
    recommendedActions: [],
    risks: [],
    approvalsRequired: [],
    expectedImpact: "待编译",
    validationPlan: {
      window: "待补充",
      primaryMetric: "待补充",
      expectedDirection: "stable",
      successCriteria: [],
    },
    confidence: "low",
    requiresHumanApproval: false,
    evidencePack,
    evidenceRefs: [],
    compiledAt: now(),
    compiledBy: "local-brain",
    compilerVersion: "batch2-rule-engine",
    createdAt: now(),
    updatedAt: now(),
  };

  return {
    decisionObject,
    evidencePack,
  };
}

function emptyRoleStory(projectId: string, role: RoleStoryRole): RoleStory {
  return {
    role,
    projectId,
    storySummary: "当前角色叙事暂不可用。",
    topIssues: [],
    keyDecisions: [],
    recommendedActions: [],
    pendingApprovals: [],
    recentOutcomes: [],
  };
}

function emptyActionLineage(projectId: string) {
  return {
    projectId,
    decisionId: null,
    actions: [],
  };
}

export function buildWorkbenchErrorResult(
  projectId: string,
  detail: LocalSandboxProjectDetailData,
  partials: Partial<LocalSandboxProjectWorkbenchData>,
  issues: QueryIssue[],
) {
  return createQueryResult({
    data: {
      ...detail,
      knowledge: partials.knowledge ?? emptyKnowledgeSearchResult(projectId),
      decisionContext: partials.decisionContext ?? emptyDecisionContext(projectId),
      decision: partials.decision ?? emptyDecisionBundle(projectId),
      roleStories: partials.roleStories ?? {
        boss: emptyRoleStory(projectId, "boss"),
        operations_director: emptyRoleStory(projectId, "operations_director"),
        product_rnd_director: emptyRoleStory(projectId, "product_rnd_director"),
        visual_director: emptyRoleStory(projectId, "visual_director"),
      },
      actionLineage: partials.actionLineage ?? emptyActionLineage(projectId),
      reviews: partials.reviews ?? [],
    },
    lastUpdatedAt: detail.project.updatedAt,
    issues,
  });
}
