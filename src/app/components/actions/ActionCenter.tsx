import { Link } from "react-router";
import { CheckCircle2, Clock, PlayCircle, RotateCcw, Zap } from "lucide-react";
import { usePilotData } from "../../../data-access/PilotDataProvider";
import { buildActionCenterViewModel } from "../../../view-models/actionCenter";

export function ActionCenter() {
  const {
    runtime,
    approveAction,
    rejectAction,
    writeExecutionResult,
  } = usePilotData();

  const actions = runtime.actionGateway.listActions();
  const executionLogs = runtime.actionGateway.listExecutionLogs();
  const viewModel = buildActionCenterViewModel({ actions, executionLogs });

  return (
    <div className="p-8 space-y-6">
      <section className="grid grid-cols-5 gap-4">
        <MetricCard icon={<Clock className="size-5 text-orange-600" />} label="待审批" value={viewModel.summary.pending} />
        <MetricCard icon={<PlayCircle className="size-5 text-blue-600" />} label="排队中" value={viewModel.summary.queued} />
        <MetricCard icon={<Zap className="size-5 text-violet-600" />} label="执行中" value={viewModel.summary.inProgress} />
        <MetricCard icon={<CheckCircle2 className="size-5 text-emerald-600" />} label="已完成" value={viewModel.summary.completed} />
        <MetricCard icon={<RotateCcw className="size-5 text-slate-600" />} label="已回滚" value={viewModel.summary.rolledBack} />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-900">待审批动作</h2>
          <p className="mt-1 text-sm text-slate-500">让老板和总监只处理真正需要拍板的动作。</p>
        </div>
        <div className="space-y-3">
          {viewModel.columns.pendingApprovals.map((pending) => (
            <div key={pending.id} className="rounded-xl border border-slate-200 p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="font-medium text-slate-900">{pending.title}</div>
                    <span className="rounded-full bg-orange-50 px-2 py-0.5 text-xs text-orange-700">{pending.riskLabel}</span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">{pending.approvalLabel}</span>
                  </div>
                  <p className="text-sm text-slate-600">{pending.summary}</p>
                  <Link to={`/project/${pending.projectId}`} className="text-sm text-blue-600 hover:text-blue-700">
                    查看项目详情
                  </Link>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => rejectAction(pending.id, "暂缓执行，先保留现状")}
                    className="rounded-lg bg-white px-3 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50"
                  >
                    拒绝
                  </button>
                  <button
                    onClick={() => approveAction(pending.id)}
                    className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    批准
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-3 gap-6">
        <ColumnCard
          title="排队中"
          items={viewModel.columns.queued}
          actionLabel="写回完成"
          onAction={(actionId) =>
            writeExecutionResult(actionId, {
              actorId: "automation.executor",
              actorType: "automation",
              status: "completed",
              summary: "动作已执行完成，并回写核心结果。",
            })
          }
        />
        <ColumnCard
          title="执行中"
          items={viewModel.columns.inProgress}
          actionLabel="回写进度"
          onAction={(actionId) =>
            writeExecutionResult(actionId, {
              actorId: "scenario.agent",
              actorType: "agent",
              status: "completed",
              summary: "场景 Agent 已完成执行并同步回写结果。",
            })
          }
        />
        <ColumnCard title="已完成" items={viewModel.columns.completed} />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-900">执行动态</h2>
          <p className="mt-1 text-sm text-slate-500">让动作从建议到执行的链路完全可追踪。</p>
        </div>
        <div className="space-y-3">
          {viewModel.feed.map((item) => (
            <div key={item.id} className="flex items-start gap-3 rounded-xl bg-slate-50 p-4">
              <div className="mt-1 h-2 w-2 rounded-full bg-blue-500" />
              <div className="flex-1">
                <div className="text-sm font-medium text-slate-900">{item.summary}</div>
                <div className="mt-1 text-xs text-slate-500">
                  {item.statusLabel} · {item.time}
                </div>
              </div>
            </div>
          ))}
        </div>
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

function ColumnCard({
  title,
  items,
  actionLabel,
  onAction,
}: {
  title: string;
  items: Array<{
    id: string;
    title: string;
    projectId: string;
    executionLabel: string;
  }>;
  actionLabel?: string;
  onAction?: (actionId: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      <div className="mt-4 space-y-3">
        {items.length === 0 && <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">当前没有对应动作。</div>}
        {items.map((item) => (
          <div key={item.id} className="rounded-xl border border-slate-200 p-4">
            <div className="font-medium text-slate-900">{item.title}</div>
            <div className="mt-1 text-xs text-slate-500">{item.executionLabel}</div>
            <div className="mt-3 flex items-center justify-between">
              <Link to={`/project/${item.projectId}`} className="text-sm text-blue-600 hover:text-blue-700">
                查看项目
              </Link>
              {actionLabel && onAction && (
                <button
                  onClick={() => onAction(item.id)}
                  className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
                >
                  {actionLabel}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
