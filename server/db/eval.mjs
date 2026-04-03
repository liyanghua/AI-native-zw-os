import { compileDecisionObject, compileRoleStory } from "./brain.mjs";
import { getProjectLineage } from "./execution.mjs";
import { getProjectGovernance } from "./governance.mjs";
import { getProjectDetail } from "./projects.mjs";

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

function mapEvalCase(row) {
  return {
    caseId: row.case_id,
    name: row.name,
    scope: row.scope,
    severity: row.severity,
    status: row.status,
    ruleSpec: parseJson(row.rule_spec_json, {}),
    createdAt: row.created_at,
  };
}

function mapEvalSuite(row) {
  return {
    suiteId: row.suite_id,
    name: row.name,
    description: row.description,
    status: row.status,
    caseIds: parseJson(row.case_ids_json, []),
    createdAt: row.created_at,
  };
}

function mapEvalRun(row) {
  return {
    runId: row.run_id,
    projectId: row.project_id,
    suiteId: row.suite_id,
    status: row.status,
    summary: parseJson(row.summary_json, {}),
    startedAt: row.started_at,
    finishedAt: row.finished_at,
  };
}

function mapEvalResult(row) {
  return {
    resultId: row.result_id,
    runId: row.run_id,
    caseId: row.case_id,
    relatedObjectType: row.related_object_type,
    relatedObjectId: row.related_object_id,
    status: row.status,
    scoreJson: parseJson(row.score_json, {}),
    notes: row.notes,
    createdAt: row.created_at,
  };
}

function mapGateDecision(row) {
  return {
    gateId: row.gate_id,
    runId: row.run_id,
    decision: row.decision,
    summary: row.summary,
    createdAt: row.created_at,
  };
}

function getSuiteRow(db, suiteId) {
  return db.prepare("SELECT * FROM eval_suites WHERE suite_id = ?").get(suiteId);
}

function getRunRow(db, runId) {
  return db.prepare("SELECT * FROM eval_runs WHERE run_id = ?").get(runId);
}

function getGateRow(db, runId) {
  return db.prepare("SELECT * FROM gate_decisions WHERE run_id = ?").get(runId);
}

function scoreDecision(detail, decision) {
  const factCount = decision?.evidencePack?.factEvidence?.length ?? 0;
  const methodCount = decision?.evidencePack?.methodEvidence?.length ?? 0;
  const recommended = decision?.decisionObject?.recommendedActions ?? [];
  const completeActions = recommended.filter((action) => action.owner && action.expectedMetric && action.confidence);
  const score = Math.min(
    100,
    factCount * 10 + methodCount * 10 + completeActions.length * 20 + (decision?.decisionObject ? 20 : 0),
  );
  return {
    relatedObjectType: "decision",
    relatedObjectId: decision?.decisionObject?.decisionId ?? `decision-${detail.project.projectId}-missing`,
    score,
    notes:
      score >= 80
        ? "Decision evidence and recommended actions are complete."
        : "Decision evidence or recommended actions still have gaps.",
  };
}

function scoreActions(detail) {
  const actions = detail.actions ?? [];
  const complete = actions.filter((action) => action.owner && action.actionDomain && action.expectedMetric).length;
  const total = Math.max(actions.length, 1);
  const score = Math.round((complete / total) * 100);
  return {
    relatedObjectType: "action",
    relatedObjectId: actions[0]?.actionId ?? `action-${detail.project.projectId}-missing`,
    score,
    notes: complete === actions.length ? "Actions are fully specified." : "Some actions still miss owner/domain/metric fields.",
  };
}

function scoreExecution(projectId, lineage) {
  const actions = lineage?.actions ?? [];
  const actionCount = Math.max(actions.length, 1);
  const withRun = actions.filter((item) => item.runs.length > 0).length;
  const withWriteback = actions.filter((item) => item.logs.some((log) => log.logType === "writeback_succeeded")).length;
  const score = Math.round(((withRun + withWriteback) / (actionCount * 2)) * 100);
  return {
    relatedObjectType: "execution",
    relatedObjectId: actions[0]?.runs[0]?.runId ?? `execution-${projectId}-missing`,
    score,
    notes: withWriteback > 0 ? "Execution and writeback are present." : "Execution lineage is still incomplete.",
  };
}

function scoreReview(projectId, governance) {
  const latestReview = governance?.reviewSummary?.latestReview ?? null;
  const score = latestReview
    ? Math.min(
        100,
        40 +
          (latestReview.summary ? 25 : 0) +
          (latestReview.reviewQualityScore ? Math.round(latestReview.reviewQualityScore / 3) : 0),
      )
    : 0;
  return {
    relatedObjectType: "review",
    relatedObjectId: latestReview?.reviewId ?? `review-${projectId}-missing`,
    score,
    notes: latestReview ? "Review summary and lineage are available." : "Review has not been generated yet.",
  };
}

function scoreAsset(projectId, governance) {
  const latestAsset = governance?.assetSummary?.latestAsset ?? null;
  const score = latestAsset
    ? Math.min(
        100,
        30 +
          (latestAsset.publishStatus === "published" ? 35 : 15) +
          (latestAsset.feedbackToKnowledge === "synced" ? 35 : 0),
      )
    : 0;
  return {
    relatedObjectType: "asset",
    relatedObjectId: latestAsset?.assetId ?? latestAsset?.candidateId ?? `asset-${projectId}-missing`,
    score,
    notes: latestAsset ? "Asset governance object exists." : "Asset candidate/published asset is still missing.",
  };
}

function scoreRoleConsistency(projectId, detail) {
  const boss = compileRoleStory(detail.db, projectId, "boss");
  const operations = compileRoleStory(detail.db, projectId, "operations_director");
  const product = compileRoleStory(detail.db, projectId, "product_rnd_director");
  const visual = compileRoleStory(detail.db, projectId, "visual_director");
  const firstTopics = [
    boss?.topIssues?.[0],
    operations?.topIssues?.[0],
    product?.topIssues?.[0],
    visual?.topIssues?.[0],
  ].filter(Boolean);
  const score = firstTopics.length >= 3 ? 85 : firstTopics.length >= 2 ? 70 : 40;
  return {
    relatedObjectType: "decision",
    relatedObjectId: `role-consistency-${projectId}`,
    score,
    notes: "Role stories were compared for top issue consistency.",
  };
}

function scoreLineageIntegrity(projectId, lineage, governance) {
  const actions = lineage?.actions ?? [];
  const hasDecision = Boolean(lineage?.decisionId);
  const hasRun = actions.some((item) => item.runs.length > 0);
  const hasReview = Boolean(governance?.reviewSummary?.latestReview);
  const hasAsset = Boolean(governance?.assetSummary?.latestAsset);
  const score = [hasDecision, hasRun, hasReview, hasAsset].filter(Boolean).length * 25;
  return {
    relatedObjectType: "decision",
    relatedObjectId: lineage?.decisionId ?? `lineage-${projectId}-missing`,
    score,
    notes: "Lineage integrity checks decision → action → run → review → asset.",
  };
}

function buildResultForCase(db, evalCase, context) {
  if (evalCase.scope === "decision") {
    return scoreDecision(context.detail, context.decision);
  }
  if (evalCase.scope === "action") {
    return scoreActions(context.detail);
  }
  if (evalCase.scope === "execution") {
    return scoreExecution(context.projectId, context.lineage);
  }
  if (evalCase.scope === "review") {
    return scoreReview(context.projectId, context.governance);
  }
  if (evalCase.scope === "asset") {
    return scoreAsset(context.projectId, context.governance);
  }
  if (evalCase.scope === "role_consistency") {
    return scoreRoleConsistency(context.projectId, { ...context.detail, db });
  }
  return scoreLineageIntegrity(context.projectId, context.lineage, context.governance);
}

function gateFromResults(results) {
  const average = results.length === 0
    ? 0
    : Math.round(results.reduce((sum, item) => sum + item.scoreJson.score, 0) / results.length);
  if (average >= 85) {
    return {
      decision: "pass",
      summary: `Average eval score ${average}, release gate passed.`,
    };
  }
  if (average >= 60) {
    return {
      decision: "warning",
      summary: `Average eval score ${average}, issues remain but system is usable.`,
    };
  }
  return {
    decision: "fail",
    summary: `Average eval score ${average}, gate failed.`,
  };
}

function buildRunSummary(results) {
  const total = results.length;
  const averageScore = total === 0
    ? 0
    : Math.round(results.reduce((sum, item) => sum + item.scoreJson.score, 0) / total);
  return {
    total,
    averageScore,
    byStatus: results.reduce((accumulator, item) => {
      accumulator[item.status] = (accumulator[item.status] ?? 0) + 1;
      return accumulator;
    }, {}),
  };
}

export function listEvalCases(db) {
  const rows = db.prepare("SELECT * FROM eval_cases ORDER BY created_at ASC").all();
  return {
    cases: rows.map(mapEvalCase),
  };
}

export function listEvalSuites(db) {
  const rows = db.prepare("SELECT * FROM eval_suites ORDER BY created_at ASC").all();
  return {
    suites: rows.map(mapEvalSuite),
  };
}

export function listEvalRuns(db, filters = {}) {
  const params = [];
  const clauses = [];
  if (filters.projectId) {
    clauses.push("project_id = ?");
    params.push(filters.projectId);
  }
  if (filters.suiteId) {
    clauses.push("suite_id = ?");
    params.push(filters.suiteId);
  }
  if (filters.status) {
    clauses.push("status = ?");
    params.push(filters.status);
  }

  const rows = db.prepare(`
    SELECT *
    FROM eval_runs
    ${clauses.length ? `WHERE ${clauses.join(" AND ")}` : ""}
    ORDER BY started_at DESC
  `).all(...params);

  return {
    runs: rows.map(mapEvalRun),
  };
}

export function getEvalRun(db, runId) {
  const run = getRunRow(db, runId);
  if (!run) {
    return null;
  }

  const results = db.prepare(`
    SELECT *
    FROM eval_results
    WHERE run_id = ?
    ORDER BY created_at ASC
  `).all(runId);

  const gate = getGateRow(db, runId);
  return {
    run: mapEvalRun(run),
    results: results.map(mapEvalResult),
    gateDecision: gate ? mapGateDecision(gate) : null,
  };
}

export function runEvalSuite(db, input) {
  if (!input?.projectId || !input?.suiteId) {
    throw domainError("invalid_eval_input", "projectId and suiteId are required.");
  }

  const detail = getProjectDetail(db, input.projectId);
  if (!detail) {
    throw domainError("project_not_found", `Project ${input.projectId} not found.`, 404);
  }

  const suiteRow = getSuiteRow(db, input.suiteId);
  if (!suiteRow) {
    throw domainError("eval_suite_not_found", `Suite ${input.suiteId} not found.`, 404);
  }

  const suite = mapEvalSuite(suiteRow);
  const cases = suite.caseIds
    .map((caseId) => db.prepare("SELECT * FROM eval_cases WHERE case_id = ?").get(caseId))
    .filter(Boolean)
    .map(mapEvalCase);

  const decision = compileDecisionObject(db, input.projectId);
  const lineage = getProjectLineage(db, input.projectId);
  const governance = getProjectGovernance(db, input.projectId);

  const runId = `eval-run-${input.projectId}-${Date.now()}`;
  const startedAt = now();
  db.prepare(`
    INSERT INTO eval_runs (
      run_id,
      project_id,
      suite_id,
      status,
      summary_json,
      started_at,
      finished_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    runId,
    input.projectId,
    suite.suiteId,
    "running",
    JSON.stringify({ total: 0, averageScore: 0, byStatus: {} }),
    startedAt,
    null,
  );

  const context = {
    projectId: input.projectId,
    detail,
    decision,
    lineage,
    governance,
  };

  const resultRows = cases.map((evalCase, index) => {
    const score = buildResultForCase(db, evalCase, context);
    const resultId = `${runId}-result-${index + 1}`;
    const status = score.score >= 85 ? "pass" : score.score >= 60 ? "warning" : "fail";
    db.prepare(`
      INSERT INTO eval_results (
        result_id,
        run_id,
        case_id,
        related_object_type,
        related_object_id,
        status,
        score_json,
        notes,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      resultId,
      runId,
      evalCase.caseId,
      score.relatedObjectType,
      score.relatedObjectId,
      status,
      JSON.stringify({ score: score.score }),
      score.notes,
      startedAt,
    );

    return mapEvalResult(db.prepare("SELECT * FROM eval_results WHERE result_id = ?").get(resultId));
  });

  const summary = buildRunSummary(resultRows);
  const finishedAt = now();

  db.prepare(`
    UPDATE eval_runs
    SET
      status = ?,
      summary_json = ?,
      finished_at = ?
    WHERE run_id = ?
  `).run(
    "completed",
    JSON.stringify(summary),
    finishedAt,
    runId,
  );

  const gate = gateFromResults(resultRows);
  const gateId = `${runId}-gate`;
  db.prepare(`
    INSERT INTO gate_decisions (
      gate_id,
      run_id,
      decision,
      summary,
      created_at
    ) VALUES (?, ?, ?, ?, ?)
  `).run(gateId, runId, gate.decision, gate.summary, finishedAt);

  return {
    run: mapEvalRun(getRunRow(db, runId)),
    results: resultRows,
    gateDecision: mapGateDecision(getGateRow(db, runId)),
  };
}

export function getProjectEvalSummary(db, projectId) {
  const runRow = db.prepare(`
    SELECT *
    FROM eval_runs
    WHERE project_id = ?
    ORDER BY started_at DESC
    LIMIT 1
  `).get(projectId);

  if (!runRow) {
    return {
      summary: {
        total: 0,
        averageScore: 0,
        byStatus: {},
      },
      latestRun: null,
      latestGateDecision: null,
    };
  }

  return {
    summary: parseJson(runRow.summary_json, { total: 0, averageScore: 0, byStatus: {} }),
    latestRun: mapEvalRun(runRow),
    latestGateDecision: mapGateDecision(getGateRow(db, runRow.run_id)),
  };
}
