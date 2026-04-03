import { createMutationResult, createQueryResult } from "../queryResult";
import type { ApiClient } from "../apiClient";
import { buildErrorIssues } from "./shared";

export function createLocalSandboxBridgeRepository(client: ApiClient) {
  return {
    async getAdapters() {
      try {
        const response = await client.getBridgeAdapters();
        return createQueryResult({
          data: response,
          lastUpdatedAt:
            response.adapters[0]?.latestSync?.finishedAt ??
            response.adapters[0]?.updatedAt ??
            new Date().toISOString(),
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Bridge adapters 拉取失败。";
        return createQueryResult({
          data: {
            adapters: [],
            connectors: [],
          },
          lastUpdatedAt: new Date().toISOString(),
          issues: buildErrorIssues(message),
        });
      }
    },
    async getSyncRecords(filters: Parameters<ApiClient["getBridgeSyncRecords"]>[0] = {}) {
      try {
        const response = await client.getBridgeSyncRecords(filters);
        return createQueryResult({
          data: response,
          lastUpdatedAt: response.records[0]?.finishedAt ?? response.records[0]?.startedAt ?? new Date().toISOString(),
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Bridge sync records 拉取失败。";
        return createQueryResult({
          data: {
            records: [],
            filters: {
              adapterId: filters.adapterId ?? null,
            },
          },
          lastUpdatedAt: new Date().toISOString(),
          issues: buildErrorIssues(message),
        });
      }
    },
    async runSync(input: Parameters<ApiClient["runBridgeSync"]>[0]) {
      try {
        const response = await client.runBridgeSync(input);
        return createMutationResult({
          data: response,
          lastUpdatedAt: response.syncRecord.finishedAt ?? response.syncRecord.startedAt,
        });
      } catch (error) {
        return createMutationResult({
          data: null,
          lastUpdatedAt: new Date().toISOString(),
          error: error instanceof Error ? error.message : "Bridge sync 执行失败。",
        });
      }
    },
    async getProjectSummary(projectId: string) {
      try {
        const response = await client.getProjectBridgeSummary(projectId);
        return createQueryResult({
          data: response,
          lastUpdatedAt:
            response.adapterSummary[0]?.latestSync?.finishedAt ??
            new Date().toISOString(),
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : `项目 ${projectId} 的 bridge 摘要拉取失败。`;
        return createQueryResult({
          data: {
            projectId,
            adapterSummary: [],
          },
          lastUpdatedAt: new Date().toISOString(),
          issues: buildErrorIssues(message, projectId),
        });
      }
    },
  };
}
