import { Link } from "react-router";
import {
  AlertCircle,
  ArrowRight,
  Package,
  RefreshCw,
  Rocket,
  TrendingUp,
  Zap,
} from "lucide-react";
import { usePilotData } from "../../../data-access/PilotDataProvider";
import { useRemoteQuery } from "../../../data-access/useRemoteQuery";
import { QueryStatusPanel } from "../ui/QueryStatusPanel";

const stageIcons = {
  opportunity_pool: TrendingUp,
  new_product_incubation: Package,
  launch_validation: Rocket,
  growth_optimization: Zap,
  review_capture: RefreshCw,
} as const;

export function LifecycleOverview() {
  const { sandboxRepositories } = usePilotData();
  const { query, isLoading } = useRemoteQuery(
    () => sandboxRepositories.lifecycle.getOverview(),
    [sandboxRepositories],
    { pollMs: 45_000 },
  );

  if (isLoading && !query) {
    return <ShellState title="正在连接本地沙箱数据..." description="从 SQLite 经本地 API 拉取生命周期项目列表。" />;
  }

  if (!query) {
    return <ShellState title="生命周期数据暂不可用" description="本地 API 尚未返回结果。" />;
  }

  const overview = query.data;

  if (query.error && overview.stageCards.every((card) => card.total === 0)) {
    return (
      <ShellState
        title="生命周期列表暂时不可用"
        description={query.error}
      />
    );
  }

  return (
    <div className="p-8 space-y-6">
      <QueryStatusPanel
        title="生命周期数据状态"
        stale={query.stale}
        partial={query.partial}
        lastUpdatedAt={query.lastUpdatedAt}
        issues={query.issues}
      />

      <section className="grid grid-cols-4 gap-4">
        <MetricCard label="在途项目" value={overview.summary.liveProjects} />
        <MetricCard label="阻塞项目" value={overview.summary.blockedProjects} />
        <MetricCard label="高优先级项目" value={overview.summary.highPriorityProjects} />
        <MetricCard label="已闭环项目" value={overview.summary.closedProjects} />
      </section>

      <section>
        <h2 className="mb-4 text-base font-semibold text-slate-900">商品经营主线</h2>
        <div className="grid grid-cols-5 gap-4">
          {overview.stageCards.map((stage) => {
            const Icon = stageIcons[stage.stage];
            return (
              <Link
                key={stage.stage}
                to={stage.link}
                className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-blue-300 hover:shadow-sm"
              >
                <div className="mb-3 flex items-center justify-between">
                  <Icon className="size-5 text-slate-700" />
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
                    {stage.total} 项目
                  </span>
                </div>
                <div className="text-2xl font-semibold text-slate-900">{stage.total}</div>
                <div className="mt-1 text-sm text-slate-700">{stage.stageLabel}</div>
                <div className="mt-3 text-xs text-slate-500">{stage.summary}</div>
              </Link>
            );
          })}
        </div>
      </section>

      <div className="grid grid-cols-[1.2fr,0.8fr] gap-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900">当前最值得推进的项目</h2>
            <p className="mt-1 text-sm text-slate-500">Batch 1 先把真实项目列表、问题和当前状态从本地沙箱打通。</p>
          </div>
          <div className="space-y-3">
            {overview.featuredProjects.length === 0 ? (
              <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                当前没有已 seed 的演示项目。
              </div>
            ) : (
              overview.featuredProjects.map((project) => (
                <Link
                  key={project.projectId}
                  to={`/project/${project.projectId}`}
                  className="block rounded-xl border border-slate-200 p-4 hover:bg-slate-50"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="font-medium text-slate-900">{project.name}</div>
                      <div className="mt-1 text-sm text-slate-600">
                        {project.stageLabel} · {project.statusLabel}
                      </div>
                      <div className="mt-2 text-sm text-slate-700">{project.reason}</div>
                      <div className="mt-2 text-xs text-slate-500">{project.latestSummary}</div>
                    </div>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
                      {project.priorityLabel}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 size-5 text-orange-600" />
            <div>
              <div className="font-medium text-slate-900">{overview.outOfScopeStage.stageLabel}</div>
              <div className="mt-1 text-sm text-slate-600">{overview.outOfScopeStage.description}</div>
              <Link
                to={overview.outOfScopeStage.link}
                className="mt-3 inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
              >
                查看范围说明
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="text-2xl font-semibold text-slate-900">{value}</div>
      <div className="mt-1 text-sm text-slate-500">{label}</div>
    </div>
  );
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
