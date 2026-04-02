import { Rocket, TrendingUp, AlertCircle } from "lucide-react";

export function LaunchVerification() {
  return (
    <div className="p-8 space-y-6">
      <section>
        <h2 className="text-base font-semibold text-slate-900 mb-4">首发脉冲</h2>
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="text-2xl font-semibold text-slate-900 mb-1">3</div>
            <div className="text-sm text-slate-600 mb-2">验证中项目</div>
            <div className="text-xs text-blue-600">2 个需判断</div>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="text-2xl font-semibold text-slate-900 mb-1">67%</div>
            <div className="text-sm text-slate-600 mb-2">平均达成率</div>
            <div className="text-xs text-orange-600">低于预期</div>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="text-2xl font-semibold text-slate-900 mb-1">2</div>
            <div className="text-sm text-slate-600 mb-2">建议放量</div>
            <div className="text-xs text-green-600">表现优秀</div>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="text-2xl font-semibold text-slate-900 mb-1">1</div>
            <div className="text-sm text-slate-600 mb-2">建议调整</div>
            <div className="text-xs text-orange-600">需决策</div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-base font-semibold text-slate-900 mb-4">首发项目列表</h2>
        <div className="space-y-3">
          {mockLaunchProjects.map((project) => (
            <div key={project.id} className="bg-white rounded-lg border border-slate-200 p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">{project.name}</h3>
                  <div className="text-sm text-slate-600">{project.launchDate} 首发 • 第 {project.day} 天</div>
                </div>
                <span className={`px-3 py-1 rounded text-sm font-medium ${
                  project.status === "需关注" ? "bg-orange-100 text-orange-700" : "bg-green-100 text-green-700"
                }`}>
                  {project.status}
                </span>
              </div>
              
              <div className="grid grid-cols-4 gap-4 mb-4">
                <div>
                  <div className="text-xs text-slate-600 mb-1">GMV</div>
                  <div className="text-lg font-semibold text-slate-900">{project.gmv.current}</div>
                  <div className="text-xs text-slate-600">目标: {project.gmv.target}</div>
                  <div className={`text-xs ${project.gmv.status === "达成" ? "text-green-600" : "text-red-600"}`}>
                    {project.gmv.percentage}%
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-600 mb-1">点击率</div>
                  <div className="text-lg font-semibold text-slate-900">{project.clickRate}</div>
                  <div className="text-xs text-green-600">符合预期</div>
                </div>
                <div>
                  <div className="text-xs text-slate-600 mb-1">转化率</div>
                  <div className="text-lg font-semibold text-slate-900">{project.conversionRate}</div>
                  <div className={`text-xs ${project.status === "需关注" ? "text-red-600" : "text-green-600"}`}>
                    {project.status === "需关注" ? "低于预期" : "符合预期"}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-600 mb-1">客单价</div>
                  <div className="text-lg font-semibold text-slate-900">{project.avgPrice}</div>
                  <div className="text-xs text-slate-600">符合预期</div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <div className="text-sm text-slate-600">{project.suggestion}</div>
                <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
                  {project.action}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

const mockLaunchProjects = [
  {
    id: 1,
    name: "夏日清爽套装",
    launchDate: "2024-03-28",
    day: 3,
    status: "需关注",
    gmv: { current: "32万", target: "50万", percentage: 64, status: "未达成" },
    clickRate: "2.8%",
    conversionRate: "1.2%",
    avgPrice: "¥299",
    suggestion: "建议调整定价或优化主图",
    action: "查看方案",
  },
  {
    id: 2,
    name: "商务精英系列",
    launchDate: "2024-03-25",
    day: 6,
    status: "健康",
    gmv: { current: "85万", target: "80万", percentage: 106, status: "达成" },
    clickRate: "3.5%",
    conversionRate: "2.8%",
    avgPrice: "¥699",
    suggestion: "建议放量推广",
    action: "立即放量",
  },
];
