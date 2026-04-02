import { Link, useParams } from "react-router";
import {
  AlertTriangle,
  ArrowLeft,
  Bot,
  Brain,
  RefreshCw,
  Zap,
} from "lucide-react";
import { usePilotData } from "../../../data-access/PilotDataProvider";
import { QueryStatusPanel } from "../ui/QueryStatusPanel";

function toneClasses(tone: "positive" | "neutral" | "warning") {
  if (tone === "positive") return "text-green-700 bg-green-50";
  if (tone === "warning") return "text-orange-700 bg-orange-50";
  return "text-slate-700 bg-slate-100";
}

export function ProjectDetail() {
  const { id } = useParams();
  const {
    repositories,
    actions,
  } = usePilotData();

  if (!id) {
    return <div className="p-8 text-sm text-slate-600">缺少项目 ID。</div>;
  }

  const query = repositories.projectWorkbench.getProjectDetail(id);
  const viewModel = query.data.viewModel;
  const collaborationSummary = query.data.collaborationSummary;

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Link to="/lifecycle" className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900">
            <ArrowLeft className="mr-2 size-4" />
            返回生命周期总览
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold text-slate-900">{viewModel.project.name}</h1>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
              {viewModel.project.stageLabel}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
              {viewModel.project.statusLabel}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
              {viewModel.project.healthLabel}
            </span>
            <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-orange-700">
              {viewModel.project.riskLabel}
            </span>
          </div>
          <p className="max-w-4xl text-sm text-slate-600">{viewModel.project.statusSummary}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => actions.compileDecisionContext(viewModel.project.id)}
            className="inline-flex items-center rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-300 transition hover:bg-slate-50"
          >
            <RefreshCw className="mr-2 size-4" />
            编译上下文
          </button>
          <button
            onClick={() => actions.compileDecisionObject(viewModel.project.id)}
            className="inline-flex items-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            <RefreshCw className="mr-2 size-4" />
            编译决策
          </button>
        </div>
      </div>

      <QueryStatusPanel
        title="项目数据状态"
        stale={query.stale}
        partial={query.partial}
        lastUpdatedAt={query.lastUpdatedAt}
        issues={query.issues}
      />

      <section className="grid grid-cols-4 gap-4">
        {viewModel.metrics.map((metric) => (
          <div key={metric.id} className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="mb-1 text-sm text-slate-500">{metric.label}</div>
            <div className="mb-2 text-2xl font-semibold text-slate-900">{metric.value}</div>
            <div className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${toneClasses(metric.tone)}`}>
              {metric.helper}
            </div>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-4 gap-4">
        <LayerCard
          icon={<AlertTriangle className="size-4 text-blue-600" />}
          title="人工"
          value={`${collaborationSummary.pendingHumanActions} 个待拍板`}
          description="审批、取舍、风险判断"
        />
        <LayerCard
          icon={<Brain className="size-4 text-violet-600" />}
          title="经营大脑"
          value={`${viewModel.evidence.fact.length + viewModel.evidence.method.length} 条证据`}
          description={`推荐：${viewModel.decision.recommendedOptionTitle ?? "等待编译"}`}
        />
        <LayerCard
          icon={<Bot className="size-4 text-emerald-600" />}
          title="场景 Agent"
          value={`${viewModel.agentLane.length} 个活跃角色`}
          description="持续推进定义、诊断、视觉与复盘"
        />
        <LayerCard
          icon={<Zap className="size-4 text-orange-600" />}
          title="执行端"
          value={`${collaborationSummary.runningExecutions} 个执行中`}
          description={viewModel.audit.latestWriteback}
        />
      </section>

      <div className="grid grid-cols-[0.8fr,1.2fr] gap-6">
        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">项目归一与状态机</h2>
            <p className="mt-1 text-sm text-slate-500">围绕统一 projectId 观察来源、阶段出口条件和下一步可推进边界。</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4">
            <div className="text-sm font-medium text-slate-900">
              {viewModel.identitySummary.conflictLabel} · 置信度 {viewModel.identitySummary.confidenceLabel}
            </div>
            <div className="mt-2 text-sm text-slate-600">
              来源 {viewModel.identitySummary.sourceCount} 个 · {viewModel.identitySummary.resolvedBy} 于{" "}
              {viewModel.identitySummary.resolvedAt} 完成归一
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {viewModel.identitySummary.sources.map((source) => (
                <span key={source.key} className="rounded-full bg-white px-3 py-1 text-xs text-slate-600 ring-1 ring-slate-200">
                  {source.label}
                </span>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            {viewModel.stageGovernance.exitCriteria.map((criterion) => (
              <div key={criterion.id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-medium text-slate-900">{criterion.label}</div>
                    <div className="mt-1 text-sm text-slate-600">{criterion.description}</div>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
                    {criterion.statusLabel}
                  </span>
                </div>
              </div>
            ))}
          </div>
          {viewModel.stageGovernance.transitionBlockReason && (
            <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-800">
              当前不能推进下一阶段：{viewModel.stageGovernance.transitionBlockReason}
            </div>
          )}
          {viewModel.stageGovernance.availableTransitions.length > 0 && (
            <div className="rounded-xl border border-slate-200 p-4">
              <div className="mb-2 text-sm font-medium text-slate-900">可推进阶段</div>
              <div className="flex flex-wrap gap-2">
                {viewModel.stageGovernance.availableTransitions.map((transition) => (
                  <span key={transition.id} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
                    {transition.toStageLabel}
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">决策对象</h2>
            <p className="mt-1 text-sm text-slate-500">{viewModel.decision.problemOrOpportunity}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
            {viewModel.decision.rationale}
          </div>
          <div className="rounded-xl border border-slate-200 p-4">
            <div className="text-sm font-medium text-slate-900">诊断</div>
            <div className="mt-2 text-sm text-slate-600">{viewModel.decision.diagnosis}</div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-xl border border-slate-200 p-4">
              <div className="text-xs text-slate-500">编译时间</div>
              <div className="mt-2 text-sm font-medium text-slate-900">{viewModel.decision.compiledAtLabel}</div>
            </div>
            <div className="rounded-xl border border-slate-200 p-4">
              <div className="text-xs text-slate-500">预期影响</div>
              <div className="mt-2 text-sm font-medium text-slate-900">{viewModel.decision.expectedImpact}</div>
            </div>
            <div className="rounded-xl border border-slate-200 p-4">
              <div className="text-xs text-slate-500">审批要求</div>
              <div className="mt-2 text-sm font-medium text-slate-900">
                {viewModel.decision.approvalsRequired.length > 0
                  ? `${viewModel.decision.approvalsRequired.length} 项`
                  : "无"}
              </div>
            </div>
          </div>
          {viewModel.decision.approvalsRequired.length > 0 && (
            <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
              <div className="mb-2 text-sm font-medium text-orange-900">审批要求</div>
              <ul className="space-y-1 text-sm text-orange-800">
                {viewModel.decision.approvalsRequired.map((approval) => (
                  <li key={approval}>• {approval}</li>
                ))}
              </ul>
            </div>
          )}
          {viewModel.decision.pendingQuestions.length > 0 && (
            <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
              <div className="mb-2 text-sm font-medium text-orange-900">待回答问题</div>
              <ul className="space-y-1 text-sm text-orange-800">
                {viewModel.decision.pendingQuestions.map((question) => (
                  <li key={question}>• {question}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            {viewModel.decision.recommendedActions.map((action) => (
              <div key={action.actionId} className="rounded-xl border border-slate-200 p-4">
                <div className="font-medium text-slate-900">{action.description}</div>
                <div className="mt-2 text-sm text-slate-600">{action.owner}</div>
                <div className="mt-2 text-xs text-slate-500">
                  {action.approvalLabel} · {action.expectedMetric}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="grid grid-cols-[1fr,1fr] gap-6">
        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">事实证据</h2>
            <p className="mt-1 text-sm text-slate-500">KPI、审批、执行与异常，直接回答“现在发生了什么”。</p>
          </div>
          <div className="space-y-3">
            {viewModel.evidence.fact.map((evidence) => (
              <div key={evidence.id} className="rounded-xl border border-slate-200 p-4">
                <div className="text-sm font-medium text-slate-900">{evidence.summary}</div>
                <div className="mt-2 text-xs text-slate-500">
                  {evidence.sourceLabel ?? "事实证据"}
                  {evidence.updatedAtLabel ? ` · ${evidence.updatedAtLabel}` : ""}
                  {evidence.confidenceLabel ? ` · 置信度 ${evidence.confidenceLabel}` : ""}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">方法证据</h2>
            <p className="mt-1 text-sm text-slate-500">SOP、规则、案例和模板，回答“为什么这么做”。</p>
          </div>
          <div className="space-y-3">
            {viewModel.evidence.method.map((evidence) => (
              <div key={evidence.id} className="rounded-xl bg-blue-50 p-4">
                <div className="text-sm font-medium text-slate-900">{evidence.summary}</div>
                <div className="mt-2 text-xs text-slate-500">
                  {evidence.sourceLabel ?? "方法证据"}
                  {evidence.applicabilityLabel ? ` · ${evidence.applicabilityLabel}` : ""}
                  {evidence.confidenceLabel ? ` · 置信度 ${evidence.confidenceLabel}` : ""}
                </div>
              </div>
            ))}
            {viewModel.evidence.missingFlags.length > 0 && (
              <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
                <div className="mb-2 text-sm font-medium text-orange-900">证据缺口</div>
                <ul className="space-y-1 text-sm text-orange-800">
                  {viewModel.evidence.missingFlags.map((flag) => (
                    <li key={flag}>• {flag}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">动作与回写</h2>
            <p className="mt-1 text-sm text-slate-500">动作版本、幂等键、写回状态和异常信息都在这里显式展示。</p>
          </div>
        </div>
        <div className="space-y-3">
          {viewModel.actions.map((action) => (
            <div key={action.id} className="rounded-xl border border-slate-200 p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="font-medium text-slate-900">{action.title}</div>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">{action.layerLabel}</span>
                    <span className="rounded-full bg-orange-50 px-2 py-0.5 text-xs text-orange-700">{action.riskLabel}</span>
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">v{action.actionVersion}</span>
                  </div>
                  <p className="text-sm text-slate-600">{action.summary}</p>
                  <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                    <span>{action.approvalLabel}</span>
                    <span>·</span>
                    <span>{action.executionLabel}</span>
                    <span>·</span>
                    <span>{action.writebackStatusLabel}</span>
                    <span>·</span>
                    <span>{action.idempotencyKey}</span>
                  </div>
                  {action.lastWritebackError && (
                    <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                      {action.lastWritebackError}
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {action.approvalLabel === "待审批" && (
                    <>
                      <button
                        onClick={() => actions.rejectAction(action.id, "当前优先验证主图方案")}
                        className="rounded-lg bg-white px-3 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50"
                      >
                        拒绝
                      </button>
                      <button
                        onClick={() => actions.approveAction(action.id)}
                        className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
                      >
                        批准
                      </button>
                    </>
                  )}
                  {(action.executionLabel === "排队中" || action.executionLabel === "执行中") && (
                    <button
                      onClick={() =>
                        actions.writeExecutionResult(action.id, {
                          actorId: "automation.executor",
                          actorType: "automation",
                          status: "completed",
                          summary: `${action.title} 已完成并回写核心结果。`,
                          idempotencyKey: action.idempotencyKey,
                          targetSystem: "pilot.executor",
                          targetObjectId: action.id,
                        })
                      }
                      className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                    >
                      写回完成
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-[1fr,0.9fr] gap-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900">执行时间线</h2>
          <div className="mt-4 space-y-3">
            {viewModel.executionTimeline.map((item) => (
              <div key={item.id} className="flex items-start gap-3 rounded-xl bg-slate-50 p-4">
                <div className="mt-0.5 h-2 w-2 rounded-full bg-blue-500" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-slate-900">{item.summary}</div>
                  <div className="mt-1 text-xs text-slate-500">
                    {item.actorLabel} · {item.statusLabel} · {item.time}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900">审批与审计</h2>
          <div className="mt-4 space-y-3">
            {viewModel.audit.entries.map((entry) => (
              <div key={entry.id} className="rounded-xl border border-slate-200 p-4">
                <div className="text-sm font-medium text-slate-900">{entry.summary}</div>
                <div className="mt-1 text-xs text-slate-500">
                  {entry.actorLabel} · {entry.time}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="grid grid-cols-[1fr,0.9fr] gap-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900">知识资产</h2>
          <div className="mt-4 space-y-3">
            {viewModel.knowledgeHighlights.map((asset) => (
              <div key={asset.id} className="rounded-xl bg-blue-50 p-4">
                <div className="mb-1 text-xs font-medium text-blue-700">{asset.typeLabel}</div>
                <div className="font-medium text-slate-900">{asset.title}</div>
                <div className="mt-1 text-sm text-slate-700">{asset.summary}</div>
                <div className="mt-2 text-xs text-slate-500">
                  {asset.sourceInfo} · {asset.applicabilityLabel}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900">复盘与资产 lineage</h2>
          {viewModel.review ? (
            <div className="mt-4 space-y-4">
              <div className="rounded-xl bg-blue-50 p-4">
                <div className="text-sm font-medium text-blue-900">{viewModel.review.verdictLabel}</div>
                <div className="mt-2 text-sm text-slate-700">{viewModel.review.resultSummary}</div>
              </div>
              <div className="rounded-xl border border-slate-200 p-4 text-sm text-slate-600">
                {viewModel.review.lineageLabel}
              </div>
              <div>
                <div className="mb-2 text-sm font-medium text-slate-900">经验总结</div>
                <ul className="space-y-1 text-sm text-slate-600">
                  {viewModel.review.lessonsLearned.map((lesson) => (
                    <li key={lesson}>• {lesson}</li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="mb-2 text-sm font-medium text-slate-900">下一轮建议</div>
                <ul className="space-y-1 text-sm text-slate-600">
                  {viewModel.review.recommendations.map((recommendation) => (
                    <li key={recommendation}>• {recommendation}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border border-slate-200 p-4 text-sm text-slate-600">
                待确认资产 {viewModel.review.candidateCount} 个 · 已入库资产 {viewModel.review.publishedCount} 个
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
              当前项目还在执行中，复盘沉淀会在回写结果后自动补齐。
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function LayerCard({
  icon,
  title,
  value,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-700">
        {icon}
        {title}
      </div>
      <div className="text-xl font-semibold text-slate-900">{value}</div>
      <div className="mt-1 text-sm text-slate-500">{description}</div>
    </div>
  );
}
