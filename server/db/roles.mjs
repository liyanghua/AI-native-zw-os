import { compileDecisionObject, compileRoleStory } from "./brain.mjs";
import { getProjectDetail, listProjects } from "./projects.mjs";
import { normalizeRoleType, getRoleProfile } from "./roleProfiles.mjs";

function metricValue(detail, metricName) {
  return detail.kpis.find((metric) => metric.metricName === metricName)?.metricValue ?? null;
}

function matchesRoleScope(role, detail) {
  if (role === "boss") {
    return true;
  }

  if (role === "operations_director") {
    return detail.project.stage === "launch_validation" || detail.project.stage === "growth_optimization";
  }

  if (role === "product_rnd_director") {
    return detail.project.stage === "review_capture" || detail.project.stage === "launch_validation";
  }

  return detail.project.stage === "launch_validation" || detail.project.stage === "growth_optimization";
}

function scoreProject(role, detail, decisionBundle) {
  const approvalBoost = decisionBundle.decisionObject.recommendedActions.some((action) => action.requiredApproval) ? 40 : 0;
  const priorityBoost = detail.project.priority;
  const riskBoost = detail.risks.length * 12;
  const opportunityBoost = detail.opportunities.length * 8;
  const roi = metricValue(detail, "roi");
  const ctr = metricValue(detail, "ctr");
  const cvr = metricValue(detail, "cvr");

  if (role === "boss") {
    return priorityBoost + approvalBoost + riskBoost + (roi !== null && roi < 2 ? 30 : 0) + (detail.project.stage === "review_capture" ? 20 : 0);
  }

  if (role === "operations_director") {
    return priorityBoost + riskBoost + opportunityBoost + (detail.project.stage === "growth_optimization" ? 25 : 15) + (roi !== null && roi < 2 ? 20 : 0);
  }

  if (role === "product_rnd_director") {
    return priorityBoost + opportunityBoost + (detail.project.stage === "review_capture" ? 35 : 0) + (detail.project.stage === "launch_validation" ? 18 : 0);
  }

  return priorityBoost + (ctr !== null && cvr !== null && ctr > cvr ? 30 : 0) + (detail.project.stage === "launch_validation" ? 30 : 10);
}

function buildProjectCard(detail, decisionBundle) {
  return {
    projectId: detail.project.projectId,
    projectName: detail.project.name,
    stage: detail.project.stage,
    status: detail.project.status,
    headlineProblem: detail.latestSnapshot?.currentProblem ?? decisionBundle.decisionObject.problemOrOpportunity,
    headlineOpportunity: detail.opportunities[0]?.title ?? "当前暂无更高优先级商机输入",
    headlineRisk: detail.risks[0]?.description ?? detail.latestSnapshot?.currentRisk ?? "暂无显式风险",
    primaryRecommendation: decisionBundle.decisionObject.recommendedActions[0]?.description ?? "等待下一步决策",
    updatedAt: detail.project.updatedAt,
  };
}

function buildDecisionQueueItem(detail, decisionBundle, action) {
  return {
    decisionId: decisionBundle.decisionObject.decisionId,
    projectId: detail.project.projectId,
    projectName: detail.project.name,
    summary: decisionBundle.decisionObject.diagnosis,
    requiredOwner: action.owner,
    requiredAction: action.description,
    requiresApproval: action.requiredApproval,
    updatedAt: detail.project.updatedAt,
  };
}

function buildRiskCard(detail, decisionBundle) {
  return {
    projectId: detail.project.projectId,
    projectName: detail.project.name,
    riskLevel: detail.risks[0]?.riskLevel ?? "medium",
    riskSummary: detail.risks[0]?.description ?? detail.latestSnapshot?.currentRisk ?? "暂无显式风险",
    recommendation: decisionBundle.decisionObject.recommendedActions[0]?.description ?? "继续观察",
    updatedAt: detail.project.updatedAt,
  };
}

function buildOpportunityCard(detail) {
  const opportunity = detail.opportunities[0];
  return {
    projectId: detail.project.projectId,
    projectName: detail.project.name,
    opportunitySummary: opportunity?.title ?? detail.latestSnapshot?.currentGoal ?? "暂无新的机会输入",
    whyNow: opportunity?.description ?? "当前阶段已经具备进一步推进的基础信号。",
    updatedAt: detail.project.updatedAt,
  };
}

function assetTypePriority(role, asset) {
  if (role === "boss") {
    return ["case", "rule", "evaluation_sample", "sop", "template"].indexOf(asset.asset_type);
  }
  if (role === "operations_director") {
    return ["rule", "case", "template", "sop", "evaluation_sample"].indexOf(asset.asset_type);
  }
  if (role === "product_rnd_director") {
    return ["sop", "rule", "case", "template", "evaluation_sample"].indexOf(asset.asset_type);
  }
  return ["template", "case", "rule", "sop", "evaluation_sample"].indexOf(asset.asset_type);
}

function listRoleAssets(db, role) {
  const rows = db.prepare(`
    SELECT asset_id, title, asset_type, source_project_id, updated_at, content_markdown
    FROM knowledge_assets
    WHERE role = ? OR role = 'all'
    ORDER BY updated_at DESC
  `).all(role);

  return rows
    .sort((left, right) => assetTypePriority(role, left) - assetTypePriority(role, right))
    .slice(0, 4)
    .map((row) => ({
      assetId: row.asset_id,
      title: row.title,
      assetType: row.asset_type,
      summary: row.content_markdown.split(/\n/).find((line) => !line.startsWith("##"))?.trim() || "待补充资产摘要",
      sourceProjectId: row.source_project_id ?? undefined,
      updatedAt: row.updated_at,
    }));
}

function buildSummary(role, bundles, decisionQueue, assetSummary) {
  const highRiskCount = bundles.filter((item) => item.detail.risks.some((risk) => risk.riskLevel === "high" || risk.riskLevel === "critical")).length;
  const highOpportunityCount = bundles.filter((item) => item.detail.opportunities.length > 0).length;

  if (role === "boss") {
    return {
      headline: "老板同源经营入口",
      narrative: "围绕同一批项目对象，只显示需要继续投入、需要拍板和值得复制的事项。",
      metrics: [
        { label: "关键项目", value: String(bundles.length) },
        { label: "待拍板", value: String(decisionQueue.filter((item) => item.requiresApproval).length) },
        { label: "高风险项目", value: String(highRiskCount) },
        { label: "可复制资产", value: String(assetSummary.length) },
      ],
    };
  }

  if (role === "operations_director") {
    return {
      headline: "运营与营销总监同源经营入口",
      narrative: "聚焦推进卡点、经营异常、推荐动作和需要升级给老板的决策。",
      metrics: [
        { label: "推进项目", value: String(bundles.length) },
        { label: "待协调动作", value: String(decisionQueue.length) },
        { label: "高风险项目", value: String(highRiskCount) },
        { label: "高机会项目", value: String(highOpportunityCount) },
      ],
    };
  }

  if (role === "product_rnd_director") {
    return {
      headline: "产品研发总监同源入口骨架",
      narrative: "聚焦值得继续推进的商品方向、定义缺口和可复用经验沉淀。",
      metrics: [
        { label: "关注项目", value: String(bundles.length) },
        { label: "待澄清定义", value: String(highRiskCount) },
        { label: "研发拍板项", value: String(decisionQueue.length) },
        { label: "可复用经验", value: String(assetSummary.length) },
      ],
    };
  }

  return {
    headline: "视觉总监同源入口骨架",
    narrative: "聚焦需要表达支持的项目、创意迭代方向和可复用模板。",
    metrics: [
      { label: "待支持项目", value: String(bundles.length) },
      { label: "表达风险", value: String(highRiskCount) },
      { label: "创意动作", value: String(decisionQueue.length) },
      { label: "模板资产", value: String(assetSummary.length) },
    ],
  };
}

function buildDecisionQueue(role, bundles) {
  const items = [];

  for (const bundle of bundles) {
    for (const action of bundle.decision.decisionObject.recommendedActions) {
      const relevant =
        role === "boss"
          ? action.requiredApproval
          : role === "operations_director"
            ? true
            : role === "product_rnd_director"
              ? bundle.detail.project.stage === "review_capture" || action.actionType === "price_adjustment"
              : action.actionType === "visual_refresh" || bundle.detail.project.stage === "launch_validation";

      if (relevant) {
        items.push(buildDecisionQueueItem(bundle.detail, bundle.decision, action));
      }
    }
  }

  return items.slice(0, 5);
}

export function getRoleDashboard(db, roleInput) {
  const role = normalizeRoleType(roleInput);
  if (!role) {
    return null;
  }

  const roleProfile = getRoleProfile(role);
  const projectRows = listProjects(db);
  const bundles = projectRows
    .map((project) => {
      const detail = getProjectDetail(db, project.projectId);
      const decision = compileDecisionObject(db, project.projectId);
      const roleStory = compileRoleStory(db, project.projectId, role);
      if (!detail || !decision || !roleStory) {
        return null;
      }

      return {
        detail,
        decision,
        roleStory,
        score: scoreProject(role, detail, decision),
      };
    })
    .filter(Boolean)
    .filter((item) => matchesRoleScope(role, item.detail))
    .sort((left, right) => right.score - left.score)
    .slice(0, 4);

  const projectCards = bundles.map((bundle) => buildProjectCard(bundle.detail, bundle.decision));
  const decisionQueue = buildDecisionQueue(role, bundles);
  const riskCards = bundles
    .filter((bundle) => bundle.detail.risks.length > 0)
    .slice(0, 4)
    .map((bundle) => buildRiskCard(bundle.detail, bundle.decision));
  const opportunityCards = bundles
    .filter((bundle) => bundle.detail.opportunities.length > 0)
    .slice(0, 4)
    .map((bundle) => buildOpportunityCard(bundle.detail));
  const assetSummary = listRoleAssets(db, role);

  return {
    role,
    roleProfile,
    summary: buildSummary(role, bundles, decisionQueue, assetSummary),
    projectCards,
    decisionQueue,
    riskCards,
    opportunityCards,
    assetSummary,
  };
}
