import type { PilotRuntime, ResolveProjectIdentityInput } from "../../domain/types/gateways";
import type {
  IdentityResolutionLog,
  ProjectIdentity,
  SourceObjectRef,
} from "../../domain/types/model";
import type { MutationResult, QueryResult } from "../../domain/types/query";
import { createMutationResult, createQueryIssue, createQueryResult, latestTimestamp } from "../queryResult";

export interface IdentityRepository {
  getProjectIdentity(projectId: string): QueryResult<{
    identity: ProjectIdentity;
    sourceRefs: SourceObjectRef[];
    resolutionLogs: IdentityResolutionLog[];
  }>;
  resolveProjectIdentity(input: ResolveProjectIdentityInput): MutationResult<ProjectIdentity>;
  listSourceObjectRefs(projectId: string): QueryResult<SourceObjectRef[]>;
  listIdentityResolutionLogs(projectId?: string): QueryResult<IdentityResolutionLog[]>;
}

export function createIdentityRepository(runtime: PilotRuntime): IdentityRepository {
  return {
    getProjectIdentity(projectId) {
      const identity = runtime.identityGateway.getProjectIdentity(projectId);
      const sourceRefs = runtime.identityGateway.listSourceObjectRefs(projectId);
      const resolutionLogs = runtime.identityGateway.listIdentityResolutionLogs(projectId);
      const issues = identity.conflictStatus !== "healthy" || resolutionLogs.length > 0
        ? [
            createQueryIssue(
              "identity_conflict",
              "warning",
              "该项目存在归一冲突或人工修正痕迹，不能把 projectId 当作天然稳定。",
              projectId,
            ),
          ]
        : [];

      return createQueryResult({
        data: { identity, sourceRefs, resolutionLogs },
        lastUpdatedAt: latestTimestamp(identity.updatedAt, resolutionLogs[0]?.updatedAt),
        issues,
      });
    },
    resolveProjectIdentity(input) {
      const identity = runtime.identityGateway.resolveProjectIdentity(input);
      return createMutationResult({
        data: identity,
        lastUpdatedAt: identity.updatedAt,
      });
    },
    listSourceObjectRefs(projectId) {
      const sourceRefs = runtime.identityGateway.listSourceObjectRefs(projectId);
      return createQueryResult({
        data: sourceRefs,
        lastUpdatedAt: latestTimestamp(...sourceRefs.map((ref) => ref.lastSeenAt)),
      });
    },
    listIdentityResolutionLogs(projectId) {
      const logs = runtime.identityGateway.listIdentityResolutionLogs(projectId);
      return createQueryResult({
        data: logs,
        lastUpdatedAt: latestTimestamp(...logs.map((log) => log.updatedAt)),
      });
    },
  };
}
