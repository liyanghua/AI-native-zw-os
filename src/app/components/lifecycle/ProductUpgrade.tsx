import { CircleOff } from "lucide-react";

export function ProductUpgrade() {
  return (
    <div className="p-8">
      <section className="rounded-2xl border border-slate-200 bg-white p-8">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-slate-100 p-3">
            <CircleOff className="size-6 text-slate-700" />
          </div>
          <div className="space-y-3">
            <h1 className="text-2xl font-semibold text-slate-900">老品升级</h1>
            <p className="max-w-2xl text-sm text-slate-600">
              本轮单线试点明确不接入 `/product-upgrade` 的真实数据。当前主线先围绕“问题 → 决策 → 动作 →
              执行回写 → 复盘 → 资产”闭环跑通，老品升级会在下一轮复用同一套 identity、状态机和 lineage 骨架。
            </p>
            <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-800">
              当前页面是范围说明，不参与本次试点验收。
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
