import { Zap, TrendingUp } from "lucide-react";

export function GrowthOptimization() {
  return (
    <div className="p-8 space-y-6">
      <section>
        <h2 className="text-base font-semibold text-slate-900 mb-4">增长脉冲</h2>
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="text-2xl font-semibold text-slate-900 mb-1">15</div>
            <div className="text-sm text-slate-600 mb-2">优化项目</div>
            <div className="text-xs text-green-600">健康运行</div>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="text-2xl font-semibold text-slate-900 mb-1">8</div>
            <div className="text-sm text-slate-600 mb-2">待审批动作</div>
            <div className="text-xs text-orange-600">5 个高优</div>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="text-2xl font-semibold text-slate-900 mb-1">+22%</div>
            <div className="text-sm text-slate-600 mb-2">平均增长</div>
            <div className="text-xs text-green-600">vs 上月</div>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="text-2xl font-semibold text-slate-900 mb-1">2</div>
            <div className="text-sm text-slate-600 mb-2">阻塞项目</div>
            <div className="text-xs text-red-600">需处理</div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-base font-semibold text-slate-900 mb-4">项目作战区</h2>
        <div className="grid grid-cols-3 gap-4">
          {mockGrowthProjects.map((project) => (
            <div key={project.id} className="bg-white rounded-lg border border-slate-200 p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-medium text-slate-900 mb-1">{project.name}</h3>
                  <div className="text-sm text-slate-600">{project.stage}</div>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  project.health === "good" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                }`}>
                  {project.status}
                </span>
              </div>
              <div className="space-y-2 mb-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">目标</span>
                  <span className="text-slate-900 font-medium">{project.target}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">当前</span>
                  <span className="text-slate-900 font-medium">{project.current}</span>
                </div>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className={`h-2 rounded-full ${project.health === "good" ? "bg-green-500" : "bg-orange-500"}`} style={{ width: `${project.progress}%` }} />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

const mockGrowthProjects = [
  { id: 1, name: "经典通勤包", stage: "增长优化", status: "健康", health: "good", target: "GMV +30%", current: "+22%", progress: 73 },
  { id: 2, name: "商务双肩包", stage: "增长优化", status: "需关注", health: "attention", target: "GMV +25%", current: "+12%", progress: 48 },
  { id: 3, name: "轻奢手提包", stage: "增长优化", status: "健康", health: "good", target: "GMV +20%", current: "+18%", progress: 90 },
];
