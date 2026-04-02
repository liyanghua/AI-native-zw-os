import type { PilotRuntime } from "../../domain/types/gateways";
import type { LifecycleStage } from "../../domain/types/model";
import type { QueryResult } from "../../domain/types/query";
import {
  buildLifecycleOverviewViewModel,
  buildLifecycleStageViewModel,
} from "../../view-models/lifecycle";
import { createQueryResult, latestTimestamp } from "../queryResult";
import { getSnapshotIssues } from "./shared";

export interface LifecycleRepository {
  getOverview(): QueryResult<{
    viewModel: ReturnType<typeof buildLifecycleOverviewViewModel>;
  }>;
  getStage(stage: LifecycleStage): QueryResult<{
    viewModel: ReturnType<typeof buildLifecycleStageViewModel>;
  }>;
}

export function createLifecycleRepository(runtime: PilotRuntime): LifecycleRepository {
  return {
    getOverview() {
      const snapshot = runtime.getSnapshot();
      return createQueryResult({
        data: {
          viewModel: buildLifecycleOverviewViewModel(snapshot),
        },
        lastUpdatedAt: latestTimestamp(snapshot.projects[0]?.updatedAt, snapshot.knowledgeAssets[0]?.updatedAt),
        issues: getSnapshotIssues(snapshot),
      });
    },
    getStage(stage) {
      const projects = runtime.projectGateway.listProjectsByStage(stage);
      const snapshots = projects.map((project) => runtime.projectGateway.getProjectRealtimeSnapshot(project.id));
      return createQueryResult({
        data: {
          viewModel: buildLifecycleStageViewModel(stage, projects, snapshots),
        },
        lastUpdatedAt: latestTimestamp(...projects.map((project) => project.updatedAt)),
        issues: [],
      });
    },
  };
}
