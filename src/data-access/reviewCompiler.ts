import type { PilotGovernanceState } from "./pilotAdapter";
import {
  normalizeActionId,
  normalizeEntityId,
  normalizeProjectId,
  normalizeReviewId,
  type PilotRawState,
} from "./pilotSources";

export function ensureReviewSeed(rawState: PilotRawState, projectKey: string) {
  let review = rawState.reviews.find((item) => item.projectKey === projectKey);
  if (!review) {
    review = {
      projectKey,
      verdict: "observe_more",
      resultSummary: "项目仍在执行中，等待更多结果后再复盘。",
      attributionSummary: "当前以动作执行反馈为主。",
      attributionFactors: [],
      lessonsLearned: [],
      recommendations: [],
      assetCandidates: [],
      knowledgeAssets: [],
    };
    rawState.reviews.push(review);
  }
  return review;
}

export function ensureReviewLineage(
  governanceState: PilotGovernanceState,
  projectId: string,
  generatedAt: string,
) {
  let lineage = governanceState.reviewLineages.find((item) => item.projectId === projectId);
  if (!lineage) {
    const reviewId = normalizeReviewId(projectId.replace(/^pilot-/, "").replace(/-/g, "_").toUpperCase());
    lineage = {
      reviewId,
      projectId,
      sourceDecisionIds: [],
      sourceActionIds: [],
      sourceExecutionLogIds: [],
      generatedAt,
    };
    governanceState.reviewLineages.push(lineage);
  }
  return lineage;
}

export function syncReviewLineageForProject(
  rawState: PilotRawState,
  governanceState: PilotGovernanceState,
  projectKey: string,
  generatedAt: string,
) {
  const projectId = normalizeProjectId(projectKey);
  const lineage = ensureReviewLineage(governanceState, projectId, generatedAt);
  const actionSeeds = rawState.actions.filter((action) => action.projectKey === projectKey);
  lineage.sourceDecisionIds = Array.from(
    new Set([...lineage.sourceDecisionIds, normalizeEntityId("decision", projectKey)]),
  );
  lineage.sourceActionIds = Array.from(
    new Set([...lineage.sourceActionIds, ...actionSeeds.map((action) => normalizeActionId(action.actionKey))]),
  );
  lineage.sourceExecutionLogIds = Array.from(
    new Set([
      ...lineage.sourceExecutionLogIds,
      ...actionSeeds.flatMap((action) =>
        action.executionEvents.map((_, index) => normalizeEntityId("log", `${action.actionKey}-${index}`)),
      ),
    ]),
  );
  lineage.generatedAt = generatedAt;
}
