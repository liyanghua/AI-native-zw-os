import { getApprovalLabel, getAssetTypeLabel, getConfidenceLabel, getExecutionLabel, getHealthLabel, getLifecycleStageLabel, getReviewVerdictLabel, getRiskLabel } from "../domain/runtime/labels";
import type {
  ExecutionLog,
  KnowledgeAssetDocument,
  ProjectObject,
  ProjectRealtimeSnapshot,
  ProjectReviewRecord,
} from "../domain/types/model";

function formatMetricValue(value: number, unit?: "%" | "currency" | "count" | "score") {
  if (unit === "currency") {
    return `¥${value.toLocaleString("zh-CN")}`;
  }
  if (unit === "%") {
    return `${value}%`;
  }
  return `${value}`;
}

function getLayerLabel(triggeredBy: ProjectObject["actions"][number]["triggeredBy"]) {
  if (triggeredBy === "decision_brain") return "经营大脑";
  if (triggeredBy === "scenario_agent") return "场景 Agent";
  if (triggeredBy === "automation_rule") return "执行端";
  return "人工";
}

export interface ProjectDetailViewModel {
  project: {
    id: string;
    name: string;
    stageLabel: string;
    healthLabel: string;
    riskLabel: string;
    targetSummary: string;
    statusSummary: string;
    latestPulse?: string;
    keyBlocker?: string;
    owner: string;
    priority: number;
  };
  metrics: Array<{
    id: string;
    label: string;
    value: string;
    helper: string;
    tone: "positive" | "neutral" | "warning";
  }>;
  decision: {
    problemOrOpportunity: string;
    rationale: string;
    confidenceLabel: string;
    requiresHumanApproval: boolean;
    recommendedOptionTitle?: string;
    options: Array<{
      id: string;
      title: string;
      summary: string;
      expectedImpact: string;
      riskLabel: string;
      autoExecutableLabel: string;
    }>;
    pendingQuestions: string[];
  };
  decisionEvidence: Array<{
    id: string;
    summary: string;
    sourceLabel?: string;
    confidenceLabel?: string;
  }>;
  actions: Array<{
    id: string;
    title: string;
    summary: string;
    approvalLabel: string;
    executionLabel: string;
    riskLabel: string;
    layerLabel: string;
    requiresHumanApproval: boolean;
  }>;
  executionTimeline: Array<{
    id: string;
    statusLabel: string;
    summary: string;
    actorLabel: string;
    time: string;
  }>;
  agentLane: Array<{
    id: string;
    typeLabel: string;
    status: string;
    summary: string;
    waitingReason?: string;
  }>;
  knowledgeHighlights: Array<{
    id: string;
    typeLabel: string;
    title: string;
    summary: string;
    sourceInfo: string;
    applicability?: string;
  }>;
  review: {
    verdictLabel: string;
    resultSummary: string;
    lessonsLearned: string[];
    recommendations: string[];
    candidateCount: number;
    publishedCount: number;
  } | null;
}

export function buildProjectDetailViewModel(input: {
  project: ProjectObject;
  realtime: ProjectRealtimeSnapshot;
  executionLogs: ExecutionLog[];
  knowledgeAssets: KnowledgeAssetDocument[];
  review: ProjectReviewRecord;
}): ProjectDetailViewModel {
  const recommendedOption = input.project.decisionObject?.options.find(
    (option) => option.id === input.project.decisionObject?.recommendedOptionId,
  );

  return {
    project: {
      id: input.project.id,
      name: input.project.name,
      stageLabel: getLifecycleStageLabel(input.project.stage),
      healthLabel: getHealthLabel(input.project.health),
      riskLabel: getRiskLabel(input.project.riskLevel),
      targetSummary: input.project.targetSummary,
      statusSummary: input.project.statusSummary,
      latestPulse: input.project.latestPulse,
      keyBlocker: input.project.keyBlocker,
      owner: input.project.owner,
      priority: input.project.priority,
    },
    metrics: input.realtime.kpis.metrics.map((metric) => ({
      id: metric.key,
      label: metric.label,
      value: formatMetricValue(metric.value, metric.unit),
      helper:
        metric.deltaVsTarget !== undefined
          ? `较目标 ${metric.deltaVsTarget > 0 ? "+" : ""}${metric.deltaVsTarget}${metric.unit === "%" ? "%" : ""}`
          : metric.freshness ?? "batch",
      tone:
        metric.deltaVsTarget !== undefined && metric.deltaVsTarget < 0
          ? "warning"
          : metric.trend === "up"
            ? "positive"
            : "neutral",
    })),
    decision: {
      problemOrOpportunity: input.project.decisionObject?.problemOrOpportunity ?? "暂无决策对象",
      rationale: input.project.decisionObject?.rationale ?? "等待经营大脑编译",
      confidenceLabel: getConfidenceLabel(input.project.decisionObject?.confidence ?? "medium"),
      requiresHumanApproval: input.project.decisionObject?.requiresHumanApproval ?? false,
      recommendedOptionTitle: recommendedOption?.title,
      options:
        input.project.decisionObject?.options.map((option) => ({
          id: option.id,
          title: option.title,
          summary: option.summary,
          expectedImpact: option.expectedImpact,
          riskLabel: getRiskLabel(option.risk),
          autoExecutableLabel: option.autoExecutable ? "可自动推进" : "需要人工判断",
        })) ?? [],
      pendingQuestions: input.project.decisionObject?.pendingQuestions ?? [],
    },
    decisionEvidence:
      input.project.decisionObject?.evidencePack.refs.map((ref) => ({
        id: ref.id,
        summary: ref.summary,
        sourceLabel: ref.sourceLabel,
        confidenceLabel: ref.confidence ? getConfidenceLabel(ref.confidence) : undefined,
      })) ?? [],
    actions: input.project.actions.map((action) => ({
      id: action.id,
      title: action.title,
      summary: action.summary,
      approvalLabel: getApprovalLabel(action.approvalStatus),
      executionLabel: getExecutionLabel(action.executionStatus),
      riskLabel: getRiskLabel(action.risk),
      layerLabel: getLayerLabel(action.triggeredBy),
      requiresHumanApproval: action.requiresHumanApproval,
    })),
    executionTimeline: input.executionLogs.map((log) => ({
      id: log.id,
      statusLabel: getExecutionLabel(log.status),
      summary: log.summary,
      actorLabel:
        log.actorType === "human"
          ? "人工"
          : log.actorType === "agent"
            ? "场景 Agent"
            : "执行端",
      time: log.updatedAt.slice(11, 16),
    })),
    agentLane: input.project.agentStates.map((agent) => ({
      id: agent.id,
      typeLabel: agent.agentType,
      status: agent.status,
      summary: agent.summary,
      waitingReason: agent.waitingReason,
    })),
    knowledgeHighlights: input.knowledgeAssets.map((asset) => ({
      id: asset.id,
      typeLabel: getAssetTypeLabel(asset.assetType),
      title: asset.title,
      summary: asset.summary,
      sourceInfo: asset.sourceInfo,
      applicability: asset.applicability,
    })),
    review: input.review.review
      ? {
          verdictLabel: getReviewVerdictLabel(input.review.review.verdict),
          resultSummary: input.review.review.resultSummary,
          lessonsLearned: input.review.review.lessonsLearned,
          recommendations: input.review.review.recommendations,
          candidateCount: input.review.candidates.filter((candidate) => candidate.approvalStatus === "pending").length,
          publishedCount: input.review.publishedAssets.length,
        }
      : null,
  };
}
