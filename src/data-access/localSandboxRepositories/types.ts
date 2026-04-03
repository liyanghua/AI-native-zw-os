import type {
  ActionCenterResponse,
  ActionLineage,
  ActionItem,
  AssetLibraryResponse,
  AssetCandidate,
  DecisionContext,
  DecisionObject,
  EvidencePack,
  ConnectorRegistryItem,
  EvaluationSummary,
  ExecutionLog,
  ExecutionResult,
  ExecutionRun,
  KpiMetric,
  ProjectGovernanceSummary,
  ProjectBridgeSummary,
  ProjectOntologyReferences,
  KnowledgeSearchResult,
  LifecycleStage,
  OntologyLineage,
  OntologyRegistryItem,
  OntologyVersionRecord,
  Opportunity,
  ProjectRuntimeSummary,
  ProjectStatus,
  RetryRecord,
  ReviewCenterResponse,
  RiskSignal,
  RoleDashboardResponse,
  RoleStory,
  RoleType,
  ReviewSummary,
  SourceAdapter,
  SyncRecord,
  TaskRun,
  WorkflowRun,
  RuntimeEvent,
  EvalCase,
  EvalHarnessSummary,
  EvalResult,
  EvalRun,
  EvalSuite,
  GateDecision,
  WritebackRecord,
} from "../../domain/types/model";

export interface LocalSandboxLifecycleSummary {
  liveProjects: number;
  blockedProjects: number;
  highPriorityProjects: number;
  closedProjects: number;
}

export interface LocalSandboxStageCard {
  stage: LifecycleStage;
  stageLabel: string;
  total: number;
  summary: string;
  link: string;
}

export interface LocalSandboxFeaturedProject {
  projectId: string;
  name: string;
  stageLabel: string;
  statusLabel: string;
  reason: string;
  latestSummary: string;
  priorityLabel: string;
}

export interface LocalSandboxLifecycleOverviewData {
  summary: LocalSandboxLifecycleSummary;
  stageCards: LocalSandboxStageCard[];
  featuredProjects: LocalSandboxFeaturedProject[];
  outOfScopeStage: {
    stageLabel: string;
    description: string;
    link: string;
  };
}

export interface LocalSandboxStageBoardProject {
  projectId: string;
  name: string;
  stageLabel: string;
  statusLabel: string;
  owner: string;
  priority: number;
  category: string;
  summary: string;
  currentProblem: string;
  currentGoal: string;
  currentRisk: string;
  riskCount: number;
  topMetrics: KpiMetric[];
  updatedAt: string;
}

export interface LocalSandboxStageBoardData {
  stage: LifecycleStage;
  stageLabel: string;
  summary: {
    total: number;
    blockedProjects: number;
    highRiskProjects: number;
    closedProjects: number;
  };
  projects: LocalSandboxStageBoardProject[];
}

export interface LocalSandboxProjectHeader {
  projectId: string;
  name: string;
  stage: LifecycleStage;
  stageLabel: string;
  status: ProjectStatus;
  statusLabel: string;
  owner: string;
  priority: number;
  category: string;
  createdAt: string;
  updatedAt: string;
}

export interface LocalSandboxProjectSnapshot {
  snapshotId: string;
  projectId: string;
  summary: string;
  currentProblem: string;
  currentGoal: string;
  currentRisk: string;
  createdAt: string;
}

export interface LocalSandboxPlaceholderBlock {
  id: string;
  title: string;
  description: string;
  statusLabel: string;
}

export interface LocalSandboxProjectDetailData {
  project: LocalSandboxProjectHeader;
  latestSnapshot: LocalSandboxProjectSnapshot | null;
  metrics: KpiMetric[];
  risks: RiskSignal[];
  opportunities: Opportunity[];
  actions: ActionItem[];
  latestReview: ReviewSummary | null;
  assetCandidates: AssetCandidate[];
  placeholderBlocks: LocalSandboxPlaceholderBlock[];
}

export interface LocalSandboxProjectWorkbenchData extends LocalSandboxProjectDetailData {
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
  reviews: ReviewSummary[];
  governance: ProjectGovernanceSummary;
  runtime: ProjectRuntimeSummary;
  eval: EvalHarnessSummary;
  ontology: ProjectOntologyReferences;
  bridge: ProjectBridgeSummary;
}

export type LocalSandboxRoleDashboardData = RoleDashboardResponse;
export type LocalSandboxActionCenterData = ActionCenterResponse;
export type LocalSandboxReviewCenterData = ReviewCenterResponse;
export type LocalSandboxAssetLibraryData = AssetLibraryResponse;

export interface LocalSandboxAgentTriggerData {
  action: ActionItem;
  run: ExecutionRun;
  latestLog: ExecutionLog;
}

export interface LocalSandboxMockRunData {
  run: ExecutionRun;
  executionResult: ExecutionResult;
  latestLog: ExecutionLog;
}

export interface LocalSandboxWritebackData {
  action: ActionItem;
  updatedProjectSnapshot: LocalSandboxProjectSnapshot | null;
  updatedKpis: KpiMetric[];
  writebackRecord: WritebackRecord;
  latestLog: ExecutionLog;
}

export interface LocalSandboxEvaluationData {
  records: Array<{
    evaluationId: string;
    projectId: string;
    evaluationType: string;
    relatedObjectType: string;
    relatedObjectId: string;
    score: number;
    notes: string;
    createdAt: string;
  }>;
  summary: EvaluationSummary;
}

export interface LocalSandboxRuntimeListData {
  workflows: WorkflowRun[];
  filters: {
    projectId: string | null;
    actionId: string | null;
    status: string | null;
  };
}

export interface LocalSandboxRuntimeWorkflowDetailData {
  workflow: WorkflowRun;
  tasks: TaskRun[];
  events: RuntimeEvent[];
  retryRecords: RetryRecord[];
}

export interface LocalSandboxEvalCenterData {
  cases: EvalCase[];
  suites: EvalSuite[];
  runs: EvalRun[];
  latestGateDecision: GateDecision | null;
}

export interface LocalSandboxOntologyRegistryData {
  items: OntologyRegistryItem[];
  filters: {
    itemType: string | null;
    status: string | null;
  };
}

export interface LocalSandboxOntologyRegistryDetailData {
  item: OntologyRegistryItem;
  latestPayload: Record<string, unknown>;
  versions: OntologyVersionRecord[];
  lineageReferences: OntologyLineage[];
}

export interface LocalSandboxBridgeDiagnosticsData {
  adapters: SourceAdapter[];
  connectors: ConnectorRegistryItem[];
}

export interface LocalSandboxBridgeSyncRecordsData {
  records: SyncRecord[];
  filters: {
    adapterId: string | null;
  };
}
