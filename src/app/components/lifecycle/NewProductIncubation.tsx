import { Package, Users, Brain, Bot } from "lucide-react";

export function NewProductIncubation() {
  return (
    <div className="p-8 space-y-6">
      <section>
        <h2 className="text-base font-semibold text-slate-900 mb-4">孵化脉冲</h2>
        <div className="grid grid-cols-5 gap-4">
          {["待评估", "已立项", "定义中", "打样中", "待评审"].map((stage, i) => (
            <div key={i} className="bg-white rounded-lg border border-slate-200 p-4">
              <div className="text-2xl font-semibold text-slate-900 mb-1">{[3, 5, 4, 6, 2][i]}</div>
              <div className="text-sm text-slate-600">{stage}</div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-base font-semibold text-slate-900 mb-4">新品泳道</h2>
        <div className="space-y-3">
          {mockProjects.map((project) => (
            <div key={project.id} className="bg-white rounded-lg border border-slate-200 p-4 hover:border-blue-300 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="font-medium text-slate-900">{project.name}</h3>
                    <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded">
                      {project.stage}
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 text-xs text-slate-600">
                    <div className="flex items-center">
                      <Users className="size-3 mr-1" />
                      {project.team.human} 人
                    </div>
                    <div className="flex items-center">
                      <Brain className="size-3 mr-1" />
                      {project.team.brain} 建议
                    </div>
                    <div className="flex items-center">
                      <Bot className="size-3 mr-1" />
                      {project.team.agent} Agent
                    </div>
                  </div>
                </div>
                <div className="ml-4">
                  <div className="text-right mb-1">
                    <span className="text-sm font-medium text-slate-900">{project.progress}%</span>
                  </div>
                  <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600" style={{ width: `${project.progress}%` }} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

const mockProjects = [
  { id: 1, name: "夏日清爽套装", stage: "打样中", progress: 75, team: { human: 2, brain: 5, agent: 3 } },
  { id: 2, name: "商务精英系列", stage: "定义中", progress: 60, team: { human: 1, brain: 8, agent: 2 } },
  { id: 3, name: "潮流街头包", stage: "待评审", progress: 90, team: { human: 3, brain: 2, agent: 1 } },
  { id: 4, name: "轻奢商务包", stage: "已立项", progress: 30, team: { human: 1, brain: 4, agent: 1 } },
];
