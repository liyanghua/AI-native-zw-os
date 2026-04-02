import { createQueryResult } from "../queryResult";
import type { ApiClient } from "../apiClient";
import type { RoleType } from "../../domain/types/model";
import {
  buildErrorIssues,
  mapDecisionContext,
  mapDecisionObject,
  mapEvidencePack,
  mapKnowledgeSearchResult,
  mapRoleStory,
} from "./shared";

export function createLocalSandboxBrainRepository(client: ApiClient) {
  return {
    async compileContext(projectId: string) {
      try {
        const response = await client.compileDecisionContext({ projectId });
        return createQueryResult({
          data: {
            decisionContext: mapDecisionContext(response.decisionContext),
            projectSnapshot: response.projectSnapshot,
            kpiSummary: response.kpiSummary,
            risks: response.risks,
            opportunities: response.opportunities,
            matchedKnowledge: mapKnowledgeSearchResult(response.matchedKnowledge),
            missingEvidenceFlags: response.missingEvidenceFlags,
          },
          lastUpdatedAt: response.decisionContext.updatedAt,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : `项目 ${projectId} 的决策上下文编译失败。`;
        return createQueryResult({
          data: {
            decisionContext: null,
            projectSnapshot: null,
            kpiSummary: [],
            risks: [],
            opportunities: [],
            matchedKnowledge: null,
            missingEvidenceFlags: [],
          },
          lastUpdatedAt: new Date().toISOString(),
          issues: buildErrorIssues(message, projectId),
        });
      }
    },
    async compileDecision(projectId: string) {
      try {
        const response = await client.compileDecision({ projectId });
        return createQueryResult({
          data: {
            decisionObject: mapDecisionObject(response.decisionObject),
            evidencePack: mapEvidencePack(response.evidencePack),
          },
          lastUpdatedAt: response.decisionObject.updatedAt,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : `项目 ${projectId} 的决策编译失败。`;
        return createQueryResult({
          data: {
            decisionObject: null,
            evidencePack: null,
          },
          lastUpdatedAt: new Date().toISOString(),
          issues: buildErrorIssues(message, projectId),
        });
      }
    },
    async compileRoleStory(projectId: string, role: RoleType) {
      try {
        const response = await client.compileRoleStory({ projectId, role });
        return createQueryResult({
          data: mapRoleStory(response.roleStory),
          lastUpdatedAt: new Date().toISOString(),
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : `项目 ${projectId} 的角色叙事编译失败。`;
        return createQueryResult({
          data: null,
          lastUpdatedAt: new Date().toISOString(),
          issues: buildErrorIssues(message, projectId),
        });
      }
    },
  };
}
