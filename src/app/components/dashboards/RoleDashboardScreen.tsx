import { Link } from "react-router";
import { usePilotData } from "../../../data-access/PilotDataProvider";
import { useRemoteQuery } from "../../../data-access/useRemoteQuery";
import { getAssetTypeLabel, getLifecycleStageLabel, getProjectStatusLabel, getRiskLabel, getRoleTypeLabel } from "../../../domain/runtime/labels";
import type { RoleType } from "../../../domain/types/model";
import { QueryStatusPanel } from "../ui/QueryStatusPanel";

const roleCopy: Record<RoleType, {
  loadingTitle: string;
  loadingDescription: string;
  statusTitle: string;
  projectTitle: string;
  projectDescription: string;
  queueTitle: string;
  queueDescription: string;
}> = {
  boss: {
    loadingTitle: "正在编译老板经营入口...",
    loadingDescription: "从本地 API 拉取老板角色编排结果。",
    statusTitle: "老板角色数据状态",
    projectTitle: "重点项目卡",
    projectDescription: "只保留需要老板继续投入、暂停或拍板的项目。",
    queueTitle: "关键待拍板事项",
    queueDescription: "从同一项目对象编排出的待老板决策项。",
  },
  operations_director: {
    loadingTitle: "正在编译运营总监经营入口...",
    loadingDescription: "从本地 API 拉取推进卡点、推荐动作和升级事项。",
    statusTitle: "运营总监角色数据状态",
    projectTitle: "推进项目卡",
    projectDescription: "围绕推进卡点、经营异常和推荐动作组织视图。",
    queueTitle: "待协调 / 待升级事项",
    queueDescription: "当前需要推进、协调或升级给老板的动作。",
  },
  product_rnd_director: {
    loadingTitle: "正在编译产品研发总监入口...",
    loadingDescription: "当前先加载同源 skeleton，用于承接后续更深的新品/商品逻辑。",
    statusTitle: "产品研发总监角色数据状态",
    projectTitle: "商品方向项目卡",
    projectDescription: "当前以 summary + project cards + recommended actions 作为 Batch 3 骨架。",
    queueTitle: "待澄清 / 待判断事项",
    queueDescription: "先复用同源 decision queue，后续再加研发专属对象。",
  },
  visual_director: {
    loadingTitle: "正在编译视觉总监入口...",
    loadingDescription: "当前先加载同源 skeleton，用于承接后续更深的素材与模板逻辑。",
    statusTitle: "视觉总监角色数据状态",
    projectTitle: "表达重点项目卡",
    projectDescription: "当前以 summary + project cards + recommended actions 作为 Batch 3 骨架。",
    queueTitle: "创意动作 / 支持事项",
    queueDescription: "先用同源 decision queue 承接表达类动作和支持优先级。",
  },
};

export function RoleDashboardScreen({ role }: { role: RoleType }) {
  const { sandboxRepositories } = usePilotData();
  const copy = roleCopy[role];
  const { query, isLoading } = useRemoteQuery(
    () => sandboxRepositories.roles.getDashboard(role),
    [sandboxRepositories, role],
    { pollMs: 45_000 },
  );

  if (isLoading && !query) {
    return <ShellState title={copy.loadingTitle} description={copy.loadingDescription} />;
  }

  if (!query) {
    return <ShellState title="角色入口暂不可用" description="尚未收到角色 dashboard 结果。" />;
  }

  const dashboard = query.data;

  if (query.error && dashboard.projectCards.length === 0) {
    return <ShellState title="角色入口暂不可用" description={query.error} />;
  }

  return (
    <div className="p-8 space-y-6">
      <QueryStatusPanel
        title={copy.statusTitle}
        stale={query.stale}
        partial={query.partial}
        lastUpdatedAt={query.lastUpdatedAt}
        issues={query.issues}
      />

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <h1 className="text-2xl font-semibold text-slate-900">{dashboard.summary.headline}</h1>
            <p className="mt-2 text-sm text-slate-600">{dashboard.summary.narrative}</p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
              <span className="rounded-full bg-slate-100 px-3 py-1">{getRoleTypeLabel(dashboard.role)}</span>
              <span className="rounded-full bg-slate-100 px-3 py-1">{dashboard.roleProfile.goalFocus}</span>
            </div>
          </div>
          <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
            <div className="font-medium text-slate-900">{dashboard.roleProfile.roleName}</div>
            <div className="mt-2">{dashboard.roleProfile.summaryStyle}</div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-4 xl:grid-cols-5">
        {dashboard.summary.metrics.map((metric) => (
          <MetricCard key={metric.label} label={metric.label} value={metric.value} />
        ))}
      </section>

      <div className="grid grid-cols-[1.15fr,0.85fr] gap-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900">{copy.projectTitle}</h2>
            <p className="mt-1 text-sm text-slate-500">{copy.projectDescription}</p>
          </div>
          <div className="space-y-3">
            {dashboard.projectCards.length === 0 ? (
              <EmptyCard label="当前没有可展示的项目卡。" />
            ) : (
              dashboard.projectCards.map((project) => (
                <div key={project.projectId} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="font-medium text-slate-900">{project.projectName}</div>
                      <div className="mt-1 text-sm text-slate-600">
                        {getLifecycleStageLabel(project.stage)} · {getProjectStatusLabel(project.status)}
                      </div>
                      <div className="mt-3 text-sm text-slate-700">{project.headlineProblem}</div>
                      <div className="mt-2 text-xs text-slate-500">机会：{project.headlineOpportunity}</div>
                      <div className="mt-1 text-xs text-slate-500">风险：{project.headlineRisk}</div>
                      <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
                        {project.primaryRecommendation}
                      </div>
                      {project.workflowStatus || project.workflowSummary ? (
                        <div className="mt-2 text-xs text-slate-500">
                          {project.workflowStatus ?? "workflow"} · {project.workflowSummary ?? "待补充 workflow 摘要"}
                        </div>
                      ) : null}
                    </div>
                    <Link
                      to={`/project/${project.projectId}`}
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

        <section className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-slate-900">{copy.queueTitle}</h2>
              <p className="mt-1 text-sm text-slate-500">{copy.queueDescription}</p>
            </div>
            <div className="space-y-3">
              {dashboard.decisionQueue.length === 0 ? (
                <EmptyCard label="当前没有待处理决策项。" />
              ) : (
                dashboard.decisionQueue.map((item) => (
                  <div key={`${item.decisionId}-${item.projectId}-${item.requiredOwner}`} className="rounded-xl bg-slate-50 p-4">
                    <div className="font-medium text-slate-900">{item.projectName}</div>
                    <div className="mt-1 text-sm text-slate-700">{item.requiredAction}</div>
                    <div className="mt-2 text-xs text-slate-500">
                      {item.requiredOwner} · {item.requiresApproval ? "需要审批" : "无需审批"}
                    </div>
                    {item.actionDomain || item.approvalStatus || item.executionStatus ? (
                      <div className="mt-1 text-xs text-slate-500">
                        {item.actionDomain ?? "unknown"} · {item.approvalStatus ?? "n/a"} · {item.executionStatus ?? "suggested"}
                      </div>
                    ) : null}
                    <Link to={`/project/${item.projectId}`} className="mt-3 inline-flex text-sm text-blue-600 hover:text-blue-700">
                      去项目详情
                    </Link>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-slate-900">高风险 / 高机会</h2>
              <p className="mt-1 text-sm text-slate-500">角色入口只看摘要，具体证据和决策继续进入项目详情页。</p>
            </div>
            <div className="space-y-3">
              {dashboard.riskCards.map((risk) => (
                <div key={`risk-${risk.projectId}`} className="rounded-xl border border-slate-200 p-4">
                  <div className="font-medium text-slate-900">{risk.projectName}</div>
                  <div className="mt-1 text-xs text-slate-500">{getRiskLabel(risk.riskLevel)}</div>
                  <div className="mt-2 text-sm text-slate-700">{risk.riskSummary}</div>
                </div>
              ))}
              {dashboard.opportunityCards.map((opportunity) => (
                <div key={`opportunity-${opportunity.projectId}`} className="rounded-xl border border-slate-200 p-4">
                  <div className="font-medium text-slate-900">{opportunity.projectName}</div>
                  <div className="mt-2 text-sm text-slate-700">{opportunity.opportunitySummary}</div>
                  <div className="mt-2 text-xs text-slate-500">{opportunity.whyNow}</div>
                </div>
              ))}
              {dashboard.riskCards.length === 0 && dashboard.opportunityCards.length === 0 ? (
                <EmptyCard label="当前没有高风险或高机会摘要。" />
              ) : null}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-slate-900">可复制经验 / 资产摘要</h2>
              <p className="mt-1 text-sm text-slate-500">使用同源知识资产摘要，不单独维护角色页真相。</p>
            </div>
            <div className="space-y-3">
              {dashboard.assetSummary.length === 0 ? (
                <EmptyCard label="当前没有可展示的知识资产摘要。" />
              ) : (
                dashboard.assetSummary.map((asset) => (
                  <div key={asset.assetId} className="rounded-xl border border-slate-200 p-4">
                    <div className="mb-1 text-xs font-medium text-blue-700">{getAssetTypeLabel(asset.assetType)}</div>
                    <div className="font-medium text-slate-900">{asset.title}</div>
                    <div className="mt-2 text-sm text-slate-700">{asset.summary}</div>
                    {asset.sourceProjectId ? (
                      <Link to={`/project/${asset.sourceProjectId}`} className="mt-3 inline-flex text-sm text-blue-600 hover:text-blue-700">
                        查看来源项目
                      </Link>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </section>
        </section>
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="text-2xl font-semibold text-slate-900">{value}</div>
      <div className="mt-1 text-sm text-slate-500">{label}</div>
    </div>
  );
}

function EmptyCard({ label }: { label: string }) {
  return <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">{label}</div>;
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
