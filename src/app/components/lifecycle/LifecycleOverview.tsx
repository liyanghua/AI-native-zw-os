import { Link } from "react-router";
import {
  AlertCircle,
  ArrowRight,
  Bot,
  CheckCircle2,
  Clock,
  Package,
  RefreshCw,
  Rocket,
  TrendingUp,
  Zap,
} from "lucide-react";
import { usePilotData } from "../../../data-access/PilotDataProvider";
import { QueryStatusPanel } from "../ui/QueryStatusPanel";

const stageIcons = {
  opportunity_pool: TrendingUp,
  new_product_incubation: Package,
  launch_validation: Rocket,
  growth_optimization: Zap,
  review_capture: RefreshCw,
} as const;

export function LifecycleOverview() {
  const { repositories } = usePilotData();
  const query = repositories.lifecycle.getOverview();
  const viewModel = query.data.viewModel;

  return (
    <div className="p-8 space-y-6">
      <QueryStatusPanel
        title="生命周期数据状态"
        stale={query.stale}
        partial={query.partial}
        lastUpdatedAt={query.lastUpdatedAt}
        issues={query.issues}
      />

      <section className="grid grid-cols-5 gap-4">
        <MetricCard label="在途项目" value={viewModel.summary.liveProjects} />
        <MetricCard label="待审批" value={viewModel.summary.pendingApprovals} />
        <MetricCard label="阻塞项目" value={viewModel.summary.blockedProjects} />
        <MetricCard label="活跃 Agent" value={viewModel.summary.activeAgents} />
        <MetricCard label="已入库资产" value={viewModel.summary.publishedAssets} />
      </section>

      <section>
        <h2 className="mb-4 text-base font-semibold text-slate-900">商品经营主线</h2>
        <div className="grid grid-cols-5 gap-4">
          {viewModel.stageCards.map((stage) => {
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
                    {stage.pendingApprovals} 待处理
                  </span>
                </div>
                <div className="text-2xl font-semibold text-slate-900">{stage.total}</div>
                <div className="mt-1 text-sm text-slate-700">{stage.stageLabel}</div>
                <div className="mt-3 text-xs text-slate-500">{stage.leadingPulse}</div>
              </Link>
            );
          })}
        </div>
      </section>

      <div className="grid grid-cols-[1fr,1fr] gap-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900">最需要人工拍板</h2>
            <p className="mt-1 text-sm text-slate-500">把老板和总监最该看的项目拉到最前面。</p>
          </div>
          <div className="space-y-3">
            {viewModel.interventions.map((item) => (
              <Link key={item.id} to={`/project/${item.projectId}`} className="block rounded-xl border border-slate-200 p-4 hover:bg-slate-50">
                <div className="font-medium text-slate-900">{item.name}</div>
                <div className="mt-1 text-sm text-slate-600">{item.stageLabel}</div>
                <div className="mt-2 text-sm text-slate-600">{item.reason}</div>
                <div className="mt-2 text-xs text-slate-500">{item.latestPulse}</div>
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900">人 × 大脑 × Agent × 执行</h2>
            <p className="mt-1 text-sm text-slate-500">看正在推进的协同链路，而不是静态页面指标。</p>
          </div>
          <div className="space-y-3">
            {viewModel.agentActivities.map((item) => (
              <Link key={item.id} to={`/project/${item.projectId}`} className="block rounded-xl bg-slate-50 p-4 hover:bg-slate-100">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-medium text-slate-900">{item.projectName}</div>
                    <div className="mt-1 text-sm text-slate-600">{item.stageLabel}</div>
                    <div className="mt-2 text-sm text-slate-700">{item.agentLabel}</div>
                    <div className="mt-1 text-sm text-slate-500">{item.summary}</div>
                  </div>
                  <span className="rounded-full bg-white px-2 py-0.5 text-xs text-slate-700 ring-1 ring-slate-200">
                    {item.statusLabel}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 size-5 text-orange-600" />
          <div>
            <div className="font-medium text-slate-900">{viewModel.outOfScopeStage.stageLabel}</div>
            <div className="mt-1 text-sm text-slate-600">{viewModel.outOfScopeStage.description}</div>
            <Link to={viewModel.outOfScopeStage.link} className="mt-3 inline-flex items-center text-sm text-blue-600 hover:text-blue-700">
              查看范围说明
              <ArrowRight className="ml-2 size-4" />
            </Link>
          </div>
        </div>
      </section>
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
