import { Sparkles, TrendingUp, Users, DollarSign, Target, ArrowRight } from "lucide-react";

export function OpportunityPool() {
  return (
    <div className="p-8 space-y-6">
      {/* Pulse */}
      <section>
        <h2 className="text-base font-semibold text-slate-900 mb-4">商机脉冲</h2>
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="text-2xl font-semibold text-slate-900 mb-1">23</div>
            <div className="text-sm text-slate-600 mb-2">商机总数</div>
            <div className="text-xs text-green-600">+8 本周新增</div>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="text-2xl font-semibold text-slate-900 mb-1">5</div>
            <div className="text-sm text-slate-600 mb-2">建议立项</div>
            <div className="text-xs text-orange-600">需决策</div>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="text-2xl font-semibold text-slate-900 mb-1">8.5</div>
            <div className="text-sm text-slate-600 mb-2">平均 AI 评分</div>
            <div className="text-xs text-slate-500">满分 10 分</div>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="text-2xl font-semibold text-slate-900 mb-1">3</div>
            <div className="text-sm text-slate-600 mb-2">今日新增</div>
            <div className="text-xs text-blue-600">自动识别</div>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section>
        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg">
              全部
            </button>
            <button className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">
              趋势洞察
            </button>
            <button className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">
              竞品分析
            </button>
            <button className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">
              用户需求
            </button>
          </div>
          <div className="flex space-x-2">
            <select className="px-4 py-2 text-sm border border-slate-300 rounded-lg bg-white">
              <option>按评分排序</option>
              <option>按时间排序</option>
              <option>按价值排序</option>
            </select>
          </div>
        </div>
      </section>

      {/* Opportunity Cards */}
      <section>
        <div className="grid grid-cols-2 gap-4">
          <OpportunityCard
            name="极简风通勤包系列"
            source="趋势洞察"
            target="25-35岁都市白领"
            category="商务包"
            priceRange="¥300-500"
            scores={{
              commercial: 9.2,
              feasibility: 8.5,
              visual: 8.8,
            }}
            aiScore={9.2}
            expectedGMV="800万"
            aiSuggestion="强烈建议立项，市场需求旺盛，可复用现有资源"
            needsDecision
          />
          <OpportunityCard
            name="户外轻量化背包"
            source="竞品分析"
            target="18-30岁运动爱好者"
            category="运动包"
            priceRange="¥200-400"
            scores={{
              commercial: 8.7,
              feasibility: 8.0,
              visual: 7.5,
            }}
            aiScore={8.1}
            expectedGMV="600万"
            aiSuggestion="建议立项，竞品分析显示市场空间大"
          />
          <OpportunityCard
            name="多功能亲子包"
            source="用户需求"
            target="25-40岁新手父母"
            category="功能包"
            priceRange="¥250-450"
            scores={{
              commercial: 8.5,
              feasibility: 7.8,
              visual: 8.0,
            }}
            aiScore={8.0}
            expectedGMV="500万"
            aiSuggestion="建议立项，用户需求明确，具有差异化优势"
          />
          <OpportunityCard
            name="复古文艺单肩包"
            source="平台趋势"
            target="20-30岁文艺青年"
            category="休闲包"
            priceRange="¥180-350"
            scores={{
              commercial: 7.8,
              feasibility: 8.5,
              visual: 9.0,
            }}
            aiScore={8.4}
            expectedGMV="450万"
            aiSuggestion="可考虑立项，视觉表达潜力大"
          />
          <OpportunityCard
            name="商务出差拉杆包"
            source="趋势洞察"
            target="30-45岁商务人士"
            category="商务包"
            priceRange="¥500-800"
            scores={{
              commercial: 8.3,
              feasibility: 7.5,
              visual: 7.8,
            }}
            aiScore={7.9}
            expectedGMV="700万"
            aiSuggestion="可考虑立项，需评估供应链可行性"
          />
          <OpportunityCard
            name="学生轻便书包"
            source="用户需求"
            target="12-18岁学生群体"
            category="学生包"
            priceRange="¥150-280"
            scores={{
              commercial: 7.5,
              feasibility: 8.8,
              visual: 7.2,
            }}
            aiScore={7.8}
            expectedGMV="400万"
            aiSuggestion="可考虑立项，生产难度低"
          />
        </div>
      </section>
    </div>
  );
}

interface OpportunityCardProps {
  name: string;
  source: string;
  target: string;
  category: string;
  priceRange: string;
  scores: {
    commercial: number;
    feasibility: number;
    visual: number;
  };
  aiScore: number;
  expectedGMV: string;
  aiSuggestion: string;
  needsDecision?: boolean;
}

function OpportunityCard({
  name,
  source,
  target,
  category,
  priceRange,
  scores,
  aiScore,
  expectedGMV,
  aiSuggestion,
  needsDecision,
}: OpportunityCardProps) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5 hover:border-blue-300 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="font-semibold text-slate-900 mb-1">{name}</h3>
          <div className="flex items-center space-x-2 text-xs text-slate-500">
            <span className="px-2 py-0.5 bg-slate-100 rounded">{source}</span>
            <span>•</span>
            <span>{category}</span>
            <span>•</span>
            <span>{priceRange}</span>
          </div>
        </div>
        {needsDecision && (
          <span className="ml-2 px-3 py-1 bg-orange-50 text-orange-700 text-xs font-medium rounded">
            待决策
          </span>
        )}
      </div>

      {/* Target Audience */}
      <div className="mb-4">
        <div className="flex items-center text-sm text-slate-600">
          <Users className="size-4 mr-2" />
          {target}
        </div>
      </div>

      {/* Scores */}
      <div className="space-y-2 mb-4">
        <ScoreBar label="商业价值" score={scores.commercial} color="green" />
        <ScoreBar label="可行性" score={scores.feasibility} color="blue" />
        <ScoreBar label="表达潜力" score={scores.visual} color="purple" />
      </div>

      {/* Expected GMV */}
      <div className="flex items-center justify-between mb-4 py-3 px-3 bg-slate-50 rounded-lg">
        <div className="flex items-center text-sm text-slate-600">
          <DollarSign className="size-4 mr-1.5" />
          <span>预期 GMV</span>
        </div>
        <span className="font-semibold text-slate-900">{expectedGMV}</span>
      </div>

      {/* AI Suggestion */}
      <div className="mb-4 p-3 bg-blue-50 rounded-lg">
        <div className="flex items-start text-sm">
          <Sparkles className="size-4 mr-2 flex-shrink-0 mt-0.5 text-blue-600" />
          <div className="flex-1">
            <div className="font-medium text-blue-900 mb-1">AI 评分: {aiScore}/10</div>
            <div className="text-blue-800">{aiSuggestion}</div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex space-x-2">
        <button className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">
          查看详情
        </button>
        {needsDecision && (
          <button className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
            立即立项
          </button>
        )}
      </div>
    </div>
  );
}

interface ScoreBarProps {
  label: string;
  score: number;
  color: "green" | "blue" | "purple";
}

function ScoreBar({ label, score, color }: ScoreBarProps) {
  const colors = {
    green: "bg-green-500",
    blue: "bg-blue-500",
    purple: "bg-purple-500",
  };

  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-slate-600 w-16">{label}</span>
      <div className="flex-1 mx-3">
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div className={`h-full ${colors[color]}`} style={{ width: `${score * 10}%` }} />
        </div>
      </div>
      <span className="text-slate-900 font-medium w-8 text-right">{score}</span>
    </div>
  );
}
