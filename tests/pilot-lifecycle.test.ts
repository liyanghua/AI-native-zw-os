import assert from "node:assert/strict";
import { createPilotRuntime } from "../src/data-access/pilotRuntime";
import { buildLifecycleOverviewViewModel, buildLifecycleStageViewModel } from "../src/view-models/lifecycle";

export default async function run() {
  const runtime = createPilotRuntime();
  const snapshot = runtime.getSnapshot();

  const overviewVm = buildLifecycleOverviewViewModel(snapshot);
  const opportunityStage = overviewVm.stageCards.find((stage) => stage.stage === "opportunity_pool");
  const launchStage = overviewVm.stageCards.find((stage) => stage.stage === "launch_validation");

  assert.ok(opportunityStage, "expected opportunity stage card");
  assert.equal(opportunityStage.total, 2, "expected opportunity projects to be counted in lifecycle overview");

  assert.ok(launchStage, "expected launch validation stage card");
  assert.equal(launchStage.total, 1, "expected launch stage to use runtime project count");
  assert.ok(
    launchStage.pendingApprovals > 0,
    "expected launch stage to highlight pending approvals from the project object",
  );

  assert.ok(
    overviewVm.interventions.some((item) => item.projectId === "pilot-launch-summer-refresh"),
    "expected lifecycle overview to surface the launch project as an intervention item",
  );
  assert.ok(
    overviewVm.agentActivities.some((item) => item.projectId === "pilot-launch-summer-refresh"),
    "expected lifecycle overview to expose active agent collaboration",
  );

  const incubationProjects = runtime.projectGateway.listProjectsByStage("new_product_incubation");
  const incubationSnapshots = incubationProjects.map((project) =>
    runtime.projectGateway.getProjectRealtimeSnapshot(project.id),
  );
  const incubationVm = buildLifecycleStageViewModel(
    "new_product_incubation",
    incubationProjects,
    incubationSnapshots,
  );

  assert.equal(incubationVm.summary.total, incubationProjects.length);
  assert.ok(incubationVm.summary.runningAgents > 0, "expected incubation summary to aggregate running agents");
  assert.ok(
    incubationVm.projects.some((project) => project.progressLabel.includes("%")),
    "expected incubation projects to expose a progress label for the UI",
  );
}
