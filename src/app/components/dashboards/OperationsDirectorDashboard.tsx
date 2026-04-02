import { Link } from "react-router";
import { usePilotData } from "../../../data-access/PilotDataProvider";
import { QueryStatusPanel } from "../ui/QueryStatusPanel";

export function OperationsDirectorDashboard() {
  const { repositories } = usePilotData();
  const query = repositories.roleDashboard.getDashboard("growth_director");
  const viewModel = query.data.viewModel;
  const feed = query.data.executionFeed;

  return (
    <div className="p-8 space-y-6">
      <QueryStatusPanel
        title="运营总监视图数据状态"
        stale={query.stale}
        partial={query.partial}
        lastUpdatedAt={query.lastUpdatedAt}
        issues={query.issues}
      />

      <section className="grid grid-cols-4 gap-4">
        <MetricCard label="首发验证项目" value={viewModel.summary.launchCount} />
        <MetricCard label="增长优化项目" value={viewModel.summary.growthCount} />
        <MetricCard label="待审批动作" value={viewModel.summary.pendingApprovals} />
        <MetricCard label="执行中动作" value={viewModel.summary.activeExecutions} />
      </section>

      <div className="grid grid-cols-[1.1fr,0.9fr] gap-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900">增长作战区</h2>
            <p className="mt-1 text-sm text-slate-500">运营总监围绕同一批项目对象观察首发、增长和阻塞。</p>
          </div>
          <div className="space-y-3">
            {viewModel.focusProjects.map((project) => (
              <div key={project.id} className="rounded-xl border border-slate-200 p-4">
                <div className="font-medium text-slate-900">{project.name}</div>
                <div className="mt-1 text-sm text-slate-600">{project.stageLabel} · {project.riskLabel}</div>
                <div className="mt-2 text-sm text-slate-500">{project.latestPulse}</div>
                <Link to={`/project/${project.id}`} className="mt-3 inline-flex text-sm text-blue-600 hover:text-blue-700">
                  进入作战详情
                </Link>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-slate-900">待处理动作</h2>
              <p className="mt-1 text-sm text-slate-500">运营总监需要盯住哪些动作还在等人、等 Agent、等执行端。</p>
            </div>
            <div className="space-y-3">
              {viewModel.pendingActions.map((action) => (
                <div key={action.id} className="rounded-xl bg-slate-50 p-4">
                  <div className="font-medium text-slate-900">{action.title}</div>
                  <div className="mt-1 text-sm text-slate-600">{action.projectName}</div>
                  <div className="mt-2 text-xs text-slate-500">{action.approvalLabel} · {action.riskLabel}</div>
                  <Link to={`/project/${action.projectId}`} className="mt-3 inline-flex text-sm text-blue-600 hover:text-blue-700">
                    去项目处理
                  </Link>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-slate-900">实时执行动态</h2>
              <p className="mt-1 text-sm text-slate-500">体现人、大脑、Agent、执行端协同后的实时结果。</p>
            </div>
            <div className="space-y-3">
              {feed.map((item) => (
                <div key={item.id} className="rounded-xl border border-slate-200 p-4">
                  <div className="text-sm font-medium text-slate-900">{item.summary}</div>
                  <div className="mt-1 text-xs text-slate-500">{item.time}</div>
                </div>
              ))}
            </div>
          </section>
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
