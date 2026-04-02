import type { PilotRuntime } from "../../domain/types/gateways";
import type {
  DecisionContext,
  DecisionObject,
  LifecycleStage,
  ProjectObject,
} from "../../domain/types/model";
import type { MutationResult, QueryResult } from "../../domain/types/query";
import { createProjectStateMachine } from "../../domain/services/projectStateMachine";
import { buildProjectDetailViewModel } from "../../view-models/projectDetail";
import { createMutationResult, createQueryResult, latestTimestamp } from "../queryResult";
import { getProjectIssues } from "./shared";

export interface ProjectWorkbenchRepository {
  getProjectDetail(projectId: string): QueryResult<{
    viewModel: ReturnType<typeof buildProjectDetailViewModel>;
    collaborationSummary: {
      pendingHumanActions: number;
      runningExecutions: number;
    };
  }>;
  compileDecisionContext(projectId: string): MutationResult<DecisionContext>;
  compileDecisionObject(projectId: string): MutationResult<DecisionObject>;
  transitionProjectStage(projectId: string, nextStage: LifecycleStage, reason: string): MutationResult<ProjectObject>;
}

export function createProjectWorkbenchRepository(runtime: PilotRuntime): ProjectWorkbenchRepository {
  return {
    getProjectDetail(projectId) {
      const snapshot = runtime.getSnapshot();
      const project = runtime.projectGateway.getProject(projectId);
      const realtime = runtime.projectGateway.getProjectRealtimeSnapshot(projectId);
      const review = runtime.knowledgeGateway.listProjectReview(projectId);
      const executionLogs = runtime.actionGateway.listExecutionLogs({ projectId });
      const knowledgeAssets = runtime.knowledgeGateway.searchAssets({ sourceProjectId: projectId });
      const auditTrail = project.actions[0]
        ? runtime.lineageGateway.getActionAuditTrail(project.actions[0].id)
        : null;
      const writebackRecord = project.actions[0]
        ? runtime.lineageGateway.getExecutionWritebackRecord(project.actions[0].id)
        : null;

      const issues = getProjectIssues(snapshot, project, realtime, review);

      return createQueryResult({
        data: {
          viewModel: buildProjectDetailViewModel({
            project,
            realtime,
            executionLogs,
            knowledgeAssets,
            review,
            auditTrail,
            writebackRecord,
          }),
          collaborationSummary: {
            pendingHumanActions: project.actions.filter((action) => action.approvalStatus === "pending").length,
            runningExecutions: project.actions.filter(
              (action) => action.executionStatus === "queued" || action.executionStatus === "in_progress",
            ).length,
          },
        },
        lastUpdatedAt: latestTimestamp(
          project.updatedAt,
          realtime.updatedAt,
          executionLogs[0]?.updatedAt,
          review.review?.updatedAt,
          writebackRecord?.updatedAt,
        ),
        issues,
      });
    },
    compileDecisionContext(projectId) {
      const context = runtime.decisionGateway.compileDecisionContext(projectId);
      return createMutationResult({
        data: context,
        lastUpdatedAt: context.updatedAt,
      });
    },
    compileDecisionObject(projectId) {
      const decision = runtime.decisionGateway.compileDecisionObject(projectId);
      return createMutationResult({
        data: decision,
        lastUpdatedAt: decision.updatedAt,
      });
    },
    transitionProjectStage(projectId, nextStage, reason) {
      const snapshot = runtime.getSnapshot();
      const project = runtime.projectGateway.getProject(projectId);
      const stateMachine = createProjectStateMachine(
        snapshot.transitionRules,
        project.allowedActionsByStage,
      );
      const transitionCheck = stateMachine.canTransition(project, nextStage, snapshot.transitionRules);
      if (!transitionCheck.allowed) {
        return createMutationResult({
          data: project,
          lastUpdatedAt: project.updatedAt,
          error: transitionCheck.reason ?? "Stage transition blocked",
        });
      }
      const updatedProject = runtime.projectGateway.transitionProjectStage(projectId, nextStage, reason);
      return createMutationResult({
        data: updatedProject,
        lastUpdatedAt: updatedProject.updatedAt,
        error: null,
      });
    },
  };
}
