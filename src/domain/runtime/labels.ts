import type {
  ApprovalStatus,
  AssetType,
  ConfidenceLevel,
  DecisionMode,
  ExecutionStatus,
  IdentityConflictStatus,
  LifecycleStage,
  ProjectHealth,
  ProjectStatus,
  ReviewVerdict,
  RiskLevel,
  RoleType,
  RoleView,
  SignalFreshness,
  WritebackStatus,
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

const roleTypeLabels: Record<RoleType, string> = {
  boss: "老板",
  operations_director: "运营与营销总监",
  product_rnd_director: "产品研发总监",
  visual_director: "视觉总监",
};

const healthLabels: Record<ProjectHealth, string> = {
  healthy: "健康",
  watch: "需关注",
  at_risk: "有风险",
  critical: "关键风险",
};

const projectStatusLabels: Record<ProjectStatus, string> = {
  active: "推进中",
  awaiting_approval: "等待审批",
  blocked: "阻塞中",
  executing: "执行中",
  reviewing: "复盘中",
  closed: "已闭环",
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

const writebackLabels: Record<WritebackStatus, string> = {
  not_started: "未写回",
  pending: "写回中",
  succeeded: "写回成功",
  failed: "写回失败",
  duplicate_ignored: "幂等忽略",
};

const decisionModeLabels: Record<DecisionMode, string> = {
  auto: "自动推进",
  suggest: "只建议",
  require_approval: "必须审批",
  blocked: "禁止自动推进",
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

const identityConflictLabels: Record<IdentityConflictStatus, string> = {
  healthy: "归一正常",
  conflicted: "归一冲突",
  manually_resolved: "人工修正",
};

export function getLifecycleStageLabel(stage: LifecycleStage) {
  return lifecycleStageLabels[stage];
}

export function getRoleLabel(role: RoleView) {
  return roleLabels[role];
}

export function getRoleTypeLabel(role: RoleType) {
  return roleTypeLabels[role];
}

export function getHealthLabel(health: ProjectHealth) {
  return healthLabels[health];
}

export function getProjectStatusLabel(status: ProjectStatus) {
  return projectStatusLabels[status];
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

export function getWritebackStatusLabel(status: WritebackStatus) {
  return writebackLabels[status];
}

export function getDecisionModeLabel(mode: DecisionMode) {
  return decisionModeLabels[mode];
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

export function getIdentityConflictLabel(status: IdentityConflictStatus) {
  return identityConflictLabels[status];
}
