import type {
  PilotRuntime,
  SearchAssetFilters,
} from "../../domain/types/gateways";
import type { QueryResult } from "../../domain/types/query";
import { buildAssetLibraryViewModel } from "../../view-models/assetLibrary";
import { buildReviewAssetsViewModel } from "../../view-models/reviewAssets";
import { createQueryResult, latestTimestamp } from "../queryResult";
import { getKnowledgeIssues } from "./shared";

export interface KnowledgeRepository {
  getReviewAssets(): QueryResult<{
    viewModel: ReturnType<typeof buildReviewAssetsViewModel>;
  }>;
  getAssetLibrary(filters?: SearchAssetFilters): QueryResult<{
    viewModel: ReturnType<typeof buildAssetLibraryViewModel>;
  }>;
}

export function createKnowledgeRepository(runtime: PilotRuntime): KnowledgeRepository {
  return {
    getReviewAssets() {
      const snapshot = runtime.getSnapshot();
      return createQueryResult({
        data: {
          viewModel: buildReviewAssetsViewModel({
            reviews: snapshot.reviews,
            assets: snapshot.knowledgeAssets,
          }),
        },
        lastUpdatedAt: latestTimestamp(
          snapshot.reviews[0]?.review?.updatedAt,
          snapshot.knowledgeAssets[0]?.updatedAt,
        ),
        issues: getKnowledgeIssues(snapshot),
      });
    },
    getAssetLibrary(filters) {
      const assets = runtime.knowledgeGateway.searchAssets(filters);
      const snapshot = runtime.getSnapshot();
      const issues = getKnowledgeIssues(snapshot).filter(
        (issue) => issue.code === "partial_data",
      );
      return createQueryResult({
        data: {
          viewModel: buildAssetLibraryViewModel(assets),
        },
        lastUpdatedAt: latestTimestamp(...assets.map((asset) => asset.updatedAt)),
        issues,
      });
    },
  };
}
