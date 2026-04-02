export type LifecycleStage =
  | "opportunity_pool"
  | "new_product_incubation"
  | "launch_validation"
  | "growth_optimization"
  | "legacy_upgrade"
  | "review_capture";

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

export type ProjectHealth =
  | "healthy"
  | "watch"
  | "at_risk"
  | "critical";

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

export type ExecutionStatus =
  | "suggested"
  | "queued"
  | "in_progress"
  | "completed"
  | "rolled_back"
  | "failed"
  | "canceled";

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

export interface EvidenceRef {
  id: string;
  type:
    | "metric"
    | "history"
    | "case"
    | "rule"
    | "agent_observation"
    | "user_feedback"
    | "competitive_scan";
  summary: string;
  sourceLabel?: string;
  confidence?: ConfidenceLevel;
}

export interface EvidencePack {
  refs: EvidenceRef[];
  summary?: string;
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

export interface DecisionObject extends EntityMeta {
  projectId: string;
  stage: LifecycleStage;
  problemOrOpportunity: string;
  rationale: string;
  rootCauseSummary?: string;
  options: DecisionOption[];
  recommendedOptionId?: string;
  confidence: ConfidenceLevel;
  requiresHumanApproval: boolean;
  evidencePack: EvidencePack;
  pendingQuestions?: string[];
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

export interface ActionItem extends EntityMeta {
  sourceProjectId: string;
  sourceStage: LifecycleStage;
  goal: string;
  title: string;
  summary: string;
  expectedImpact: string;
  risk: RiskLevel;
  owner: string;
  approvalStatus: ApprovalStatus;
  executionMode: ExecutionMode;
  executionStatus: ExecutionStatus;
  validationWindow?: string;
  rollbackCondition?: string;
  requiresHumanApproval: boolean;
  triggeredBy:
    | "human"
    | "decision_brain"
    | "scenario_agent"
    | "automation_rule";
}

export interface ApprovalRecord extends EntityMeta {
  actionId: string;
  approver: string;
  status: ApprovalStatus;
  reason?: string;
}

export interface ExecutionLog extends EntityMeta {
  actionId: string;
  actorType: "human" | "agent" | "automation";
  actorId: string;
  status: ExecutionStatus;
  summary: string;
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
  projectId: string;
  verdict: ReviewVerdict;
  resultSummary: string;
  attributionSummary: string;
  attributionFactors: AttributionFactor[];
  lessonsLearned: string[];
  recommendations: string[];
}

export interface AssetCandidate extends EntityMeta {
  projectId: string;
  type: AssetType;
  title: string;
  rationale: string;
  approvalStatus: ApprovalStatus;
  applicability?: string;
}

export interface PublishedAsset extends EntityMeta {
  type: AssetType;
  title: string;
  summary: string;
  sourceProjectId?: string;
  reuseCount?: number;
  status: AssetPublishStatus;
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
  owner: string;
  stakeholders: PersonRef[];
  priority: number;
  health: ProjectHealth;
  riskLevel: RiskLevel;
  targetSummary: string;
  statusSummary: string;
  latestPulse?: string;
  keyBlocker?: string;
  kpis: KPISet;
  opportunitySignals?: OpportunitySignal[];
  opportunityAssessment?: OpportunityAssessment;
  decisionObject?: DecisionObject;
  definition?: ProductDefinition;
  samplingReview?: SamplingReview;
  expression?: ExpressionPlan;
  actions: ActionItem[];
  approvals?: ApprovalRecord[];
  executionLogs?: ExecutionLog[];
  agentStates: AgentState[];
  review?: ReviewSummary;
  assetCandidates?: AssetCandidate[];
  publishedAssets?: PublishedAsset[];
}

export interface KnowledgeAssetDocument extends PublishedAsset {
  stage: LifecycleStage;
  assetType: AssetType;
  applicability?: string;
  sourceInfo: string;
}

export interface ProjectReviewRecord {
  projectId: string;
  review: ReviewSummary | null;
  candidates: AssetCandidate[];
  publishedAssets: KnowledgeAssetDocument[];
}

export interface PilotSnapshot {
  projects: ProjectObject[];
  realtimeSnapshots: ProjectRealtimeSnapshot[];
  pulses: PulseItem[];
  exceptions: ExceptionItem[];
  liveFeed: LiveSignalFeedItem[];
  knowledgeAssets: KnowledgeAssetDocument[];
  reviews: ProjectReviewRecord[];
}
