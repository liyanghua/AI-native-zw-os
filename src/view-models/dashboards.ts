import { getApprovalLabel, getAssetTypeLabel, getHealthLabel, getLifecycleStageLabel, getRiskLabel } from "../domain/runtime/labels";
import type { KnowledgeAssetDocument, PilotSnapshot, ProjectObject, RoleView } from "../domain/types/model";

function sortByPriority(projects: ProjectObject[]) {
  return [...projects].sort((left, right) => right.priority - left.priority);
}

export function buildRoleDashboardViewModel(role: RoleView, snapshot: PilotSnapshot) {
  const pulses = snapshot.pulses.filter((pulse) => pulse.audience === role).slice(0, 4);
  const pendingActions = sortByPriority(snapshot.projects).flatMap((project) =>
    project.actions
      .filter((action) => action.approvalStatus === "pending")
      .map((action) => ({
        id: action.id,
        projectId: project.id,
        title: action.title,
        projectName: project.name,
        approvalLabel: getApprovalLabel(action.approvalStatus),
        riskLabel: getRiskLabel(action.risk),
      })),
  );

  if (role === "ceo") {
    return {
      headline: "老板经营指挥台",
      summary: {
        liveProjects: snapshot.projects.filter((project) => project.stage !== "review_capture").length,
        highRiskProjects: snapshot.projects.filter((project) => project.riskLevel === "high" || project.riskLevel === "critical").length,
        pendingApprovals: pendingActions.length,
        publishedAssets: snapshot.knowledgeAssets.length,
      },
      pulses,
      focusProjects: sortByPriority(snapshot.projects).slice(0, 4).map((project) => ({
        id: project.id,
        name: project.name,
        stageLabel: getLifecycleStageLabel(project.stage),
        healthLabel: getHealthLabel(project.health),
        latestPulse: project.latestPulse ?? project.statusSummary,
      })),
      pendingActions,
    };
  }

  if (role === "product_rd_director") {
    const opportunityProjects = snapshot.projects.filter(
      (project) => project.stage === "opportunity_pool" || project.stage === "new_product_incubation",
    );
    return {
      headline: "产品研发总监工作台",
      summary: {
        opportunityCount: snapshot.projects.filter((project) => project.stage === "opportunity_pool").length,
        incubationCount: snapshot.projects.filter((project) => project.stage === "new_product_incubation").length,
        samplingRisks: snapshot.projects.filter((project) => project.samplingReview && project.samplingReview.leadTimeRisk !== "low").length,
        reusableSops: snapshot.knowledgeAssets.filter((asset) => asset.assetType === "sop").length,
      },
      pulses,
      focusProjects: opportunityProjects.map((project) => ({
        id: project.id,
        name: project.name,
        stageLabel: getLifecycleStageLabel(project.stage),
        riskLabel: getRiskLabel(project.riskLevel),
        blocker: project.keyBlocker ?? project.statusSummary,
      })),
      knowledge: snapshot.knowledgeAssets
        .filter((asset) => asset.assetType === "sop" || asset.assetType === "rule")
        .slice(0, 4)
        .map((asset) => ({
          id: asset.id,
          typeLabel: getAssetTypeLabel(asset.assetType),
          title: asset.title,
          summary: asset.summary,
        })),
    };
  }

  if (role === "growth_director") {
    const growthProjects = snapshot.projects.filter(
      (project) => project.stage === "launch_validation" || project.stage === "growth_optimization",
    );
    return {
      headline: "运营与营销总监工作台",
      summary: {
        launchCount: snapshot.projects.filter((project) => project.stage === "launch_validation").length,
        growthCount: snapshot.projects.filter((project) => project.stage === "growth_optimization").length,
        pendingApprovals: pendingActions.length,
        activeExecutions: snapshot.projects.flatMap((project) => project.actions).filter((action) => action.executionStatus === "in_progress").length,
      },
      pulses,
      focusProjects: growthProjects.map((project) => ({
        id: project.id,
        name: project.name,
        stageLabel: getLifecycleStageLabel(project.stage),
        riskLabel: getRiskLabel(project.riskLevel),
        latestPulse: project.latestPulse ?? project.statusSummary,
      })),
      pendingActions,
    };
  }

  const expressionProjects = snapshot.projects.filter((project) => Boolean(project.expression));
  return {
    headline: "视觉总监工作台",
    summary: {
      expressionProjects: expressionProjects.length,
      draftTemplates: snapshot.knowledgeAssets.filter((asset) => asset.assetType === "template").length,
      runningAssets: snapshot.projects.flatMap((project) => project.actions).filter((action) => action.executionStatus === "in_progress").length,
      publishedTemplates: snapshot.knowledgeAssets.filter((asset) => asset.assetType === "template").length,
    },
    pulses,
    focusProjects: expressionProjects.slice(0, 4).map((project) => ({
      id: project.id,
      name: project.name,
      stageLabel: getLifecycleStageLabel(project.stage),
      latestPulse: project.latestPulse ?? project.statusSummary,
      healthLabel: getHealthLabel(project.health),
    })),
    knowledge: snapshot.knowledgeAssets
      .filter((asset) => asset.assetType === "template")
      .slice(0, 4)
      .map((asset: KnowledgeAssetDocument) => ({
        id: asset.id,
        typeLabel: getAssetTypeLabel(asset.assetType),
        title: asset.title,
        summary: asset.summary,
      })),
  };
}
