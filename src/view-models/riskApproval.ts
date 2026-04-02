import { getDecisionModeLabel, getRiskLabel, getWritebackStatusLabel } from "../domain/runtime/labels";
import type {
  ActionItem,
  ExceptionItem,
  HumanInTheLoopPolicy,
  ProjectObject,
} from "../domain/types/model";

export interface RiskApprovalViewModel {
  summary: {
    exceptionCount: number;
    highRiskApprovals: number;
    lowConfidenceDecisions: number;
  };
  exceptions: Array<{
    id: string;
    summary: string;
    severityLabel: string;
    projectId?: string;
  }>;
  pendingApprovals: Array<{
    id: string;
    title: string;
    summary: string;
    projectId: string;
    riskLabel: string;
    owner: string;
    writebackStatusLabel: string;
  }>;
  lowConfidenceProjects: Array<{
    id: string;
    name: string;
    problemOrOpportunity: string;
    confidence: string;
  }>;
  policies: Array<{
    id: string;
    actionType: string;
    decisionModeLabel: string;
    riskLabel: string;
    fallbackPolicy: string;
  }>;
}

export function buildRiskApprovalViewModel(input: {
  exceptions: ExceptionItem[];
  pendingApprovals: ActionItem[];
  lowConfidenceProjects: ProjectObject[];
  policies: HumanInTheLoopPolicy[];
}): RiskApprovalViewModel {
  return {
    summary: {
      exceptionCount: input.exceptions.length,
      highRiskApprovals: input.pendingApprovals.length,
      lowConfidenceDecisions: input.lowConfidenceProjects.length,
    },
    exceptions: input.exceptions.map((exception) => ({
      id: exception.id,
      summary: exception.summary,
      severityLabel: getRiskLabel(exception.severity),
      projectId: exception.projectId,
    })),
    pendingApprovals: input.pendingApprovals.map((action) => ({
      id: action.id,
      title: action.title,
      summary: action.summary,
      projectId: action.sourceProjectId,
      riskLabel: getRiskLabel(action.risk),
      owner: action.owner,
      writebackStatusLabel: getWritebackStatusLabel(action.writebackStatus),
    })),
    lowConfidenceProjects: input.lowConfidenceProjects.map((project) => ({
      id: project.id,
      name: project.name,
      problemOrOpportunity: project.decisionObject?.problemOrOpportunity ?? "待编译决策对象",
      confidence: project.decisionObject?.confidence ?? "low",
    })),
    policies: input.policies.map((policy) => ({
      id: policy.id,
      actionType: policy.actionType,
      decisionModeLabel: getDecisionModeLabel(policy.decisionMode),
      riskLabel: getRiskLabel(policy.riskLevel),
      fallbackPolicy: policy.fallbackPolicy,
    })),
  };
}
