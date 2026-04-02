import { Link } from "react-router";
import type { ReactNode } from "react";
import { AlertTriangle, ArrowRight, Clock, ShieldCheck, Star } from "lucide-react";
import { usePilotData } from "../../../data-access/PilotDataProvider";
import { useRemoteQuery } from "../../../data-access/useRemoteQuery";
import type { LifecycleStage } from "../../../domain/types/model";
import { QueryStatusPanel } from "../ui/QueryStatusPanel";

const descriptions: Record<LifecycleStage, string> = {
  opportunity_pool: "把商机信号先收敛成项目列表，为后续立项和归一做准备。",
  new_product_incubation: "围绕定义、打样和表达准备形成可推进项目。",
  launch_validation: "Batch 1 重点演示项目详情与问题识别，观察真实 KPI 和风险输入。",
  growth_optimization: "给老板与总监提供可推进项目，判断是否要调整增长策略。",
  legacy_upgrade: "本轮仍保留为试点范围外页面。",
  review_capture: "为后续 review / asset loop 留出真实项目与占位数据。",
};

export function LifecycleStageBoard({ stage }: { stage: LifecycleStage }) {
  const { sandboxRepositories } = usePilotData();
  const { query, isLoading } = useRemoteQuery(
    () => sandboxRepositories.lifecycle.getStage(stage),
    [sandboxRepositories, stage],
    { pollMs: 45_000 },
  );

  if (isLoading && !query) {
    return <ShellState title="正在拉取阶段项目..." description="本地 API 正在返回该阶段的项目列表。" />;
  }

  if (!query) {
    return <ShellState title="阶段数据暂不可用" description="尚未收到阶段查询结果。" />;
  }

  const board = query.data;

  return (
    <div className="p-8 space-y-6">
      <QueryStatusPanel
        title="阶段站数据状态"
        stale={query.stale}
        partial={query.partial}
        lastUpdatedAt={query.lastUpdatedAt}
        issues={query.issues}
      />

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h1 className="text-2xl font-semibold text-slate-900">{board.stageLabel}</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-600">{descriptions[stage]}</p>
      </section>

      <section className="grid grid-cols-4 gap-4">
        <MetricCard icon={<Star className="size-5 text-slate-700" />} label="项目总数" value={board.summary.total} />
        <MetricCard icon={<Clock className="size-5 text-orange-600" />} label="阻塞项目" value={board.summary.blockedProjects} />
        <MetricCard icon={<AlertTriangle className="size-5 text-red-600" />} label="有风险输入" value={board.summary.highRiskProjects} />
        <MetricCard icon={<ShieldCheck className="size-5 text-blue-600" />} label="已闭环" value={board.summary.closedProjects} />
      </section>

      {board.projects.length === 0 ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
          当前阶段还没有已 seed 的演示项目。Batch 1 只接入了 3 个本地样例项目，所以部分阶段会显示为空。
        </section>
      ) : (
        <section className="space-y-3">
          {board.projects.map((project) => (
            <div key={project.projectId} className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-start justify-between gap-6">
                <div className="flex-1 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold text-slate-900">{project.name}</h2>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">{project.statusLabel}</span>
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">{project.category}</span>
                    <span className="rounded-full bg-orange-50 px-2 py-0.5 text-xs text-orange-700">风险 {project.riskCount}</span>
                  </div>
                  <p className="text-sm text-slate-600">{project.summary}</p>
                  <div className="grid grid-cols-3 gap-3">
                    <ContextCard label="当前问题" value={project.currentProblem} />
                    <ContextCard label="当前目标" value={project.currentGoal} />
                    <ContextCard label="当前风险" value={project.currentRisk} />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {project.topMetrics.map((metric) => (
                      <span
                        key={`${project.projectId}-${metric.key}`}
                        className="rounded-full bg-slate-50 px-3 py-1 text-xs text-slate-600 ring-1 ring-slate-200"
                      >
                        {metric.label} {formatMetricValue(metric.value, metric.unit)}
                      </span>
                    ))}
                  </div>
                  <div className="text-xs text-slate-500">负责人：{project.owner} · 优先级 {project.priority}</div>
                </div>
                <div className="w-44 space-y-3">
                  <div className="rounded-xl border border-slate-200 p-4 text-right">
                    <div className="text-lg font-semibold text-slate-900">{project.stageLabel}</div>
                    <div className="mt-1 text-xs text-slate-500">最近更新 {project.updatedAt.slice(11, 16)}</div>
                  </div>
                  <Link
                    to={`/project/${project.projectId}`}
                    className="inline-flex w-full items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                  >
                    打开项目
                    <ArrowRight className="ml-2 size-4" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      {icon}
      <div className="mt-3 text-2xl font-semibold text-slate-900">{value}</div>
      <div className="mt-1 text-sm text-slate-500">{label}</div>
    </div>
  );
}

function ContextCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-2 text-sm text-slate-700">{value}</div>
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
