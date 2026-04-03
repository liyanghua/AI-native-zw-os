import type {
  ActionDomain,
  ApplicabilitySpec,
  ApprovalStatus,
  AssetType,
  ConfidenceLevel,
  ExecutionStatus,
  RoleDashboardResponse,
  KnowledgeRole,
  LifecycleStage,
  ProjectStatus,
  RoleType,
  RoleStoryRole,
  RiskLevel,
  TrendDirection,
} from "./model";

export interface ApiErrorPayload {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface ApiKpiMetricDto {
  metricId: string;
  metricName: string;
  metricValue: number;
  metricUnit?: "%" | "currency" | "count" | "score" | null;
  metricDirection?: TrendDirection | null;
  capturedAt: string;
}

export interface ApiRiskSignalDto {
  riskId: string;
  projectId: string;
  riskType: string;
  riskLevel: RiskLevel;
  description: string;
  createdAt: string;
}

export interface ApiOpportunityDto {
  opportunityId: string;
  projectId: string;
  title: string;
  signalType: string;
  description: string;
  priority: number;
  createdAt: string;
}

export interface ApiActionDto {
  actionId: string;
  projectId: string;
  decisionId?: string | null;
  role?: RoleType | null;
  actionDomain?: ActionDomain | null;
  actionType: string;
  description: string;
  owner: string;
  requiredApproval: boolean;
  approvalStatus: ApprovalStatus;
  executionStatus: ExecutionStatus;
  expectedMetric?: string | null;
  expectedDirection?: "up" | "down" | "stable" | null;
  confidence?: ConfidenceLevel | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApiReviewDto {
  reviewId: string;
  projectId: string;
  sourceActionId?: string | null;
  sourceRunId?: string | null;
  reviewSummary: string;
  keyOutcome?: string;
  metricImpact?: string;
  nextSuggestion?: string;
  outcome: Record<string, unknown>;
  createdAt: string;
}

export interface ApiAssetCandidateDto {
  candidateId: string;
  projectId: string;
  sourceReviewId?: string | null;
  title: string;
  contentMarkdown: string;
  status: string;
  createdAt: string;
}

export interface ApiApprovalDto {
  approvalId: string;
  projectId: string;
  actionId: string;
  role: RoleType;
  approvalStatus: ApprovalStatus;
  approvedBy: string;
  reason?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApiExecutionLogDto {
  logId: string;
  projectId: string;
  actionId: string;
  runId: string;
  logType: string;
  message: string;
  createdAt: string;
}

export interface ApiExecutionRunDto {
  runId: string;
  projectId: string;
  actionId: string;
  role: RoleType;
  actionDomain: ActionDomain;
  agentName: string;
  connectorName: string;
  requestPayload: Record<string, unknown>;
  responsePayload?: Record<string, unknown> | null;
  resultStatus: ExecutionStatus;
  startedAt: string;
  finishedAt?: string | null;
}

export interface ApiWritebackRecordDto {
  writebackId: string;
  projectId: string;
  actionId: string;
  runId: string;
  targetType: string;
  targetId: string;
  payloadHash: string;
  resultStatus: string;
  errorMessage?: string | null;
  createdAt: string;
}

export interface ApiExecutionMetricChangeDto {
  metricName: string;
  previousValue: number;
  newValue: number;
  metricUnit?: string;
}

export interface ApiExecutionResultDto {
  actionDomain: ActionDomain;
  resultStatus: ExecutionStatus;
  changedMetrics: ApiExecutionMetricChangeDto[];
  notes: string[];
  riskChange?: string;
  stageRecommendation?: string;
  productDefinitionUpdate?: string;
  launchReadiness?: string;
  creativeOutcome?: string;
  assetHint?: string;
}

export interface ApiProjectSnapshotDto {
  snapshotId: string;
  projectId: string;
  summary: string;
  currentProblem: string;
  currentGoal: string;
  currentRisk: string;
  createdAt: string;
}

export interface ApiProjectListItemDto {
  projectId: string;
  name: string;
  stage: LifecycleStage;
  status: ProjectStatus;
  owner: string;
  priority: number;
  category: string;
  latestSnapshotSummary: string;
  currentProblem: string;
  currentGoal: string;
  currentRisk: string;
  kpiSummary: ApiKpiMetricDto[];
  riskCount: number;
  updatedAt: string;
}

export interface ApiProjectListResponseDto {
  projects: ApiProjectListItemDto[];
}

export interface ApiProjectDetailDto {
  project: {
    projectId: string;
    name: string;
    stage: LifecycleStage;
    status: ProjectStatus;
    owner: string;
    priority: number;
    category: string;
    createdAt: string;
    updatedAt: string;
  };
  latestSnapshot: ApiProjectSnapshotDto | null;
  kpis: ApiKpiMetricDto[];
  risks: ApiRiskSignalDto[];
  opportunities: ApiOpportunityDto[];
  actions: ApiActionDto[];
  latestReview: ApiReviewDto | null;
  assetCandidates: ApiAssetCandidateDto[];
}

export interface ApiActionLineageItemDto {
  action: ApiActionDto;
  approvals: ApiApprovalDto[];
  runs: ApiExecutionRunDto[];
  logs: ApiExecutionLogDto[];
  latestReview: ApiReviewDto | null;
  assetCandidates: ApiAssetCandidateDto[];
}

export interface ApiProjectLineageResponseDto {
  projectId: string;
  decisionId: string | null;
  actions: ApiActionLineageItemDto[];
}

export interface ApiKnowledgeAssetDto {
  assetId: string;
  title: string;
  assetType: AssetType;
  stage: LifecycleStage;
  role: KnowledgeRole;
  sourceProjectId?: string;
  applicability: ApplicabilitySpec;
  contentMarkdown: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiKnowledgeChunkDto {
  chunkId: string;
  assetId: string;
  chunkText: string;
  chunkIndex: number;
  keywords: string[];
  stage: LifecycleStage;
  role: KnowledgeRole;
  assetType: AssetType;
}

export interface ApiEvidenceItemDto {
  id: string;
  createdAt: string;
  updatedAt: string;
  type:
    | "metric"
    | "history"
    | "case"
    | "rule"
    | "template"
    | "sop"
    | "evaluation_sample"
    | "skill"
    | "agent_observation"
    | "user_feedback"
    | "competitive_scan";
  layer: "fact" | "method";
  summary: string;
  sourceLabel?: string;
  confidence?: ConfidenceLevel;
  relatedProjectId?: string;
  updatedAtLabel?: string;
  applicability?: ApplicabilitySpec;
}

export interface ApiEvidencePackDto {
  factEvidence: ApiEvidenceItemDto[];
  methodEvidence: ApiEvidenceItemDto[];
  refs: ApiEvidenceItemDto[];
  summary?: string;
  generatedAt: string;
  retrievalTrace: string[];
  missingEvidenceFlags: string[];
}

export interface ApiRecommendedActionDto {
  actionId: string;
  actionType: string;
  description: string;
  owner: string;
  dueAt: string;
  expectedMetric: string;
  expectedDirection: "up" | "down" | "stable";
  requiredApproval: boolean;
  rollbackHint?: string;
  confidence: ConfidenceLevel;
  supportingEvidenceRefs: string[];
}

export interface ApiValidationPlanDto {
  window: string;
  primaryMetric: string;
  expectedDirection: "up" | "down" | "stable";
  successCriteria: string[];
  rollbackHint?: string;
}

export interface ApiKnowledgeSearchResultDto {
  projectId?: string;
  query: string;
  matchedAssets: ApiKnowledgeAssetDto[];
  matchedChunks: ApiKnowledgeChunkDto[];
  retrievalTrace: string[];
  resultCount: number;
  generatedAt: string;
}

export interface ApiDecisionContextDto {
  id: string;
  projectId: string;
  stage: LifecycleStage;
  goalSpec: string;
  currentStateSummary: string;
  diagnosis: string;
  evidencePack: ApiEvidencePackDto;
  compiledBy: string;
  compilerVersion: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiDecisionObjectDto {
  id: string;
  decisionId: string;
  projectId: string;
  stage: LifecycleStage;
  decisionVersion: number;
  decisionContextId: string;
  goalSpec: string;
  currentStateSummary: string;
  diagnosis: string;
  problemOrOpportunity: string;
  rationale: string;
  rootCauseSummary?: string;
  options: Array<{
    id: string;
    title: string;
    summary: string;
    expectedImpact: string;
    risk: RiskLevel;
    resourcesNeeded: string;
    validationWindow: string;
    autoExecutable: boolean;
    constraints?: string[];
  }>;
  recommendedOptionId?: string;
  recommendedActions: ApiRecommendedActionDto[];
  risks: string[];
  approvalsRequired: string[];
  expectedImpact: string;
  validationPlan: ApiValidationPlanDto;
  confidence: ConfidenceLevel;
  requiresHumanApproval: boolean;
  evidencePack: ApiEvidencePackDto;
  evidenceRefs: string[];
  pendingQuestions?: string[];
  compiledAt: string;
  compiledBy: string;
  compilerVersion: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiRoleStoryDto {
  role: RoleType;
  projectId: string;
  storySummary: string;
  topIssues: string[];
  keyDecisions: string[];
  recommendedActions: ApiRecommendedActionDto[];
  pendingApprovals: string[];
  recentOutcomes: string[];
}

export interface ApiKnowledgeSearchRequestDto {
  projectId?: string;
  query?: string;
  stage?: LifecycleStage;
  role?: RoleType;
  assetTypes?: AssetType[];
  sourceProjectId?: string;
  applicability?: Partial<ApplicabilitySpec>;
}

export interface ApiProjectKnowledgeResponseDto extends ApiKnowledgeSearchResultDto {}

export interface ApiCompileContextRequestDto {
  projectId: string;
}

export interface ApiCompileContextResponseDto {
  decisionContext: ApiDecisionContextDto;
  projectSnapshot: ApiProjectSnapshotDto | null;
  kpiSummary: ApiKpiMetricDto[];
  risks: ApiRiskSignalDto[];
  opportunities: ApiOpportunityDto[];
  matchedKnowledge: ApiKnowledgeSearchResultDto;
  missingEvidenceFlags: string[];
}

export interface ApiCompileDecisionRequestDto {
  projectId: string;
}

export interface ApiCompileDecisionResponseDto {
  decisionObject: ApiDecisionObjectDto;
  evidencePack: ApiEvidencePackDto;
}

export interface ApiCompileRoleStoryRequestDto {
  projectId: string;
  role: RoleType | "director";
}

export interface ApiCompileRoleStoryResponseDto {
  roleStory: ApiRoleStoryDto;
}

export interface ApiApproveActionRequestDto {
  approvedBy: string;
  reason?: string;
}

export interface ApiApproveActionResponseDto {
  action: ApiActionDto;
  approval: ApiApprovalDto;
}

export interface ApiRejectActionRequestDto extends ApiApproveActionRequestDto {}

export interface ApiRejectActionResponseDto extends ApiApproveActionResponseDto {}

export interface ApiAgentTriggerRequestDto {
  projectId: string;
  actionId: string;
}

export interface ApiAgentTriggerResponseDto {
  action: ApiActionDto;
  run: ApiExecutionRunDto;
  latestLog: ApiExecutionLogDto;
}

export interface ApiMockRunRequestDto {
  projectId: string;
  actionId: string;
  runId: string;
}

export interface ApiMockRunResponseDto {
  run: ApiExecutionRunDto;
  executionResult: ApiExecutionResultDto;
  latestLog: ApiExecutionLogDto;
}

export interface ApiWritebackResponseDto {
  action: ApiActionDto;
  updatedProjectSnapshot: ApiProjectSnapshotDto | null;
  updatedKpis: ApiKpiMetricDto[];
  writebackRecord: ApiWritebackRecordDto;
  latestLog: ApiExecutionLogDto;
}

export interface ApiGenerateReviewRequestDto {
  projectId: string;
  actionId: string;
  runId: string;
}

export interface ApiGenerateReviewResponseDto {
  review: ApiReviewDto;
}

export interface ApiPublishAssetCandidateRequestDto {
  projectId: string;
  reviewId: string;
}

export interface ApiPublishAssetCandidateResponseDto {
  assetCandidate: ApiAssetCandidateDto;
}

export type ApiRoleProfileDto = RoleDashboardResponse["roleProfile"];

export type ApiRoleProjectCardDto = RoleDashboardResponse["projectCards"][number];

export type ApiRoleDecisionQueueItemDto = RoleDashboardResponse["decisionQueue"][number];

export type ApiRoleRiskCardDto = RoleDashboardResponse["riskCards"][number];

export type ApiRoleOpportunityCardDto = RoleDashboardResponse["opportunityCards"][number];

export type ApiRoleAssetSummaryCardDto = RoleDashboardResponse["assetSummary"][number];

export type ApiRoleDashboardSummaryDto = RoleDashboardResponse["summary"];

export interface ApiRoleDashboardResponseDto {
  role: RoleType;
  roleProfile: ApiRoleProfileDto;
  summary: ApiRoleDashboardSummaryDto;
  projectCards: ApiRoleProjectCardDto[];
  decisionQueue: ApiRoleDecisionQueueItemDto[];
  riskCards: ApiRoleRiskCardDto[];
  opportunityCards: ApiRoleOpportunityCardDto[];
  assetSummary: ApiRoleAssetSummaryCardDto[];
}
