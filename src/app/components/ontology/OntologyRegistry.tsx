import { useState } from "react";
import { useSearchParams } from "react-router";
import { usePilotData } from "../../../data-access/PilotDataProvider";
import { useRemoteQuery } from "../../../data-access/useRemoteQuery";
import { QueryStatusPanel } from "../ui/QueryStatusPanel";

const statusOptions = [
  { value: "all", label: "全部状态" },
  { value: "draft", label: "draft" },
  { value: "active", label: "active" },
  { value: "deprecated", label: "deprecated" },
  { value: "archived", label: "archived" },
] as const;

export function OntologyRegistry() {
  const { sandboxRepositories } = usePilotData();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const itemType = searchParams.get("itemType") ?? "";
  const status = searchParams.get("status") ?? "all";

  const { query, isLoading } = useRemoteQuery(
    () =>
      sandboxRepositories.ontology.getRegistry({
        itemType: itemType || undefined,
        status: status === "all" ? undefined : status,
      }),
    [sandboxRepositories, itemType, status, refreshToken],
    { pollMs: 45_000 },
  );

  const detailQuery = useRemoteQuery(
    () =>
      selectedId
        ? sandboxRepositories.ontology.getRegistryItem(selectedId)
        : Promise.resolve({
            data: null,
            loading: false,
            error: null,
            stale: false,
            partial: false,
            lastUpdatedAt: new Date().toISOString(),
            issues: [],
          }),
    [sandboxRepositories, selectedId, refreshToken],
  );

  if (isLoading && !query) {
    return <ShellState title="正在加载 Ontology Registry..." description="正在拉取 registry、版本和治理状态。" />;
  }

  if (!query) {
    return <ShellState title="Ontology Registry 暂不可用" description="尚未收到 ontology 治理结果。" />;
  }

  const result = query.data;

  async function mutate(type: "activate" | "deprecate", registryId: string) {
    setError(null);
    setMessage(type === "activate" ? "正在激活 ontology item..." : "正在废弃 ontology item...");
    const mutation = type === "activate"
      ? await sandboxRepositories.ontology.activate({
          registryId,
          operator: "Batch 6",
          reason: "Batch 6 ontology governance mutation",
        })
      : await sandboxRepositories.ontology.deprecate({
          registryId,
          operator: "Batch 6",
          reason: "Batch 6 ontology governance mutation",
        });

    if (mutation.error || !mutation.data) {
      setError(mutation.error ?? "Ontology 状态更新失败。");
      setMessage(null);
      return;
    }
    setMessage(`${registryId} 已更新为 ${mutation.data.item.status}。`);
    setRefreshToken((value) => value + 1);
  }

  return (
    <div className="p-8 space-y-6">
      <QueryStatusPanel
        title="Ontology 治理数据状态"
        stale={query.stale}
        partial={query.partial}
        lastUpdatedAt={query.lastUpdatedAt}
        issues={query.issues}
      />

      {message && !error ? <Banner tone="success" message={message} /> : null}
      {error ? <Banner tone="error" message={error} /> : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Ontology Registry</h1>
            <p className="mt-1 text-sm text-slate-500">Batch 6 起，role profile、stage rule、action policy、review pattern、asset type、template、skill 进入统一 registry。</p>
          </div>
          <div className="grid grid-cols-[220px,180px] gap-4">
            <label className="space-y-2">
              <div className="text-sm font-medium text-slate-700">item type</div>
              <input
                value={itemType}
                onChange={(event) => {
                  const next = new URLSearchParams(searchParams);
                  if (event.target.value) {
                    next.set("itemType", event.target.value);
                  } else {
                    next.delete("itemType");
                  }
                  setSearchParams(next);
                }}
                className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm outline-none focus:border-blue-500"
                placeholder="如 role_profile"
              />
            </label>
            <label className="space-y-2">
              <div className="text-sm font-medium text-slate-700">status</div>
              <select
                value={status}
                onChange={(event) => {
                  const next = new URLSearchParams(searchParams);
                  if (event.target.value === "all") {
                    next.delete("status");
                  } else {
                    next.set("status", event.target.value);
                  }
                  setSearchParams(next);
                }}
                className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm outline-none focus:border-blue-500"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="grid grid-cols-[1.1fr,0.9fr] gap-6">
          <div className="space-y-3">
            {result.items.map((item) => (
              <button
                key={item.registryId}
                onClick={() => setSelectedId(item.registryId)}
                className={`w-full rounded-xl border p-4 text-left ${
                  selectedId === item.registryId
                    ? "border-blue-300 bg-blue-50"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="font-medium text-slate-900">{item.name}</div>
                    <div className="mt-1 text-sm text-slate-600">{item.itemType} · owner {item.owner}</div>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
                    {item.status} · v{item.currentVersion}
                  </span>
                </div>
              </button>
            ))}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            {!detailQuery.query?.data ? (
              <EmptyState label="选择左侧条目查看版本、payload 与 lineage。" />
            ) : (
              <>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-lg font-semibold text-slate-900">{detailQuery.query.data.item.name}</div>
                    <div className="mt-1 text-sm text-slate-600">
                      {detailQuery.query.data.item.itemType} · {detailQuery.query.data.item.status} · owner {detailQuery.query.data.item.owner}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => void mutate("activate", detailQuery.query!.data!.item.registryId)}
                      className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                    >
                      Activate
                    </button>
                    <button
                      onClick={() => void mutate("deprecate", detailQuery.query!.data!.item.registryId)}
                      className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
                    >
                      Deprecate
                    </button>
                  </div>
                </div>

                <pre className="mt-4 overflow-x-auto rounded-xl bg-white p-4 text-xs text-slate-700">
                  {JSON.stringify(detailQuery.query.data.latestPayload, null, 2)}
                </pre>

                <div className="mt-4 text-sm font-medium text-slate-900">版本历史</div>
                <div className="mt-2 space-y-2">
                  {detailQuery.query.data.versions.map((version) => (
                    <div key={version.versionId} className="rounded-lg bg-white px-3 py-2 text-sm text-slate-700">
                      v{version.version} · {version.changeNote ?? "无变更说明"}
                    </div>
                  ))}
                </div>

                <div className="mt-4 text-sm font-medium text-slate-900">Lineage references</div>
                <div className="mt-2 space-y-2">
                  {detailQuery.query.data.lineageReferences.map((lineage) => (
                    <div key={`${lineage.referenceType}-${lineage.referenceId}`} className="rounded-lg bg-white px-3 py-2 text-sm text-slate-700">
                      {lineage.referenceType} · {lineage.label}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </section>
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
  return <div className="rounded-xl bg-white p-4 text-sm text-slate-500">{label}</div>;
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
