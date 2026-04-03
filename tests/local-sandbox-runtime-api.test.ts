import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { initLocalSandboxDatabase } from "../server/db/init.mjs";
import { seedLocalSandboxDatabase } from "../server/db/seed.mjs";
import { startLocalSandboxApiServer } from "../server/api/server.mjs";

export default async function run() {
  const dir = await mkdtemp(join(tmpdir(), "pilot-sandbox-runtime-api-"));
  const dbPath = join(dir, "sandbox.sqlite");

  try {
    await initLocalSandboxDatabase({ dbPath });
    await seedLocalSandboxDatabase({ dbPath });
    const serverHandle = await startLocalSandboxApiServer({ dbPath, port: 0 });

    try {
      const workflowsResponse = await fetch(
        `${serverHandle.baseUrl}/api/runtime/workflows`,
      );
      assert.equal(workflowsResponse.status, 200);
      const workflowsJson = await workflowsResponse.json();
      assert.ok(Array.isArray(workflowsJson.workflows), "expected workflow list");
      assert.ok(workflowsJson.workflows.length >= 2, "expected at least two workflows");

      const retryableWorkflow = workflowsJson.workflows.find(
        (workflow) => workflow.projectId === "local-launch-breeze-bag",
      );
      assert.ok(retryableWorkflow, "expected launch project workflow");

      const workflowDetailResponse = await fetch(
        `${serverHandle.baseUrl}/api/runtime/workflows/${retryableWorkflow.workflowId}`,
      );
      assert.equal(workflowDetailResponse.status, 200);
      const workflowDetailJson = await workflowDetailResponse.json();
      assert.equal(workflowDetailJson.workflow.workflowId, retryableWorkflow.workflowId);
      assert.ok(Array.isArray(workflowDetailJson.tasks), "expected tasks");
      assert.ok(Array.isArray(workflowDetailJson.events), "expected runtime events");

      const retryTask = workflowDetailJson.tasks.find((task) => task.status === "retryable");
      assert.ok(retryTask, "expected retryable task in seeded workflows");

      const retryResponse = await fetch(
        `${serverHandle.baseUrl}/api/runtime/tasks/${retryTask.taskId}/retry`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            reason: "Retry runtime task after Batch 6 validation.",
            operator: "批次6测试",
          }),
        },
      );
      assert.equal(retryResponse.status, 200);
      const retryJson = await retryResponse.json();
      assert.equal(retryJson.retryRecord.originalTaskId, retryTask.taskId);
      assert.equal(retryJson.newTask.status, "queued");

      const approvalWorkflowsResponse = await fetch(
        `${serverHandle.baseUrl}/api/runtime/workflows?projectId=local-growth-travel-pro`,
      );
      assert.equal(approvalWorkflowsResponse.status, 200);
      const approvalWorkflowsJson = await approvalWorkflowsResponse.json();
      const approvalWorkflow = approvalWorkflowsJson.workflows[0];
      assert.ok(approvalWorkflow, "expected growth project workflow");

      const approvalWorkflowDetailResponse = await fetch(
        `${serverHandle.baseUrl}/api/runtime/workflows/${approvalWorkflow.workflowId}`,
      );
      assert.equal(approvalWorkflowDetailResponse.status, 200);
      const approvalWorkflowDetailJson = await approvalWorkflowDetailResponse.json();

      const cancelTask = approvalWorkflowDetailJson.tasks.find(
        (task) => task.status === "awaiting_approval" || task.status === "queued",
      );
      assert.ok(cancelTask, "expected cancellable task");

      const cancelResponse = await fetch(
        `${serverHandle.baseUrl}/api/runtime/tasks/${cancelTask.taskId}/cancel`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            reason: "Cancel runtime task for Batch 6 verification.",
            operator: "批次6测试",
          }),
        },
      );
      assert.equal(cancelResponse.status, 200);
      const cancelJson = await cancelResponse.json();
      assert.equal(cancelJson.task.status, "cancelled");
      assert.ok(cancelJson.latestEvent.summary.includes("cancel"), "expected cancel event summary");
    } finally {
      await serverHandle.close();
    }
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
