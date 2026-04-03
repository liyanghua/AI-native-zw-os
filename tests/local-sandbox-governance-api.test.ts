import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { initLocalSandboxDatabase } from "../server/db/init.mjs";
import { seedLocalSandboxDatabase } from "../server/db/seed.mjs";
import { startLocalSandboxApiServer } from "../server/api/server.mjs";

export default async function run() {
  const dir = await mkdtemp(join(tmpdir(), "pilot-sandbox-governance-api-"));
  const dbPath = join(dir, "sandbox.sqlite");

  try {
    await initLocalSandboxDatabase({ dbPath });
    await seedLocalSandboxDatabase({ dbPath });
    const serverHandle = await startLocalSandboxApiServer({ dbPath, port: 0 });

    try {
      const actionsResponse = await fetch(
        `${serverHandle.baseUrl}/api/actions?role=operations_director&executionStatus=completed`,
      );
      assert.equal(actionsResponse.status, 200);
      const actionsJson = await actionsResponse.json();
      assert.ok(Array.isArray(actionsJson.items), "expected action center items");
      assert.ok(actionsJson.items.length >= 1, "expected filtered action items");
      assert.ok(actionsJson.summary.total >= actionsJson.items.length, "expected action summary");

      const reviewsResponse = await fetch(
        `${serverHandle.baseUrl}/api/reviews?projectId=local-review-office-classic`,
      );
      assert.equal(reviewsResponse.status, 200);
      const reviewsJson = await reviewsResponse.json();
      assert.ok(Array.isArray(reviewsJson.items), "expected review center items");
      assert.ok(reviewsJson.items.some((item) => item.reviewId === "review-office-classic"));

      const promoteResponse = await fetch(
        `${serverHandle.baseUrl}/api/reviews/review-office-classic/promote-to-asset`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            assetType: "template",
            operator: "李安",
            reason: "保留办公包详情页可复用模板。",
          }),
        },
      );
      assert.equal(promoteResponse.status, 200);
      const promoteJson = await promoteResponse.json();
      assert.equal(promoteJson.review.reviewId, "review-office-classic");
      assert.equal(promoteJson.review.isPromotedToAsset, true);
      assert.equal(promoteJson.assetCandidate.candidateId, "candidate-office-classic-template");

      const publishResponse = await fetch(
        `${serverHandle.baseUrl}/api/assets/candidate-office-classic-template/publish`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            operator: "李安",
            reason: "模板已确认可复用。",
          }),
        },
      );
      assert.equal(publishResponse.status, 200);
      const publishJson = await publishResponse.json();
      assert.equal(publishJson.publishedAsset.projectId, "local-review-office-classic");
      assert.equal(publishJson.publishedAsset.publishStatus, "published");

      const feedbackResponse = await fetch(
        `${serverHandle.baseUrl}/api/assets/${publishJson.publishedAsset.assetId}/feedback-to-knowledge`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            operator: "李安",
            feedbackMode: "promote_to_knowledge",
          }),
        },
      );
      assert.equal(feedbackResponse.status, 200);
      const feedbackJson = await feedbackResponse.json();
      assert.equal(feedbackJson.feedback.status, "synced");
      assert.ok(feedbackJson.feedback.targetAssetId, "expected target knowledge asset");

      const searchResponse = await fetch(`${serverHandle.baseUrl}/api/knowledge/search`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          projectId: "local-review-office-classic",
          query: "办公包详情页表达模板",
          stage: "review_capture",
        }),
      });
      assert.equal(searchResponse.status, 200);
      const searchJson = await searchResponse.json();
      assert.ok(
        searchJson.matchedAssets.some((asset) => asset.assetId === feedbackJson.feedback.targetAssetId),
        "expected feedback asset to be searchable",
      );

      const assetsResponse = await fetch(
        `${serverHandle.baseUrl}/api/assets?projectId=local-review-office-classic`,
      );
      assert.equal(assetsResponse.status, 200);
      const assetsJson = await assetsResponse.json();
      assert.ok(Array.isArray(assetsJson.items), "expected asset library items");
      assert.ok(
        assetsJson.items.some((item) => item.assetId === publishJson.publishedAsset.assetId),
        "expected published asset in asset library",
      );

      const evaluationRunResponse = await fetch(`${serverHandle.baseUrl}/api/evaluations/run`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          projectId: "local-review-office-classic",
          scope: "asset",
        }),
      });
      assert.equal(evaluationRunResponse.status, 200);
      const evaluationRunJson = await evaluationRunResponse.json();
      assert.ok(evaluationRunJson.records.length >= 1, "expected evaluation records");
      assert.ok(evaluationRunJson.summary.total >= 1, "expected evaluation summary");

      const evaluationsResponse = await fetch(
        `${serverHandle.baseUrl}/api/evaluations?projectId=local-review-office-classic`,
      );
      assert.equal(evaluationsResponse.status, 200);
      const evaluationsJson = await evaluationsResponse.json();
      assert.ok(evaluationsJson.records.length >= 1, "expected persisted evaluations");

      const governanceResponse = await fetch(
        `${serverHandle.baseUrl}/api/projects/local-review-office-classic/governance`,
      );
      assert.equal(governanceResponse.status, 200);
      const governanceJson = await governanceResponse.json();
      assert.equal(governanceJson.projectId, "local-review-office-classic");
      assert.ok(governanceJson.actionsSummary.total >= 1);
      assert.ok(governanceJson.reviewSummary.total >= 1);
      assert.ok(governanceJson.assetSummary.total >= 1);
      assert.ok(governanceJson.evaluationSummary.total >= 1);
      assert.ok(governanceJson.feedbackSummary.total >= 1);
    } finally {
      await serverHandle.close();
    }
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
