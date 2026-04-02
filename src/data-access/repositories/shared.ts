import type {
  ActionItem,
  PilotSnapshot,
  ProjectObject,
  ProjectRealtimeSnapshot,
  ProjectReviewRecord,
} from "../../domain/types/model";
import type { QueryIssue } from "../../domain/types/query";
import { createQueryIssue, latestTimestamp } from "../queryResult";

export function getProjectIssues(
  snapshot: PilotSnapshot,
  project: ProjectObject,
  realtime: ProjectRealtimeSnapshot,
  review?: ProjectReviewRecord | null,
): QueryIssue[] {
  const issues: QueryIssue[] = [];

  if (project.identity.conflictStatus !== "healthy") {
    issues.push(
      createQueryIssue(
        "identity_conflict",
        "warning",
        "项目归一包含冲突或人工修正痕迹，需要确认 projectId 归属是否稳定。",
        project.id,
      ),
    );
  }

  if (realtime.kpis.metrics.some((metric) => metric.freshness === "batch")) {
    issues.push(
      createQueryIssue(
        "stale_kpi",
        "warning",
        "部分 KPI 仍为批处理快照，判断前请确认是否已刷新到最新结果。",
        project.id,
      ),
    );
  }

  if ((project.decisionContext?.evidencePack.missingEvidenceFlags.length ?? 0) > 0) {
    issues.push(
      createQueryIssue(
        "missing_evidence",
        "warning",
        "当前决策仍存在证据缺口，需要继续补数或补知识依据。",
        project.id,
      ),
    );
  }

  if (project.decisionObject && project.decisionObject.confidence !== "high") {
    issues.push(
      createQueryIssue(
        "low_confidence_suggestion",
        "warning",
        "当前建议动作置信度不足，不能直接自动推进。",
        project.id,
      ),
    );
  }

  if (project.actions.some((action) => action.writebackStatus === "failed" || action.lastWritebackError)) {
    issues.push(
      createQueryIssue(
        "writeback_failure",
        "error",
        "至少一条动作写回失败，当前闭环状态不完整。",
        project.id,
      ),
    );
  }

  const connectorException = snapshot.exceptions.find(
    (exception) => exception.projectId === project.id && exception.source === "data_anomaly",
  );
  if (connectorException) {
    issues.push(
      createQueryIssue(
        "connector_error",
        "error",
        connectorException.summary,
        project.id,
        connectorException.id,
      ),
    );
  }

  if (project.stage === "review_capture" && (!review?.review || !review.lineage)) {
    issues.push(
      createQueryIssue(
        "partial_data",
        "warning",
        "复盘阶段已开始，但 review 或 lineage 仍未补齐。",
        project.id,
      ),
    );
  }

  return issues;
}

export function getActionCenterIssues(snapshot: PilotSnapshot) {
  const issues: QueryIssue[] = [];
  if (snapshot.executionWritebackRecords.some((record) => record.resultStatus === "failed")) {
    issues.push(
      createQueryIssue(
        "writeback_failure",
        "error",
        "动作中心存在写回失败记录，需要优先处理。",
      ),
    );
  }
  if (snapshot.projects.some((project) => project.decisionObject?.confidence !== "high")) {
    issues.push(
      createQueryIssue(
        "low_confidence_suggestion",
        "warning",
        "有决策对象仍处于低置信度，建议先补充证据再执行。",
      ),
    );
  }
  return issues;
}

export function getKnowledgeIssues(snapshot: PilotSnapshot) {
  const issues: QueryIssue[] = [];
  if (snapshot.reviews.some((review) => !review.lineage)) {
    issues.push(
      createQueryIssue(
        "partial_data",
        "warning",
        "部分复盘还没有完整 lineage，资产沉淀链路需要补齐。",
      ),
    );
  }
  if (snapshot.knowledgeAssets.some((asset) => asset.status === "published" && !asset.lineage)) {
    issues.push(
      createQueryIssue(
        "partial_data",
        "warning",
        "已有资产发布，但 lineage 仍不完整。",
      ),
    );
  }
  return issues;
}

export function getSnapshotIssues(snapshot: PilotSnapshot) {
  return snapshot.exceptions
    .filter((exception) => exception.source === "data_anomaly")
    .map((exception) =>
      createQueryIssue(
        "connector_error",
        "error",
        exception.summary,
        exception.projectId,
        exception.id,
      ),
    );
}

export function getActionTimestamp(action: ActionItem) {
  return latestTimestamp(action.updatedAt, action.createdAt);
}
