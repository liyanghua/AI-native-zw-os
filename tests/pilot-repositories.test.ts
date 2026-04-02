import assert from "node:assert/strict";
import { createPilotRuntime } from "../src/data-access/pilotRuntime";
import { createPilotRepositories } from "../src/data-access/repositories";
import { createProjectStateMachine } from "../src/domain/services/projectStateMachine";
import { calculatePilotMetrics } from "../src/data-access/pilotMetrics";

export default async function run() {
  const runtime = createPilotRuntime();
  const repositories = createPilotRepositories(runtime);

  const conflictedIdentityQuery = repositories.identity.getProjectIdentity("pilot-opp-urban-lite");
  assert.equal(conflictedIdentityQuery.loading, false);
  assert.equal(conflictedIdentityQuery.partial, true);
  assert.ok(
    conflictedIdentityQuery.issues.some((issue) => issue.code === "identity_conflict"),
    "expected identity query to surface conflict issues",
  );

  const detailQuery = repositories.projectWorkbench.getProjectDetail("pilot-launch-summer-refresh");
  assert.equal(detailQuery.loading, false);
  assert.ok(detailQuery.data.viewModel.project.id === "pilot-launch-summer-refresh");
  assert.ok(detailQuery.lastUpdatedAt.length > 0, "expected query timestamp");

  const actionCenterQuery = repositories.actionCenter.getOverview();
  assert.ok(actionCenterQuery.data.viewModel.columns.pendingApprovals.length > 0, "expected pending approvals");
  assert.ok(
    actionCenterQuery.data.recommendedActions.length > 0,
    "expected action center repository to surface decision-driven recommended actions",
  );

  const dashboardQuery = repositories.roleDashboard.getDashboard("ceo");
  assert.ok(dashboardQuery.data.viewModel.summary.pendingApprovals > 0, "expected CEO summary to stay query-driven");

  const lifecycleQuery = repositories.lifecycle.getOverview();
  assert.ok(lifecycleQuery.data.viewModel.summary.liveProjects > 0, "expected lifecycle overview query");

  const riskQuery = repositories.riskApproval.getOverview();
  assert.ok(riskQuery.data.pendingApprovals.length > 0, "expected risk repository to expose approval queue");

  const project = runtime.projectGateway.getProject("pilot-launch-summer-refresh");
  const stateMachine = createProjectStateMachine(runtime.getSnapshot().transitionRules);
  const transitionCheck = stateMachine.canTransition(
    project,
    "growth_optimization",
    runtime.getSnapshot().transitionRules,
  );
  assert.equal(transitionCheck.allowed, false, "expected blocked transition before launch writeback");
  assert.ok(
    stateMachine.getAllowedActions("launch_validation").some((item) => item.actionType === "price_adjustment"),
    "expected launch stage allowed actions",
  );
  assert.ok(
    stateMachine.getStageExitCriteria(project).length > 0,
    "expected state machine to return exit criteria for the project",
  );

  const metrics = calculatePilotMetrics(runtime.getSnapshot());
  assert.ok(metrics.project_id_resolution_success_rate > 0, "expected identity metrics");
  assert.ok(metrics.cross_page_object_consistency_rate > 0, "expected cross-page consistency metric");
  assert.ok(metrics.decision_compile_success_rate > 0, "expected decision compile metric");
}
