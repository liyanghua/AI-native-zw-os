import { openDatabase } from "./client.mjs";
import { initLocalSandboxDatabase } from "./init.mjs";
import { chunkMarkdownAsset } from "./knowledge.mjs";
import { listRoleProfiles } from "./roleProfiles.mjs";

const timestamps = {
  created: "2026-04-02T09:00:00+08:00",
  updated: "2026-04-02T10:30:00+08:00",
  recent: "2026-04-02T11:15:00+08:00",
};

const projects = [
  {
    projectId: "local-launch-breeze-bag",
    name: "云感通勤包首发验证",
    stage: "launch_validation",
    status: "active",
    owner: "赵颖",
    priority: 92,
    category: "通勤女包",
    snapshot: {
      summary: "首发流量表现不错，但转化没有跟上，当前更像是价格和承接页问题。",
      currentProblem: "CTR 高但 CVR 低，说明用户愿意点进来，但没有完成购买。",
      currentGoal: "先找到压制首发转化的关键因素，再决定是调价还是补表达。",
      currentRisk: "继续放量会放大低转化带来的预算浪费。",
      createdAt: "2026-04-02T10:20:00+08:00",
    },
    metrics: [
      { metricId: "metric-launch-ctr", metricName: "ctr", metricValue: 4.8, metricUnit: "%", metricDirection: "up" },
      { metricId: "metric-launch-cvr", metricName: "cvr", metricValue: 1.1, metricUnit: "%", metricDirection: "down" },
      { metricId: "metric-launch-gmv", metricName: "gmv", metricValue: 18600, metricUnit: "currency", metricDirection: "flat" },
    ],
    opportunities: [
      {
        opportunityId: "opp-launch-breeze-priceband",
        title: "同价位轻量通勤包搜索热度持续升高",
        signalType: "trend",
        description: "近 7 天轻量通勤包关键词点击率提升，说明人群兴趣正在放大。",
        priority: 1,
      },
    ],
    risks: [
      {
        riskId: "risk-launch-low-cvr",
        riskType: "conversion_drop",
        riskLevel: "high",
        description: "当前 CVR 明显低于预期，继续放量会扩大浪费。",
      },
    ],
    actions: [
      {
        actionId: "action-launch-adjust-launch-plan",
        decisionId: "decision-local-launch-breeze-bag",
        role: "operations_director",
        actionDomain: "operations",
        actionType: "adjust_launch_plan",
        description: "重新组织首发计划，先收缩低效流量并验证价格承接假设。",
        owner: "赵颖",
        requiredApproval: 1,
        approvalStatus: "pending",
        executionStatus: "suggested",
        expectedMetric: "cvr",
        expectedDirection: "up",
        confidence: "high",
      },
      {
        actionId: "action-launch-push-stage-transition",
        decisionId: "decision-local-launch-breeze-bag",
        role: "operations_director",
        actionDomain: "operations",
        actionType: "push_stage_transition",
        description: "完成首发承接页修正后，推动项目进入下一轮验证观察。",
        owner: "赵颖",
        requiredApproval: 0,
        approvalStatus: "not_required",
        executionStatus: "completed",
        expectedMetric: "cvr",
        expectedDirection: "up",
        confidence: "medium",
      },
      {
        actionId: "action-launch-refresh-main-visual",
        decisionId: "decision-local-launch-breeze-bag",
        role: "visual_director",
        actionDomain: "visual",
        actionType: "refresh_main_visual",
        description: "重做主图和首屏承接表达，减少点击后流失。",
        owner: "林乔",
        requiredApproval: 0,
        approvalStatus: "not_required",
        executionStatus: "suggested",
        expectedMetric: "ctr",
        expectedDirection: "up",
        confidence: "medium",
      },
    ],
    approvals: [],
    executionRuns: [
      {
        runId: "run-launch-push-stage-transition",
        actionId: "action-launch-push-stage-transition",
        role: "operations_director",
        actionDomain: "operations",
        agentName: "operations-agent",
        connectorName: "mock-operations-connector",
        requestPayload: {
          actionDomain: "operations",
          transitionGoal: "进入下一轮 launch validation 观察",
        },
        responsePayload: {
          resultStatus: "completed",
          changedMetrics: [
            {
              metricName: "cvr",
              previousValue: 1.1,
              newValue: 1.3,
              metricUnit: "%",
            },
          ],
          riskChange: "承接页修正后，低转化继续放量的风险有所回落。",
        },
        resultStatus: "completed",
        startedAt: "2026-04-02T10:30:00+08:00",
        finishedAt: "2026-04-02T10:36:00+08:00",
      },
    ],
    executionLogs: [
      {
        logId: "log-launch-push-stage-transition-triggered",
        actionId: "action-launch-push-stage-transition",
        runId: "run-launch-push-stage-transition",
        logType: "agent_triggered",
        message: "运营 Agent 已接手阶段推进动作。",
        createdAt: "2026-04-02T10:30:00+08:00",
      },
      {
        logId: "log-launch-push-stage-transition-completed",
        actionId: "action-launch-push-stage-transition",
        runId: "run-launch-push-stage-transition",
        logType: "mock_execution_completed",
        message: "首发承接修正已完成，进入下一轮验证观察。",
        createdAt: "2026-04-02T10:36:00+08:00",
      },
    ],
    writebackRecords: [
      {
        writebackId: "writeback-launch-push-stage-transition",
        actionId: "action-launch-push-stage-transition",
        runId: "run-launch-push-stage-transition",
        targetType: "project_snapshot",
        targetId: "local-launch-breeze-bag",
        payloadHash: "seed-launch-push-stage-transition",
        resultStatus: "succeeded",
        errorMessage: null,
        createdAt: "2026-04-02T10:37:00+08:00",
      },
    ],
  },
  {
    projectId: "local-growth-travel-pro",
    name: "轻旅商务包增长优化",
    stage: "growth_optimization",
    status: "blocked",
    owner: "张伟",
    priority: 96,
    category: "商务男包",
    snapshot: {
      summary: "投放预算拉高后，ROI 反而持续下滑，当前更需要重新分配增长策略。",
      currentProblem: "花费上升但 ROI 下滑，说明增长效率已经触碰到瓶颈。",
      currentGoal: "判断是素材疲劳、受众偏移还是库存协同出了问题。",
      currentRisk: "继续用当前投放策略会挤压整体利润空间。",
      createdAt: "2026-04-02T10:45:00+08:00",
    },
    metrics: [
      { metricId: "metric-growth-roi", metricName: "roi", metricValue: 1.6, metricUnit: "score", metricDirection: "down" },
      { metricId: "metric-growth-spend", metricName: "impressions", metricValue: 128000, metricUnit: "count", metricDirection: "up" },
      { metricId: "metric-growth-profit", metricName: "profit", metricValue: 9200, metricUnit: "currency", metricDirection: "down" },
    ],
    opportunities: [
      {
        opportunityId: "opp-growth-bundle",
        title: "高客单配件联卖仍有放大空间",
        signalType: "bundle_opportunity",
        description: "历史复盘显示，高客单组合装仍有客单提升空间。",
        priority: 1,
      },
    ],
    risks: [
      {
        riskId: "risk-growth-roi-drop",
        riskType: "roi_decline",
        riskLevel: "critical",
        description: "ROI 连续 3 个观测窗口下行，必须暂停当前放量策略。",
      },
    ],
    actions: [
      {
        actionId: "action-growth-budget-reallocation",
        decisionId: "decision-local-growth-travel-pro",
        role: "operations_director",
        actionDomain: "operations",
        actionType: "pause_low_roi_action",
        description: "暂停低 ROI 放量动作，并把预算重配到高意图组合。",
        owner: "张伟",
        requiredApproval: 1,
        approvalStatus: "pending",
        executionStatus: "suggested",
        expectedMetric: "roi",
        expectedDirection: "up",
        confidence: "high",
      },
    ],
    approvals: [],
    executionRuns: [],
    executionLogs: [],
    writebackRecords: [],
  },
  {
    projectId: "local-review-office-classic",
    name: "经典办公包复盘沉淀",
    stage: "review_capture",
    status: "closed",
    owner: "李安",
    priority: 78,
    category: "办公通勤包",
    snapshot: {
      summary: "项目已完成主要动作回合，复盘表明表达统一和价格说明显著提升了成交。",
      currentProblem: "需要把成功经验沉淀成可复用模板，而不是只留在项目结论里。",
      currentGoal: "形成 review 与 asset candidate，为下一轮同类项目复用。",
      currentRisk: "如果不沉淀，下一轮仍会重复走同样的试错路径。",
      createdAt: "2026-04-02T09:50:00+08:00",
    },
    metrics: [
      { metricId: "metric-review-gmv", metricName: "gmv", metricValue: 32500, metricUnit: "currency", metricDirection: "up" },
      { metricId: "metric-review-cvr", metricName: "cvr", metricValue: 2.9, metricUnit: "%", metricDirection: "up" },
      { metricId: "metric-review-orders", metricName: "orders", metricValue: 186, metricUnit: "count", metricDirection: "up" },
    ],
    opportunities: [
      {
        opportunityId: "opp-review-template",
        title: "同类办公包项目可复用表达模板",
        signalType: "reuse_signal",
        description: "本项目的详情页组织方式已验证有效，适合沉淀为模板。",
        priority: 1,
      },
    ],
    risks: [
      {
        riskId: "risk-review-lineage",
        riskType: "knowledge_loss",
        riskLevel: "medium",
        description: "如果不补 review/asset 结构，经验会重新散落到人工总结里。",
      },
    ],
    actions: [
      {
        actionId: "action-review-refine-product-definition",
        decisionId: "decision-local-review-office-classic",
        role: "product_rnd_director",
        actionDomain: "product_rnd",
        actionType: "refine_product_definition",
        description: "把办公包成功卖点沉淀成下一轮新品定义与 SKU 判断规则。",
        owner: "林乔",
        requiredApproval: 0,
        approvalStatus: "approved",
        executionStatus: "completed",
        expectedMetric: "conversion_count",
        expectedDirection: "stable",
        confidence: "high",
      },
    ],
    approvals: [
      {
        approvalId: "approval-review-refine-product-definition",
        actionId: "action-review-refine-product-definition",
        role: "product_rnd_director",
        approvalStatus: "approved",
        approvedBy: "李安",
        reason: "允许把项目经验沉淀为下一轮商品定义规则。",
        createdAt: "2026-04-02T10:40:00+08:00",
        updatedAt: "2026-04-02T10:40:00+08:00",
      },
    ],
    executionRuns: [
      {
        runId: "run-review-refine-product-definition",
        actionId: "action-review-refine-product-definition",
        role: "product_rnd_director",
        actionDomain: "product_rnd",
        agentName: "product-rnd-agent",
        connectorName: "mock-product-rnd-connector",
        requestPayload: {
          actionDomain: "product_rnd",
          productDirection: "办公包通勤场景",
          refinementGoal: "沉淀下一轮新品定义规则",
        },
        responsePayload: {
          resultStatus: "completed",
          productDefinitionUpdate: "明确首屏卖点、材质说明、价格承诺三件套",
          launchReadiness: "captured_for_reuse",
        },
        resultStatus: "completed",
        startedAt: "2026-04-02T10:42:00+08:00",
        finishedAt: "2026-04-02T10:46:00+08:00",
      },
    ],
    executionLogs: [
      {
        logId: "log-review-refine-product-definition-created",
        actionId: "action-review-refine-product-definition",
        runId: "run-review-refine-product-definition",
        logType: "agent_triggered",
        message: "商品研发 Agent 已接管复盘沉淀动作。",
        createdAt: "2026-04-02T10:42:00+08:00",
      },
      {
        logId: "log-review-refine-product-definition-completed",
        actionId: "action-review-refine-product-definition",
        runId: "run-review-refine-product-definition",
        logType: "mock_execution_completed",
        message: "已完成商品定义收敛，并输出可复用规则。",
        createdAt: "2026-04-02T10:46:00+08:00",
      },
      {
        logId: "log-review-refine-product-definition-writeback",
        actionId: "action-review-refine-product-definition",
        runId: "run-review-refine-product-definition",
        logType: "writeback_succeeded",
        message: "执行结果已回写到项目复盘与资产候选上下文。",
        createdAt: "2026-04-02T10:48:00+08:00",
      },
    ],
    writebackRecords: [
      {
        writebackId: "writeback-review-refine-product-definition",
        actionId: "action-review-refine-product-definition",
        runId: "run-review-refine-product-definition",
        targetType: "project_snapshot",
        targetId: "snapshot-local-review-office-classic",
        payloadHash: "review-refine-product-definition-payload",
        resultStatus: "succeeded",
        errorMessage: null,
        createdAt: "2026-04-02T10:48:00+08:00",
      },
    ],
    review: {
      reviewId: "review-office-classic",
      sourceActionId: "action-review-refine-product-definition",
      sourceRunId: "run-review-refine-product-definition",
      reviewSummary: "复盘确认：表达统一、价格说明前置后，转化率稳定抬升。",
      reviewStatus: "approved",
      reviewType: "execution_review",
      reviewQualityScore: 92,
      isPromotedToAsset: 1,
      outcome: {
        verdict: "success",
        keyLearnings: ["详情页结构前置卖点", "价格说明与权益组合必须同屏出现"],
        metricImpact: "CVR 稳定上升并沉淀为下一轮商品定义规则",
        nextSuggestion: "转化经验可继续沉淀到办公包新品 launch checklist",
      },
      createdAt: "2026-04-02T10:55:00+08:00",
      updatedAt: "2026-04-02T11:20:00+08:00",
    },
    assetCandidates: [
      {
        candidateId: "candidate-office-classic-template",
        sourceReviewId: "review-office-classic",
        assetType: "template",
        title: "办公包详情页表达模板",
        contentMarkdown: "## 模板摘要\n- 首屏卖点\n- 价格说明\n- 通勤场景证明",
        reviewStatus: "approved",
        publishStatus: "candidate",
        reusabilityScore: 86,
        feedbackToKnowledge: "not_started",
        status: "draft",
        createdAt: "2026-04-02T11:05:00+08:00",
        updatedAt: "2026-04-02T11:20:00+08:00",
      },
      {
        candidateId: "candidate-office-classic-playbook",
        sourceReviewId: "review-office-classic",
        assetType: "case",
        title: "办公包复盘打法手册",
        contentMarkdown: "## 复盘打法\n- 统一卖点表达\n- 价格承诺前置\n- 通勤场景证明链路",
        reviewStatus: "approved",
        publishStatus: "published",
        reusabilityScore: 90,
        feedbackToKnowledge: "synced",
        status: "published",
        createdAt: "2026-04-02T11:08:00+08:00",
        updatedAt: "2026-04-02T11:25:00+08:00",
      },
    ],
    publishedAssets: [
      {
        assetId: "asset-office-classic-playbook",
        candidateId: "candidate-office-classic-playbook",
        sourceReviewId: "review-office-classic",
        assetType: "case",
        title: "办公包复盘打法手册",
        contentMarkdown: "## 复盘打法\n- 统一卖点表达\n- 价格承诺前置\n- 通勤场景证明链路",
        publishStatus: "published",
        publishedAt: "2026-04-02T11:25:00+08:00",
        createdAt: "2026-04-02T11:25:00+08:00",
        updatedAt: "2026-04-02T11:25:00+08:00",
      },
    ],
    evaluationRecords: [
      {
        evaluationId: "evaluation-review-office-classic",
        decisionId: "decision-local-review-office-classic",
        actionId: "action-review-refine-product-definition",
        runId: "run-review-refine-product-definition",
        reviewId: "review-office-classic",
        candidateId: "candidate-office-classic-playbook",
        evaluationType: "governance_eval",
        scoreJson: JSON.stringify({ score: 0.91, completeness: 1, reusable: 0.88 }),
        notes: "复盘、资产与知识回流链路完整，可作为 Batch 5 治理样本。",
        createdAt: "2026-04-02T11:28:00+08:00",
      },
    ],
    knowledgeFeedbackRecords: [
      {
        feedbackId: "feedback-office-classic-playbook",
        sourceType: "published_asset",
        sourceId: "asset-office-classic-playbook",
        targetAssetId: "asset-feedback-office-classic-playbook",
        feedbackMode: "promote_to_knowledge",
        status: "synced",
        createdAt: "2026-04-02T11:30:00+08:00",
      },
    ],
  },
];

const ontologyEntities = [
  {
    entityId: "ontology-stage-launch",
    entityType: "stage",
    entityName: "launch_validation",
    entityJson: JSON.stringify({ displayName: "launch_verification", meaning: "首发验证阶段" }),
  },
  {
    entityId: "ontology-stage-review",
    entityType: "stage",
    entityName: "review_capture",
    entityJson: JSON.stringify({ displayName: "review_closed", meaning: "复盘沉淀阶段" }),
  },
  {
    entityId: "ontology-rule-roi",
    entityType: "rule",
    entityName: "ROI 下滑需要人工关注",
    entityJson: JSON.stringify({ threshold: "连续3个窗口下滑", owner: "boss,growth_director" }),
  },
];

const stageRules = [
  {
    ruleId: "rule-launch-validation",
    stage: "launch_validation",
    ruleType: "exit_criteria",
    ruleText: "首发验证至少需要 CTR / CVR / GMV 三组指标齐全。",
    requiredFieldsJson: JSON.stringify(["summary", "current_problem", "current_goal", "kpis"]),
    exitCriteriaJson: JSON.stringify(["至少一个问题已被明确", "至少一个动作建议待进入下一批次"]),
  },
  {
    ruleId: "rule-growth-optimization",
    stage: "growth_optimization",
    ruleType: "risk_guardrail",
    ruleText: "增长优化阶段如 ROI 连续下滑，必须显式暴露风险。",
    requiredFieldsJson: JSON.stringify(["summary", "current_problem", "current_risk", "roi"]),
    exitCriteriaJson: JSON.stringify(["老板或总监已看到重点项目", "策略调整可进入后续 Batch"]),
  },
  {
    ruleId: "rule-review-capture",
    stage: "review_capture",
    ruleType: "knowledge_capture",
    ruleText: "复盘阶段至少要有 review 和 asset candidate 占位。",
    requiredFieldsJson: JSON.stringify(["review_summary", "asset_candidate"]),
    exitCriteriaJson: JSON.stringify(["可用于后续 review / asset loop 演示"]),
  },
];

const knowledgeAssets = [
  {
    assetId: "knowledge-launch-sop-conversion",
    title: "Launch Conversion Diagnosis SOP",
    assetType: "sop",
    stage: "launch_validation",
    role: "operations_director",
    sourceProjectId: null,
    applicability: {
      stage: ["launch_validation"],
      role: ["growth_director", "product_rd_director"],
      assetType: ["sop"],
      channel: "ecommerce",
      category: "通勤女包",
      businessGoal: "launch_conversion",
      priceBand: "mid",
      lifecycle: "launch",
      preconditions: ["ctr 高于基线", "cvr 低于预期"],
      exclusionConditions: ["库存严重不足"],
    },
    keywords: "ctr cvr conversion pricing creative launch",
    contentMarkdown: `## Diagnose launch conversion\nWhen CTR is strong but CVR is weak, inspect price framing first.\n\n## Checklist\n- compare price band with top reference\n- move coupon and shipping promise into hero block\n- keep detail page first screen focused on one promise`,
  },
  {
    assetId: "knowledge-launch-rule-pricing",
    title: "Price Adjustment Approval Rule",
    assetType: "rule",
    stage: "launch_validation",
    role: "boss",
    sourceProjectId: null,
    applicability: {
      stage: ["launch_validation"],
      role: ["ceo"],
      assetType: ["rule"],
      channel: "ecommerce",
      category: "通勤女包",
      businessGoal: "launch_conversion",
      priceBand: "mid",
      lifecycle: "launch",
      preconditions: ["需要改价", "预计影响 cvr"],
      exclusionConditions: ["毛利过低"],
    },
    keywords: "approval pricing margin cvr launch",
    contentMarkdown: `## Pricing guardrail\nAny launch-stage price adjustment that changes margin assumptions requires boss approval.\n\n## Decision rule\nIf conversion is low and price framing is the main hypothesis, run a controlled price test before scaling media.`,
  },
  {
    assetId: "knowledge-launch-template-hero",
    title: "Launch Hero Block Template",
    assetType: "template",
    stage: "launch_validation",
    role: "visual_director",
    sourceProjectId: null,
    applicability: {
      stage: ["launch_validation"],
      role: ["growth_director", "visual_director"],
      assetType: ["template"],
      channel: "ecommerce",
      category: "通勤女包",
      businessGoal: "launch_conversion",
      priceBand: "mid",
      lifecycle: "launch",
      preconditions: ["需要重做首屏表达"],
      exclusionConditions: [],
    },
    keywords: "hero template creative cvr detail page",
    contentMarkdown: `## Hero template\nHeadline, proof point, price promise and coupon should stay on one screen.\n\n## Landing continuity\nThe first three detail modules must repeat the same promise users clicked for.`,
  },
  {
    assetId: "knowledge-growth-case-roi",
    title: "ROI Recovery Case",
    assetType: "case",
    stage: "growth_optimization",
    role: "operations_director",
    sourceProjectId: "local-growth-travel-pro",
    applicability: {
      stage: ["growth_optimization"],
      role: ["growth_director"],
      assetType: ["case"],
      channel: "ecommerce",
      category: "商务男包",
      businessGoal: "roi_recovery",
      priceBand: "mid_high",
      lifecycle: "growth",
      preconditions: ["roi 下滑", "花费上升"],
      exclusionConditions: [],
    },
    keywords: "roi budget case growth creative audience",
    contentMarkdown: `## Growth case\nA travel bag project recovered ROI by cutting low-intent budget and reusing only the top creative set.\n\n## Why it worked\nThe team reduced spend on broad audiences and moved budget to remarketing plus bundle creatives.`,
  },
  {
    assetId: "knowledge-growth-rule-stoploss",
    title: "ROI Stop-Loss Rule",
    assetType: "rule",
    stage: "growth_optimization",
    role: "boss",
    sourceProjectId: null,
    applicability: {
      stage: ["growth_optimization"],
      role: ["ceo"],
      assetType: ["rule"],
      channel: "ecommerce",
      category: "商务男包",
      businessGoal: "roi_recovery",
      priceBand: "mid_high",
      lifecycle: "growth",
      preconditions: ["roi 连续下行"],
      exclusionConditions: [],
    },
    keywords: "roi stoploss budget rule approval growth",
    contentMarkdown: `## Stop-loss rule\nIf ROI drops across three observation windows while spend rises, stop expanding the current budget plan.\n\n## Approval note\nA reallocation plan should be reviewed before new budget is added.`,
  },
  {
    assetId: "knowledge-growth-template-budget",
    title: "Budget Reallocation Template",
    assetType: "template",
    stage: "growth_optimization",
    role: "operations_director",
    sourceProjectId: null,
    applicability: {
      stage: ["growth_optimization"],
      role: ["growth_director"],
      assetType: ["template"],
      channel: "ecommerce",
      category: "商务男包",
      businessGoal: "roi_recovery",
      priceBand: "mid_high",
      lifecycle: "growth",
      preconditions: ["需要重配预算"],
      exclusionConditions: [],
    },
    keywords: "budget template roi audience creative growth",
    contentMarkdown: `## Reallocation template\nList the low-efficiency placements to cut, the high-intent audiences to increase, and the creative set to keep.\n\n## Validation\nMeasure ROI and profit together, not just impressions.`,
  },
  {
    assetId: "knowledge-review-sop-capture",
    title: "Review Capture SOP",
    assetType: "sop",
    stage: "review_capture",
    role: "product_rnd_director",
    sourceProjectId: null,
    applicability: {
      stage: ["review_capture"],
      role: ["product_rd_director", "growth_director"],
      assetType: ["sop"],
      channel: "ecommerce",
      category: "办公通勤包",
      businessGoal: "knowledge_capture",
      priceBand: "mid",
      lifecycle: "review",
      preconditions: ["项目进入复盘阶段"],
      exclusionConditions: [],
    },
    keywords: "review capture sop asset template learnings",
    contentMarkdown: `## Review capture\nSummarize the winning expression, the metric lift, and the repeatable rule in one document.\n\n## Output\nEvery closed project should leave one template candidate and one reusable rule.`,
  },
  {
    assetId: "knowledge-review-evaluation-sample",
    title: "Review Evaluation Sample",
    assetType: "evaluation_sample",
    stage: "review_capture",
    role: "boss",
    sourceProjectId: "local-review-office-classic",
    applicability: {
      stage: ["review_capture"],
      role: ["ceo"],
      assetType: ["evaluation_sample"],
      channel: "ecommerce",
      category: "办公通勤包",
      businessGoal: "knowledge_capture",
      priceBand: "mid",
      lifecycle: "review",
      preconditions: ["需要确认是否值得沉淀"],
      exclusionConditions: [],
    },
    keywords: "review evaluation sample asset success",
    contentMarkdown: `## Evaluation sample\nA review is worth publishing when it links the winning action, the metric movement, and the reusable artifact.\n\n## Example\nThis office bag project turned a detail page refresh into a reusable template.`,
  },
  {
    assetId: "knowledge-review-product-case",
    title: "Closed Project Product Learnings",
    assetType: "case",
    stage: "review_capture",
    role: "product_rnd_director",
    sourceProjectId: "local-review-office-classic",
    applicability: {
      stage: ["review_capture"],
      role: ["product_rd_director"],
      assetType: ["case"],
      channel: "ecommerce",
      category: "办公通勤包",
      businessGoal: "knowledge_capture",
      priceBand: "mid",
      lifecycle: "review",
      preconditions: ["复盘已形成结论"],
      exclusionConditions: [],
    },
    keywords: "product case review sku category learnings",
    contentMarkdown: `## Product learnings\nThis closed project clarified which SKU angle and price promise should be reused in the next launch.\n\n## Reuse\nTurn the conclusion into a reusable category checklist.`,
  },
  {
    assetId: "asset-feedback-office-classic-playbook",
    title: "办公包复盘打法回流知识",
    assetType: "case",
    stage: "review_capture",
    role: "product_rnd_director",
    sourceProjectId: "local-review-office-classic",
    applicability: {
      stage: ["review_capture", "launch_validation"],
      role: ["product_rd_director", "growth_director"],
      assetType: ["case"],
      channel: "ecommerce",
      category: "办公通勤包",
      businessGoal: "knowledge_capture",
      priceBand: "mid",
      lifecycle: "review",
      preconditions: ["已经完成 execution review"],
      exclusionConditions: [],
    },
    keywords: "office bag review playbook knowledge feedback reusable",
    contentMarkdown: `## 办公包复盘打法\n先统一卖点表达，再把价格承诺和通勤场景证明放到详情页首屏。\n\n## 复用条件\n适合首发验证或复盘沉淀阶段，用来快速复用办公包项目的表达逻辑。`,
  },
  {
    assetId: "knowledge-visual-case-refresh",
    title: "Creative Refresh Reference",
    assetType: "case",
    stage: "launch_validation",
    role: "visual_director",
    sourceProjectId: "local-launch-breeze-bag",
    applicability: {
      stage: ["launch_validation"],
      role: ["visual_director"],
      assetType: ["case"],
      channel: "ecommerce",
      category: "通勤女包",
      businessGoal: "launch_conversion",
      priceBand: "mid",
      lifecycle: "launch",
      preconditions: ["需要创意迭代"],
      exclusionConditions: [],
    },
    keywords: "visual creative refresh ctr cvr launch",
    contentMarkdown: `## Creative refresh case\nWhen CTR stays high but CVR drops, the visual team should align click promise and detail-page first screen before adding more assets.\n\n## Focus\nImprove the first-screen proof and price framing before expanding creative volume.`,
  },
];

const runtimeWorkflows = [
  {
    workflowId: "workflow-action-launch-refresh-main-visual",
    projectId: "local-launch-breeze-bag",
    actionId: "action-launch-refresh-main-visual",
    role: "visual_director",
    actionDomain: "visual",
    status: "retryable",
    currentTaskType: "mock_execution",
    startedAt: "2026-04-02T10:24:00+08:00",
    finishedAt: null,
    lastEventAt: "2026-04-02T10:29:00+08:00",
  },
  {
    workflowId: "workflow-action-growth-budget-reallocation",
    projectId: "local-growth-travel-pro",
    actionId: "action-growth-budget-reallocation",
    role: "operations_director",
    actionDomain: "operations",
    status: "awaiting_approval",
    currentTaskType: "approval_gate",
    startedAt: "2026-04-02T10:48:00+08:00",
    finishedAt: null,
    lastEventAt: "2026-04-02T10:49:00+08:00",
  },
  {
    workflowId: "workflow-action-review-refine-product-definition",
    projectId: "local-review-office-classic",
    actionId: "action-review-refine-product-definition",
    role: "product_rnd_director",
    actionDomain: "product_rnd",
    status: "completed",
    currentTaskType: "asset_publish",
    startedAt: "2026-04-02T10:42:00+08:00",
    finishedAt: "2026-04-02T11:05:00+08:00",
    lastEventAt: "2026-04-02T11:05:00+08:00",
  },
];

const runtimeTasks = [
  {
    taskId: "workflow-action-launch-refresh-main-visual-agent_trigger-1",
    workflowId: "workflow-action-launch-refresh-main-visual",
    projectId: "local-launch-breeze-bag",
    actionId: "action-launch-refresh-main-visual",
    runId: null,
    taskType: "agent_trigger",
    attempt: 1,
    status: "completed",
    requestPayload: { actionDomain: "visual", creativeObjective: "refresh hero block" },
    responsePayload: { accepted: true },
    errorMessage: null,
    startedAt: "2026-04-02T10:24:00+08:00",
    finishedAt: "2026-04-02T10:24:10+08:00",
    createdAt: "2026-04-02T10:24:00+08:00",
    updatedAt: "2026-04-02T10:24:10+08:00",
  },
  {
    taskId: "workflow-action-launch-refresh-main-visual-mock_execution-1",
    workflowId: "workflow-action-launch-refresh-main-visual",
    projectId: "local-launch-breeze-bag",
    actionId: "action-launch-refresh-main-visual",
    runId: null,
    taskType: "mock_execution",
    attempt: 1,
    status: "failed",
    requestPayload: { actionDomain: "visual", expectedMetric: "ctr" },
    responsePayload: { resultStatus: "failed", notes: ["first creative hypothesis did not converge"] },
    errorMessage: "Connector returned unstable creative result.",
    startedAt: "2026-04-02T10:24:10+08:00",
    finishedAt: "2026-04-02T10:27:00+08:00",
    createdAt: "2026-04-02T10:24:10+08:00",
    updatedAt: "2026-04-02T10:27:00+08:00",
  },
  {
    taskId: "workflow-action-launch-refresh-main-visual-mock_execution-2",
    workflowId: "workflow-action-launch-refresh-main-visual",
    projectId: "local-launch-breeze-bag",
    actionId: "action-launch-refresh-main-visual",
    runId: null,
    taskType: "mock_execution",
    attempt: 2,
    status: "retryable",
    requestPayload: { actionDomain: "visual", expectedMetric: "ctr", retry: 1 },
    responsePayload: { resultStatus: "retryable", notes: ["needs another creative round"] },
    errorMessage: "Creative connector suggests another retry.",
    startedAt: "2026-04-02T10:28:00+08:00",
    finishedAt: "2026-04-02T10:29:00+08:00",
    createdAt: "2026-04-02T10:28:00+08:00",
    updatedAt: "2026-04-02T10:29:00+08:00",
  },
  {
    taskId: "workflow-action-growth-budget-reallocation-approval_gate-1",
    workflowId: "workflow-action-growth-budget-reallocation",
    projectId: "local-growth-travel-pro",
    actionId: "action-growth-budget-reallocation",
    runId: null,
    taskType: "approval_gate",
    attempt: 1,
    status: "awaiting_approval",
    requestPayload: { requiredBy: "boss", actionDomain: "operations" },
    responsePayload: null,
    errorMessage: null,
    startedAt: "2026-04-02T10:48:00+08:00",
    finishedAt: null,
    createdAt: "2026-04-02T10:48:00+08:00",
    updatedAt: "2026-04-02T10:49:00+08:00",
  },
  {
    taskId: "workflow-action-review-refine-product-definition-approval_gate-1",
    workflowId: "workflow-action-review-refine-product-definition",
    projectId: "local-review-office-classic",
    actionId: "action-review-refine-product-definition",
    runId: null,
    taskType: "approval_gate",
    attempt: 1,
    status: "completed",
    requestPayload: { requiredBy: "product_rnd_director" },
    responsePayload: { approvalStatus: "approved" },
    errorMessage: null,
    startedAt: "2026-04-02T10:40:00+08:00",
    finishedAt: "2026-04-02T10:40:00+08:00",
    createdAt: "2026-04-02T10:40:00+08:00",
    updatedAt: "2026-04-02T10:40:00+08:00",
  },
  {
    taskId: "workflow-action-review-refine-product-definition-agent_trigger-1",
    workflowId: "workflow-action-review-refine-product-definition",
    projectId: "local-review-office-classic",
    actionId: "action-review-refine-product-definition",
    runId: "run-review-refine-product-definition",
    taskType: "agent_trigger",
    attempt: 1,
    status: "completed",
    requestPayload: { agentName: "product-rnd-agent" },
    responsePayload: { accepted: true },
    errorMessage: null,
    startedAt: "2026-04-02T10:42:00+08:00",
    finishedAt: "2026-04-02T10:42:00+08:00",
    createdAt: "2026-04-02T10:42:00+08:00",
    updatedAt: "2026-04-02T10:42:00+08:00",
  },
  {
    taskId: "workflow-action-review-refine-product-definition-mock_execution-1",
    workflowId: "workflow-action-review-refine-product-definition",
    projectId: "local-review-office-classic",
    actionId: "action-review-refine-product-definition",
    runId: "run-review-refine-product-definition",
    taskType: "mock_execution",
    attempt: 1,
    status: "completed",
    requestPayload: { connector: "mock-product-rnd-connector" },
    responsePayload: { resultStatus: "completed" },
    errorMessage: null,
    startedAt: "2026-04-02T10:42:00+08:00",
    finishedAt: "2026-04-02T10:46:00+08:00",
    createdAt: "2026-04-02T10:42:00+08:00",
    updatedAt: "2026-04-02T10:46:00+08:00",
  },
  {
    taskId: "workflow-action-review-refine-product-definition-writeback-1",
    workflowId: "workflow-action-review-refine-product-definition",
    projectId: "local-review-office-classic",
    actionId: "action-review-refine-product-definition",
    runId: "run-review-refine-product-definition",
    taskType: "writeback",
    attempt: 1,
    status: "completed",
    requestPayload: { target: "project_snapshot" },
    responsePayload: { writebackId: "writeback-review-refine-product-definition" },
    errorMessage: null,
    startedAt: "2026-04-02T10:48:00+08:00",
    finishedAt: "2026-04-02T10:48:00+08:00",
    createdAt: "2026-04-02T10:48:00+08:00",
    updatedAt: "2026-04-02T10:48:00+08:00",
  },
  {
    taskId: "workflow-action-review-refine-product-definition-review_generate-1",
    workflowId: "workflow-action-review-refine-product-definition",
    projectId: "local-review-office-classic",
    actionId: "action-review-refine-product-definition",
    runId: "run-review-refine-product-definition",
    taskType: "review_generate",
    attempt: 1,
    status: "completed",
    requestPayload: { reviewId: "review-office-classic" },
    responsePayload: { reviewStatus: "approved" },
    errorMessage: null,
    startedAt: "2026-04-02T10:55:00+08:00",
    finishedAt: "2026-04-02T10:55:00+08:00",
    createdAt: "2026-04-02T10:55:00+08:00",
    updatedAt: "2026-04-02T10:55:00+08:00",
  },
  {
    taskId: "workflow-action-review-refine-product-definition-asset_publish-1",
    workflowId: "workflow-action-review-refine-product-definition",
    projectId: "local-review-office-classic",
    actionId: "action-review-refine-product-definition",
    runId: null,
    taskType: "asset_publish",
    attempt: 1,
    status: "completed",
    requestPayload: { candidateId: "candidate-office-classic-playbook" },
    responsePayload: { publishStatus: "published" },
    errorMessage: null,
    startedAt: "2026-04-02T11:05:00+08:00",
    finishedAt: "2026-04-02T11:05:00+08:00",
    createdAt: "2026-04-02T11:05:00+08:00",
    updatedAt: "2026-04-02T11:05:00+08:00",
  },
];

const runtimeEvents = [
  {
    eventId: "event-launch-refresh-agent-triggered",
    workflowId: "workflow-action-launch-refresh-main-visual",
    taskId: "workflow-action-launch-refresh-main-visual-agent_trigger-1",
    projectId: "local-launch-breeze-bag",
    actionId: "action-launch-refresh-main-visual",
    eventType: "agent_triggered",
    status: "queued",
    summary: "Visual agent accepted the refresh task.",
    payload: { agent: "visual-agent" },
    createdAt: "2026-04-02T10:24:00+08:00",
  },
  {
    eventId: "event-launch-refresh-execution-failed",
    workflowId: "workflow-action-launch-refresh-main-visual",
    taskId: "workflow-action-launch-refresh-main-visual-mock_execution-1",
    projectId: "local-launch-breeze-bag",
    actionId: "action-launch-refresh-main-visual",
    eventType: "mock_execution_failed",
    status: "retryable",
    summary: "Visual connector suggested another retry round.",
    payload: { run: null },
    createdAt: "2026-04-02T10:27:00+08:00",
  },
  {
    eventId: "event-launch-refresh-task-retried",
    workflowId: "workflow-action-launch-refresh-main-visual",
    taskId: "workflow-action-launch-refresh-main-visual-mock_execution-2",
    projectId: "local-launch-breeze-bag",
    actionId: "action-launch-refresh-main-visual",
    eventType: "task_retried",
    status: "retryable",
    summary: "Visual creative iteration queued for another retry.",
    payload: { retry: 1 },
    createdAt: "2026-04-02T10:29:00+08:00",
  },
  {
    eventId: "event-growth-approval-requested",
    workflowId: "workflow-action-growth-budget-reallocation",
    taskId: "workflow-action-growth-budget-reallocation-approval_gate-1",
    projectId: "local-growth-travel-pro",
    actionId: "action-growth-budget-reallocation",
    eventType: "approval_requested",
    status: "awaiting_approval",
    summary: "Budget reallocation is waiting for boss approval.",
    payload: { requiredRole: "boss" },
    createdAt: "2026-04-02T10:49:00+08:00",
  },
  {
    eventId: "event-review-approval-resolved",
    workflowId: "workflow-action-review-refine-product-definition",
    taskId: "workflow-action-review-refine-product-definition-approval_gate-1",
    projectId: "local-review-office-classic",
    actionId: "action-review-refine-product-definition",
    eventType: "approval_resolved",
    status: "queued",
    summary: "Product review approval completed.",
    payload: { approvalStatus: "approved" },
    createdAt: "2026-04-02T10:40:00+08:00",
  },
  {
    eventId: "event-review-mock-execution-completed",
    workflowId: "workflow-action-review-refine-product-definition",
    taskId: "workflow-action-review-refine-product-definition-mock_execution-1",
    projectId: "local-review-office-classic",
    actionId: "action-review-refine-product-definition",
    eventType: "mock_execution_completed",
    status: "awaiting_writeback",
    summary: "Product R&D connector finished execution and is waiting for writeback.",
    payload: { runId: "run-review-refine-product-definition" },
    createdAt: "2026-04-02T10:46:00+08:00",
  },
  {
    eventId: "event-review-writeback-completed",
    workflowId: "workflow-action-review-refine-product-definition",
    taskId: "workflow-action-review-refine-product-definition-writeback-1",
    projectId: "local-review-office-classic",
    actionId: "action-review-refine-product-definition",
    eventType: "writeback_completed",
    status: "queued",
    summary: "Writeback completed and review generation is queued.",
    payload: { writebackId: "writeback-review-refine-product-definition" },
    createdAt: "2026-04-02T10:48:00+08:00",
  },
  {
    eventId: "event-review-asset-published",
    workflowId: "workflow-action-review-refine-product-definition",
    taskId: "workflow-action-review-refine-product-definition-asset_publish-1",
    projectId: "local-review-office-classic",
    actionId: "action-review-refine-product-definition",
    eventType: "asset_published",
    status: "completed",
    summary: "Asset candidate has been published and workflow is complete.",
    payload: { candidateId: "candidate-office-classic-playbook" },
    createdAt: "2026-04-02T11:05:00+08:00",
  },
];

const retryRecords = [
  {
    retryId: "retry-launch-refresh-1",
    workflowId: "workflow-action-launch-refresh-main-visual",
    originalTaskId: "workflow-action-launch-refresh-main-visual-mock_execution-1",
    newTaskId: "workflow-action-launch-refresh-main-visual-mock_execution-2",
    operator: "系统",
    reason: "首次创意迭代未达到质量阈值。",
    createdAt: "2026-04-02T10:28:00+08:00",
  },
];

const evalCases = [
  {
    caseId: "eval-case-decision-quality",
    name: "Decision quality",
    scope: "decision",
    severity: "high",
    status: "active",
    ruleSpecJson: JSON.stringify({ requiresEvidence: true, requiresRecommendedAction: true }),
    createdAt: timestamps.updated,
  },
  {
    caseId: "eval-case-action-completeness",
    name: "Action completeness",
    scope: "action",
    severity: "medium",
    status: "active",
    ruleSpecJson: JSON.stringify({ requiresOwner: true, requiresDomain: true, requiresMetric: true }),
    createdAt: timestamps.updated,
  },
  {
    caseId: "eval-case-execution-completeness",
    name: "Execution completeness",
    scope: "execution",
    severity: "high",
    status: "active",
    ruleSpecJson: JSON.stringify({ requiresRun: true, requiresWriteback: true }),
    createdAt: timestamps.updated,
  },
  {
    caseId: "eval-case-review-quality",
    name: "Review quality",
    scope: "review",
    severity: "medium",
    status: "active",
    ruleSpecJson: JSON.stringify({ requiresSummary: true, requiresNextSuggestion: true }),
    createdAt: timestamps.updated,
  },
  {
    caseId: "eval-case-asset-quality",
    name: "Asset quality",
    scope: "asset",
    severity: "medium",
    status: "active",
    ruleSpecJson: JSON.stringify({ requiresPublishOrFeedback: true }),
    createdAt: timestamps.updated,
  },
  {
    caseId: "eval-case-role-consistency",
    name: "Role consistency",
    scope: "role_consistency",
    severity: "medium",
    status: "active",
    ruleSpecJson: JSON.stringify({ comparesRoleStories: true }),
    createdAt: timestamps.updated,
  },
  {
    caseId: "eval-case-lineage-integrity",
    name: "Lineage integrity",
    scope: "lineage_integrity",
    severity: "high",
    status: "active",
    ruleSpecJson: JSON.stringify({ requiresClosedLoopLineage: true }),
    createdAt: timestamps.updated,
  },
];

const evalSuites = [
  {
    suiteId: "eval-suite-batch6-smoke",
    name: "Batch 6 Smoke Suite",
    description: "覆盖 decision / action / execution / review / asset / role / lineage 的最小冒烟套件。",
    status: "active",
    caseIdsJson: JSON.stringify(evalCases.map((item) => item.caseId)),
    createdAt: timestamps.updated,
  },
];

const evalRuns = [
  {
    runId: "eval-run-review-office-classic-seeded",
    projectId: "local-review-office-classic",
    suiteId: "eval-suite-batch6-smoke",
    status: "completed",
    summaryJson: JSON.stringify({ total: 7, averageScore: 88, byStatus: { pass: 5, warning: 2 } }),
    startedAt: "2026-04-02T11:31:00+08:00",
    finishedAt: "2026-04-02T11:32:00+08:00",
  },
];

const evalResults = [
  {
    resultId: "eval-result-review-decision",
    runId: "eval-run-review-office-classic-seeded",
    caseId: "eval-case-decision-quality",
    relatedObjectType: "decision",
    relatedObjectId: "decision-local-review-office-classic",
    status: "pass",
    scoreJson: JSON.stringify({ score: 92 }),
    notes: "Decision evidence is complete for the closed review project.",
    createdAt: "2026-04-02T11:32:00+08:00",
  },
  {
    resultId: "eval-result-review-action",
    runId: "eval-run-review-office-classic-seeded",
    caseId: "eval-case-action-completeness",
    relatedObjectType: "action",
    relatedObjectId: "action-review-refine-product-definition",
    status: "pass",
    scoreJson: JSON.stringify({ score: 90 }),
    notes: "Action is complete and well-scoped.",
    createdAt: "2026-04-02T11:32:00+08:00",
  },
  {
    resultId: "eval-result-review-execution",
    runId: "eval-run-review-office-classic-seeded",
    caseId: "eval-case-execution-completeness",
    relatedObjectType: "execution",
    relatedObjectId: "run-review-refine-product-definition",
    status: "pass",
    scoreJson: JSON.stringify({ score: 90 }),
    notes: "Execution, writeback and logs are all present.",
    createdAt: "2026-04-02T11:32:00+08:00",
  },
  {
    resultId: "eval-result-review-review",
    runId: "eval-run-review-office-classic-seeded",
    caseId: "eval-case-review-quality",
    relatedObjectType: "review",
    relatedObjectId: "review-office-classic",
    status: "pass",
    scoreJson: JSON.stringify({ score: 88 }),
    notes: "Review summary and next suggestion are available.",
    createdAt: "2026-04-02T11:32:00+08:00",
  },
  {
    resultId: "eval-result-review-asset",
    runId: "eval-run-review-office-classic-seeded",
    caseId: "eval-case-asset-quality",
    relatedObjectType: "asset",
    relatedObjectId: "asset-office-classic-playbook",
    status: "pass",
    scoreJson: JSON.stringify({ score: 86 }),
    notes: "Published asset and knowledge feedback are both present.",
    createdAt: "2026-04-02T11:32:00+08:00",
  },
  {
    resultId: "eval-result-review-role",
    runId: "eval-run-review-office-classic-seeded",
    caseId: "eval-case-role-consistency",
    relatedObjectType: "decision",
    relatedObjectId: "role-consistency-local-review-office-classic",
    status: "warning",
    scoreJson: JSON.stringify({ score: 72 }),
    notes: "Role stories are aligned but still differ in emphasis.",
    createdAt: "2026-04-02T11:32:00+08:00",
  },
  {
    resultId: "eval-result-review-lineage",
    runId: "eval-run-review-office-classic-seeded",
    caseId: "eval-case-lineage-integrity",
    relatedObjectType: "decision",
    relatedObjectId: "decision-local-review-office-classic",
    status: "pass",
    scoreJson: JSON.stringify({ score: 94 }),
    notes: "Lineage from decision to asset is intact.",
    createdAt: "2026-04-02T11:32:00+08:00",
  },
];

const gateDecisions = [
  {
    gateId: "gate-eval-run-review-office-classic-seeded",
    runId: "eval-run-review-office-classic-seeded",
    decision: "warning",
    summary: "Seeded closed-loop project passes most checks, with minor role consistency warnings.",
    createdAt: "2026-04-02T11:32:00+08:00",
  },
];

const policyObjects = [
  {
    policyId: "policy-operations-execution",
    policyType: "action_policy",
    title: "Operations Execution Policy",
    owner: "赵颖",
    payloadJson: JSON.stringify({
      actionDomain: "operations",
      approvalRule: "boss approval required when ROI stop-loss action changes budget allocation",
      allowedActionTypes: ["adjust_launch_plan", "increase_campaign_support", "pause_low_roi_action", "push_stage_transition"],
    }),
    createdAt: timestamps.updated,
    updatedAt: timestamps.updated,
  },
  {
    policyId: "policy-visual-execution",
    policyType: "action_policy",
    title: "Visual Execution Policy",
    owner: "林乔",
    payloadJson: JSON.stringify({
      actionDomain: "visual",
      approvalRule: "visual refresh can run without boss approval when no price change is involved",
      allowedActionTypes: ["refresh_main_visual", "iterate_video_asset", "revise_detail_page", "support_launch_creative"],
    }),
    createdAt: timestamps.updated,
    updatedAt: timestamps.updated,
  },
];

const templateObjects = [
  {
    templateId: "template-launch-creative",
    title: "Launch Creative Template",
    owner: "林乔",
    payloadJson: JSON.stringify({
      heroStructure: ["promise", "proof", "price", "coupon"],
      firstScreenRule: "landing continuity",
    }),
    createdAt: timestamps.updated,
    updatedAt: timestamps.updated,
  },
];

const skillObjects = [
  {
    skillId: "skill-growth-diagnosis",
    title: "Growth Diagnosis Skill",
    owner: "张伟",
    payloadJson: JSON.stringify({
      appliesTo: ["growth_optimization"],
      outputs: ["budget recommendation", "risk summary", "stop-loss advice"],
    }),
    createdAt: timestamps.updated,
    updatedAt: timestamps.updated,
  },
];

const ontologyRegistry = [
  ...listRoleProfiles().map((profile) => ({
    registryId: `ontology-role-profile-${profile.roleId}`,
    itemType: "role_profile",
    name: profile.roleName,
    status: "active",
    owner: "system",
    currentVersion: 1,
    sourceTable: "role_profiles_virtual",
    sourceId: profile.roleId,
    updatedAt: timestamps.updated,
    payload: profile,
  })),
  ...stageRules.map((rule) => ({
    registryId: `ontology-stage-rule-${rule.ruleId}`,
    itemType: "stage_rule",
    name: rule.ruleText,
    status: "active",
    owner: "system",
    currentVersion: 1,
    sourceTable: "stage_rules",
    sourceId: rule.stage,
    updatedAt: timestamps.updated,
    payload: rule,
  })),
  ...policyObjects.map((policy) => ({
    registryId: `ontology-${policy.policyId}`,
    itemType: "action_policy",
    name: policy.title,
    status: "active",
    owner: policy.owner,
    currentVersion: 1,
    sourceTable: "policy_objects",
    sourceId: policy.policyId,
    updatedAt: timestamps.updated,
    payload: JSON.parse(policy.payloadJson),
  })),
  {
    registryId: "ontology-review-pattern-execution",
    itemType: "review_pattern",
    name: "Execution Review Pattern",
    status: "active",
    owner: "李安",
    currentVersion: 1,
    sourceTable: "reviews",
    sourceId: "execution_review",
    updatedAt: timestamps.updated,
    payload: {
      reviewType: "execution_review",
      requiredFields: ["review_summary", "outcome_json", "nextSuggestion"],
    },
  },
  ...["template", "case", "rule"].map((assetType) => ({
    registryId: `ontology-asset-type-${assetType}`,
    itemType: "asset_type",
    name: assetType,
    status: "active",
    owner: "李安",
    currentVersion: 1,
    sourceTable: "asset_candidates",
    sourceId: assetType,
    updatedAt: timestamps.updated,
    payload: { assetType },
  })),
  {
    registryId: "ontology-template-launch-creative",
    itemType: "template",
    name: "Launch Creative Template",
    status: "active",
    owner: "林乔",
    currentVersion: 1,
    sourceTable: "template_objects",
    sourceId: "template-launch-creative",
    updatedAt: timestamps.updated,
    payload: JSON.parse(templateObjects[0].payloadJson),
  },
  {
    registryId: "ontology-skill-growth-diagnosis",
    itemType: "skill",
    name: "Growth Diagnosis Skill",
    status: "active",
    owner: "张伟",
    currentVersion: 1,
    sourceTable: "skill_objects",
    sourceId: "skill-growth-diagnosis",
    updatedAt: timestamps.updated,
    payload: JSON.parse(skillObjects[0].payloadJson),
  },
];

const ontologyVersions = ontologyRegistry.map((item) => ({
  versionId: `${item.registryId}-v1`,
  registryId: item.registryId,
  version: 1,
  payloadJson: JSON.stringify(item.payload),
  changeNote: "Seeded Batch 6 ontology item.",
  createdAt: timestamps.updated,
}));

const sourceAdapters = [
  {
    adapterId: "adapter-local-mock",
    name: "Local Sandbox Mock Adapter",
    mode: "local_mock",
    owner: "system",
    connectorKey: "connector-local-sandbox",
    status: "active",
    createdAt: timestamps.updated,
    updatedAt: timestamps.updated,
  },
  {
    adapterId: "adapter-file-bridge",
    name: "File Bridge Adapter",
    mode: "file_bridge",
    owner: "system",
    connectorKey: "connector-json-fixture",
    status: "active",
    createdAt: timestamps.updated,
    updatedAt: timestamps.updated,
  },
  {
    adapterId: "adapter-api-bridge",
    name: "Mock API Bridge Adapter",
    mode: "api_bridge",
    owner: "system",
    connectorKey: "connector-mock-http",
    status: "draft",
    createdAt: timestamps.updated,
    updatedAt: timestamps.updated,
  },
];

const bridgeConfigs = [
  {
    configId: "bridge-config-local-mock",
    adapterId: "adapter-local-mock",
    configJson: JSON.stringify({ mode: "local_mock", freshnessTargetSeconds: 60 }),
    createdAt: timestamps.updated,
    updatedAt: timestamps.updated,
  },
  {
    configId: "bridge-config-file-bridge",
    adapterId: "adapter-file-bridge",
    configJson: JSON.stringify({
      mode: "file_bridge",
      fixturePath: "server/fixtures/batch6-file-bridge.json",
      freshnessTargetSeconds: 300,
    }),
    createdAt: timestamps.updated,
    updatedAt: timestamps.updated,
  },
  {
    configId: "bridge-config-api-bridge",
    adapterId: "adapter-api-bridge",
    configJson: JSON.stringify({
      mode: "api_bridge",
      baseUrl: "http://mock.local/api",
      freshnessTargetSeconds: 300,
    }),
    createdAt: timestamps.updated,
    updatedAt: timestamps.updated,
  },
];

const connectorRegistry = [
  {
    connectorId: "connector-row-local-sandbox",
    connectorKey: "connector-local-sandbox",
    mode: "local_mock",
    title: "Local Sandbox Connector",
    status: "active",
    description: "Reads and writes the built-in local sandbox dataset.",
    createdAt: timestamps.updated,
    updatedAt: timestamps.updated,
  },
  {
    connectorId: "connector-row-json-fixture",
    connectorKey: "connector-json-fixture",
    mode: "file_bridge",
    title: "JSON Fixture Bridge Connector",
    status: "active",
    description: "Imports fixture JSON files into the local sandbox database.",
    createdAt: timestamps.updated,
    updatedAt: timestamps.updated,
  },
  {
    connectorId: "connector-row-mock-http",
    connectorKey: "connector-mock-http",
    mode: "api_bridge",
    title: "Mock HTTP Bridge Connector",
    status: "draft",
    description: "Placeholder API connector for future external system bridging.",
    createdAt: timestamps.updated,
    updatedAt: timestamps.updated,
  },
];

const syncRecords = [
  {
    syncId: "sync-local-mock-seeded",
    adapterId: "adapter-local-mock",
    mode: "local_mock",
    startedAt: "2026-04-02T11:35:00+08:00",
    finishedAt: "2026-04-02T11:35:05+08:00",
    rowsImported: 3,
    mappingErrorsJson: JSON.stringify([]),
    freshnessSeconds: 5,
    status: "completed",
  },
];

function resetBatch1Tables(db) {
  [
    "runtime_events",
    "retry_records",
    "task_runs",
    "workflow_runs",
    "gate_decisions",
    "eval_results",
    "eval_runs",
    "eval_suites",
    "eval_cases",
    "ontology_versions",
    "ontology_registry",
    "policy_objects",
    "template_objects",
    "skill_objects",
    "sync_records",
    "bridge_configs",
    "source_adapters",
    "connector_registry",
    "knowledge_feedback_records",
    "evaluation_records",
    "knowledge_retrieval_logs",
    "knowledge_chunks_fts",
    "knowledge_chunks",
    "knowledge_assets",
    "published_assets",
    "asset_candidates",
    "reviews",
    "writeback_records",
    "execution_logs",
    "execution_runs",
    "approvals",
    "actions",
    "stage_rules",
    "ontology_entities",
    "risk_signals",
    "opportunities",
    "kpi_metrics",
    "project_snapshots",
    "projects",
  ].forEach((tableName) => {
    db.exec(`DELETE FROM ${tableName};`);
  });
}

export async function seedLocalSandboxDatabase({ dbPath } = {}) {
  await initLocalSandboxDatabase({ dbPath });
  const db = openDatabase(dbPath);

  try {
    db.exec("BEGIN TRANSACTION;");
    resetBatch1Tables(db);

    const insertProject = db.prepare(`
      INSERT INTO projects (project_id, name, stage, status, owner, priority, category, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertSnapshot = db.prepare(`
      INSERT INTO project_snapshots (snapshot_id, project_id, summary, current_problem, current_goal, current_risk, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const insertMetric = db.prepare(`
      INSERT INTO kpi_metrics (metric_id, project_id, metric_name, metric_value, metric_unit, metric_direction, captured_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const insertOpportunity = db.prepare(`
      INSERT INTO opportunities (opportunity_id, project_id, title, signal_type, description, priority, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const insertRisk = db.prepare(`
      INSERT INTO risk_signals (risk_id, project_id, risk_type, risk_level, description, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const insertAction = db.prepare(`
      INSERT INTO actions (
        action_id,
        project_id,
        decision_id,
        role,
        action_domain,
        action_type,
        description,
        owner,
        required_approval,
        approval_status,
        execution_status,
        expected_metric,
        expected_direction,
        confidence,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertApproval = db.prepare(`
      INSERT INTO approvals (
        approval_id,
        project_id,
        action_id,
        role,
        approval_status,
        approved_by,
        reason,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertExecutionRun = db.prepare(`
      INSERT INTO execution_runs (
        run_id,
        project_id,
        action_id,
        role,
        action_domain,
        agent_name,
        connector_name,
        request_payload_json,
        response_payload_json,
        result_status,
        started_at,
        finished_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertExecutionLog = db.prepare(`
      INSERT INTO execution_logs (
        log_id,
        project_id,
        action_id,
        run_id,
        log_type,
        message,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const insertWritebackRecord = db.prepare(`
      INSERT INTO writeback_records (
        writeback_id,
        project_id,
        action_id,
        run_id,
        target_type,
        target_id,
        payload_hash,
        result_status,
        error_message,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertReview = db.prepare(`
      INSERT INTO reviews (
        review_id,
        project_id,
        source_action_id,
        source_run_id,
        review_summary,
        review_status,
        review_type,
        review_quality_score,
        is_promoted_to_asset,
        outcome_json,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertAssetCandidate = db.prepare(`
      INSERT INTO asset_candidates (
        candidate_id,
        project_id,
        source_review_id,
        asset_type,
        title,
        content_markdown,
        review_status,
        publish_status,
        reusability_score,
        feedback_to_knowledge,
        status,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertPublishedAsset = db.prepare(`
      INSERT INTO published_assets (
        asset_id,
        candidate_id,
        project_id,
        source_review_id,
        asset_type,
        title,
        content_markdown,
        publish_status,
        published_at,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertOntology = db.prepare(`
      INSERT INTO ontology_entities (entity_id, entity_type, entity_name, entity_json)
      VALUES (?, ?, ?, ?)
    `);
    const insertStageRule = db.prepare(`
      INSERT INTO stage_rules (rule_id, stage, rule_type, rule_text, required_fields_json, exit_criteria_json)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const insertKnowledgeAsset = db.prepare(`
      INSERT INTO knowledge_assets (
        asset_id,
        title,
        asset_type,
        stage,
        role,
        source_project_id,
        applicability_json,
        content_markdown,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertKnowledgeChunk = db.prepare(`
      INSERT INTO knowledge_chunks (
        chunk_id,
        asset_id,
        chunk_text,
        chunk_index,
        keywords,
        stage,
        role,
        asset_type
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertKnowledgeChunkFts = db.prepare(`
      INSERT INTO knowledge_chunks_fts (
        chunk_id,
        asset_id,
        chunk_text,
        keywords,
        stage,
        role,
        asset_type
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const insertEvaluationRecord = db.prepare(`
      INSERT INTO evaluation_records (
        evaluation_id,
        project_id,
        decision_id,
        action_id,
        run_id,
        review_id,
        candidate_id,
        evaluation_type,
        score_json,
        notes,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertWorkflowRun = db.prepare(`
      INSERT INTO workflow_runs (
        workflow_id,
        project_id,
        action_id,
        role,
        action_domain,
        status,
        current_task_type,
        started_at,
        finished_at,
        last_event_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertTaskRun = db.prepare(`
      INSERT INTO task_runs (
        task_id,
        workflow_id,
        project_id,
        action_id,
        run_id,
        task_type,
        attempt,
        status,
        request_payload_json,
        response_payload_json,
        error_message,
        started_at,
        finished_at,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertRuntimeEvent = db.prepare(`
      INSERT INTO runtime_events (
        event_id,
        workflow_id,
        task_id,
        project_id,
        action_id,
        event_type,
        status,
        summary,
        payload_json,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertRetryRecord = db.prepare(`
      INSERT INTO retry_records (
        retry_id,
        workflow_id,
        original_task_id,
        new_task_id,
        operator,
        reason,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const insertEvalCase = db.prepare(`
      INSERT INTO eval_cases (
        case_id,
        name,
        scope,
        severity,
        status,
        rule_spec_json,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const insertEvalSuite = db.prepare(`
      INSERT INTO eval_suites (
        suite_id,
        name,
        description,
        status,
        case_ids_json,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?)
    `);
    const insertEvalRun = db.prepare(`
      INSERT INTO eval_runs (
        run_id,
        project_id,
        suite_id,
        status,
        summary_json,
        started_at,
        finished_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const insertEvalResult = db.prepare(`
      INSERT INTO eval_results (
        result_id,
        run_id,
        case_id,
        related_object_type,
        related_object_id,
        status,
        score_json,
        notes,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertGateDecision = db.prepare(`
      INSERT INTO gate_decisions (
        gate_id,
        run_id,
        decision,
        summary,
        created_at
      ) VALUES (?, ?, ?, ?, ?)
    `);
    const insertOntologyRegistry = db.prepare(`
      INSERT INTO ontology_registry (
        registry_id,
        item_type,
        name,
        status,
        owner,
        current_version,
        source_table,
        source_id,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertOntologyVersion = db.prepare(`
      INSERT INTO ontology_versions (
        version_id,
        registry_id,
        version,
        payload_json,
        change_note,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?)
    `);
    const insertPolicyObject = db.prepare(`
      INSERT INTO policy_objects (
        policy_id,
        policy_type,
        title,
        owner,
        payload_json,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const insertTemplateObject = db.prepare(`
      INSERT INTO template_objects (
        template_id,
        title,
        owner,
        payload_json,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?)
    `);
    const insertSkillObject = db.prepare(`
      INSERT INTO skill_objects (
        skill_id,
        title,
        owner,
        payload_json,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?)
    `);
    const insertSourceAdapter = db.prepare(`
      INSERT INTO source_adapters (
        adapter_id,
        name,
        mode,
        owner,
        connector_key,
        status,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertBridgeConfig = db.prepare(`
      INSERT INTO bridge_configs (
        config_id,
        adapter_id,
        config_json,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?)
    `);
    const insertSyncRecord = db.prepare(`
      INSERT INTO sync_records (
        sync_id,
        adapter_id,
        mode,
        started_at,
        finished_at,
        rows_imported,
        mapping_errors_json,
        freshness_seconds,
        status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertConnectorRegistry = db.prepare(`
      INSERT INTO connector_registry (
        connector_id,
        connector_key,
        mode,
        title,
        status,
        description,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertKnowledgeFeedbackRecord = db.prepare(`
      INSERT INTO knowledge_feedback_records (
        feedback_id,
        source_type,
        source_id,
        target_asset_id,
        feedback_mode,
        status,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    projects.forEach((project) => {
      insertProject.run(
        project.projectId,
        project.name,
        project.stage,
        project.status,
        project.owner,
        project.priority,
        project.category,
        timestamps.created,
        timestamps.updated,
      );

      insertSnapshot.run(
        `snapshot-${project.projectId}`,
        project.projectId,
        project.snapshot.summary,
        project.snapshot.currentProblem,
        project.snapshot.currentGoal,
        project.snapshot.currentRisk,
        project.snapshot.createdAt,
      );

      project.metrics.forEach((metric) => {
        insertMetric.run(
          metric.metricId,
          project.projectId,
          metric.metricName,
          metric.metricValue,
          metric.metricUnit,
          metric.metricDirection,
          timestamps.recent,
        );
      });

      project.opportunities.forEach((opportunity) => {
        insertOpportunity.run(
          opportunity.opportunityId,
          project.projectId,
          opportunity.title,
          opportunity.signalType,
          opportunity.description,
          opportunity.priority,
          timestamps.created,
        );
      });

      project.risks.forEach((risk) => {
        insertRisk.run(
          risk.riskId,
          project.projectId,
          risk.riskType,
          risk.riskLevel,
          risk.description,
          timestamps.created,
        );
      });

      project.actions.forEach((action) => {
        insertAction.run(
          action.actionId,
          project.projectId,
          action.decisionId,
          action.role,
          action.actionDomain,
          action.actionType,
          action.description,
          action.owner,
          action.requiredApproval,
          action.approvalStatus,
          action.executionStatus,
          action.expectedMetric,
          action.expectedDirection,
          action.confidence,
          timestamps.created,
          timestamps.updated,
        );
      });

      (project.approvals ?? []).forEach((approval) => {
        insertApproval.run(
          approval.approvalId,
          project.projectId,
          approval.actionId,
          approval.role,
          approval.approvalStatus,
          approval.approvedBy,
          approval.reason,
          approval.createdAt,
          approval.updatedAt,
        );
      });

      (project.executionRuns ?? []).forEach((run) => {
        insertExecutionRun.run(
          run.runId,
          project.projectId,
          run.actionId,
          run.role,
          run.actionDomain,
          run.agentName,
          run.connectorName,
          JSON.stringify(run.requestPayload),
          JSON.stringify(run.responsePayload),
          run.resultStatus,
          run.startedAt,
          run.finishedAt,
        );
      });

      (project.executionLogs ?? []).forEach((log) => {
        insertExecutionLog.run(
          log.logId,
          project.projectId,
          log.actionId,
          log.runId,
          log.logType,
          log.message,
          log.createdAt,
        );
      });

      (project.writebackRecords ?? []).forEach((record) => {
        insertWritebackRecord.run(
          record.writebackId,
          project.projectId,
          record.actionId,
          record.runId,
          record.targetType,
          record.targetId,
          record.payloadHash,
          record.resultStatus,
          record.errorMessage,
          record.createdAt,
        );
      });

      if (project.review) {
        insertReview.run(
          project.review.reviewId,
          project.projectId,
          project.review.sourceActionId,
          project.review.sourceRunId,
          project.review.reviewSummary,
          project.review.reviewStatus,
          project.review.reviewType,
          project.review.reviewQualityScore,
          project.review.isPromotedToAsset,
          JSON.stringify(project.review.outcome),
          project.review.createdAt,
          project.review.updatedAt,
        );
      }

      (project.assetCandidates ?? []).forEach((candidate) => {
        insertAssetCandidate.run(
          candidate.candidateId,
          project.projectId,
          candidate.sourceReviewId,
          candidate.assetType,
          candidate.title,
          candidate.contentMarkdown,
          candidate.reviewStatus,
          candidate.publishStatus,
          candidate.reusabilityScore,
          candidate.feedbackToKnowledge,
          candidate.status,
          candidate.createdAt,
          candidate.updatedAt,
        );
      });

      (project.publishedAssets ?? []).forEach((asset) => {
        insertPublishedAsset.run(
          asset.assetId,
          asset.candidateId,
          project.projectId,
          asset.sourceReviewId,
          asset.assetType,
          asset.title,
          asset.contentMarkdown,
          asset.publishStatus,
          asset.publishedAt,
          asset.createdAt,
          asset.updatedAt,
        );
      });

      (project.evaluationRecords ?? []).forEach((record) => {
        insertEvaluationRecord.run(
          record.evaluationId,
          project.projectId,
          record.decisionId,
          record.actionId,
          record.runId,
          record.reviewId,
          record.candidateId,
          record.evaluationType,
          record.scoreJson,
          record.notes,
          record.createdAt,
        );
      });
    });

    runtimeWorkflows.forEach((workflow) => {
      insertWorkflowRun.run(
        workflow.workflowId,
        workflow.projectId,
        workflow.actionId,
        workflow.role,
        workflow.actionDomain,
        workflow.status,
        workflow.currentTaskType,
        workflow.startedAt,
        workflow.finishedAt,
        workflow.lastEventAt,
      );
    });

    runtimeTasks.forEach((task) => {
      insertTaskRun.run(
        task.taskId,
        task.workflowId,
        task.projectId,
        task.actionId,
        task.runId,
        task.taskType,
        task.attempt,
        task.status,
        task.requestPayload ? JSON.stringify(task.requestPayload) : null,
        task.responsePayload ? JSON.stringify(task.responsePayload) : null,
        task.errorMessage,
        task.startedAt,
        task.finishedAt,
        task.createdAt,
        task.updatedAt,
      );
    });

    runtimeEvents.forEach((event) => {
      insertRuntimeEvent.run(
        event.eventId,
        event.workflowId,
        event.taskId,
        event.projectId,
        event.actionId,
        event.eventType,
        event.status,
        event.summary,
        event.payload ? JSON.stringify(event.payload) : null,
        event.createdAt,
      );
    });

    retryRecords.forEach((record) => {
      insertRetryRecord.run(
        record.retryId,
        record.workflowId,
        record.originalTaskId,
        record.newTaskId,
        record.operator,
        record.reason,
        record.createdAt,
      );
    });

    evalCases.forEach((item) => {
      insertEvalCase.run(
        item.caseId,
        item.name,
        item.scope,
        item.severity,
        item.status,
        item.ruleSpecJson,
        item.createdAt,
      );
    });

    evalSuites.forEach((item) => {
      insertEvalSuite.run(
        item.suiteId,
        item.name,
        item.description,
        item.status,
        item.caseIdsJson,
        item.createdAt,
      );
    });

    evalRuns.forEach((item) => {
      insertEvalRun.run(
        item.runId,
        item.projectId,
        item.suiteId,
        item.status,
        item.summaryJson,
        item.startedAt,
        item.finishedAt,
      );
    });

    evalResults.forEach((item) => {
      insertEvalResult.run(
        item.resultId,
        item.runId,
        item.caseId,
        item.relatedObjectType,
        item.relatedObjectId,
        item.status,
        item.scoreJson,
        item.notes,
        item.createdAt,
      );
    });

    gateDecisions.forEach((item) => {
      insertGateDecision.run(
        item.gateId,
        item.runId,
        item.decision,
        item.summary,
        item.createdAt,
      );
    });

    policyObjects.forEach((item) => {
      insertPolicyObject.run(
        item.policyId,
        item.policyType,
        item.title,
        item.owner,
        item.payloadJson,
        item.createdAt,
        item.updatedAt,
      );
    });

    templateObjects.forEach((item) => {
      insertTemplateObject.run(
        item.templateId,
        item.title,
        item.owner,
        item.payloadJson,
        item.createdAt,
        item.updatedAt,
      );
    });

    skillObjects.forEach((item) => {
      insertSkillObject.run(
        item.skillId,
        item.title,
        item.owner,
        item.payloadJson,
        item.createdAt,
        item.updatedAt,
      );
    });

    ontologyRegistry.forEach((item) => {
      insertOntologyRegistry.run(
        item.registryId,
        item.itemType,
        item.name,
        item.status,
        item.owner,
        item.currentVersion,
        item.sourceTable,
        item.sourceId,
        item.updatedAt,
      );
    });

    ontologyVersions.forEach((item) => {
      insertOntologyVersion.run(
        item.versionId,
        item.registryId,
        item.version,
        item.payloadJson,
        item.changeNote,
        item.createdAt,
      );
    });

    sourceAdapters.forEach((item) => {
      insertSourceAdapter.run(
        item.adapterId,
        item.name,
        item.mode,
        item.owner,
        item.connectorKey,
        item.status,
        item.createdAt,
        item.updatedAt,
      );
    });

    bridgeConfigs.forEach((item) => {
      insertBridgeConfig.run(
        item.configId,
        item.adapterId,
        item.configJson,
        item.createdAt,
        item.updatedAt,
      );
    });

    connectorRegistry.forEach((item) => {
      insertConnectorRegistry.run(
        item.connectorId,
        item.connectorKey,
        item.mode,
        item.title,
        item.status,
        item.description,
        item.createdAt,
        item.updatedAt,
      );
    });

    syncRecords.forEach((item) => {
      insertSyncRecord.run(
        item.syncId,
        item.adapterId,
        item.mode,
        item.startedAt,
        item.finishedAt,
        item.rowsImported,
        item.mappingErrorsJson,
        item.freshnessSeconds,
        item.status,
      );
    });

    ontologyEntities.forEach((entity) => {
      insertOntology.run(entity.entityId, entity.entityType, entity.entityName, entity.entityJson);
    });

    stageRules.forEach((rule) => {
      insertStageRule.run(
        rule.ruleId,
        rule.stage,
        rule.ruleType,
        rule.ruleText,
        rule.requiredFieldsJson,
        rule.exitCriteriaJson,
      );
    });

    knowledgeAssets.forEach((asset) => {
      insertKnowledgeAsset.run(
        asset.assetId,
        asset.title,
        asset.assetType,
        asset.stage,
        asset.role,
        asset.sourceProjectId,
        JSON.stringify(asset.applicability),
        asset.contentMarkdown,
        timestamps.created,
        timestamps.updated,
      );

      chunkMarkdownAsset({
        assetId: asset.assetId,
        contentMarkdown: asset.contentMarkdown,
        keywords: asset.keywords,
        stage: asset.stage,
        role: asset.role,
        assetType: asset.assetType,
      }).forEach((chunk) => {
        insertKnowledgeChunk.run(
          chunk.chunkId,
          chunk.assetId,
          chunk.chunkText,
          chunk.chunkIndex,
          chunk.keywords,
          chunk.stage,
          chunk.role,
          chunk.assetType,
        );
        insertKnowledgeChunkFts.run(
          chunk.chunkId,
          chunk.assetId,
          chunk.chunkText,
          chunk.keywords,
          chunk.stage,
          chunk.role,
          chunk.assetType,
        );
      });
    });

    projects.forEach((project) => {
      (project.knowledgeFeedbackRecords ?? []).forEach((record) => {
        insertKnowledgeFeedbackRecord.run(
          record.feedbackId,
          record.sourceType,
          record.sourceId,
          record.targetAssetId,
          record.feedbackMode,
          record.status,
          record.createdAt,
        );
      });
    });

    db.exec("COMMIT;");
    return {
      dbPath: dbPath ?? null,
      projectCount: projects.length,
    };
  } catch (error) {
    db.exec("ROLLBACK;");
    throw error;
  } finally {
    db.close();
  }
}
