import {
  getApprovalLabel,
  getAssetTypeLabel,
  getConfidenceLabel,
  getExecutionLabel,
  getHealthLabel,
  getIdentityConflictLabel,
  getLifecycleStageLabel,
  getProjectStatusLabel,
  getReviewVerdictLabel,
  getRiskLabel,
  getWritebackStatusLabel,
} from "../domain/runtime/labels";
import type {
  ActionAuditTrail,
  ExecutionLog,
  ExecutionWritebackRecord,
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

function formatApplicability(asset: { applicability: KnowledgeAssetDocument["applicability"] }) {
  const stageLabel = asset.applicability.stage[0];
  const goal = asset.applicability.businessGoal ?? "通用经营";
  return `${stageLabel} · ${goal}`;
}

export interface ProjectDetailViewModel {
  project: {
    id: string;
    name: string;
    stageLabel: string;
    statusLabel: string;
    healthLabel: string;
    riskLabel: string;
    targetSummary: string;
    statusSummary: string;
    latestPulse?: string;
    keyBlocker?: string;
    owner: string;
    priority: number;
  };
  identitySummary: {
    confidenceLabel: string;
    conflictLabel: string;
    sourceCount: number;
    resolvedBy: string;
    resolvedAt: string;
    sources: Array<{
      key: string;
      label: string;
    }>;
  };
  stageGovernance: {
    exitCriteria: Array<{
      id: string;
      label: string;
      description: string;
      statusLabel: string;
      blocking: boolean;
    }>;
    transitionBlockReason?: string;
    availableTransitions: Array<{
      id: string;
      toStageLabel: string;
      description: string;
    }>;
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
    diagnosis: string;
    confidenceLabel: string;
    expectedImpact: string;
    approvalsRequired: string[];
    compiledAtLabel: string;
    requiresHumanApproval: boolean;
    recommendedOptionTitle?: string;
    recommendedActions: Array<{
      actionId: string;
      description: string;
      owner: string;
      approvalLabel: string;
      expectedMetric: string;
    }>;
    pendingQuestions: string[];
  };
  evidence: {
    fact: Array<{
      id: string;
      summary: string;
      sourceLabel?: string;
      confidenceLabel?: string;
      updatedAtLabel?: string;
    }>;
    method: Array<{
      id: string;
      summary: string;
      sourceLabel?: string;
      confidenceLabel?: string;
      applicabilityLabel?: string;
    }>;
    missingFlags: string[];
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
    actionVersion: number;
    idempotencyKey: string;
    writebackStatusLabel: string;
    lastWritebackError?: string;
  }>;
  executionTimeline: Array<{
    id: string;
    statusLabel: string;
    summary: string;
    actorLabel: string;
    time: string;
  }>;
  audit: {
    entries: Array<{
      id: string;
      summary: string;
      actorLabel: string;
      time: string;
    }>;
    latestWriteback: string;
  };
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
    applicabilityLabel: string;
  }>;
  review: {
    verdictLabel: string;
    resultSummary: string;
    lessonsLearned: string[];
    recommendations: string[];
    candidateCount: number;
    publishedCount: number;
    lineageLabel: string;
  } | null;
}

export function buildProjectDetailViewModel(input: {
  project: ProjectObject;
  realtime: ProjectRealtimeSnapshot;
  executionLogs: ExecutionLog[];
  knowledgeAssets: KnowledgeAssetDocument[];
  review: ProjectReviewRecord;
  auditTrail?: ActionAuditTrail | null;
  writebackRecord?: ExecutionWritebackRecord | null;
}): ProjectDetailViewModel {
  const recommendedOption = input.project.decisionObject?.options.find(
    (option) => option.id === input.project.decisionObject?.recommendedOptionId,
  );

  return {
    project: {
      id: input.project.id,
      name: input.project.name,
      stageLabel: getLifecycleStageLabel(input.project.stage),
      statusLabel: getProjectStatusLabel(input.project.status),
      healthLabel: getHealthLabel(input.project.health),
      riskLabel: getRiskLabel(input.project.riskLevel),
      targetSummary: input.project.targetSummary,
      statusSummary: input.project.statusSummary,
      latestPulse: input.project.latestPulse,
      keyBlocker: input.project.keyBlocker,
      owner: input.project.owner,
      priority: input.project.priority,
    },
    identitySummary: {
      confidenceLabel: getConfidenceLabel(input.project.identity.confidence),
      conflictLabel: getIdentityConflictLabel(input.project.identity.conflictStatus),
      sourceCount: input.project.identity.sourceRefs.length,
      resolvedBy: input.project.identity.resolvedBy,
      resolvedAt: input.project.identity.resolvedAt.slice(11, 16),
      sources: input.project.identity.sourceRefs.map((source) => ({
        key: source.sourceObjectId,
        label: `${source.sourceSystem} · ${source.sourceObjectType}`,
      })),
    },
    stageGovernance: {
      exitCriteria: input.project.stageExitCriteria.map((criterion) => ({
        id: criterion.id,
        label: criterion.label,
        description: criterion.description,
        statusLabel:
          criterion.status === "passed" ? "已满足" : criterion.status === "failed" ? "未满足" : "待补齐",
        blocking: criterion.blocking,
      })),
      transitionBlockReason: input.project.transitionBlockReason,
      availableTransitions: input.project.availableTransitions.map((transition) => ({
        id: transition.id,
        toStageLabel: getLifecycleStageLabel(transition.toStage),
        description: transition.description,
      })),
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
      diagnosis: input.project.decisionObject?.diagnosis ?? "等待经营大脑诊断",
      confidenceLabel: getConfidenceLabel(input.project.decisionObject?.confidence ?? "medium"),
      expectedImpact: input.project.decisionObject?.expectedImpact ?? "等待经营大脑给出影响预估",
      approvalsRequired: input.project.decisionObject?.approvalsRequired ?? [],
      compiledAtLabel: input.project.decisionObject?.compiledAt.slice(11, 16) ?? "待编译",
      requiresHumanApproval: input.project.decisionObject?.requiresHumanApproval ?? false,
      recommendedOptionTitle: recommendedOption?.title,
      recommendedActions:
        input.project.decisionObject?.recommendedActions.map((action) => ({
          actionId: action.actionId,
          description: action.description,
          owner: action.owner,
          approvalLabel: action.requiredApproval ? "需要审批" : "可直接推进",
          expectedMetric: `${action.expectedMetric} ${action.expectedDirection}`,
        })) ?? [],
      pendingQuestions: input.project.decisionObject?.pendingQuestions ?? [],
    },
    evidence: {
      fact:
        input.project.decisionContext?.evidencePack.factEvidence.map((ref) => ({
          id: ref.id,
          summary: ref.summary,
          sourceLabel: ref.sourceLabel,
          confidenceLabel: ref.confidence ? getConfidenceLabel(ref.confidence) : undefined,
          updatedAtLabel: ref.updatedAtLabel,
        })) ?? [],
      method:
        input.project.decisionContext?.evidencePack.methodEvidence.map((ref) => ({
          id: ref.id,
          summary: ref.summary,
          sourceLabel: ref.sourceLabel,
          confidenceLabel: ref.confidence ? getConfidenceLabel(ref.confidence) : undefined,
          applicabilityLabel: ref.applicability
            ? `${ref.applicability.stage[0]} · ${ref.applicability.businessGoal ?? "通用经营"}`
            : undefined,
        })) ?? [],
      missingFlags: input.project.decisionContext?.evidencePack.missingEvidenceFlags ?? [],
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
      actionVersion: action.actionVersion,
      idempotencyKey: action.idempotencyKey,
      writebackStatusLabel: getWritebackStatusLabel(action.writebackStatus),
      lastWritebackError: action.lastWritebackError,
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
    audit: {
      entries:
        input.auditTrail?.entries.map((entry) => ({
          id: entry.id,
          summary: entry.summary,
          actorLabel:
            entry.actorType === "human"
              ? "人工"
              : entry.actorType === "agent"
                ? "场景 Agent"
                : entry.actorType === "automation"
                  ? "执行端"
                  : "系统",
          time: entry.updatedAt.slice(11, 16),
        })) ?? [],
      latestWriteback: input.writebackRecord
        ? `${getWritebackStatusLabel(input.writebackRecord.resultStatus)} · ${input.writebackRecord.targetSystem}`
        : "暂无写回记录",
    },
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
      applicabilityLabel: formatApplicability(asset),
    })),
    review: input.review.review
      ? {
          verdictLabel: getReviewVerdictLabel(input.review.review.verdict),
          resultSummary: input.review.review.resultSummary,
          lessonsLearned: input.review.review.lessonsLearned,
          recommendations: input.review.review.recommendations,
          candidateCount: input.review.candidates.filter((candidate) => candidate.approvalStatus === "pending").length,
          publishedCount: input.review.publishedAssets.length,
          lineageLabel: input.review.lineage
            ? `决策 ${input.review.lineage.sourceDecisionIds.length} · 动作 ${input.review.lineage.sourceActionIds.length} · 日志 ${input.review.lineage.sourceExecutionLogIds.length}`
            : "lineage 待补齐",
        }
      : null,
  };
}
