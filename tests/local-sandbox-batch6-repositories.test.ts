import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { initLocalSandboxDatabase } from "../server/db/init.mjs";
import { seedLocalSandboxDatabase } from "../server/db/seed.mjs";
import { startLocalSandboxApiServer } from "../server/api/server.mjs";
import { createApiClient } from "../src/data-access/apiClient";
import { createLocalSandboxRepositories } from "../src/data-access/localSandboxRepositories";

export default async function run() {
  const dir = await mkdtemp(join(tmpdir(), "pilot-sandbox-batch6-repo-"));
  const dbPath = join(dir, "sandbox.sqlite");

  try {
    await initLocalSandboxDatabase({ dbPath });
    await seedLocalSandboxDatabase({ dbPath });
    const serverHandle = await startLocalSandboxApiServer({ dbPath, port: 0 });

    try {
      const repositories = createLocalSandboxRepositories(
        createApiClient({ baseUrl: `${serverHandle.baseUrl}/api` }),
      );

      const runtime = await repositories.runtime.getWorkflows({
        projectId: "local-growth-travel-pro",
      });
      assert.equal(runtime.error, null);
      assert.ok(runtime.data.workflows.length >= 1, "expected runtime workflows");

      const workflowDetail = await repositories.runtime.getWorkflow(runtime.data.workflows[0].workflowId);
      assert.equal(workflowDetail.error, null);
      assert.ok(workflowDetail.data.tasks.length >= 1, "expected runtime tasks");

      const suites = await repositories.eval.getSuites();
      assert.equal(suites.error, null);
      assert.ok(suites.data.suites.length >= 1, "expected eval suites");

      const ontology = await repositories.ontology.getRegistry({
        itemType: "role_profile",
      });
      assert.equal(ontology.error, null);
      assert.ok(ontology.data.items.length >= 1, "expected ontology registry items");

      const bridge = await repositories.bridge.getAdapters();
      assert.equal(bridge.error, null);
      assert.ok(bridge.data.adapters.length >= 1, "expected bridge adapters");

      const workbench = await repositories.projects.getWorkbench("local-review-office-classic");
      assert.equal(workbench.error, null);
      assert.ok(workbench.data.runtime.latestWorkflow, "expected runtime summary in workbench");
      assert.ok(workbench.data.eval.summary.total >= 1, "expected eval summary in workbench");
      assert.ok(workbench.data.ontology.references.length >= 1, "expected ontology refs in workbench");
      assert.ok(workbench.data.bridge.adapterSummary.length >= 1, "expected bridge summary in workbench");
    } finally {
      await serverHandle.close();
    }
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
