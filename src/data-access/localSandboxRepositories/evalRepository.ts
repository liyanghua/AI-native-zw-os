import { createMutationResult, createQueryResult } from "../queryResult";
import type { ApiClient } from "../apiClient";
import { buildErrorIssues } from "./shared";

export function createLocalSandboxEvalRepository(client: ApiClient) {
  return {
    async getCases() {
      try {
        const response = await client.getEvalCases();
        return createQueryResult({
          data: response,
          lastUpdatedAt: response.cases[0]?.createdAt ?? new Date().toISOString(),
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Eval cases 拉取失败。";
        return createQueryResult({
          data: { cases: [] },
          lastUpdatedAt: new Date().toISOString(),
          issues: buildErrorIssues(message),
        });
      }
    },
    async getSuites() {
      try {
        const response = await client.getEvalSuites();
        return createQueryResult({
          data: response,
          lastUpdatedAt: response.suites[0]?.createdAt ?? new Date().toISOString(),
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Eval suites 拉取失败。";
        return createQueryResult({
          data: { suites: [] },
          lastUpdatedAt: new Date().toISOString(),
          issues: buildErrorIssues(message),
        });
      }
    },
    async getRuns(filters: Parameters<ApiClient["getEvalRuns"]>[0] = {}) {
      try {
        const response = await client.getEvalRuns(filters);
        return createQueryResult({
          data: response,
          lastUpdatedAt: response.runs[0]?.startedAt ?? new Date().toISOString(),
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Eval runs 拉取失败。";
        return createQueryResult({
          data: { runs: [] },
          lastUpdatedAt: new Date().toISOString(),
          issues: buildErrorIssues(message, filters.projectId),
        });
      }
    },
    async getRun(runId: string) {
      try {
        const response = await client.getEvalRun(runId);
        return createQueryResult({
          data: response,
          lastUpdatedAt: response.run.finishedAt ?? response.run.startedAt,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : `Eval run ${runId} 拉取失败。`;
        return createQueryResult({
          data: {
            run: {
              runId,
              projectId: "",
              suiteId: "",
              status: "failed",
              summary: { total: 0, averageScore: 0, byStatus: {} },
              startedAt: new Date().toISOString(),
              finishedAt: null,
            },
            results: [],
            gateDecision: null,
          },
          lastUpdatedAt: new Date().toISOString(),
          issues: buildErrorIssues(message),
        });
      }
    },
    async runSuite(input: Parameters<ApiClient["runEvalSuite"]>[0]) {
      try {
        const response = await client.runEvalSuite(input);
        return createMutationResult({
          data: response,
          lastUpdatedAt: response.run.finishedAt ?? response.run.startedAt,
        });
      } catch (error) {
        return createMutationResult({
          data: null,
          lastUpdatedAt: new Date().toISOString(),
          error: error instanceof Error ? error.message : "Eval suite 执行失败。",
        });
      }
    },
    async getProjectSummary(projectId: string) {
      try {
        const response = await client.getProjectEvalSummary(projectId);
        return createQueryResult({
          data: response,
          lastUpdatedAt:
            response.latestGateDecision?.createdAt ??
            response.latestRun?.finishedAt ??
            response.latestRun?.startedAt ??
            new Date().toISOString(),
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : `项目 ${projectId} 的 eval 摘要拉取失败。`;
        return createQueryResult({
          data: {
            summary: {
              total: 0,
              averageScore: 0,
              byStatus: {},
            },
            latestRun: null,
            latestGateDecision: null,
          },
          lastUpdatedAt: new Date().toISOString(),
          issues: buildErrorIssues(message, projectId),
        });
      }
    },
  };
}
