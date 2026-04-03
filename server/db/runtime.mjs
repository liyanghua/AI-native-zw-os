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

function mapWorkflowRow(row) {
  return {
    workflowId: row.workflow_id,
    projectId: row.project_id,
    actionId: row.action_id,
    role: row.role,
    actionDomain: row.action_domain,
    status: row.status,
    currentTaskType: row.current_task_type,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    lastEventAt: row.last_event_at,
  };
}

function mapTaskRow(row) {
  return {
    taskId: row.task_id,
    workflowId: row.workflow_id,
    projectId: row.project_id,
    actionId: row.action_id,
    runId: row.run_id,
    taskType: row.task_type,
    attempt: row.attempt,
    status: row.status,
    requestPayload: parseJson(row.request_payload_json, null),
    responsePayload: parseJson(row.response_payload_json, null),
    errorMessage: row.error_message,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapEventRow(row) {
  return {
    eventId: row.event_id,
    workflowId: row.workflow_id,
    taskId: row.task_id,
    projectId: row.project_id,
    actionId: row.action_id,
    eventType: row.event_type,
    status: row.status,
    summary: row.summary,
    payload: parseJson(row.payload_json, null),
    createdAt: row.created_at,
  };
}

function mapRetryRow(row) {
  return {
    retryId: row.retry_id,
    workflowId: row.workflow_id,
    originalTaskId: row.original_task_id,
    newTaskId: row.new_task_id,
    operator: row.operator,
    reason: row.reason,
    createdAt: row.created_at,
  };
}

function getActionRow(db, actionId) {
  return db.prepare("SELECT * FROM actions WHERE action_id = ?").get(actionId);
}

function getRunRow(db, runId) {
  return db.prepare("SELECT * FROM execution_runs WHERE run_id = ?").get(runId);
}

function getReviewRow(db, reviewId) {
  return db.prepare("SELECT * FROM reviews WHERE review_id = ?").get(reviewId);
}

function getWorkflowRow(db, workflowId) {
  return db.prepare("SELECT * FROM workflow_runs WHERE workflow_id = ?").get(workflowId);
}

function getWorkflowRowByAction(db, actionId) {
  return db.prepare("SELECT * FROM workflow_runs WHERE action_id = ?").get(actionId);
}

function getTaskRow(db, taskId) {
  return db.prepare("SELECT * FROM task_runs WHERE task_id = ?").get(taskId);
}

function listTaskRows(db, workflowId) {
  return db.prepare(`
    SELECT *
    FROM task_runs
    WHERE workflow_id = ?
    ORDER BY created_at ASC, attempt ASC
  `).all(workflowId);
}

function listEventRows(db, workflowId) {
  return db.prepare(`
    SELECT *
    FROM runtime_events
    WHERE workflow_id = ?
    ORDER BY created_at ASC
  `).all(workflowId);
}

function listRetryRows(db, workflowId) {
  return db.prepare(`
    SELECT *
    FROM retry_records
    WHERE workflow_id = ?
    ORDER BY created_at ASC
  `).all(workflowId);
}

function buildWorkflowId(actionId) {
  return `workflow-${actionId}`;
}

function buildTaskId(workflowId, taskType, attempt = 1) {
  return `${workflowId}-${taskType}-${attempt}`;
}

function insertRuntimeEvent(
  db,
  {
    eventId,
    workflowId,
    taskId,
    projectId,
    actionId,
    eventType,
    status,
    summary,
    payload,
    createdAt = now(),
  },
) {
  db.prepare(`
    INSERT INTO runtime_events (
      event_id,
      workflow_id,
      task_id,
      project_id,
      action_id,
      event_type,
      status,
      summary,
      payload_json,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    eventId,
    workflowId,
    taskId ?? null,
    projectId,
    actionId,
    eventType,
    status,
    summary,
    payload ? JSON.stringify(payload) : null,
    createdAt,
  );

  return mapEventRow(db.prepare("SELECT * FROM runtime_events WHERE event_id = ?").get(eventId));
}

function createWorkflowRun(
  db,
  {
    workflowId,
    projectId,
    actionId,
    role,
    actionDomain,
    status,
    currentTaskType,
    startedAt = now(),
    finishedAt = null,
    lastEventAt = startedAt,
  },
) {
  db.prepare(`
    INSERT INTO workflow_runs (
      workflow_id,
      project_id,
      action_id,
      role,
      action_domain,
      status,
      current_task_type,
      started_at,
      finished_at,
      last_event_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    workflowId,
    projectId,
    actionId,
    role,
    actionDomain,
    status,
    currentTaskType ?? null,
    startedAt,
    finishedAt,
    lastEventAt,
  );

  return mapWorkflowRow(getWorkflowRow(db, workflowId));
}

function updateWorkflowRun(db, workflowId, patch = {}) {
  const current = getWorkflowRow(db, workflowId);
  if (!current) {
    throw domainError("workflow_not_found", `Workflow ${workflowId} not found.`, 404);
  }

  db.prepare(`
    UPDATE workflow_runs
    SET status = ?,
        current_task_type = ?,
        finished_at = ?,
        last_event_at = ?
    WHERE workflow_id = ?
  `).run(
    patch.status ?? current.status,
    patch.currentTaskType ?? current.current_task_type,
    patch.finishedAt ?? current.finished_at,
    patch.lastEventAt ?? current.last_event_at,
    workflowId,
  );

  return mapWorkflowRow(getWorkflowRow(db, workflowId));
}

function createTaskRun(
  db,
  {
    taskId,
    workflowId,
    projectId,
    actionId,
    runId = null,
    taskType,
    attempt = 1,
    status,
    requestPayload = null,
    responsePayload = null,
    errorMessage = null,
    startedAt = now(),
    finishedAt = null,
    createdAt = startedAt,
    updatedAt = startedAt,
  },
) {
  db.prepare(`
    INSERT INTO task_runs (
      task_id,
      workflow_id,
      project_id,
      action_id,
      run_id,
      task_type,
      attempt,
      status,
      request_payload_json,
      response_payload_json,
      error_message,
      started_at,
      finished_at,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    taskId,
    workflowId,
    projectId,
    actionId,
    runId,
    taskType,
    attempt,
    status,
    requestPayload ? JSON.stringify(requestPayload) : null,
    responsePayload ? JSON.stringify(responsePayload) : null,
    errorMessage,
    startedAt,
    finishedAt,
    createdAt,
    updatedAt,
  );

  return mapTaskRow(getTaskRow(db, taskId));
}

function updateTaskRun(db, taskId, patch = {}) {
  const current = getTaskRow(db, taskId);
  if (!current) {
    throw domainError("task_not_found", `Task ${taskId} not found.`, 404);
  }

  db.prepare(`
    UPDATE task_runs
    SET run_id = ?,
        status = ?,
        request_payload_json = ?,
        response_payload_json = ?,
        error_message = ?,
        started_at = ?,
        finished_at = ?,
        updated_at = ?
    WHERE task_id = ?
  `).run(
    patch.runId ?? current.run_id,
    patch.status ?? current.status,
    patch.requestPayload ? JSON.stringify(patch.requestPayload) : current.request_payload_json,
    patch.responsePayload ? JSON.stringify(patch.responsePayload) : current.response_payload_json,
    patch.errorMessage ?? current.error_message,
    patch.startedAt ?? current.started_at,
    patch.finishedAt ?? current.finished_at,
    patch.updatedAt ?? now(),
    taskId,
  );

  return mapTaskRow(getTaskRow(db, taskId));
}

function ensureWorkflowForAction(db, actionRow, input = {}) {
  const existing = getWorkflowRowByAction(db, actionRow.action_id);
  if (existing) {
    return mapWorkflowRow(existing);
  }

  return createWorkflowRun(db, {
    workflowId: buildWorkflowId(actionRow.action_id),
    projectId: actionRow.project_id,
    actionId: actionRow.action_id,
    role: actionRow.role ?? input.role ?? "operations_director",
    actionDomain: actionRow.action_domain ?? input.actionDomain ?? "operations",
    status: input.status ?? (actionRow.approval_status === "pending" ? "awaiting_approval" : "queued"),
    currentTaskType: input.currentTaskType ?? (actionRow.approval_status === "pending" ? "approval_gate" : "agent_trigger"),
    startedAt: input.startedAt ?? actionRow.created_at,
    finishedAt: input.finishedAt ?? null,
    lastEventAt: input.lastEventAt ?? actionRow.updated_at,
  });
}

function ensureTaskForWorkflow(db, workflow, input = {}) {
  const taskId = input.taskId ?? buildTaskId(workflow.workflowId, input.taskType, input.attempt ?? 1);
  const existing = getTaskRow(db, taskId);
  if (existing) {
    return mapTaskRow(existing);
  }

  return createTaskRun(db, {
    taskId,
    workflowId: workflow.workflowId,
    projectId: workflow.projectId,
    actionId: workflow.actionId,
    runId: input.runId ?? null,
    taskType: input.taskType,
    attempt: input.attempt ?? 1,
    status: input.status ?? "queued",
    requestPayload: input.requestPayload ?? null,
    responsePayload: input.responsePayload ?? null,
    errorMessage: input.errorMessage ?? null,
    startedAt: input.startedAt ?? now(),
    finishedAt: input.finishedAt ?? null,
    createdAt: input.createdAt ?? input.startedAt ?? now(),
    updatedAt: input.updatedAt ?? input.startedAt ?? now(),
  });
}

function syncWorkflowStatusFromTasks(db, workflowId) {
  const tasks = listTaskRows(db, workflowId);
  const current = getWorkflowRow(db, workflowId);
  if (!current) {
    throw domainError("workflow_not_found", `Workflow ${workflowId} not found.`, 404);
  }

  const unfinished = tasks.filter((task) => !["completed", "cancelled"].includes(task.status));
  let status = current.status;
  let currentTaskType = current.current_task_type;
  let finishedAt = current.finished_at;

  if (unfinished.some((task) => task.status === "awaiting_approval")) {
    status = "awaiting_approval";
    currentTaskType = unfinished.find((task) => task.status === "awaiting_approval").task_type;
    finishedAt = null;
  } else if (unfinished.some((task) => task.status === "awaiting_writeback")) {
    status = "awaiting_writeback";
    currentTaskType = unfinished.find((task) => task.status === "awaiting_writeback").task_type;
    finishedAt = null;
  } else if (unfinished.some((task) => task.status === "running")) {
    status = "running";
    currentTaskType = unfinished.find((task) => task.status === "running").task_type;
    finishedAt = null;
  } else if (unfinished.some((task) => task.status === "queued")) {
    status = "queued";
    currentTaskType = unfinished.find((task) => task.status === "queued").task_type;
    finishedAt = null;
  } else if (unfinished.some((task) => task.status === "retryable")) {
    status = "retryable";
    currentTaskType = unfinished.find((task) => task.status === "retryable").task_type;
    finishedAt = null;
  } else if (unfinished.some((task) => task.status === "failed")) {
    status = "failed";
    currentTaskType = unfinished.find((task) => task.status === "failed").task_type;
    finishedAt = null;
  } else if (tasks.length > 0 && tasks.every((task) => task.status === "cancelled")) {
    status = "cancelled";
    currentTaskType = tasks.at(-1)?.task_type ?? current.current_task_type;
    finishedAt = tasks.at(-1)?.finished_at ?? current.finished_at;
  } else if (tasks.length > 0 && tasks.every((task) => ["completed", "cancelled"].includes(task.status))) {
    status = "completed";
    currentTaskType = tasks.at(-1)?.task_type ?? current.current_task_type;
    finishedAt = tasks.at(-1)?.finished_at ?? current.finished_at;
  }

  return updateWorkflowRun(db, workflowId, {
    status,
    currentTaskType,
    finishedAt,
    lastEventAt: now(),
  });
}

function appendWorkflowEvent(db, workflow, taskId, eventType, status, summary, payload, createdAt = now()) {
  return insertRuntimeEvent(db, {
    eventId: `${workflow.workflowId}-${eventType}-${createdAt}`,
    workflowId: workflow.workflowId,
    taskId,
    projectId: workflow.projectId,
    actionId: workflow.actionId,
    eventType,
    status,
    summary,
    payload,
    createdAt,
  });
}

export function recordApprovalDecision(db, actionId, approvalStatus, actor, reason) {
  const action = getActionRow(db, actionId);
  if (!action) {
    throw domainError("action_not_found", `Action ${actionId} not found.`, 404);
  }

  const workflow = ensureWorkflowForAction(db, action, {
    status: "awaiting_approval",
    currentTaskType: "approval_gate",
  });

  const task = ensureTaskForWorkflow(db, workflow, {
    taskType: "approval_gate",
    attempt: 1,
    status: "awaiting_approval",
    startedAt: action.created_at,
  });

  const taskStatus = approvalStatus === "approved" ? "completed" : "failed";
  const updatedTask = updateTaskRun(db, task.taskId, {
    status: taskStatus,
    responsePayload: {
      approvalStatus,
      actor,
      reason,
    },
    finishedAt: now(),
  });

  appendWorkflowEvent(
    db,
    workflow,
    updatedTask.taskId,
    approvalStatus === "approved" ? "approval_resolved" : "approval_rejected",
    approvalStatus === "approved" ? "queued" : "failed",
    approvalStatus === "approved" ? "Approval resolved and workflow queued." : "Approval rejected and workflow failed.",
    {
      actor,
      reason,
      approvalStatus,
    },
  );

  return syncWorkflowStatusFromTasks(db, workflow.workflowId);
}

export function recordAgentTriggered(db, actionId, runId) {
  const action = getActionRow(db, actionId);
  const run = getRunRow(db, runId);
  if (!action || !run) {
    throw domainError("runtime_source_not_found", `Action ${actionId} or run ${runId} not found.`, 404);
  }

  const workflow = ensureWorkflowForAction(db, action, {
    status: action.required_approval ? "awaiting_approval" : "queued",
    currentTaskType: action.required_approval ? "approval_gate" : "agent_trigger",
  });

  if (action.required_approval && action.approval_status !== "pending") {
    ensureTaskForWorkflow(db, workflow, {
      taskType: "approval_gate",
      attempt: 1,
      status: "completed",
      startedAt: action.created_at,
      finishedAt: action.updated_at,
    });
  }

  const triggerTask = ensureTaskForWorkflow(db, workflow, {
    taskType: "agent_trigger",
    attempt: 1,
    status: "completed",
    runId,
    requestPayload: parseJson(run.request_payload_json),
    startedAt: run.started_at,
    finishedAt: run.started_at,
  });

  ensureTaskForWorkflow(db, workflow, {
    taskType: "mock_execution",
    attempt: 1,
    status: "queued",
    runId,
    requestPayload: parseJson(run.request_payload_json),
    startedAt: run.started_at,
  });

  appendWorkflowEvent(
    db,
    workflow,
    triggerTask.taskId,
    "agent_triggered",
    "queued",
    "Agent trigger accepted and mock execution queued.",
    {
      runId,
      agentName: run.agent_name,
    },
    run.started_at,
  );

  return syncWorkflowStatusFromTasks(db, workflow.workflowId);
}

export function recordMockExecutionResult(db, actionId, runId, executionResult) {
  const action = getActionRow(db, actionId);
  const run = getRunRow(db, runId);
  if (!action || !run) {
    throw domainError("runtime_source_not_found", `Action ${actionId} or run ${runId} not found.`, 404);
  }

  const workflow = ensureWorkflowForAction(db, action, {
    status: "queued",
    currentTaskType: "mock_execution",
  });

  const executionTask = ensureTaskForWorkflow(db, workflow, {
    taskType: "mock_execution",
    attempt: 1,
    status: "running",
    runId,
    requestPayload: parseJson(run.request_payload_json),
    startedAt: run.started_at,
  });

  const nextStatus = run.result_status === "completed" ? "completed" : "retryable";
  const updatedTask = updateTaskRun(db, executionTask.taskId, {
    status: nextStatus,
    responsePayload: executionResult,
    errorMessage: nextStatus === "retryable" ? "Mock execution returned retryable status." : null,
    finishedAt: run.finished_at ?? now(),
  });

  if (nextStatus === "completed") {
    ensureTaskForWorkflow(db, workflow, {
      taskType: "writeback",
      attempt: 1,
      status: "awaiting_writeback",
      runId,
      startedAt: run.finished_at ?? now(),
    });
  }

  appendWorkflowEvent(
    db,
    workflow,
    updatedTask.taskId,
    "mock_execution_completed",
    nextStatus === "completed" ? "awaiting_writeback" : "retryable",
    nextStatus === "completed" ? "Mock execution completed and awaits writeback." : "Mock execution failed and can be retried.",
    {
      runId,
      executionResult,
    },
    run.finished_at ?? now(),
  );

  return syncWorkflowStatusFromTasks(db, workflow.workflowId);
}

export function recordWritebackCompleted(db, actionId, runId, writebackRecord) {
  const action = getActionRow(db, actionId);
  const run = getRunRow(db, runId);
  if (!action || !run) {
    throw domainError("runtime_source_not_found", `Action ${actionId} or run ${runId} not found.`, 404);
  }

  const workflow = ensureWorkflowForAction(db, action, {
    status: "awaiting_writeback",
    currentTaskType: "writeback",
  });

  const writebackTask = ensureTaskForWorkflow(db, workflow, {
    taskType: "writeback",
    attempt: 1,
    status: "awaiting_writeback",
    runId,
    startedAt: writebackRecord.created_at,
  });

  const updatedTask = updateTaskRun(db, writebackTask.taskId, {
    status: "completed",
    responsePayload: writebackRecord,
    finishedAt: writebackRecord.created_at,
  });

  ensureTaskForWorkflow(db, workflow, {
    taskType: "review_generate",
    attempt: 1,
    status: "queued",
    runId,
    startedAt: writebackRecord.created_at,
  });

  appendWorkflowEvent(
    db,
    workflow,
    updatedTask.taskId,
    "writeback_completed",
    "queued",
    "Writeback completed and review generation is queued.",
    {
      runId,
      writebackId: writebackRecord.writeback_id ?? writebackRecord.writebackId,
    },
    writebackRecord.created_at,
  );

  return syncWorkflowStatusFromTasks(db, workflow.workflowId);
}

export function recordReviewGenerated(db, reviewId) {
  const review = getReviewRow(db, reviewId);
  if (!review?.source_action_id) {
    return null;
  }

  const action = getActionRow(db, review.source_action_id);
  if (!action) {
    return null;
  }

  const workflow = ensureWorkflowForAction(db, action, {
    status: "queued",
    currentTaskType: "review_generate",
  });

  const reviewTask = ensureTaskForWorkflow(db, workflow, {
    taskType: "review_generate",
    attempt: 1,
    status: "queued",
    runId: review.source_run_id,
    startedAt: review.created_at,
  });

  const updatedTask = updateTaskRun(db, reviewTask.taskId, {
    status: "completed",
    responsePayload: {
      reviewId: review.review_id,
      reviewStatus: review.review_status,
    },
    finishedAt: review.created_at,
  });

  ensureTaskForWorkflow(db, workflow, {
    taskType: "asset_publish",
    attempt: 1,
    status: "queued",
    startedAt: review.created_at,
  });

  appendWorkflowEvent(
    db,
    workflow,
    updatedTask.taskId,
    "review_generated",
    "queued",
    "Review generated and asset publish is queued.",
    {
      reviewId: review.review_id,
      sourceRunId: review.source_run_id,
    },
    review.created_at,
  );

  return syncWorkflowStatusFromTasks(db, workflow.workflowId);
}

export function recordAssetPublished(db, reviewId, candidateId, createdAt = now()) {
  const review = getReviewRow(db, reviewId);
  if (!review?.source_action_id) {
    return null;
  }

  const action = getActionRow(db, review.source_action_id);
  if (!action) {
    return null;
  }

  const workflow = ensureWorkflowForAction(db, action, {
    status: "queued",
    currentTaskType: "asset_publish",
  });

  const assetTask = ensureTaskForWorkflow(db, workflow, {
    taskType: "asset_publish",
    attempt: 1,
    status: "queued",
    startedAt: createdAt,
  });

  const updatedTask = updateTaskRun(db, assetTask.taskId, {
    status: "completed",
    responsePayload: {
      reviewId,
      candidateId,
    },
    finishedAt: createdAt,
  });

  appendWorkflowEvent(
    db,
    workflow,
    updatedTask.taskId,
    "asset_published",
    "completed",
    "Asset candidate published and workflow completed.",
    {
      reviewId,
      candidateId,
    },
    createdAt,
  );

  return syncWorkflowStatusFromTasks(db, workflow.workflowId);
}

export function listRuntimeWorkflows(db, filters = {}) {
  const params = [];
  const clauses = [];
  if (filters.projectId) {
    clauses.push("project_id = ?");
    params.push(filters.projectId);
  }
  if (filters.actionId) {
    clauses.push("action_id = ?");
    params.push(filters.actionId);
  }
  if (filters.status) {
    clauses.push("status = ?");
    params.push(filters.status);
  }

  const rows = db.prepare(`
    SELECT *
    FROM workflow_runs
    ${clauses.length ? `WHERE ${clauses.join(" AND ")}` : ""}
    ORDER BY last_event_at DESC
  `).all(...params);

  const workflows = rows.map(mapWorkflowRow);
  return {
    workflows,
    summary: {
      total: workflows.length,
      queued: workflows.filter((workflow) => workflow.status === "queued").length,
      running: workflows.filter((workflow) => workflow.status === "running").length,
      failed: workflows.filter((workflow) => workflow.status === "failed").length,
      retryable: workflows.filter((workflow) => workflow.status === "retryable").length,
      awaitingApproval: workflows.filter((workflow) => workflow.status === "awaiting_approval").length,
    },
    filters: {
      projectId: filters.projectId ?? null,
      actionId: filters.actionId ?? null,
      status: filters.status ?? null,
    },
  };
}

export function getRuntimeWorkflow(db, workflowId) {
  const workflow = getWorkflowRow(db, workflowId);
  if (!workflow) {
    return null;
  }

  return {
    workflow: mapWorkflowRow(workflow),
    tasks: listTaskRows(db, workflowId).map(mapTaskRow),
    events: listEventRows(db, workflowId).map(mapEventRow),
    retryRecords: listRetryRows(db, workflowId).map(mapRetryRow),
  };
}

export function retryRuntimeTask(db, taskId, input = {}) {
  const task = getTaskRow(db, taskId);
  if (!task) {
    throw domainError("task_not_found", `Task ${taskId} not found.`, 404);
  }
  if (!["failed", "retryable"].includes(task.status)) {
    throw domainError("task_not_retryable", `Task ${taskId} is not retryable.`, 409);
  }

  const workflow = getWorkflowRow(db, task.workflow_id);
  if (!workflow) {
    throw domainError("workflow_not_found", `Workflow ${task.workflow_id} not found.`, 404);
  }

  const newTaskId = buildTaskId(task.workflow_id, task.task_type, task.attempt + 1);
  const createdAt = now();
  const newTask = createTaskRun(db, {
    taskId: newTaskId,
    workflowId: task.workflow_id,
    projectId: task.project_id,
    actionId: task.action_id,
    runId: task.run_id,
    taskType: task.task_type,
    attempt: task.attempt + 1,
    status: "queued",
    requestPayload: parseJson(task.request_payload_json, null),
    startedAt: createdAt,
    createdAt,
    updatedAt: createdAt,
  });

  const retryId = `${task.task_id}-retry-${createdAt}`;
  db.prepare(`
    INSERT INTO retry_records (
      retry_id,
      workflow_id,
      original_task_id,
      new_task_id,
      operator,
      reason,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    retryId,
    task.workflow_id,
    task.task_id,
    newTaskId,
    input.operator ?? "system",
    input.reason ?? null,
    createdAt,
  );

  const latestEvent = appendWorkflowEvent(
    db,
    mapWorkflowRow(workflow),
    newTaskId,
    "task_retried",
    "queued",
    "Task retried and returned to queue.",
    {
      operator: input.operator ?? "system",
      reason: input.reason ?? null,
    },
    createdAt,
  );

  const updatedWorkflow = updateWorkflowRun(db, workflow.workflow_id, {
    status: "queued",
    currentTaskType: task.task_type,
    finishedAt: null,
    lastEventAt: createdAt,
  });

  return {
    workflow: updatedWorkflow,
    originalTask: mapTaskRow(task),
    newTask,
    retryRecord: mapRetryRow(
      db.prepare("SELECT * FROM retry_records WHERE retry_id = ?").get(retryId),
    ),
    latestEvent,
  };
}

export function cancelRuntimeTask(db, taskId, input = {}) {
  const task = getTaskRow(db, taskId);
  if (!task) {
    throw domainError("task_not_found", `Task ${taskId} not found.`, 404);
  }
  if (!["queued", "running", "awaiting_approval", "awaiting_writeback"].includes(task.status)) {
    throw domainError("task_not_cancellable", `Task ${taskId} is not cancellable.`, 409);
  }

  const updatedTask = updateTaskRun(db, taskId, {
    status: "cancelled",
    errorMessage: input.reason ?? "Task cancelled by operator.",
    finishedAt: now(),
  });
  const workflow = getWorkflowRow(db, task.workflow_id);
  if (!workflow) {
    throw domainError("workflow_not_found", `Workflow ${task.workflow_id} not found.`, 404);
  }

  const latestEvent = appendWorkflowEvent(
    db,
    mapWorkflowRow(workflow),
    taskId,
    "task_cancelled",
    "cancelled",
    "Task cancelled by operator.",
    {
      operator: input.operator ?? "system",
      reason: input.reason ?? null,
    },
  );

  const updatedWorkflow = updateWorkflowRun(db, task.workflow_id, {
    status: "cancelled",
    currentTaskType: task.task_type,
    finishedAt: updatedTask.finishedAt,
    lastEventAt: latestEvent.createdAt,
  });

  return {
    workflow: updatedWorkflow,
    task: updatedTask,
    latestEvent,
  };
}

export function getProjectRuntimeSummary(db, projectId) {
  const workflows = listRuntimeWorkflows(db, { projectId }).workflows;
  const latestWorkflow = workflows[0] ?? null;
  const events = latestWorkflow ? listEventRows(db, latestWorkflow.workflowId).map(mapEventRow).slice(-8) : [];
  const counts = {
    queued: workflows.filter((workflow) => workflow.status === "queued").length,
    running: workflows.filter((workflow) => workflow.status === "running").length,
    awaiting_approval: workflows.filter((workflow) => workflow.status === "awaiting_approval").length,
    awaiting_writeback: workflows.filter((workflow) => workflow.status === "awaiting_writeback").length,
    completed: workflows.filter((workflow) => workflow.status === "completed").length,
    failed: workflows.filter((workflow) => workflow.status === "failed").length,
    retryable: workflows.filter((workflow) => workflow.status === "retryable").length,
    cancelled: workflows.filter((workflow) => workflow.status === "cancelled").length,
  };

  return {
    projectId,
    counts,
    latestWorkflow,
    latestEvent: events.at(-1) ?? null,
    recentEvents: events,
  };
}
