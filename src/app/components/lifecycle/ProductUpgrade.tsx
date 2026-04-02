import { RefreshCw } from "lucide-react";

export function ProductUpgrade() {
  return (
    <div className="p-8 space-y-6">
      <section>
        <h2 className="text-base font-semibold text-slate-900 mb-4">升级脉冲</h2>
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="text-2xl font-semibold text-slate-900 mb-1">7</div>
            <div className="text-sm text-slate-600 mb-2">升级候选</div>
            <div className="text-xs text-blue-600">AI 已评估</div>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="text-2xl font-semibold text-slate-900 mb-1">3</div>
            <div className="text-sm text-slate-600 mb-2">升级中</div>
            <div className="text-xs text-green-600">进行中</div>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="text-2xl font-semibold text-slate-900 mb-1">+18%</div>
            <div className="text-sm text-slate-600 mb-2">平均提升</div>
            <div className="text-xs text-green-600">历史数据</div>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="text-2xl font-semibold text-slate-900 mb-1">12</div>
            <div className="text-sm text-slate-600 mb-2">已完成</div>
            <div className="text-xs text-slate-500">本季度</div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-base font-semibold text-slate-900 mb-4">升级候选池</h2>
        <div className="grid grid-cols-2 gap-4">
          {mockUpgradeProjects.map((project) => (
            <div key={project.id} className="bg-white rounded-lg border border-slate-200 p-4 hover:border-blue-300 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-medium text-slate-900 mb-1">{project.name}</h3>
                  <div className="text-sm text-slate-600">{project.currentPerformance}</div>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  project.value === "高" ? "bg-green-50 text-green-700" : "bg-orange-50 text-orange-700"
                }`}>
                  {project.value}价值
                </span>
              </div>
              <div className="space-y-2 mb-3 text-sm">
                <div>
                  <div className="text-slate-600 mb-1">升级方向</div>
                  <div className="text-slate-900">{project.upgradeDirection}</div>
                </div>
                <div>
                  <div className="text-slate-600 mb-1">预期提升</div>
                  <div className="text-blue-600 font-medium">{project.expectedImprovement}</div>
                </div>
              </div>
              <button className="w-full px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100">
                开始升级
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

const mockUpgradeProjects = [
  { id: 1, name: "经典通勤包", currentPerformance: "点击率 2.5%", upgradeDirection: "应用新极简风格", expectedImprovement: "+15% 点击率", value: "高" },
  { id: 2, name: "商务双肩包", currentPerformance: "转化率 1.8%", upgradeDirection: "增加场景化展示", expectedImprovement: "+20% 转化率", value: "高" },
  { id: 3, name: "轻奢手提包", currentPerformance: "点击率 3.0%", upgradeDirection: "优化细节展示", expectedImprovement: "+10% 点击率", value: "中" },
  { id: 4, name: "经典斜挎包", currentPerformance: "转化率 2.2%", upgradeDirection: "更新色彩方案", expectedImprovement: "+12% 转化率", value: "中" },
];
