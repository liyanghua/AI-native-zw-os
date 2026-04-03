import { createMutationResult, createQueryResult } from "../queryResult";
import type { ApiClient } from "../apiClient";
import { buildErrorIssues } from "./shared";

export function createLocalSandboxRuntimeRepository(client: ApiClient) {
  return {
    async getWorkflows(filters: Parameters<ApiClient["getRuntimeWorkflows"]>[0] = {}) {
      try {
        const response = await client.getRuntimeWorkflows(filters);
        return createQueryResult({
          data: response,
          lastUpdatedAt: response.workflows[0]?.lastEventAt ?? new Date().toISOString(),
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "运行时工作流拉取失败。";
        return createQueryResult({
          data: {
            workflows: [],
            filters: {
              projectId: filters.projectId ?? null,
              actionId: filters.actionId ?? null,
              status: filters.status ?? null,
            },
          },
          lastUpdatedAt: new Date().toISOString(),
          issues: buildErrorIssues(message, filters.projectId),
        });
      }
    },
    async getWorkflow(workflowId: string) {
      try {
        const response = await client.getRuntimeWorkflow(workflowId);
        return createQueryResult({
          data: response,
          lastUpdatedAt: response.workflow.lastEventAt,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : `Workflow ${workflowId} 拉取失败。`;
        return createQueryResult({
          data: {
            workflow: {
              workflowId,
              projectId: "",
              actionId: "",
              role: "operations_director",
              actionDomain: "operations",
              status: "failed",
              currentTaskType: null,
              startedAt: new Date().toISOString(),
              finishedAt: null,
              lastEventAt: new Date().toISOString(),
            },
            tasks: [],
            events: [],
            retryRecords: [],
          },
          lastUpdatedAt: new Date().toISOString(),
          issues: buildErrorIssues(message),
        });
      }
    },
    async retryTask(taskId: string, input: Parameters<ApiClient["retryRuntimeTask"]>[1]) {
      try {
        const response = await client.retryRuntimeTask(taskId, input);
        return createMutationResult({
          data: response,
          lastUpdatedAt: response.latestEvent.createdAt,
        });
      } catch (error) {
        return createMutationResult({
          data: null,
          lastUpdatedAt: new Date().toISOString(),
          error: error instanceof Error ? error.message : `Task ${taskId} retry 失败。`,
        });
      }
    },
    async cancelTask(taskId: string, input: Parameters<ApiClient["cancelRuntimeTask"]>[1]) {
      try {
        const response = await client.cancelRuntimeTask(taskId, input);
        return createMutationResult({
          data: response,
          lastUpdatedAt: response.latestEvent.createdAt,
        });
      } catch (error) {
        return createMutationResult({
          data: null,
          lastUpdatedAt: new Date().toISOString(),
          error: error instanceof Error ? error.message : `Task ${taskId} cancel 失败。`,
        });
      }
    },
    async getProjectSummary(projectId: string) {
      try {
        const response = await client.getProjectRuntimeSummary(projectId);
        return createQueryResult({
          data: response,
          lastUpdatedAt: response.latestEvent?.createdAt ?? response.latestWorkflow?.lastEventAt ?? new Date().toISOString(),
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : `项目 ${projectId} 的 runtime 摘要拉取失败。`;
        return createQueryResult({
          data: {
            projectId,
            counts: {
              queued: 0,
              running: 0,
              awaiting_approval: 0,
              awaiting_writeback: 0,
              completed: 0,
              failed: 0,
              retryable: 0,
              cancelled: 0,
            },
            latestWorkflow: null,
            latestEvent: null,
          },
          lastUpdatedAt: new Date().toISOString(),
          issues: buildErrorIssues(message, projectId),
        });
      }
    },
  };
}
