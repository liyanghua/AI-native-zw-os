export type LifecycleStage =
  | "opportunity_pool"
  | "new_product_incubation"
  | "launch_validation"
  | "growth_optimization"
  | "legacy_upgrade"
  | "review_capture";

export type ProjectStage = LifecycleStage;

export type ProjectType =
  | "opportunity_project"
  | "new_product_project"
  | "growth_optimization_project"
  | "legacy_upgrade_project";

export type RoleView =
  | "ceo"
  | "product_rd_director"
  | "growth_director"
  | "visual_director";

export type RoleType =
  | "boss"
  | "operations_director"
  | "product_rnd_director"
  | "visual_director";

export type DirectorArchetype =
  | "operations"
  | "product_rnd"
  | "visual";

export type ProjectHealth =
  | "healthy"
  | "watch"
  | "at_risk"
  | "critical";

export type ProjectStatus =
  | "active"
  | "awaiting_approval"
  | "blocked"
  | "executing"
  | "reviewing"
  | "closed";

export type RiskLevel =
  | "low"
  | "medium"
  | "high"
  | "critical";

export type TrendDirection = "up" | "flat" | "down";

export type ConfidenceLevel = "low" | "medium" | "high";

export type ApprovalStatus =
  | "not_required"
  | "pending"
  | "approved"
  | "rejected"
  | "expired";

export type ExecutionMode = "manual" | "agent" | "automation";

export type ActionDomain =
  | "operations"
  | "product_rnd"
  | "visual";

export type ExecutionStatus =
  | "suggested"
  | "queued"
  | "in_progress"
  | "completed"
  | "rolled_back"
  | "failed"
  | "canceled";

export type WritebackStatus =
  | "not_started"
  | "pending"
  | "succeeded"
  | "failed"
  | "duplicate_ignored";

export type DecisionMode =
  | "auto"
  | "suggest"
  | "require_approval"
  | "blocked";

export type IdentityConflictStatus =
  | "healthy"
  | "conflicted"
  | "manually_resolved";

export type IdentityResolutionPolicy =
  | "source_key_match"
  | "composite_match"
  | "manual_override";

export type SourceSystem =
  | "opportunity_signal_hub"
  | "definition_center"
  | "launch_dashboard"
  | "growth_console"
  | "approval_center"
  | "review_asset_hub";

export type ActionType =
  | "project_initiation"
  | "price_adjustment"
  | "visual_refresh"
  | "inventory_restock"
  | "budget_reallocation"
  | "price_confirmation"
  | "review_publish"
  | "adjust_launch_plan"
  | "increase_campaign_support"
  | "pause_low_roi_action"
  | "push_stage_transition"
  | "initiate_sampling"
  | "refine_product_definition"
  | "promote_to_launch_validation"
  | "pause_product_direction"
  | "refresh_main_visual"
  | "iterate_video_asset"
  | "revise_detail_page"
  | "support_launch_creative";

export type SourceObjectType =
  | "project"
  | "signal"
  | "definition"
  | "performance_snapshot"
  | "action"
  | "review"
  | "asset";

export type AgentType =
  | "opportunity"
  | "new_product"
  | "diagnosis"
  | "content"
  | "visual"
  | "execution"
  | "upgrade"
  | "review_capture"
  | "governance"
  | "data_observer";

export type AgentStatus =
  | "idle"
  | "running"
  | "waiting_human"
  | "blocked"
  | "failed"
  | "completed";

export type ReviewVerdict =
  | "success"
  | "partial_success"
  | "failed"
  | "observe_more";

export type AssetType =
  | "case"
  | "rule"
  | "template"
  | "skill"
  | "sop"
  | "evaluation_sample";

export type RoleStoryRole = RoleType;
export type KnowledgeRole = RoleType | "all";

export type SignalFreshness =
  | "real_time"
  | "near_real_time"
  | "batch";

export type PolicyEnforcementMode =
  | "hard_block"
  | "approval_required"
  | "warn_only";

export type AssetPublishStatus =
  | "draft"
  | "published"
  | "deprecated";

export type ReviewStatus =
  | "draft"
  | "generated"
  | "approved"
  | "archived";

export type ReviewType =
  | "execution_review"
  | "product_review"
  | "creative_review"
  | "governance_review";

export type KnowledgeFeedbackStatus = "not_started" | "synced";

export interface EntityMeta {
  id: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface PersonRef {
  id: string;
  name: string;
  role:
    | "ceo"
    | "product_rd_director"
    | "growth_director"
    | "visual_director"
    | "operator"
    | "designer"
    | "analyst"
    | "agent";
}

export interface KPIMetric {
  key:
    | "gmv"
    | "ctr"
    | "cvr"
    | "roi"
    | "add_to_cart_rate"
    | "launch_score"
    | "profit"
    | "impressions"
    | "clicks"
    | "orders"
    | "conversion_count";
  label: string;
  value: number;
  unit?: "%" | "currency" | "count" | "score";
  trend?: TrendDirection;
  deltaVsTarget?: number;
  deltaVsPrevious?: number;
  freshness?: SignalFreshness;
}

export interface KPISet {
  metrics: KPIMetric[];
  updatedAt: string;
}

export type KpiMetric = KPIMetric;

export interface ApplicabilitySpec {
  stage: LifecycleStage[];
  role: RoleView[];
  assetType: AssetType[];
  channel?: string;
  category?: string;
  businessGoal?: string;
  priceBand?: string;
  lifecycle?: string;
  preconditions: string[];
  exclusionConditions: string[];
}

export interface EvidenceRef extends EntityMeta {
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

export type EvidenceItem = EvidenceRef;

export interface EvidencePack {
  factEvidence: EvidenceRef[];
  methodEvidence: EvidenceRef[];
  refs: EvidenceRef[];
  summary?: string;
  generatedAt: string;
  retrievalTrace: string[];
  missingEvidenceFlags: string[];
}

export interface DecisionOption {
  id: string;
  title: string;
  summary: string;
  expectedImpact: string;
  risk: RiskLevel;
  resourcesNeeded: string;
  validationWindow: string;
  autoExecutable: boolean;
  constraints?: string[];
}

export interface ValidationPlan {
  window: string;
  primaryMetric: string;
  expectedDirection: "up" | "down" | "stable";
  successCriteria: string[];
  rollbackHint?: string;
}

export interface RecommendedAction {
  actionId: string;
  actionType: ActionType;
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

export interface DecisionContext extends EntityMeta {
  projectId: string;
  stage: LifecycleStage;
  goalSpec: string;
  currentStateSummary: string;
  diagnosis: string;
  evidencePack: EvidencePack;
  compiledBy: string;
  compilerVersion: string;
}

export interface DecisionObject extends EntityMeta {
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
  options: DecisionOption[];
  recommendedOptionId?: string;
  recommendedActions: RecommendedAction[];
  risks: string[];
  approvalsRequired: string[];
  expectedImpact: string;
  validationPlan: ValidationPlan;
  confidence: ConfidenceLevel;
  requiresHumanApproval: boolean;
  evidencePack: EvidencePack;
  evidenceRefs: string[];
  pendingQuestions?: string[];
  compiledAt: string;
  compiledBy: string;
  compilerVersion: string;
}

export interface OpportunitySignal {
  id: string;
  type:
    | "trend"
    | "competitor_gap"
    | "demand_cluster"
    | "price_band_gap"
    | "style_opportunity";
  summary: string;
  strength: number;
  freshness: SignalFreshness;
}

export interface OpportunityAssessment {
  businessValueScore: number;
  feasibilityScore: number;
  expressionPotentialScore: number;
  confidence: ConfidenceLevel;
  recommendation: "ignore" | "observe" | "evaluate" | "initiate";
}

export interface Opportunity {
  opportunityId: string;
  projectId: string;
  title: string;
  signalType: string;
  description: string;
  priority: number;
  createdAt: string;
}

export interface RiskSignal {
  riskId: string;
  projectId: string;
  riskType: string;
  riskLevel: RiskLevel;
  description: string;
  createdAt: string;
}

export interface ProductDefinition extends EntityMeta {
  projectId: string;
  positioning: string;
  targetAudience: string;
  keySellingPoints: string[];
  priceBand: string;
  specsSummary: string;
  materialOrCraftSummary?: string;
  versionStrategy?: string;
  feasibilityRisk: RiskLevel;
  samplingStatus:
    | "not_started"
    | "in_progress"
    | "ready_for_review"
    | "approved";
  blockingIssues?: string[];
}

export interface SamplingReview extends EntityMeta {
  projectId: string;
  summary: string;
  feasibilityVerdict: "pass" | "revise" | "fail";
  costRisk: RiskLevel;
  craftRisk: RiskLevel;
  leadTimeRisk: RiskLevel;
  massProductionRisk: RiskLevel;
  expressionReadinessRisk: RiskLevel;
}

export interface CreativeVersion extends EntityMeta {
  projectId: string;
  name: string;
  type:
    | "hero_image"
    | "detail_page"
    | "campaign_page"
    | "video_cover"
    | "content_asset";
  status:
    | "draft"
    | "testing"
    | "selected"
    | "retired";
  performanceSummary?: string;
  brandConsistencyScore?: number;
}

export interface ExpressionPlan extends EntityMeta {
  projectId: string;
  contentBrief?: string;
  visualBrief?: string;
  readinessStatus:
    | "not_started"
    | "in_progress"
    | "ready"
    | "launched";
  creativeVersions: CreativeVersion[];
  recommendedDirection?: string;
}

export interface SourceObjectRef {
  sourceSystem: SourceSystem;
  sourceObjectType: SourceObjectType;
  sourceObjectId: string;
  externalKey?: string;
  firstSeenAt: string;
  lastSeenAt: string;
}

export interface ProjectIdentity extends EntityMeta {
  projectId: string;
  identityVersion: number;
  sourceRefs: SourceObjectRef[];
  confidence: ConfidenceLevel;
  resolvedBy: string;
  resolvedAt: string;
  resolutionPolicy: IdentityResolutionPolicy;
  conflictStatus: IdentityConflictStatus;
}

export interface IdentityResolutionLog extends EntityMeta {
  projectId: string;
  previousResolution: string;
  newResolution: string;
  reason: string;
  operator: string;
}

export interface StageExitCriteria {
  id: string;
  stage: LifecycleStage;
  label: string;
  description: string;
  status: "passed" | "failed" | "pending";
  blocking: boolean;
}

export interface TransitionRule {
  id: string;
  fromStage: LifecycleStage;
  toStage: LifecycleStage;
  description: string;
  exitCriteriaIds: string[];
  allowRollback: boolean;
}

export interface AllowedActionByStage {
  stage: LifecycleStage;
  actionType: ActionType;
  decisionMode: DecisionMode;
  requiresApproval: boolean;
}

export interface ApprovalRecord extends EntityMeta {
  projectId?: string;
  actionId: string;
  role?: RoleType;
  approver: string;
  status: ApprovalStatus;
  reason?: string;
  approvalStatus?: ApprovalStatus;
  approvedBy?: string;
}

export interface ExecutionLog extends EntityMeta {
  projectId?: string;
  actionId: string;
  runId?: string;
  actorType: "human" | "agent" | "automation";
  actorId: string;
  status: ExecutionStatus;
  summary: string;
  logType?: string;
  message?: string;
}

export interface ActionItem extends EntityMeta {
  actionId?: string;
  projectId?: string;
  sourceProjectId: string;
  sourceStage: LifecycleStage;
  actionDomain?: ActionDomain;
  actionType: ActionType;
  decisionId: string;
  role?: RoleType;
  actionVersion: number;
  idempotencyKey: string;
  goal: string;
  title: string;
  summary: string;
  description?: string;
  expectedImpact: string;
  risk: RiskLevel;
  owner: string;
  approvalStatus: ApprovalStatus;
  executionMode: ExecutionMode;
  executionStatus: ExecutionStatus;
  expectedMetric?: string;
  expectedDirection?: "up" | "down" | "stable";
  confidence?: ConfidenceLevel;
  writebackStatus: WritebackStatus;
  writebackAttemptCount: number;
  lastWritebackError?: string;
  validationWindow?: string;
  rollbackCondition?: string;
  requiresHumanApproval: boolean;
  triggeredBy:
    | "human"
    | "decision_brain"
    | "scenario_agent"
    | "automation_rule";
}

export interface ActionAuditEntry extends EntityMeta {
  actionId: string;
  eventType:
    | "created"
    | "approval_requested"
    | "approved"
    | "rejected"
    | "writeback_requested"
    | "writeback_succeeded"
    | "writeback_failed"
    | "duplicate_writeback"
    | "stage_transition";
  actorType: "human" | "agent" | "automation" | "system";
  actorId: string;
  summary: string;
}

export interface ActionAuditTrail {
  actionId: string;
  entries: ActionAuditEntry[];
}

export interface ExecutionWritebackRecord extends EntityMeta {
  writebackId: string;
  actionId: string;
  idempotencyKey: string;
  targetSystem: string;
  targetObjectId: string;
  payloadHash: string;
  resultStatus: WritebackStatus;
  errorMessage?: string;
  attemptCount: number;
}

export interface WritebackRecord extends EntityMeta {
  writebackId: string;
  projectId: string;
  actionId: string;
  runId: string;
  targetType: string;
  targetId: string;
  payloadHash: string;
  resultStatus: WritebackStatus;
  errorMessage?: string;
}

export interface ExecutionRun extends EntityMeta {
  runId: string;
  projectId: string;
  actionId: string;
  role: RoleType;
  actionDomain: ActionDomain;
  agentName: string;
  connectorName: string;
  resultStatus: ExecutionStatus;
  requestPayload: Record<string, unknown>;
  responsePayload?: Record<string, unknown> | null;
  startedAt: string;
  finishedAt?: string | null;
}

export interface ExecutionMetricChange {
  metricName: string;
  previousValue: number;
  newValue: number;
  metricUnit?: string;
}

export interface ExecutionResult {
  actionDomain: ActionDomain;
  resultStatus: ExecutionStatus;
  changedMetrics: ExecutionMetricChange[];
  notes: string[];
  riskChange?: string;
  stageRecommendation?: string;
  productDefinitionUpdate?: string;
  launchReadiness?: string;
  creativeOutcome?: string;
  assetHint?: string;
}

export interface WritebackResult {
  action: ActionItem;
  updatedProjectSnapshot: {
    snapshotId: string;
    projectId: string;
    summary: string;
    currentProblem: string;
    currentGoal: string;
    currentRisk: string;
    createdAt: string;
  } | null;
  updatedKpis: KpiMetric[];
  writebackRecord: WritebackRecord;
  latestLog: ExecutionLog;
}

export interface AgentTriggerRequest {
  projectId: string;
  actionId: string;
}

export interface AgentTriggerResponse {
  action: ActionItem;
  run: ExecutionRun;
  latestLog: ExecutionLog;
}

export interface AgentState extends EntityMeta {
  projectId?: string;
  agentType: AgentType;
  status: AgentStatus;
  summary: string;
  waitingReason?: string;
  lastActionSummary?: string;
}

export interface ExceptionItem extends EntityMeta {
  projectId?: string;
  source:
    | "approval_timeout"
    | "agent_failure"
    | "data_anomaly"
    | "policy_violation"
    | "low_confidence_decision"
    | "rollback_event";
  severity: RiskLevel;
  summary: string;
  requiresHumanIntervention: boolean;
}

export interface PolicyBoundary {
  id: string;
  label: string;
  description: string;
  appliesTo:
    | "pricing"
    | "launch"
    | "campaign"
    | "visual"
    | "approval"
    | "automation";
  enforcementMode: PolicyEnforcementMode;
}

export interface HumanInTheLoopPolicy extends EntityMeta {
  actionType: ActionType;
  decisionMode: DecisionMode;
  triggerConditions: string[];
  riskLevel: RiskLevel;
  fallbackPolicy: string;
}

export interface AttributionFactor {
  id: string;
  category:
    | "product_definition"
    | "sampling"
    | "content"
    | "visual"
    | "campaign"
    | "timing"
    | "supply"
    | "agent_execution";
  summary: string;
  impactLevel: "low" | "medium" | "high";
  controllable: boolean;
}

export interface ReviewSummary extends EntityMeta {
  reviewId?: string;
  projectId: string;
  sourceActionId?: string;
  sourceRunId?: string;
  verdict: ReviewVerdict;
  resultSummary: string;
  summary?: string;
  attributionSummary: string;
  attributionFactors: AttributionFactor[];
  lessonsLearned: string[];
  recommendations: string[];
  keyOutcome?: string;
  metricImpact?: string;
  nextSuggestion?: string;
  reviewStatus?: ReviewStatus;
  reviewType?: ReviewType;
  reviewQualityScore?: number;
  isPromotedToAsset?: boolean;
}

export interface ReviewLineage {
  reviewId: string;
  projectId: string;
  sourceDecisionIds: string[];
  sourceActionIds: string[];
  sourceExecutionLogIds: string[];
  generatedAt: string;
}

export interface AssetCandidate extends EntityMeta {
  candidateId?: string;
  projectId: string;
  sourceReviewId?: string;
  type: AssetType;
  title: string;
  rationale: string;
  approvalStatus: ApprovalStatus;
  applicability: ApplicabilitySpec;
  contentMarkdown?: string;
  status?: string;
  reviewStatus?: ReviewStatus;
  publishStatus?: "candidate" | "published" | "deprecated";
  reusabilityScore?: number;
  feedbackToKnowledge?: KnowledgeFeedbackStatus;
}

export interface AssetLineage {
  assetId: string;
  sourceReviewId: string;
  sourceProjectId: string;
  publishStatus: AssetPublishStatus;
  publishedAt: string;
}

export interface PublishedAsset extends EntityMeta {
  assetId?: string;
  candidateId?: string;
  projectId?: string;
  sourceReviewId?: string;
  type: AssetType;
  assetType?: AssetType;
  title: string;
  contentMarkdown?: string;
  summary: string;
  sourceProjectId?: string;
  reuseCount?: number;
  status: AssetPublishStatus;
  publishStatus?: "candidate" | "published" | "deprecated";
  publishedAt?: string;
}

export interface GovernanceStatus {
  state: "healthy" | "needs_attention" | "in_progress" | "completed";
  summary: string;
}

export interface ActionCenterItem {
  actionId: string;
  projectId: string;
  projectName: string;
  role?: RoleType | null;
  actionDomain?: ActionDomain | null;
  actionType: ActionType;
  description: string;
  approvalStatus: ApprovalStatus;
  executionStatus: ExecutionStatus;
  workflowId?: string | null;
  workflowStatus?: RuntimeStatus | null;
  workflowSummary?: string | null;
  priority: number;
  owner: string;
  updatedAt: string;
}

export interface ActionCenterResponse {
  items: ActionCenterItem[];
  summary: {
    total: number;
    pendingApprovals: number;
    queued: number;
    inProgress: number;
    completed: number;
  };
  filters: {
    role: RoleType | null;
    actionDomain: ActionDomain | null;
    approvalStatus: ApprovalStatus | null;
    executionStatus: ExecutionStatus | null;
    projectId: string | null;
  };
}

export interface ReviewCenterItem {
  reviewId: string;
  projectId: string;
  projectName: string;
  sourceActionId?: string | null;
  reviewType: ReviewType;
  reviewStatus: ReviewStatus;
  reviewQualityScore: number;
  summary: string;
  isPromotedToAsset: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewCenterResponse {
  items: ReviewCenterItem[];
  summary: {
    total: number;
    approved: number;
    generated: number;
    promoted: number;
    promoteable: number;
  };
  filters: {
    projectId: string | null;
    reviewStatus: ReviewStatus | null;
    reviewType: ReviewType | null;
    sourceActionId: string | null;
  };
}

export interface AssetLibraryItem {
  kind: "candidate" | "published";
  candidateId?: string | null;
  assetId?: string | null;
  projectId: string;
  projectName: string;
  sourceReviewId?: string | null;
  assetType: AssetType;
  title: string;
  publishStatus: "candidate" | "published" | "deprecated";
  reviewStatus?: ReviewStatus;
  reusabilityScore: number;
  feedbackToKnowledge: KnowledgeFeedbackStatus;
  updatedAt: string;
}

export interface AssetLibraryResponse {
  items: AssetLibraryItem[];
  summary: {
    total: number;
    candidates: number;
    published: number;
    feedbackSynced: number;
  };
  filters: {
    projectId: string | null;
    publishStatus: string | null;
    assetType: AssetType | null;
  };
}

export interface KnowledgeFeedbackRecord {
  feedbackId: string;
  sourceType: "review" | "asset_candidate" | "published_asset";
  sourceId: string;
  targetAssetId: string;
  feedbackMode: string;
  status: KnowledgeFeedbackStatus;
  createdAt: string;
}

export interface EvaluationRecord {
  evaluationId: string;
  projectId: string;
  decisionId?: string | null;
  actionId?: string | null;
  runId?: string | null;
  reviewId?: string | null;
  candidateId?: string | null;
  evaluationType: string;
  relatedObjectType: "decision" | "action" | "execution" | "review" | "asset";
  relatedObjectId: string;
  score: number;
  scoreJson: Record<string, unknown>;
  notes: string;
  createdAt: string;
}

export interface EvaluationSummary {
  total: number;
  averageScore: number;
  byType: Record<string, number>;
}

export interface ProjectGovernanceSummary {
  projectId: string;
  actionsSummary: {
    total: number;
    pendingApprovals: number;
    inProgress: number;
    completed: number;
    latestAction: ActionCenterItem | null;
  };
  reviewSummary: {
    total: number;
    approved: number;
    latestReview: ReviewCenterItem | null;
  };
  assetSummary: {
    total: number;
    candidates: number;
    published: number;
    latestAsset: AssetLibraryItem | null;
  };
  evaluationSummary: EvaluationSummary & {
    latestEvaluation: EvaluationRecord | null;
  };
  feedbackSummary: {
    total: number;
    synced: number;
    latestFeedback: KnowledgeFeedbackRecord | null;
  };
}

export interface PulseItem extends EntityMeta {
  audience: RoleView;
  category:
    | "risk"
    | "opportunity"
    | "approval"
    | "blocker"
    | "resource"
    | "review";
  summary: string;
  severity?: RiskLevel;
  relatedProjectId?: string;
  freshness: SignalFreshness;
}

export interface PulseBundle {
  audience: RoleView;
  summary: string;
  items: PulseItem[];
  generatedAt: string;
}

export interface ProjectRealtimeSnapshot {
  projectId: string;
  status: ProjectStatus;
  health: ProjectHealth;
  riskLevel: RiskLevel;
  keyBlocker?: string;
  latestPulse?: string;
  pendingApprovalCount: number;
  runningAgentCount: number;
  criticalExceptionCount: number;
  kpis: KPISet;
  updatedAt: string;
}

export interface LiveSignalFeedItem extends EntityMeta {
  projectId?: string;
  type:
    | "metric_update"
    | "risk_update"
    | "approval_update"
    | "agent_update"
    | "blocker_update"
    | "execution_update";
  summary: string;
}

export interface ProjectObject extends EntityMeta {
  type: ProjectType;
  name: string;
  stage: LifecycleStage;
  status: ProjectStatus;
  owner: string;
  stakeholders: PersonRef[];
  priority: number;
  health: ProjectHealth;
  riskLevel: RiskLevel;
  targetSummary: string;
  statusSummary: string;
  latestPulse?: string;
  keyBlocker?: string;
  identity: ProjectIdentity;
  stageExitCriteria: StageExitCriteria[];
  availableTransitions: TransitionRule[];
  allowedActionsByStage: AllowedActionByStage[];
  transitionBlockReason?: string;
  kpis: KPISet;
  opportunitySignals?: OpportunitySignal[];
  opportunityAssessment?: OpportunityAssessment;
  decisionContext?: DecisionContext;
  decisionObject?: DecisionObject;
  definition?: ProductDefinition;
  samplingReview?: SamplingReview;
  expression?: ExpressionPlan;
  actions: ActionItem[];
  approvals?: ApprovalRecord[];
  executionLogs?: ExecutionLog[];
  agentStates: AgentState[];
  review?: ReviewSummary;
  reviewLineage?: ReviewLineage;
  assetCandidates?: AssetCandidate[];
  publishedAssets?: PublishedAsset[];
}

export interface KnowledgeAssetDocument extends PublishedAsset {
  stage: LifecycleStage;
  assetType: AssetType;
  applicability: ApplicabilitySpec;
  sourceInfo: string;
  lineage?: AssetLineage;
}

export interface KnowledgeAsset extends EntityMeta {
  assetId: string;
  title: string;
  assetType: AssetType;
  stage: LifecycleStage;
  role: KnowledgeRole;
  sourceProjectId?: string;
  applicability: ApplicabilitySpec;
  contentMarkdown: string;
}

export interface KnowledgeChunk {
  chunkId: string;
  assetId: string;
  chunkText: string;
  chunkIndex: number;
  keywords: string[];
  stage: LifecycleStage;
  role: KnowledgeRole;
  assetType: AssetType;
}

export interface KnowledgeSearchResult {
  projectId?: string;
  query: string;
  matchedAssets: KnowledgeAsset[];
  matchedChunks: KnowledgeChunk[];
  retrievalTrace: string[];
  resultCount: number;
  generatedAt: string;
}

export interface RoleStory {
  role: RoleStoryRole;
  projectId: string;
  storySummary: string;
  topIssues: string[];
  keyDecisions: string[];
  recommendedActions: RecommendedAction[];
  pendingApprovals: string[];
  recentOutcomes: string[];
}

export interface RoleProfile {
  roleId: string;
  roleType: RoleType;
  roleName: string;
  directorArchetype?: DirectorArchetype;
  goalFocus: string;
  primaryObjects: string[];
  decisionScope: string[];
  evidencePreference: string[];
  actionScope: string[];
  summaryStyle: string;
}

export interface RoleProjectCard {
  projectId: string;
  projectName: string;
  stage: LifecycleStage;
  status: ProjectStatus;
  headlineProblem: string;
  headlineOpportunity: string;
  headlineRisk: string;
  primaryRecommendation: string;
  workflowStatus?: string;
  workflowSummary?: string;
  updatedAt: string;
}

export interface RoleDecisionQueueItem {
  decisionId: string;
  projectId: string;
  projectName: string;
  summary: string;
  requiredOwner: string;
  requiredAction: string;
  requiresApproval: boolean;
  approvalStatus?: ApprovalStatus;
  executionStatus?: ExecutionStatus;
  actionDomain?: ActionDomain;
  updatedAt: string;
}

export interface ActionLineage {
  action: ActionItem;
  approvals: ApprovalRecord[];
  runs: ExecutionRun[];
  logs: ExecutionLog[];
  latestReview: ReviewSummary | null;
  assetCandidates: AssetCandidate[];
}

export interface RoleRiskCard {
  projectId: string;
  projectName: string;
  riskLevel: RiskLevel;
  riskSummary: string;
  recommendation: string;
  updatedAt: string;
}

export interface RoleOpportunityCard {
  projectId: string;
  projectName: string;
  opportunitySummary: string;
  whyNow: string;
  updatedAt: string;
}

export interface RoleAssetSummaryCard {
  assetId: string;
  title: string;
  assetType: AssetType;
  summary: string;
  sourceProjectId?: string;
  updatedAt: string;
}

export interface RoleDashboardMetric {
  label: string;
  value: string;
}

export interface RoleDashboardSummary {
  headline: string;
  narrative: string;
  metrics: RoleDashboardMetric[];
}

export interface RoleDashboardResponse {
  role: RoleType;
  roleProfile: RoleProfile;
  summary: RoleDashboardSummary;
  projectCards: RoleProjectCard[];
  decisionQueue: RoleDecisionQueueItem[];
  riskCards: RoleRiskCard[];
  opportunityCards: RoleOpportunityCard[];
  assetSummary: RoleAssetSummaryCard[];
}

export type RuntimeStatus =
  | "queued"
  | "running"
  | "awaiting_approval"
  | "awaiting_writeback"
  | "completed"
  | "failed"
  | "retryable"
  | "cancelled";

export type WorkflowTaskType =
  | "approval_gate"
  | "agent_trigger"
  | "mock_execution"
  | "writeback"
  | "review_generate"
  | "asset_publish";

export interface WorkflowRun {
  workflowId: string;
  projectId: string;
  actionId: string;
  role: RoleType;
  actionDomain: ActionDomain;
  status: RuntimeStatus;
  currentTaskType?: WorkflowTaskType | null;
  startedAt: string;
  finishedAt?: string | null;
  lastEventAt: string;
}

export interface TaskRun {
  taskId: string;
  workflowId: string;
  projectId: string;
  actionId: string;
  runId?: string | null;
  taskType: WorkflowTaskType;
  attempt: number;
  status: RuntimeStatus;
  requestPayload?: Record<string, unknown> | null;
  responsePayload?: Record<string, unknown> | null;
  errorMessage?: string | null;
  startedAt: string;
  finishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RuntimeEvent {
  eventId: string;
  workflowId: string;
  taskId?: string | null;
  projectId: string;
  actionId: string;
  eventType: string;
  status: RuntimeStatus;
  summary: string;
  payload?: Record<string, unknown> | null;
  createdAt: string;
}

export interface RetryRecord {
  retryId: string;
  workflowId: string;
  originalTaskId: string;
  newTaskId: string;
  operator: string;
  reason?: string | null;
  createdAt: string;
}

export interface ProjectRuntimeSummary {
  projectId: string;
  counts: Record<RuntimeStatus, number>;
  latestWorkflow: WorkflowRun | null;
  latestEvent: RuntimeEvent | null;
  recentEvents?: RuntimeEvent[];
}

export interface EvalCase {
  caseId: string;
  name: string;
  scope:
    | "decision"
    | "action"
    | "execution"
    | "review"
    | "asset"
    | "role_consistency"
    | "lineage_integrity";
  severity: "low" | "medium" | "high";
  status: "active" | "deprecated" | "draft";
  ruleSpec: Record<string, unknown>;
  createdAt: string;
}

export interface EvalSuite {
  suiteId: string;
  name: string;
  description: string;
  status: "active" | "deprecated" | "draft";
  caseIds: string[];
  createdAt: string;
}

export interface EvalRun {
  runId: string;
  projectId: string;
  suiteId: string;
  status: "queued" | "running" | "completed" | "failed";
  summary: {
    total: number;
    averageScore: number;
    byStatus: Record<string, number>;
  };
  startedAt: string;
  finishedAt?: string | null;
}

export interface EvalResult {
  resultId: string;
  runId: string;
  caseId: string;
  relatedObjectType: string;
  relatedObjectId: string;
  status: "pass" | "warning" | "fail";
  scoreJson: Record<string, unknown>;
  notes: string;
  createdAt: string;
}

export interface GateDecision {
  gateId: string;
  runId: string;
  decision: "pass" | "warning" | "fail";
  summary: string;
  createdAt: string;
}

export interface EvalHarnessSummary {
  summary: {
    total: number;
    averageScore: number;
    byStatus: Record<string, number>;
  };
  latestRun: EvalRun | null;
  latestGateDecision: GateDecision | null;
}

export type OntologyGovernanceStatus =
  | "draft"
  | "active"
  | "deprecated"
  | "archived";

export interface OntologyRegistryItem {
  registryId: string;
  itemType:
    | "role_profile"
    | "stage_rule"
    | "action_policy"
    | "review_pattern"
    | "asset_type"
    | "template"
    | "skill";
  name: string;
  status: OntologyGovernanceStatus;
  owner: string;
  currentVersion: number;
  sourceTable?: string | null;
  sourceId?: string | null;
  updatedAt: string;
}

export interface PolicyObject {
  policyId: string;
  policyType: string;
  title: string;
  owner: string;
  payload: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateObject {
  templateId: string;
  title: string;
  owner: string;
  payload: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface SkillObject {
  skillId: string;
  title: string;
  owner: string;
  payload: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface OntologyVersionRecord {
  versionId: string;
  registryId: string;
  version: number;
  payload: Record<string, unknown>;
  changeNote?: string | null;
  createdAt: string;
}

export interface OntologyLineage {
  referenceType: string;
  referenceId: string;
  label: string;
}

export interface ProjectOntologyReferences {
  projectId: string;
  references: OntologyRegistryItem[];
}

export type BridgeMode = "local_mock" | "file_bridge" | "api_bridge";

export interface SyncRecord {
  syncId: string;
  adapterId: string;
  mode: BridgeMode;
  startedAt: string;
  finishedAt?: string | null;
  rowsImported: number;
  mappingErrors: Array<Record<string, unknown>>;
  freshnessSeconds: number;
  status: string;
}

export interface BridgeConfig {
  configId?: string;
  adapterId?: string;
  mode?: BridgeMode;
  [key: string]: unknown;
}

export interface SourceAdapter {
  adapterId: string;
  name: string;
  mode: BridgeMode;
  owner: string;
  connectorKey: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  config: BridgeConfig;
  latestSync: SyncRecord | null;
}

export interface ConnectorRegistryItem {
  connectorId: string;
  connectorKey: string;
  mode: BridgeMode;
  title: string;
  status: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectBridgeSummary {
  projectId: string;
  adapterSummary: Array<{
    adapterId: string;
    name: string;
    mode: BridgeMode;
    status: string;
    latestSync: SyncRecord | null;
  }>;
}

export interface ProjectReviewRecord {
  projectId: string;
  review: ReviewSummary | null;
  lineage: ReviewLineage | null;
  candidates: AssetCandidate[];
  publishedAssets: KnowledgeAssetDocument[];
}

export interface PilotSnapshot {
  projects: ProjectObject[];
  identities: ProjectIdentity[];
  identityResolutionLogs: IdentityResolutionLog[];
  transitionRules: TransitionRule[];
  realtimeSnapshots: ProjectRealtimeSnapshot[];
  pulses: PulseItem[];
  exceptions: ExceptionItem[];
  liveFeed: LiveSignalFeedItem[];
  knowledgeAssets: KnowledgeAssetDocument[];
  reviews: ProjectReviewRecord[];
  actionAuditTrails: ActionAuditTrail[];
  executionWritebackRecords: ExecutionWritebackRecord[];
  hitlPolicies: HumanInTheLoopPolicy[];
  assetLineages: AssetLineage[];
}
