function mapMetricRow(row) {
  return {
    metricId: row.metric_id,
    metricName: row.metric_name,
    metricValue: row.metric_value,
    metricUnit: row.metric_unit,
    metricDirection: row.metric_direction,
    capturedAt: row.captured_at,
  };
}

function mapRiskRow(row) {
  return {
    riskId: row.risk_id,
    projectId: row.project_id,
    riskType: row.risk_type,
    riskLevel: row.risk_level,
    description: row.description,
    createdAt: row.created_at,
  };
}

function mapOpportunityRow(row) {
  return {
    opportunityId: row.opportunity_id,
    projectId: row.project_id,
    title: row.title,
    signalType: row.signal_type,
    description: row.description,
    priority: row.priority,
    createdAt: row.created_at,
  };
}

function mapActionRow(row) {
  return {
    actionId: row.action_id,
    projectId: row.project_id,
    actionType: row.action_type,
    description: row.description,
    owner: row.owner,
    requiredApproval: Boolean(row.required_approval),
    approvalStatus: row.approval_status,
    executionStatus: row.execution_status,
    expectedMetric: row.expected_metric,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapReviewRow(row) {
  if (!row) {
    return null;
  }
  return {
    reviewId: row.review_id,
    projectId: row.project_id,
    reviewSummary: row.review_summary,
    outcome: JSON.parse(row.outcome_json),
    createdAt: row.created_at,
  };
}

function mapAssetCandidateRow(row) {
  return {
    candidateId: row.candidate_id,
    projectId: row.project_id,
    title: row.title,
    contentMarkdown: row.content_markdown,
    status: row.status,
    createdAt: row.created_at,
  };
}

export function listProjects(db, { stage } = {}) {
  const query = stage
    ? "SELECT * FROM projects WHERE stage = ? ORDER BY priority DESC, updated_at DESC"
    : "SELECT * FROM projects ORDER BY priority DESC, updated_at DESC";
  const rows = stage ? db.prepare(query).all(stage) : db.prepare(query).all();

  const latestSnapshotStmt = db.prepare(`
    SELECT summary, current_problem, current_goal, current_risk, created_at
    FROM project_snapshots
    WHERE project_id = ?
    ORDER BY created_at DESC
    LIMIT 1
  `);
  const kpiStmt = db.prepare(`
    SELECT *
    FROM kpi_metrics
    WHERE project_id = ?
    ORDER BY captured_at DESC, metric_name ASC
  `);
  const riskCountStmt = db.prepare(`
    SELECT COUNT(*) AS count
    FROM risk_signals
    WHERE project_id = ?
  `);

  return rows.map((row) => {
    const latestSnapshot = latestSnapshotStmt.get(row.project_id);
    const kpiSummary = kpiStmt.all(row.project_id).slice(0, 3).map(mapMetricRow);
    const riskCount = riskCountStmt.get(row.project_id).count;
    return {
      projectId: row.project_id,
      name: row.name,
      stage: row.stage,
      status: row.status,
      owner: row.owner,
      priority: row.priority,
      category: row.category,
      latestSnapshotSummary: latestSnapshot?.summary ?? "",
      currentProblem: latestSnapshot?.current_problem ?? "",
      currentGoal: latestSnapshot?.current_goal ?? "",
      currentRisk: latestSnapshot?.current_risk ?? "",
      kpiSummary,
      riskCount,
      updatedAt: row.updated_at,
    };
  });
}

export function getProjectDetail(db, projectId) {
  const project = db.prepare("SELECT * FROM projects WHERE project_id = ?").get(projectId);
  if (!project) {
    return null;
  }

  const latestSnapshot = db.prepare(`
    SELECT *
    FROM project_snapshots
    WHERE project_id = ?
    ORDER BY created_at DESC
    LIMIT 1
  `).get(projectId);

  const kpis = db.prepare(`
    SELECT *
    FROM kpi_metrics
    WHERE project_id = ?
    ORDER BY captured_at DESC, metric_name ASC
  `).all(projectId).map(mapMetricRow);

  const risks = db.prepare(`
    SELECT *
    FROM risk_signals
    WHERE project_id = ?
    ORDER BY created_at DESC
  `).all(projectId).map(mapRiskRow);

  const opportunities = db.prepare(`
    SELECT *
    FROM opportunities
    WHERE project_id = ?
    ORDER BY priority ASC, created_at DESC
  `).all(projectId).map(mapOpportunityRow);

  const actions = db.prepare(`
    SELECT *
    FROM actions
    WHERE project_id = ?
    ORDER BY updated_at DESC
  `).all(projectId).map(mapActionRow);

  const latestReview = mapReviewRow(
    db.prepare(`
      SELECT *
      FROM reviews
      WHERE project_id = ?
      ORDER BY created_at DESC
      LIMIT 1
    `).get(projectId),
  );

  const assetCandidates = db.prepare(`
    SELECT *
    FROM asset_candidates
    WHERE project_id = ?
    ORDER BY created_at DESC
  `).all(projectId).map(mapAssetCandidateRow);

  return {
    project: {
      projectId: project.project_id,
      name: project.name,
      stage: project.stage,
      status: project.status,
      owner: project.owner,
      priority: project.priority,
      category: project.category,
      createdAt: project.created_at,
      updatedAt: project.updated_at,
    },
    latestSnapshot: latestSnapshot
      ? {
          snapshotId: latestSnapshot.snapshot_id,
          projectId: latestSnapshot.project_id,
          summary: latestSnapshot.summary,
          currentProblem: latestSnapshot.current_problem,
          currentGoal: latestSnapshot.current_goal,
          currentRisk: latestSnapshot.current_risk,
          createdAt: latestSnapshot.created_at,
        }
      : null,
    kpis,
    risks,
    opportunities,
    actions,
    latestReview,
    assetCandidates,
  };
}
