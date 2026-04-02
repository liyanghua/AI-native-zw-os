import {
  normalizeActionId,
  normalizeAssetId,
  normalizeCandidateId,
  normalizeEntityId,
  normalizeProjectId,
  normalizeReviewId,
  type ActionSeed,
  type KnowledgeAssetSeed,
  type PilotRawState,
} from "./pilotSources";
import { mapExecutionEventSourceRefs } from "./source-adapters/executionEventAdapter";
import { mapKpiSnapshotSourceRefs } from "./source-adapters/kpiSnapshotAdapter";
import { mapOpportunitySignalSourceRefs } from "./source-adapters/opportunitySignalAdapter";
import { mapProductDefinitionSourceRefs } from "./source-adapters/productDefinitionAdapter";
import { mapReviewAssetSourceRefs } from "./source-adapters/reviewAssetAdapter";
import type {
  ActionAuditEntry,
  ActionAuditTrail,
  ActionItem,
  AllowedActionByStage,
  ApplicabilitySpec,
  ApprovalRecord,
  AssetCandidate,
  AssetLineage,
  DecisionContext,
  DecisionObject,
  EvidenceRef,
  ExecutionLog,
  ExecutionWritebackRecord,
  HumanInTheLoopPolicy,
  IdentityResolutionLog,
  KnowledgeAssetDocument,
  LiveSignalFeedItem,
  PilotSnapshot,
  ProjectIdentity,
  ProjectObject,
  ProjectRealtimeSnapshot,
  ProjectReviewRecord,
  ProjectStatus,
  ReviewLineage,
  ReviewSummary,
  SourceObjectRef,
  TransitionRule,
  ActionType,
} from "../domain/types/model";

export interface PilotGovernanceState {
  identities: ProjectIdentity[];
  identityResolutionLogs: IdentityResolutionLog[];
  transitionRules: TransitionRule[];
  allowedActionsByStage: AllowedActionByStage[];
  hitlPolicies: HumanInTheLoopPolicy[];
  actionAuditTrails: ActionAuditTrail[];
  executionWritebackRecords: ExecutionWritebackRecord[];
  reviewLineages: ReviewLineage[];
  assetLineages: AssetLineage[];
  decisionVersions: Record<string, number>;
  statusOverrides: Record<string, ProjectStatus | undefined>;
}

function createMeta(id: string, createdAt: string, updatedAt: string, createdBy = "pilot.runtime") {
  return {
    id,
    createdAt,
    updatedAt,
    createdBy,
    updatedBy: createdBy,
  };
}

function sortByUpdatedAtDesc<T extends { updatedAt?: string; createdAt?: string }>(items: T[]) {
  return [...items].sort((left, right) =>
    (right.updatedAt ?? right.createdAt ?? "").localeCompare(left.updatedAt ?? left.createdAt ?? ""),
  );
}

function sourceSystemForStage(stage: ProjectObject["stage"]) {
  if (stage === "opportunity_pool") return "opportunity_signal_hub";
  if (stage === "new_product_incubation") return "definition_center";
  if (stage === "launch_validation") return "launch_dashboard";
  if (stage === "growth_optimization") return "growth_console";
  return "review_asset_hub";
}

function defaultRolesByStage(stage: ProjectObject["stage"]): RoleView[] {
  if (stage === "opportunity_pool") return ["ceo", "product_rd_director"];
  if (stage === "new_product_incubation") return ["ceo", "product_rd_director", "visual_director"];
  if (stage === "launch_validation") return ["ceo", "growth_director", "visual_director"];
  if (stage === "growth_optimization") return ["ceo", "growth_director"];
  return ["ceo", "product_rd_director", "growth_director"];
}

function toApplicabilitySpec(
  applicability: ApplicabilitySpec | string | undefined,
  stage: ProjectObject["stage"],
  assetType: KnowledgeAssetDocument["assetType"],
): ApplicabilitySpec {
  if (applicability && typeof applicability !== "string") {
    return applicability;
  }

  const rawText = applicability ?? "";
  const businessGoal =
    rawText.includes("转化") || rawText.includes("成交")
      ? "提升首发转化"
      : rawText.includes("放量") || rawText.includes("增长")
        ? "稳定增长效率"
        : rawText.includes("首发")
          ? "提升首发通过率"
          : "沉淀可复用经营方法";

  return {
    stage: [stage],
    role: defaultRolesByStage(stage),
    assetType: [assetType],
    channel:
      stage === "launch_validation" || stage === "growth_optimization"
        ? "电商投放"
        : "商品经营",
    category:
      rawText.includes("商务")
        ? "商务包"
        : rawText.includes("亲子")
          ? "亲子包"
          : rawText.includes("通勤")
            ? "通勤包"
            : "通用经营",
    businessGoal,
    priceBand:
      rawText.includes("高客单")
        ? "599-799"
        : rawText.includes("首发")
          ? "249-399"
          : "299-499",
    lifecycle:
      stage === "review_capture"
        ? "review_to_asset"
        : stage === "launch_validation"
          ? "launch_loop"
          : "project_loop",
    preconditions: rawText ? [rawText] : ["需要完整项目上下文"],
    exclusionConditions: rawText.includes("高客单")
      ? ["低客单试验项目"]
      : ["证据缺失或 KPI 过期项目"],
  };
}

function defaultActionType(actionKey: string): ActionType {
  if (actionKey.includes("price_adjustment")) return "price_adjustment";
  if (actionKey.includes("visual_refresh")) return "visual_refresh";
  if (actionKey.includes("restock")) return "inventory_restock";
  if (actionKey.includes("budget")) return "budget_reallocation";
  if (actionKey.includes("price_confirmation")) return "price_confirmation";
  return "project_initiation";
}

function createTransitionRules(): TransitionRule[] {
  return [
    {
      id: "opportunity-to-incubation",
      fromStage: "opportunity_pool",
      toStage: "new_product_incubation",
      description: "机会完成判断后才能进入新品孵化。",
      exitCriteriaIds: ["identity-ready", "decision-ready"],
      allowRollback: false,
    },
    {
      id: "incubation-to-launch",
      fromStage: "new_product_incubation",
      toStage: "launch_validation",
      description: "定义、打样和关键审批通过后才能首发。",
      exitCriteriaIds: ["definition-ready", "sampling-ready", "approval-cleared"],
      allowRollback: true,
    },
    {
      id: "launch-to-growth",
      fromStage: "launch_validation",
      toStage: "growth_optimization",
      description: "首发验证通过后再进入增长优化。",
      exitCriteriaIds: ["launch-action-complete", "launch-cvr-guardrail"],
      allowRollback: true,
    },
    {
      id: "growth-to-review",
      fromStage: "growth_optimization",
      toStage: "review_capture",
      description: "增长动作结束并形成复盘后进入沉淀。",
      exitCriteriaIds: ["growth-review-ready"],
      allowRollback: true,
    },
  ];
}

function createAllowedActions(): AllowedActionByStage[] {
  return [
    { stage: "opportunity_pool", actionType: "project_initiation", decisionMode: "require_approval", requiresApproval: true },
    { stage: "new_product_incubation", actionType: "price_confirmation", decisionMode: "require_approval", requiresApproval: true },
    { stage: "launch_validation", actionType: "price_adjustment", decisionMode: "require_approval", requiresApproval: true },
    { stage: "launch_validation", actionType: "visual_refresh", decisionMode: "suggest", requiresApproval: true },
    { stage: "growth_optimization", actionType: "inventory_restock", decisionMode: "require_approval", requiresApproval: true },
    { stage: "growth_optimization", actionType: "budget_reallocation", decisionMode: "suggest", requiresApproval: false },
    { stage: "review_capture", actionType: "review_publish", decisionMode: "require_approval", requiresApproval: true },
  ];
}

function createHitlPolicies(): HumanInTheLoopPolicy[] {
  return [
    {
      ...createMeta("policy-price-adjustment", "2026-04-02T09:00:00+08:00", "2026-04-02T09:00:00+08:00", "governance.system"),
      actionType: "price_adjustment",
      decisionMode: "require_approval",
      triggerConditions: ["价格变更影响品牌感知", "CVR 明显低于目标"],
      riskLevel: "high",
      fallbackPolicy: "若证据冲突，则保留原价并继续观察 24 小时。",
    },
    {
      ...createMeta("policy-inventory-restock", "2026-04-02T09:00:00+08:00", "2026-04-02T09:00:00+08:00", "governance.system"),
      actionType: "inventory_restock",
      decisionMode: "require_approval",
      triggerConditions: ["补单金额超过预算阈值", "库存风险影响增长动作"],
      riskLevel: "medium",
      fallbackPolicy: "若审批未通过，则冻结放量动作并重新分配预算。",
    },
    {
      ...createMeta("policy-review-publish", "2026-04-02T09:00:00+08:00", "2026-04-02T09:00:00+08:00", "governance.system"),
      actionType: "review_publish",
      decisionMode: "suggest",
      triggerConditions: ["review lineage 完整", "证据缺失标记为空"],
      riskLevel: "low",
      fallbackPolicy: "若 lineage 不完整，则禁止直接入库。",
    },
  ];
}

function buildSourceRefs(rawState: PilotRawState, projectKey: string): SourceObjectRef[] {
  const refs: SourceObjectRef[] = [
    {
      sourceSystem: sourceSystemForStage(
        rawState.projects.find((project) => project.projectKey === projectKey)?.stage ?? "opportunity_pool",
      ),
      sourceObjectType: "project",
      sourceObjectId: projectKey.toLowerCase().replace(/_/g, "-"),
      externalKey: projectKey,
      firstSeenAt: "2026-04-02T09:00:00+08:00",
      lastSeenAt: "2026-04-02T10:15:00+08:00",
    },
  ];

  refs.push(...mapOpportunitySignalSourceRefs(rawState, projectKey));
  refs.push(...mapProductDefinitionSourceRefs(rawState, projectKey));
  refs.push(...mapKpiSnapshotSourceRefs(rawState, projectKey));
  refs.push(...mapExecutionEventSourceRefs(rawState, projectKey));
  refs.push(...mapReviewAssetSourceRefs(rawState, projectKey));

  return refs;
}

function createInitialAuditTrails(rawState: PilotRawState): ActionAuditTrail[] {
  return rawState.actions.map((action) => {
    const actionId = normalizeActionId(action.actionKey);
    const entries: ActionAuditEntry[] = [
      {
        ...createMeta(
          normalizeEntityId("audit", `${action.actionKey}-created`),
          action.executionEvents[0]?.at ?? "2026-04-02T09:00:00+08:00",
          action.executionEvents[0]?.at ?? "2026-04-02T09:00:00+08:00",
          "decision.brain",
        ),
        actionId,
        eventType: "created",
        actorType: "system",
        actorId: "decision.brain",
        summary: `${action.title} 已从决策对象生成动作候选。`,
      },
    ];

    if (action.requiresHumanApproval && action.approvalStatus === "pending") {
      entries.push({
        ...createMeta(
          normalizeEntityId("audit", `${action.actionKey}-approval-requested`),
          action.executionEvents[0]?.at ?? "2026-04-02T09:00:00+08:00",
          action.executionEvents[0]?.at ?? "2026-04-02T09:00:00+08:00",
          "governance.system",
        ),
        actionId,
        eventType: "approval_requested",
        actorType: "system",
        actorId: "governance.system",
        summary: "动作已进入人工审批队列。",
      });
    }

    return {
      actionId,
      entries,
    };
  });
}

function createInitialReviewLineages(rawState: PilotRawState): ReviewLineage[] {
  return rawState.reviews.map((review) => {
    const actionSeeds = rawState.actions.filter((action) => action.projectKey === review.projectKey);
    return {
      reviewId: normalizeReviewId(review.projectKey),
      projectId: normalizeProjectId(review.projectKey),
      sourceDecisionIds: [normalizeEntityId("decision", review.projectKey)],
      sourceActionIds: actionSeeds.map((action) => normalizeActionId(action.actionKey)),
      sourceExecutionLogIds: actionSeeds.flatMap((action) =>
        action.executionEvents.map((_, index) => normalizeEntityId("log", `${action.actionKey}-${index}`)),
      ),
      generatedAt: "2026-04-02T10:15:00+08:00",
    };
  });
}

function createInitialAssetLineages(rawState: PilotRawState): AssetLineage[] {
  return rawState.reviews.flatMap((review) =>
    review.knowledgeAssets.map((asset) => ({
      assetId: normalizeAssetId(asset.assetKey),
      sourceReviewId: normalizeReviewId(review.projectKey),
      sourceProjectId: normalizeProjectId(review.projectKey),
      publishStatus: asset.status,
      publishedAt: "2026-04-02T10:15:00+08:00",
    })),
  );
}

export function createPilotGovernanceState(rawState: PilotRawState): PilotGovernanceState {
  const identities = rawState.projects.map((project, index) => ({
    ...createMeta(
      normalizeEntityId("identity", project.projectKey),
      "2026-04-02T09:00:00+08:00",
      "2026-04-02T10:15:00+08:00",
      index === 0 ? "manual.resolver" : "identity.system",
    ),
    projectId: normalizeProjectId(project.projectKey),
    identityVersion: 1,
    sourceRefs: buildSourceRefs(rawState, project.projectKey),
    confidence: index === 0 ? "medium" : "high",
    resolvedBy: index === 0 ? "manual.resolver" : "identity.system",
    resolvedAt: "2026-04-02T10:15:00+08:00",
    resolutionPolicy: index === 0 ? "manual_override" : "source_key_match",
    conflictStatus: index === 0 ? "manually_resolved" : "healthy",
  }));

  const identityResolutionLogs: IdentityResolutionLog[] = [
    {
      ...createMeta("identity-log-pilot-opp-urban-lite", "2026-04-02T10:12:00+08:00", "2026-04-02T10:12:00+08:00", "manual.resolver"),
      projectId: "pilot-opp-urban-lite",
      previousResolution: "opportunity_signal_hub:opp-urban-lite + manual_sheet:urban-lite-v2",
      newResolution: "pilot-opp-urban-lite",
      reason: "同一商机在机会源与人工整理表中被重复识别，已人工归一。",
      operator: "林乔",
    },
  ];

  return {
    identities,
    identityResolutionLogs,
    transitionRules: createTransitionRules(),
    allowedActionsByStage: createAllowedActions(),
    hitlPolicies: createHitlPolicies(),
    actionAuditTrails: createInitialAuditTrails(rawState),
    executionWritebackRecords: [],
    reviewLineages: createInitialReviewLineages(rawState),
    assetLineages: createInitialAssetLineages(rawState),
    decisionVersions: Object.fromEntries(rawState.projects.map((project) => [normalizeProjectId(project.projectKey), 1])),
    statusOverrides: {},
  };
}

function deriveProjectStatus(
  projectId: string,
  stage: ProjectObject["stage"],
  projectActions: ActionItem[],
  pendingApprovalCount: number,
  criticalExceptionCount: number,
  governanceState: PilotGovernanceState,
  publishedAssetCount: number,
): ProjectStatus {
  const override = governanceState.statusOverrides[projectId];
  if (override) return override;
  if (stage === "review_capture" && publishedAssetCount > 0) return "closed";
  if (pendingApprovalCount > 0) return "awaiting_approval";
  if (projectActions.some((action) => action.executionStatus === "queued" || action.executionStatus === "in_progress")) {
    return "executing";
  }
  if (criticalExceptionCount > 0) return "blocked";
  if (stage === "review_capture") return "reviewing";
  return "active";
}

function buildDecisionContext(
  projectId: string,
  projectSeed: PilotRawState["projects"][number],
  realtime: ProjectRealtimeSnapshot | undefined,
  approvals: ApprovalRecord[],
  executionLogs: ExecutionLog[],
  relatedKnowledge: KnowledgeAssetDocument[],
  exceptions: PilotSnapshot["exceptions"],
): DecisionContext {
  const factEvidence: EvidenceRef[] = [
    ...(realtime?.kpis.metrics.slice(0, 3).map((metric) => ({
      ...createMeta(
        normalizeEntityId("evidence", `${projectId}-${metric.key}`),
        realtime.updatedAt,
        realtime.updatedAt,
        "data.observer",
      ),
      type: "metric" as const,
      layer: "fact" as const,
      summary: `${metric.label} 当前值 ${metric.value}${metric.unit === "%" ? "%" : ""}`,
      sourceLabel: "实时经营指标",
      confidence: "high" as const,
      relatedProjectId: projectId,
      updatedAtLabel: realtime.updatedAt.slice(11, 16),
    })) ?? []),
    ...approvals.slice(0, 2).map((approval) => ({
      ...createMeta(
        normalizeEntityId("evidence", `approval-${approval.id}`),
        approval.updatedAt,
        approval.updatedAt,
        approval.approver,
      ),
      type: "history" as const,
      layer: "fact" as const,
      summary: `审批状态：${approval.status}${approval.reason ? `，原因：${approval.reason}` : ""}`,
      sourceLabel: "审批记录",
      confidence: "high" as const,
      relatedProjectId: projectId,
      updatedAtLabel: approval.updatedAt.slice(11, 16),
    })),
    ...executionLogs.slice(0, 2).map((log) => ({
      ...createMeta(
        normalizeEntityId("evidence", `exec-${log.id}`),
        log.updatedAt,
        log.updatedAt,
        log.actorId,
      ),
      type: "history" as const,
      layer: "fact" as const,
      summary: log.summary,
      sourceLabel: "执行日志",
      confidence: "high" as const,
      relatedProjectId: projectId,
      updatedAtLabel: log.updatedAt.slice(11, 16),
    })),
    ...exceptions.slice(0, 1).map((item) => ({
      ...createMeta(
        normalizeEntityId("evidence", `exception-${item.id}`),
        item.updatedAt,
        item.updatedAt,
        "governance.system",
      ),
      type: "agent_observation" as const,
      layer: "fact" as const,
      summary: item.summary,
      sourceLabel: "异常观测",
      confidence: "medium" as const,
      relatedProjectId: projectId,
      updatedAtLabel: item.updatedAt.slice(11, 16),
    })),
  ];

  const methodEvidence: EvidenceRef[] = relatedKnowledge.slice(0, 3).map((asset) => ({
    ...createMeta(
      normalizeEntityId("evidence", `${projectId}-${asset.id}`),
      asset.updatedAt,
      asset.updatedAt,
      "knowledge.search",
    ),
    type: asset.assetType === "case" ? "case" : "rule",
    layer: "method" as const,
    summary: asset.summary,
    sourceLabel: asset.title,
    confidence: "medium" as const,
    relatedProjectId: projectId,
    updatedAtLabel: asset.updatedAt.slice(11, 16),
    applicability: asset.applicability,
  }));

  const missingEvidenceFlags: string[] = [];
  if (methodEvidence.length === 0) {
    missingEvidenceFlags.push("缺少可复用方法证据");
  }
  if ((realtime?.kpis.metrics.length ?? 0) === 0) {
    missingEvidenceFlags.push("缺少最新 KPI 快照");
  }
  if (projectSeed.decisionSeed.pendingQuestions?.length) {
    missingEvidenceFlags.push("仍有待回答问题");
  }

  return {
    ...createMeta(
      normalizeEntityId("decision-context", projectSeed.projectKey),
      "2026-04-02T10:20:00+08:00",
      realtime?.updatedAt ?? "2026-04-02T10:20:00+08:00",
      "decision.brain",
    ),
    projectId,
    stage: projectSeed.stage,
    goalSpec: projectSeed.targetSummary,
    currentStateSummary: realtime?.latestPulse ?? projectSeed.statusSummary,
    diagnosis: projectSeed.decisionSeed.rootCauseSummary ?? projectSeed.decisionSeed.rationale,
    evidencePack: {
      factEvidence,
      methodEvidence,
      refs: [...factEvidence, ...methodEvidence],
      summary: `${projectSeed.name} 的决策上下文已经完成证据聚合。`,
      generatedAt: realtime?.updatedAt ?? "2026-04-02T10:20:00+08:00",
      retrievalTrace: [
        `${sourceSystemForStage(projectSeed.stage)} -> ${projectSeed.projectKey}`,
        `knowledge -> ${relatedKnowledge.map((asset) => asset.id).join(", ") || "none"}`,
      ],
      missingEvidenceFlags,
    },
    compiledBy: "decision.brain",
    compilerVersion: "pilot-v2",
  };
}

function buildDecisionObject(
  projectId: string,
  projectSeed: PilotRawState["projects"][number],
  decisionContext: DecisionContext,
  projectActions: ActionItem[],
  governanceState: PilotGovernanceState,
): DecisionObject {
  const recommendedOption = projectSeed.decisionSeed.options.find(
    (option) => option.id === projectSeed.decisionSeed.recommendedOptionId,
  );
  const recommendedActions = (projectActions.length > 0 ? projectActions : [
    {
      id: normalizeActionId(`${projectSeed.projectKey}-synthetic`),
      sourceProjectId: projectId,
      sourceStage: projectSeed.stage,
      actionType: defaultActionType(projectSeed.decisionSeed.recommendedOptionId ?? projectSeed.projectKey),
      decisionId: normalizeEntityId("decision", projectSeed.projectKey),
      actionVersion: 1,
      idempotencyKey: normalizeEntityId("idem", projectSeed.projectKey),
      goal: projectSeed.targetSummary,
      title: recommendedOption?.title ?? "待执行动作",
      summary: recommendedOption?.summary ?? projectSeed.decisionSeed.problemOrOpportunity,
      expectedImpact: recommendedOption?.expectedImpact ?? projectSeed.targetSummary,
      risk: recommendedOption?.risk ?? "medium",
      owner: projectSeed.owner,
      approvalStatus: projectSeed.decisionSeed.requiresHumanApproval ? "pending" : "not_required",
      executionMode: recommendedOption?.autoExecutable ? "automation" : "manual",
      executionStatus: "suggested",
      writebackStatus: "not_started",
      writebackAttemptCount: 0,
      validationWindow: recommendedOption?.validationWindow,
      rollbackCondition: "若关键指标恶化则立即回滚。",
      requiresHumanApproval: projectSeed.decisionSeed.requiresHumanApproval,
      triggeredBy: "decision_brain",
      createdAt: decisionContext.createdAt,
      updatedAt: decisionContext.updatedAt,
    },
  ]).map((action) => ({
    actionId: action.id,
    actionType: action.actionType,
    description: action.summary,
    owner: action.owner,
    dueAt: action.updatedAt,
    expectedMetric:
      projectSeed.stage === "growth_optimization"
        ? "ROI"
        : projectSeed.stage === "launch_validation"
          ? "CVR"
          : "项目推进效率",
    expectedDirection: "up" as const,
    requiredApproval: action.requiresHumanApproval,
    rollbackHint: action.rollbackCondition,
    confidence: projectSeed.decisionSeed.confidence,
    supportingEvidenceRefs: decisionContext.evidencePack.refs.slice(0, 3).map((ref) => ref.id),
  }));

  return {
    ...createMeta(
      normalizeEntityId("decision", projectSeed.projectKey),
      decisionContext.createdAt,
      decisionContext.updatedAt,
      "decision.brain",
    ),
    projectId,
    stage: projectSeed.stage,
    decisionVersion: governanceState.decisionVersions[projectId] ?? 1,
    decisionContextId: decisionContext.id,
    goalSpec: decisionContext.goalSpec,
    currentStateSummary: decisionContext.currentStateSummary,
    diagnosis: decisionContext.diagnosis,
    problemOrOpportunity: projectSeed.decisionSeed.problemOrOpportunity,
    rationale: projectSeed.decisionSeed.rationale,
    rootCauseSummary: projectSeed.decisionSeed.rootCauseSummary,
    options: projectSeed.decisionSeed.options,
    recommendedOptionId: projectSeed.decisionSeed.recommendedOptionId,
    recommendedActions,
    risks: recommendedActions.map((action) => `动作 ${action.description} 伴随 ${action.confidence} 置信度判断`),
    approvalsRequired: recommendedActions
      .filter((action) => action.requiredApproval)
      .map((action) => `${action.description} 需要人工审批`),
    expectedImpact: recommendedOption?.expectedImpact ?? projectSeed.targetSummary,
    validationPlan: {
      window: recommendedOption?.validationWindow ?? "7 天",
      primaryMetric:
        projectSeed.stage === "growth_optimization"
          ? "ROI"
          : projectSeed.stage === "launch_validation"
            ? "CVR"
            : "项目推进效率",
      expectedDirection: "up",
      successCriteria: [
        "关键指标趋势朝预期方向变化",
        "动作执行和审批链路可被完整追踪",
      ],
      rollbackHint: recommendedOption?.constraints?.[0] ?? "若关键指标持续恶化则回滚动作。",
    },
    confidence: projectSeed.decisionSeed.confidence,
    requiresHumanApproval: projectSeed.decisionSeed.requiresHumanApproval,
    evidencePack: decisionContext.evidencePack,
    evidenceRefs: decisionContext.evidencePack.refs.map((ref) => ref.id),
    pendingQuestions: projectSeed.decisionSeed.pendingQuestions,
    compiledAt: decisionContext.updatedAt,
    compiledBy: "decision.brain",
    compilerVersion: "pilot-v2",
  };
}

function buildStageExitCriteria(
  project: ProjectObject,
  realtime: ProjectRealtimeSnapshot | undefined,
): ProjectObject["stageExitCriteria"] {
  const cvrMetric = project.kpis.metrics.find((metric) => metric.key === "cvr");
  const completedActions = project.actions.filter((action) => action.executionStatus === "completed");
  const pendingApprovals = project.actions.filter((action) => action.approvalStatus === "pending");

  if (project.stage === "opportunity_pool") {
    return [
      {
        id: "identity-ready",
        stage: project.stage,
        label: "项目归一完成",
        description: "同一商机在各入口被归一到稳定 projectId。",
        status: project.identity.conflictStatus === "conflicted" ? "failed" : "passed",
        blocking: true,
      },
      {
        id: "decision-ready",
        stage: project.stage,
        label: "决策上下文完整",
        description: "需要至少 1 条事实证据和 1 条方法证据。",
        status:
          (project.decisionContext?.evidencePack.factEvidence.length ?? 0) > 0 &&
          (project.decisionContext?.evidencePack.methodEvidence.length ?? 0) > 0
            ? "passed"
            : "failed",
        blocking: true,
      },
    ];
  }

  if (project.stage === "new_product_incubation") {
    return [
      {
        id: "definition-ready",
        stage: project.stage,
        label: "商品定义完整",
        description: "定义、价格带与规格说明已齐备。",
        status: project.definition ? "passed" : "failed",
        blocking: true,
      },
      {
        id: "sampling-ready",
        stage: project.stage,
        label: "打样评审达标",
        description: "打样达到 ready_for_review 或 approved。",
        status:
          project.definition?.samplingStatus === "ready_for_review" || project.definition?.samplingStatus === "approved"
            ? "passed"
            : "pending",
        blocking: true,
      },
      {
        id: "approval-cleared",
        stage: project.stage,
        label: "关键审批清空",
        description: "核心价格/定义审批已处理。",
        status: pendingApprovals.length === 0 ? "passed" : "pending",
        blocking: true,
      },
    ];
  }

  if (project.stage === "launch_validation") {
    return [
      {
        id: "launch-action-complete",
        stage: project.stage,
        label: "关键验证动作完成",
        description: "至少一条首发验证动作已完成写回。",
        status: completedActions.length > 0 ? "passed" : "failed",
        blocking: true,
      },
      {
        id: "launch-cvr-guardrail",
        stage: project.stage,
        label: "转化率守门线",
        description: "CVR 与目标差距回到 -1 个点以内。",
        status:
          cvrMetric && cvrMetric.deltaVsTarget !== undefined && cvrMetric.deltaVsTarget >= -1 ? "passed" : "failed",
        blocking: true,
      },
      {
        id: "launch-exception-cleared",
        stage: project.stage,
        label: "关键异常已清空",
        description: "高优异常已处理到可继续推进。",
        status: (realtime?.criticalExceptionCount ?? 0) === 0 ? "passed" : "pending",
        blocking: false,
      },
    ];
  }

  if (project.stage === "growth_optimization") {
    return [
      {
        id: "growth-review-ready",
        stage: project.stage,
        label: "已形成可复盘材料",
        description: "增长动作与执行结果已足够支持复盘沉淀。",
        status: completedActions.length > 0 || Boolean(project.review) ? "passed" : "pending",
        blocking: true,
      },
    ];
  }

  return [
    {
      id: "review-generated",
      stage: project.stage,
      label: "复盘结论生成",
      description: "项目已形成复盘摘要与沉淀建议。",
      status: project.review ? "passed" : "pending",
      blocking: true,
    },
    {
      id: "asset-published",
      stage: project.stage,
      label: "资产完成发布",
      description: "至少有一条资产完成入库。",
      status: (project.publishedAssets?.length ?? 0) > 0 ? "passed" : "pending",
      blocking: false,
    },
  ];
}

export function buildPilotSnapshot(rawState: PilotRawState, governanceState: PilotGovernanceState): PilotSnapshot {
  const performanceByProject = new Map(rawState.performance.map((item) => [item.projectKey, item]));
  const definitionsByProject = new Map(rawState.definitions.map((item) => [item.projectKey, item]));
  const reviewsByProject = new Map(rawState.reviews.map((review) => [review.projectKey, review]));
  const identitiesByProjectId = new Map(governanceState.identities.map((identity) => [identity.projectId, identity]));

  const actionItems: ActionItem[] = rawState.actions.map((action) => {
    const actionId = normalizeActionId(action.actionKey);
    const writeback = governanceState.executionWritebackRecords.find((record) => record.actionId === actionId);
    return {
      ...createMeta(
        actionId,
        action.executionEvents[0]?.at ?? "2026-04-02T09:00:00+08:00",
        action.executionEvents.at(-1)?.at ?? "2026-04-02T10:30:00+08:00",
        action.triggeredBy,
      ),
      sourceProjectId: normalizeProjectId(action.projectKey),
      sourceStage: action.sourceStage,
      actionType: action.actionType ?? defaultActionType(action.actionKey),
      decisionId: normalizeEntityId("decision", action.projectKey),
      actionVersion: action.actionVersion ?? 1,
      idempotencyKey: action.idempotencyKey ?? normalizeEntityId("idem", action.actionKey),
      goal: action.goal,
      title: action.title,
      summary: action.summary,
      expectedImpact: action.expectedImpact,
      risk: action.risk,
      owner: action.owner,
      approvalStatus: action.approvalStatus,
      executionMode: action.executionMode,
      executionStatus: action.executionStatus,
      writebackStatus: writeback?.resultStatus ?? "not_started",
      writebackAttemptCount: writeback?.attemptCount ?? 0,
      lastWritebackError: writeback?.errorMessage,
      validationWindow: action.validationWindow,
      rollbackCondition: action.rollbackCondition,
      requiresHumanApproval: action.requiresHumanApproval,
      triggeredBy: action.triggeredBy,
    };
  });

  const executionLogs: ExecutionLog[] = sortByUpdatedAtDesc(
    rawState.actions.flatMap((action) =>
      action.executionEvents.map((event, index) => ({
        ...createMeta(
          normalizeEntityId("log", `${action.actionKey}-${index}`),
          event.at,
          event.at,
          event.actorId,
        ),
        actionId: normalizeActionId(action.actionKey),
        actorType: event.actorType,
        actorId: event.actorId,
        status: event.status,
        summary: event.summary,
      })),
    ),
  );

  const approvals: ApprovalRecord[] = rawState.actions
    .filter((action) => action.requiresHumanApproval)
    .map((action) => ({
      ...createMeta(
        normalizeEntityId("approval", action.actionKey),
        action.executionEvents[0]?.at ?? "2026-04-02T09:00:00+08:00",
        action.executionEvents.at(-1)?.at ?? "2026-04-02T10:30:00+08:00",
      ),
      actionId: normalizeActionId(action.actionKey),
      approver: action.approver ?? action.owner,
      status: action.approvalStatus,
      reason: action.approvalReason,
    }));

  const knowledgeAssets: KnowledgeAssetDocument[] = sortByUpdatedAtDesc(
    rawState.reviews.flatMap((review) =>
      review.knowledgeAssets.map((asset) => ({
        ...createMeta(
          normalizeAssetId(asset.assetKey),
          "2026-04-02T09:00:00+08:00",
          "2026-04-02T10:15:00+08:00",
        ),
        type: asset.type,
        title: asset.title,
        summary: asset.summary,
        sourceProjectId: asset.sourceProjectKey ? normalizeProjectId(asset.sourceProjectKey) : undefined,
        reuseCount: asset.reuseCount,
        status: asset.status,
        stage: asset.stage,
        assetType: asset.type,
        applicability: toApplicabilitySpec(asset.applicability, asset.stage, asset.type),
        sourceInfo: asset.sourceInfo,
        lineage: governanceState.assetLineages.find((lineage) => lineage.assetId === normalizeAssetId(asset.assetKey)),
      })),
    ),
  );

  const exceptions = sortByUpdatedAtDesc(
    rawState.performance.flatMap((performance) =>
      performance.exceptions.map((exception, index) => ({
        ...createMeta(
          normalizeEntityId("exception", `${performance.projectKey}-${index}`),
          "2026-04-02T09:45:00+08:00",
          "2026-04-02T10:40:00+08:00",
        ),
        projectId: normalizeProjectId(performance.projectKey),
        source: exception.source,
        severity: exception.severity,
        summary: exception.summary,
        requiresHumanIntervention: exception.requiresHumanIntervention,
      })),
    ),
  );

  const reviews: ProjectReviewRecord[] = rawState.reviews.map((reviewSeed) => {
    const projectId = normalizeProjectId(reviewSeed.projectKey);
    const review: ReviewSummary = {
      ...createMeta(normalizeReviewId(reviewSeed.projectKey), "2026-04-02T09:20:00+08:00", "2026-04-02T10:20:00+08:00"),
      projectId,
      verdict: reviewSeed.verdict,
      resultSummary: reviewSeed.resultSummary,
      attributionSummary: reviewSeed.attributionSummary,
      attributionFactors: reviewSeed.attributionFactors.map((factor, index) => ({
        id: normalizeEntityId("attr", `${reviewSeed.projectKey}-${index}`),
        ...factor,
      })),
      lessonsLearned: reviewSeed.lessonsLearned,
      recommendations: reviewSeed.recommendations,
    };

    const candidates: AssetCandidate[] = reviewSeed.assetCandidates.map((candidate) => ({
      ...createMeta(
        normalizeCandidateId(candidate.candidateKey),
        "2026-04-02T09:30:00+08:00",
        "2026-04-02T10:10:00+08:00",
      ),
      projectId,
      type: candidate.type,
      title: candidate.title,
      rationale: candidate.rationale,
      approvalStatus: candidate.approvalStatus,
      applicability: toApplicabilitySpec(candidate.applicability, "review_capture", candidate.type),
    }));

    return {
      projectId,
      review,
      lineage: governanceState.reviewLineages.find((lineage) => lineage.projectId === projectId) ?? null,
      candidates,
      publishedAssets: knowledgeAssets.filter((asset) => asset.sourceProjectId === projectId),
    };
  });

  const reviewByProjectId = new Map(reviews.map((review) => [review.projectId, review]));
  const snapshotByProjectId = new Map<string, ProjectRealtimeSnapshot>();

  const projects: ProjectObject[] = rawState.projects.map((projectSeed) => {
    const projectId = normalizeProjectId(projectSeed.projectKey);
    const projectActions = actionItems.filter((action) => action.sourceProjectId === projectId);
    const projectExecutionLogs = executionLogs.filter((log) =>
      projectActions.some((action) => action.id === log.actionId),
    );
    const projectApprovals = approvals.filter((approval) =>
      projectActions.some((action) => action.id === approval.actionId),
    );
    const performance = performanceByProject.get(projectSeed.projectKey);
    const definitionSeed = definitionsByProject.get(projectSeed.projectKey);
    const identity = identitiesByProjectId.get(projectId)!;
    const relatedKnowledge = knowledgeAssets.filter(
      (asset) => asset.stage === projectSeed.stage || asset.sourceProjectId === projectId,
    );
    const projectReview = reviewByProjectId.get(projectId);

    const realtime: ProjectRealtimeSnapshot = {
      projectId,
      status: deriveProjectStatus(
        projectId,
        projectSeed.stage,
        projectActions,
        performance?.pendingApprovalCount ?? 0,
        performance?.criticalExceptionCount ?? 0,
        governanceState,
        projectReview?.publishedAssets.length ?? 0,
      ),
      health: performance?.health ?? projectSeed.health,
      riskLevel: performance?.riskLevel ?? projectSeed.riskLevel,
      keyBlocker: performance?.keyBlocker ?? projectSeed.keyBlocker,
      latestPulse: performance?.latestPulse ?? projectSeed.latestPulse,
      pendingApprovalCount: performance?.pendingApprovalCount ?? 0,
      runningAgentCount: performance?.runningAgentCount ?? 0,
      criticalExceptionCount: performance?.criticalExceptionCount ?? 0,
      kpis: {
        metrics: performance?.kpis ?? [],
        updatedAt: "2026-04-02T10:50:00+08:00",
      },
      updatedAt: "2026-04-02T10:50:00+08:00",
    };
    snapshotByProjectId.set(projectId, realtime);

    const decisionContext = buildDecisionContext(
      projectId,
      projectSeed,
      realtime,
      projectApprovals,
      projectExecutionLogs,
      relatedKnowledge,
      exceptions.filter((exception) => exception.projectId === projectId),
    );

    const decisionObject = buildDecisionObject(
      projectId,
      projectSeed,
      decisionContext,
      projectActions,
      governanceState,
    );

    const definition = definitionSeed
      ? {
          ...createMeta(
            normalizeEntityId("definition", projectSeed.projectKey),
            "2026-04-02T09:00:00+08:00",
            "2026-04-02T10:15:00+08:00",
          ),
          projectId,
          ...definitionSeed.definition,
        }
      : undefined;

    const samplingReview = definitionSeed?.samplingReview
      ? {
          ...createMeta(
            normalizeEntityId("sampling", projectSeed.projectKey),
            "2026-04-02T09:30:00+08:00",
            "2026-04-02T10:00:00+08:00",
          ),
          projectId,
          ...definitionSeed.samplingReview,
        }
      : undefined;

    const expression = definitionSeed?.expression
      ? {
          ...createMeta(
            normalizeEntityId("expression", projectSeed.projectKey),
            "2026-04-02T09:00:00+08:00",
            "2026-04-02T10:10:00+08:00",
          ),
          projectId,
          contentBrief: definitionSeed.expression.contentBrief,
          visualBrief: definitionSeed.expression.visualBrief,
          readinessStatus: definitionSeed.expression.readinessStatus,
          recommendedDirection: definitionSeed.expression.recommendedDirection,
          creativeVersions: definitionSeed.expression.creativeVersions.map((version, index) => ({
            ...createMeta(
              normalizeEntityId("creative", `${projectSeed.projectKey}-${index}`),
              "2026-04-02T09:05:00+08:00",
              "2026-04-02T10:05:00+08:00",
            ),
            projectId,
            ...version,
          })),
        }
      : undefined;

    const project: ProjectObject = {
      ...createMeta(projectId, "2026-04-02T09:00:00+08:00", realtime.updatedAt),
      type: projectSeed.type,
      name: projectSeed.name,
      stage: projectSeed.stage,
      status: realtime.status,
      owner: projectSeed.owner,
      stakeholders: projectSeed.stakeholders,
      priority: projectSeed.priority,
      health: realtime.health,
      riskLevel: realtime.riskLevel,
      targetSummary: projectSeed.targetSummary,
      statusSummary: projectSeed.statusSummary,
      latestPulse: realtime.latestPulse,
      keyBlocker: realtime.keyBlocker,
      identity,
      stageExitCriteria: [],
      availableTransitions: governanceState.transitionRules.filter((rule) => rule.fromStage === projectSeed.stage),
      allowedActionsByStage: governanceState.allowedActionsByStage.filter((item) => item.stage === projectSeed.stage),
      kpis: realtime.kpis,
      opportunitySignals: rawState.opportunitySignals
        .filter((signal) => signal.projectKey === projectSeed.projectKey)
        .map((signal) => ({
          id: normalizeEntityId("signal", signal.signalKey),
          type: signal.type,
          summary: signal.summary,
          strength: signal.strength,
          freshness: signal.freshness,
        })),
      opportunityAssessment:
        rawState.opportunitySignals.find((signal) => signal.projectKey === projectSeed.projectKey)?.assessment,
      decisionContext,
      decisionObject,
      definition,
      samplingReview,
      expression,
      actions: projectActions,
      approvals: projectApprovals,
      executionLogs: projectExecutionLogs,
      agentStates: (performance?.agentStates ?? []).map((agent, index) => ({
        ...createMeta(
          normalizeEntityId("agent", `${projectSeed.projectKey}-${index}`),
          "2026-04-02T09:00:00+08:00",
          "2026-04-02T10:35:00+08:00",
        ),
        projectId,
        agentType: agent.agentType,
        status: agent.status,
        summary: agent.summary,
        waitingReason: agent.waitingReason,
        lastActionSummary: agent.lastActionSummary,
      })),
      review: projectReview?.review ?? undefined,
      reviewLineage: projectReview?.lineage ?? undefined,
      assetCandidates: projectReview?.candidates,
      publishedAssets: projectReview?.publishedAssets,
    };

    project.stageExitCriteria = buildStageExitCriteria(project, realtime);
    const failedExitCriteria = project.stageExitCriteria.filter((item) => item.blocking && item.status !== "passed");
    project.transitionBlockReason = failedExitCriteria[0]?.description;
    return project;
  });

  const pulses = sortByUpdatedAtDesc(
    rawState.projects.flatMap((projectSeed, index) =>
      projectSeed.roleAudiences.map((audience, audienceIndex) => ({
        ...createMeta(
          normalizeEntityId("pulse", `${projectSeed.projectKey}-${audience}-${audienceIndex}`),
          "2026-04-02T09:20:00+08:00",
          "2026-04-02T10:50:00+08:00",
        ),
        audience,
        category:
          projectSeed.stage === "opportunity_pool"
            ? "opportunity"
            : projectSeed.stage === "review_capture"
              ? "review"
              : projectSeed.riskLevel === "high"
                ? "risk"
                : "resource",
        summary:
          index === 0 && audience === "ceo"
            ? `今日最值得拍板的是「${projectSeed.name}」的推进方式。`
            : `${projectSeed.name}：${projectSeed.latestPulse}`,
        severity: projectSeed.riskLevel,
        relatedProjectId: normalizeProjectId(projectSeed.projectKey),
        freshness: "near_real_time",
      })),
    ),
  );

  const liveFeed: LiveSignalFeedItem[] = sortByUpdatedAtDesc([
    ...executionLogs.map((log, index) => ({
      ...createMeta(
        normalizeEntityId("live", `execution-${index}`),
        log.createdAt,
        log.updatedAt,
      ),
      projectId: actionItems.find((action) => action.id === log.actionId)?.sourceProjectId,
      type: "execution_update" as const,
      summary: log.summary,
    })),
    ...Array.from(snapshotByProjectId.values()).map((snapshot, index) => ({
      ...createMeta(
        normalizeEntityId("live", `snapshot-${index}`),
        snapshot.updatedAt,
        snapshot.updatedAt,
      ),
      projectId: snapshot.projectId,
      type: "metric_update" as const,
      summary: snapshot.latestPulse ?? `${snapshot.projectId} 状态更新`,
    })),
  ]).slice(0, 14);

  return {
    projects,
    identities: governanceState.identities,
    identityResolutionLogs: governanceState.identityResolutionLogs,
    transitionRules: governanceState.transitionRules,
    realtimeSnapshots: Array.from(snapshotByProjectId.values()),
    pulses,
    exceptions,
    liveFeed,
    knowledgeAssets,
    reviews,
    actionAuditTrails: governanceState.actionAuditTrails,
    executionWritebackRecords: governanceState.executionWritebackRecords,
    hitlPolicies: governanceState.hitlPolicies,
    assetLineages: governanceState.assetLineages,
  };
}
