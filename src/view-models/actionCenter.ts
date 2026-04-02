import { getApprovalLabel, getExecutionLabel, getRiskLabel, getWritebackStatusLabel } from "../domain/runtime/labels";
import type { ActionAuditTrail, ActionItem, ExecutionLog } from "../domain/types/model";

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
      idempotencyKey: string;
      auditCount: number;
    }>;
    queued: Array<{
      id: string;
      title: string;
      projectId: string;
      executionLabel: string;
      writebackStatusLabel: string;
      idempotencyKey: string;
    }>;
    inProgress: Array<{
      id: string;
      title: string;
      projectId: string;
      executionLabel: string;
      writebackStatusLabel: string;
      idempotencyKey: string;
    }>;
    completed: Array<{
      id: string;
      title: string;
      projectId: string;
      executionLabel: string;
      writebackStatusLabel: string;
      idempotencyKey: string;
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
  auditTrails?: ActionAuditTrail[];
}): ActionCenterViewModel {
  const auditCountByActionId = new Map(
    (input.auditTrails ?? []).map((trail) => [trail.actionId, trail.entries.length]),
  );

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
          idempotencyKey: action.idempotencyKey,
          auditCount: auditCountByActionId.get(action.id) ?? 0,
        })),
      queued: input.actions
        .filter((action) => action.executionStatus === "queued")
        .map((action) => ({
          id: action.id,
          title: action.title,
          projectId: action.sourceProjectId,
          executionLabel: getExecutionLabel(action.executionStatus),
          writebackStatusLabel: getWritebackStatusLabel(action.writebackStatus),
          idempotencyKey: action.idempotencyKey,
        })),
      inProgress: input.actions
        .filter((action) => action.executionStatus === "in_progress")
        .map((action) => ({
          id: action.id,
          title: action.title,
          projectId: action.sourceProjectId,
          executionLabel: getExecutionLabel(action.executionStatus),
          writebackStatusLabel: getWritebackStatusLabel(action.writebackStatus),
          idempotencyKey: action.idempotencyKey,
        })),
      completed: input.actions
        .filter((action) => action.executionStatus === "completed")
        .map((action) => ({
          id: action.id,
          title: action.title,
          projectId: action.sourceProjectId,
          executionLabel: getExecutionLabel(action.executionStatus),
          writebackStatusLabel: getWritebackStatusLabel(action.writebackStatus),
          idempotencyKey: action.idempotencyKey,
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
