import { Link, useSearchParams } from "react-router";
import { CheckCircle2, Clock, PlayCircle, RotateCcw, Zap } from "lucide-react";
import { usePilotData } from "../../../data-access/PilotDataProvider";
import { useRemoteQuery } from "../../../data-access/useRemoteQuery";
import { getRoleTypeLabel } from "../../../domain/runtime/labels";
import type { ActionDomain, ApprovalStatus, ExecutionStatus, RoleType } from "../../../domain/types/model";
import { QueryStatusPanel } from "../ui/QueryStatusPanel";

const roleOptions: Array<{ value: "all" | RoleType; label: string }> = [
  { value: "all", label: "全部角色" },
  { value: "boss", label: "老板" },
  { value: "operations_director", label: "运营总监" },
  { value: "product_rnd_director", label: "产品研发总监" },
  { value: "visual_director", label: "视觉总监" },
];

const domainOptions: Array<{ value: "all" | ActionDomain; label: string }> = [
  { value: "all", label: "全部动作域" },
  { value: "operations", label: "运营执行" },
  { value: "product_rnd", label: "商品研发" },
  { value: "visual", label: "视觉推进" },
];

const approvalOptions: Array<{ value: "all" | ApprovalStatus; label: string }> = [
  { value: "all", label: "全部审批状态" },
  { value: "pending", label: "待审批" },
  { value: "approved", label: "已批准" },
  { value: "rejected", label: "已驳回" },
  { value: "not_required", label: "无需审批" },
];

const executionOptions: Array<{ value: "all" | ExecutionStatus; label: string }> = [
  { value: "all", label: "全部执行状态" },
  { value: "suggested", label: "建议中" },
  { value: "queued", label: "排队中" },
  { value: "in_progress", label: "执行中" },
  { value: "completed", label: "已完成" },
  { value: "failed", label: "失败" },
];

export function ActionCenter() {
  const { sandboxRepositories } = usePilotData();
  const [searchParams, setSearchParams] = useSearchParams();

  const role = (searchParams.get("role") as RoleType | null) ?? "all";
  const actionDomain = (searchParams.get("actionDomain") as ActionDomain | null) ?? "all";
  const approvalStatus = (searchParams.get("approvalStatus") as ApprovalStatus | null) ?? "all";
  const executionStatus = (searchParams.get("executionStatus") as ExecutionStatus | null) ?? "all";
  const projectId = searchParams.get("projectId") ?? "";

  const { query, isLoading } = useRemoteQuery(
    () =>
      sandboxRepositories.governance.getActionCenter({
        role: role === "all" ? undefined : role,
        actionDomain: actionDomain === "all" ? undefined : actionDomain,
        approvalStatus: approvalStatus === "all" ? undefined : approvalStatus,
        executionStatus: executionStatus === "all" ? undefined : executionStatus,
        projectId: projectId || undefined,
      }),
    [sandboxRepositories, role, actionDomain, approvalStatus, executionStatus, projectId],
    { pollMs: 45_000 },
  );

  if (isLoading && !query) {
    return <ShellState title="正在加载动作中心..." description="正在聚合跨项目动作、审批状态和执行状态。" />;
  }

  if (!query) {
    return <ShellState title="动作中心暂不可用" description="尚未收到治理层动作视图。" />;
  }

  const result = query.data;

  if (query.error && result.items.length === 0) {
    return <ShellState title="动作中心暂不可用" description={query.error} />;
  }

  function updateParam(key: string, value: string) {
    const next = new URLSearchParams(searchParams);
    if (!value || value === "all") {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    setSearchParams(next);
  }

  return (
    <div className="p-8 space-y-6">
      <QueryStatusPanel
        title="动作中心数据状态"
        stale={query.stale}
        partial={query.partial}
        lastUpdatedAt={query.lastUpdatedAt}
        issues={query.issues}
      />

      <section className="grid grid-cols-5 gap-4">
        <MetricCard icon={<Clock className="size-5 text-orange-600" />} label="待审批" value={result.summary.pendingApprovals} />
        <MetricCard icon={<PlayCircle className="size-5 text-blue-600" />} label="排队中" value={result.summary.queued} />
        <MetricCard icon={<Zap className="size-5 text-violet-600" />} label="执行中" value={result.summary.inProgress} />
        <MetricCard icon={<CheckCircle2 className="size-5 text-emerald-600" />} label="已完成" value={result.summary.completed} />
        <MetricCard icon={<RotateCcw className="size-5 text-slate-600" />} label="总动作数" value={result.summary.total} />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-900">跨项目动作筛选</h2>
          <p className="mt-1 text-sm text-slate-500">Batch 5 起动作中心不再只服务单项目，而是统一看跨项目、跨角色、跨动作域的治理状态。</p>
        </div>
        <div className="grid grid-cols-[180px,180px,180px,180px,1fr] gap-4">
          <SelectField
            label="角色"
            value={role}
            options={roleOptions}
            onChange={(value) => updateParam("role", value)}
          />
          <SelectField
            label="动作域"
            value={actionDomain}
            options={domainOptions}
            onChange={(value) => updateParam("actionDomain", value)}
          />
          <SelectField
            label="审批"
            value={approvalStatus}
            options={approvalOptions}
            onChange={(value) => updateParam("approvalStatus", value)}
          />
          <SelectField
            label="执行"
            value={executionStatus}
            options={executionOptions}
            onChange={(value) => updateParam("executionStatus", value)}
          />
          <label className="space-y-2">
            <div className="text-sm font-medium text-slate-700">项目 ID</div>
            <input
              value={projectId}
              onChange={(event) => updateParam("projectId", event.target.value)}
              placeholder="按 projectId 过滤"
              className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm outline-none focus:border-blue-500"
            />
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-900">动作列表</h2>
          <p className="mt-1 text-sm text-slate-500">这里只做统一治理视图；具体证据、决策和执行入口仍然回到项目详情页。</p>
        </div>
        <div className="space-y-3">
          {result.items.length === 0 ? (
            <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">当前筛选条件下没有动作。</div>
          ) : (
            result.items.map((item) => (
              <div key={item.actionId} className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="font-medium text-slate-900">{item.description}</div>
                      <Tag label={item.actionDomain ?? "unknown"} tone="info" />
                      <Tag label={item.approvalStatus} tone={item.approvalStatus === "pending" ? "warning" : item.approvalStatus === "approved" ? "success" : "neutral"} />
                      <Tag label={item.executionStatus} tone={item.executionStatus === "completed" ? "success" : item.executionStatus === "queued" || item.executionStatus === "in_progress" ? "info" : "neutral"} />
                      {item.workflowStatus ? (
                        <Tag
                          label={`runtime:${item.workflowStatus}`}
                          tone={item.workflowStatus === "failed" || item.workflowStatus === "retryable" ? "warning" : item.workflowStatus === "completed" ? "success" : "neutral"}
                        />
                      ) : null}
                    </div>
                    <div className="text-sm text-slate-600">
                      {item.projectName} · {item.owner} · {item.role ? getRoleTypeLabel(item.role) : "未绑定角色"}
                    </div>
                    <div className="text-xs text-slate-500">
                      {item.actionType} · 优先级 {item.priority} · 更新时间 {item.updatedAt}
                    </div>
                    {item.workflowId ? (
                      <div className="text-xs text-slate-500">
                        {item.workflowSummary ?? "workflow"} · {item.workflowId}
                      </div>
                    ) : null}
                  </div>
                  <Link
                    to={`/project/${item.projectId}`}
                    className="rounded-lg bg-white px-3 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50"
                  >
                    查看项目
                  </Link>
                </div>
              </div>
            ))
          )}
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

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <label className="space-y-2">
      <div className="text-sm font-medium text-slate-700">{label}</div>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm outline-none focus:border-blue-500"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
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
