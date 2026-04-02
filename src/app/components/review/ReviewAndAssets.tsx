import { Link } from "react-router";
import { Sparkles } from "lucide-react";
import { usePilotData } from "../../../data-access/PilotDataProvider";
import { buildReviewAssetsViewModel } from "../../../view-models/reviewAssets";

export function ReviewAndAssets() {
  const { runtime, publishAssetCandidate } = usePilotData();
  const snapshot = runtime.getSnapshot();
  const viewModel = buildReviewAssetsViewModel({
    reviews: snapshot.reviews,
    assets: snapshot.knowledgeAssets,
  });

  return (
    <div className="p-8 space-y-6">
      <section className="grid grid-cols-3 gap-4">
        <SummaryCard label="待复盘项目" value={viewModel.summary.pendingReviews} />
        <SummaryCard label="待确认资产候选" value={viewModel.summary.pendingCandidates} />
        <SummaryCard label="已入库知识资产" value={viewModel.summary.publishedAssets} />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-900">复盘摘要</h2>
          <p className="mt-1 text-sm text-slate-500">复盘不只给结论，还要把 decision / action / execution lineage 带出来。</p>
        </div>
        <div className="space-y-3">
          {viewModel.reviews.map((review) => (
            <div key={review.projectId} className="rounded-xl border border-slate-200 p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="font-medium text-slate-900">{review.verdictLabel}</div>
                  <p className="text-sm text-slate-600">{review.resultSummary}</p>
                  <div className="text-xs text-slate-500">{review.lineageLabel}</div>
                  <ul className="space-y-1 text-sm text-slate-500">
                    {review.recommendations.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>
                <Link to={`/project/${review.projectId}`} className="rounded-lg bg-white px-3 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50">
                  查看项目
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-900">资产候选</h2>
          <p className="mt-1 text-sm text-slate-500">把复盘提炼出的模板、规则、SOP 交给人工确认入库，并显式说明适用范围。</p>
        </div>
        <div className="space-y-3">
          {viewModel.candidates.length === 0 && (
            <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">当前没有待确认的资产候选。</div>
          )}
          {viewModel.candidates.map((candidate) => (
            <div key={candidate.id} className="rounded-xl border border-blue-200 bg-blue-50 p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="size-4 text-blue-600" />
                    <div className="font-medium text-slate-900">{candidate.title}</div>
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                      {candidate.typeLabel}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700">{candidate.rationale}</p>
                  <div className="text-xs text-slate-500">{candidate.applicabilityLabel}</div>
                  <Link to={`/project/${candidate.projectId}`} className="text-sm text-blue-600 hover:text-blue-700">
                    来源项目
                  </Link>
                </div>
                <button
                  onClick={() => publishAssetCandidate(candidate.id)}
                  className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  确认入库
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-900">已入库资产</h2>
          <p className="mt-1 text-sm text-slate-500">每条资产都带 applicability 和 lineage，后续检索不会脱离来源项目。</p>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {viewModel.assets.map((asset) => (
            <div key={asset.id} className="rounded-xl border border-slate-200 p-4">
              <div className="mb-2 text-xs font-medium text-green-700">{asset.typeLabel}</div>
              <div className="font-medium text-slate-900">{asset.title}</div>
              <div className="mt-2 text-sm text-slate-600">{asset.summary}</div>
              <div className="mt-3 text-xs text-slate-500">{asset.sourceInfo}</div>
              <div className="mt-1 text-xs text-slate-500">{asset.applicabilityLabel}</div>
              <div className="mt-1 text-xs text-slate-500">{asset.lineageLabel}</div>
            </div>
          ))}
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
