import type {
  ActionListFilters,
  ExecutionLogFilters,
  ExecutionWritebackInput,
  PilotRuntime,
  ResolveProjectIdentityInput,
  SearchAssetFilters,
} from "../domain/types/gateways";
import type {
  ActionAuditEntry,
  ActionAuditTrail,
  ActionItem,
  DecisionContext,
  DecisionObject,
  ExecutionWritebackRecord,
  PilotSnapshot,
  ProjectIdentity,
  ProjectObject,
  ProjectRealtimeSnapshot,
  ProjectStatus,
} from "../domain/types/model";
import {
  assertActionAuditTrail,
  assertActionItem,
  assertDecisionContext,
  assertDecisionObject,
  assertExecutionLog,
  assertExecutionWritebackRecord,
  assertIdentityResolutionLog,
  assertKnowledgeAssetDocument,
  assertPilotSnapshot,
  assertProjectIdentity,
  assertProjectObject,
  assertProjectRealtimeSnapshot,
  assertProjectReviewRecord,
} from "../domain/runtime/validators";
import {
  buildPilotSnapshot,
  createPilotGovernanceState,
  type PilotGovernanceState,
} from "./pilotAdapter";
import {
  createSeedSources,
  normalizeActionId,
  normalizeAssetId,
  normalizeCandidateId,
  normalizeEntityId,
  normalizeProjectId,
  normalizeReviewId,
  type PilotRawState,
} from "./pilotSources";
import type { IdentityResolutionLog } from "../domain/types/model";

function ensureProject(snapshot: PilotSnapshot, projectId: string): ProjectObject {
  const project = snapshot.projects.find((item) => item.id === projectId);
  if (!project) {
    throw new Error(`Unknown projectId: ${projectId}`);
  }
  assertProjectObject(project);
  return project;
}

function ensureSnapshot(snapshot: PilotSnapshot, projectId: string): ProjectRealtimeSnapshot {
  const result = snapshot.realtimeSnapshots.find((item) => item.projectId === projectId);
  if (!result) {
    throw new Error(`Unknown realtime snapshot for projectId: ${projectId}`);
  }
  assertProjectRealtimeSnapshot(result);
  return result;
}

function currentTimestamp(rawState: PilotRawState) {
  const baseMinute = 10 + rawState.tick;
  return `2026-04-02T11:${String(baseMinute).padStart(2, "0")}:00+08:00`;
}

function payloadHash(input: ExecutionWritebackInput) {
  return normalizeEntityId(
    "hash",
    `${input.idempotencyKey ?? "no-key"}-${input.targetSystem ?? "unknown"}-${input.targetObjectId ?? "unknown"}-${input.status}`,
  );
}

function rebuild(rawState: PilotRawState, governanceState: PilotGovernanceState) {
  const snapshot = buildPilotSnapshot(rawState, governanceState);
  assertPilotSnapshot(snapshot);
  return snapshot;
}

function findRawAction(rawState: PilotRawState, actionId: string) {
  const rawAction = rawState.actions.find((action) => normalizeActionId(action.actionKey) === actionId);
  if (!rawAction) {
    throw new Error(`Unknown actionId: ${actionId}`);
  }
  return rawAction;
}

function appendAuditEntry(
  governanceState: PilotGovernanceState,
  actionId: string,
  entry: Omit<ActionAuditEntry, "id" | "createdAt" | "updatedAt"> & { at: string },
) {
  let trail = governanceState.actionAuditTrails.find((item) => item.actionId === actionId);
  if (!trail) {
    trail = { actionId, entries: [] };
    governanceState.actionAuditTrails.push(trail);
  }
  trail.entries.push({
    id: normalizeEntityId("audit", `${actionId}-${trail.entries.length}`),
    createdAt: entry.at,
    updatedAt: entry.at,
    createdBy: entry.actorId,
    updatedBy: entry.actorId,
    actionId,
    eventType: entry.eventType,
    actorType: entry.actorType,
    actorId: entry.actorId,
    summary: entry.summary,
  });
}

function recordEvent(rawState: PilotRawState, actionId: string, event: PilotRawState["actions"][number]["executionEvents"][number]) {
  const action = findRawAction(rawState, actionId);
  action.executionEvents.push(event);
  action.executionStatus = event.status;
}

function updatePerformancePulse(
  rawState: PilotRawState,
  projectKey: string,
  updater: (performance: PilotRawState["performance"][number]) => void,
) {
  const performance = rawState.performance.find((item) => item.projectKey === projectKey);
  if (performance) {
    updater(performance);
  }
}

function ensureReviewSeed(rawState: PilotRawState, projectKey: string) {
  let review = rawState.reviews.find((item) => item.projectKey === projectKey);
  if (!review) {
    review = {
      projectKey,
      verdict: "observe_more",
      resultSummary: "项目仍在执行中，等待更多结果后再复盘。",
      attributionSummary: "当前以动作执行反馈为主。",
      attributionFactors: [],
      lessonsLearned: [],
      recommendations: [],
      assetCandidates: [],
      knowledgeAssets: [],
    };
    rawState.reviews.push(review);
  }
  return review;
}

function ensureReviewLineage(governanceState: PilotGovernanceState, projectId: string) {
  let lineage = governanceState.reviewLineages.find((item) => item.projectId === projectId);
  if (!lineage) {
    const reviewId = normalizeReviewId(projectId.replace(/^pilot-/, "").replace(/-/g, "_").toUpperCase());
    lineage = {
      reviewId,
      projectId,
      sourceDecisionIds: [],
      sourceActionIds: [],
      sourceExecutionLogIds: [],
      generatedAt: "2026-04-02T10:20:00+08:00",
    };
    governanceState.reviewLineages.push(lineage);
  }
  return lineage;
}

function syncReviewLineageForProject(
  rawState: PilotRawState,
  governanceState: PilotGovernanceState,
  projectKey: string,
) {
  const projectId = normalizeProjectId(projectKey);
  const lineage = ensureReviewLineage(governanceState, projectId);
  const actionSeeds = rawState.actions.filter((action) => action.projectKey === projectKey);
  lineage.sourceDecisionIds = Array.from(
    new Set([...lineage.sourceDecisionIds, normalizeEntityId("decision", projectKey)]),
  );
  lineage.sourceActionIds = Array.from(
    new Set([...lineage.sourceActionIds, ...actionSeeds.map((action) => normalizeActionId(action.actionKey))]),
  );
  lineage.sourceExecutionLogIds = Array.from(
    new Set([
      ...lineage.sourceExecutionLogIds,
      ...actionSeeds.flatMap((action) =>
        action.executionEvents.map((_, index) => normalizeEntityId("log", `${action.actionKey}-${index}`)),
      ),
    ]),
  );
  lineage.generatedAt = currentTimestamp(rawState);
}

function mutateDecision(rawState: PilotRawState, projectKey: string) {
  const project = rawState.projects.find((item) => item.projectKey === projectKey);
  const performance = rawState.performance.find((item) => item.projectKey === projectKey);
  const review = rawState.reviews.find((item) => item.projectKey === projectKey);
  if (!project || !performance) {
    throw new Error(`Cannot compile decision for unknown project: ${projectKey}`);
  }

  const gmvMetric = performance.kpis.find((metric) => metric.key === "gmv");
  const cvrMetric = performance.kpis.find((metric) => metric.key === "cvr");
  const relatedKnowledge = review?.knowledgeAssets.slice(0, 2) ?? [];

  if (
    project.stage === "launch_validation" &&
    cvrMetric &&
    cvrMetric.deltaVsTarget !== undefined &&
    cvrMetric.deltaVsTarget < 0
  ) {
    project.decisionSeed.recommendedOptionId = "launch-price-adjustment";
    project.decisionSeed.confidence = "high";
    project.decisionSeed.rationale = `当前 GMV ${gmvMetric?.value ?? 0}、CVR ${cvrMetric.value}% 明显低于目标；结合 ${relatedKnowledge.map((asset) => asset.title).join("、")}，优先验证价格带最合理。`;
    project.latestPulse = "经营大脑重新编译了决策对象，建议优先调价验证。";
    performance.latestPulse = project.latestPulse;
  } else if (project.stage === "growth_optimization") {
    project.decisionSeed.recommendedOptionId = "growth-scale";
    project.decisionSeed.confidence = "high";
    project.latestPulse = "经营大脑确认增长作战以“放量 + 补单”组合更稳妥。";
    performance.latestPulse = project.latestPulse;
  }
}

function latestWritebackRecord(governanceState: PilotGovernanceState, actionId: string) {
  return governanceState.executionWritebackRecords.find((record) => record.actionId === actionId) ?? null;
}

export function createPilotRuntime(): PilotRuntime {
  let rawState = createSeedSources();
  let governanceState = createPilotGovernanceState(rawState);
  let snapshot = rebuild(rawState, governanceState);

  const projectGateway: PilotRuntime["projectGateway"] = {
    listProjectsByStage(stage) {
      const projects = snapshot.projects
        .filter((project) => project.stage === stage)
        .sort((left, right) => right.priority - left.priority);
      projects.forEach(assertProjectObject);
      return projects;
    },
    getProject(projectId) {
      return ensureProject(snapshot, projectId);
    },
    getProjectRealtimeSnapshot(projectId) {
      return ensureSnapshot(snapshot, projectId);
    },
    listPulseItems(audience, relatedProjectId) {
      const pulses = snapshot.pulses.filter(
        (pulse) => pulse.audience === audience && (!relatedProjectId || pulse.relatedProjectId === relatedProjectId),
      );
      pulses.forEach((pulse) =>
        assertProjectObject(ensureProject(snapshot, pulse.relatedProjectId ?? snapshot.projects[0].id)),
      );
      return pulses;
    },
    transitionProjectStage(projectId, nextStage, reason) {
      const project = ensureProject(snapshot, projectId);
      const rule = snapshot.transitionRules.find(
        (item) => item.fromStage === project.stage && item.toStage === nextStage,
      );
      if (!rule) {
        throw new Error(`No transition rule from ${project.stage} to ${nextStage}`);
      }
      const blockingCriteria = project.stageExitCriteria.filter(
        (criterion) => criterion.blocking && criterion.status !== "passed",
      );
      if (blockingCriteria.length > 0) {
        throw new Error(`Blocked by exit criteria: ${blockingCriteria[0].label}`);
      }

      const rawProject = rawState.projects.find((item) => normalizeProjectId(item.projectKey) === projectId);
      if (!rawProject) {
        throw new Error(`Unknown projectId: ${projectId}`);
      }
      rawProject.stage = nextStage;
      rawProject.latestPulse = `阶段已推进至 ${nextStage}：${reason}`;
      rawProject.statusSummary = reason;
      governanceState.statusOverrides[projectId] = nextStage === "review_capture" ? "reviewing" : "active";
      snapshot = rebuild(rawState, governanceState);
      return ensureProject(snapshot, projectId);
    },
  };

  const identityGateway: PilotRuntime["identityGateway"] = {
    resolveProjectIdentity(input: ResolveProjectIdentityInput) {
      const identity = snapshot.identities.find((item) =>
        item.sourceRefs.some(
          (ref) =>
            ref.sourceSystem === input.sourceSystem &&
            ref.sourceObjectType === input.sourceObjectType &&
            ref.sourceObjectId === input.sourceObjectId &&
            (!input.externalKey || ref.externalKey === input.externalKey),
        ),
      );
      if (!identity) {
        throw new Error(`Unable to resolve project identity for ${input.sourceSystem}:${input.sourceObjectId}`);
      }
      assertProjectIdentity(identity);
      return identity;
    },
    getProjectIdentity(projectId) {
      const identity = snapshot.identities.find((item) => item.projectId === projectId);
      if (!identity) {
        throw new Error(`Unknown project identity for projectId: ${projectId}`);
      }
      assertProjectIdentity(identity);
      return identity;
    },
    listSourceObjectRefs(projectId) {
      return this.getProjectIdentity(projectId).sourceRefs;
    },
    listIdentityResolutionLogs(projectId) {
      const logs = snapshot.identityResolutionLogs.filter((item) => !projectId || item.projectId === projectId);
      logs.forEach(assertIdentityResolutionLog);
      return logs;
    },
  };

  const actionGateway: PilotRuntime["actionGateway"] = {
    listActions(filters: ActionListFilters = {}) {
      const actions = snapshot.projects
        .flatMap((project) => project.actions)
        .filter((action) => {
          if (filters.projectId && action.sourceProjectId !== filters.projectId) return false;
          if (filters.actionId && action.id !== filters.actionId) return false;
          if (filters.approvalStatus && action.approvalStatus !== filters.approvalStatus) return false;
          if (filters.executionStatus && action.executionStatus !== filters.executionStatus) return false;
          if (filters.writebackStatus && action.writebackStatus !== filters.writebackStatus) return false;
          return true;
        })
        .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
      actions.forEach(assertActionItem);
      return actions;
    },
    approveAction(actionId) {
      const rawAction = findRawAction(rawState, actionId);
      rawAction.approvalStatus = "approved";
      rawAction.approver = "张伟";
      rawAction.approvalReason = "同意进入验证动作";
      rawAction.executionStatus = "queued";
      recordEvent(rawState, actionId, {
        actorType: "human",
        actorId: "ceo-zhang",
        status: "queued",
        summary: "老板已批准动作，进入执行队列。",
        at: currentTimestamp(rawState),
      });
      appendAuditEntry(governanceState, actionId, {
        at: currentTimestamp(rawState),
        actionId,
        eventType: "approved",
        actorType: "human",
        actorId: "ceo-zhang",
        summary: "老板已批准动作，进入执行队列。",
      });
      updatePerformancePulse(rawState, rawAction.projectKey, (performance) => {
        performance.pendingApprovalCount = Math.max(0, performance.pendingApprovalCount - 1);
        performance.latestPulse = `${rawAction.title} 已批准，执行队列已更新。`;
      });

      snapshot = rebuild(rawState, governanceState);
      const action = this.listActions({ actionId })[0];
      assertActionItem(action);
      return action;
    },
    rejectAction(actionId, reason = "当前不适合执行该动作") {
      const rawAction = findRawAction(rawState, actionId);
      rawAction.approvalStatus = "rejected";
      rawAction.approver = "张伟";
      rawAction.approvalReason = reason;
      rawAction.executionStatus = "canceled";
      recordEvent(rawState, actionId, {
        actorType: "human",
        actorId: "ceo-zhang",
        status: "canceled",
        summary: `动作被拒绝：${reason}`,
        at: currentTimestamp(rawState),
      });
      appendAuditEntry(governanceState, actionId, {
        at: currentTimestamp(rawState),
        actionId,
        eventType: "rejected",
        actorType: "human",
        actorId: "ceo-zhang",
        summary: `动作被拒绝：${reason}`,
      });
      updatePerformancePulse(rawState, rawAction.projectKey, (performance) => {
        performance.pendingApprovalCount = Math.max(0, performance.pendingApprovalCount - 1);
        performance.latestPulse = `${rawAction.title} 被拒绝，需要重新评估方案。`;
      });

      snapshot = rebuild(rawState, governanceState);
      const action = this.listActions({ actionId })[0];
      assertActionItem(action);
      return action;
    },
    writeExecutionResult(actionId, input: ExecutionWritebackInput) {
      const rawAction = findRawAction(rawState, actionId);
      const record = latestWritebackRecord(governanceState, actionId);
      const effectiveIdempotencyKey = input.idempotencyKey ?? normalizeEntityId("idem", rawAction.actionKey);

      if (record && record.idempotencyKey === effectiveIdempotencyKey) {
        record.attemptCount += 1;
        record.resultStatus = "duplicate_ignored";
        record.updatedAt = currentTimestamp(rawState);
        appendAuditEntry(governanceState, actionId, {
          at: currentTimestamp(rawState),
          actionId,
          eventType: "duplicate_writeback",
          actorType: input.actorType,
          actorId: input.actorId,
          summary: "检测到重复写回，同一 idempotencyKey 已被忽略。",
        });
        snapshot = rebuild(rawState, governanceState);
        const action = this.listActions({ actionId })[0];
        assertActionItem(action);
        return action;
      }

      const createdAt = currentTimestamp(rawState);
      appendAuditEntry(governanceState, actionId, {
        at: createdAt,
        actionId,
        eventType: "writeback_requested",
        actorType: input.actorType,
        actorId: input.actorId,
        summary: input.summary,
      });

      const writebackRecord: ExecutionWritebackRecord = {
        id: normalizeEntityId("writeback-meta", `${rawAction.actionKey}-${governanceState.executionWritebackRecords.length}`),
        writebackId: normalizeEntityId("writeback", `${rawAction.actionKey}-${governanceState.executionWritebackRecords.length}`),
        actionId,
        idempotencyKey: effectiveIdempotencyKey,
        targetSystem: input.targetSystem ?? "internal_adapter",
        targetObjectId: input.targetObjectId ?? rawAction.actionKey,
        payloadHash: payloadHash({ ...input, idempotencyKey: effectiveIdempotencyKey }),
        resultStatus: input.status === "failed" ? "failed" : "succeeded",
        errorMessage: input.errorMessage,
        attemptCount: 1,
        createdAt,
        updatedAt: createdAt,
        createdBy: input.actorId,
        updatedBy: input.actorId,
      };
      governanceState.executionWritebackRecords.push(writebackRecord);
      assertExecutionWritebackRecord(writebackRecord);

      recordEvent(rawState, actionId, {
        actorType: input.actorType,
        actorId: input.actorId,
        status: input.status,
        summary: input.summary,
        at: createdAt,
      });

      appendAuditEntry(governanceState, actionId, {
        at: createdAt,
        actionId,
        eventType: input.status === "failed" ? "writeback_failed" : "writeback_succeeded",
        actorType: input.actorType,
        actorId: input.actorId,
        summary: input.summary,
      });

      updatePerformancePulse(rawState, rawAction.projectKey, (performance) => {
        performance.latestPulse = input.summary;
        if (input.status === "completed") {
          performance.health = performance.health === "at_risk" ? "watch" : performance.health;
          performance.riskLevel = performance.riskLevel === "high" ? "medium" : performance.riskLevel;
          performance.criticalExceptionCount = 0;
          performance.kpis = performance.kpis.map((metric) => {
            if (rawAction.actionKey === "launch_price_adjustment" && metric.key === "cvr") {
              return { ...metric, value: 1.8, deltaVsTarget: -0.7, deltaVsPrevious: 0.6, trend: "up" };
            }
            if (rawAction.actionKey === "launch_price_adjustment" && metric.key === "gmv") {
              return { ...metric, value: 356000, deltaVsTarget: -144000, deltaVsPrevious: 36000, trend: "up" };
            }
            if (rawAction.actionKey === "launch_visual_refresh" && metric.key === "ctr") {
              return { ...metric, value: 3.1, deltaVsTarget: 0.5, deltaVsPrevious: 0.3, trend: "up" };
            }
            return metric;
          });
        }
      });

      if (input.status === "completed" && rawAction.projectKey === "LAUNCH_SUMMER_REFRESH") {
        const review = ensureReviewSeed(rawState, "LAUNCH_SUMMER_REFRESH");
        const alreadyExists = review.assetCandidates.some(
          (candidate) => candidate.candidateKey === "launch-writeback-playbook",
        );
        if (!alreadyExists) {
          review.assetCandidates.push({
            candidateKey: "launch-writeback-playbook",
            type: "template",
            title: "首发调价回写模板",
            rationale: "把调价前后核心指标和审批理由标准化沉淀。",
            approvalStatus: "pending",
            applicability: {
              stage: ["launch_validation"],
              role: ["ceo", "growth_director"],
              assetType: ["template"],
              channel: "电商投放",
              category: "新品首发",
              businessGoal: "提升首发转化",
              priceBand: "249-399",
              lifecycle: "launch_loop",
              preconditions: ["已完成调价写回", "存在审批记录"],
              exclusionConditions: ["缺少执行日志"],
            },
          });
        }
        review.recommendations = Array.from(
          new Set([...review.recommendations, "把调价前后数据回写整理为模板，供下次首发快速复用。"]),
        );
        syncReviewLineageForProject(rawState, governanceState, "LAUNCH_SUMMER_REFRESH");
      }

      snapshot = rebuild(rawState, governanceState);
      const action = this.listActions({ actionId })[0];
      assertActionItem(action);
      return action;
    },
    listExecutionLogs(filters: ExecutionLogFilters = {}) {
      const logs = snapshot.projects
        .flatMap((project) => project.executionLogs ?? [])
        .filter((log) => {
          if (filters.actionId && log.actionId !== filters.actionId) return false;
          if (filters.projectId) {
            const project = snapshot.projects.find((item) => item.id === filters.projectId);
            return project?.actions.some((action) => action.id === log.actionId);
          }
          return true;
        })
        .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
      logs.forEach(assertExecutionLog);
      return logs;
    },
  };

  const knowledgeGateway: PilotRuntime["knowledgeGateway"] = {
    searchAssets(filters: SearchAssetFilters = {}) {
      const normalizedQuery = filters.query?.trim().toLowerCase();
      const assets = snapshot.knowledgeAssets
        .filter((asset) => {
          if (filters.stage && asset.stage !== filters.stage) return false;
          if (filters.assetType && asset.assetType !== filters.assetType) return false;
          if (filters.sourceProjectId && asset.sourceProjectId !== filters.sourceProjectId) return false;
          if (filters.role && !asset.applicability.role.includes(filters.role)) return false;
          if (filters.channel && asset.applicability.channel !== filters.channel) return false;
          if (filters.category && asset.applicability.category !== filters.category) return false;
          if (filters.businessGoal && asset.applicability.businessGoal !== filters.businessGoal) return false;
          if (
            normalizedQuery &&
            !`${asset.title} ${asset.summary} ${asset.sourceInfo}`.toLowerCase().includes(normalizedQuery)
          ) {
            return false;
          }
          return true;
        })
        .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
      assets.forEach(assertKnowledgeAssetDocument);
      return assets;
    },
    getAsset(assetId) {
      const asset = snapshot.knowledgeAssets.find((item) => item.id === assetId);
      if (!asset) {
        throw new Error(`Unknown assetId: ${assetId}`);
      }
      assertKnowledgeAssetDocument(asset);
      return asset;
    },
    listProjectReview(projectId) {
      const review = snapshot.reviews.find((item) => item.projectId === projectId);
      if (!review) {
        throw new Error(`Unknown review projectId: ${projectId}`);
      }
      assertProjectReviewRecord(review);
      return review;
    },
    publishAssetCandidate(candidateId) {
      for (const review of rawState.reviews) {
        const candidate = review.assetCandidates.find(
          (item) => normalizeCandidateId(item.candidateKey) === candidateId,
        );
        if (!candidate) continue;

        candidate.approvalStatus = "approved";
        const projectId = normalizeProjectId(review.projectKey);
        const publishedSeed = {
          assetKey: candidate.candidateKey,
          type: candidate.type,
          title: candidate.title,
          summary: candidate.rationale,
          stage:
            rawState.projects.find((project) => project.projectKey === review.projectKey)?.stage ?? "review_capture",
          sourceProjectKey: review.projectKey,
          reuseCount: 0,
          status: "published" as const,
          applicability: candidate.applicability,
          sourceInfo: `${rawState.projects.find((project) => project.projectKey === review.projectKey)?.name ?? review.projectKey} 复盘确认`,
        };
        const exists = review.knowledgeAssets.some((asset) => asset.assetKey === publishedSeed.assetKey);
        if (!exists) {
          review.knowledgeAssets.unshift(publishedSeed);
        }

        const lineage = {
          assetId: normalizeAssetId(candidate.candidateKey),
          sourceReviewId: normalizeReviewId(review.projectKey),
          sourceProjectId: projectId,
          publishStatus: "published" as const,
          publishedAt: currentTimestamp(rawState),
        };
        governanceState.assetLineages = governanceState.assetLineages.filter(
          (item) => item.assetId !== lineage.assetId,
        );
        governanceState.assetLineages.push(lineage);
        syncReviewLineageForProject(rawState, governanceState, review.projectKey);

        snapshot = rebuild(rawState, governanceState);
        const published = snapshot.knowledgeAssets.find((asset) => asset.id === normalizeAssetId(candidate.candidateKey));
        if (!published) {
          throw new Error(`Published asset missing for candidateId: ${candidateId}`);
        }
        assertKnowledgeAssetDocument(published);
        return published;
      }

      throw new Error(`Unknown candidateId: ${candidateId}`);
    },
  };

  const decisionGateway: PilotRuntime["decisionGateway"] = {
    compileDecisionContext(projectId) {
      const project = snapshot.projects.find((item) => item.id === projectId);
      if (!project) {
        throw new Error(`Unknown projectId: ${projectId}`);
      }
      const context = project.decisionContext;
      if (!context) {
        throw new Error(`Decision context missing for projectId: ${projectId}`);
      }
      assertDecisionContext(context);
      return context;
    },
    compileDecisionObject(projectId) {
      const project = snapshot.projects.find((item) => item.id === projectId);
      if (!project) {
        throw new Error(`Unknown projectId: ${projectId}`);
      }
      const projectKey = rawState.projects.find((item) => normalizeProjectId(item.projectKey) === projectId)?.projectKey;
      if (!projectKey) {
        throw new Error(`Unknown project mapping for projectId: ${projectId}`);
      }
      mutateDecision(rawState, projectKey);
      governanceState.decisionVersions[projectId] = (governanceState.decisionVersions[projectId] ?? 1) + 1;
      snapshot = rebuild(rawState, governanceState);
      const decision = ensureProject(snapshot, projectId).decisionObject;
      if (!decision) {
        throw new Error(`Decision object missing for projectId: ${projectId}`);
      }
      assertDecisionObject(decision);
      return decision;
    },
    getDecisionObject(projectId) {
      const decision = ensureProject(snapshot, projectId).decisionObject;
      if (!decision) {
        throw new Error(`Decision object missing for projectId: ${projectId}`);
      }
      assertDecisionObject(decision);
      return decision;
    },
  };

  const lineageGateway: PilotRuntime["lineageGateway"] = {
    getActionAuditTrail(actionId) {
      const trail = snapshot.actionAuditTrails.find((item) => item.actionId === actionId);
      if (!trail) {
        throw new Error(`Unknown action audit trail for actionId: ${actionId}`);
      }
      assertActionAuditTrail(trail);
      return trail;
    },
    getExecutionWritebackRecord(actionId) {
      const record = snapshot.executionWritebackRecords.find((item) => item.actionId === actionId) ?? null;
      if (record) {
        assertExecutionWritebackRecord(record);
      }
      return record;
    },
    getReviewLineage(reviewId) {
      return snapshot.reviews.find((item) => item.review?.id === reviewId)?.lineage ?? null;
    },
    getAssetLineage(assetId) {
      return snapshot.assetLineages.find((item) => item.assetId === assetId) ?? null;
    },
  };

  const policyGateway: PilotRuntime["policyGateway"] = {
    listHumanInTheLoopPolicies() {
      return snapshot.hitlPolicies;
    },
  };

  return {
    projectGateway,
    identityGateway,
    actionGateway,
    knowledgeGateway,
    decisionGateway,
    lineageGateway,
    policyGateway,
    getSnapshot() {
      return snapshot;
    },
    refreshLiveData() {
      rawState.tick += 1;
      updatePerformancePulse(rawState, "LAUNCH_SUMMER_REFRESH", (performance) => {
        performance.latestPulse =
          rawState.tick % 2 === 1 ? "系统轮询到新一轮首发反馈，等待动作结果。" : performance.latestPulse;
      });
      snapshot = rebuild(rawState, governanceState);
      return snapshot;
    },
  };
}
