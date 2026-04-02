import type {
  AgentState,
  ApplicabilitySpec,
  ActionType,
  AssetCandidate,
  AssetType,
  ApprovalStatus,
  ConfidenceLevel,
  CreativeVersion,
  DecisionOption,
  ExecutionMode,
  ExecutionStatus,
  ExpressionPlan,
  LifecycleStage,
  OpportunityAssessment,
  OpportunitySignal,
  PersonRef,
  ProductDefinition,
  ProjectHealth,
  ProjectStatus,
  ProjectType,
  ReviewVerdict,
  RiskLevel,
  RoleView,
  SignalFreshness,
  TrendDirection,
} from "../domain/types/model";

export interface ProjectSeed {
  projectKey: string;
  name: string;
  type: ProjectType;
  stage: LifecycleStage;
  status?: ProjectStatus;
  owner: string;
  priority: number;
  health: ProjectHealth;
  riskLevel: RiskLevel;
  targetSummary: string;
  statusSummary: string;
  latestPulse: string;
  keyBlocker?: string;
  stakeholders: PersonRef[];
  roleAudiences: RoleView[];
  decisionSeed: {
    problemOrOpportunity: string;
    rationale: string;
    rootCauseSummary?: string;
    options: DecisionOption[];
    recommendedOptionId?: string;
    confidence: ConfidenceLevel;
    requiresHumanApproval: boolean;
    pendingQuestions?: string[];
  };
}

export interface OpportunitySignalSeed {
  signalKey: string;
  projectKey: string;
  type: OpportunitySignal["type"];
  summary: string;
  strength: number;
  freshness: SignalFreshness;
  assessment: OpportunityAssessment;
}

export interface DefinitionSeed {
  projectKey: string;
  definition: Omit<ProductDefinition, "id" | "projectId" | "createdAt" | "updatedAt">;
  samplingReview?: {
    summary: string;
    feasibilityVerdict: "pass" | "revise" | "fail";
    costRisk: RiskLevel;
    craftRisk: RiskLevel;
    leadTimeRisk: RiskLevel;
    massProductionRisk: RiskLevel;
    expressionReadinessRisk: RiskLevel;
  };
  expression?: Omit<ExpressionPlan, "id" | "projectId" | "createdAt" | "updatedAt"> & {
    creativeVersions: Array<Omit<CreativeVersion, "id" | "projectId" | "createdAt" | "updatedAt">>;
  };
}

export interface PerformanceSeed {
  projectKey: string;
  health: ProjectHealth;
  riskLevel: RiskLevel;
  latestPulse: string;
  keyBlocker?: string;
  pendingApprovalCount: number;
  runningAgentCount: number;
  criticalExceptionCount: number;
  kpis: Array<{
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
  }>;
  agentStates: Array<Omit<AgentState, "id" | "projectId" | "createdAt" | "updatedAt">>;
  exceptions: Array<{
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
  }>;
}

export interface ActionSeed {
  actionKey: string;
  projectKey: string;
  sourceStage: LifecycleStage;
  actionType?: ActionType;
  actionVersion?: number;
  idempotencyKey?: string;
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
  approver?: string;
  approvalReason?: string;
  executionEvents: Array<{
    actorType: "human" | "agent" | "automation";
    actorId: string;
    status: ExecutionStatus;
    summary: string;
    at: string;
  }>;
}

export interface KnowledgeAssetSeed {
  assetKey: string;
  type: AssetType;
  title: string;
  summary: string;
  stage: LifecycleStage;
  sourceProjectKey?: string;
  reuseCount: number;
  status: "draft" | "published" | "deprecated";
  applicability?: string | ApplicabilitySpec;
  sourceInfo: string;
}

export interface ReviewSeed {
  projectKey: string;
  verdict: ReviewVerdict;
  resultSummary: string;
  attributionSummary: string;
  attributionFactors: Array<{
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
  }>;
  lessonsLearned: string[];
  recommendations: string[];
  assetCandidates: Array<{
    candidateKey: string;
    type: AssetCandidate["type"];
    title: string;
    rationale: string;
    approvalStatus: AssetCandidate["approvalStatus"];
    applicability?: string | ApplicabilitySpec;
  }>;
  knowledgeAssets: KnowledgeAssetSeed[];
}

export interface PilotRawState {
  tick: number;
  projects: ProjectSeed[];
  opportunitySignals: OpportunitySignalSeed[];
  definitions: DefinitionSeed[];
  performance: PerformanceSeed[];
  actions: ActionSeed[];
  reviews: ReviewSeed[];
}

const timestamps = {
  created: "2026-04-02T09:00:00+08:00",
  updated: "2026-04-02T10:15:00+08:00",
  recent: "2026-04-02T10:45:00+08:00",
  justNow: "2026-04-02T10:58:00+08:00",
};

const sharedStakeholders: PersonRef[] = [
  { id: "ceo-zhang", name: "张伟", role: "ceo" },
  { id: "prd-li", name: "李安", role: "product_rd_director" },
  { id: "ops-zhao", name: "赵颖", role: "growth_director" },
  { id: "visual-lin", name: "林乔", role: "visual_director" },
];

export function normalizeEntityId(prefix: string, rawKey: string) {
  return `${prefix}-${rawKey.toLowerCase().replace(/_/g, "-")}`;
}

export function normalizeProjectId(projectKey: string) {
  return normalizeEntityId("pilot", projectKey);
}

export function normalizeActionId(actionKey: string) {
  return normalizeEntityId("action", actionKey);
}

export function normalizeAssetId(assetKey: string) {
  return normalizeEntityId("asset", assetKey);
}

export function normalizeCandidateId(candidateKey: string) {
  return normalizeEntityId("candidate", candidateKey);
}

export function normalizeReviewId(projectKey: string) {
  return normalizeEntityId("review", projectKey);
}

const seedState: PilotRawState = {
  tick: 0,
  projects: [
    {
      projectKey: "OPP_URBAN_LITE",
      name: "都市轻量通勤包",
      type: "opportunity_project",
      stage: "opportunity_pool",
      owner: "产品机会组",
      priority: 92,
      health: "watch",
      riskLevel: "medium",
      targetSummary: "验证轻量通勤场景是否值得开新品。",
      statusSummary: "趋势和需求同时走强，等待立项判断。",
      latestPulse: "平台上“轻量通勤”相关搜索连续两周上升。",
      keyBlocker: "需要确认价格带是否落在可复制的供应链区间。",
      stakeholders: sharedStakeholders,
      roleAudiences: ["ceo", "product_rd_director"],
      decisionSeed: {
        problemOrOpportunity: "是否将都市轻量通勤包推进为正式立项项目。",
        rationale: "平台趋势、竞品缺口和高频用户反馈都指向明确机会窗口。",
        rootCauseSummary: "现有通勤包普遍偏重，缺少“轻量但有质感”的选项。",
        options: [
          {
            id: "op-initiate",
            title: "立即立项",
            summary: "进入新品孵化，先锁定定义和价格带。",
            expectedImpact: "把机会窗口提前 2 周转为可验证项目。",
            risk: "medium",
            resourcesNeeded: "商品经理 1 人 + 打样资源 1 轮",
            validationWindow: "7 天",
            autoExecutable: false,
          },
          {
            id: "op-observe",
            title: "继续观察",
            summary: "保留机会，不启动定义和打样。",
            expectedImpact: "降低资源消耗，但可能错过窗口。",
            risk: "low",
            resourcesNeeded: "数据观察",
            validationWindow: "14 天",
            autoExecutable: true,
          },
        ],
        recommendedOptionId: "op-initiate",
        confidence: "high",
        requiresHumanApproval: true,
        pendingQuestions: ["价格带是 299-399 还是 399-499 更适合首发验证？"],
      },
    },
    {
      projectKey: "OPP_OUTDOOR_FLEX",
      name: "户外轻机能双肩包",
      type: "opportunity_project",
      stage: "opportunity_pool",
      owner: "产品机会组",
      priority: 78,
      health: "healthy",
      riskLevel: "medium",
      targetSummary: "验证户外轻机能风格是否适合切入下一波商机池。",
      statusSummary: "可持续观察，等待更多需求聚类证据。",
      latestPulse: "竞品上新节奏快，但价格带仍然分散。",
      stakeholders: sharedStakeholders,
      roleAudiences: ["product_rd_director"],
      decisionSeed: {
        problemOrOpportunity: "是否要把机能风机会拉入正式机会评估。",
        rationale: "竞品热度强，但品牌已有资源复用有限。",
        options: [
          {
            id: "flex-evaluate",
            title: "进入评估",
            summary: "补齐目标用户和价格带验证。",
            expectedImpact: "快速判断是否值得消耗打样资源。",
            risk: "medium",
            resourcesNeeded: "趋势分析 + 用户访谈",
            validationWindow: "10 天",
            autoExecutable: true,
          },
          {
            id: "flex-ignore",
            title: "暂不跟进",
            summary: "保持机会记录，不进入当前周期。",
            expectedImpact: "节省资源，但机会延后。",
            risk: "low",
            resourcesNeeded: "无",
            validationWindow: "0 天",
            autoExecutable: true,
          },
        ],
        recommendedOptionId: "flex-evaluate",
        confidence: "medium",
        requiresHumanApproval: false,
      },
    },
    {
      projectKey: "INC_OFFICE_ELITE",
      name: "商务精英系列 2.0",
      type: "new_product_project",
      stage: "new_product_incubation",
      owner: "商品定义组",
      priority: 88,
      health: "watch",
      riskLevel: "medium",
      targetSummary: "完成新品定义、打样评审和首发素材准备。",
      statusSummary: "定义已稳定，打样评审等待人工确认。",
      latestPulse: "样品反馈整体通过，但交期风险仍偏高。",
      keyBlocker: "需要老板确认 699 价格带是否维持。",
      stakeholders: sharedStakeholders,
      roleAudiences: ["ceo", "product_rd_director", "visual_director"],
      decisionSeed: {
        problemOrOpportunity: "价格带和首发版本是否按当前方案推进。",
        rationale: "打样质量和商务风格验证结果较好，但交期和客单价要平衡。",
        options: [
          {
            id: "office-keep-price",
            title: "维持 699 价格带",
            summary: "保留品牌感，首发用高价值表达验证转化。",
            expectedImpact: "提高客单和利润空间。",
            risk: "medium",
            resourcesNeeded: "维持当前物料标准",
            validationWindow: "5 天",
            autoExecutable: false,
          },
          {
            id: "office-lower-price",
            title: "下探到 629",
            summary: "降低尝试门槛，换取更高首发转化。",
            expectedImpact: "放大首发样本量。",
            risk: "medium",
            resourcesNeeded: "重新核算毛利",
            validationWindow: "5 天",
            autoExecutable: false,
          },
        ],
        recommendedOptionId: "office-keep-price",
        confidence: "medium",
        requiresHumanApproval: true,
      },
    },
    {
      projectKey: "INC_PARENT_KIT",
      name: "多功能亲子收纳包",
      type: "new_product_project",
      stage: "new_product_incubation",
      owner: "商品定义组",
      priority: 74,
      health: "healthy",
      riskLevel: "low",
      targetSummary: "完成亲子场景拆解和物料规格确认。",
      statusSummary: "定义推进顺畅，等待第二轮打样。",
      latestPulse: "用户反馈聚焦“轻便 + 好收纳”，方向清晰。",
      stakeholders: sharedStakeholders,
      roleAudiences: ["product_rd_director"],
      decisionSeed: {
        problemOrOpportunity: "是否提前准备首发视觉模板。",
        rationale: "打样虽然未结束，但表达方向已较稳定。",
        options: [
          {
            id: "parent-prepare-visual",
            title: "提前准备首发视觉",
            summary: "让首发期节奏更紧凑。",
            expectedImpact: "缩短从打样通过到首发的时间。",
            risk: "low",
            resourcesNeeded: "视觉团队半天支持",
            validationWindow: "3 天",
            autoExecutable: true,
          },
          {
            id: "parent-wait",
            title: "等待第二轮打样后再启动",
            summary: "控制返工风险。",
            expectedImpact: "减少视觉返工。",
            risk: "low",
            resourcesNeeded: "无",
            validationWindow: "7 天",
            autoExecutable: true,
          },
        ],
        recommendedOptionId: "parent-prepare-visual",
        confidence: "high",
        requiresHumanApproval: false,
      },
    },
    {
      projectKey: "LAUNCH_SUMMER_REFRESH",
      name: "夏日清爽套装",
      type: "new_product_project",
      stage: "launch_validation",
      owner: "首发验证组",
      priority: 96,
      health: "at_risk",
      riskLevel: "high",
      targetSummary: "验证首发转化是否成立，并决定放量还是调整。",
      statusSummary: "点击率尚可，但转化率和 GMV 明显低于目标。",
      latestPulse: "当前 GMV 达成率 64%，需要尽快做价格和主图决策。",
      keyBlocker: "价格敏感度高于预期，但还未确认是否立即调价。",
      stakeholders: sharedStakeholders,
      roleAudiences: ["ceo", "growth_director", "visual_director"],
      decisionSeed: {
        problemOrOpportunity: "首发转化不足，是否立刻调价并同步更新主图。",
        rationale: "CTR 达标但 CVR 偏低，说明流量并非最大问题，成交阻力更大。",
        rootCauseSummary: "价格与价值表达不匹配，导致用户停留但不下单。",
        options: [
          {
            id: "launch-price-adjustment",
            title: "调价到 249 并保留现有素材",
            summary: "优先验证价格带是否阻碍成交。",
            expectedImpact: "快速提升 CVR，缩短验证周期。",
            risk: "high",
            resourcesNeeded: "价格审批 + 库存协调",
            validationWindow: "48 小时",
            autoExecutable: false,
          },
          {
            id: "launch-visual-refresh",
            title: "保持价格，升级主图与首屏表达",
            summary: "继续验证价值表达能否支撑原价。",
            expectedImpact: "可能保住客单，但回收周期更长。",
            risk: "medium",
            resourcesNeeded: "视觉团队 1 天",
            validationWindow: "72 小时",
            autoExecutable: false,
          },
          {
            id: "launch-observe",
            title: "继续观察 24 小时",
            summary: "不立即调整，收集更多首发样本。",
            expectedImpact: "减少误判，但损失验证速度。",
            risk: "high",
            resourcesNeeded: "无",
            validationWindow: "24 小时",
            autoExecutable: true,
          },
        ],
        recommendedOptionId: "launch-price-adjustment",
        confidence: "medium",
        requiresHumanApproval: true,
        pendingQuestions: ["调价是否会伤害品牌感知？", "是否需要同时更换主图 V3？"],
      },
    },
    {
      projectKey: "GROWTH_CLASSIC_COMMUTER",
      name: "经典通勤包增长作战",
      type: "growth_optimization_project",
      stage: "growth_optimization",
      owner: "增长优化组",
      priority: 83,
      health: "watch",
      riskLevel: "medium",
      targetSummary: "提高 ROI 并稳定高转化素材组合。",
      statusSummary: "ROI 回升，但库存和投放节奏仍需联动。",
      latestPulse: "上周优化后 ROI 提升 0.4，库存告警仍在。",
      keyBlocker: "补单动作等待审批，影响放量节奏。",
      stakeholders: sharedStakeholders,
      roleAudiences: ["ceo", "growth_director"],
      decisionSeed: {
        problemOrOpportunity: "是否在本周继续放量并同步补单。",
        rationale: "投放效率提升，但库存不足会导致断流。",
        options: [
          {
            id: "growth-scale",
            title: "继续放量并补单",
            summary: "保持增长曲线，避免断货。",
            expectedImpact: "扩大周度 GMV 和 ROI。",
            risk: "medium",
            resourcesNeeded: "库存资金 + 自动化执行",
            validationWindow: "7 天",
            autoExecutable: false,
          },
          {
            id: "growth-hold",
            title: "控制投放节奏",
            summary: "先消化库存风险再扩大预算。",
            expectedImpact: "更稳健，但增长放缓。",
            risk: "low",
            resourcesNeeded: "无",
            validationWindow: "7 天",
            autoExecutable: true,
          },
        ],
        recommendedOptionId: "growth-scale",
        confidence: "high",
        requiresHumanApproval: true,
      },
    },
    {
      projectKey: "REVIEW_BUSINESS_ELITE",
      name: "商务精英系列",
      type: "growth_optimization_project",
      stage: "review_capture",
      owner: "复盘沉淀组",
      priority: 71,
      health: "healthy",
      riskLevel: "low",
      targetSummary: "完成项目复盘并沉淀可复用打法。",
      statusSummary: "复盘已生成，等待资产候选确认入库。",
      latestPulse: "复盘显示“首发高客单+极简商务风”路径可复用。",
      stakeholders: sharedStakeholders,
      roleAudiences: ["ceo", "growth_director", "visual_director"],
      decisionSeed: {
        problemOrOpportunity: "哪些复盘结论值得固化为标准资产。",
        rationale: "已有正向结果，需要选择最可复用的部分入库。",
        options: [
          {
            id: "review-publish-templates",
            title: "优先发布模板与规则",
            summary: "先沉淀可复用的高频资产。",
            expectedImpact: "让下一轮项目直接复用。",
            risk: "low",
            resourcesNeeded: "资产管理员 1 人",
            validationWindow: "2 天",
            autoExecutable: true,
          },
          {
            id: "review-archive-case-only",
            title: "只保留案例",
            summary: "降低维护成本，但复用价值较弱。",
            expectedImpact: "沉淀轻量，但不够可执行。",
            risk: "low",
            resourcesNeeded: "无",
            validationWindow: "1 天",
            autoExecutable: true,
          },
        ],
        recommendedOptionId: "review-publish-templates",
        confidence: "high",
        requiresHumanApproval: false,
      },
    },
  ],
  opportunitySignals: [
    {
      signalKey: "urban-trend",
      projectKey: "OPP_URBAN_LITE",
      type: "trend",
      summary: "轻量通勤包近 14 天搜索量上涨 26%。",
      strength: 88,
      freshness: "near_real_time",
      assessment: {
        businessValueScore: 90,
        feasibilityScore: 76,
        expressionPotentialScore: 82,
        confidence: "high",
        recommendation: "initiate",
      },
    },
    {
      signalKey: "urban-gap",
      projectKey: "OPP_URBAN_LITE",
      type: "competitor_gap",
      summary: "竞品多集中在 399+ 价格带，299-399 仍有空档。",
      strength: 84,
      freshness: "batch",
      assessment: {
        businessValueScore: 90,
        feasibilityScore: 76,
        expressionPotentialScore: 82,
        confidence: "high",
        recommendation: "initiate",
      },
    },
    {
      signalKey: "urban-demand",
      projectKey: "OPP_URBAN_LITE",
      type: "demand_cluster",
      summary: "评论中“轻、能装电脑、上班不累”成为高频词。",
      strength: 91,
      freshness: "batch",
      assessment: {
        businessValueScore: 90,
        feasibilityScore: 76,
        expressionPotentialScore: 82,
        confidence: "high",
        recommendation: "initiate",
      },
    },
    {
      signalKey: "flex-competitor",
      projectKey: "OPP_OUTDOOR_FLEX",
      type: "competitor_gap",
      summary: "机能风双肩包热度高，但主流竞品设计趋同。",
      strength: 73,
      freshness: "batch",
      assessment: {
        businessValueScore: 78,
        feasibilityScore: 68,
        expressionPotentialScore: 80,
        confidence: "medium",
        recommendation: "evaluate",
      },
    },
    {
      signalKey: "flex-style",
      projectKey: "OPP_OUTDOOR_FLEX",
      type: "style_opportunity",
      summary: "社媒内容显示“轻户外 + 通勤”混搭风格上升。",
      strength: 70,
      freshness: "near_real_time",
      assessment: {
        businessValueScore: 78,
        feasibilityScore: 68,
        expressionPotentialScore: 80,
        confidence: "medium",
        recommendation: "evaluate",
      },
    },
  ],
  definitions: [
    {
      projectKey: "INC_OFFICE_ELITE",
      definition: {
        positioning: "面向 30-40 岁商务人群的高客单通勤包系列",
        targetAudience: "城市商务人群",
        keySellingPoints: ["更挺括的结构", "商务场景更正式", "耐磨五金升级"],
        priceBand: "¥629-699",
        specsSummary: "13 寸电脑位 + 文件分层 + 可拆卸肩带",
        materialOrCraftSummary: "高密尼龙 + 细纹皮拼接",
        versionStrategy: "首发先上黑色与岩灰色，后续扩棕色",
        feasibilityRisk: "medium",
        samplingStatus: "ready_for_review",
        blockingIssues: ["交期比预期多 3 天"],
      },
      samplingReview: {
        summary: "第一轮打样整体通过，但交期和五金稳定性需持续关注。",
        feasibilityVerdict: "pass",
        costRisk: "medium",
        craftRisk: "low",
        leadTimeRisk: "medium",
        massProductionRisk: "medium",
        expressionReadinessRisk: "low",
      },
      expression: {
        contentBrief: "强调商务感、挺括轮廓和耐用五金。",
        visualBrief: "深灰背景 + 近景材质细节 + 人物通勤场景。",
        readinessStatus: "ready",
        recommendedDirection: "极简商务风",
        creativeVersions: [
          {
            name: "商务极简主图 V1",
            type: "hero_image",
            status: "selected",
            performanceSummary: "内部评审通过",
            brandConsistencyScore: 91,
          },
          {
            name: "细节卖点详情页 V1",
            type: "detail_page",
            status: "testing",
            performanceSummary: "等待首发上线",
            brandConsistencyScore: 88,
          },
        ],
      },
    },
    {
      projectKey: "INC_PARENT_KIT",
      definition: {
        positioning: "适合短途出行的轻量亲子收纳包",
        targetAudience: "25-40 岁新手父母",
        keySellingPoints: ["收纳分层清晰", "轻量背负", "可挂婴儿车"],
        priceBand: "¥269-329",
        specsSummary: "主仓 + 保温位 + 防水侧袋",
        materialOrCraftSummary: "轻量防泼水尼龙",
        versionStrategy: "先推基础色，后续补充印花版",
        feasibilityRisk: "low",
        samplingStatus: "in_progress",
      },
      expression: {
        contentBrief: "突出“带娃也能井井有条”。",
        visualBrief: "家庭出行场景 + 分层结构图示。",
        readinessStatus: "in_progress",
        recommendedDirection: "轻松亲和风格",
        creativeVersions: [
          {
            name: "亲子场景主图 V1",
            type: "hero_image",
            status: "draft",
            performanceSummary: "等待第二轮打样",
            brandConsistencyScore: 83,
          },
        ],
      },
    },
    {
      projectKey: "LAUNCH_SUMMER_REFRESH",
      definition: {
        positioning: "针对城市通勤女性的夏日轻便组合套装",
        targetAudience: "25-35 岁白领女性",
        keySellingPoints: ["三件套更高性价比", "通勤与周末两用", "配色清爽"],
        priceBand: "¥249-299",
        specsSummary: "主包 + 小包 + 配件袋",
        materialOrCraftSummary: "PU + 细纹面料拼接",
        versionStrategy: "先跑米白和浅蓝，观察颜色偏好",
        feasibilityRisk: "low",
        samplingStatus: "approved",
      },
      expression: {
        contentBrief: "强调“三件套”和夏日通勤轻松感。",
        visualBrief: "清爽浅色背景 + 套装组合展示。",
        readinessStatus: "launched",
        recommendedDirection: "清爽极简风",
        creativeVersions: [
          {
            name: "主图 V2",
            type: "hero_image",
            status: "testing",
            performanceSummary: "CTR 稳定，但 CVR 不足",
            brandConsistencyScore: 86,
          },
          {
            name: "主图 V3",
            type: "hero_image",
            status: "draft",
            performanceSummary: "等待是否进入调价后联测",
            brandConsistencyScore: 89,
          },
        ],
      },
    },
    {
      projectKey: "GROWTH_CLASSIC_COMMUTER",
      definition: {
        positioning: "稳定贡献 GMV 的经典通勤爆款",
        targetAudience: "核心通勤女性用户",
        keySellingPoints: ["经典款稳定转化", "复购高", "素材沉淀完整"],
        priceBand: "¥359-399",
        specsSummary: "经典通勤单包",
        materialOrCraftSummary: "耐磨牛津布",
        versionStrategy: "以增长优化为主，不再大改规格",
        feasibilityRisk: "low",
        samplingStatus: "approved",
      },
      expression: {
        contentBrief: "围绕稳定爆款做素材轮换和投放扩量。",
        visualBrief: "保留主视觉骨架，优化卖点顺序。",
        readinessStatus: "launched",
        recommendedDirection: "稳定高转化表达",
        creativeVersions: [
          {
            name: "增长素材 V5",
            type: "content_asset",
            status: "selected",
            performanceSummary: "ROI 提升 0.4",
            brandConsistencyScore: 90,
          },
        ],
      },
    },
  ],
  performance: [
    {
      projectKey: "OPP_URBAN_LITE",
      health: "watch",
      riskLevel: "medium",
      latestPulse: "商机评分 8.8/10，建议进入新品孵化。",
      keyBlocker: "价格带需要进一步验证。",
      pendingApprovalCount: 1,
      runningAgentCount: 1,
      criticalExceptionCount: 0,
      kpis: [
        { key: "launch_score", label: "机会评分", value: 88, unit: "score", trend: "up", freshness: "batch" },
        { key: "impressions", label: "相关曝光", value: 185000, unit: "count", trend: "up", freshness: "near_real_time" },
      ],
      agentStates: [
        {
          agentType: "opportunity",
          status: "running",
          summary: "持续抓取通勤轻量化机会信号。",
          lastActionSummary: "更新了用户需求聚类。",
        },
      ],
      exceptions: [],
    },
    {
      projectKey: "OPP_OUTDOOR_FLEX",
      health: "healthy",
      riskLevel: "medium",
      latestPulse: "更多证据正在收集，暂未进入正式立项。",
      pendingApprovalCount: 0,
      runningAgentCount: 1,
      criticalExceptionCount: 0,
      kpis: [
        { key: "launch_score", label: "机会评分", value: 76, unit: "score", trend: "flat", freshness: "batch" },
      ],
      agentStates: [
        {
          agentType: "opportunity",
          status: "running",
          summary: "继续比对竞品差异和目标客群。",
          lastActionSummary: "更新了风格机会卡片。",
        },
      ],
      exceptions: [],
    },
    {
      projectKey: "INC_OFFICE_ELITE",
      health: "watch",
      riskLevel: "medium",
      latestPulse: "打样评审已排期，等待价格带最终确认。",
      keyBlocker: "老板尚未批准最终价格带。",
      pendingApprovalCount: 1,
      runningAgentCount: 2,
      criticalExceptionCount: 0,
      kpis: [
        { key: "launch_score", label: "孵化完成度", value: 74, unit: "score", trend: "up", freshness: "batch" },
        { key: "profit", label: "预计毛利", value: 41, unit: "%", trend: "flat", freshness: "batch" },
      ],
      agentStates: [
        {
          agentType: "new_product",
          status: "waiting_human",
          summary: "等待价格带审批后即可进入首发准备。",
          waitingReason: "价格带未确认",
          lastActionSummary: "完成第一轮打样结论归纳。",
        },
        {
          agentType: "visual",
          status: "running",
          summary: "首发视觉素材已准备 80%。",
          lastActionSummary: "补齐了商务风详情页说明。",
        },
      ],
      exceptions: [],
    },
    {
      projectKey: "INC_PARENT_KIT",
      health: "healthy",
      riskLevel: "low",
      latestPulse: "第二轮打样预计 3 天后返回。",
      pendingApprovalCount: 0,
      runningAgentCount: 1,
      criticalExceptionCount: 0,
      kpis: [
        { key: "launch_score", label: "孵化完成度", value: 63, unit: "score", trend: "up", freshness: "batch" },
      ],
      agentStates: [
        {
          agentType: "new_product",
          status: "running",
          summary: "持续跟踪第二轮打样和规格反馈。",
          lastActionSummary: "整理亲子场景使用清单。",
        },
      ],
      exceptions: [],
    },
    {
      projectKey: "LAUNCH_SUMMER_REFRESH",
      health: "at_risk",
      riskLevel: "high",
      latestPulse: "GMV 达成率 64%，建议优先做价格决策。",
      keyBlocker: "高风险调价动作仍在等待审批。",
      pendingApprovalCount: 1,
      runningAgentCount: 2,
      criticalExceptionCount: 1,
      kpis: [
        { key: "gmv", label: "GMV", value: 320000, unit: "currency", trend: "down", deltaVsTarget: -180000, deltaVsPrevious: -12000, freshness: "real_time" },
        { key: "ctr", label: "点击率", value: 2.8, unit: "%", trend: "up", deltaVsTarget: 0.2, deltaVsPrevious: 0.3, freshness: "real_time" },
        { key: "cvr", label: "转化率", value: 1.2, unit: "%", trend: "down", deltaVsTarget: -1.3, deltaVsPrevious: -0.2, freshness: "real_time" },
        { key: "roi", label: "ROI", value: 1.9, unit: "score", trend: "down", deltaVsTarget: -0.6, deltaVsPrevious: -0.1, freshness: "real_time" },
      ],
      agentStates: [
        {
          agentType: "diagnosis",
          status: "waiting_human",
          summary: "诊断结果认为价格敏感度高于预期。",
          waitingReason: "等待是否批准调价动作",
          lastActionSummary: "补充了价格敏感度评估。",
        },
        {
          agentType: "visual",
          status: "running",
          summary: "主图 V3 已准备联测。",
          lastActionSummary: "完成了 V3 首屏重排。",
        },
      ],
      exceptions: [
        {
          source: "low_confidence_decision",
          severity: "high",
          summary: "价格与主图两条方案都可能影响品牌感知，需要人工拍板。",
          requiresHumanIntervention: true,
        },
      ],
    },
    {
      projectKey: "GROWTH_CLASSIC_COMMUTER",
      health: "watch",
      riskLevel: "medium",
      latestPulse: "ROI 已回升，但库存告警仍未解除。",
      keyBlocker: "补单审批未完成，影响下一轮放量。",
      pendingApprovalCount: 1,
      runningAgentCount: 2,
      criticalExceptionCount: 0,
      kpis: [
        { key: "gmv", label: "周 GMV", value: 580000, unit: "currency", trend: "up", deltaVsTarget: 30000, deltaVsPrevious: 25000, freshness: "near_real_time" },
        { key: "roi", label: "ROI", value: 2.6, unit: "score", trend: "up", deltaVsTarget: 0.2, deltaVsPrevious: 0.4, freshness: "near_real_time" },
      ],
      agentStates: [
        {
          agentType: "execution",
          status: "running",
          summary: "持续优化投放预算分配。",
          lastActionSummary: "完成渠道预算重分配。",
        },
        {
          agentType: "governance",
          status: "waiting_human",
          summary: "高风险补单动作等待审批。",
          waitingReason: "库存资金需要老板确认",
          lastActionSummary: "生成补单审批卡片。",
        },
      ],
      exceptions: [],
    },
    {
      projectKey: "REVIEW_BUSINESS_ELITE",
      health: "healthy",
      riskLevel: "low",
      latestPulse: "复盘摘要已生成，候选资产待确认。",
      pendingApprovalCount: 0,
      runningAgentCount: 1,
      criticalExceptionCount: 0,
      kpis: [
        { key: "gmv", label: "项目 GMV", value: 850000, unit: "currency", trend: "up", freshness: "batch" },
        { key: "roi", label: "ROI", value: 3.1, unit: "score", trend: "up", freshness: "batch" },
      ],
      agentStates: [
        {
          agentType: "review_capture",
          status: "running",
          summary: "正在把复盘结论整理成模板与规则。",
          lastActionSummary: "新增 2 条资产候选。",
        },
      ],
      exceptions: [],
    },
  ],
  actions: [
    {
      actionKey: "launch_price_adjustment",
      projectKey: "LAUNCH_SUMMER_REFRESH",
      sourceStage: "launch_validation",
      goal: "提升首发转化率",
      title: "调价到 249",
      summary: "把首发售价从 299 调整到 249，验证价格敏感度。",
      expectedImpact: "预计 CVR 回升 0.6-0.9 个百分点。",
      risk: "high",
      owner: "老板",
      approvalStatus: "pending",
      executionMode: "automation",
      executionStatus: "suggested",
      validationWindow: "48 小时",
      rollbackCondition: "调价后 ROI 继续下滑",
      requiresHumanApproval: true,
      triggeredBy: "decision_brain",
      executionEvents: [
        {
          actorType: "agent",
          actorId: "diagnosis.agent",
          status: "suggested",
          summary: "经营大脑建议调价以验证价格敏感度。",
          at: timestamps.updated,
        },
      ],
    },
    {
      actionKey: "launch_visual_refresh",
      projectKey: "LAUNCH_SUMMER_REFRESH",
      sourceStage: "launch_validation",
      goal: "提升首发价值表达",
      title: "上线主图 V3",
      summary: "保持价格不变，先联测主图 V3。",
      expectedImpact: "预计 CTR 再提升 0.2-0.4。",
      risk: "medium",
      owner: "视觉总监",
      approvalStatus: "approved",
      executionMode: "agent",
      executionStatus: "in_progress",
      validationWindow: "72 小时",
      requiresHumanApproval: false,
      triggeredBy: "scenario_agent",
      executionEvents: [
        {
          actorType: "agent",
          actorId: "visual.agent",
          status: "queued",
          summary: "视觉优化 Agent 接管主图联测。",
          at: timestamps.updated,
        },
        {
          actorType: "agent",
          actorId: "visual.agent",
          status: "in_progress",
          summary: "主图 V3 已完成首屏排版，进入联测。",
          at: timestamps.recent,
        },
      ],
    },
    {
      actionKey: "growth_restock",
      projectKey: "GROWTH_CLASSIC_COMMUTER",
      sourceStage: "growth_optimization",
      goal: "保持增长放量节奏",
      title: "追加补单 3000 件",
      summary: "库存预计 6 天内见底，需要补单保障放量。",
      expectedImpact: "避免断货导致的 ROI 损失。",
      risk: "high",
      owner: "老板",
      approvalStatus: "pending",
      executionMode: "manual",
      executionStatus: "suggested",
      validationWindow: "7 天",
      rollbackCondition: "周转压力超过预算阈值",
      requiresHumanApproval: true,
      triggeredBy: "automation_rule",
      executionEvents: [
        {
          actorType: "automation",
          actorId: "inventory.rule",
          status: "suggested",
          summary: "库存预警规则触发补单动作。",
          at: timestamps.updated,
        },
      ],
    },
    {
      actionKey: "growth_budget_redistribution",
      projectKey: "GROWTH_CLASSIC_COMMUTER",
      sourceStage: "growth_optimization",
      goal: "优化投放预算结构",
      title: "重分配渠道预算",
      summary: "把低效渠道预算转移到高 ROI 渠道。",
      expectedImpact: "周 ROI 提升 0.3-0.5。",
      risk: "medium",
      owner: "运营与营销总监",
      approvalStatus: "approved",
      executionMode: "automation",
      executionStatus: "completed",
      validationWindow: "72 小时",
      requiresHumanApproval: false,
      triggeredBy: "scenario_agent",
      executionEvents: [
        {
          actorType: "agent",
          actorId: "execution.agent",
          status: "queued",
          summary: "增长 Agent 提交预算重分配方案。",
          at: timestamps.updated,
        },
        {
          actorType: "automation",
          actorId: "ads.runtime",
          status: "completed",
          summary: "预算重分配已执行，ROI 回升 0.4。",
          at: timestamps.recent,
        },
      ],
    },
    {
      actionKey: "incubation_price_confirmation",
      projectKey: "INC_OFFICE_ELITE",
      sourceStage: "new_product_incubation",
      goal: "锁定首发价格带",
      title: "确认 699 价格带",
      summary: "高客单版本是否保持 699 价格带进入首发。",
      expectedImpact: "保障品牌感和毛利空间。",
      risk: "medium",
      owner: "老板",
      approvalStatus: "pending",
      executionMode: "manual",
      executionStatus: "suggested",
      validationWindow: "5 天",
      requiresHumanApproval: true,
      triggeredBy: "decision_brain",
      executionEvents: [
        {
          actorType: "agent",
          actorId: "new-product.agent",
          status: "suggested",
          summary: "商品定义 Agent 请求确认价格带。",
          at: timestamps.updated,
        },
      ],
    },
  ],
  reviews: [
    {
      projectKey: "LAUNCH_SUMMER_REFRESH",
      verdict: "partial_success",
      resultSummary: "点击有效但转化不足，首发问题已从流量收敛到成交阻力。",
      attributionSummary: "调价与价值表达是影响首发成败的核心变量。",
      attributionFactors: [
        {
          category: "campaign",
          summary: "流量质量基本健康，证明首发流量不是主要问题。",
          impactLevel: "medium",
          controllable: true,
        },
        {
          category: "content",
          summary: "主图 V2 能带来点击，但价值解释还不够强。",
          impactLevel: "high",
          controllable: true,
        },
      ],
      lessonsLearned: [
        "高点击但低转化时，应先区分流量问题还是成交问题。",
        "价格验证动作必须和证据包一起呈现，便于老板拍板。",
      ],
      recommendations: [
        "优先执行调价动作并同步跟踪 ROI。",
        "若调价执行，则复用价格敏感度评估规则做二次验证。",
      ],
      assetCandidates: [
        {
          candidateKey: "summer-launch-price-playbook",
          type: "rule",
          title: "首发低转化调价判断规则",
          rationale: "适用于 CTR 达标但 CVR 明显不足的首发项目。",
          approvalStatus: "pending",
          applicability: "适用于首发验证阶段的高点击低成交项目",
        },
      ],
      knowledgeAssets: [
        {
          assetKey: "summer-price-sensitivity-rule",
          type: "rule",
          title: "价格敏感度分析规则",
          summary: "当 CTR 达标但 CVR 低于目标 1 个点以上时，优先验证价格敏感度。",
          stage: "launch_validation",
          sourceProjectKey: "LAUNCH_SUMMER_REFRESH",
          reuseCount: 3,
          status: "published",
          applicability: "首发验证 / 高点击低转化",
          sourceInfo: "夏日清爽套装首发复盘",
        },
        {
          assetKey: "summer-pricing-evaluation-sample",
          type: "evaluation_sample",
          title: "首发定价评测样本",
          summary: "包含定价前后 CVR、ROI、客单价的对照样本。",
          stage: "launch_validation",
          sourceProjectKey: "LAUNCH_SUMMER_REFRESH",
          reuseCount: 2,
          status: "published",
          applicability: "用于调价前后的效果评估",
          sourceInfo: "夏日清爽套装数据回写样本",
        },
      ],
    },
    {
      projectKey: "REVIEW_BUSINESS_ELITE",
      verdict: "success",
      resultSummary: "高客单首发成功，商务极简表达和标准化首发节奏都可复用。",
      attributionSummary: "成功来自高一致性的商品定义、商务极简主图和紧凑的首发节奏。",
      attributionFactors: [
        {
          category: "product_definition",
          summary: "商品定义非常清晰，围绕高客单商务场景展开。",
          impactLevel: "high",
          controllable: true,
        },
        {
          category: "visual",
          summary: "极简商务风格和材质近景强化了价值感。",
          impactLevel: "high",
          controllable: true,
        },
      ],
      lessonsLearned: [
        "高客单新品需要先把价值感讲清楚，再去放量。",
        "成功首发应立即拆成规则、模板和 SOP，避免只停留在案例。",
      ],
      recommendations: [
        "优先把极简商务风主图模板和放量 SOP 标准化。",
        "把商务客群的价格带判断逻辑沉淀成规则。",
      ],
      assetCandidates: [
        {
          candidateKey: "business-hero-template",
          type: "template",
          title: "极简商务主图模板 V3",
          rationale: "适合高客单商务通勤类目，已验证点击率提升。",
          approvalStatus: "pending",
          applicability: "适用于高客单商务包首发",
        },
        {
          candidateKey: "business-scale-sop",
          type: "sop",
          title: "商务包首发放量 SOP",
          rationale: "把首发通过后 7 天内的放量节奏标准化。",
          approvalStatus: "pending",
          applicability: "适用于首发验证通过后的放量阶段",
        },
      ],
      knowledgeAssets: [
        {
          assetKey: "business-launch-case",
          type: "case",
          title: "商务包首发放量案例",
          summary: "从首发验证到放量一周内的关键动作和结果。",
          stage: "review_capture",
          sourceProjectKey: "REVIEW_BUSINESS_ELITE",
          reuseCount: 8,
          status: "published",
          applicability: "商务通勤类新品",
          sourceInfo: "商务精英系列项目复盘",
        },
        {
          assetKey: "business-launch-template",
          type: "template",
          title: "极简商务主图模板 V2",
          summary: "适用于高客单商务包首发表达的标准主图模板。",
          stage: "launch_validation",
          sourceProjectKey: "REVIEW_BUSINESS_ELITE",
          reuseCount: 6,
          status: "published",
          applicability: "高客单商务包首发",
          sourceInfo: "商务精英系列视觉沉淀",
        },
        {
          assetKey: "business-launch-sop",
          type: "sop",
          title: "新品首发标准 SOP",
          summary: "从立项到首发通过后的标准节奏和检查点。",
          stage: "new_product_incubation",
          sourceProjectKey: "REVIEW_BUSINESS_ELITE",
          reuseCount: 11,
          status: "published",
          applicability: "适用于大多数新品首发",
          sourceInfo: "商务精英系列标准化沉淀",
        },
        {
          assetKey: "business-scale-skill",
          type: "skill",
          title: "首发诊断 Skill 包",
          summary: "用于高客单新品首发期的证据收集和决策编译。",
          stage: "growth_optimization",
          sourceProjectKey: "REVIEW_BUSINESS_ELITE",
          reuseCount: 4,
          status: "published",
          applicability: "首发验证与增长优化交界阶段",
          sourceInfo: "商务精英系列复盘提炼",
        },
      ],
    },
  ],
};

export function createSeedSources(): PilotRawState {
  return structuredClone(seedState);
}
