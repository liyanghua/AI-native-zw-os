import { getConfidenceLabel } from "../../domain/runtime/labels";
import type { PilotRuntime } from "../../domain/types/gateways";
import type { QueryResult } from "../../domain/types/query";
import { buildActionCenterViewModel } from "../../view-models/actionCenter";
import { createQueryResult, latestTimestamp } from "../queryResult";
import { getActionCenterIssues } from "./shared";

export interface ActionCenterRepository {
  getOverview(): QueryResult<{
    viewModel: ReturnType<typeof buildActionCenterViewModel>;
    recommendedActions: Array<{
      id: string;
      projectId: string;
      description: string;
      owner: string;
      confidenceLabel: string;
      expectedMetric: string;
      requiredApproval: boolean;
    }>;
  }>;
}

export function createActionCenterRepository(runtime: PilotRuntime): ActionCenterRepository {
  return {
    getOverview() {
      const snapshot = runtime.getSnapshot();
      const actions = runtime.actionGateway.listActions();
      const executionLogs = runtime.actionGateway.listExecutionLogs();
      const recommendedActions = snapshot.projects.flatMap((project) =>
        (project.decisionObject?.recommendedActions ?? []).map((action) => ({
          id: action.actionId,
          projectId: project.id,
          description: action.description,
          owner: action.owner,
          confidenceLabel: getConfidenceLabel(action.confidence),
          expectedMetric: `${action.expectedMetric} ${action.expectedDirection}`,
          requiredApproval: action.requiredApproval,
        })),
      );

      return createQueryResult({
        data: {
          viewModel: buildActionCenterViewModel({
            actions,
            executionLogs,
            auditTrails: snapshot.actionAuditTrails,
          }),
          recommendedActions,
        },
        lastUpdatedAt: latestTimestamp(
          executionLogs[0]?.updatedAt,
          actions[0]?.updatedAt,
          snapshot.actionAuditTrails[0]?.entries[0]?.updatedAt,
        ),
        issues: getActionCenterIssues(snapshot),
      });
    },
  };
}
