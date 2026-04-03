import { useState } from "react";
import { useSearchParams } from "react-router";
import { usePilotData } from "../../../data-access/PilotDataProvider";
import { createQueryResult, latestTimestamp } from "../../../data-access/queryResult";
import { useRemoteQuery } from "../../../data-access/useRemoteQuery";
import { QueryStatusPanel } from "../ui/QueryStatusPanel";

export function BridgeDiagnostics() {
  const { sandboxRepositories } = usePilotData();
  const [searchParams, setSearchParams] = useSearchParams();
  const [refreshToken, setRefreshToken] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const adapterId = searchParams.get("adapterId") ?? "";

  const { query, isLoading } = useRemoteQuery(
    async () => {
      const [adapters, syncRecords] = await Promise.all([
        sandboxRepositories.bridge.getAdapters(),
        sandboxRepositories.bridge.getSyncRecords({
          adapterId: adapterId || undefined,
        }),
      ]);

      return createQueryResult({
        data: {
          adapters: adapters.data.adapters,
          connectors: adapters.data.connectors,
          records: syncRecords.data.records,
        },
        lastUpdatedAt: latestTimestamp(adapters.lastUpdatedAt, syncRecords.lastUpdatedAt),
        issues: [...adapters.issues, ...syncRecords.issues],
      });
    },
    [sandboxRepositories, adapterId, refreshToken],
    { pollMs: 45_000 },
  );

  if (isLoading && !query) {
    return <ShellState title="正在加载 Bridge Diagnostics..." description="正在聚合 adapter 列表、最新 sync 记录和 freshness 诊断。" />;
  }

  if (!query) {
    return <ShellState title="Bridge Diagnostics 暂不可用" description="尚未收到 bridge 诊断数据。" />;
  }

  const result = query.data;

  async function runSync(targetAdapterId: string) {
    setError(null);
    setMessage("正在执行 bridge sync...");
    const mutation = await sandboxRepositories.bridge.runSync({
      adapterId: targetAdapterId,
    });
    if (mutation.error || !mutation.data) {
      setError(mutation.error ?? "Bridge sync 执行失败。");
      setMessage(null);
      return;
    }
    setMessage(`已完成 sync ${mutation.data.syncRecord.syncId}，导入 ${mutation.data.syncRecord.rowsImported} 行。`);
    setRefreshToken((value) => value + 1);
  }

  return (
    <div className="p-8 space-y-6">
      <QueryStatusPanel
        title="Bridge 诊断数据状态"
        stale={query.stale}
        partial={query.partial}
        lastUpdatedAt={query.lastUpdatedAt}
        issues={query.issues}
      />

      {message && !error ? <Banner tone="success" message={message} /> : null}
      {error ? <Banner tone="error" message={error} /> : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Bridge Diagnostics</h1>
          <p className="mt-1 text-sm text-slate-500">Batch 6 为本地沙箱补上统一桥接协议，当前支持 `local_mock`、`file_bridge`、`api_bridge` 三种模式。</p>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <SummaryCard label="Adapters" value={result.adapters.length} />
          <SummaryCard label="Connectors" value={result.connectors.length} />
          <SummaryCard label="Sync records" value={result.records.length} />
        </div>
      </section>

      <div className="grid grid-cols-[1fr,1fr] gap-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 space-y-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Adapter 列表</h2>
            <p className="mt-1 text-sm text-slate-500">支持看 mode、latest sync、freshness 和 mapping errors。</p>
          </div>
          {result.adapters.map((adapter) => (
            <div key={adapter.adapterId} className="rounded-xl border border-slate-200 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-medium text-slate-900">{adapter.name}</div>
                  <div className="mt-1 text-sm text-slate-600">{adapter.mode} · {adapter.status} · owner {adapter.owner}</div>
                  <div className="mt-2 text-xs text-slate-500">
                    latest sync {adapter.latestSync?.syncId ?? "none"} · freshness {adapter.latestSync?.freshnessSeconds ?? "-"}s
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const next = new URLSearchParams(searchParams);
                      next.set("adapterId", adapter.adapterId);
                      setSearchParams(next);
                    }}
                    className="rounded-lg bg-white px-3 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50"
                  >
                    查看记录
                  </button>
                  <button
                    onClick={() => void runSync(adapter.adapterId)}
                    className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
                  >
                    手动 sync
                  </button>
                </div>
              </div>
            </div>
          ))}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 space-y-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">最近同步记录</h2>
            <p className="mt-1 text-sm text-slate-500">按 adapter 查看 rows imported、mapping errors 和 freshness。</p>
          </div>
          {result.records.length === 0 ? (
            <EmptyState label="当前没有同步记录。" />
          ) : (
            result.records.map((record) => (
              <div key={record.syncId} className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="font-medium text-slate-900">{record.syncId}</div>
                    <div className="mt-1 text-sm text-slate-600">{record.adapterId} · {record.mode} · {record.status}</div>
                    <div className="mt-2 text-xs text-slate-500">
                      导入 {record.rowsImported} 行 · freshness {record.freshnessSeconds}s
                    </div>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                    record.mappingErrors.length === 0
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-amber-50 text-amber-700"
                  }`}>
                    {record.mappingErrors.length === 0 ? "clean" : `${record.mappingErrors.length} mapping errors`}
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
