import type {
  ActionAuditTrail,
  ActionItem,
  ApprovalStatus,
  AssetLineage,
  AssetType,
  DecisionContext,
  DecisionObject,
  ExecutionLog,
  ExecutionStatus,
  ExecutionWritebackRecord,
  HumanInTheLoopPolicy,
  IdentityResolutionLog,
  KnowledgeAssetDocument,
  LifecycleStage,
  PilotSnapshot,
  ProjectIdentity,
  ProjectObject,
  ProjectRealtimeSnapshot,
  ProjectReviewRecord,
  PulseItem,
  ReviewLineage,
  RoleView,
  SourceObjectRef,
  SourceObjectType,
  SourceSystem,
  WritebackStatus,
} from "./model";

export interface ActionListFilters {
  projectId?: string;
  actionId?: string;
  approvalStatus?: ApprovalStatus;
  executionStatus?: ExecutionStatus;
  writebackStatus?: WritebackStatus;
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
  role?: RoleView;
  channel?: string;
  category?: string;
  businessGoal?: string;
}

export interface ExecutionWritebackInput {
  actorType: "human" | "agent" | "automation";
  actorId: string;
  status: ExecutionStatus;
  summary: string;
  idempotencyKey?: string;
  targetSystem?: string;
  targetObjectId?: string;
  errorMessage?: string;
}

export interface ResolveProjectIdentityInput {
  sourceSystem: SourceSystem;
  sourceObjectType: SourceObjectType;
  sourceObjectId: string;
  externalKey?: string;
}

export interface ProjectGateway {
  listProjectsByStage(stage: LifecycleStage): ProjectObject[];
  getProject(projectId: string): ProjectObject;
  getProjectRealtimeSnapshot(projectId: string): ProjectRealtimeSnapshot;
  listPulseItems(audience: PulseItem["audience"], relatedProjectId?: string): PulseItem[];
  transitionProjectStage(projectId: string, nextStage: LifecycleStage, reason: string): ProjectObject;
}

export interface IdentityGateway {
  resolveProjectIdentity(input: ResolveProjectIdentityInput): ProjectIdentity;
  getProjectIdentity(projectId: string): ProjectIdentity;
  listSourceObjectRefs(projectId: string): SourceObjectRef[];
  listIdentityResolutionLogs(projectId?: string): IdentityResolutionLog[];
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
  compileDecisionContext(projectId: string): DecisionContext;
  compileDecisionObject(projectId: string): DecisionObject;
  getDecisionObject(projectId: string): DecisionObject;
}

export interface LineageGateway {
  getActionAuditTrail(actionId: string): ActionAuditTrail;
  getExecutionWritebackRecord(actionId: string): ExecutionWritebackRecord | null;
  getReviewLineage(reviewId: string): ReviewLineage | null;
  getAssetLineage(assetId: string): AssetLineage | null;
}

export interface PolicyGateway {
  listHumanInTheLoopPolicies(): HumanInTheLoopPolicy[];
}

export interface PilotRuntime {
  readonly projectGateway: ProjectGateway;
  readonly identityGateway: IdentityGateway;
  readonly actionGateway: ActionGateway;
  readonly knowledgeGateway: KnowledgeGateway;
  readonly decisionGateway: DecisionGateway;
  readonly lineageGateway: LineageGateway;
  readonly policyGateway: PolicyGateway;
  getSnapshot(): PilotSnapshot;
  refreshLiveData(): PilotSnapshot;
}
