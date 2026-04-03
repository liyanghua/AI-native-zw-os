import { useState } from "react";
import { Link, useSearchParams } from "react-router";
import { Sparkles } from "lucide-react";
import { usePilotData } from "../../../data-access/PilotDataProvider";
import { useRemoteQuery } from "../../../data-access/useRemoteQuery";
import type { ReviewStatus, ReviewType } from "../../../domain/types/model";
import { QueryStatusPanel } from "../ui/QueryStatusPanel";

const reviewStatusOptions: Array<{ value: "all" | ReviewStatus; label: string }> = [
  { value: "all", label: "全部状态" },
  { value: "generated", label: "已生成" },
  { value: "approved", label: "已批准" },
  { value: "archived", label: "已归档" },
];

const reviewTypeOptions: Array<{ value: "all" | ReviewType; label: string }> = [
  { value: "all", label: "全部类型" },
  { value: "execution_review", label: "执行复盘" },
  { value: "product_review", label: "商品研发复盘" },
  { value: "creative_review", label: "视觉复盘" },
  { value: "governance_review", label: "治理复盘" },
];

export function ReviewAndAssets() {
  const { sandboxRepositories } = usePilotData();
  const [searchParams, setSearchParams] = useSearchParams();
  const [refreshToken, setRefreshToken] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const projectId = searchParams.get("projectId") ?? "";
  const reviewStatus = (searchParams.get("reviewStatus") as ReviewStatus | null) ?? "all";
  const reviewType = (searchParams.get("reviewType") as ReviewType | null) ?? "all";

  const { query, isLoading } = useRemoteQuery(
    () =>
      sandboxRepositories.governance.getReviewCenter({
        projectId: projectId || undefined,
        reviewStatus: reviewStatus === "all" ? undefined : reviewStatus,
        reviewType: reviewType === "all" ? undefined : reviewType,
      }),
    [sandboxRepositories, projectId, reviewStatus, reviewType, refreshToken],
    { pollMs: 45_000 },
  );

  if (isLoading && !query) {
    return <ShellState title="正在加载复盘中心..." description="正在聚合跨项目 review 与资产候选治理状态。" />;
  }

  if (!query) {
    return <ShellState title="复盘中心暂不可用" description="尚未收到 review governance 结果。" />;
  }

  const result = query.data;

  if (query.error && result.items.length === 0) {
    return <ShellState title="复盘中心暂不可用" description={query.error} />;
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

  async function promoteReview(reviewId: string) {
    setError(null);
    setMessage("正在提升 review 为资产候选...");
    const mutation = await sandboxRepositories.governance.promoteReviewToAsset(reviewId, {
      assetType: "template",
      operator: "Batch 5 治理流",
      reason: "将高质量复盘沉淀为可复用模板。",
    });
    if (mutation.error || !mutation.data) {
      setError(mutation.error ?? "提升资产候选失败。");
      setMessage(null);
      return;
    }
    setMessage(`已生成资产候选 ${mutation.data.assetCandidate.candidateId}。`);
    setRefreshToken((value) => value + 1);
  }

  return (
    <div className="p-8 space-y-6">
      <QueryStatusPanel
        title="复盘治理数据状态"
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
        <SummaryCard label="总复盘数" value={result.summary.total} />
        <SummaryCard label="已批准" value={result.summary.approved} />
        <SummaryCard label="已升级资产" value={result.summary.promoted} />
        <SummaryCard label="可升级" value={result.summary.promoteable} />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-900">复盘筛选</h2>
          <p className="mt-1 text-sm text-slate-500">Batch 5 起复盘不再只是项目页的一段摘要，而是可管理、可升级、可回流知识的治理对象。</p>
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
            label="复盘状态"
            value={reviewStatus}
            options={reviewStatusOptions}
            onChange={(value) => updateParam("reviewStatus", value)}
          />
          <SelectField
            label="复盘类型"
            value={reviewType}
            options={reviewTypeOptions}
            onChange={(value) => updateParam("reviewType", value)}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Review Center</h2>
          <p className="mt-1 text-sm text-slate-500">这里统一展示 review 质量、资产升级状态和来源 action，而不是散落在单项目 execution 面板里。</p>
        </div>
        <div className="space-y-3">
          {result.items.length === 0 ? (
            <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">当前筛选条件下没有 review。</div>
          ) : (
            result.items.map((review) => (
              <div key={review.reviewId} className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="font-medium text-slate-900">{review.summary}</div>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">{review.reviewType}</span>
                      <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">{review.reviewStatus}</span>
                      {review.isPromotedToAsset ? (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">已升级资产</span>
                      ) : null}
                    </div>
                    <div className="text-sm text-slate-600">{review.projectName}</div>
                    <div className="text-xs text-slate-500">
                      质量分 {review.reviewQualityScore} · source action {review.sourceActionId ?? "待补充"} · {review.createdAt}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {!review.isPromotedToAsset ? (
                      <button
                        onClick={() => void promoteReview(review.reviewId)}
                        className="inline-flex items-center rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
                      >
                        <Sparkles className="mr-2 size-4" />
                        提升为资产候选
                      </button>
                    ) : null}
                    <Link
                      to={`/project/${review.projectId}`}
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
