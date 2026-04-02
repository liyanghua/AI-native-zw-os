import type {
  AllowedActionByStage,
  LifecycleStage,
  ProjectObject,
  StageExitCriteria,
  TransitionRule,
} from "../types/model";

const defaultAllowedActions: AllowedActionByStage[] = [
  { stage: "opportunity_pool", actionType: "project_initiation", decisionMode: "require_approval", requiresApproval: true },
  { stage: "new_product_incubation", actionType: "price_confirmation", decisionMode: "require_approval", requiresApproval: true },
  { stage: "launch_validation", actionType: "price_adjustment", decisionMode: "require_approval", requiresApproval: true },
  { stage: "launch_validation", actionType: "visual_refresh", decisionMode: "suggest", requiresApproval: true },
  { stage: "growth_optimization", actionType: "inventory_restock", decisionMode: "require_approval", requiresApproval: true },
  { stage: "growth_optimization", actionType: "budget_reallocation", decisionMode: "suggest", requiresApproval: false },
  { stage: "review_capture", actionType: "review_publish", decisionMode: "require_approval", requiresApproval: true },
];

export interface TransitionCheck {
  allowed: boolean;
  reason?: string;
  rule?: TransitionRule;
  blockingCriteria: StageExitCriteria[];
}

export function canTransition(
  project: ProjectObject,
  nextStage: LifecycleStage,
  transitionRules: TransitionRule[],
): TransitionCheck {
  const rule = transitionRules.find(
    (item) => item.fromStage === project.stage && item.toStage === nextStage,
  );

  if (!rule) {
    return {
      allowed: false,
      reason: `No transition rule from ${project.stage} to ${nextStage}`,
      blockingCriteria: [],
    };
  }

  const blockingCriteria = project.stageExitCriteria.filter(
    (criterion) => criterion.blocking && criterion.status !== "passed",
  );

  if (blockingCriteria.length > 0) {
    return {
      allowed: false,
      reason: `Blocked by exit criteria: ${blockingCriteria[0].label}`,
      rule,
      blockingCriteria,
    };
  }

  return {
    allowed: true,
    rule,
    blockingCriteria: [],
  };
}

export function getAllowedActions(
  stage: LifecycleStage,
  allowedActions: AllowedActionByStage[] = defaultAllowedActions,
) {
  return allowedActions.filter((item) => item.stage === stage);
}

export function getStageExitCriteria(project: ProjectObject) {
  return project.stageExitCriteria;
}

export function createProjectStateMachine(
  transitionRules: TransitionRule[],
  allowedActions: AllowedActionByStage[] = defaultAllowedActions,
) {
  return {
    canTransition(
      project: ProjectObject,
      nextStage: LifecycleStage,
      rules = transitionRules,
    ) {
      return canTransition(project, nextStage, rules);
    },
    getAllowedActions(stage: LifecycleStage) {
      return getAllowedActions(stage, allowedActions);
    },
    getStageExitCriteria(project: ProjectObject) {
      return getStageExitCriteria(project);
    },
  };
}
