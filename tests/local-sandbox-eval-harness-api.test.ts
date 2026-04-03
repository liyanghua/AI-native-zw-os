import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { initLocalSandboxDatabase } from "../server/db/init.mjs";
import { seedLocalSandboxDatabase } from "../server/db/seed.mjs";
import { startLocalSandboxApiServer } from "../server/api/server.mjs";

export default async function run() {
  const dir = await mkdtemp(join(tmpdir(), "pilot-sandbox-eval-api-"));
  const dbPath = join(dir, "sandbox.sqlite");

  try {
    await initLocalSandboxDatabase({ dbPath });
    await seedLocalSandboxDatabase({ dbPath });
    const serverHandle = await startLocalSandboxApiServer({ dbPath, port: 0 });

    try {
      const casesResponse = await fetch(`${serverHandle.baseUrl}/api/eval/cases`);
      assert.equal(casesResponse.status, 200);
      const casesJson = await casesResponse.json();
      assert.ok(Array.isArray(casesJson.cases), "expected eval cases");
      assert.ok(casesJson.cases.length >= 5, "expected seeded eval cases");

      const suitesResponse = await fetch(`${serverHandle.baseUrl}/api/eval/suites`);
      assert.equal(suitesResponse.status, 200);
      const suitesJson = await suitesResponse.json();
      assert.ok(Array.isArray(suitesJson.suites), "expected eval suites");
      assert.ok(
        suitesJson.suites.some((suite) => suite.suiteId === "eval-suite-batch6-smoke"),
        "expected smoke suite",
      );

      const runResponse = await fetch(`${serverHandle.baseUrl}/api/eval/run`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          projectId: "local-growth-travel-pro",
          suiteId: "eval-suite-batch6-smoke",
        }),
      });
      assert.equal(runResponse.status, 200);
      const runJson = await runResponse.json();
      assert.equal(runJson.run.projectId, "local-growth-travel-pro");
      assert.ok(runJson.results.length >= 3, "expected eval results");
      assert.ok(["pass", "warning", "fail"].includes(runJson.gateDecision.decision));

      const runsResponse = await fetch(
        `${serverHandle.baseUrl}/api/eval/runs?projectId=local-growth-travel-pro`,
      );
      assert.equal(runsResponse.status, 200);
      const runsJson = await runsResponse.json();
      assert.ok(Array.isArray(runsJson.runs), "expected eval runs");
      assert.ok(runsJson.runs.some((item) => item.runId === runJson.run.runId));

      const runDetailResponse = await fetch(
        `${serverHandle.baseUrl}/api/eval/runs/${runJson.run.runId}`,
      );
      assert.equal(runDetailResponse.status, 200);
      const runDetailJson = await runDetailResponse.json();
      assert.equal(runDetailJson.run.runId, runJson.run.runId);
      assert.ok(Array.isArray(runDetailJson.results), "expected run detail results");
      assert.ok(runDetailJson.gateDecision, "expected gate decision detail");
    } finally {
      await serverHandle.close();
    }
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
