import type { PilotRuntime, ExecutionWritebackInput, SearchAssetFilters, ActionListFilters, ExecutionLogFilters } from "../domain/types/gateways";
import type {
  ActionItem,
  DecisionObject,
  PilotSnapshot,
  ProjectObject,
  ProjectRealtimeSnapshot,
} from "../domain/types/model";
import { assertActionItem, assertDecisionObject, assertExecutionLog, assertKnowledgeAssetDocument, assertPilotSnapshot, assertProjectObject, assertProjectRealtimeSnapshot, assertProjectReviewRecord } from "../domain/runtime/validators";
import { createSeedSources, normalizeActionId, normalizeAssetId, normalizeCandidateId, normalizeEntityId, normalizeProjectId, type PilotRawState } from "./pilotSources";
import { buildPilotSnapshot } from "./pilotAdapter";

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

function rebuild(rawState: PilotRawState) {
  const snapshot = buildPilotSnapshot(rawState);
  assertPilotSnapshot(snapshot);
  return snapshot;
}

function updatePerformancePulse(rawState: PilotRawState, projectKey: string, updater: (performance: PilotRawState["performance"][number]) => void) {
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

function recordEvent(rawState: PilotRawState, actionKey: string, event: PilotRawState["actions"][number]["executionEvents"][number]) {
  const action = rawState.actions.find((item) => item.actionKey === actionKey);
  if (!action) {
    throw new Error(`Unknown actionKey: ${actionKey}`);
  }
  action.executionEvents.push(event);
  action.executionStatus = event.status;
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

  if (project.stage === "launch_validation" && cvrMetric && cvrMetric.deltaVsTarget !== undefined && cvrMetric.deltaVsTarget < 0) {
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

export function createPilotRuntime(): PilotRuntime {
  let rawState = createSeedSources();
  let snapshot = rebuild(rawState);

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
      pulses.forEach((pulse) => assertProjectObject(ensureProject(snapshot, pulse.relatedProjectId ?? snapshot.projects[0].id)));
      return pulses;
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
          return true;
        })
        .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
      actions.forEach(assertActionItem);
      return actions;
    },
    approveAction(actionId) {
      const rawAction = rawState.actions.find((action) => normalizeActionId(action.actionKey) === actionId);
      if (!rawAction) {
        throw new Error(`Unknown actionId: ${actionId}`);
      }

      rawAction.approvalStatus = "approved";
      rawAction.approver = "张伟";
      rawAction.approvalReason = "同意进入验证动作";
      rawAction.executionStatus = "queued";
      recordEvent(rawState, rawAction.actionKey, {
        actorType: "human",
        actorId: "ceo-zhang",
        status: "queued",
        summary: "老板已批准动作，进入执行队列。",
        at: currentTimestamp(rawState),
      });
      updatePerformancePulse(rawState, rawAction.projectKey, (performance) => {
        performance.pendingApprovalCount = Math.max(0, performance.pendingApprovalCount - 1);
        performance.latestPulse = `${rawAction.title} 已批准，执行队列已更新。`;
      });

      snapshot = rebuild(rawState);
      const action = this.listActions({ actionId })[0];
      assertActionItem(action);
      return action;
    },
    rejectAction(actionId, reason = "当前不适合执行该动作") {
      const rawAction = rawState.actions.find((action) => normalizeActionId(action.actionKey) === actionId);
      if (!rawAction) {
        throw new Error(`Unknown actionId: ${actionId}`);
      }

      rawAction.approvalStatus = "rejected";
      rawAction.approver = "张伟";
      rawAction.approvalReason = reason;
      rawAction.executionStatus = "canceled";
      recordEvent(rawState, rawAction.actionKey, {
        actorType: "human",
        actorId: "ceo-zhang",
        status: "canceled",
        summary: `动作被拒绝：${reason}`,
        at: currentTimestamp(rawState),
      });
      updatePerformancePulse(rawState, rawAction.projectKey, (performance) => {
        performance.pendingApprovalCount = Math.max(0, performance.pendingApprovalCount - 1);
        performance.latestPulse = `${rawAction.title} 被拒绝，需要重新评估方案。`;
      });

      snapshot = rebuild(rawState);
      const action = this.listActions({ actionId })[0];
      assertActionItem(action);
      return action;
    },
    writeExecutionResult(actionId, input: ExecutionWritebackInput) {
      const rawAction = rawState.actions.find((action) => normalizeActionId(action.actionKey) === actionId);
      if (!rawAction) {
        throw new Error(`Unknown actionId: ${actionId}`);
      }

      recordEvent(rawState, rawAction.actionKey, {
        actorType: input.actorType,
        actorId: input.actorId,
        status: input.status,
        summary: input.summary,
        at: currentTimestamp(rawState),
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
            applicability: "适用于首发验证中的价格调整动作",
          });
        }
        review.recommendations = Array.from(
          new Set([...review.recommendations, "把调价前后数据回写整理为模板，供下次首发快速复用。"]),
        );
      }

      snapshot = rebuild(rawState);
      const action = this.listActions({ actionId })[0];
      assertActionItem(action);
      return action;
    },
    listExecutionLogs(filters: ExecutionLogFilters = {}) {
      const logs = snapshot.liveFeed
        .flatMap(() =>
          snapshot.projects.flatMap((project) => project.executionLogs ?? []),
        )
        .filter((log, index, items) => items.findIndex((candidate) => candidate.id === log.id) === index)
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
        const publishedSeed = {
          assetKey: candidate.candidateKey,
          type: candidate.type,
          title: candidate.title,
          summary: candidate.rationale,
          stage: rawState.projects.find((project) => project.projectKey === review.projectKey)?.stage ?? "review_capture",
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
        snapshot = rebuild(rawState);
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
      snapshot = rebuild(rawState);
      const decision = ensureProject(snapshot, projectId).decisionObject;
      if (!decision) {
        throw new Error(`Decision object missing for projectId: ${projectId}`);
      }
      assertDecisionObject(decision);
      return decision;
    },
  };

  return {
    projectGateway,
    actionGateway,
    knowledgeGateway,
    decisionGateway,
    getSnapshot() {
      return snapshot;
    },
    refreshLiveData() {
      rawState.tick += 1;
      updatePerformancePulse(rawState, "LAUNCH_SUMMER_REFRESH", (performance) => {
        performance.latestPulse = rawState.tick % 2 === 1 ? "系统轮询到新一轮首发反馈，等待动作结果。" : performance.latestPulse;
      });
      snapshot = rebuild(rawState);
      return snapshot;
    },
  };
}
