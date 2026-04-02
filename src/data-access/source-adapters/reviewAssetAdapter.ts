import type { PilotRawState } from "../pilotSources";
import { createSourceRef } from "./shared";

export function mapReviewAssetSourceRefs(rawState: PilotRawState, projectKey: string) {
  const review = rawState.reviews.find((item) => item.projectKey === projectKey);
  if (!review) {
    return [];
  }

  return [
    createSourceRef({
      sourceSystem: "review_asset_hub",
      sourceObjectType: "review",
      sourceObjectId: `${projectKey.toLowerCase()}-review`,
      externalKey: projectKey,
    }),
    ...review.knowledgeAssets.map((asset) =>
      createSourceRef({
        sourceSystem: "review_asset_hub",
        sourceObjectType: "asset",
        sourceObjectId: asset.assetKey,
        externalKey: projectKey,
      }),
    ),
  ];
}
