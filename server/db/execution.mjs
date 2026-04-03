import { createHash } from "node:crypto";
import { getProjectDetail } from "./projects.mjs";
import {
  recordAgentTriggered,
  recordApprovalDecision,
  recordAssetPublished,
  recordMockExecutionResult,
  recordReviewGenerated,
  recordWritebackCompleted,
} from "./runtime.mjs";

function now() {
  return new Date().toISOString();
}

function domainError(code, message, statusCode = 400, details) {
  const error = new Error(message);
  error.code = code;
  error.statusCode = statusCode;
  error.details = details;
  return error;
}

function parseJson(value, fallback = {}) {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function mapActionRow(row) {
  return {
    actionId: row.action_id,
    projectId: row.project_id,
    decisionId: row.decision_id,
    role: row.role,
    actionDomain: row.action_domain,
    actionType: row.action_type,
    description: row.description,
    owner: row.owner,
    requiredApproval: Boolean(row.required_approval),
    approvalStatus: row.approval_status,
    executionStatus: row.execution_status,
    expectedMetric: row.expected_metric,
    expectedDirection: row.expected_direction,
    confidence: row.confidence,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapApprovalRow(row) {
  if (!row) {
    return null;
  }

  return {
    approvalId: row.approval_id,
    projectId: row.project_id,
    actionId: row.action_id,
    role: row.role,
    approvalStatus: row.approval_status,
    approvedBy: row.approved_by,
    reason: row.reason,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapExecutionRunRow(row) {
  if (!row) {
    return null;
  }

  return {
    runId: row.run_id,
    projectId: row.project_id,
    actionId: row.action_id,
    role: row.role,
    actionDomain: row.action_domain,
    agentName: row.agent_name,
    connectorName: row.connector_name,
    requestPayload: parseJson(row.request_payload_json),
    responsePayload: parseJson(row.response_payload_json, null),
    resultStatus: row.result_status,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
  };
}

function mapExecutionLogRow(row) {
  return {
    logId: row.log_id,
    projectId: row.project_id,
    actionId: row.action_id,
    runId: row.run_id,
    logType: row.log_type,
    message: row.message,
    createdAt: row.created_at,
  };
}

function mapWritebackRecordRow(row) {
  if (!row) {
    return null;
  }

  return {
    writebackId: row.writeback_id,
    projectId: row.project_id,
    actionId: row.action_id,
    runId: row.run_id,
    targetType: row.target_type,
    targetId: row.target_id,
    payloadHash: row.payload_hash,
    resultStatus: row.result_status,
    errorMessage: row.error_message,
    createdAt: row.created_at,
  };
}

function mapReviewRow(row) {
  if (!row) {
    return null;
  }

  const outcome = parseJson(row.outcome_json);
  return {
    reviewId: row.review_id,
    projectId: row.project_id,
    sourceActionId: row.source_action_id,
    sourceRunId: row.source_run_id,
    reviewSummary: row.review_summary,
    summary: row.review_summary,
    keyOutcome: outcome.keyOutcome ?? outcome.verdict ?? "observe_more",
    metricImpact: outcome.metricImpact ?? "待补充指标影响",
    nextSuggestion: outcome.nextSuggestion ?? "继续观察下一轮变化",
    outcome,
    createdAt: row.created_at,
  };
}

function mapAssetCandidateRow(row) {
  return {
    candidateId: row.candidate_id,
    projectId: row.project_id,
    sourceReviewId: row.source_review_id,
    title: row.title,
    contentMarkdown: row.content_markdown,
    status: row.status,
    createdAt: row.created_at,
  };
}

function getActionRow(db, actionId) {
  return db.prepare("SELECT * FROM actions WHERE action_id = ?").get(actionId);
}

function getRunRow(db, runId) {
  return db.prepare("SELECT * FROM execution_runs WHERE run_id = ?").get(runId);
}

function getLatestSnapshotRow(db, projectId) {
  return db.prepare(`
    SELECT *
    FROM project_snapshots
    WHERE project_id = ?
    ORDER BY created_at DESC
    LIMIT 1
  `).get(projectId);
}

function appendExecutionLog(db, { logId, projectId, actionId, runId, logType, message, createdAt = now() }) {
  db.prepare(`
    INSERT INTO execution_logs (log_id, project_id, action_id, run_id, log_type, message, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(logId, projectId, actionId, runId, logType, message, createdAt);

  return {
    logId,
    projectId,
    actionId,
    runId,
    logType,
    message,
    createdAt,
  };
}

function updateActionState(db, actionId, patch) {
  const current = getActionRow(db, actionId);
  if (!current) {
    throw domainError("action_not_found", `Action ${actionId} not found.`, 404);
  }

  const next = {
    decisionId: patch.decisionId ?? current.decision_id,
    role: patch.role ?? current.role,
    actionDomain: patch.actionDomain ?? current.action_domain,
    approvalStatus: patch.approvalStatus ?? current.approval_status,
    executionStatus: patch.executionStatus ?? current.execution_status,
    expectedDirection: patch.expectedDirection ?? current.expected_direction,
    confidence: patch.confidence ?? current.confidence,
    updatedAt: patch.updatedAt ?? now(),
  };

  db.prepare(`
    UPDATE actions
    SET decision_id = ?,
        role = ?,
        action_domain = ?,
        approval_status = ?,
        execution_status = ?,
        expected_direction = ?,
        confidence = ?,
        updated_at = ?
    WHERE action_id = ?
  `).run(
    next.decisionId,
    next.role,
    next.actionDomain,
    next.approvalStatus,
    next.executionStatus,
    next.expectedDirection,
    next.confidence,
    next.updatedAt,
    actionId,
  );

  return mapActionRow(getActionRow(db, actionId));
}

function buildExecutionResult(action, detail) {
  const metricsByName = new Map(detail.kpis.map((metric) => [metric.metricName, metric]));
  const actionDomain = action.actionDomain ?? action.action_domain;

  if (actionDomain === "operations") {
    const roi = metricsByName.get("roi");
    const profit = metricsByName.get("profit");
    return {
      actionDomain: "operations",
      resultStatus: "completed",
      changedMetrics: [
        {
          metricName: "roi",
          previousValue: roi?.metricValue ?? 1.6,
          newValue: Number(((roi?.metricValue ?? 1.6) + 0.5).toFixed(2)),
          metricUnit: roi?.metricUnit ?? "score",
        },
        {
          metricName: "profit",
          previousValue: profit?.metricValue ?? 9200,
          newValue: Number(((profit?.metricValue ?? 9200) + 1800).toFixed(2)),
          metricUnit: profit?.metricUnit ?? "currency",
        },
      ],
      riskChange: "暂停低 ROI 放量后，利润挤压风险开始回落。",
      stageRecommendation: "stay_growth_optimization",
      notes: [
        "低效率预算位已收缩",
        "高意图人群与核心素材获得更多预算",
      ],
    };
  }

  if (actionDomain === "product_rnd") {
    return {
      actionDomain: "product_rnd",
      resultStatus: "completed",
      changedMetrics: [
        {
          metricName: "conversion_count",
          previousValue: 186,
          newValue: 190,
          metricUnit: "count",
        },
      ],
      productDefinitionUpdate: "已收敛出可复用的办公包卖点、材质和价格承诺定义。",
      launchReadiness: "captured_for_reuse",
      notes: [
        "新品/品类判断规则已补齐",
        "下一轮 launch validation 的定义输入更完整",
      ],
    };
  }

  const ctr = metricsByName.get("ctr");
  return {
    actionDomain: "visual",
    resultStatus: "completed",
    changedMetrics: [
      {
        metricName: "ctr",
        previousValue: ctr?.metricValue ?? 4.8,
        newValue: Number(((ctr?.metricValue ?? 4.8) + 0.4).toFixed(2)),
        metricUnit: ctr?.metricUnit ?? "%",
      },
    ],
    creativeOutcome: "主图和详情页首屏表达已完成统一，点击承诺与承接页更一致。",
    assetHint: "可把本轮主图表达逻辑沉淀为 launch creative 模板。",
    notes: [
      "首屏卖点与价格承诺同屏出现",
      "视频素材迭代方向已明确",
    ],
  };
}

function payloadHash(value) {
  return createHash("sha1").update(JSON.stringify(value)).digest("hex");
}

function insertMetricChange(db, projectId, metric, capturedAt) {
  db.prepare(`
    INSERT INTO kpi_metrics (
      metric_id,
      project_id,
      metric_name,
      metric_value,
      metric_unit,
      metric_direction,
      captured_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    `metric-${projectId}-${metric.metricName}-${capturedAt}`,
    projectId,
    metric.metricName,
    metric.newValue,
    metric.metricUnit ?? null,
    "up",
    capturedAt,
  );
}

function updateProjectSnapshot(db, projectId, result, timestamp) {
  const current = getLatestSnapshotRow(db, projectId);
  const summary =
    result.actionDomain === "operations"
      ? "ROI 止损和预算重配已完成回写，当前进入观察收益恢复阶段。"
      : result.actionDomain === "product_rnd"
        ? "商品定义沉淀已回写，当前更适合输出复盘与可复用规则。"
        : "视觉表达迭代已完成回写，当前进入创意效果观察阶段。";

  const currentProblem =
    result.actionDomain === "operations"
      ? "ROI 止损动作已执行，当前需要继续确认利润恢复是否稳定。"
      : result.actionDomain === "product_rnd"
        ? "商品定义已收敛，当前需要确认哪些规则值得固化为资产。"
        : "视觉表达已刷新，当前需要确认 CTR 提升是否能转成后续转化改善。";

  const currentGoal =
    result.actionDomain === "operations"
      ? "继续验证 ROI 与利润是否回升，并决定下一轮预算策略。"
      : result.actionDomain === "product_rnd"
        ? "将复盘与商品定义经验沉淀到下一轮新品输入。"
        : "评估视觉改版的真实收益，并决定是否扩展更多素材迭代。";

  const currentRisk =
    result.actionDomain === "operations"
      ? result.riskChange
      : result.actionDomain === "product_rnd"
        ? "如果不沉淀为复盘资产，下一轮仍会重复同类试错。"
        : "如果只提升点击不提升转化，仍需继续补充商品承接表达。";

  const snapshotId = `snapshot-${projectId}-${timestamp}`;
  db.prepare(`
    INSERT INTO project_snapshots (
      snapshot_id,
      project_id,
      summary,
      current_problem,
      current_goal,
      current_risk,
      created_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(snapshotId, projectId, summary, currentProblem, currentGoal, currentRisk, timestamp);

  return {
    snapshotId,
    projectId,
    summary,
    currentProblem,
    currentGoal,
    currentRisk,
    createdAt: timestamp,
  };
}

function ensureActionForProject(db, projectId, actionId) {
  const action = getActionRow(db, actionId);
  if (!action) {
    throw domainError("action_not_found", `Action ${actionId} not found.`, 404);
  }
  if (action.project_id !== projectId) {
    throw domainError("project_action_mismatch", `Action ${actionId} does not belong to ${projectId}.`, 400);
  }
  return action;
}

export function approveAction(db, actionId, input) {
  const action = getActionRow(db, actionId);
  if (!action) {
    throw domainError("action_not_found", `Action ${actionId} not found.`, 404);
  }
  if (action.approval_status !== "pending") {
    throw domainError("invalid_action_state", `Action ${actionId} is not pending approval.`);
  }

  const timestamp = now();
  const approvalId = `approval-${actionId}-${timestamp}`;
  db.prepare(`
    INSERT INTO approvals (
      approval_id,
      project_id,
      action_id,
      role,
      approval_status,
      approved_by,
      reason,
      created_at,
      updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    approvalId,
    action.project_id,
    actionId,
    action.role ?? "boss",
    "approved",
    input.approvedBy,
    input.reason ?? null,
    timestamp,
    timestamp,
  );

  const updatedAction = updateActionState(db, actionId, {
    approvalStatus: "approved",
    updatedAt: timestamp,
  });
  recordApprovalDecision(db, actionId, "approved", input.approvedBy, input.reason);

  return {
    action: updatedAction,
    approval: mapApprovalRow(
      db.prepare("SELECT * FROM approvals WHERE approval_id = ?").get(approvalId),
    ),
  };
}

export function rejectAction(db, actionId, input) {
  const action = getActionRow(db, actionId);
  if (!action) {
    throw domainError("action_not_found", `Action ${actionId} not found.`, 404);
  }
  if (action.approval_status !== "pending") {
    throw domainError("invalid_action_state", `Action ${actionId} is not pending approval.`);
  }

  const timestamp = now();
  const approvalId = `approval-${actionId}-${timestamp}`;
  db.prepare(`
    INSERT INTO approvals (
      approval_id,
      project_id,
      action_id,
      role,
      approval_status,
      approved_by,
      reason,
      created_at,
      updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    approvalId,
    action.project_id,
    actionId,
    action.role ?? "boss",
    "rejected",
    input.approvedBy,
    input.reason ?? null,
    timestamp,
    timestamp,
  );

  const updatedAction = updateActionState(db, actionId, {
    approvalStatus: "rejected",
    executionStatus: "canceled",
    updatedAt: timestamp,
  });
  recordApprovalDecision(db, actionId, "rejected", input.approvedBy, input.reason);

  return {
    action: updatedAction,
    approval: mapApprovalRow(
      db.prepare("SELECT * FROM approvals WHERE approval_id = ?").get(approvalId),
    ),
  };
}

export function triggerAgent(db, input) {
  const action = ensureActionForProject(db, input.projectId, input.actionId);
  if (!["approved", "not_required"].includes(action.approval_status)) {
    throw domainError("invalid_action_state", `Action ${input.actionId} is not ready for execution.`);
  }
  if (!["suggested", "failed", "canceled"].includes(action.execution_status)) {
    throw domainError("invalid_action_state", `Action ${input.actionId} cannot be queued from ${action.execution_status}.`);
  }

  const timestamp = now();
  const runId = `run-${input.actionId}-${timestamp}`;
  const requestPayload = {
    projectId: input.projectId,
    actionId: input.actionId,
    actionDomain: action.action_domain,
    actionType: action.action_type,
    requestedBy: "human_handoff",
  };

  db.prepare(`
    INSERT INTO execution_runs (
      run_id,
      project_id,
      action_id,
      role,
      action_domain,
      agent_name,
      connector_name,
      request_payload_json,
      response_payload_json,
      result_status,
      started_at,
      finished_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    runId,
    input.projectId,
    input.actionId,
    action.role,
    action.action_domain,
    `${action.action_domain}-agent`,
    `mock-${action.action_domain}-connector`,
    JSON.stringify(requestPayload),
    null,
    "queued",
    timestamp,
    null,
  );

  const latestLog = appendExecutionLog(db, {
    logId: `log-${runId}-queued`,
    projectId: input.projectId,
    actionId: input.actionId,
    runId,
    logType: "agent_triggered",
    message: `${action.action_domain} Agent 已接管动作并进入排队。`,
    createdAt: timestamp,
  });

  updateActionState(db, input.actionId, {
    executionStatus: "queued",
    updatedAt: timestamp,
  });
  db.prepare("UPDATE projects SET status = ?, updated_at = ? WHERE project_id = ?").run(
    "executing",
    timestamp,
    input.projectId,
  );
  recordAgentTriggered(db, input.actionId, runId);

  return {
    action: mapActionRow(getActionRow(db, input.actionId)),
    run: mapExecutionRunRow(getRunRow(db, runId)),
    latestLog,
  };
}

export function runMockExecution(db, input) {
  const action = ensureActionForProject(db, input.projectId, input.actionId);
  const run = getRunRow(db, input.runId);
  if (!run || run.project_id !== input.projectId || run.action_id !== input.actionId) {
    throw domainError("run_not_found", `Run ${input.runId} not found.`, 404);
  }
  if (run.result_status !== "queued") {
    throw domainError("invalid_run_state", `Run ${input.runId} is not queued.`);
  }

  const detail = getProjectDetail(db, input.projectId);
  const executionResult = buildExecutionResult(action, detail);
  const timestamp = now();

  db.prepare(`
    UPDATE execution_runs
    SET response_payload_json = ?,
        result_status = ?,
        finished_at = ?
    WHERE run_id = ?
  `).run(
    JSON.stringify(executionResult),
    executionResult.resultStatus,
    timestamp,
    input.runId,
  );

  const latestLog = appendExecutionLog(db, {
    logId: `log-${input.runId}-completed`,
    projectId: input.projectId,
    actionId: input.actionId,
    runId: input.runId,
    logType: "mock_execution_completed",
    message: `${action.action_domain} mock connector 已返回执行结果。`,
    createdAt: timestamp,
  });

  updateActionState(db, input.actionId, {
    executionStatus: "in_progress",
    updatedAt: timestamp,
  });
  recordMockExecutionResult(db, input.actionId, input.runId, executionResult);

  return {
    run: mapExecutionRunRow(getRunRow(db, input.runId)),
    executionResult,
    latestLog,
  };
}

export function writebackExecutionRun(db, runId) {
  const run = getRunRow(db, runId);
  if (!run) {
    throw domainError("run_not_found", `Run ${runId} not found.`, 404);
  }
  if (run.result_status !== "completed") {
    throw domainError("invalid_run_state", `Run ${runId} has not completed execution.`);
  }

  const existing = db.prepare("SELECT * FROM writeback_records WHERE run_id = ? ORDER BY created_at DESC LIMIT 1").get(runId);
  if (existing) {
    return {
      action: mapActionRow(getActionRow(db, run.action_id)),
      updatedProjectSnapshot: getLatestSnapshotRow(db, run.project_id)
        ? {
            snapshotId: getLatestSnapshotRow(db, run.project_id).snapshot_id,
            projectId: run.project_id,
            summary: getLatestSnapshotRow(db, run.project_id).summary,
            currentProblem: getLatestSnapshotRow(db, run.project_id).current_problem,
            currentGoal: getLatestSnapshotRow(db, run.project_id).current_goal,
            currentRisk: getLatestSnapshotRow(db, run.project_id).current_risk,
            createdAt: getLatestSnapshotRow(db, run.project_id).created_at,
          }
        : null,
      updatedKpis: db.prepare(`
        SELECT *
        FROM kpi_metrics
        WHERE project_id = ?
        ORDER BY captured_at DESC
        LIMIT 5
      `).all(run.project_id),
      writebackRecord: mapWritebackRecordRow(existing),
      latestLog: mapExecutionLogRow(
        db.prepare("SELECT * FROM execution_logs WHERE run_id = ? ORDER BY created_at DESC LIMIT 1").get(runId),
      ),
    };
  }

  const executionResult = parseJson(run.response_payload_json);
  const timestamp = now();
  executionResult.changedMetrics?.forEach((metric) => {
    insertMetricChange(db, run.project_id, metric, timestamp);
  });
  const updatedProjectSnapshot = updateProjectSnapshot(db, run.project_id, executionResult, timestamp);

  const writebackId = `writeback-${runId}`;
  db.prepare(`
    INSERT INTO writeback_records (
      writeback_id,
      project_id,
      action_id,
      run_id,
      target_type,
      target_id,
      payload_hash,
      result_status,
      error_message,
      created_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    writebackId,
    run.project_id,
    run.action_id,
    runId,
    "project_snapshot",
    updatedProjectSnapshot.snapshotId,
    payloadHash(executionResult),
    "succeeded",
    null,
    timestamp,
  );

  const latestLog = appendExecutionLog(db, {
    logId: `log-${runId}-writeback`,
    projectId: run.project_id,
    actionId: run.action_id,
    runId,
    logType: "writeback_succeeded",
    message: "执行结果已完成回写，可进入 review 阶段。",
    createdAt: timestamp,
  });

  const action = updateActionState(db, run.action_id, {
    executionStatus: "completed",
    updatedAt: timestamp,
  });
  db.prepare("UPDATE projects SET status = ?, updated_at = ? WHERE project_id = ?").run(
    "reviewing",
    timestamp,
    run.project_id,
  );

  const updatedKpis = db.prepare(`
    SELECT *
    FROM kpi_metrics
    WHERE project_id = ?
    ORDER BY captured_at DESC, metric_name ASC
    LIMIT 5
  `).all(run.project_id).map((row) => ({
    metricId: row.metric_id,
    metricName: row.metric_name,
    metricValue: row.metric_value,
    metricUnit: row.metric_unit,
    metricDirection: row.metric_direction,
    capturedAt: row.captured_at,
  }));
  const writebackRecord = mapWritebackRecordRow(
    db.prepare("SELECT * FROM writeback_records WHERE writeback_id = ?").get(writebackId),
  );
  recordWritebackCompleted(db, run.action_id, runId, writebackRecord);

  return {
    action,
    updatedProjectSnapshot,
    updatedKpis,
    writebackRecord,
    latestLog,
  };
}

export function generateReview(db, input) {
  const run = getRunRow(db, input.runId);
  if (!run || run.project_id !== input.projectId || run.action_id !== input.actionId) {
    throw domainError("run_not_found", `Run ${input.runId} not found.`, 404);
  }
  const writeback = db.prepare("SELECT * FROM writeback_records WHERE run_id = ? ORDER BY created_at DESC LIMIT 1").get(input.runId);
  if (!writeback) {
    throw domainError("invalid_run_state", `Run ${input.runId} has not been written back.`);
  }

  const existing = db.prepare("SELECT * FROM reviews WHERE source_run_id = ? LIMIT 1").get(input.runId);
  if (existing) {
    return {
      review: mapReviewRow(existing),
    };
  }

  const action = getActionRow(db, input.actionId);
  const detail = getProjectDetail(db, input.projectId);
  const executionResult = parseJson(run.response_payload_json);
  const timestamp = now();
  const reviewId = `review-${input.actionId}`;

  const reviewSummary =
    action.action_domain === "operations"
      ? "ROI 止损与预算重配已完成一轮验证，当前利润恢复信号开始出现。"
      : action.action_domain === "product_rnd"
        ? "商品定义和新品判断规则已沉淀，可进入下一轮复用。"
        : "视觉表达迭代已完成，当前需要继续观察点击与承接的联动表现。";

  const outcome = {
    verdict: "success",
    keyOutcome:
      action.action_domain === "operations"
        ? "预算重配后 ROI 与利润向上修复"
        : action.action_domain === "product_rnd"
          ? "商品定义规则已收敛"
          : "创意表达承接得到改善",
    metricImpact: executionResult.changedMetrics
      .map((metric) => `${metric.metricName} -> ${metric.newValue}`)
      .join("；"),
    nextSuggestion:
      action.action_domain === "operations"
        ? "继续观察 7 天 ROI 窗口，再决定是否重新放量。"
        : action.action_domain === "product_rnd"
          ? "把复盘结论写入下一轮新品定义 checklist。"
          : "保留当前表达方向，并验证是否需要继续扩展视频素材。",
    supportingContext: detail.latestSnapshot?.summary ?? "",
  };

  db.prepare(`
    INSERT INTO reviews (
      review_id,
      project_id,
      source_action_id,
      source_run_id,
      review_summary,
      review_status,
      review_type,
      review_quality_score,
      is_promoted_to_asset,
      outcome_json,
      created_at
      , updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    reviewId,
    input.projectId,
    input.actionId,
    input.runId,
    reviewSummary,
    "generated",
    action.action_domain === "operations"
      ? "execution_review"
      : action.action_domain === "product_rnd"
        ? "product_review"
        : "creative_review",
    78,
    0,
    JSON.stringify(outcome),
    timestamp,
    timestamp,
  );

  db.prepare("UPDATE projects SET status = ?, updated_at = ? WHERE project_id = ?").run(
    "reviewing",
    timestamp,
    input.projectId,
  );
  recordReviewGenerated(db, reviewId);

  return {
    review: mapReviewRow(
      db.prepare("SELECT * FROM reviews WHERE review_id = ?").get(reviewId),
    ),
  };
}

export function publishAssetCandidate(db, input) {
  const review = db.prepare("SELECT * FROM reviews WHERE review_id = ? AND project_id = ?").get(
    input.reviewId,
    input.projectId,
  );
  if (!review) {
    throw domainError("review_not_found", `Review ${input.reviewId} not found.`, 404);
  }

  const existing = db.prepare("SELECT * FROM asset_candidates WHERE source_review_id = ? LIMIT 1").get(input.reviewId);
  if (existing) {
    return {
      assetCandidate: mapAssetCandidateRow(existing),
    };
  }

  const outcome = parseJson(review.outcome_json);
  const timestamp = now();
  const candidateId = `candidate-${input.reviewId}`;
  const title =
    outcome.keyOutcome && String(outcome.keyOutcome).includes("ROI")
      ? "ROI 止损与预算重配复盘模板"
      : outcome.keyOutcome && String(outcome.keyOutcome).includes("商品定义")
        ? "商品定义复盘模板"
        : "视觉表达迭代模板";
  const contentMarkdown = [
    `## ${title}`,
    "",
    `- 来源项目：${input.projectId}`,
    `- 来源 review：${input.reviewId}`,
    `- 关键结果：${outcome.keyOutcome ?? "待补充"}`,
    `- 指标影响：${outcome.metricImpact ?? "待补充"}`,
    `- 下一步建议：${outcome.nextSuggestion ?? "待补充"}`,
  ].join("\n");

  db.prepare(`
    INSERT INTO asset_candidates (
      candidate_id,
      project_id,
      source_review_id,
      asset_type,
      title,
      content_markdown,
      review_status,
      publish_status,
      reusability_score,
      feedback_to_knowledge,
      status,
      created_at,
      updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    candidateId,
    input.projectId,
    input.reviewId,
    "template",
    title,
    contentMarkdown,
    "approved",
    "candidate",
    72,
    "not_started",
    "draft",
    timestamp,
    timestamp,
  );
  recordAssetPublished(db, input.reviewId, candidateId, timestamp);

  return {
    assetCandidate: mapAssetCandidateRow(
      db.prepare("SELECT * FROM asset_candidates WHERE candidate_id = ?").get(candidateId),
    ),
  };
}

export function getProjectLineage(db, projectId) {
  const project = db.prepare("SELECT project_id FROM projects WHERE project_id = ?").get(projectId);
  if (!project) {
    return null;
  }

  const actionRows = db.prepare(`
    SELECT *
    FROM actions
    WHERE project_id = ?
    ORDER BY updated_at DESC, created_at DESC
  `).all(projectId);

  const actions = actionRows.map((actionRow) => {
    const approvals = db.prepare(`
      SELECT *
      FROM approvals
      WHERE action_id = ?
      ORDER BY created_at ASC
    `).all(actionRow.action_id).map(mapApprovalRow);

    const runs = db.prepare(`
      SELECT *
      FROM execution_runs
      WHERE action_id = ?
      ORDER BY started_at DESC
    `).all(actionRow.action_id).map(mapExecutionRunRow);

    const logs = db.prepare(`
      SELECT *
      FROM execution_logs
      WHERE action_id = ?
      ORDER BY created_at ASC
    `).all(actionRow.action_id).map(mapExecutionLogRow);

    const latestReview = mapReviewRow(
      db.prepare(`
        SELECT *
        FROM reviews
        WHERE source_action_id = ?
        ORDER BY created_at DESC
        LIMIT 1
      `).get(actionRow.action_id),
    );

    const assetCandidates = latestReview
      ? db.prepare(`
          SELECT *
          FROM asset_candidates
          WHERE source_review_id = ?
          ORDER BY created_at DESC
        `).all(latestReview.reviewId).map(mapAssetCandidateRow)
      : [];

    return {
      action: mapActionRow(actionRow),
      approvals,
      runs,
      logs,
      latestReview,
      assetCandidates,
    };
  });

  return {
    projectId,
    decisionId: actions[0]?.action.decisionId ?? null,
    actions,
  };
}
