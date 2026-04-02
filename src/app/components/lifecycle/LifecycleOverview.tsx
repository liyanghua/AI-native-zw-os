import { Link } from "react-router";
import {
  TrendingUp,
  Package,
  Rocket,
  Zap,
  RefreshCw,
  FileText,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Clock,
  Users,
} from "lucide-react";

export function LifecycleOverview() {
  return (
    <div className="p-8 space-y-6">
      {/* Lifecycle Map */}
      <section>
        <h2 className="text-base font-semibold text-slate-900 mb-4">商品经营主线</h2>
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-start space-x-4">
            <StageCard
              icon={TrendingUp}
              name="商机池"
              count={23}
              status="健康"
              blocked={0}
              pending={5}
              health="good"
              link="/opportunity-pool"
            />
            <ArrowRight className="size-5 text-slate-300 mt-8 flex-shrink-0" />
            <StageCard
              icon={Package}
              name="新品孵化"
              count={12}
              status="正常"
              blocked={0}
              pending={2}
              health="good"
              link="/new-product-incubation"
            />
            <ArrowRight className="size-5 text-slate-300 mt-8 flex-shrink-0" />
            <StageCard
              icon={Rocket}
              name="首发验证"
              count={3}
              status="关注"
              blocked={0}
              pending={2}
              health="attention"
              link="/launch-verification"
            />
            <ArrowRight className="size-5 text-slate-300 mt-8 flex-shrink-0" />
            <StageCard
              icon={Zap}
              name="增长优化"
              count={15}
              status="健康"
              blocked={2}
              pending={8}
              health="good"
              link="/growth-optimization"
            />
            <ArrowRight className="size-5 text-slate-300 mt-8 flex-shrink-0" />
            <StageCard
              icon={RefreshCw}
              name="老品升级"
              count={7}
              status="正常"
              blocked={0}
              pending={3}
              health="good"
              link="/product-upgrade"
            />
            <ArrowRight className="size-5 text-slate-300 mt-8 flex-shrink-0" />
            <StageCard
              icon={FileText}
              name="复盘沉淀"
              count={28}
              status="健康"
              blocked={0}
              pending={5}
              health="good"
              link="/review-assets"
            />
          </div>
        </div>
      </section>

      {/* Key Metrics */}
      <section>
        <h2 className="text-base font-semibold text-slate-900 mb-4">关键指标</h2>
        <div className="grid grid-cols-4 gap-4">
          <MetricCard title="活跃项目" value="60" change="+5" trend="up" />
          <MetricCard title="待决策事项" value="25" change="需处理" urgent />
          <MetricCard title="阻塞项目" value="2" change="需解决" urgent />
          <MetricCard title="Agent 活跃数" value="23" change="运行中" />
        </div>
      </section>

      {/* Project Health Overview */}
      <section>
        <h2 className="text-base font-semibold text-slate-900 mb-4">项目健康度总览</h2>
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="grid grid-cols-4 border-b border-slate-200">
            <div className="p-4 border-r border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-slate-600">健康</div>
                <CheckCircle2 className="size-4 text-green-600" />
              </div>
              <div className="text-2xl font-semibold text-slate-900">45</div>
              <div className="text-xs text-slate-500 mt-1">75% 项目</div>
            </div>
            <div className="p-4 border-r border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-slate-600">需关注</div>
                <AlertCircle className="size-4 text-orange-600" />
              </div>
              <div className="text-2xl font-semibold text-slate-900">12</div>
              <div className="text-xs text-slate-500 mt-1">20% 项目</div>
            </div>
            <div className="p-4 border-r border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-slate-600">风险</div>
                <AlertCircle className="size-4 text-red-600" />
              </div>
              <div className="text-2xl font-semibold text-slate-900">3</div>
              <div className="text-xs text-slate-500 mt-1">5% 项目</div>
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-slate-600">总计</div>
                <div className="size-4" />
              </div>
              <div className="text-2xl font-semibold text-slate-900">60</div>
              <div className="text-xs text-slate-500 mt-1">活跃项目</div>
            </div>
          </div>
        </div>
      </section>

      {/* Human Intervention Needed */}
      <section>
        <h2 className="text-base font-semibold text-slate-900 mb-4">最需要人工拍板</h2>
        <div className="space-y-3">
          <InterventionItem
            stage="首发验证"
            project="夏日清爽套装"
            decision="是否调整定价策略"
            priority="高"
            waiting="2 天"
          />
          <InterventionItem
            stage="商机池"
            project="极简风通勤包系列"
            decision="是否立项"
            priority="高"
            waiting="1 天"
          />
          <InterventionItem
            stage="新品孵化"
            project="潮流街头包"
            decision="打样方案评审"
            priority="中"
            waiting="3 天"
          />
          <InterventionItem
            stage="增长优化"
            project="经典通勤包"
            decision="是否追加投放预算"
            priority="中"
            waiting="1 天"
          />
        </div>
      </section>

      {/* Agent Activity Status */}
      <section>
        <h2 className="text-base font-semibold text-slate-900 mb-4">Agent 活跃状态</h2>
        <div className="grid grid-cols-3 gap-4">
          <AgentActivityCard
            stage="新品孵化"
            agents={5}
            actions={23}
            lastActivity="定义商品规格"
            time="2分钟前"
          />
          <AgentActivityCard
            stage="增长优化"
            agents={8}
            actions={45}
            lastActivity="优化投放计划"
            time="刚刚"
          />
          <AgentActivityCard
            stage="首发验证"
            agents={3}
            actions={12}
            lastActivity="分析首发数据"
            time="5分钟前"
          />
        </div>
      </section>
    </div>
  );
}

interface StageCardProps {
  icon: React.ElementType;
  name: string;
  count: number;
  status: string;
  blocked: number;
  pending: number;
  health: "good" | "attention" | "risk";
  link: string;
}

function StageCard({ icon: Icon, name, count, status, blocked, pending, health, link }: StageCardProps) {
  const healthColors = {
    good: "border-green-200 bg-green-50",
    attention: "border-orange-200 bg-orange-50",
    risk: "border-red-200 bg-red-50",
  };

  const statusColors = {
    good: "bg-green-100 text-green-700",
    attention: "bg-orange-100 text-orange-700",
    risk: "bg-red-100 text-red-700",
  };

  return (
    <Link
      to={link}
      className={`flex-1 rounded-lg border p-4 hover:shadow-md transition-all ${healthColors[health]}`}
    >
      <div className="flex items-center justify-between mb-3">
        <Icon className="size-5 text-slate-700" />
        <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[health]}`}>
          {status}
        </span>
      </div>
      <div className="mb-2">
        <div className="text-2xl font-semibold text-slate-900">{count}</div>
        <div className="text-sm text-slate-700">{name}</div>
      </div>
      <div className="space-y-1 text-xs text-slate-600">
        {blocked > 0 && (
          <div className="flex items-center">
            <AlertCircle className="size-3 mr-1 text-red-600" />
            {blocked} 阻塞
          </div>
        )}
        {pending > 0 && (
          <div className="flex items-center">
            <Clock className="size-3 mr-1 text-orange-600" />
            {pending} 待处理
          </div>
        )}
      </div>
    </Link>
  );
}

interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  trend?: "up" | "down";
  urgent?: boolean;
}

function MetricCard({ title, value, change, trend, urgent }: MetricCardProps) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <div className="text-sm text-slate-600 mb-1">{title}</div>
      <div className="text-2xl font-semibold text-slate-900 mb-1">{value}</div>
      <div
        className={`text-xs ${
          urgent ? "text-orange-600" : trend === "up" ? "text-green-600" : "text-slate-500"
        }`}
      >
        {change}
      </div>
    </div>
  );
}

interface InterventionItemProps {
  stage: string;
  project: string;
  decision: string;
  priority: string;
  waiting: string;
}

function InterventionItem({ stage, project, decision, priority, waiting }: InterventionItemProps) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 hover:border-blue-300 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs rounded">{stage}</span>
            <span className="font-medium text-slate-900">{project}</span>
            <span
              className={`px-2 py-0.5 text-xs font-medium rounded ${
                priority === "高" ? "bg-red-50 text-red-700" : "bg-orange-50 text-orange-700"
              }`}
            >
              {priority}优
            </span>
          </div>
          <div className="text-sm text-slate-700 mb-1">{decision}</div>
          <div className="flex items-center text-xs text-slate-500">
            <Clock className="size-3 mr-1" />
            等待 {waiting}
          </div>
        </div>
        <button className="ml-4 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
          处理
        </button>
      </div>
    </div>
  );
}

interface AgentActivityCardProps {
  stage: string;
  agents: number;
  actions: number;
  lastActivity: string;
  time: string;
}

function AgentActivityCard({ stage, agents, actions, lastActivity, time }: AgentActivityCardProps) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-slate-900">{stage}</h3>
        <div className="size-2 rounded-full bg-green-500" />
      </div>
      <div className="space-y-2 text-sm mb-3">
        <div className="flex justify-between">
          <span className="text-slate-600">活跃 Agent</span>
          <span className="text-slate-900 font-medium">{agents}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-600">今日动作</span>
          <span className="text-slate-900 font-medium">{actions}</span>
        </div>
      </div>
      <div className="pt-3 border-t border-slate-200">
        <div className="text-xs text-slate-600 mb-0.5">最新活动</div>
        <div className="text-sm text-slate-900">{lastActivity}</div>
        <div className="text-xs text-slate-500 mt-1">{time}</div>
      </div>
    </div>
  );
}
