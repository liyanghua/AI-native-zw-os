import type {
  ActionItem,
  ApprovalStatus,
  AssetCandidate,
  AssetType,
  DecisionObject,
  ExecutionLog,
  ExecutionStatus,
  KnowledgeAssetDocument,
  LifecycleStage,
  PilotSnapshot,
  ProjectObject,
  ProjectRealtimeSnapshot,
  ProjectReviewRecord,
  PulseItem,
} from "./model";

export interface ActionListFilters {
  projectId?: string;
  actionId?: string;
  approvalStatus?: ApprovalStatus;
  executionStatus?: ExecutionStatus;
}

export interface ExecutionLogFilters {
  projectId?: string;
  actionId?: string;
}

export interface SearchAssetFilters {
  query?: string;
  stage?: LifecycleStage;
  assetType?: AssetType;
  sourceProjectId?: string;
}

export interface ExecutionWritebackInput {
  actorType: "human" | "agent" | "automation";
  actorId: string;
  status: ExecutionStatus;
  summary: string;
}

export interface ProjectGateway {
  listProjectsByStage(stage: LifecycleStage): ProjectObject[];
  getProject(projectId: string): ProjectObject;
  getProjectRealtimeSnapshot(projectId: string): ProjectRealtimeSnapshot;
  listPulseItems(audience: PulseItem["audience"], relatedProjectId?: string): PulseItem[];
}

export interface ActionGateway {
  listActions(filters?: ActionListFilters): ActionItem[];
  approveAction(actionId: string): ActionItem;
  rejectAction(actionId: string, reason?: string): ActionItem;
  writeExecutionResult(actionId: string, input: ExecutionWritebackInput): ActionItem;
  listExecutionLogs(filters?: ExecutionLogFilters): ExecutionLog[];
}

export interface KnowledgeGateway {
  searchAssets(filters?: SearchAssetFilters): KnowledgeAssetDocument[];
  getAsset(assetId: string): KnowledgeAssetDocument;
  listProjectReview(projectId: string): ProjectReviewRecord;
  publishAssetCandidate(candidateId: string): KnowledgeAssetDocument;
}

export interface DecisionGateway {
  compileDecisionObject(projectId: string): DecisionObject;
}

export interface PilotRuntime {
  readonly projectGateway: ProjectGateway;
  readonly actionGateway: ActionGateway;
  readonly knowledgeGateway: KnowledgeGateway;
  readonly decisionGateway: DecisionGateway;
  getSnapshot(): PilotSnapshot;
  refreshLiveData(): PilotSnapshot;
}
