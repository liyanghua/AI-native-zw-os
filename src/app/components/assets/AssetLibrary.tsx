import { useState } from "react";
import { Link } from "react-router";
import { usePilotData } from "../../../data-access/PilotDataProvider";
import type { AssetType, LifecycleStage, RoleView } from "../../../domain/types/model";
import { QueryStatusPanel } from "../ui/QueryStatusPanel";

const stageOptions: Array<{ value: "all" | LifecycleStage; label: string }> = [
  { value: "all", label: "全部阶段" },
  { value: "new_product_incubation", label: "新品孵化" },
  { value: "launch_validation", label: "首发验证" },
  { value: "growth_optimization", label: "增长优化" },
  { value: "review_capture", label: "复盘沉淀" },
];

const typeOptions: Array<{ value: "all" | AssetType; label: string }> = [
  { value: "all", label: "全部类型" },
  { value: "case", label: "案例" },
  { value: "rule", label: "规则" },
  { value: "template", label: "模板" },
  { value: "skill", label: "技能包" },
  { value: "sop", label: "SOP" },
  { value: "evaluation_sample", label: "评测样本" },
];

const roleOptions: Array<{ value: "all" | RoleView; label: string }> = [
  { value: "all", label: "全部角色" },
  { value: "ceo", label: "老板" },
  { value: "product_rd_director", label: "产品研发总监" },
  { value: "growth_director", label: "运营与营销总监" },
  { value: "visual_director", label: "视觉总监" },
];

const goalOptions = [
  { value: "all", label: "全部目标" },
  { value: "提升首发转化", label: "提升首发转化" },
  { value: "稳定增长效率", label: "稳定增长效率" },
  { value: "提升首发通过率", label: "提升首发通过率" },
] as const;

export function AssetLibrary() {
  const { repositories } = usePilotData();
  const [query, setQuery] = useState("");
  const [stage, setStage] = useState<"all" | LifecycleStage>("all");
  const [type, setType] = useState<"all" | AssetType>("all");
  const [role, setRole] = useState<"all" | RoleView>("all");
  const [goal, setGoal] = useState<(typeof goalOptions)[number]["value"]>("all");

  const result = repositories.knowledge.getAssetLibrary({
    query: query || undefined,
    stage: stage === "all" ? undefined : stage,
    assetType: type === "all" ? undefined : type,
    role: role === "all" ? undefined : role,
    businessGoal: goal === "all" ? undefined : goal,
  });
  const viewModel = result.data.viewModel;

  return (
    <div className="p-8 space-y-6">
      <QueryStatusPanel
        title="知识资产数据状态"
        stale={result.stale}
        partial={result.partial}
        lastUpdatedAt={result.lastUpdatedAt}
        issues={result.issues}
      />

      <section className="grid grid-cols-6 gap-4">
        <CounterCard label="案例" value={viewModel.countsByType.case} />
        <CounterCard label="规则" value={viewModel.countsByType.rule} />
        <CounterCard label="模板" value={viewModel.countsByType.template} />
        <CounterCard label="技能包" value={viewModel.countsByType.skill} />
        <CounterCard label="SOP" value={viewModel.countsByType.sop} />
        <CounterCard label="评测样本" value={viewModel.countsByType.evaluation_sample} />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="grid grid-cols-[1fr,180px,180px,180px,180px] gap-4">
          <label className="space-y-2">
            <div className="text-sm font-medium text-slate-700">搜索知识资产</div>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="按标题、摘要、来源搜索"
              className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm outline-none ring-0 focus:border-blue-500"
            />
          </label>
          <label className="space-y-2">
            <div className="text-sm font-medium text-slate-700">阶段</div>
            <select
              value={stage}
              onChange={(event) => setStage(event.target.value as typeof stage)}
              className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm outline-none focus:border-blue-500"
            >
              {stageOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2">
            <div className="text-sm font-medium text-slate-700">类型</div>
            <select
              value={type}
              onChange={(event) => setType(event.target.value as typeof type)}
              className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm outline-none focus:border-blue-500"
            >
              {typeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2">
            <div className="text-sm font-medium text-slate-700">角色</div>
            <select
              value={role}
              onChange={(event) => setRole(event.target.value as typeof role)}
              className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm outline-none focus:border-blue-500"
            >
              {roleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2">
            <div className="text-sm font-medium text-slate-700">业务目标</div>
            <select
              value={goal}
              onChange={(event) => setGoal(event.target.value as typeof goal)}
              className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm outline-none focus:border-blue-500"
            >
              {goalOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {viewModel.groupedByStage.map((group) => (
        <section key={group.stage} className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900">{group.stageLabel}</h2>
            <p className="mt-1 text-sm text-slate-500">从这个阶段沉淀出来、可被后续项目复用的内部知识。</p>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {group.assets.map((asset) => (
              <div key={asset.id} className="rounded-xl border border-slate-200 p-4">
                <div className="mb-2 text-xs font-medium text-blue-700">{asset.typeLabel}</div>
                <div className="font-medium text-slate-900">{asset.title}</div>
                <div className="mt-2 text-sm text-slate-600">{asset.summary}</div>
                <div className="mt-3 text-xs text-slate-500">{asset.sourceInfo}</div>
                <div className="mt-1 text-xs text-slate-500">{asset.applicabilityLabel}</div>
                <div className="mt-1 text-xs text-slate-500">{asset.lineageLabel}</div>
                {asset.sourceProjectId && (
                  <Link
                    to={`/project/${asset.sourceProjectId}`}
                    className="mt-3 inline-flex text-sm text-blue-600 hover:text-blue-700"
                  >
                    查看来源项目
                  </Link>
                )}
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function CounterCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="text-2xl font-semibold text-slate-900">{value}</div>
      <div className="mt-1 text-sm text-slate-500">{label}</div>
    </div>
  );
}
