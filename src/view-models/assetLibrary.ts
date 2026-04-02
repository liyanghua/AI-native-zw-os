import { getAssetTypeLabel, getLifecycleStageLabel } from "../domain/runtime/labels";
import type { AssetType, KnowledgeAssetDocument, LifecycleStage } from "../domain/types/model";

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
      applicability?: string;
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
            applicability: asset.applicability,
          })),
      }))
      .filter((group) => group.assets.length > 0),
  };
}
