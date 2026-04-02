import type { LifecycleStage } from "../../domain/types/model";
import { createQueryResult } from "../queryResult";
import type { ApiClient } from "../apiClient";
import {
  buildLifecycleOverviewData,
  buildOverviewErrorResult,
  buildStageBoardData,
  buildStageErrorResult,
} from "./shared";

export function createLocalSandboxLifecycleRepository(client: ApiClient) {
  return {
    async getOverview() {
      try {
        const response = await client.getProjects();
        const latestTimestamp = response.projects.map((project) => project.updatedAt).sort().at(-1)
          ?? new Date().toISOString();

        return createQueryResult({
          data: buildLifecycleOverviewData(response.projects),
          lastUpdatedAt: latestTimestamp,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "生命周期列表拉取失败。";
        return buildOverviewErrorResult(message);
      }
    },
    async getStage(stage: LifecycleStage) {
      try {
        const response = await client.getProjects({ stage });
        const latestTimestamp = response.projects.map((project) => project.updatedAt).sort().at(-1)
          ?? new Date().toISOString();

        return createQueryResult({
          data: buildStageBoardData(stage, response.projects),
          lastUpdatedAt: latestTimestamp,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : `阶段 ${stage} 拉取失败。`;
        return buildStageErrorResult(stage, message);
      }
    },
  };
}
