import { getAssetTypeLabel, getReviewVerdictLabel } from "../domain/runtime/labels";
import type { KnowledgeAssetDocument, ProjectReviewRecord } from "../domain/types/model";

function formatApplicability(asset: { applicability: KnowledgeAssetDocument["applicability"] }) {
  return `${asset.applicability.stage[0]} · ${asset.applicability.businessGoal ?? "通用经营"}`;
}

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
    lineageLabel: string;
  }>;
  candidates: Array<{
    id: string;
    projectId: string;
    typeLabel: string;
    title: string;
    rationale: string;
    applicabilityLabel: string;
  }>;
  assets: Array<{
    id: string;
    typeLabel: string;
    title: string;
    summary: string;
    sourceInfo: string;
    lineageLabel: string;
    applicabilityLabel: string;
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
        lineageLabel: record.lineage
          ? `决策 ${record.lineage.sourceDecisionIds.length} · 动作 ${record.lineage.sourceActionIds.length} · 日志 ${record.lineage.sourceExecutionLogIds.length}`
          : "lineage 待补齐",
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
          applicabilityLabel: formatApplicability(candidate),
        })),
    ),
    assets: input.assets.map((asset) => ({
      id: asset.id,
      typeLabel: getAssetTypeLabel(asset.assetType),
      title: asset.title,
      summary: asset.summary,
      sourceInfo: asset.sourceInfo,
      lineageLabel: asset.lineage
        ? `来源复盘 ${asset.lineage.sourceReviewId} · 发布时间 ${asset.lineage.publishedAt.slice(11, 16)}`
        : "lineage 待补齐",
      applicabilityLabel: formatApplicability(asset),
    })),
  };
}
