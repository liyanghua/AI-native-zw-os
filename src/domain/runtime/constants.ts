import type {
  AgentStatus,
  AgentType,
  ApprovalStatus,
  AssetPublishStatus,
  AssetType,
  ConfidenceLevel,
  ExecutionMode,
  ExecutionStatus,
  LifecycleStage,
  ProjectHealth,
  ProjectType,
  ReviewVerdict,
  RiskLevel,
  RoleView,
  SignalFreshness,
  TrendDirection,
} from "../types/model";

export const lifecycleStages: LifecycleStage[] = [
  "opportunity_pool",
  "new_product_incubation",
  "launch_validation",
  "growth_optimization",
  "legacy_upgrade",
  "review_capture",
];

export const projectTypes: ProjectType[] = [
  "opportunity_project",
  "new_product_project",
  "growth_optimization_project",
  "legacy_upgrade_project",
];

export const roleViews: RoleView[] = [
  "ceo",
  "product_rd_director",
  "growth_director",
  "visual_director",
];

export const projectHealthLevels: ProjectHealth[] = [
  "healthy",
  "watch",
  "at_risk",
  "critical",
];

export const riskLevels: RiskLevel[] = ["low", "medium", "high", "critical"];
export const trendDirections: TrendDirection[] = ["up", "flat", "down"];
export const confidenceLevels: ConfidenceLevel[] = ["low", "medium", "high"];

export const approvalStatuses: ApprovalStatus[] = [
  "not_required",
  "pending",
  "approved",
  "rejected",
  "expired",
];

export const executionModes: ExecutionMode[] = ["manual", "agent", "automation"];

export const executionStatuses: ExecutionStatus[] = [
  "suggested",
  "queued",
  "in_progress",
  "completed",
  "rolled_back",
  "failed",
  "canceled",
];

export const agentTypes: AgentType[] = [
  "opportunity",
  "new_product",
  "diagnosis",
  "content",
  "visual",
  "execution",
  "upgrade",
  "review_capture",
  "governance",
  "data_observer",
];

export const agentStatuses: AgentStatus[] = [
  "idle",
  "running",
  "waiting_human",
  "blocked",
  "failed",
  "completed",
];

export const reviewVerdicts: ReviewVerdict[] = [
  "success",
  "partial_success",
  "failed",
  "observe_more",
];

export const assetTypes: AssetType[] = [
  "case",
  "rule",
  "template",
  "skill",
  "sop",
  "evaluation_sample",
];

export const signalFreshnessValues: SignalFreshness[] = [
  "real_time",
  "near_real_time",
  "batch",
];

export const assetPublishStatuses: AssetPublishStatus[] = [
  "draft",
  "published",
  "deprecated",
];
