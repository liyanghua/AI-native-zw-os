import type { QueryIssue } from "../../../domain/types/query";

function issueTone(issue: QueryIssue) {
  if (issue.severity === "error") {
    return "border-red-200 bg-red-50 text-red-800";
  }
  if (issue.severity === "warning") {
    return "border-orange-200 bg-orange-50 text-orange-800";
  }
  return "border-blue-200 bg-blue-50 text-blue-800";
}

export function QueryStatusPanel({
  title = "数据状态",
  stale,
  partial,
  lastUpdatedAt,
  issues,
}: {
  title?: string;
  stale: boolean;
  partial: boolean;
  lastUpdatedAt: string;
  issues: QueryIssue[];
}) {
  if (!stale && !partial && issues.length === 0) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        {stale && (
          <span className="rounded-full bg-orange-50 px-2 py-0.5 text-xs text-orange-700">
            stale
          </span>
        )}
        {partial && (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
            partial
          </span>
        )}
        <span className="text-xs text-slate-500">最近刷新 {lastUpdatedAt.slice(11, 16)}</span>
      </div>
      <div className="mt-3 space-y-2">
        {issues.map((issue) => (
          <div key={`${issue.code}-${issue.message}`} className={`rounded-xl border px-3 py-2 text-sm ${issueTone(issue)}`}>
            {issue.message}
          </div>
        ))}
      </div>
    </section>
  );
}
