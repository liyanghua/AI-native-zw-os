import { useState } from "react";
import { Link, useSearchParams } from "react-router";
import { usePilotData } from "../../../data-access/PilotDataProvider";
import { useRemoteQuery } from "../../../data-access/useRemoteQuery";
import type { AssetType } from "../../../domain/types/model";
import { QueryStatusPanel } from "../ui/QueryStatusPanel";

const assetTypeOptions: Array<{ value: "all" | AssetType; label: string }> = [
  { value: "all", label: "全部类型" },
  { value: "case", label: "案例" },
  { value: "rule", label: "规则" },
  { value: "template", label: "模板" },
  { value: "skill", label: "技能包" },
  { value: "sop", label: "SOP" },
  { value: "evaluation_sample", label: "评测样本" },
];

const publishStatusOptions = [
  { value: "all", label: "全部发布态" },
  { value: "candidate", label: "候选中" },
  { value: "published", label: "已发布" },
  { value: "deprecated", label: "已废弃" },
] as const;

export function AssetLibrary() {
  const { sandboxRepositories } = usePilotData();
  const [searchParams, setSearchParams] = useSearchParams();
  const [refreshToken, setRefreshToken] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const projectId = searchParams.get("projectId") ?? "";
  const assetType = (searchParams.get("assetType") as AssetType | null) ?? "all";
  const publishStatus = (searchParams.get("publishStatus") as (typeof publishStatusOptions)[number]["value"] | null) ?? "all";

  const { query, isLoading } = useRemoteQuery(
    () =>
      sandboxRepositories.governance.getAssetLibrary({
        projectId: projectId || undefined,
        assetType: assetType === "all" ? undefined : assetType,
        publishStatus: publishStatus === "all" ? undefined : publishStatus,
      }),
    [sandboxRepositories, projectId, assetType, publishStatus, refreshToken],
    { pollMs: 45_000 },
  );

  if (isLoading && !query) {
    return <ShellState title="正在加载资产库..." description="正在聚合 candidate、published asset 和知识回流状态。" />;
  }

  if (!query) {
    return <ShellState title="资产库暂不可用" description="尚未收到资产治理结果。" />;
  }

  const result = query.data;

  if (query.error && result.items.length === 0) {
    return <ShellState title="资产库暂不可用" description={query.error} />;
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

  async function publishAsset(candidateId: string) {
    setError(null);
    setMessage("正在发布资产...");
    const mutation = await sandboxRepositories.governance.publishAsset(candidateId, {
      operator: "Batch 5 治理流",
      reason: "候选资产已确认可复用。",
    });
    if (mutation.error || !mutation.data) {
      setError(mutation.error ?? "资产发布失败。");
      setMessage(null);
      return;
    }
    setMessage(`已发布资产 ${mutation.data.publishedAsset.assetId}。`);
    setRefreshToken((value) => value + 1);
  }

  async function feedbackAsset(sourceId: string, sourceType: "asset_candidate" | "published_asset") {
    setError(null);
    setMessage("正在回流知识层...");
    const mutation = await sandboxRepositories.governance.feedbackToKnowledge({
      sourceType,
      sourceId,
      feedbackMode: "promote_to_knowledge",
      operator: "Batch 5 治理流",
    });
    if (mutation.error || !mutation.data) {
      setError(mutation.error ?? "知识回流失败。");
      setMessage(null);
      return;
    }
    setMessage(`已回流知识资产 ${mutation.data.feedback.targetAssetId}。`);
    setRefreshToken((value) => value + 1);
  }

  return (
    <div className="p-8 space-y-6">
      <QueryStatusPanel
        title="资产治理数据状态"
        stale={query.stale}
        partial={query.partial}
        lastUpdatedAt={query.lastUpdatedAt}
        issues={query.issues}
      />

      {message && !error ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {message}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </div>
      ) : null}

      <section className="grid grid-cols-4 gap-4">
        <SummaryCard label="资产总数" value={result.summary.total} />
        <SummaryCard label="候选中" value={result.summary.candidates} />
        <SummaryCard label="已发布" value={result.summary.published} />
        <SummaryCard label="已回流知识" value={result.summary.feedbackSynced} />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-900">资产筛选</h2>
          <p className="mt-1 text-sm text-slate-500">Batch 5 起资产库同时承载 candidate 与 published asset，并显式暴露 feedback to knowledge 状态。</p>
        </div>
        <div className="grid grid-cols-[1fr,220px,220px] gap-4">
          <label className="space-y-2">
            <div className="text-sm font-medium text-slate-700">项目 ID</div>
            <input
              value={projectId}
              onChange={(event) => updateParam("projectId", event.target.value)}
              placeholder="按 projectId 过滤"
              className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm outline-none focus:border-blue-500"
            />
          </label>
          <SelectField
            label="资产类型"
            value={assetType}
            options={assetTypeOptions}
            onChange={(value) => updateParam("assetType", value)}
          />
          <SelectField
            label="发布状态"
            value={publishStatus}
            options={publishStatusOptions.map((option) => ({ value: option.value, label: option.label }))}
            onChange={(value) => updateParam("publishStatus", value)}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Asset Library</h2>
          <p className="mt-1 text-sm text-slate-500">统一展示候选资产、已发布资产、来源 review，以及是否已经反馈回知识层。</p>
        </div>
        <div className="space-y-3">
          {result.items.length === 0 ? (
            <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">当前筛选条件下没有资产。</div>
          ) : (
            result.items.map((item) => (
              <div key={`${item.kind}-${item.candidateId ?? item.assetId}`} className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="font-medium text-slate-900">{item.title}</div>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">{item.assetType}</span>
                      <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">{item.publishStatus}</span>
                      {item.feedbackToKnowledge === "synced" ? (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">已回流知识</span>
                      ) : null}
                    </div>
                    <div className="text-sm text-slate-600">{item.projectName}</div>
                    <div className="text-xs text-slate-500">
                      来源 review {item.sourceReviewId ?? "待补充"} · 复用分 {item.reusabilityScore} · {item.updatedAt}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {item.kind === "candidate" && item.candidateId && item.publishStatus !== "published" ? (
                      <button
                        onClick={() => void publishAsset(item.candidateId!)}
                        className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
                      >
                        发布
                      </button>
                    ) : null}
                    {item.feedbackToKnowledge !== "synced" ? (
                      <button
                        onClick={() =>
                          void feedbackAsset(
                            item.kind === "published" ? item.assetId ?? "" : item.candidateId ?? "",
                            item.kind === "published" ? "published_asset" : "asset_candidate",
                          )}
                        className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
                      >
                        回流知识
                      </button>
                    ) : null}
                    <Link
                      to={`/project/${item.projectId}`}
                      className="rounded-lg bg-white px-3 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50"
                    >
                      查看项目
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="text-2xl font-semibold text-slate-900">{value}</div>
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
