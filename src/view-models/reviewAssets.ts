import { getAssetTypeLabel, getReviewVerdictLabel } from "../domain/runtime/labels";
import type { KnowledgeAssetDocument, ProjectReviewRecord } from "../domain/types/model";

export interface ReviewAssetsViewModel {
  summary: {
    pendingReviews: number;
    pendingCandidates: number;
    publishedAssets: number;
  };
  reviews: Array<{
    projectId: string;
    verdictLabel: string;
    resultSummary: string;
    recommendations: string[];
  }>;
  candidates: Array<{
    id: string;
    projectId: string;
    typeLabel: string;
    title: string;
    rationale: string;
    applicability?: string;
  }>;
  assets: Array<{
    id: string;
    typeLabel: string;
    title: string;
    summary: string;
    sourceInfo: string;
  }>;
}

export function buildReviewAssetsViewModel(input: {
  reviews: ProjectReviewRecord[];
  assets: KnowledgeAssetDocument[];
}): ReviewAssetsViewModel {
  return {
    summary: {
      pendingReviews: input.reviews.filter((record) => Boolean(record.review)).length,
      pendingCandidates: input.reviews.reduce(
        (count, record) => count + record.candidates.filter((candidate) => candidate.approvalStatus === "pending").length,
        0,
      ),
      publishedAssets: input.assets.length,
    },
    reviews: input.reviews
      .filter((record) => Boolean(record.review))
      .map((record) => ({
        projectId: record.projectId,
        verdictLabel: getReviewVerdictLabel(record.review?.verdict ?? "observe_more"),
        resultSummary: record.review?.resultSummary ?? "",
        recommendations: record.review?.recommendations ?? [],
      })),
    candidates: input.reviews.flatMap((record) =>
      record.candidates
        .filter((candidate) => candidate.approvalStatus === "pending")
        .map((candidate) => ({
          id: candidate.id,
          projectId: record.projectId,
          typeLabel: getAssetTypeLabel(candidate.type),
          title: candidate.title,
          rationale: candidate.rationale,
          applicability: candidate.applicability,
        })),
    ),
    assets: input.assets.map((asset) => ({
      id: asset.id,
      typeLabel: getAssetTypeLabel(asset.assetType),
      title: asset.title,
      summary: asset.summary,
      sourceInfo: asset.sourceInfo,
    })),
  };
}
