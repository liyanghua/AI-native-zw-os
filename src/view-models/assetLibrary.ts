import { getAssetTypeLabel, getLifecycleStageLabel } from "../domain/runtime/labels";
import type { AssetType, KnowledgeAssetDocument, LifecycleStage } from "../domain/types/model";

function formatApplicability(asset: KnowledgeAssetDocument) {
  return `${asset.applicability.stage[0]} · ${asset.applicability.businessGoal ?? "通用经营"} · ${
    asset.applicability.role[0] ?? "通用角色"
  }`;
}

export interface AssetLibraryViewModel {
  countsByType: Record<AssetType, number>;
  groupedByStage: Array<{
    stage: LifecycleStage;
    stageLabel: string;
    assets: Array<{
      id: string;
      typeLabel: string;
      title: string;
      summary: string;
      sourceInfo: string;
      applicabilityLabel: string;
      lineageLabel: string;
      sourceProjectId?: string;
    }>;
  }>;
}

export function buildAssetLibraryViewModel(assets: KnowledgeAssetDocument[]): AssetLibraryViewModel {
  const countsByType = assets.reduce<Record<AssetType, number>>(
    (counts, asset) => ({
      ...counts,
      [asset.assetType]: counts[asset.assetType] + 1,
    }),
    {
      case: 0,
      rule: 0,
      template: 0,
      skill: 0,
      sop: 0,
      evaluation_sample: 0,
    },
  );

  const stages: LifecycleStage[] = [
    "opportunity_pool",
    "new_product_incubation",
    "launch_validation",
    "growth_optimization",
    "review_capture",
  ];

  return {
    countsByType,
    groupedByStage: stages
      .map((stage) => ({
        stage,
        stageLabel: getLifecycleStageLabel(stage),
        assets: assets
          .filter((asset) => asset.stage === stage)
          .map((asset) => ({
            id: asset.id,
            typeLabel: getAssetTypeLabel(asset.assetType),
            title: asset.title,
            summary: asset.summary,
            sourceInfo: asset.sourceInfo,
            applicabilityLabel: formatApplicability(asset),
            lineageLabel: asset.lineage
              ? `review ${asset.lineage.sourceReviewId} · ${asset.lineage.publishStatus}`
              : "lineage 待补齐",
            sourceProjectId: asset.sourceProjectId,
          })),
      }))
      .filter((group) => group.assets.length > 0),
  };
}
