import { useState } from "react";
import { Link, useParams } from "react-router";
import {
  AlertTriangle,
  ArrowLeft,
  Bot,
  Brain,
  Database,
  Zap,
} from "lucide-react";
import { usePilotData } from "../../../data-access/PilotDataProvider";
import { useRemoteQuery } from "../../../data-access/useRemoteQuery";
import { getRiskLabel, getRoleTypeLabel } from "../../../domain/runtime/labels";
import type { RoleStoryRole } from "../../../domain/types/model";
import { QueryStatusPanel } from "../ui/QueryStatusPanel";

export function ProjectDetail() {
  const { id } = useParams();
  const { sandboxRepositories } = usePilotData();
  const [activeRole, setActiveRole] = useState<RoleStoryRole>("boss");
  const [refreshToken, setRefreshToken] = useState(0);
  const [mutationMessage, setMutationMessage] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const { query, isLoading } = useRemoteQuery(
    () => sandboxRepositories.projects.getWorkbench(id ?? ""),
    [sandboxRepositories, id, refreshToken],
    { pollMs: 45_000 },
  );

  if (!id) {
    return <ShellState title="缺少项目 ID" description="当前路由没有携带项目编号。" />;
  }

  if (isLoading && !query) {
    return <ShellState title="正在编译项目工作台..." description="正在从本地 API 拉取项目、证据、决策和角色叙事。" />;
  }

  if (!query) {
    return <ShellState title="项目详情暂不可用" description="尚未收到项目 workbench 结果。" />;
  }

  const workbench = query.data;
  const activeRoleStory = workbench.roleStories[activeRole];
  const actionLineage = workbench.actionLineage.actions;

  if (query.error && workbench.project.priority === 0) {
    return <ShellState title="项目详情暂不可用" description={query.error} />;
  }

  async function runMutation(
    label: string,
    task: () => Promise<{ error: string | null; data: unknown }>,
  ) {
    setMutationError(null);
    setMutationMessage(`${label}处理中...`);
    const result = await task();
    if (result.error || !result.data) {
      setMutationError(result.error ?? `${label}失败。`);
      setMutationMessage(null);
      return;
    }
    setMutationMessage(`${label}已完成。`);
    setRefreshToken((value) => value + 1);
  }

  return (
    <div className="p-8 space-y-6">
      <div className="space-y-2">
        <Link to="/lifecycle" className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900">
          <ArrowLeft className="mr-2 size-4" />
          返回生命周期总览
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold text-slate-900">{workbench.project.name}</h1>
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
            {workbench.project.stageLabel}
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
            {workbench.project.statusLabel}
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
            负责人 {workbench.project.owner}
          </span>
          <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-orange-700">
            优先级 {workbench.project.priority}
          </span>
        </div>
        <p className="max-w-4xl text-sm text-slate-600">
          {workbench.latestSnapshot?.summary ?? "当前还没有最新项目快照。"}
        </p>
      </div>

      <QueryStatusPanel
        title="项目数据状态"
        stale={query.stale}
        partial={query.partial}
        lastUpdatedAt={query.lastUpdatedAt}
        issues={query.issues}
      />

      {mutationMessage && !mutationError ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {mutationMessage}
        </div>
      ) : null}
      {mutationError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {mutationError}
        </div>
      ) : null}

      <section className="grid grid-cols-3 gap-4">
        <ContextCard label="当前问题" value={workbench.latestSnapshot?.currentProblem ?? "待补充"} />
        <ContextCard label="当前目标" value={workbench.latestSnapshot?.currentGoal ?? "待补充"} />
        <ContextCard label="当前风险" value={workbench.latestSnapshot?.currentRisk ?? "待补充"} />
      </section>

      <section className="grid grid-cols-3 gap-4">
        {workbench.metrics.map((metric) => (
          <div key={metric.key} className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="text-sm text-slate-500">{metric.label}</div>
            <div className="mt-2 text-2xl font-semibold text-slate-900">
              {formatMetricValue(metric.value, metric.unit)}
            </div>
            <div className="mt-2 text-xs text-slate-500">
              {metric.trend === "up" ? "趋势上升" : metric.trend === "down" ? "趋势下滑" : "趋势平稳"}
            </div>
          </div>
        ))}
      </section>

      <div className="grid grid-cols-[1.08fr,0.92fr] gap-6">
        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">决策摘要</h2>
            <p className="mt-1 text-sm text-slate-500">Batch 2 已从真实项目数据和本地知识证据编译出结构化决策对象。</p>
          </div>

          <div className="rounded-xl bg-slate-50 p-4">
            <div className="text-xs text-slate-500">当前最大问题</div>
            <div className="mt-2 text-base font-medium text-slate-900">
              {workbench.decision.decisionObject.problemOrOpportunity}
            </div>
          </div>

          <ContextCard
            label="Current diagnosis"
            value={workbench.decision.decisionObject.diagnosis}
          />

          <div className="grid grid-cols-3 gap-3">
            <StatCard label="预期影响" value={workbench.decision.decisionObject.expectedImpact} />
            <StatCard
              label="审批要求"
              value={
                workbench.decision.decisionObject.approvalsRequired.length > 0
                  ? `${workbench.decision.decisionObject.approvalsRequired.length} 项`
                  : "无"
              }
            />
            <StatCard
              label="证据条数"
              value={`${workbench.decision.evidencePack.factEvidence.length + workbench.decision.evidencePack.methodEvidence.length} 条`}
            />
          </div>

          <div className="space-y-3">
            {workbench.decision.decisionObject.recommendedActions.map((action) => (
              <div key={action.actionId} className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-medium text-slate-900">{action.description}</div>
                    <div className="mt-2 text-sm text-slate-600">
                      {action.owner} · 关注 {action.expectedMetric}
                    </div>
                    <div className="mt-2 text-xs text-slate-500">
                      {action.requiredApproval ? "需要审批" : "无需审批"} · 置信度 {action.confidence}
                    </div>
                  </div>
                  <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
                    {action.expectedDirection}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Role Story</h2>
            <p className="mt-1 text-sm text-slate-500">同一个 `projectId` 在老板、运营、产品、视觉视角下编译出不同叙事，但仍保持同源。</p>
          </div>

          <div className="inline-flex rounded-xl bg-slate-100 p-1">
            {(["boss", "operations_director", "product_rnd_director", "visual_director"] as RoleStoryRole[]).map((role) => (
              <button
                key={role}
                onClick={() => setActiveRole(role)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                  activeRole === role
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {getRoleTypeLabel(role)}
              </button>
            ))}
          </div>

          <div className="rounded-xl bg-slate-50 p-4">
            <div className="text-sm text-slate-500">story summary</div>
            <div className="mt-2 text-sm text-slate-800">{activeRoleStory.storySummary}</div>
          </div>

          <ListCard title="top issues" items={activeRoleStory.topIssues} />
          <ListCard title="key decisions" items={activeRoleStory.keyDecisions} />
          <ListCard title="pending approvals" items={activeRoleStory.pendingApprovals} emptyLabel="当前没有待审批项" />
          <ListCard title="recent outcomes" items={activeRoleStory.recentOutcomes} />
        </section>
      </div>

      <div className="grid grid-cols-[1fr,1fr] gap-6">
        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">事实证据</h2>
            <p className="mt-1 text-sm text-slate-500">来自项目快照、KPI、风险、商机和历史动作的真实输入。</p>
          </div>
          <div className="space-y-3">
            {workbench.decision.evidencePack.factEvidence.map((evidence) => (
              <EvidenceCard
                key={evidence.id}
                title={evidence.summary}
                subtitle={evidence.sourceLabel}
                helper={evidence.updatedAtLabel}
              />
            ))}
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">方法证据</h2>
            <p className="mt-1 text-sm text-slate-500">来自本地知识库检索出的 SOP / case / rule / template / evaluation sample。</p>
          </div>
          <div className="space-y-3">
            {workbench.decision.evidencePack.methodEvidence.map((evidence) => (
              <EvidenceCard
                key={evidence.id}
                title={evidence.summary}
                subtitle={evidence.sourceLabel}
                helper={evidence.applicability?.businessGoal}
                tone="method"
              />
            ))}
            {workbench.decision.evidencePack.missingEvidenceFlags.length > 0 && (
              <ListCard
                title="missing evidence flags"
                items={workbench.decision.evidencePack.missingEvidenceFlags}
              />
            )}
          </div>
        </section>
      </div>

      <div className="grid grid-cols-[1.08fr,0.92fr] gap-6">
        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Action Execution Panel</h2>
            <p className="mt-1 text-sm text-slate-500">把推荐动作推进成审批、Agent trigger、mock connector、writeback、review 和 asset candidate。</p>
          </div>
          <div className="space-y-4">
            {actionLineage.length === 0 ? (
              <EmptyCard title="当前没有可执行动作" description="等待后续编译或数据接入补充 action lineage。" />
            ) : (
              actionLineage.map((item) => {
                const latestRun = item.runs[0];
                const hasWriteback = item.logs.some((log) => log.logType === "writeback_succeeded");
                return (
                  <div key={item.action.id} className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="font-medium text-slate-900">{item.action.title}</div>
                          <Tag label={item.action.actionDomain ?? "unknown"} tone="neutral" />
                          <Tag label={item.action.approvalStatus} tone={item.action.approvalStatus === "approved" ? "success" : item.action.approvalStatus === "pending" ? "warning" : "neutral"} />
                          <Tag label={item.action.executionStatus} tone={item.action.executionStatus === "completed" ? "success" : item.action.executionStatus === "queued" || item.action.executionStatus === "in_progress" ? "info" : "neutral"} />
                        </div>
                        <div className="text-sm text-slate-600">{item.action.summary}</div>
                        <div className="text-xs text-slate-500">
                          责任人 {item.action.owner} · 目标 {item.action.expectedMetric ?? "待补充"} · 方向 {item.action.expectedDirection ?? "待补充"}
                        </div>
                        {latestRun ? (
                          <div className="text-xs text-slate-500">
                            最新 run: {latestRun.runId} · {latestRun.resultStatus}
                          </div>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {item.action.approvalStatus === "pending" ? (
                          <>
                            <button
                              onClick={() => void runMutation(
                                "动作审批",
                                () => sandboxRepositories.execution.approveAction(
                                  item.action.actionId ?? item.action.id,
                                  { approvedBy: "老板王敏", reason: "允许继续执行闭环验证。" },
                                  workbench.project.stage,
                                ),
                              )}
                              className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
                            >
                              批准
                            </button>
                            <button
                              onClick={() => void runMutation(
                                "动作驳回",
                                () => sandboxRepositories.execution.rejectAction(
                                  item.action.actionId ?? item.action.id,
                                  { approvedBy: "老板王敏", reason: "先暂停执行，等待更多证据。" },
                                  workbench.project.stage,
                                ),
                              )}
                              className="rounded-lg bg-white px-3 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50"
                            >
                              驳回
                            </button>
                          </>
                        ) : null}
                        {(item.action.approvalStatus === "approved" || item.action.approvalStatus === "not_required") && item.runs.length === 0 ? (
                          <button
                            onClick={() => void runMutation(
                              "触发 Agent",
                              () => sandboxRepositories.execution.triggerAgent({
                                projectId: workbench.project.projectId,
                                actionId: item.action.actionId ?? item.action.id,
                              }, workbench.project.stage),
                            )}
                            className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
                          >
                            触发 Agent
                          </button>
                        ) : null}
                        {latestRun && latestRun.resultStatus === "queued" ? (
                          <button
                            onClick={() => void runMutation(
                              "运行 Mock Connector",
                              () => sandboxRepositories.execution.runMockExecution({
                                projectId: workbench.project.projectId,
                                actionId: item.action.actionId ?? item.action.id,
                                runId: latestRun.runId,
                              }),
                            )}
                            className="rounded-lg bg-violet-600 px-3 py-2 text-sm font-medium text-white hover:bg-violet-700"
                          >
                            运行 Mock Connector
                          </button>
                        ) : null}
                        {latestRun && latestRun.resultStatus === "completed" && !hasWriteback ? (
                          <button
                            onClick={() => void runMutation(
                              "写回结果",
                              () => sandboxRepositories.execution.writebackRun(latestRun.runId),
                            )}
                            className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                          >
                            写回结果
                          </button>
                        ) : null}
                        {hasWriteback && !item.latestReview && latestRun ? (
                          <button
                            onClick={() => void runMutation(
                              "生成 Review",
                              () => sandboxRepositories.execution.generateReview({
                                projectId: workbench.project.projectId,
                                actionId: item.action.actionId ?? item.action.id,
                                runId: latestRun.runId,
                              }),
                            )}
                            className="rounded-lg bg-amber-600 px-3 py-2 text-sm font-medium text-white hover:bg-amber-700"
                          >
                            生成 Review
                          </button>
                        ) : null}
                        {item.latestReview && item.assetCandidates.length === 0 ? (
                          <button
                            onClick={() => void runMutation(
                              "发布 Asset Candidate",
                              () => sandboxRepositories.execution.publishAssetCandidate({
                                projectId: workbench.project.projectId,
                                reviewId: item.latestReview?.reviewId ?? item.latestReview?.id ?? "",
                              }),
                            )}
                            className="rounded-lg bg-orange-600 px-3 py-2 text-sm font-medium text-white hover:bg-orange-700"
                          >
                            发布 Asset Candidate
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">风险与商机输入</h2>
            <p className="mt-1 text-sm text-slate-500">这些输入仍然来自项目真实数据，而不是决策层假拼装。</p>
          </div>

          <div className="space-y-3">
            {workbench.risks.length === 0 ? (
              <EmptyCard title="暂无风险信号" description="当前项目还没有写入风险输入。" />
            ) : (
              workbench.risks.map((risk) => (
                <div key={risk.riskId} className="rounded-xl border border-orange-200 bg-orange-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-medium text-orange-900">{risk.description}</div>
                    <span className="rounded-full bg-white px-2 py-0.5 text-xs text-orange-700">
                      {getRiskLabel(risk.riskLevel)}
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-orange-800">{risk.riskType}</div>
                </div>
              ))
            )}
          </div>

          <div className="space-y-3">
            {workbench.opportunities.length === 0 ? (
              <EmptyCard title="暂无商机输入" description="当前项目还没有写入商机信号。" />
            ) : (
              workbench.opportunities.map((opportunity) => (
                <div key={opportunity.opportunityId} className="rounded-xl border border-slate-200 p-4">
                  <div className="font-medium text-slate-900">{opportunity.title}</div>
                  <div className="mt-2 text-sm text-slate-600">{opportunity.description}</div>
                  <div className="mt-2 text-xs text-slate-500">
                    {opportunity.signalType} · 优先级 {opportunity.priority}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <div className="grid grid-cols-[1fr,1fr] gap-6">
        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Execution History Panel</h2>
            <p className="mt-1 text-sm text-slate-500">显式展示 run、connector、writeback 与日志，不在 UI 层伪造成功状态。</p>
          </div>
          <div className="space-y-3">
            {actionLineage.flatMap((item) => item.logs).length === 0 ? (
              <EmptyCard title="当前没有执行历史" description="先完成审批与 Agent trigger，执行日志会在这里出现。" />
            ) : (
              actionLineage.flatMap((item) =>
                item.logs.map((log) => (
                  <div key={log.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-medium text-slate-900">{log.message ?? log.summary}</div>
                      <span className="text-xs text-slate-500">{log.createdAt}</span>
                    </div>
                    <div className="mt-2 text-xs text-slate-500">
                      {log.logType ?? "execution_log"} · {log.runId ?? "no-run"}
                    </div>
                  </div>
                )),
              )
            )}
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Review Panel</h2>
            <p className="mt-1 text-sm text-slate-500">执行完成后，review 由 API 基于 run result 与项目上下文生成并写入 SQLite。</p>
          </div>
          <div className="space-y-3">
            {workbench.reviews.length === 0 ? (
              <EmptyCard title="当前还没有 review" description="完成 writeback 后可以为当前动作生成 review。" />
            ) : (
              workbench.reviews.map((review) => (
                <div key={review.id} className="rounded-xl border border-slate-200 p-4">
                  <div className="font-medium text-slate-900">{review.summary ?? review.resultSummary}</div>
                  <div className="mt-2 text-sm text-slate-600">{review.metricImpact ?? review.attributionSummary}</div>
                  <div className="mt-2 text-xs text-slate-500">
                    {review.keyOutcome ?? review.verdict} · {review.nextSuggestion ?? "待补充下一步建议"}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Asset Candidate Panel</h2>
          <p className="mt-1 text-sm text-slate-500">asset candidate 会保留 source review lineage，并在本地沙箱里先以 draft 形式沉淀。</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {workbench.assetCandidates.length === 0 ? (
            <EmptyCard title="当前没有 asset candidate" description="完成 review 后可以把结论沉淀为资产候选。" />
          ) : (
            workbench.assetCandidates.map((candidate) => (
              <div key={candidate.id} className="rounded-xl border border-slate-200 p-4">
                <div className="font-medium text-slate-900">{candidate.title}</div>
                <div className="mt-2 text-sm text-slate-600">{candidate.rationale}</div>
                <div className="mt-3 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
                  {candidate.contentMarkdown}
                </div>
                <div className="mt-3 text-xs text-slate-500">
                  {candidate.status ?? "draft"} · source review {candidate.sourceReviewId ?? "待补充"}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function formatMetricValue(value: number, unit?: "%" | "currency" | "count" | "score") {
  if (unit === "currency") {
    return `¥${value.toLocaleString("zh-CN")}`;
  }
  if (unit === "%") {
    return `${value}%`;
  }
  return `${value}`;
}

function ContextCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="mt-2 text-base text-slate-800">{value}</div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-2 text-sm font-medium text-slate-900">{value}</div>
    </div>
  );
}

function EvidenceCard({
  title,
  subtitle,
  helper,
  tone = "fact",
}: {
  title: string;
  subtitle?: string;
  helper?: string;
  tone?: "fact" | "method";
}) {
  return (
    <div className={`rounded-xl border p-4 ${tone === "method" ? "border-blue-200 bg-blue-50" : "border-slate-200 bg-white"}`}>
      <div className="text-sm font-medium text-slate-900">{title}</div>
      {(subtitle || helper) && (
        <div className="mt-2 text-xs text-slate-500">
          {subtitle ?? ""}
          {subtitle && helper ? " · " : ""}
          {helper ?? ""}
        </div>
      )}
    </div>
  );
}

function ListCard({
  title,
  items,
  emptyLabel = "当前没有内容",
}: {
  title: string;
  items: string[];
  emptyLabel?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="text-sm font-medium text-slate-900">{title}</div>
      {items.length === 0 ? (
        <div className="mt-2 text-sm text-slate-500">{emptyLabel}</div>
      ) : (
        <ul className="mt-2 space-y-2 text-sm text-slate-700">
          {items.map((item) => (
            <li key={item}>• {item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function EmptyCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 p-4">
      <div className="font-medium text-slate-900">{title}</div>
      <div className="mt-2 text-sm text-slate-500">{description}</div>
    </div>
  );
}

function Tag({ label, tone }: { label: string; tone: "neutral" | "warning" | "success" | "info" }) {
  const toneClass =
    tone === "warning"
      ? "bg-amber-50 text-amber-700"
      : tone === "success"
        ? "bg-emerald-50 text-emerald-700"
        : tone === "info"
          ? "bg-blue-50 text-blue-700"
          : "bg-slate-100 text-slate-700";

  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${toneClass}`}>{label}</span>;
}

function ShellState({ title, description }: { title: string; description: string }) {
  return (
    <div className="p-8">
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
        <p className="mt-2 text-sm text-slate-600">{description}</p>
      </div>
    </div>
  );
}

function iconForPlaceholder(id: string) {
  if (id === "agent") {
    return <Bot className="size-4" />;
  }
  if (id === "execution") {
    return <Zap className="size-4" />;
  }
  if (id === "brain") {
    return <Brain className="size-4" />;
  }
  if (id === "knowledge") {
    return <Database className="size-4" />;
  }
  return <AlertTriangle className="size-4" />;
}
