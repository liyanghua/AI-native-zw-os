import { getProjectDetail } from "./projects.mjs";
import { getProjectKnowledge } from "./knowledge.mjs";
import { normalizeRoleType } from "./roleProfiles.mjs";

function now() {
  return new Date().toISOString();
}

function metricValue(detail, metricName) {
  return detail.kpis.find((metric) => metric.metricName === metricName)?.metricValue;
}

function metricUnit(detail, metricName) {
  return detail.kpis.find((metric) => metric.metricName === metricName)?.metricUnit;
}

function formatMetric(metric) {
  if (metric.metricUnit === "currency") {
    return `¥${metric.metricValue.toLocaleString("zh-CN")}`;
  }
  if (metric.metricUnit === "%") {
    return `${metric.metricValue}%`;
  }
  return `${metric.metricValue}`;
}

function buildDiagnosis(detail) {
  if (detail.project.stage === "launch_validation") {
    return "点击强但转化弱，说明用户愿意进入详情，但价格表达和承接页说服力不足。";
  }
  if (detail.project.stage === "growth_optimization") {
    return "增长效率在下滑，当前更需要收缩低效预算并重新组织素材和人群。";
  }
  if (detail.project.stage === "review_capture") {
    return "项目已具备复盘沉淀条件，当前重点是把成功经验结构化为可复用资产。";
  }
  return detail.latestSnapshot?.currentProblem ?? "需要先明确当前项目的核心经营问题。";
}

function buildFactEvidence(detail) {
  const entries = [];
  const timestamp = now();

  if (detail.latestSnapshot) {
    entries.push({
      id: detail.latestSnapshot.snapshotId,
      createdAt: detail.latestSnapshot.createdAt,
      updatedAt: detail.latestSnapshot.createdAt,
      type: "history",
      layer: "fact",
      summary: detail.latestSnapshot.summary,
      sourceLabel: "项目快照",
      relatedProjectId: detail.project.projectId,
      updatedAtLabel: detail.latestSnapshot.createdAt,
    });
  }

  detail.kpis.forEach((metric) => {
    entries.push({
      id: `fact-${detail.project.projectId}-${metric.metricId}`,
      createdAt: metric.capturedAt,
      updatedAt: metric.capturedAt,
      type: "metric",
      layer: "fact",
      summary: `${metric.metricName.toUpperCase()} 当前为 ${formatMetric(metric)}`,
      sourceLabel: "KPI 指标",
      relatedProjectId: detail.project.projectId,
      updatedAtLabel: metric.capturedAt,
    });
  });

  detail.risks.forEach((risk) => {
    entries.push({
      id: `fact-${detail.project.projectId}-${risk.riskId}`,
      createdAt: risk.createdAt,
      updatedAt: risk.createdAt,
      type: "history",
      layer: "fact",
      summary: `风险输入：${risk.description}`,
      sourceLabel: "风险信号",
      relatedProjectId: detail.project.projectId,
      updatedAtLabel: risk.createdAt,
    });
  });

  detail.opportunities.forEach((opportunity) => {
    entries.push({
      id: `fact-${detail.project.projectId}-${opportunity.opportunityId}`,
      createdAt: opportunity.createdAt,
      updatedAt: opportunity.createdAt,
      type: "history",
      layer: "fact",
      summary: `商机输入：${opportunity.title}`,
      sourceLabel: "商机信号",
      relatedProjectId: detail.project.projectId,
      updatedAtLabel: opportunity.createdAt,
    });
  });

  detail.actions.forEach((action) => {
    entries.push({
      id: `fact-${detail.project.projectId}-${action.actionId}`,
      createdAt: action.createdAt,
      updatedAt: action.updatedAt,
      type: "history",
      layer: "fact",
      summary: `动作记录：${action.description}`,
      sourceLabel: "历史动作",
      relatedProjectId: detail.project.projectId,
      updatedAtLabel: action.updatedAt,
    });
  });

  if (detail.latestReview) {
    entries.push({
      id: `fact-${detail.project.projectId}-${detail.latestReview.reviewId}`,
      createdAt: detail.latestReview.createdAt,
      updatedAt: detail.latestReview.createdAt,
      type: "history",
      layer: "fact",
      summary: `复盘结果：${detail.latestReview.reviewSummary}`,
      sourceLabel: "最新复盘",
      relatedProjectId: detail.project.projectId,
      updatedAtLabel: detail.latestReview.createdAt,
    });
  }

  return entries.map((entry) => ({
    ...entry,
    createdAt: entry.createdAt ?? timestamp,
    updatedAt: entry.updatedAt ?? timestamp,
  }));
}

function buildMethodEvidence(knowledge) {
  return knowledge.matchedChunks.slice(0, 6).map((chunk) => {
    const asset = knowledge.matchedAssets.find((candidate) => candidate.assetId === chunk.assetId);
    return {
      id: chunk.chunkId,
      createdAt: asset?.createdAt ?? knowledge.generatedAt,
      updatedAt: asset?.updatedAt ?? knowledge.generatedAt,
      type: asset?.assetType ?? "rule",
      layer: "method",
      summary: chunk.chunkText,
      sourceLabel: asset ? `${asset.assetType} · ${asset.title}` : "知识切片",
      relatedProjectId: knowledge.projectId,
      applicability: asset?.applicability,
      updatedAtLabel: asset?.updatedAt,
    };
  });
}

function buildMissingEvidenceFlags(detail, knowledge) {
  const flags = [];
  if (detail.kpis.length === 0) {
    flags.push("缺少 KPI 指标输入");
  }
  if (detail.risks.length === 0) {
    flags.push("缺少风险输入");
  }
  if (detail.opportunities.length === 0) {
    flags.push("缺少商机输入");
  }
  if (knowledge.matchedChunks.length < 2) {
    flags.push("method evidence 少于 2 条");
  }
  if (!knowledge.matchedAssets.some((asset) => asset.stage === detail.project.stage)) {
    flags.push("当前阶段没有命中对应 stage 的知识");
  }
  return flags;
}

function buildRecommendedActions(detail, evidencePack) {
  const commonConfidence = evidencePack.missingEvidenceFlags.length > 0 ? "medium" : "high";
  const dueAt = now();

  if (detail.project.stage === "launch_validation") {
    return [
      {
        actionId: "action-launch-adjust-launch-plan",
        actionType: "adjust_launch_plan",
        description: "重新组织首发节奏，优先验证价格承接和流量结构是否压制转化。",
        owner: detail.project.owner,
        dueAt,
        expectedMetric: "cvr",
        expectedDirection: "up",
        requiredApproval: true,
        confidence: commonConfidence,
        supportingEvidenceRefs: evidencePack.refs.slice(0, 4).map((item) => item.id),
      },
      {
        actionId: "action-launch-refresh-main-visual",
        actionType: "refresh_main_visual",
        description: "重做主图与首屏承接表达，减少点击后流失并提高创意一致性。",
        owner: "视觉/内容负责人",
        dueAt,
        expectedMetric: "ctr",
        expectedDirection: "up",
        requiredApproval: false,
        confidence: commonConfidence,
        supportingEvidenceRefs: evidencePack.refs.slice(0, 4).map((item) => item.id),
      },
    ];
  }

  if (detail.project.stage === "growth_optimization") {
    return [
      {
        actionId: "action-growth-budget-reallocation",
        actionType: "pause_low_roi_action",
        description: "暂停低 ROI 放量动作，并把预算重配到高意图人群和更强素材组合。",
        owner: detail.project.owner,
        dueAt,
        expectedMetric: "roi",
        expectedDirection: "up",
        requiredApproval: true,
        confidence: commonConfidence,
        supportingEvidenceRefs: evidencePack.refs.slice(0, 4).map((item) => item.id),
      },
    ];
  }

  return [
    {
      actionId: "action-review-refine-product-definition",
      actionType: "refine_product_definition",
      description: "把复盘结论沉淀成下一轮商品定义与 launch checklist 规则。",
      owner: detail.project.owner,
      dueAt,
      expectedMetric: "conversion_count",
      expectedDirection: "stable",
      requiredApproval: false,
      confidence: commonConfidence,
      supportingEvidenceRefs: evidencePack.refs.slice(0, 4).map((item) => item.id),
    },
  ];
}

function buildDecisionOptions(detail, recommendedActions) {
  return recommendedActions.map((action, index) => ({
    id: `${detail.project.projectId}-option-${index + 1}`,
    title: action.description,
    summary: action.description,
    expectedImpact: `推动 ${action.expectedMetric} 向 ${action.expectedDirection} 方向改善`,
    risk: action.requiredApproval ? "high" : "medium",
    resourcesNeeded: action.owner,
    validationWindow: "7 天内观察一轮核心指标变化",
    autoExecutable: false,
    constraints: action.requiredApproval ? ["需要人工审批"] : [],
  }));
}

export function compileDecisionContext(db, projectId) {
  const detail = getProjectDetail(db, projectId);
  if (!detail) {
    return null;
  }

  const knowledge = getProjectKnowledge(db, projectId);
  const diagnosis = buildDiagnosis(detail);
  const factEvidence = buildFactEvidence(detail);
  const methodEvidence = buildMethodEvidence(knowledge);
  const missingEvidenceFlags = buildMissingEvidenceFlags(detail, knowledge);
  const timestamp = now();

  const decisionContext = {
    id: `decision-context-${projectId}`,
    projectId,
    stage: detail.project.stage,
    goalSpec: detail.latestSnapshot?.currentGoal ?? "明确项目下一步动作",
    currentStateSummary: detail.latestSnapshot?.summary ?? diagnosis,
    diagnosis,
    evidencePack: {
      factEvidence,
      methodEvidence,
      refs: [...factEvidence, ...methodEvidence],
      summary: `${factEvidence.length} 条事实证据，${methodEvidence.length} 条方法证据`,
      generatedAt: timestamp,
      retrievalTrace: knowledge.retrievalTrace,
      missingEvidenceFlags,
    },
    compiledBy: "local-brain",
    compilerVersion: "batch2-rule-engine",
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  return {
    decisionContext,
    projectSnapshot: detail.latestSnapshot,
    kpiSummary: detail.kpis,
    risks: detail.risks,
    opportunities: detail.opportunities,
    matchedKnowledge: knowledge,
    missingEvidenceFlags,
  };
}

export function compileDecisionObject(db, projectId) {
  const contextBundle = compileDecisionContext(db, projectId);
  if (!contextBundle) {
    return null;
  }

  const detail = getProjectDetail(db, projectId);
  const evidencePack = contextBundle.decisionContext.evidencePack;
  const recommendedActions = buildRecommendedActions(detail, evidencePack);
  const requiresHumanApproval = recommendedActions.some((action) => action.requiredApproval);
  const timestamp = now();
  const diagnosis = contextBundle.decisionContext.diagnosis;
  const decisionId = `decision-${projectId}`;

  const decisionObject = {
    id: decisionId,
    decisionId,
    projectId,
    stage: detail.project.stage,
    decisionVersion: 1,
    decisionContextId: contextBundle.decisionContext.id,
    goalSpec: contextBundle.decisionContext.goalSpec,
    currentStateSummary: contextBundle.decisionContext.currentStateSummary,
    diagnosis,
    problemOrOpportunity: detail.latestSnapshot?.currentProblem ?? diagnosis,
    rationale: `${detail.latestSnapshot?.currentRisk ?? "当前风险需要控制"}；同时项目已命中 ${evidencePack.methodEvidence.length} 条方法证据。`,
    rootCauseSummary: diagnosis,
    options: buildDecisionOptions(detail, recommendedActions),
    recommendedOptionId: `${detail.project.projectId}-option-1`,
    recommendedActions,
    risks: detail.risks.map((risk) => risk.description),
    approvalsRequired: requiresHumanApproval
      ? ["老板拍板预算/价格调整类动作"]
      : [],
    expectedImpact:
      detail.project.stage === "launch_validation"
        ? "提升 CVR 并减少低效点击浪费"
        : detail.project.stage === "growth_optimization"
          ? "稳定 ROI 并恢复增长效率"
          : "把成功经验沉淀成复用资产",
    validationPlan: {
      window: "7 天",
      primaryMetric:
        detail.project.stage === "growth_optimization"
          ? "roi"
          : detail.project.stage === "review_capture"
            ? "conversion_count"
            : "cvr",
      expectedDirection:
        detail.project.stage === "review_capture"
          ? "stable"
          : "up",
      successCriteria: [
        "主指标出现预期方向变化",
        "风险没有继续恶化",
      ],
      rollbackHint: "若主指标未改善，则回退到上一轮方案并重新补证据。",
    },
    confidence: evidencePack.missingEvidenceFlags.length > 0 ? "medium" : "high",
    requiresHumanApproval,
    evidencePack,
    evidenceRefs: evidencePack.refs.map((item) => item.id),
    pendingQuestions: evidencePack.missingEvidenceFlags,
    compiledAt: timestamp,
    compiledBy: "local-brain",
    compilerVersion: "batch2-rule-engine",
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  return {
    decisionObject,
    evidencePack,
  };
}

export function compileRoleStory(db, projectId, role) {
  const normalizedRole = normalizeRoleType(role);
  const detail = getProjectDetail(db, projectId);
  const decisionBundle = compileDecisionObject(db, projectId);
  if (!detail || !decisionBundle || !normalizedRole) {
    return null;
  }

  const pendingApprovals = decisionBundle.decisionObject.recommendedActions
    .filter((action) => action.requiredApproval)
    .map((action) => `${action.description}（${action.owner}）`);
  const recentOutcomes = detail.latestReview
    ? [detail.latestReview.reviewSummary]
    : detail.kpis.slice(0, 2).map((metric) => `${metric.metricName.toUpperCase()} ${formatMetric(metric)}`);

  if (normalizedRole === "boss") {
    return {
      role: normalizedRole,
      projectId,
      storySummary: `${detail.project.name} 当前最大问题是 ${decisionBundle.decisionObject.problemOrOpportunity}，需要围绕 ${decisionBundle.decisionObject.expectedImpact} 决定是否拍板。`,
      topIssues: [
        detail.latestSnapshot?.currentProblem ?? decisionBundle.decisionObject.diagnosis,
        detail.latestSnapshot?.currentRisk ?? "需要继续观察风险",
      ],
      keyDecisions: [
        `当前建议：${decisionBundle.decisionObject.recommendedActions[0].description}`,
        `预期影响：${decisionBundle.decisionObject.expectedImpact}`,
      ],
      recommendedActions: decisionBundle.decisionObject.recommendedActions,
      pendingApprovals,
      recentOutcomes,
    };
  }

  if (normalizedRole === "operations_director") {
    return {
      role: normalizedRole,
      projectId,
      storySummary: `${detail.project.name} 需要把“${decisionBundle.decisionObject.diagnosis}”转成推进动作，并明确谁负责、谁需要协调、何时升级。`,
      topIssues: [
        decisionBundle.decisionObject.diagnosis,
        detail.latestSnapshot?.currentRisk ?? "需要继续观察风险",
        ...decisionBundle.evidencePack.missingEvidenceFlags,
      ].slice(0, 3),
      keyDecisions: decisionBundle.decisionObject.recommendedActions.map(
        (action) => `${action.owner} 执行：${action.description}`,
      ),
      recommendedActions: decisionBundle.decisionObject.recommendedActions,
      pendingApprovals,
      recentOutcomes,
    };
  }

  if (normalizedRole === "product_rnd_director") {
    return {
      role: normalizedRole,
      projectId,
      storySummary: `${detail.project.name} 需要从商品定义、验证节点和复用经验三个角度判断是否继续推进。`,
      topIssues: [
        detail.latestSnapshot?.currentProblem ?? decisionBundle.decisionObject.diagnosis,
        detail.opportunities[0]?.title ?? "需要继续明确品类/商品机会",
        ...decisionBundle.evidencePack.missingEvidenceFlags,
      ].slice(0, 3),
      keyDecisions: [
        `商品方向判断：${detail.latestSnapshot?.currentGoal ?? "待补充目标"}`,
        `推荐动作：${decisionBundle.decisionObject.recommendedActions[0]?.description ?? "待补充"}`,
      ],
      recommendedActions: decisionBundle.decisionObject.recommendedActions,
      pendingApprovals,
      recentOutcomes,
    };
  }

  return {
    role: normalizedRole,
    projectId,
    storySummary: `${detail.project.name} 当前更需要解决表达与创意承接问题，并把有效素材方法沉淀成可复用模板。`,
    topIssues: [
      detail.latestSnapshot?.currentProblem ?? decisionBundle.decisionObject.diagnosis,
      metricValue(detail, "ctr") && metricValue(detail, "cvr") && metricValue(detail, "ctr") > metricValue(detail, "cvr")
        ? "CTR 与 CVR 表现出现脱节，需检查表达承接"
        : "需要继续明确视觉表达问题",
      ...decisionBundle.evidencePack.missingEvidenceFlags,
    ].slice(0, 3),
    keyDecisions: decisionBundle.decisionObject.recommendedActions.map((action) =>
      action.actionType === "refresh_main_visual" ||
      action.actionType === "iterate_video_asset" ||
      action.actionType === "revise_detail_page" ||
      action.actionType === "support_launch_creative"
        ? `优先创意动作：${action.description}`
        : `协同动作：${action.description}`,
    ),
    recommendedActions: decisionBundle.decisionObject.recommendedActions.filter(
      (action) =>
        action.actionType === "refresh_main_visual" ||
        action.actionType === "iterate_video_asset" ||
        action.actionType === "revise_detail_page" ||
        action.actionType === "support_launch_creative",
    ).length > 0
      ? decisionBundle.decisionObject.recommendedActions.filter(
          (action) =>
            action.actionType === "refresh_main_visual" ||
            action.actionType === "iterate_video_asset" ||
            action.actionType === "revise_detail_page" ||
            action.actionType === "support_launch_creative",
        )
      : decisionBundle.decisionObject.recommendedActions,
    pendingApprovals,
    recentOutcomes,
  };
}
