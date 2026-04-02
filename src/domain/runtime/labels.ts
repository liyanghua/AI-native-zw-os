import type {
  ApprovalStatus,
  AssetType,
  ConfidenceLevel,
  ExecutionStatus,
  LifecycleStage,
  ProjectHealth,
  ReviewVerdict,
  RiskLevel,
  RoleView,
  SignalFreshness,
} from "../types/model";

const lifecycleStageLabels: Record<LifecycleStage, string> = {
  opportunity_pool: "商机池",
  new_product_incubation: "新品孵化",
  launch_validation: "首发验证",
  growth_optimization: "增长优化",
  legacy_upgrade: "老品升级",
  review_capture: "复盘沉淀",
};

const roleLabels: Record<RoleView, string> = {
  ceo: "老板",
  product_rd_director: "产品研发总监",
  growth_director: "运营与营销总监",
  visual_director: "视觉总监",
};

const healthLabels: Record<ProjectHealth, string> = {
  healthy: "健康",
  watch: "需关注",
  at_risk: "有风险",
  critical: "关键风险",
};

const riskLabels: Record<RiskLevel, string> = {
  low: "低风险",
  medium: "中风险",
  high: "高风险",
  critical: "关键风险",
};

const approvalLabels: Record<ApprovalStatus, string> = {
  not_required: "无需审批",
  pending: "待审批",
  approved: "已批准",
  rejected: "已拒绝",
  expired: "已过期",
};

const executionLabels: Record<ExecutionStatus, string> = {
  suggested: "待处理",
  queued: "排队中",
  in_progress: "执行中",
  completed: "已完成",
  rolled_back: "已回滚",
  failed: "执行失败",
  canceled: "已取消",
};

const assetTypeLabels: Record<AssetType, string> = {
  case: "案例",
  rule: "规则",
  template: "模板",
  skill: "技能包",
  sop: "SOP",
  evaluation_sample: "评测样本",
};

const confidenceLabels: Record<ConfidenceLevel, string> = {
  low: "低",
  medium: "中",
  high: "高",
};

const freshnessLabels: Record<SignalFreshness, string> = {
  real_time: "实时",
  near_real_time: "准实时",
  batch: "批量",
};

const reviewVerdictLabels: Record<ReviewVerdict, string> = {
  success: "成功",
  partial_success: "部分成功",
  failed: "失败",
  observe_more: "继续观察",
};

export function getLifecycleStageLabel(stage: LifecycleStage) {
  return lifecycleStageLabels[stage];
}

export function getRoleLabel(role: RoleView) {
  return roleLabels[role];
}

export function getHealthLabel(health: ProjectHealth) {
  return healthLabels[health];
}

export function getRiskLabel(risk: RiskLevel) {
  return riskLabels[risk];
}

export function getApprovalLabel(status: ApprovalStatus) {
  return approvalLabels[status];
}

export function getExecutionLabel(status: ExecutionStatus) {
  return executionLabels[status];
}

export function getAssetTypeLabel(type: AssetType) {
  return assetTypeLabels[type];
}

export function getConfidenceLabel(level: ConfidenceLevel) {
  return confidenceLabels[level];
}

export function getSignalFreshnessLabel(freshness: SignalFreshness) {
  return freshnessLabels[freshness];
}

export function getReviewVerdictLabel(verdict: ReviewVerdict) {
  return reviewVerdictLabels[verdict];
}
