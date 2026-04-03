import { createMutationResult, createQueryResult } from "../queryResult";
import type { ApiClient } from "../apiClient";
import { buildErrorIssues } from "./shared";

export function createLocalSandboxOntologyRepository(client: ApiClient) {
  return {
    async getRegistry(filters: Parameters<ApiClient["getOntologyRegistry"]>[0] = {}) {
      try {
        const response = await client.getOntologyRegistry(filters);
        return createQueryResult({
          data: response,
          lastUpdatedAt: response.items[0]?.updatedAt ?? new Date().toISOString(),
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Ontology registry 拉取失败。";
        return createQueryResult({
          data: {
            items: [],
            filters: {
              itemType: filters.itemType ?? null,
              status: filters.status ?? null,
            },
          },
          lastUpdatedAt: new Date().toISOString(),
          issues: buildErrorIssues(message),
        });
      }
    },
    async getRegistryItem(registryId: string) {
      try {
        const response = await client.getOntologyRegistryItem(registryId);
        return createQueryResult({
          data: response,
          lastUpdatedAt: response.item.updatedAt,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : `Ontology item ${registryId} 拉取失败。`;
        return createQueryResult({
          data: {
            item: {
              registryId,
              itemType: "template",
              name: "Unavailable ontology item",
              status: "draft",
              owner: "system",
              currentVersion: 0,
              sourceTable: null,
              sourceId: null,
              updatedAt: new Date().toISOString(),
            },
            latestPayload: {},
            versions: [],
            lineageReferences: [],
          },
          lastUpdatedAt: new Date().toISOString(),
          issues: buildErrorIssues(message),
        });
      }
    },
    async activate(input: Parameters<ApiClient["activateOntologyItem"]>[0]) {
      try {
        const response = await client.activateOntologyItem(input);
        return createMutationResult({
          data: response,
          lastUpdatedAt: response.item.updatedAt,
        });
      } catch (error) {
        return createMutationResult({
          data: null,
          lastUpdatedAt: new Date().toISOString(),
          error: error instanceof Error ? error.message : "Ontology activate 失败。",
        });
      }
    },
    async deprecate(input: Parameters<ApiClient["deprecateOntologyItem"]>[0]) {
      try {
        const response = await client.deprecateOntologyItem(input);
        return createMutationResult({
          data: response,
          lastUpdatedAt: response.item.updatedAt,
        });
      } catch (error) {
        return createMutationResult({
          data: null,
          lastUpdatedAt: new Date().toISOString(),
          error: error instanceof Error ? error.message : "Ontology deprecate 失败。",
        });
      }
    },
    async getProjectReferences(projectId: string) {
      try {
        const response = await client.getProjectOntologyReferences(projectId);
        return createQueryResult({
          data: response,
          lastUpdatedAt: response.references[0]?.updatedAt ?? new Date().toISOString(),
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : `项目 ${projectId} 的 ontology 引用拉取失败。`;
        return createQueryResult({
          data: {
            projectId,
            references: [],
          },
          lastUpdatedAt: new Date().toISOString(),
          issues: buildErrorIssues(message, projectId),
        });
      }
    },
  };
}
