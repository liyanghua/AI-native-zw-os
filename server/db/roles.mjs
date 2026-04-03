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
  const latestAction = detail.actions[0];
  const workflowStatus = detail.latestReview
    ? "review_ready"
    : latestAction?.executionStatus === "completed"
      ? "execution_completed"
      : latestAction?.executionStatus === "in_progress" || latestAction?.executionStatus === "queued"
        ? "execution_in_progress"
        : latestAction?.approvalStatus === "pending"
          ? "pending_approval"
          : "awaiting_action";
  const workflowSummary = detail.latestReview
    ? "已形成 review，可继续沉淀资产候选。"
    : latestAction?.executionStatus === "completed"
      ? "执行已完成，等待 review 收口。"
      : latestAction?.executionStatus === "in_progress" || latestAction?.executionStatus === "queued"
        ? "动作已进入执行链路，等待 connector 返回。"
        : latestAction?.approvalStatus === "pending"
          ? "当前仍等待人工审批。"
          : "当前以推荐动作为主，尚未正式进入执行。";

  return {
    projectId: detail.project.projectId,
    projectName: detail.project.name,
    stage: detail.project.stage,
    status: detail.project.status,
    headlineProblem: detail.latestSnapshot?.currentProblem ?? decisionBundle.decisionObject.problemOrOpportunity,
    headlineOpportunity: detail.opportunities[0]?.title ?? "当前暂无更高优先级商机输入",
    headlineRisk: detail.risks[0]?.description ?? detail.latestSnapshot?.currentRisk ?? "暂无显式风险",
    primaryRecommendation: latestAction?.description ?? decisionBundle.decisionObject.recommendedActions[0]?.description ?? "等待下一步决策",
    workflowStatus,
    workflowSummary,
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
    approvalStatus: action.approvalStatus,
    executionStatus: action.executionStatus,
    actionDomain: action.actionDomain,
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

function countRuntimeAttention(db, projectId) {
  const row = db.prepare(`
    SELECT COUNT(*) AS total
    FROM workflow_runs
    WHERE project_id = ? AND status IN ('failed', 'retryable')
  `).get(projectId);
  return row?.total ?? 0;
}

function hasGateWarning(db, projectId) {
  const row = db.prepare(`
    SELECT gd.decision
    FROM gate_decisions gd
    JOIN eval_runs er ON er.run_id = gd.run_id
    WHERE er.project_id = ?
    ORDER BY er.started_at DESC
    LIMIT 1
  `).get(projectId);
  return row?.decision === "warning" || row?.decision === "fail";
}

function countStaleSyncs(db) {
  const rows = db.prepare(`
    SELECT sa.adapter_id, sr.freshness_seconds, sr.status
    FROM source_adapters sa
    LEFT JOIN sync_records sr ON sr.sync_id = (
      SELECT sync_id
      FROM sync_records
      WHERE adapter_id = sa.adapter_id
      ORDER BY started_at DESC
      LIMIT 1
    )
  `).all();

  return rows.filter((row) => !row.status || row.status === "warning" || Number(row.freshness_seconds ?? 9999) > 300).length;
}

function buildSummary(db, role, bundles, decisionQueue, assetSummary) {
  const highRiskCount = bundles.filter((item) => item.detail.risks.some((risk) => risk.riskLevel === "high" || risk.riskLevel === "critical")).length;
  const highOpportunityCount = bundles.filter((item) => item.detail.opportunities.length > 0).length;
  const pendingApprovalCount = decisionQueue.filter((item) => item.approvalStatus === "pending").length;
  const inProgressCount = decisionQueue.filter((item) => item.executionStatus === "queued" || item.executionStatus === "in_progress").length;
  const completedReviewCount = bundles.filter((item) => item.detail.latestReview).length;
  const assetReadyCount = bundles.filter((item) => item.detail.assetCandidates.length > 0).length;
  const closedLoopCount = bundles.filter((item) => item.detail.latestReview && item.detail.assetCandidates.length > 0).length;
  const runtimeAttentionCount = bundles.filter((item) => countRuntimeAttention(db, item.detail.project.projectId) > 0).length;
  const gateWarningCount = bundles.filter((item) => hasGateWarning(db, item.detail.project.projectId)).length;
  const staleSyncCount = countStaleSyncs(db);

  if (role === "boss") {
    return {
      headline: "老板同源经营入口",
      narrative: "围绕同一批项目对象，只显示需要继续投入、需要拍板和值得复制的事项。",
      metrics: [
        { label: "关键项目", value: String(bundles.length) },
        { label: "待拍板", value: String(pendingApprovalCount) },
        { label: "Gate 警告", value: String(gateWarningCount) },
        { label: "运行异常", value: String(runtimeAttentionCount) },
        { label: "Bridge 过期", value: String(staleSyncCount) },
        { label: "闭环完成率", value: `${bundles.length === 0 ? 0 : Math.round((closedLoopCount / bundles.length) * 100)}%` },
      ],
    };
  }

  if (role === "operations_director") {
    return {
      headline: "运营与营销总监同源经营入口",
      narrative: "聚焦推进卡点、经营异常、推荐动作和需要升级给老板的决策。",
      metrics: [
        { label: "推进项目", value: String(bundles.length) },
        { label: "待执行动作", value: String(decisionQueue.length) },
        { label: "执行卡点", value: String(runtimeAttentionCount || inProgressCount) },
        { label: "复盘已生成", value: String(completedReviewCount) },
        { label: "Gate 警告", value: String(gateWarningCount) },
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
        { label: "方法资产", value: String(assetReadyCount) },
        { label: "Gate 警告", value: String(gateWarningCount) },
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
      { label: "运行异常", value: String(runtimeAttentionCount) },
      { label: "模板资产", value: String(assetSummary.length) },
      { label: "Bridge 过期", value: String(staleSyncCount) },
    ],
  };
}

function buildDecisionQueue(role, bundles) {
  const items = [];

  for (const bundle of bundles) {
    const persistedActions = bundle.detail.actions.length > 0
      ? bundle.detail.actions
      : bundle.decision.decisionObject.recommendedActions.map((action) => ({
          ...action,
          approvalStatus: action.requiredApproval ? "pending" : "not_required",
          executionStatus: "suggested",
          actionDomain:
            action.actionType === "refresh_main_visual" ||
            action.actionType === "iterate_video_asset" ||
            action.actionType === "revise_detail_page" ||
            action.actionType === "support_launch_creative"
              ? "visual"
              : action.actionType === "initiate_sampling" ||
                action.actionType === "refine_product_definition" ||
                action.actionType === "promote_to_launch_validation" ||
                action.actionType === "pause_product_direction"
                ? "product_rnd"
                : "operations",
        }));

    for (const action of persistedActions) {
      const relevant =
        role === "boss"
          ? action.requiredApproval || action.executionStatus === "completed"
          : role === "operations_director"
            ? true
            : role === "product_rnd_director"
              ? bundle.detail.project.stage === "review_capture" || action.actionDomain === "product_rnd"
              : action.actionDomain === "visual" || bundle.detail.project.stage === "launch_validation";

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
    summary: buildSummary(db, role, bundles, decisionQueue, assetSummary),
    projectCards,
    decisionQueue,
    riskCards,
    opportunityCards,
    assetSummary,
  };
}
