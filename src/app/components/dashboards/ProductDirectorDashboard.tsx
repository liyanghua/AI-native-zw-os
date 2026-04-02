import { Link } from "react-router";
import { usePilotData } from "../../../data-access/PilotDataProvider";
import { buildRoleDashboardViewModel } from "../../../view-models/dashboards";

export function ProductDirectorDashboard() {
  const { runtime } = usePilotData();
  const viewModel = buildRoleDashboardViewModel("product_rd_director", runtime.getSnapshot());

  return (
    <div className="p-8 space-y-6">
      <section className="grid grid-cols-4 gap-4">
        <MetricCard label="商机池项目" value={viewModel.summary.opportunityCount} />
        <MetricCard label="新品孵化项目" value={viewModel.summary.incubationCount} />
        <MetricCard label="打样风险项目" value={viewModel.summary.samplingRisks} />
        <MetricCard label="可复用 SOP / 规则" value={viewModel.summary.reusableSops} />
      </section>

      <div className="grid grid-cols-[1.1fr,0.9fr] gap-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900">产品研发焦点</h2>
            <p className="mt-1 text-sm text-slate-500">商机、新品定义、打样风险全部回到统一项目对象上。</p>
          </div>
          <div className="space-y-3">
            {viewModel.focusProjects.map((project) => (
              <div key={project.id} className="rounded-xl border border-slate-200 p-4">
                <div className="font-medium text-slate-900">{project.name}</div>
                <div className="mt-1 text-sm text-slate-600">{project.stageLabel} · {project.riskLabel}</div>
                <div className="mt-2 text-sm text-slate-500">{project.blocker}</div>
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
              <h2 className="text-lg font-semibold text-slate-900">商机脉冲</h2>
              <p className="mt-1 text-sm text-slate-500">帮助总监判断哪些机会应该进孵化。</p>
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
              <h2 className="text-lg font-semibold text-slate-900">可复用知识</h2>
              <p className="mt-1 text-sm text-slate-500">让定义、打样、首发 SOP 可以直接复用。</p>
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
