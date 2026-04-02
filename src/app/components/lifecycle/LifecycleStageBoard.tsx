import { Link } from "react-router";
import { AlertTriangle, ArrowRight, Bot, CheckCircle2, Clock, ShieldCheck } from "lucide-react";
import { usePilotData } from "../../../data-access/PilotDataProvider";
import { buildLifecycleStageViewModel } from "../../../view-models/lifecycle";
import type { LifecycleStage } from "../../../domain/types/model";

const descriptions: Record<LifecycleStage, string> = {
  opportunity_pool: "把商机信号收敛成统一项目对象，先判断是否值得正式推进。",
  new_product_incubation: "围绕定义、打样、价格和表达准备，明确能否进入首发验证。",
  launch_validation: "观察首发 KPI、审批与执行写回，判断是调整、放量还是暂缓。",
  growth_optimization: "围绕增长效率、库存、预算和执行协同持续优化项目表现。",
  legacy_upgrade: "本轮试点不接老品升级真实数据。",
  review_capture: "把复盘沉淀和资产发布留在统一项目对象之下完成收口。",
};

export function LifecycleStageBoard({ stage }: { stage: LifecycleStage }) {
  const { runtime } = usePilotData();
  const projects = runtime.projectGateway.listProjectsByStage(stage);
  const snapshots = projects.map((project) => runtime.projectGateway.getProjectRealtimeSnapshot(project.id));
  const viewModel = buildLifecycleStageViewModel(stage, projects, snapshots);

  return (
    <div className="p-8 space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h1 className="text-2xl font-semibold text-slate-900">{viewModel.stageLabel}</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-600">{descriptions[stage]}</p>
      </section>

      <section className="grid grid-cols-5 gap-4">
        <MetricCard icon={<CheckCircle2 className="size-5 text-slate-700" />} label="项目总数" value={viewModel.summary.total} />
        <MetricCard icon={<Clock className="size-5 text-orange-600" />} label="待审批" value={viewModel.summary.pendingApprovals} />
        <MetricCard icon={<AlertTriangle className="size-5 text-red-600" />} label="高风险" value={viewModel.summary.highRiskProjects} />
        <MetricCard icon={<ShieldCheck className="size-5 text-blue-600" />} label="阻塞项目" value={viewModel.summary.blockedProjects} />
        <MetricCard icon={<Bot className="size-5 text-emerald-600" />} label="活跃 Agent" value={viewModel.summary.runningAgents} />
      </section>

      <section className="space-y-3">
        {viewModel.projects.map((project) => (
          <div key={project.id} className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-start justify-between gap-6">
              <div className="flex-1 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold text-slate-900">{project.name}</h2>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">{project.healthLabel}</span>
                  <span className="rounded-full bg-orange-50 px-2 py-0.5 text-xs text-orange-700">{project.riskLabel}</span>
                  <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">{project.pendingApprovalLabel}</span>
                </div>
                <p className="text-sm text-slate-600">{project.targetSummary}</p>
                <div className="flex flex-wrap gap-2">
                  {project.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-slate-50 px-3 py-1 text-xs text-slate-600 ring-1 ring-slate-200">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-900">{project.focusMetricLabel}</span>
                    <span className="text-slate-700">{project.focusMetricValue}</span>
                  </div>
                  <div className="mb-2 h-2 overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full rounded-full bg-blue-600" style={{ width: project.progressLabel }} />
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{project.supportMetricLabel}</span>
                    <span>{project.supportMetricValue}</span>
                  </div>
                </div>
                <div className="text-sm text-slate-600">{project.latestPulse}</div>
                <div className="text-xs text-slate-500">{project.coordinationSummary}</div>
                <div className="text-xs text-slate-500">下一步：{project.nextStep}</div>
              </div>
              <div className="w-44 space-y-3">
                <div className="rounded-xl border border-slate-200 p-4 text-right">
                  <div className="text-2xl font-semibold text-slate-900">{project.progressLabel}</div>
                  <div className="mt-1 text-xs text-slate-500">主线推进度</div>
                </div>
                <Link
                  to={`/project/${project.id}`}
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
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
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
