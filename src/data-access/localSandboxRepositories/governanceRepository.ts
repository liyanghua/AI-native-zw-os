import { createMutationResult, createQueryResult } from "../queryResult";
import type { ApiClient } from "../apiClient";
import {
  buildErrorIssues,
  mapActionCenterResponse,
  mapAssetLibraryResponse,
  mapEvaluationData,
  mapKnowledgeFeedbackRecord,
  mapProjectGovernance,
  mapPublishedAsset,
  mapReview,
  mapReviewCenterResponse,
} from "./shared";

export function createLocalSandboxGovernanceRepository(client: ApiClient) {
  return {
    async getActionCenter(filters: Parameters<ApiClient["getActionCenter"]>[0] = {}) {
      try {
        const response = await client.getActionCenter(filters);
        return createQueryResult({
          data: mapActionCenterResponse(response),
          lastUpdatedAt: response.items[0]?.updatedAt ?? new Date().toISOString(),
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "动作中心拉取失败。";
        return createQueryResult({
          data: {
            items: [],
            summary: {
              total: 0,
              pendingApprovals: 0,
              queued: 0,
              inProgress: 0,
              completed: 0,
            },
            filters: {
              role: filters.role ?? null,
              actionDomain: filters.actionDomain ?? null,
              approvalStatus: filters.approvalStatus ?? null,
              executionStatus: filters.executionStatus ?? null,
              projectId: filters.projectId ?? null,
            },
          },
          lastUpdatedAt: new Date().toISOString(),
          issues: buildErrorIssues(message, filters.projectId),
        });
      }
    },
    async getReviewCenter(filters: Parameters<ApiClient["getReviewCenter"]>[0] = {}) {
      try {
        const response = await client.getReviewCenter(filters);
        return createQueryResult({
          data: mapReviewCenterResponse(response),
          lastUpdatedAt: response.items[0]?.updatedAt ?? new Date().toISOString(),
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "复盘中心拉取失败。";
        return createQueryResult({
          data: {
            items: [],
            summary: {
              total: 0,
              approved: 0,
              generated: 0,
              promoted: 0,
              promoteable: 0,
            },
            filters: {
              projectId: filters.projectId ?? null,
              reviewStatus: filters.reviewStatus ?? null,
              reviewType: filters.reviewType ?? null,
              sourceActionId: filters.sourceActionId ?? null,
            },
          },
          lastUpdatedAt: new Date().toISOString(),
          issues: buildErrorIssues(message, filters.projectId),
        });
      }
    },
    async promoteReviewToAsset(
      reviewId: string,
      input: Parameters<ApiClient["promoteReviewToAsset"]>[1],
    ) {
      try {
        const response = await client.promoteReviewToAsset(reviewId, input);
        return createMutationResult({
          data: {
            review: mapReview(response.review),
            assetCandidate: response.assetCandidate,
          },
          lastUpdatedAt: response.review.updatedAt ?? response.review.createdAt,
        });
      } catch (error) {
        return createMutationResult({
          data: null,
          lastUpdatedAt: new Date().toISOString(),
          error: error instanceof Error ? error.message : `Review ${reviewId} promote 失败。`,
        });
      }
    },
    async getAssetLibrary(filters: Parameters<ApiClient["getAssetLibrary"]>[0] = {}) {
      try {
        const response = await client.getAssetLibrary(filters);
        return createQueryResult({
          data: mapAssetLibraryResponse(response),
          lastUpdatedAt: response.items[0]?.updatedAt ?? new Date().toISOString(),
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "资产库拉取失败。";
        return createQueryResult({
          data: {
            items: [],
            summary: {
              total: 0,
              candidates: 0,
              published: 0,
              feedbackSynced: 0,
            },
            filters: {
              projectId: filters.projectId ?? null,
              publishStatus: filters.publishStatus ?? null,
              assetType: filters.assetType ?? null,
            },
          },
          lastUpdatedAt: new Date().toISOString(),
          issues: buildErrorIssues(message, filters.projectId),
        });
      }
    },
    async publishAsset(candidateId: string, input: Parameters<ApiClient["publishAsset"]>[1]) {
      try {
        const response = await client.publishAsset(candidateId, input);
        return createMutationResult({
          data: {
            publishedAsset: mapPublishedAsset(response.publishedAsset),
          },
          lastUpdatedAt: response.publishedAsset.updatedAt,
        });
      } catch (error) {
        return createMutationResult({
          data: null,
          lastUpdatedAt: new Date().toISOString(),
          error: error instanceof Error ? error.message : `Asset ${candidateId} publish 失败。`,
        });
      }
    },
    async feedbackToKnowledge(input: Parameters<ApiClient["feedbackToKnowledge"]>[0]) {
      try {
        const response = input.sourceType === "published_asset" && input.sourceId
          ? await client.feedbackAssetToKnowledge(input.sourceId, input)
          : await client.feedbackToKnowledge(input);
        return createMutationResult({
          data: {
            feedback: mapKnowledgeFeedbackRecord(response.feedback),
          },
          lastUpdatedAt: response.feedback.createdAt,
        });
      } catch (error) {
        return createMutationResult({
          data: null,
          lastUpdatedAt: new Date().toISOString(),
          error: error instanceof Error ? error.message : "知识回流失败。",
        });
      }
    },
    async getEvaluations(filters: Parameters<ApiClient["getEvaluations"]>[0] = {}) {
      try {
        const response = await client.getEvaluations(filters);
        return createQueryResult({
          data: mapEvaluationData(response),
          lastUpdatedAt: response.records[0]?.createdAt ?? new Date().toISOString(),
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "评测记录拉取失败。";
        return createQueryResult({
          data: {
            records: [],
            summary: {
              total: 0,
              averageScore: 0,
              byType: {},
            },
          },
          lastUpdatedAt: new Date().toISOString(),
          issues: buildErrorIssues(message, filters.projectId),
        });
      }
    },
    async runEvaluations(input: Parameters<ApiClient["runEvaluations"]>[0]) {
      try {
        const response = await client.runEvaluations(input);
        return createMutationResult({
          data: mapEvaluationData(response),
          lastUpdatedAt: response.records[0]?.createdAt ?? new Date().toISOString(),
        });
      } catch (error) {
        return createMutationResult({
          data: null,
          lastUpdatedAt: new Date().toISOString(),
          error: error instanceof Error ? error.message : "评测执行失败。",
        });
      }
    },
    async getProjectGovernance(projectId: string) {
      try {
        const response = await client.getProjectGovernance(projectId);
        return createQueryResult({
          data: mapProjectGovernance(response),
          lastUpdatedAt:
            response.feedbackSummary.latestFeedback?.createdAt ??
            response.evaluationSummary.latestEvaluation?.createdAt ??
            new Date().toISOString(),
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : `项目 ${projectId} 的治理摘要拉取失败。`;
        return createQueryResult({
          data: {
            projectId,
            actionsSummary: {
              total: 0,
              pendingApprovals: 0,
              inProgress: 0,
              completed: 0,
              latestAction: null,
            },
            reviewSummary: {
              total: 0,
              approved: 0,
              latestReview: null,
            },
            assetSummary: {
              total: 0,
              candidates: 0,
              published: 0,
              latestAsset: null,
            },
            evaluationSummary: {
              total: 0,
              averageScore: 0,
              byType: {},
              latestEvaluation: null,
            },
            feedbackSummary: {
              total: 0,
              synced: 0,
              latestFeedback: null,
            },
          },
          lastUpdatedAt: new Date().toISOString(),
          issues: buildErrorIssues(message, projectId),
        });
      }
    },
  };
}
