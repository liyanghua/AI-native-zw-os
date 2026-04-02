import {
  normalizeActionId,
  normalizeAssetId,
  normalizeCandidateId,
  normalizeEntityId,
  normalizeProjectId,
  normalizeReviewId,
  type PilotRawState,
} from "./pilotSources";
import type {
  ActionItem,
  AgentState,
  ApprovalRecord,
  AssetCandidate,
  DecisionObject,
  EvidenceRef,
  ExceptionItem,
  ExecutionLog,
  KnowledgeAssetDocument,
  LiveSignalFeedItem,
  PilotSnapshot,
  ProjectObject,
  ProjectRealtimeSnapshot,
  ProjectReviewRecord,
  PulseItem,
  ReviewSummary,
} from "../domain/types/model";

function createMeta(id: string, createdAt: string, updatedAt: string, createdBy = "pilot.runtime") {
  return {
    id,
    createdAt,
    updatedAt,
    createdBy,
    updatedBy: createdBy,
  };
}

function sortByUpdatedAtDesc<T extends { updatedAt?: string; createdAt?: string }>(items: T[]) {
  return [...items].sort((left, right) =>
    (right.updatedAt ?? right.createdAt ?? "").localeCompare(left.updatedAt ?? left.createdAt ?? ""),
  );
}

function buildEvidenceRefs(projectKey: string, projectId: string, snapshot: ProjectRealtimeSnapshot | undefined, knowledgeAssets: KnowledgeAssetDocument[]): EvidenceRef[] {
  const metrics = snapshot?.kpis.metrics.slice(0, 2).map((metric) => ({
    id: normalizeEntityId("evidence", `${projectKey}-${metric.key}`),
    type: "metric" as const,
    summary: `${metric.label} 当前值 ${metric.value}${metric.unit === "%" ? "%" : ""}`,
    sourceLabel: "实时经营指标",
    confidence: "high" as const,
  })) ?? [];

  const knowledge = knowledgeAssets.slice(0, 2).map((asset) => ({
    id: normalizeEntityId("evidence", `${projectId}-${asset.id}`),
    type: asset.type === "case" ? "case" : "rule",
    summary: asset.summary,
    sourceLabel: asset.title,
    confidence: "medium" as const,
  }));

  return [...metrics, ...knowledge];
}

export function buildPilotSnapshot(rawState: PilotRawState): PilotSnapshot {
  const performanceByProject = new Map(rawState.performance.map((item) => [item.projectKey, item]));
  const definitionsByProject = new Map(rawState.definitions.map((item) => [item.projectKey, item]));
  const signalsByProject = new Map<string, typeof rawState.opportunitySignals>([]);
  rawState.opportunitySignals.forEach((signal) => {
    const existing = signalsByProject.get(signal.projectKey) ?? [];
    existing.push(signal);
    signalsByProject.set(signal.projectKey, existing);
  });
  const actionsByProject = new Map<string, typeof rawState.actions>([]);
  rawState.actions.forEach((action) => {
    const existing = actionsByProject.get(action.projectKey) ?? [];
    existing.push(action);
    actionsByProject.set(action.projectKey, existing);
  });
  const reviewsByProject = new Map(rawState.reviews.map((review) => [review.projectKey, review]));

  const knowledgeAssets: KnowledgeAssetDocument[] = sortByUpdatedAtDesc(
    rawState.reviews.flatMap((review) =>
      review.knowledgeAssets.map((asset) => ({
        ...createMeta(
          normalizeAssetId(asset.assetKey),
          "2026-04-02T09:00:00+08:00",
          "2026-04-02T10:15:00+08:00",
        ),
        type: asset.type,
        title: asset.title,
        summary: asset.summary,
        sourceProjectId: asset.sourceProjectKey ? normalizeProjectId(asset.sourceProjectKey) : undefined,
        reuseCount: asset.reuseCount,
        status: asset.status,
        stage: asset.stage,
        assetType: asset.type,
        applicability: asset.applicability,
        sourceInfo: asset.sourceInfo,
      })),
    ),
  );

  const realtimeSnapshots: ProjectRealtimeSnapshot[] = rawState.performance.map((performance) => ({
    projectId: normalizeProjectId(performance.projectKey),
    health: performance.health,
    riskLevel: performance.riskLevel,
    keyBlocker: performance.keyBlocker,
    latestPulse: performance.latestPulse,
    pendingApprovalCount: performance.pendingApprovalCount,
    runningAgentCount: performance.runningAgentCount,
    criticalExceptionCount: performance.criticalExceptionCount,
    kpis: {
      metrics: performance.kpis,
      updatedAt: "2026-04-02T10:50:00+08:00",
    },
    updatedAt: "2026-04-02T10:50:00+08:00",
  }));
  const snapshotByProjectId = new Map(realtimeSnapshots.map((item) => [item.projectId, item]));

  const reviews: ProjectReviewRecord[] = rawState.reviews.map((reviewSeed) => {
    const projectId = normalizeProjectId(reviewSeed.projectKey);
    const review: ReviewSummary = {
      ...createMeta(normalizeReviewId(reviewSeed.projectKey), "2026-04-02T09:20:00+08:00", "2026-04-02T10:20:00+08:00"),
      projectId,
      verdict: reviewSeed.verdict,
      resultSummary: reviewSeed.resultSummary,
      attributionSummary: reviewSeed.attributionSummary,
      attributionFactors: reviewSeed.attributionFactors.map((factor, index) => ({
        id: normalizeEntityId("attr", `${reviewSeed.projectKey}-${index}`),
        ...factor,
      })),
      lessonsLearned: reviewSeed.lessonsLearned,
      recommendations: reviewSeed.recommendations,
    };

    const candidates: AssetCandidate[] = reviewSeed.assetCandidates.map((candidate) => ({
      ...createMeta(
        normalizeCandidateId(candidate.candidateKey),
        "2026-04-02T09:30:00+08:00",
        "2026-04-02T10:10:00+08:00",
      ),
      projectId,
      type: candidate.type,
      title: candidate.title,
      rationale: candidate.rationale,
      approvalStatus: candidate.approvalStatus,
      applicability: candidate.applicability,
    }));

    return {
      projectId,
      review,
      candidates,
      publishedAssets: knowledgeAssets.filter((asset) => asset.sourceProjectId === projectId),
    };
  });
  const reviewByProjectId = new Map(reviews.map((review) => [review.projectId, review]));

  const exceptions: ExceptionItem[] = sortByUpdatedAtDesc(
    rawState.performance.flatMap((performance) =>
      performance.exceptions.map((exception, index) => ({
        ...createMeta(
          normalizeEntityId("exception", `${performance.projectKey}-${index}`),
          "2026-04-02T09:45:00+08:00",
          "2026-04-02T10:40:00+08:00",
        ),
        projectId: normalizeProjectId(performance.projectKey),
        source: exception.source,
        severity: exception.severity,
        summary: exception.summary,
        requiresHumanIntervention: exception.requiresHumanIntervention,
      })),
    ),
  );

  const executionLogs: ExecutionLog[] = sortByUpdatedAtDesc(
    rawState.actions.flatMap((action) =>
      action.executionEvents.map((event, index) => ({
        ...createMeta(
          normalizeEntityId("log", `${action.actionKey}-${index}`),
          event.at,
          event.at,
          event.actorId,
        ),
        actionId: normalizeActionId(action.actionKey),
        actorType: event.actorType,
        actorId: event.actorId,
        status: event.status,
        summary: event.summary,
      })),
    ),
  );

  const actionItems: ActionItem[] = rawState.actions.map((action) => ({
    ...createMeta(
      normalizeActionId(action.actionKey),
      action.executionEvents[0]?.at ?? "2026-04-02T09:00:00+08:00",
      action.executionEvents.at(-1)?.at ?? "2026-04-02T10:30:00+08:00",
      action.triggeredBy,
    ),
    sourceProjectId: normalizeProjectId(action.projectKey),
    sourceStage: action.sourceStage,
    goal: action.goal,
    title: action.title,
    summary: action.summary,
    expectedImpact: action.expectedImpact,
    risk: action.risk,
    owner: action.owner,
    approvalStatus: action.approvalStatus,
    executionMode: action.executionMode,
    executionStatus: action.executionStatus,
    validationWindow: action.validationWindow,
    rollbackCondition: action.rollbackCondition,
    requiresHumanApproval: action.requiresHumanApproval,
    triggeredBy: action.triggeredBy,
  }));

  const approvals: ApprovalRecord[] = rawState.actions
    .filter((action) => action.requiresHumanApproval)
    .map((action) => ({
      ...createMeta(
        normalizeEntityId("approval", action.actionKey),
        action.executionEvents[0]?.at ?? "2026-04-02T09:00:00+08:00",
        action.executionEvents.at(-1)?.at ?? "2026-04-02T10:30:00+08:00",
      ),
      actionId: normalizeActionId(action.actionKey),
      approver: action.approver ?? action.owner,
      status: action.approvalStatus,
      reason: action.approvalReason,
    }));

  const projects: ProjectObject[] = rawState.projects.map((projectSeed) => {
    const projectId = normalizeProjectId(projectSeed.projectKey);
    const projectActions = actionItems.filter((action) => action.sourceProjectId === projectId);
    const projectExecutionLogs = executionLogs.filter((log) =>
      projectActions.some((action) => action.id === log.actionId),
    );
    const projectApprovals = approvals.filter((approval) =>
      projectActions.some((action) => action.id === approval.actionId),
    );
    const performance = performanceByProject.get(projectSeed.projectKey);
    const signals = signalsByProject.get(projectSeed.projectKey) ?? [];
    const definitionSeed = definitionsByProject.get(projectSeed.projectKey);
    const relatedKnowledge = knowledgeAssets.filter(
      (asset) =>
        asset.stage === projectSeed.stage || asset.sourceProjectId === projectId,
    );
    const realtime = snapshotByProjectId.get(projectId);

    const decisionObject: DecisionObject = {
      ...createMeta(
        normalizeEntityId("decision", projectSeed.projectKey),
        "2026-04-02T09:10:00+08:00",
        "2026-04-02T10:30:00+08:00",
        "decision.brain",
      ),
      projectId,
      stage: projectSeed.stage,
      problemOrOpportunity: projectSeed.decisionSeed.problemOrOpportunity,
      rationale: projectSeed.decisionSeed.rationale,
      rootCauseSummary: projectSeed.decisionSeed.rootCauseSummary,
      options: projectSeed.decisionSeed.options,
      recommendedOptionId: projectSeed.decisionSeed.recommendedOptionId,
      confidence: projectSeed.decisionSeed.confidence,
      requiresHumanApproval: projectSeed.decisionSeed.requiresHumanApproval,
      evidencePack: {
        refs: buildEvidenceRefs(projectSeed.projectKey, projectId, realtime, relatedKnowledge),
        summary: `${projectSeed.name} 的决策证据已经汇总，可直接进入拍板。`,
      },
      pendingQuestions: projectSeed.decisionSeed.pendingQuestions,
    };

    const definition = definitionSeed
      ? {
          ...createMeta(
            normalizeEntityId("definition", projectSeed.projectKey),
            "2026-04-02T09:00:00+08:00",
            "2026-04-02T10:15:00+08:00",
          ),
          projectId,
          ...definitionSeed.definition,
        }
      : undefined;

    const samplingReview = definitionSeed?.samplingReview
      ? {
          ...createMeta(
            normalizeEntityId("sampling", projectSeed.projectKey),
            "2026-04-02T09:30:00+08:00",
            "2026-04-02T10:00:00+08:00",
          ),
          projectId,
          ...definitionSeed.samplingReview,
        }
      : undefined;

    const expression = definitionSeed?.expression
      ? {
          ...createMeta(
            normalizeEntityId("expression", projectSeed.projectKey),
            "2026-04-02T09:00:00+08:00",
            "2026-04-02T10:10:00+08:00",
          ),
          projectId,
          contentBrief: definitionSeed.expression.contentBrief,
          visualBrief: definitionSeed.expression.visualBrief,
          readinessStatus: definitionSeed.expression.readinessStatus,
          recommendedDirection: definitionSeed.expression.recommendedDirection,
          creativeVersions: definitionSeed.expression.creativeVersions.map((version, index) => ({
            ...createMeta(
              normalizeEntityId("creative", `${projectSeed.projectKey}-${index}`),
              "2026-04-02T09:05:00+08:00",
              "2026-04-02T10:05:00+08:00",
            ),
            projectId,
            ...version,
          })),
        }
      : undefined;

    const reviewRecord = reviewByProjectId.get(projectId);

    return {
      ...createMeta(projectId, "2026-04-02T09:00:00+08:00", "2026-04-02T10:40:00+08:00"),
      type: projectSeed.type,
      name: projectSeed.name,
      stage: projectSeed.stage,
      owner: projectSeed.owner,
      stakeholders: projectSeed.stakeholders,
      priority: projectSeed.priority,
      health: performance?.health ?? projectSeed.health,
      riskLevel: performance?.riskLevel ?? projectSeed.riskLevel,
      targetSummary: projectSeed.targetSummary,
      statusSummary: projectSeed.statusSummary,
      latestPulse: performance?.latestPulse ?? projectSeed.latestPulse,
      keyBlocker: performance?.keyBlocker ?? projectSeed.keyBlocker,
      kpis: realtime?.kpis ?? { metrics: [], updatedAt: "2026-04-02T10:50:00+08:00" },
      opportunitySignals: signals.map((signal) => ({
        id: normalizeEntityId("signal", signal.signalKey),
        type: signal.type,
        summary: signal.summary,
        strength: signal.strength,
        freshness: signal.freshness,
      })),
      opportunityAssessment: signals[0]?.assessment,
      decisionObject,
      definition,
      samplingReview,
      expression,
      actions: projectActions,
      approvals: projectApprovals,
      executionLogs: projectExecutionLogs,
      agentStates: (performance?.agentStates ?? []).map((agent, index): AgentState => ({
        ...createMeta(
          normalizeEntityId("agent", `${projectSeed.projectKey}-${index}`),
          "2026-04-02T09:00:00+08:00",
          "2026-04-02T10:35:00+08:00",
        ),
        projectId,
        agentType: agent.agentType,
        status: agent.status,
        summary: agent.summary,
        waitingReason: agent.waitingReason,
        lastActionSummary: agent.lastActionSummary,
      })),
      review: reviewRecord?.review ?? undefined,
      assetCandidates: reviewRecord?.candidates,
      publishedAssets: reviewRecord?.publishedAssets,
    };
  });

  const projectById = new Map(projects.map((project) => [project.id, project]));
  const pulses: PulseItem[] = sortByUpdatedAtDesc(
    rawState.projects.flatMap((projectSeed, projectIndex) =>
      projectSeed.roleAudiences.map((audience, audienceIndex) => ({
        ...createMeta(
          normalizeEntityId("pulse", `${projectSeed.projectKey}-${audience}-${audienceIndex}`),
          "2026-04-02T09:20:00+08:00",
          "2026-04-02T10:50:00+08:00",
        ),
        audience,
        category:
          projectSeed.stage === "opportunity_pool"
            ? "opportunity"
            : projectSeed.stage === "review_capture"
              ? "review"
              : projectSeed.riskLevel === "high"
                ? "risk"
                : "resource",
        summary:
          projectIndex === 0 && audience === "ceo"
            ? `今日最值得拍板的是「${projectSeed.name}」的推进方式。`
            : `${projectSeed.name}：${projectSeed.latestPulse}`,
        severity: projectSeed.riskLevel,
        relatedProjectId: normalizeProjectId(projectSeed.projectKey),
        freshness: "near_real_time",
      })),
    ),
  );

  const liveFeed: LiveSignalFeedItem[] = sortByUpdatedAtDesc([
    ...executionLogs.map((log, index) => ({
      ...createMeta(
        normalizeEntityId("live", `execution-${index}`),
        log.createdAt,
        log.updatedAt,
      ),
      projectId:
        actionItems.find((action) => action.id === log.actionId)?.sourceProjectId,
      type: "execution_update" as const,
      summary: log.summary,
    })),
    ...realtimeSnapshots.map((snapshot, index) => ({
      ...createMeta(
        normalizeEntityId("live", `snapshot-${index}`),
        snapshot.updatedAt,
        snapshot.updatedAt,
      ),
      projectId: snapshot.projectId,
      type: "metric_update" as const,
      summary: snapshot.latestPulse ?? `${projectById.get(snapshot.projectId)?.name ?? "项目"} 状态更新`,
    })),
  ]).slice(0, 14);

  return {
    projects,
    realtimeSnapshots,
    pulses,
    exceptions,
    liveFeed,
    knowledgeAssets,
    reviews,
  };
}
