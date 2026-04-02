import { Link } from "react-router";
import { usePilotData } from "../../../data-access/PilotDataProvider";
import { QueryStatusPanel } from "../ui/QueryStatusPanel";

export function VisualDirectorDashboard() {
  const { repositories } = usePilotData();
  const query = repositories.roleDashboard.getDashboard("visual_director");
  const viewModel = query.data.viewModel;

  return (
    <div className="p-8 space-y-6">
      <QueryStatusPanel
        title="视觉总监视图数据状态"
        stale={query.stale}
        partial={query.partial}
        lastUpdatedAt={query.lastUpdatedAt}
        issues={query.issues}
      />

      <section className="grid grid-cols-4 gap-4">
        <MetricCard label="待表达项目" value={viewModel.summary.expressionProjects} />
        <MetricCard label="沉淀模板" value={viewModel.summary.publishedTemplates} />
        <MetricCard label="执行中素材" value={viewModel.summary.runningAssets} />
        <MetricCard label="模板复用线索" value={viewModel.summary.draftTemplates} />
      </section>

      <div className="grid grid-cols-[1.05fr,0.95fr] gap-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900">表达重点项目</h2>
            <p className="mt-1 text-sm text-slate-500">视觉总监看的仍然是同一批项目，只是更关注表达准备和模板复用。</p>
          </div>
          <div className="space-y-3">
            {viewModel.focusProjects.map((project) => (
              <div key={project.id} className="rounded-xl border border-slate-200 p-4">
                <div className="font-medium text-slate-900">{project.name}</div>
                <div className="mt-1 text-sm text-slate-600">{project.stageLabel} · {project.healthLabel}</div>
                <div className="mt-2 text-sm text-slate-500">{project.latestPulse}</div>
                <Link to={`/project/${project.id}`} className="mt-3 inline-flex text-sm text-blue-600 hover:text-blue-700">
                  打开项目
                </Link>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-slate-900">表达脉冲</h2>
              <p className="mt-1 text-sm text-slate-500">识别哪些项目需要先补表达，而不是先做更多素材。</p>
            </div>
            <div className="space-y-3">
              {viewModel.pulses.map((pulse) => (
                <div key={pulse.id} className="rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
                  {pulse.summary}
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-slate-900">可复用模板</h2>
              <p className="mt-1 text-sm text-slate-500">模板沉淀已经进入统一知识库，而不是散落在页面里。</p>
            </div>
            <div className="space-y-3">
              {viewModel.knowledge.map((item) => (
                <div key={item.id} className="rounded-xl border border-slate-200 p-4">
                  <div className="mb-1 text-xs font-medium text-blue-700">{item.typeLabel}</div>
                  <div className="font-medium text-slate-900">{item.title}</div>
                  <div className="mt-2 text-sm text-slate-600">{item.summary}</div>
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
