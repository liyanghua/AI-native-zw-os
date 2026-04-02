import { Link, useParams } from "react-router";
import { AlertTriangle, ArrowLeft, Bot, Brain, RefreshCw, Zap } from "lucide-react";
import { usePilotData } from "../../../data-access/PilotDataProvider";
import { buildProjectDetailViewModel } from "../../../view-models/projectDetail";

function toneClasses(tone: "positive" | "neutral" | "warning") {
  if (tone === "positive") return "text-green-700 bg-green-50";
  if (tone === "warning") return "text-orange-700 bg-orange-50";
  return "text-slate-700 bg-slate-100";
}

export function ProjectDetail() {
  const { id } = useParams();
  const {
    runtime,
    approveAction,
    rejectAction,
    writeExecutionResult,
    compileDecisionObject,
  } = usePilotData();

  if (!id) {
    return <div className="p-8 text-sm text-slate-600">缺少项目 ID。</div>;
  }

  const project = runtime.projectGateway.getProject(id);
  const realtime = runtime.projectGateway.getProjectRealtimeSnapshot(id);
  const review = runtime.knowledgeGateway.listProjectReview(id);
  const executionLogs = runtime.actionGateway.listExecutionLogs({ projectId: id });
  const knowledgeAssets = runtime.knowledgeGateway.searchAssets({ sourceProjectId: id });
  const viewModel = buildProjectDetailViewModel({
    project,
    realtime,
    executionLogs,
    knowledgeAssets,
    review,
  });

  const pendingHumanActions = project.actions.filter((action) => action.approvalStatus === "pending");
  const runningExecutions = project.actions.filter(
    (action) => action.executionStatus === "queued" || action.executionStatus === "in_progress",
  );

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Link to="/lifecycle" className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900">
            <ArrowLeft className="mr-2 size-4" />
            返回生命周期总览
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-slate-900">{viewModel.project.name}</h1>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
              {viewModel.project.stageLabel}
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
        <button
          onClick={() => compileDecisionObject(project.id)}
          className="inline-flex items-center rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-300 transition hover:bg-slate-50"
        >
          <RefreshCw className="mr-2 size-4" />
          重新编译决策
        </button>
      </div>

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
          value={`${pendingHumanActions.length} 个待拍板`}
          description="审批、取舍、风险判断"
        />
        <LayerCard
          icon={<Brain className="size-4 text-violet-600" />}
          title="经营大脑"
          value={`${viewModel.decisionEvidence.length} 条证据`}
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
          value={`${runningExecutions.length} 个执行中`}
          description={`${executionLogs.length} 条可追踪执行记录`}
        />
      </section>

      <div className="grid grid-cols-[1.3fr,0.7fr] gap-6">
        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">决策对象</h2>
              <p className="mt-1 text-sm text-slate-500">{viewModel.decision.problemOrOpportunity}</p>
            </div>
            <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
              置信度：{viewModel.decision.confidenceLabel}
            </div>
          </div>
          <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
            {viewModel.decision.rationale}
          </div>
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
          <div className="grid grid-cols-3 gap-4">
            {viewModel.decision.options.map((option) => (
              <div key={option.id} className="rounded-xl border border-slate-200 p-4">
                <div className="mb-2 font-medium text-slate-900">{option.title}</div>
                <p className="mb-3 text-sm text-slate-600">{option.summary}</p>
                <div className="space-y-2 text-xs text-slate-500">
                  <div>{option.expectedImpact}</div>
                  <div>{option.riskLabel}</div>
                  <div>{option.autoExecutableLabel}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">证据与知识</h2>
            <p className="mt-1 text-sm text-slate-500">让拍板依据明确，不把建议做成黑箱。</p>
          </div>
          <div className="space-y-3">
            {viewModel.decisionEvidence.map((evidence) => (
              <div key={evidence.id} className="rounded-xl border border-slate-200 p-4">
                <div className="text-sm font-medium text-slate-900">{evidence.summary}</div>
                <div className="mt-2 text-xs text-slate-500">
                  {evidence.sourceLabel ?? "证据"} {evidence.confidenceLabel ? `· 置信度 ${evidence.confidenceLabel}` : ""}
                </div>
              </div>
            ))}
            {viewModel.knowledgeHighlights.map((asset) => (
              <div key={asset.id} className="rounded-xl bg-blue-50 p-4">
                <div className="mb-1 text-xs font-medium text-blue-700">{asset.typeLabel}</div>
                <div className="font-medium text-slate-900">{asset.title}</div>
                <div className="mt-1 text-sm text-slate-700">{asset.summary}</div>
                <div className="mt-2 text-xs text-slate-500">
                  {asset.sourceInfo}
                  {asset.applicability ? ` · ${asset.applicability}` : ""}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">动作与回写</h2>
            <p className="mt-1 text-sm text-slate-500">从建议到动作、执行、结果回写都在这里可追踪。</p>
          </div>
        </div>
        <div className="space-y-3">
          {viewModel.actions.map((action) => (
            <div key={action.id} className="rounded-xl border border-slate-200 p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="font-medium text-slate-900">{action.title}</div>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">{action.layerLabel}</span>
                    <span className="rounded-full bg-orange-50 px-2 py-0.5 text-xs text-orange-700">{action.riskLabel}</span>
                  </div>
                  <p className="text-sm text-slate-600">{action.summary}</p>
                  <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                    <span>{action.approvalLabel}</span>
                    <span>·</span>
                    <span>{action.executionLabel}</span>
                    {action.requiresHumanApproval && (
                      <>
                        <span>·</span>
                        <span>人工拍板节点</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {action.approvalLabel === "待审批" && (
                    <>
                      <button
                        onClick={() => rejectAction(action.id, "当前优先验证主图方案")}
                        className="rounded-lg bg-white px-3 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50"
                      >
                        拒绝
                      </button>
                      <button
                        onClick={() => approveAction(action.id)}
                        className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
                      >
                        批准
                      </button>
                    </>
                  )}
                  {(action.executionLabel === "排队中" || action.executionLabel === "执行中") && (
                    <button
                      onClick={() =>
                        writeExecutionResult(action.id, {
                          actorId: "automation.executor",
                          actorType: "automation",
                          status: "completed",
                          summary: `${action.title} 已完成并回写核心结果。`,
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

      <div className="grid grid-cols-[1fr,0.8fr] gap-6">
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
          <h2 className="text-lg font-semibold text-slate-900">复盘与资产</h2>
          {viewModel.review ? (
            <div className="mt-4 space-y-4">
              <div className="rounded-xl bg-blue-50 p-4">
                <div className="text-sm font-medium text-blue-900">{viewModel.review.verdictLabel}</div>
                <div className="mt-2 text-sm text-slate-700">{viewModel.review.resultSummary}</div>
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
