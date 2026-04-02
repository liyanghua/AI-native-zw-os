import type { RoleType } from "../../domain/types/model";
import { createQueryResult } from "../queryResult";
import type { ApiClient } from "../apiClient";
import { buildErrorIssues, mapRoleDashboard } from "./shared";

export function createLocalSandboxRolesRepository(client: ApiClient) {
  return {
    async getDashboard(role: RoleType) {
      try {
        const response = await client.getRoleDashboard(role);
        return createQueryResult({
          data: mapRoleDashboard(response),
          lastUpdatedAt: new Date().toISOString(),
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : `角色 ${role} 的 dashboard 拉取失败。`;
        return createQueryResult({
          data: {
            role,
            roleProfile: {
              roleId: role,
              roleType: role,
              roleName: role,
              goalFocus: "等待角色编排结果",
              primaryObjects: [],
              decisionScope: [],
              evidencePreference: [],
              actionScope: [],
              summaryStyle: "placeholder",
            },
            summary: {
              headline: "角色工作台暂不可用",
              narrative: "本地 API 尚未返回角色编排结果。",
              metrics: [],
            },
            projectCards: [],
            decisionQueue: [],
            riskCards: [],
            opportunityCards: [],
            assetSummary: [],
          },
          lastUpdatedAt: new Date().toISOString(),
          issues: buildErrorIssues(message),
        });
      }
    },
  };
}
