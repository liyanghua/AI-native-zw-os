import { useState } from "react";
import { useSearchParams } from "react-router";
import { usePilotData } from "../../../data-access/PilotDataProvider";
import { createQueryResult, latestTimestamp } from "../../../data-access/queryResult";
import { useRemoteQuery } from "../../../data-access/useRemoteQuery";
import { QueryStatusPanel } from "../ui/QueryStatusPanel";

const defaultProjectId = "local-growth-travel-pro";

export function EvalCenter() {
  const { sandboxRepositories } = usePilotData();
  const [searchParams, setSearchParams] = useSearchParams();
  const [refreshToken, setRefreshToken] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const projectId = searchParams.get("projectId") ?? defaultProjectId;

  const { query, isLoading } = useRemoteQuery(
    async () => {
      const [cases, suites, runs] = await Promise.all([
        sandboxRepositories.eval.getCases(),
        sandboxRepositories.eval.getSuites(),
        sandboxRepositories.eval.getRuns({ projectId }),
      ]);

      const latestRun = runs.data.runs[0] ?? null;
      const latestDetail = latestRun
        ? await sandboxRepositories.eval.getRun(latestRun.runId)
        : createQueryResult({
            data: {
              run: null,
              results: [],
              gateDecision: null,
            },
            lastUpdatedAt: new Date().toISOString(),
          });

      return createQueryResult({
        data: {
          cases: cases.data.cases,
          suites: suites.data.suites,
          runs: runs.data.runs,
          latestGateDecision: latestDetail.data.gateDecision,
        },
        lastUpdatedAt: latestTimestamp(
          cases.lastUpdatedAt,
          suites.lastUpdatedAt,
          runs.lastUpdatedAt,
          latestDetail.lastUpdatedAt,
        ),
        issues: [...cases.issues, ...suites.issues, ...runs.issues, ...latestDetail.issues],
      });
    },
    [sandboxRepositories, projectId, refreshToken],
    { pollMs: 45_000 },
  );

  if (isLoading && !query) {
    return <ShellState title="正在加载 Eval Center..." description="正在拉取评测用例、套件、运行记录和 gate 状态。" />;
  }

  if (!query) {
    return <ShellState title="Eval Center 暂不可用" description="尚未收到评测中心数据。" />;
  }

  const result = query.data;

  async function runSuite(suiteId: string) {
    setError(null);
    setMessage("正在运行评测套件...");
    const mutation = await sandboxRepositories.eval.runSuite({
      projectId,
      suiteId,
    });
    if (mutation.error || !mutation.data) {
      setError(mutation.error ?? "评测套件执行失败。");
      setMessage(null);
      return;
    }
    setMessage(`已完成评测 ${mutation.data.run.runId}，gate=${mutation.data.gateDecision?.decision ?? "n/a"}。`);
    setRefreshToken((value) => value + 1);
  }

  return (
    <div className="p-8 space-y-6">
      <QueryStatusPanel
        title="评测中心数据状态"
        stale={query.stale}
        partial={query.partial}
        lastUpdatedAt={query.lastUpdatedAt}
        issues={query.issues}
      />

      {message && !error ? (
        <Banner tone="success" message={message} />
      ) : null}
      {error ? <Banner tone="error" message={error} /> : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Eval Center</h1>
            <p className="mt-1 text-sm text-slate-500">Batch 6 起，决策、执行、review、asset、角色一致性与 lineage 完整性进入可复跑 harness。</p>
          </div>
          <label className="space-y-2">
            <div className="text-sm font-medium text-slate-700">项目 ID</div>
            <input
              value={projectId}
              onChange={(event) => {
                const next = new URLSearchParams(searchParams);
                if (event.target.value) {
                  next.set("projectId", event.target.value);
                } else {
                  next.delete("projectId");
                }
                setSearchParams(next);
              }}
              className="w-72 rounded-lg border border-slate-300 px-4 py-2 text-sm outline-none focus:border-blue-500"
            />
          </label>
        </div>
        <div className="grid grid-cols-4 gap-4">
          <SummaryCard label="Eval cases" value={result.cases.length} />
          <SummaryCard label="Eval suites" value={result.suites.length} />
          <SummaryCard label="Recent runs" value={result.runs.length} />
          <SummaryCard label="Latest gate" value={result.latestGateDecision?.decision ?? "n/a"} />
        </div>
      </section>

      <div className="grid grid-cols-[0.9fr,1.1fr] gap-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 space-y-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">评测套件</h2>
            <p className="mt-1 text-sm text-slate-500">可以针对当前 seed 项目重复运行 Batch 6 smoke suite。</p>
          </div>
          {result.suites.map((suite) => (
            <div key={suite.suiteId} className="rounded-xl border border-slate-200 p-4">
              <div className="font-medium text-slate-900">{suite.name}</div>
              <div className="mt-1 text-sm text-slate-600">{suite.description}</div>
              <div className="mt-2 text-xs text-slate-500">{suite.caseIds.length} 个 case · {suite.status}</div>
              <button
                onClick={() => void runSuite(suite.suiteId)}
                className="mt-3 rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
              >
                运行套件
              </button>
            </div>
          ))}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 space-y-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">最近评测运行</h2>
            <p className="mt-1 text-sm text-slate-500">显示 gate decision 与平均分，帮助做回归验收。</p>
          </div>
          {result.runs.length === 0 ? (
            <EmptyState label="当前项目还没有评测运行记录。" />
          ) : (
            result.runs.map((run) => (
              <div key={run.runId} className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="font-medium text-slate-900">{run.runId}</div>
                    <div className="mt-1 text-sm text-slate-600">{run.projectId} · {run.status}</div>
                    <div className="mt-2 text-xs text-slate-500">
                      总数 {run.summary.total} · 平均分 {run.summary.averageScore}
                    </div>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                    result.latestGateDecision?.runId === run.runId
                      ? result.latestGateDecision.decision === "pass"
                        ? "bg-emerald-50 text-emerald-700"
                        : result.latestGateDecision.decision === "warning"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-rose-50 text-rose-700"
                      : "bg-slate-100 text-slate-700"
                  }`}>
                    {result.latestGateDecision?.runId === run.runId ? result.latestGateDecision.decision : run.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </section>
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="text-2xl font-semibold text-slate-900">{value}</div>
      <div className="mt-1 text-sm text-slate-500">{label}</div>
    </div>
  );
}

function Banner({ tone, message }: { tone: "success" | "error"; message: string }) {
  return (
    <div className={`rounded-2xl px-4 py-3 text-sm ${
      tone === "success"
        ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
        : "border border-rose-200 bg-rose-50 text-rose-800"
    }`}>
      {message}
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
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
