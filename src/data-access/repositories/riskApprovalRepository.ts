import type { PilotRuntime } from "../../domain/types/gateways";
import type { QueryResult } from "../../domain/types/query";
import { buildRiskApprovalViewModel } from "../../view-models/riskApproval";
import { createQueryResult, latestTimestamp } from "../queryResult";
import { getSnapshotIssues } from "./shared";

export interface RiskApprovalRepository {
  getOverview(): QueryResult<ReturnType<typeof buildRiskApprovalViewModel>>;
}

export function createRiskApprovalRepository(runtime: PilotRuntime): RiskApprovalRepository {
  return {
    getOverview() {
      const snapshot = runtime.getSnapshot();
      const pendingApprovals = runtime.actionGateway.listActions({ approvalStatus: "pending" });
      const lowConfidenceProjects = snapshot.projects.filter(
        (project) => project.decisionObject && project.decisionObject.confidence !== "high",
      );

      return createQueryResult({
        data: buildRiskApprovalViewModel({
          exceptions: snapshot.exceptions,
          pendingApprovals,
          lowConfidenceProjects,
          policies: runtime.policyGateway.listHumanInTheLoopPolicies(),
        }),
        lastUpdatedAt: latestTimestamp(
          snapshot.exceptions[0]?.updatedAt,
          pendingApprovals[0]?.updatedAt,
        ),
        issues: getSnapshotIssues(snapshot),
      });
    },
  };
}
