import { getApprovalLabel, getExecutionLabel, getRiskLabel } from "../domain/runtime/labels";
import type { ActionItem, ExecutionLog } from "../domain/types/model";

export interface ActionCenterViewModel {
  summary: {
    pending: number;
    queued: number;
    inProgress: number;
    completed: number;
    rolledBack: number;
  };
  columns: {
    pendingApprovals: Array<{
      id: string;
      title: string;
      projectId: string;
      summary: string;
      riskLabel: string;
      approvalLabel: string;
    }>;
    queued: Array<{
      id: string;
      title: string;
      projectId: string;
      executionLabel: string;
    }>;
    inProgress: Array<{
      id: string;
      title: string;
      projectId: string;
      executionLabel: string;
    }>;
    completed: Array<{
      id: string;
      title: string;
      projectId: string;
      executionLabel: string;
    }>;
  };
  feed: Array<{
    id: string;
    statusLabel: string;
    summary: string;
    time: string;
  }>;
}

export function buildActionCenterViewModel(input: {
  actions: ActionItem[];
  executionLogs: ExecutionLog[];
}): ActionCenterViewModel {
  return {
    summary: {
      pending: input.actions.filter((action) => action.approvalStatus === "pending").length,
      queued: input.actions.filter((action) => action.executionStatus === "queued").length,
      inProgress: input.actions.filter((action) => action.executionStatus === "in_progress").length,
      completed: input.actions.filter((action) => action.executionStatus === "completed").length,
      rolledBack: input.actions.filter((action) => action.executionStatus === "rolled_back").length,
    },
    columns: {
      pendingApprovals: input.actions
        .filter((action) => action.approvalStatus === "pending")
        .map((action) => ({
          id: action.id,
          title: action.title,
          projectId: action.sourceProjectId,
          summary: action.summary,
          riskLabel: getRiskLabel(action.risk),
          approvalLabel: getApprovalLabel(action.approvalStatus),
        })),
      queued: input.actions
        .filter((action) => action.executionStatus === "queued")
        .map((action) => ({
          id: action.id,
          title: action.title,
          projectId: action.sourceProjectId,
          executionLabel: getExecutionLabel(action.executionStatus),
        })),
      inProgress: input.actions
        .filter((action) => action.executionStatus === "in_progress")
        .map((action) => ({
          id: action.id,
          title: action.title,
          projectId: action.sourceProjectId,
          executionLabel: getExecutionLabel(action.executionStatus),
        })),
      completed: input.actions
        .filter((action) => action.executionStatus === "completed")
        .map((action) => ({
          id: action.id,
          title: action.title,
          projectId: action.sourceProjectId,
          executionLabel: getExecutionLabel(action.executionStatus),
        })),
    },
    feed: input.executionLogs.slice(0, 8).map((log) => ({
      id: log.id,
      statusLabel: getExecutionLabel(log.status),
      summary: log.summary,
      time: log.updatedAt.slice(11, 16),
    })),
  };
}
