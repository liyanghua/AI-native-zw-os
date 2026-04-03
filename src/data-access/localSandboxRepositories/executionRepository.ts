import { createMutationResult, createQueryResult } from "../queryResult";
import type { ApiClient } from "../apiClient";
import {
  buildErrorIssues,
  mapAction,
  mapExecutionLog,
  mapExecutionResult,
  mapExecutionRun,
  mapProjectLineage,
  mapReview,
  mapWritebackRecord,
} from "./shared";
import type { LifecycleStage } from "../../domain/types/model";

function fallbackStage(stage?: LifecycleStage): LifecycleStage {
  return stage ?? "growth_optimization";
}

export function createLocalSandboxExecutionRepository(client: ApiClient) {
  return {
    async approveAction(actionId: string, input: { approvedBy: string; reason?: string }, stage?: LifecycleStage) {
      try {
        const response = await client.approveAction(actionId, input);
        return createMutationResult({
          data: {
            action: mapAction(response.action, fallbackStage(stage)),
            approval: response.approval,
          },
          lastUpdatedAt: response.action.updatedAt,
        });
      } catch (error) {
        return createMutationResult({
          data: null,
          lastUpdatedAt: new Date().toISOString(),
          error: error instanceof Error ? error.message : `动作 ${actionId} 审批失败。`,
        });
      }
    },
    async rejectAction(actionId: string, input: { approvedBy: string; reason?: string }, stage?: LifecycleStage) {
      try {
        const response = await client.rejectAction(actionId, input);
        return createMutationResult({
          data: {
            action: mapAction(response.action, fallbackStage(stage)),
            approval: response.approval,
          },
          lastUpdatedAt: response.action.updatedAt,
        });
      } catch (error) {
        return createMutationResult({
          data: null,
          lastUpdatedAt: new Date().toISOString(),
          error: error instanceof Error ? error.message : `动作 ${actionId} 驳回失败。`,
        });
      }
    },
    async triggerAgent(input: { projectId: string; actionId: string }, stage?: LifecycleStage) {
      try {
        const response = await client.triggerAgent(input);
        return createMutationResult({
          data: {
            action: mapAction(response.action, fallbackStage(stage)),
            run: mapExecutionRun(response.run),
            latestLog: mapExecutionLog(response.latestLog),
          },
          lastUpdatedAt: response.run.startedAt,
        });
      } catch (error) {
        return createMutationResult({
          data: null,
          lastUpdatedAt: new Date().toISOString(),
          error: error instanceof Error ? error.message : `动作 ${input.actionId} trigger 失败。`,
        });
      }
    },
    async runMockExecution(input: { projectId: string; actionId: string; runId: string }) {
      try {
        const response = await client.runMockExecution(input);
        return createMutationResult({
          data: {
            run: mapExecutionRun(response.run),
            executionResult: mapExecutionResult(response.executionResult),
            latestLog: mapExecutionLog(response.latestLog),
          },
          lastUpdatedAt: response.run.finishedAt ?? response.run.startedAt,
        });
      } catch (error) {
        return createMutationResult({
          data: null,
          lastUpdatedAt: new Date().toISOString(),
          error: error instanceof Error ? error.message : `Run ${input.runId} mock 执行失败。`,
        });
      }
    },
    async writebackRun(runId: string) {
      try {
        const response = await client.writebackExecutionRun(runId);
        return createMutationResult({
          data: {
            action: mapAction(response.action, "growth_optimization"),
            updatedProjectSnapshot: response.updatedProjectSnapshot,
            updatedKpis: response.updatedKpis.map((metric) => ({
              key: metric.metricName as never,
              label: metric.metricName.toUpperCase(),
              value: metric.metricValue,
              unit: metric.metricUnit ?? undefined,
              trend: metric.metricDirection ?? undefined,
              freshness: "batch",
            })),
            writebackRecord: mapWritebackRecord(response.writebackRecord),
            latestLog: mapExecutionLog(response.latestLog),
          },
          lastUpdatedAt: response.writebackRecord.createdAt,
        });
      } catch (error) {
        return createMutationResult({
          data: null,
          lastUpdatedAt: new Date().toISOString(),
          error: error instanceof Error ? error.message : `Run ${runId} writeback 失败。`,
        });
      }
    },
    async generateReview(input: { projectId: string; actionId: string; runId: string }) {
      try {
        const response = await client.generateReview(input);
        return createMutationResult({
          data: {
            review: mapReview(response.review),
          },
          lastUpdatedAt: response.review.createdAt,
        });
      } catch (error) {
        return createMutationResult({
          data: null,
          lastUpdatedAt: new Date().toISOString(),
          error: error instanceof Error ? error.message : `Run ${input.runId} review 生成失败。`,
        });
      }
    },
    async publishAssetCandidate(input: { projectId: string; reviewId: string }) {
      try {
        const response = await client.publishAssetCandidate(input);
        return createMutationResult({
          data: {
            assetCandidate: response.assetCandidate,
          },
          lastUpdatedAt: response.assetCandidate.createdAt,
        });
      } catch (error) {
        return createMutationResult({
          data: null,
          lastUpdatedAt: new Date().toISOString(),
          error: error instanceof Error ? error.message : `Review ${input.reviewId} 资产候选发布失败。`,
        });
      }
    },
    async getProjectLineage(projectId: string, stage?: LifecycleStage) {
      try {
        const response = await client.getProjectLineage(projectId);
        return createQueryResult({
          data: mapProjectLineage(response, fallbackStage(stage)),
          lastUpdatedAt: new Date().toISOString(),
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : `项目 ${projectId} lineage 拉取失败。`;
        return createQueryResult({
          data: {
            projectId,
            decisionId: null,
            actions: [],
          },
          lastUpdatedAt: new Date().toISOString(),
          issues: buildErrorIssues(message, projectId),
        });
      }
    },
  };
}
