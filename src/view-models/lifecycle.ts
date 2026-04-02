import { getApprovalLabel, getHealthLabel, getLifecycleStageLabel, getRiskLabel } from "../domain/runtime/labels";
import type {
  AgentState,
  KPIMetric,
  LifecycleStage,
  PilotSnapshot,
  ProjectObject,
  ProjectRealtimeSnapshot,
} from "../domain/types/model";

const inScopeStages: LifecycleStage[] = [
  "opportunity_pool",
  "new_product_incubation",
  "launch_validation",
  "growth_optimization",
  "review_capture",
];

const stageRoutes: Record<LifecycleStage, string> = {
  opportunity_pool: "/opportunity-pool",
  new_product_incubation: "/new-product-incubation",
  launch_validation: "/launch-verification",
  growth_optimization: "/growth-optimization",
  legacy_upgrade: "/product-upgrade",
  review_capture: "/review-assets",
};

const opportunityRecommendationLabels = {
  ignore: "忽略",
  observe: "继续观察",
  evaluate: "进入评估",
  initiate: "建议立项",
} as const;

const samplingStatusLabels = {
  not_started: "未开始",
  in_progress: "打样中",
  ready_for_review: "待评审",
  approved: "已通过",
} as const;

const expressionStatusLabels = {
  not_started: "未开始",
  in_progress: "进行中",
  ready: "就绪",
  launched: "已首发",
} as const;

const agentTypeLabels: Record<AgentState["agentType"], string> = {
  opportunity: "机会 Agent",
  new_product: "新品 Agent",
  diagnosis: "诊断 Agent",
  content: "内容 Agent",
  visual: "视觉 Agent",
  execution: "执行 Agent",
  upgrade: "升级 Agent",
  review_capture: "复盘 Agent",
  governance: "治理 Agent",
  data_observer: "数据观察 Agent",
};

function countPendingApprovals(project: ProjectObject) {
  return project.actions.filter((action) => action.approvalStatus === "pending").length;
}

function countRunningAgents(project: ProjectObject) {
  return project.agentStates.filter(
    (agent) => agent.status === "running" || agent.status === "waiting_human" || agent.status === "blocked",
  ).length;
}

function countHighRiskProjects(project: ProjectObject) {
  return project.riskLevel === "high" || project.riskLevel === "critical" ? 1 : 0;
}

function countBlockedProjects(project: ProjectObject, realtime?: ProjectRealtimeSnapshot) {
  return realtime?.criticalExceptionCount || project.keyBlocker ? 1 : 0;
}

function getMetric(project: ProjectObject, key: KPIMetric["key"]) {
  return project.kpis.metrics.find((metric) => metric.key === key);
}

function formatCompactCurrency(value: number) {
  if (Math.abs(value) >= 10000) {
    return `${(value / 10000).toFixed(value >= 100000 ? 0 : 1)}万`;
  }
  return `${Math.round(value)}`;
}

function formatMetric(metric?: KPIMetric) {
  if (!metric) return "暂无";
  if (metric.unit === "currency") return formatCompactCurrency(metric.value);
  if (metric.unit === "%") return `${metric.value}%`;
  if (metric.unit === "score") return `${metric.value}/10`;
  return `${metric.value}`;
}

function computeTargetProgress(metric?: KPIMetric) {
  if (!metric) return 0;
  const deltaVsTarget = metric.deltaVsTarget ?? 0;
  const target = metric.value - deltaVsTarget;
  if (target <= 0) return metric.value > 0 ? 100 : 0;
  return Math.max(8, Math.min(100, Math.round((metric.value / target) * 100)));
}

function computeProgressPercent(project: ProjectObject, realtime?: ProjectRealtimeSnapshot) {
  if (project.stage === "opportunity_pool") {
    const assessment = project.opportunityAssessment;
    if (!assessment) return 25;
    const averageScore =
      (assessment.businessValueScore + assessment.feasibilityScore + assessment.expressionPotentialScore) / 3;
    return Math.max(18, Math.min(96, Math.round(averageScore * 10)));
  }

  if (project.stage === "new_product_incubation") {
    let progress = project.definition ? 32 : 12;
    const samplingStatus = project.definition?.samplingStatus;
    if (samplingStatus === "in_progress") progress += 18;
    if (samplingStatus === "ready_for_review") progress += 34;
    if (samplingStatus === "approved") progress += 46;

    const readinessStatus = project.expression?.readinessStatus;
    if (readinessStatus === "in_progress") progress += 10;
    if (readinessStatus === "ready") progress += 18;
    if (readinessStatus === "launched") progress += 24;
    return Math.max(15, Math.min(100, progress));
  }

  if (project.stage === "launch_validation") {
    return computeTargetProgress(getMetric(project, "gmv"));
  }

  if (project.stage === "growth_optimization") {
    return computeTargetProgress(getMetric(project, "roi") ?? getMetric(project, "gmv"));
  }

  const publishedCount = project.publishedAssets?.length ?? 0;
  const candidateCount = project.assetCandidates?.length ?? 0;
  return Math.max(20, Math.min(100, 30 + publishedCount * 25 + candidateCount * 15));
}

function buildCoordinationSummary(project: ProjectObject, realtime?: ProjectRealtimeSnapshot) {
  const pendingApprovals = countPendingApprovals(project);
  const evidenceCount = project.decisionObject?.evidencePack.refs.length ?? project.opportunitySignals?.length ?? 0;
  const runningAgents = realtime?.runningAgentCount ?? countRunningAgents(project);
  return `人工 ${pendingApprovals} 个审批 · 大脑 ${evidenceCount} 条证据 · Agent ${runningAgents} 个运行中`;
}

function buildTags(project: ProjectObject) {
  if (project.stage === "opportunity_pool") {
    const assessment = project.opportunityAssessment;
    return [
      assessment
        ? `AI 评分 ${(
            (assessment.businessValueScore + assessment.feasibilityScore + assessment.expressionPotentialScore) /
            3
          ).toFixed(1)}/10`
        : "等待 AI 评分",
      assessment ? opportunityRecommendationLabels[assessment.recommendation] : "待评估",
    ];
  }

  if (project.stage === "new_product_incubation") {
    return [
      project.definition?.priceBand ?? "价格带待定",
      project.definition
        ? samplingStatusLabels[project.definition.samplingStatus]
        : "定义待补齐",
    ];
  }

  if (project.stage === "launch_validation") {
    const ctr = getMetric(project, "ctr");
    const cvr = getMetric(project, "cvr");
    return [ctr ? `CTR ${formatMetric(ctr)}` : "CTR 暂无", cvr ? `CVR ${formatMetric(cvr)}` : "CVR 暂无"];
  }

  if (project.stage === "growth_optimization") {
    const roi = getMetric(project, "roi");
    const gmv = getMetric(project, "gmv");
    return [roi ? `ROI ${formatMetric(roi)}` : "ROI 暂无", gmv ? `GMV ${formatMetric(gmv)}` : "GMV 暂无"];
  }

  return [
    `待确认资产 ${project.assetCandidates?.length ?? 0} 个`,
    `已入库 ${project.publishedAssets?.length ?? 0} 个`,
  ];
}

function buildProjectMetrics(project: ProjectObject) {
  if (project.stage === "opportunity_pool") {
    const assessment = project.opportunityAssessment;
    return {
      focusMetricLabel: "AI 建议",
      focusMetricValue: assessment ? opportunityRecommendationLabels[assessment.recommendation] : "待评估",
      supportMetricLabel: "商业价值",
      supportMetricValue: assessment ? `${assessment.businessValueScore}/10` : "暂无",
    };
  }

  if (project.stage === "new_product_incubation") {
    return {
      focusMetricLabel: "打样状态",
      focusMetricValue: project.definition
        ? samplingStatusLabels[project.definition.samplingStatus]
        : "待启动",
      supportMetricLabel: "表达准备",
      supportMetricValue: project.expression
        ? expressionStatusLabels[project.expression.readinessStatus]
        : "未开始",
    };
  }

  if (project.stage === "launch_validation") {
    return {
      focusMetricLabel: "GMV",
      focusMetricValue: formatMetric(getMetric(project, "gmv")),
      supportMetricLabel: "CVR",
      supportMetricValue: formatMetric(getMetric(project, "cvr")),
    };
  }

  if (project.stage === "growth_optimization") {
    return {
      focusMetricLabel: "ROI",
      focusMetricValue: formatMetric(getMetric(project, "roi")),
      supportMetricLabel: "待审批",
      supportMetricValue: `${countPendingApprovals(project)} 个`,
    };
  }

  return {
    focusMetricLabel: "复盘结论",
    focusMetricValue: project.review?.resultSummary ?? "等待复盘",
    supportMetricLabel: "资产候选",
    supportMetricValue: `${project.assetCandidates?.length ?? 0} 个`,
  };
}

function buildNextStep(project: ProjectObject, realtime?: ProjectRealtimeSnapshot) {
  const pendingApprovals = countPendingApprovals(project);
  if (pendingApprovals > 0) {
    return `优先处理 ${pendingApprovals} 个待审批动作`;
  }
  if (project.keyBlocker) {
    return `解除阻塞：${project.keyBlocker}`;
  }
  if ((realtime?.criticalExceptionCount ?? 0) > 0) {
    return `处理 ${realtime?.criticalExceptionCount} 个例外事件`;
  }
  if (project.stage === "opportunity_pool") return "确认是否进入新品孵化";
  if (project.stage === "new_product_incubation") return "推进定义、打样和评审闭环";
  if (project.stage === "launch_validation") return "继续验证首发表现并决定放量或调整";
  if (project.stage === "growth_optimization") return "联动库存与投放节奏，稳定增长";
  return "补齐复盘结论并发布可复用资产";
}

function sortByPriority(projects: ProjectObject[]) {
  return [...projects].sort((left, right) => right.priority - left.priority);
}

export function buildLifecycleStageViewModel(
  stage: LifecycleStage,
  projects: ProjectObject[],
  snapshots: ProjectRealtimeSnapshot[],
) {
  const snapshotMap = new Map(snapshots.map((item) => [item.projectId, item]));
  const orderedProjects = sortByPriority(projects);

  const summary = orderedProjects.reduce(
    (result, project) => {
      const realtime = snapshotMap.get(project.id);
      result.total += 1;
      result.pendingApprovals += realtime?.pendingApprovalCount ?? countPendingApprovals(project);
      result.highRiskProjects += countHighRiskProjects(project);
      result.blockedProjects += countBlockedProjects(project, realtime);
      result.runningAgents += realtime?.runningAgentCount ?? countRunningAgents(project);
      return result;
    },
    {
      total: 0,
      pendingApprovals: 0,
      highRiskProjects: 0,
      blockedProjects: 0,
      runningAgents: 0,
    },
  );

  return {
    stage,
    stageLabel: getLifecycleStageLabel(stage),
    summary,
    projects: orderedProjects.map((project) => {
      const realtime = snapshotMap.get(project.id);
      const metrics = buildProjectMetrics(project);
      const progressPercent = computeProgressPercent(project, realtime);
      return {
        id: project.id,
        name: project.name,
        owner: project.owner,
        healthLabel: getHealthLabel(project.health),
        riskLabel: getRiskLabel(project.riskLevel),
        targetSummary: project.targetSummary,
        latestPulse: realtime?.latestPulse ?? project.latestPulse ?? project.statusSummary,
        pendingApprovalLabel:
          (realtime?.pendingApprovalCount ?? countPendingApprovals(project)) > 0
            ? `${realtime?.pendingApprovalCount ?? countPendingApprovals(project)} 个${getApprovalLabel("pending")}`
            : getApprovalLabel("not_required"),
        progressPercent,
        progressLabel: `${progressPercent}%`,
        coordinationSummary: buildCoordinationSummary(project, realtime),
        runningAgents: realtime?.runningAgentCount ?? countRunningAgents(project),
        nextStep: buildNextStep(project, realtime),
        tags: buildTags(project),
        ...metrics,
      };
    }),
  };
}

export function buildLifecycleOverviewViewModel(snapshot: PilotSnapshot) {
  const stageCards = inScopeStages.map((stage) => {
    const stageProjects = snapshot.projects.filter((project) => project.stage === stage);
    const stageSnapshots = snapshot.realtimeSnapshots.filter((item) =>
      stageProjects.some((project) => project.id === item.projectId),
    );
    const stageViewModel = buildLifecycleStageViewModel(stage, stageProjects, stageSnapshots);
    const mostUrgentProject = stageViewModel.projects[0];
    const tone =
      stageViewModel.summary.highRiskProjects > 0 || stageViewModel.summary.blockedProjects > 0
        ? "warning"
        : "healthy";

    return {
      stage,
      stageLabel: stageViewModel.stageLabel,
      total: stageViewModel.summary.total,
      pendingApprovals: stageViewModel.summary.pendingApprovals,
      runningAgents: stageViewModel.summary.runningAgents,
      blockedProjects: stageViewModel.summary.blockedProjects,
      tone,
      link: stageRoutes[stage],
      leadingPulse: mostUrgentProject?.latestPulse ?? "当前没有新的经营脉冲。",
    };
  });

  const interventions = sortByPriority(snapshot.projects)
    .filter((project) => {
      const realtime = snapshot.realtimeSnapshots.find((item) => item.projectId === project.id);
      return (
        countPendingApprovals(project) > 0 ||
        countHighRiskProjects(project) > 0 ||
        countBlockedProjects(project, realtime) > 0
      );
    })
    .slice(0, 6)
    .map((project) => ({
      id: project.id,
      projectId: project.id,
      name: project.name,
      stageLabel: getLifecycleStageLabel(project.stage),
      reason: buildNextStep(
        project,
        snapshot.realtimeSnapshots.find((item) => item.projectId === project.id),
      ),
      latestPulse:
        snapshot.realtimeSnapshots.find((item) => item.projectId === project.id)?.latestPulse ??
        project.latestPulse ??
        project.statusSummary,
    }));

  const agentActivities = snapshot.projects
    .flatMap((project) =>
      project.agentStates
        .filter((agent) => agent.status === "running" || agent.status === "waiting_human" || agent.status === "blocked")
        .map((agent) => ({
          id: agent.id,
          projectId: project.id,
          projectName: project.name,
          stageLabel: getLifecycleStageLabel(project.stage),
          agentLabel: agentTypeLabels[agent.agentType],
          statusLabel: agent.status === "running" ? "运行中" : agent.status === "waiting_human" ? "等待人工" : "阻塞",
          summary: agent.lastActionSummary ?? agent.summary,
        })),
    )
    .slice(0, 6);

  return {
    summary: {
      liveProjects: snapshot.projects.filter((project) => project.stage !== "review_capture").length,
      pendingApprovals: snapshot.projects.reduce((sum, project) => sum + countPendingApprovals(project), 0),
      blockedProjects: snapshot.projects.reduce(
        (sum, project) =>
          sum + countBlockedProjects(project, snapshot.realtimeSnapshots.find((item) => item.projectId === project.id)),
        0,
      ),
      activeAgents: snapshot.projects.reduce((sum, project) => sum + countRunningAgents(project), 0),
      publishedAssets: snapshot.knowledgeAssets.length,
    },
    stageCards,
    interventions,
    agentActivities,
    outOfScopeStage: {
      stageLabel: getLifecycleStageLabel("legacy_upgrade"),
      link: stageRoutes.legacy_upgrade,
      description: "本轮单线试点先不接老品升级真实数据，等主线闭环稳定后再补。",
    },
  };
}
