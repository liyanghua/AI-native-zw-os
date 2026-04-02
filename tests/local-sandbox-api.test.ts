import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { initLocalSandboxDatabase } from "../server/db/init.mjs";
import { seedLocalSandboxDatabase } from "../server/db/seed.mjs";
import { startLocalSandboxApiServer } from "../server/api/server.mjs";

export default async function run() {
  const dir = await mkdtemp(join(tmpdir(), "pilot-sandbox-api-"));
  const dbPath = join(dir, "sandbox.sqlite");

  try {
    await initLocalSandboxDatabase({ dbPath });
    await seedLocalSandboxDatabase({ dbPath });
    const serverHandle = await startLocalSandboxApiServer({ dbPath, port: 0 });

    try {
      const listResponse = await fetch(`${serverHandle.baseUrl}/api/projects`);
      assert.equal(listResponse.status, 200);
      const listJson = await listResponse.json();
      assert.equal(listJson.projects.length, 3, "expected project list");

      const filteredResponse = await fetch(
        `${serverHandle.baseUrl}/api/projects?stage=launch_validation`,
      );
      assert.equal(filteredResponse.status, 200);
      const filteredJson = await filteredResponse.json();
      assert.equal(filteredJson.projects.length, 1, "expected stage filtering");

      const detailResponse = await fetch(
        `${serverHandle.baseUrl}/api/projects/local-launch-breeze-bag`,
      );
      assert.equal(detailResponse.status, 200);
      const detailJson = await detailResponse.json();
      assert.equal(detailJson.project.projectId, "local-launch-breeze-bag");
      assert.ok(detailJson.kpis.length >= 3, "expected project KPIs");
      assert.ok(detailJson.risks.length >= 1, "expected project risks");
      assert.ok(detailJson.opportunities.length >= 1, "expected project opportunities");

      const knowledgeResponse = await fetch(
        `${serverHandle.baseUrl}/api/projects/local-launch-breeze-bag/knowledge`,
      );
      assert.equal(knowledgeResponse.status, 200);
      const knowledgeJson = await knowledgeResponse.json();
      assert.equal(knowledgeJson.projectId, "local-launch-breeze-bag");
      assert.ok(knowledgeJson.resultCount >= 2, "expected project knowledge evidence");
      assert.ok(knowledgeJson.matchedAssets.length >= 2, "expected matched knowledge assets");
      assert.ok(knowledgeJson.matchedChunks.length >= 2, "expected matched knowledge chunks");

      const searchResponse = await fetch(`${serverHandle.baseUrl}/api/knowledge/search`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          projectId: "local-growth-travel-pro",
          query: "roi budget template",
          stage: "growth_optimization",
          role: "operations_director",
          assetTypes: ["case", "rule", "template"],
        }),
      });
      assert.equal(searchResponse.status, 200);
      const searchJson = await searchResponse.json();
      assert.ok(searchJson.resultCount >= 2, "expected filtered knowledge results");
      assert.ok(searchJson.retrievalTrace.length >= 1, "expected retrieval trace");

      const contextResponse = await fetch(`${serverHandle.baseUrl}/api/brain/compile-context`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ projectId: "local-launch-breeze-bag" }),
      });
      assert.equal(contextResponse.status, 200);
      const contextJson = await contextResponse.json();
      assert.equal(contextJson.decisionContext.projectId, "local-launch-breeze-bag");
      assert.ok(contextJson.decisionContext.evidencePack.factEvidence.length >= 3);
      assert.ok(contextJson.decisionContext.evidencePack.methodEvidence.length >= 2);

      const decisionResponse = await fetch(`${serverHandle.baseUrl}/api/brain/compile-decision`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ projectId: "local-growth-travel-pro" }),
      });
      assert.equal(decisionResponse.status, 200);
      const decisionJson = await decisionResponse.json();
      assert.equal(decisionJson.decisionObject.projectId, "local-growth-travel-pro");
      assert.ok(decisionJson.decisionObject.recommendedActions.length >= 1);
      assert.ok(decisionJson.evidencePack.methodEvidence.length >= 2);

      const roleStoryResponse = await fetch(`${serverHandle.baseUrl}/api/brain/compile-role-story`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ projectId: "local-growth-travel-pro", role: "boss" }),
      });
      assert.equal(roleStoryResponse.status, 200);
      const roleStoryJson = await roleStoryResponse.json();
      assert.equal(roleStoryJson.roleStory.role, "boss");
      assert.equal(roleStoryJson.roleStory.projectId, "local-growth-travel-pro");
      assert.ok(roleStoryJson.roleStory.topIssues.length >= 1);

      const operationsStoryResponse = await fetch(`${serverHandle.baseUrl}/api/brain/compile-role-story`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ projectId: "local-launch-breeze-bag", role: "operations_director" }),
      });
      assert.equal(operationsStoryResponse.status, 200);
      const operationsStoryJson = await operationsStoryResponse.json();
      assert.equal(operationsStoryJson.roleStory.role, "operations_director");

      const productStoryResponse = await fetch(`${serverHandle.baseUrl}/api/brain/compile-role-story`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ projectId: "local-review-office-classic", role: "product_rnd_director" }),
      });
      assert.equal(productStoryResponse.status, 200);
      const productStoryJson = await productStoryResponse.json();
      assert.equal(productStoryJson.roleStory.role, "product_rnd_director");

      const visualStoryResponse = await fetch(`${serverHandle.baseUrl}/api/brain/compile-role-story`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ projectId: "local-launch-breeze-bag", role: "visual_director" }),
      });
      assert.equal(visualStoryResponse.status, 200);
      const visualStoryJson = await visualStoryResponse.json();
      assert.equal(visualStoryJson.roleStory.role, "visual_director");

      assert.notEqual(
        operationsStoryJson.roleStory.storySummary,
        visualStoryJson.roleStory.storySummary,
        "expected role-specific story summaries",
      );

      const bossDashboardResponse = await fetch(`${serverHandle.baseUrl}/api/roles/boss/dashboard`);
      assert.equal(bossDashboardResponse.status, 200);
      const bossDashboardJson = await bossDashboardResponse.json();
      assert.equal(bossDashboardJson.role, "boss");
      assert.ok(bossDashboardJson.projectCards.length >= 1, "expected boss project cards");
      assert.ok(bossDashboardJson.decisionQueue.length >= 1, "expected boss decision queue");

      const operationsDashboardResponse = await fetch(
        `${serverHandle.baseUrl}/api/roles/operations_director/dashboard`,
      );
      assert.equal(operationsDashboardResponse.status, 200);
      const operationsDashboardJson = await operationsDashboardResponse.json();
      assert.equal(operationsDashboardJson.role, "operations_director");
      assert.ok(operationsDashboardJson.projectCards.length >= 1, "expected operations project cards");

      const productDashboardResponse = await fetch(
        `${serverHandle.baseUrl}/api/roles/product_rnd_director/dashboard`,
      );
      assert.equal(productDashboardResponse.status, 200);
      const productDashboardJson = await productDashboardResponse.json();
      assert.equal(productDashboardJson.role, "product_rnd_director");
      assert.ok(productDashboardJson.projectCards.length >= 1, "expected product project cards");

      const visualDashboardResponse = await fetch(
        `${serverHandle.baseUrl}/api/roles/visual_director/dashboard`,
      );
      assert.equal(visualDashboardResponse.status, 200);
      const visualDashboardJson = await visualDashboardResponse.json();
      assert.equal(visualDashboardJson.role, "visual_director");
      assert.ok(visualDashboardJson.projectCards.length >= 1, "expected visual project cards");

      const directorAliasDashboardResponse = await fetch(
        `${serverHandle.baseUrl}/api/roles/director/dashboard`,
      );
      assert.equal(directorAliasDashboardResponse.status, 200);
      const directorAliasDashboardJson = await directorAliasDashboardResponse.json();
      assert.equal(directorAliasDashboardJson.role, "operations_director");

      const missingResponse = await fetch(
        `${serverHandle.baseUrl}/api/projects/does-not-exist`,
      );
      assert.equal(missingResponse.status, 404);
      const missingJson = await missingResponse.json();
      assert.equal(missingJson.error.code, "project_not_found");
    } finally {
      await serverHandle.close();
    }
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
