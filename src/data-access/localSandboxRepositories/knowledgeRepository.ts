import { createQueryResult } from "../queryResult";
import type { ApiClient } from "../apiClient";
import { buildErrorIssues, mapKnowledgeSearchResult } from "./shared";

export function createLocalSandboxKnowledgeRepository(client: ApiClient) {
  return {
    async search(input: Parameters<ApiClient["searchKnowledge"]>[0]) {
      try {
        const response = await client.searchKnowledge(input);
        return createQueryResult({
          data: mapKnowledgeSearchResult(response),
          lastUpdatedAt: response.generatedAt,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "知识检索失败。";
        return createQueryResult({
          data: mapKnowledgeSearchResult({
            projectId: input.projectId,
            query: input.query ?? "",
            matchedAssets: [],
            matchedChunks: [],
            retrievalTrace: [],
            resultCount: 0,
            generatedAt: new Date().toISOString(),
          }),
          lastUpdatedAt: new Date().toISOString(),
          issues: buildErrorIssues(message, input.projectId),
        });
      }
    },
    async getProjectKnowledge(projectId: string) {
      try {
        const response = await client.getProjectKnowledge(projectId);
        return createQueryResult({
          data: mapKnowledgeSearchResult(response),
          lastUpdatedAt: response.generatedAt,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : `项目 ${projectId} 的知识证据拉取失败。`;
        return createQueryResult({
          data: mapKnowledgeSearchResult({
            projectId,
            query: "",
            matchedAssets: [],
            matchedChunks: [],
            retrievalTrace: [],
            resultCount: 0,
            generatedAt: new Date().toISOString(),
          }),
          lastUpdatedAt: new Date().toISOString(),
          issues: buildErrorIssues(message, projectId),
        });
      }
    },
  };
}
