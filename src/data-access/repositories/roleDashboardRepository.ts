import type { PilotRuntime } from "../../domain/types/gateways";
import type { RoleView } from "../../domain/types/model";
import type { QueryResult } from "../../domain/types/query";
import { buildRoleDashboardViewModel } from "../../view-models/dashboards";
import { calculatePilotMetrics } from "../pilotMetrics";
import { createQueryResult, latestTimestamp } from "../queryResult";
import { getSnapshotIssues } from "./shared";

export interface RoleDashboardRepository {
  getDashboard(role: RoleView): QueryResult<{
    viewModel: ReturnType<typeof buildRoleDashboardViewModel>;
    executionFeed: Array<{
      id: string;
      summary: string;
      time: string;
    }>;
    pilotMetrics: Array<{
      key: string;
      label: string;
      value: string;
    }>;
  }>;
}

function formatMetricValue(value: number) {
  return `${value.toFixed(1)}%`;
}

export function createRoleDashboardRepository(runtime: PilotRuntime): RoleDashboardRepository {
  return {
    getDashboard(role) {
      const snapshot = runtime.getSnapshot();
      const metrics = calculatePilotMetrics(snapshot);
      const executionFeed = runtime.actionGateway.listExecutionLogs().slice(0, 5).map((item) => ({
        id: item.id,
        summary: item.summary,
        time: item.updatedAt.slice(11, 16),
      }));
      return createQueryResult({
        data: {
          viewModel: buildRoleDashboardViewModel(role, snapshot),
          executionFeed,
          pilotMetrics: [
            {
              key: "project_id_resolution_success_rate",
              label: "项目归一成功率",
              value: formatMetricValue(metrics.project_id_resolution_success_rate),
            },
            {
              key: "cross_page_object_consistency_rate",
              label: "跨页对象一致率",
              value: formatMetricValue(metrics.cross_page_object_consistency_rate),
            },
            {
              key: "decision_compile_success_rate",
              label: "决策编译成功率",
              value: formatMetricValue(metrics.decision_compile_success_rate),
            },
            {
              key: "action_writeback_success_rate",
              label: "写回成功率",
              value: formatMetricValue(metrics.action_writeback_success_rate),
            },
            {
              key: "review_to_asset_lineage_integrity_rate",
              label: "复盘到资产 lineage 完整率",
              value: formatMetricValue(metrics.review_to_asset_lineage_integrity_rate),
            },
          ],
        },
        lastUpdatedAt: latestTimestamp(
          snapshot.projects[0]?.updatedAt,
          runtime.actionGateway.listExecutionLogs()[0]?.updatedAt,
        ),
        issues: getSnapshotIssues(snapshot),
      });
    },
  };
}
