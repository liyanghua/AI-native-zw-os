import type { PilotRuntime } from "../../domain/types/gateways";
import { createActionCenterRepository } from "./actionCenterRepository";
import { createIdentityRepository } from "./identityRepository";
import { createKnowledgeRepository } from "./knowledgeRepository";
import { createLifecycleRepository } from "./lifecycleRepository";
import { createProjectWorkbenchRepository } from "./projectWorkbenchRepository";
import { createRiskApprovalRepository } from "./riskApprovalRepository";
import { createRoleDashboardRepository } from "./roleDashboardRepository";

export function createPilotRepositories(runtime: PilotRuntime) {
  return {
    identity: createIdentityRepository(runtime),
    projectWorkbench: createProjectWorkbenchRepository(runtime),
    actionCenter: createActionCenterRepository(runtime),
    knowledge: createKnowledgeRepository(runtime),
    roleDashboard: createRoleDashboardRepository(runtime),
    lifecycle: createLifecycleRepository(runtime),
    riskApproval: createRiskApprovalRepository(runtime),
  };
}
