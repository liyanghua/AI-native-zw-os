import type { PilotSnapshot } from "../domain/types/model";

export interface PilotMetricSet {
  project_id_resolution_success_rate: number;
  cross_page_object_consistency_rate: number;
  decision_compile_success_rate: number;
  action_writeback_success_rate: number;
  review_to_asset_lineage_integrity_rate: number;
}

function toRate(numerator: number, denominator: number) {
  if (denominator <= 0) {
    return 100;
  }
  return Number(((numerator / denominator) * 100).toFixed(1));
}

export function calculatePilotMetrics(snapshot: PilotSnapshot): PilotMetricSet {
  const resolvedIdentities = snapshot.identities.filter(
    (identity) => identity.conflictStatus !== "conflicted",
  ).length;

  const consistentProjects = snapshot.projects.filter((project) =>
    snapshot.identities.some((identity) => identity.projectId === project.id) &&
    snapshot.realtimeSnapshots.some((realtime) => realtime.projectId === project.id),
  ).length;

  const decisionReadyProjects = snapshot.projects.filter(
    (project) => project.decisionObject && project.decisionObject.evidenceRefs.length > 0,
  ).length;

  const successfulWritebacks = snapshot.executionWritebackRecords.filter(
    (record) => record.resultStatus === "succeeded" || record.resultStatus === "duplicate_ignored",
  ).length;

  const publishedAssets = snapshot.knowledgeAssets.filter((asset) => asset.status === "published");
  const assetsWithCompleteLineage = publishedAssets.filter((asset) =>
    asset.lineage &&
    snapshot.reviews.some((review) => review.review?.id === asset.lineage?.sourceReviewId),
  ).length;

  return {
    project_id_resolution_success_rate: toRate(resolvedIdentities, snapshot.identities.length),
    cross_page_object_consistency_rate: toRate(consistentProjects, snapshot.projects.length),
    decision_compile_success_rate: toRate(decisionReadyProjects, snapshot.projects.length),
    action_writeback_success_rate: toRate(successfulWritebacks, snapshot.executionWritebackRecords.length),
    review_to_asset_lineage_integrity_rate: toRate(assetsWithCompleteLineage, publishedAssets.length),
  };
}
