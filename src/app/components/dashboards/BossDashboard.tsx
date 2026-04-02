import { Link } from "react-router";
import { usePilotData } from "../../../data-access/PilotDataProvider";
import { buildRoleDashboardViewModel } from "../../../view-models/dashboards";

export function BossDashboard() {
  const { runtime } = usePilotData();
  const viewModel = buildRoleDashboardViewModel("ceo", runtime.getSnapshot());

  return (
    <div className="p-8 space-y-6">
      <section className="grid grid-cols-4 gap-4">
        <MetricCard label="在途项目" value={viewModel.summary.liveProjects} />
        <MetricCard label="高风险项目" value={viewModel.summary.highRiskProjects} />
        <MetricCard label="待审批动作" value={viewModel.summary.pendingApprovals} />
        <MetricCard label="已沉淀资产" value={viewModel.summary.publishedAssets} />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-900">今日经营脉冲</h2>
          <p className="mt-1 text-sm text-slate-500">老板优先看到需要拍板和会影响主线推进的事情。</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {viewModel.pulses.map((pulse) => (
            <div key={pulse.id} className="rounded-xl border border-slate-200 p-4">
              <div className="font-medium text-slate-900">{pulse.summary}</div>
              {pulse.relatedProjectId && (
                <Link to={`/project/${pulse.relatedProjectId}`} className="mt-3 inline-flex text-sm text-blue-600 hover:text-blue-700">
                  去项目详情
                </Link>
              )}
            </div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-[1.1fr,0.9fr] gap-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900">关键项目</h2>
            <p className="mt-1 text-sm text-slate-500">同一项目对象在老板视图中只展示“该不该拍板”。</p>
          </div>
          <div className="space-y-3">
            {viewModel.focusProjects.map((project) => (
              <div key={project.id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-medium text-slate-900">{project.name}</div>
                    <div className="mt-1 text-sm text-slate-600">{project.stageLabel} · {project.healthLabel}</div>
                    <div className="mt-2 text-sm text-slate-500">{project.latestPulse}</div>
                  </div>
                  <Link to={`/project/${project.id}`} className="rounded-lg bg-white px-3 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50">
                    查看
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900">待老板拍板</h2>
            <p className="mt-1 text-sm text-slate-500">动作中心里最需要老板介入的动作摘要。</p>
          </div>
          <div className="space-y-3">
            {viewModel.pendingActions.map((action) => (
              <div key={action.id} className="rounded-xl bg-slate-50 p-4">
                <div className="font-medium text-slate-900">{action.title}</div>
                <div className="mt-1 text-sm text-slate-600">{action.projectName}</div>
                <div className="mt-2 text-xs text-slate-500">{action.approvalLabel} · {action.riskLabel}</div>
                <Link to={`/project/${action.projectId}`} className="mt-3 inline-flex text-sm text-blue-600 hover:text-blue-700">
                  去项目拍板
                </Link>
              </div>
            ))}
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
