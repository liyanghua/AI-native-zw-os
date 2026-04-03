import type { QueryResult } from "../../domain/types/query";
import type {
  ActionLineage,
  DecisionContext,
  DecisionObject,
  EvidencePack,
  KnowledgeSearchResult,
  RoleStory,
  RoleType,
} from "../../domain/types/model";
import { createQueryIssue, createQueryResult } from "../queryResult";
import type { ApiClient } from "../apiClient";
import {
  buildProjectDetailData,
  buildProjectErrorResult,
  buildProjectWorkbenchData,
  buildWorkbenchErrorResult,
} from "./shared";

export function createLocalSandboxProjectsRepository(
  client: ApiClient,
  dependencies: {
    knowledge: {
      getProjectKnowledge(projectId: string): Promise<QueryResult<KnowledgeSearchResult>>;
    };
    execution: {
      getProjectLineage(projectId: string): Promise<QueryResult<{
        projectId: string;
        decisionId: string | null;
        actions: ActionLineage[];
      }>>;
    };
    brain: {
      compileContext(projectId: string): Promise<QueryResult<{
        decisionContext: DecisionContext | null;
        projectSnapshot: unknown;
        kpiSummary: unknown[];
        risks: unknown[];
        opportunities: unknown[];
        matchedKnowledge: KnowledgeSearchResult | null;
        missingEvidenceFlags: string[];
      }>>;
      compileDecision(projectId: string): Promise<QueryResult<{
        decisionObject: DecisionObject | null;
        evidencePack: EvidencePack | null;
      }>>;
      compileRoleStory(projectId: string, role: RoleType): Promise<QueryResult<RoleStory | null>>;
    };
  },
) {
  return {
    async getDetail(projectId: string) {
      try {
        const response = await client.getProjectDetail(projectId);
        return createQueryResult({
          data: buildProjectDetailData(response),
          lastUpdatedAt: response.project.updatedAt,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : `项目 ${projectId} 拉取失败。`;
        return buildProjectErrorResult(projectId, message);
      }
    },
    async getWorkbench(projectId: string) {
      try {
        const detailResponse = await client.getProjectDetail(projectId);
        const detail = buildProjectDetailData(detailResponse);

        const [knowledge, context, decision, bossStory, operationsStory, productStory, visualStory, lineage] = await Promise.all([
          dependencies.knowledge.getProjectKnowledge(projectId),
          dependencies.brain.compileContext(projectId),
          dependencies.brain.compileDecision(projectId),
          dependencies.brain.compileRoleStory(projectId, "boss"),
          dependencies.brain.compileRoleStory(projectId, "operations_director"),
          dependencies.brain.compileRoleStory(projectId, "product_rnd_director"),
          dependencies.brain.compileRoleStory(projectId, "visual_director"),
          dependencies.execution.getProjectLineage(projectId),
        ]);

        const issues = [
          ...knowledge.issues,
          ...context.issues,
          ...decision.issues,
          ...bossStory.issues,
          ...operationsStory.issues,
          ...productStory.issues,
          ...visualStory.issues,
          ...lineage.issues,
        ];

        if (
          context.data.decisionContext &&
          decision.data.decisionObject &&
          decision.data.evidencePack &&
          bossStory.data &&
          operationsStory.data &&
          productStory.data &&
          visualStory.data &&
          lineage.data
        ) {
          return createQueryResult({
            data: buildProjectWorkbenchData({
              detail,
              knowledge: knowledge.data,
              decisionContext: context.data.decisionContext,
              decision: {
                decisionObject: decision.data.decisionObject,
                evidencePack: decision.data.evidencePack,
              },
              roleStories: {
                boss: bossStory.data,
                operations_director: operationsStory.data,
                product_rnd_director: productStory.data,
                visual_director: visualStory.data,
              },
              actionLineage: lineage.data,
            }),
            lastUpdatedAt: detail.project.updatedAt,
            issues,
          });
        }

        return buildWorkbenchErrorResult(
          projectId,
          detail,
          {
            knowledge: knowledge.data,
            decisionContext: context.data.decisionContext ?? undefined,
            decision:
              decision.data.decisionObject && decision.data.evidencePack
                ? {
                    decisionObject: decision.data.decisionObject,
                    evidencePack: decision.data.evidencePack,
                  }
                : undefined,
            roleStories:
              bossStory.data && operationsStory.data && productStory.data && visualStory.data
                ? {
                    boss: bossStory.data,
                    operations_director: operationsStory.data,
                    product_rnd_director: productStory.data,
                    visual_director: visualStory.data,
                  }
                : undefined,
            actionLineage: lineage.data ?? undefined,
            reviews: lineage.data?.actions
              .map((item) => item.latestReview)
              .filter(Boolean) ?? undefined,
          },
          issues.length > 0
            ? issues
            : [
                createQueryIssue(
                  "partial_data",
                  "warning",
                  `项目 ${projectId} 的 workbench 聚合不完整。`,
                  projectId,
                ),
              ],
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : `项目 ${projectId} 的 workbench 拉取失败。`;
        return buildProjectErrorResult(projectId, message);
      }
    },
  };
}
