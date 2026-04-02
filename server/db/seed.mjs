import { openDatabase } from "./client.mjs";
import { initLocalSandboxDatabase } from "./init.mjs";
import { chunkMarkdownAsset } from "./knowledge.mjs";

const timestamps = {
  created: "2026-04-02T09:00:00+08:00",
  updated: "2026-04-02T10:30:00+08:00",
  recent: "2026-04-02T11:15:00+08:00",
};

const projects = [
  {
    projectId: "local-launch-breeze-bag",
    name: "云感通勤包首发验证",
    stage: "launch_validation",
    status: "active",
    owner: "赵颖",
    priority: 92,
    category: "通勤女包",
    snapshot: {
      summary: "首发流量表现不错，但转化没有跟上，当前更像是价格和承接页问题。",
      currentProblem: "CTR 高但 CVR 低，说明用户愿意点进来，但没有完成购买。",
      currentGoal: "先找到压制首发转化的关键因素，再决定是调价还是补表达。",
      currentRisk: "继续放量会放大低转化带来的预算浪费。",
      createdAt: "2026-04-02T10:20:00+08:00",
    },
    metrics: [
      { metricId: "metric-launch-ctr", metricName: "ctr", metricValue: 4.8, metricUnit: "%", metricDirection: "up" },
      { metricId: "metric-launch-cvr", metricName: "cvr", metricValue: 1.1, metricUnit: "%", metricDirection: "down" },
      { metricId: "metric-launch-gmv", metricName: "gmv", metricValue: 18600, metricUnit: "currency", metricDirection: "flat" },
    ],
    opportunities: [
      {
        opportunityId: "opp-launch-breeze-priceband",
        title: "同价位轻量通勤包搜索热度持续升高",
        signalType: "trend",
        description: "近 7 天轻量通勤包关键词点击率提升，说明人群兴趣正在放大。",
        priority: 1,
      },
    ],
    risks: [
      {
        riskId: "risk-launch-low-cvr",
        riskType: "conversion_drop",
        riskLevel: "high",
        description: "当前 CVR 明显低于预期，继续放量会扩大浪费。",
      },
    ],
    actions: [
      {
        actionId: "action-launch-price-check",
        actionType: "price_adjustment",
        description: "验证价格带和权益组合是否是转化瓶颈。",
        owner: "赵颖",
        requiredApproval: 1,
        approvalStatus: "pending",
        executionStatus: "suggested",
        expectedMetric: "cvr",
      },
    ],
  },
  {
    projectId: "local-growth-travel-pro",
    name: "轻旅商务包增长优化",
    stage: "growth_optimization",
    status: "blocked",
    owner: "张伟",
    priority: 96,
    category: "商务男包",
    snapshot: {
      summary: "投放预算拉高后，ROI 反而持续下滑，当前更需要重新分配增长策略。",
      currentProblem: "花费上升但 ROI 下滑，说明增长效率已经触碰到瓶颈。",
      currentGoal: "判断是素材疲劳、受众偏移还是库存协同出了问题。",
      currentRisk: "继续用当前投放策略会挤压整体利润空间。",
      createdAt: "2026-04-02T10:45:00+08:00",
    },
    metrics: [
      { metricId: "metric-growth-roi", metricName: "roi", metricValue: 1.6, metricUnit: "score", metricDirection: "down" },
      { metricId: "metric-growth-spend", metricName: "impressions", metricValue: 128000, metricUnit: "count", metricDirection: "up" },
      { metricId: "metric-growth-profit", metricName: "profit", metricValue: 9200, metricUnit: "currency", metricDirection: "down" },
    ],
    opportunities: [
      {
        opportunityId: "opp-growth-bundle",
        title: "高客单配件联卖仍有放大空间",
        signalType: "bundle_opportunity",
        description: "历史复盘显示，高客单组合装仍有客单提升空间。",
        priority: 1,
      },
    ],
    risks: [
      {
        riskId: "risk-growth-roi-drop",
        riskType: "roi_decline",
        riskLevel: "critical",
        description: "ROI 连续 3 个观测窗口下行，必须暂停当前放量策略。",
      },
    ],
    actions: [],
  },
  {
    projectId: "local-review-office-classic",
    name: "经典办公包复盘沉淀",
    stage: "review_capture",
    status: "closed",
    owner: "李安",
    priority: 78,
    category: "办公通勤包",
    snapshot: {
      summary: "项目已完成主要动作回合，复盘表明表达统一和价格说明显著提升了成交。",
      currentProblem: "需要把成功经验沉淀成可复用模板，而不是只留在项目结论里。",
      currentGoal: "形成 review 与 asset candidate，为下一轮同类项目复用。",
      currentRisk: "如果不沉淀，下一轮仍会重复走同样的试错路径。",
      createdAt: "2026-04-02T09:50:00+08:00",
    },
    metrics: [
      { metricId: "metric-review-gmv", metricName: "gmv", metricValue: 32500, metricUnit: "currency", metricDirection: "up" },
      { metricId: "metric-review-cvr", metricName: "cvr", metricValue: 2.9, metricUnit: "%", metricDirection: "up" },
      { metricId: "metric-review-orders", metricName: "orders", metricValue: 186, metricUnit: "count", metricDirection: "up" },
    ],
    opportunities: [
      {
        opportunityId: "opp-review-template",
        title: "同类办公包项目可复用表达模板",
        signalType: "reuse_signal",
        description: "本项目的详情页组织方式已验证有效，适合沉淀为模板。",
        priority: 1,
      },
    ],
    risks: [
      {
        riskId: "risk-review-lineage",
        riskType: "knowledge_loss",
        riskLevel: "medium",
        description: "如果不补 review/asset 结构，经验会重新散落到人工总结里。",
      },
    ],
    actions: [
      {
        actionId: "action-review-page-refresh",
        actionType: "visual_refresh",
        description: "统一详情页主卖点顺序与价格说明方式。",
        owner: "林乔",
        requiredApproval: 0,
        approvalStatus: "approved",
        executionStatus: "completed",
        expectedMetric: "cvr",
      },
    ],
    review: {
      reviewId: "review-office-classic",
      reviewSummary: "复盘确认：表达统一、价格说明前置后，转化率稳定抬升。",
      outcome: {
        verdict: "success",
        keyLearnings: ["详情页结构前置卖点", "价格说明与权益组合必须同屏出现"],
      },
      createdAt: "2026-04-02T10:55:00+08:00",
    },
    assetCandidates: [
      {
        candidateId: "candidate-office-classic-template",
        title: "办公包详情页表达模板",
        contentMarkdown: "## 模板摘要\n- 首屏卖点\n- 价格说明\n- 通勤场景证明",
        status: "draft",
        createdAt: "2026-04-02T11:05:00+08:00",
      },
    ],
  },
];

const ontologyEntities = [
  {
    entityId: "ontology-stage-launch",
    entityType: "stage",
    entityName: "launch_validation",
    entityJson: JSON.stringify({ displayName: "launch_verification", meaning: "首发验证阶段" }),
  },
  {
    entityId: "ontology-stage-review",
    entityType: "stage",
    entityName: "review_capture",
    entityJson: JSON.stringify({ displayName: "review_closed", meaning: "复盘沉淀阶段" }),
  },
  {
    entityId: "ontology-rule-roi",
    entityType: "rule",
    entityName: "ROI 下滑需要人工关注",
    entityJson: JSON.stringify({ threshold: "连续3个窗口下滑", owner: "boss,growth_director" }),
  },
];

const stageRules = [
  {
    ruleId: "rule-launch-validation",
    stage: "launch_validation",
    ruleType: "exit_criteria",
    ruleText: "首发验证至少需要 CTR / CVR / GMV 三组指标齐全。",
    requiredFieldsJson: JSON.stringify(["summary", "current_problem", "current_goal", "kpis"]),
    exitCriteriaJson: JSON.stringify(["至少一个问题已被明确", "至少一个动作建议待进入下一批次"]),
  },
  {
    ruleId: "rule-growth-optimization",
    stage: "growth_optimization",
    ruleType: "risk_guardrail",
    ruleText: "增长优化阶段如 ROI 连续下滑，必须显式暴露风险。",
    requiredFieldsJson: JSON.stringify(["summary", "current_problem", "current_risk", "roi"]),
    exitCriteriaJson: JSON.stringify(["老板或总监已看到重点项目", "策略调整可进入后续 Batch"]),
  },
  {
    ruleId: "rule-review-capture",
    stage: "review_capture",
    ruleType: "knowledge_capture",
    ruleText: "复盘阶段至少要有 review 和 asset candidate 占位。",
    requiredFieldsJson: JSON.stringify(["review_summary", "asset_candidate"]),
    exitCriteriaJson: JSON.stringify(["可用于后续 review / asset loop 演示"]),
  },
];

const knowledgeAssets = [
  {
    assetId: "knowledge-launch-sop-conversion",
    title: "Launch Conversion Diagnosis SOP",
    assetType: "sop",
    stage: "launch_validation",
    role: "operations_director",
    sourceProjectId: null,
    applicability: {
      stage: ["launch_validation"],
      role: ["growth_director", "product_rd_director"],
      assetType: ["sop"],
      channel: "ecommerce",
      category: "通勤女包",
      businessGoal: "launch_conversion",
      priceBand: "mid",
      lifecycle: "launch",
      preconditions: ["ctr 高于基线", "cvr 低于预期"],
      exclusionConditions: ["库存严重不足"],
    },
    keywords: "ctr cvr conversion pricing creative launch",
    contentMarkdown: `## Diagnose launch conversion\nWhen CTR is strong but CVR is weak, inspect price framing first.\n\n## Checklist\n- compare price band with top reference\n- move coupon and shipping promise into hero block\n- keep detail page first screen focused on one promise`,
  },
  {
    assetId: "knowledge-launch-rule-pricing",
    title: "Price Adjustment Approval Rule",
    assetType: "rule",
    stage: "launch_validation",
    role: "boss",
    sourceProjectId: null,
    applicability: {
      stage: ["launch_validation"],
      role: ["ceo"],
      assetType: ["rule"],
      channel: "ecommerce",
      category: "通勤女包",
      businessGoal: "launch_conversion",
      priceBand: "mid",
      lifecycle: "launch",
      preconditions: ["需要改价", "预计影响 cvr"],
      exclusionConditions: ["毛利过低"],
    },
    keywords: "approval pricing margin cvr launch",
    contentMarkdown: `## Pricing guardrail\nAny launch-stage price adjustment that changes margin assumptions requires boss approval.\n\n## Decision rule\nIf conversion is low and price framing is the main hypothesis, run a controlled price test before scaling media.`,
  },
  {
    assetId: "knowledge-launch-template-hero",
    title: "Launch Hero Block Template",
    assetType: "template",
    stage: "launch_validation",
    role: "visual_director",
    sourceProjectId: null,
    applicability: {
      stage: ["launch_validation"],
      role: ["growth_director", "visual_director"],
      assetType: ["template"],
      channel: "ecommerce",
      category: "通勤女包",
      businessGoal: "launch_conversion",
      priceBand: "mid",
      lifecycle: "launch",
      preconditions: ["需要重做首屏表达"],
      exclusionConditions: [],
    },
    keywords: "hero template creative cvr detail page",
    contentMarkdown: `## Hero template\nHeadline, proof point, price promise and coupon should stay on one screen.\n\n## Landing continuity\nThe first three detail modules must repeat the same promise users clicked for.`,
  },
  {
    assetId: "knowledge-growth-case-roi",
    title: "ROI Recovery Case",
    assetType: "case",
    stage: "growth_optimization",
    role: "operations_director",
    sourceProjectId: "local-growth-travel-pro",
    applicability: {
      stage: ["growth_optimization"],
      role: ["growth_director"],
      assetType: ["case"],
      channel: "ecommerce",
      category: "商务男包",
      businessGoal: "roi_recovery",
      priceBand: "mid_high",
      lifecycle: "growth",
      preconditions: ["roi 下滑", "花费上升"],
      exclusionConditions: [],
    },
    keywords: "roi budget case growth creative audience",
    contentMarkdown: `## Growth case\nA travel bag project recovered ROI by cutting low-intent budget and reusing only the top creative set.\n\n## Why it worked\nThe team reduced spend on broad audiences and moved budget to remarketing plus bundle creatives.`,
  },
  {
    assetId: "knowledge-growth-rule-stoploss",
    title: "ROI Stop-Loss Rule",
    assetType: "rule",
    stage: "growth_optimization",
    role: "boss",
    sourceProjectId: null,
    applicability: {
      stage: ["growth_optimization"],
      role: ["ceo"],
      assetType: ["rule"],
      channel: "ecommerce",
      category: "商务男包",
      businessGoal: "roi_recovery",
      priceBand: "mid_high",
      lifecycle: "growth",
      preconditions: ["roi 连续下行"],
      exclusionConditions: [],
    },
    keywords: "roi stoploss budget rule approval growth",
    contentMarkdown: `## Stop-loss rule\nIf ROI drops across three observation windows while spend rises, stop expanding the current budget plan.\n\n## Approval note\nA reallocation plan should be reviewed before new budget is added.`,
  },
  {
    assetId: "knowledge-growth-template-budget",
    title: "Budget Reallocation Template",
    assetType: "template",
    stage: "growth_optimization",
    role: "operations_director",
    sourceProjectId: null,
    applicability: {
      stage: ["growth_optimization"],
      role: ["growth_director"],
      assetType: ["template"],
      channel: "ecommerce",
      category: "商务男包",
      businessGoal: "roi_recovery",
      priceBand: "mid_high",
      lifecycle: "growth",
      preconditions: ["需要重配预算"],
      exclusionConditions: [],
    },
    keywords: "budget template roi audience creative growth",
    contentMarkdown: `## Reallocation template\nList the low-efficiency placements to cut, the high-intent audiences to increase, and the creative set to keep.\n\n## Validation\nMeasure ROI and profit together, not just impressions.`,
  },
  {
    assetId: "knowledge-review-sop-capture",
    title: "Review Capture SOP",
    assetType: "sop",
    stage: "review_capture",
    role: "product_rnd_director",
    sourceProjectId: null,
    applicability: {
      stage: ["review_capture"],
      role: ["product_rd_director", "growth_director"],
      assetType: ["sop"],
      channel: "ecommerce",
      category: "办公通勤包",
      businessGoal: "knowledge_capture",
      priceBand: "mid",
      lifecycle: "review",
      preconditions: ["项目进入复盘阶段"],
      exclusionConditions: [],
    },
    keywords: "review capture sop asset template learnings",
    contentMarkdown: `## Review capture\nSummarize the winning expression, the metric lift, and the repeatable rule in one document.\n\n## Output\nEvery closed project should leave one template candidate and one reusable rule.`,
  },
  {
    assetId: "knowledge-review-evaluation-sample",
    title: "Review Evaluation Sample",
    assetType: "evaluation_sample",
    stage: "review_capture",
    role: "boss",
    sourceProjectId: "local-review-office-classic",
    applicability: {
      stage: ["review_capture"],
      role: ["ceo"],
      assetType: ["evaluation_sample"],
      channel: "ecommerce",
      category: "办公通勤包",
      businessGoal: "knowledge_capture",
      priceBand: "mid",
      lifecycle: "review",
      preconditions: ["需要确认是否值得沉淀"],
      exclusionConditions: [],
    },
    keywords: "review evaluation sample asset success",
    contentMarkdown: `## Evaluation sample\nA review is worth publishing when it links the winning action, the metric movement, and the reusable artifact.\n\n## Example\nThis office bag project turned a detail page refresh into a reusable template.`,
  },
  {
    assetId: "knowledge-review-product-case",
    title: "Closed Project Product Learnings",
    assetType: "case",
    stage: "review_capture",
    role: "product_rnd_director",
    sourceProjectId: "local-review-office-classic",
    applicability: {
      stage: ["review_capture"],
      role: ["product_rd_director"],
      assetType: ["case"],
      channel: "ecommerce",
      category: "办公通勤包",
      businessGoal: "knowledge_capture",
      priceBand: "mid",
      lifecycle: "review",
      preconditions: ["复盘已形成结论"],
      exclusionConditions: [],
    },
    keywords: "product case review sku category learnings",
    contentMarkdown: `## Product learnings\nThis closed project clarified which SKU angle and price promise should be reused in the next launch.\n\n## Reuse\nTurn the conclusion into a reusable category checklist.`,
  },
  {
    assetId: "knowledge-visual-case-refresh",
    title: "Creative Refresh Reference",
    assetType: "case",
    stage: "launch_validation",
    role: "visual_director",
    sourceProjectId: "local-launch-breeze-bag",
    applicability: {
      stage: ["launch_validation"],
      role: ["visual_director"],
      assetType: ["case"],
      channel: "ecommerce",
      category: "通勤女包",
      businessGoal: "launch_conversion",
      priceBand: "mid",
      lifecycle: "launch",
      preconditions: ["需要创意迭代"],
      exclusionConditions: [],
    },
    keywords: "visual creative refresh ctr cvr launch",
    contentMarkdown: `## Creative refresh case\nWhen CTR stays high but CVR drops, the visual team should align click promise and detail-page first screen before adding more assets.\n\n## Focus\nImprove the first-screen proof and price framing before expanding creative volume.`,
  },
];

function resetBatch1Tables(db) {
  [
    "knowledge_retrieval_logs",
    "knowledge_chunks_fts",
    "knowledge_chunks",
    "knowledge_assets",
    "asset_candidates",
    "reviews",
    "actions",
    "stage_rules",
    "ontology_entities",
    "risk_signals",
    "opportunities",
    "kpi_metrics",
    "project_snapshots",
    "projects",
  ].forEach((tableName) => {
    db.exec(`DELETE FROM ${tableName};`);
  });
}

export async function seedLocalSandboxDatabase({ dbPath } = {}) {
  await initLocalSandboxDatabase({ dbPath });
  const db = openDatabase(dbPath);

  try {
    db.exec("BEGIN TRANSACTION;");
    resetBatch1Tables(db);

    const insertProject = db.prepare(`
      INSERT INTO projects (project_id, name, stage, status, owner, priority, category, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertSnapshot = db.prepare(`
      INSERT INTO project_snapshots (snapshot_id, project_id, summary, current_problem, current_goal, current_risk, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const insertMetric = db.prepare(`
      INSERT INTO kpi_metrics (metric_id, project_id, metric_name, metric_value, metric_unit, metric_direction, captured_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const insertOpportunity = db.prepare(`
      INSERT INTO opportunities (opportunity_id, project_id, title, signal_type, description, priority, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const insertRisk = db.prepare(`
      INSERT INTO risk_signals (risk_id, project_id, risk_type, risk_level, description, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const insertAction = db.prepare(`
      INSERT INTO actions (action_id, project_id, action_type, description, owner, required_approval, approval_status, execution_status, expected_metric, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertReview = db.prepare(`
      INSERT INTO reviews (review_id, project_id, review_summary, outcome_json, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    const insertAssetCandidate = db.prepare(`
      INSERT INTO asset_candidates (candidate_id, project_id, title, content_markdown, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const insertOntology = db.prepare(`
      INSERT INTO ontology_entities (entity_id, entity_type, entity_name, entity_json)
      VALUES (?, ?, ?, ?)
    `);
    const insertStageRule = db.prepare(`
      INSERT INTO stage_rules (rule_id, stage, rule_type, rule_text, required_fields_json, exit_criteria_json)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const insertKnowledgeAsset = db.prepare(`
      INSERT INTO knowledge_assets (
        asset_id,
        title,
        asset_type,
        stage,
        role,
        source_project_id,
        applicability_json,
        content_markdown,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertKnowledgeChunk = db.prepare(`
      INSERT INTO knowledge_chunks (
        chunk_id,
        asset_id,
        chunk_text,
        chunk_index,
        keywords,
        stage,
        role,
        asset_type
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertKnowledgeChunkFts = db.prepare(`
      INSERT INTO knowledge_chunks_fts (
        chunk_id,
        asset_id,
        chunk_text,
        keywords,
        stage,
        role,
        asset_type
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    projects.forEach((project) => {
      insertProject.run(
        project.projectId,
        project.name,
        project.stage,
        project.status,
        project.owner,
        project.priority,
        project.category,
        timestamps.created,
        timestamps.updated,
      );

      insertSnapshot.run(
        `snapshot-${project.projectId}`,
        project.projectId,
        project.snapshot.summary,
        project.snapshot.currentProblem,
        project.snapshot.currentGoal,
        project.snapshot.currentRisk,
        project.snapshot.createdAt,
      );

      project.metrics.forEach((metric) => {
        insertMetric.run(
          metric.metricId,
          project.projectId,
          metric.metricName,
          metric.metricValue,
          metric.metricUnit,
          metric.metricDirection,
          timestamps.recent,
        );
      });

      project.opportunities.forEach((opportunity) => {
        insertOpportunity.run(
          opportunity.opportunityId,
          project.projectId,
          opportunity.title,
          opportunity.signalType,
          opportunity.description,
          opportunity.priority,
          timestamps.created,
        );
      });

      project.risks.forEach((risk) => {
        insertRisk.run(
          risk.riskId,
          project.projectId,
          risk.riskType,
          risk.riskLevel,
          risk.description,
          timestamps.created,
        );
      });

      project.actions.forEach((action) => {
        insertAction.run(
          action.actionId,
          project.projectId,
          action.actionType,
          action.description,
          action.owner,
          action.requiredApproval,
          action.approvalStatus,
          action.executionStatus,
          action.expectedMetric,
          timestamps.created,
          timestamps.updated,
        );
      });

      if (project.review) {
        insertReview.run(
          project.review.reviewId,
          project.projectId,
          project.review.reviewSummary,
          JSON.stringify(project.review.outcome),
          project.review.createdAt,
        );
      }

      (project.assetCandidates ?? []).forEach((candidate) => {
        insertAssetCandidate.run(
          candidate.candidateId,
          project.projectId,
          candidate.title,
          candidate.contentMarkdown,
          candidate.status,
          candidate.createdAt,
        );
      });
    });

    ontologyEntities.forEach((entity) => {
      insertOntology.run(entity.entityId, entity.entityType, entity.entityName, entity.entityJson);
    });

    stageRules.forEach((rule) => {
      insertStageRule.run(
        rule.ruleId,
        rule.stage,
        rule.ruleType,
        rule.ruleText,
        rule.requiredFieldsJson,
        rule.exitCriteriaJson,
      );
    });

    knowledgeAssets.forEach((asset) => {
      insertKnowledgeAsset.run(
        asset.assetId,
        asset.title,
        asset.assetType,
        asset.stage,
        asset.role,
        asset.sourceProjectId,
        JSON.stringify(asset.applicability),
        asset.contentMarkdown,
        timestamps.created,
        timestamps.updated,
      );

      chunkMarkdownAsset({
        assetId: asset.assetId,
        contentMarkdown: asset.contentMarkdown,
        keywords: asset.keywords,
        stage: asset.stage,
        role: asset.role,
        assetType: asset.assetType,
      }).forEach((chunk) => {
        insertKnowledgeChunk.run(
          chunk.chunkId,
          chunk.assetId,
          chunk.chunkText,
          chunk.chunkIndex,
          chunk.keywords,
          chunk.stage,
          chunk.role,
          chunk.assetType,
        );
        insertKnowledgeChunkFts.run(
          chunk.chunkId,
          chunk.assetId,
          chunk.chunkText,
          chunk.keywords,
          chunk.stage,
          chunk.role,
          chunk.assetType,
        );
      });
    });

    db.exec("COMMIT;");
    return {
      dbPath: dbPath ?? null,
      projectCount: projects.length,
    };
  } catch (error) {
    db.exec("ROLLBACK;");
    throw error;
  } finally {
    db.close();
  }
}
