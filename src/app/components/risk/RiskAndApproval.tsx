import { Link } from "react-router";
import { AlertTriangle, Brain, ShieldAlert } from "lucide-react";
import { usePilotData } from "../../../data-access/PilotDataProvider";
import { getRiskLabel } from "../../../domain/runtime/labels";

const boundaries = [
  {
    id: "pricing",
    label: "价格动作",
    description: "首发调价、关键价格带变更必须人工批准。",
  },
  {
    id: "inventory",
    label: "库存补单",
    description: "补单金额超过预算阈值时必须人工批准。",
  },
  {
    id: "launch",
    label: "首发切换",
    description: "首发暂停、放量切换与回滚都必须留痕。",
  },
];

export function RiskAndApproval() {
  const { runtime, approveAction, rejectAction } = usePilotData();
  const snapshot = runtime.getSnapshot();
  const highRiskApprovals = runtime.actionGateway.listActions({ approvalStatus: "pending" });
  const lowConfidenceDecisions = snapshot.projects.filter(
    (project) => project.decisionObject && project.decisionObject.confidence !== "high",
  );

  return (
    <div className="p-8 space-y-6">
      <section className="grid grid-cols-3 gap-4">
        <SummaryCard label="风险事件" value={snapshot.exceptions.length} />
        <SummaryCard label="高风险待审批" value={highRiskApprovals.length} />
        <SummaryCard label="低置信度决策" value={lowConfidenceDecisions.length} />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-900">例外队列</h2>
          <p className="mt-1 text-sm text-slate-500">把真正需要人工介入的异常拉到最前面，而不是淹没在常规动作里。</p>
        </div>
        <div className="space-y-3">
          {snapshot.exceptions.map((exception) => (
            <div key={exception.id} className="rounded-xl border border-orange-200 bg-orange-50 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 size-5 text-orange-700" />
                <div className="flex-1">
                  <div className="font-medium text-slate-900">{exception.summary}</div>
                  <div className="mt-1 text-sm text-slate-600">{getRiskLabel(exception.severity)}</div>
                  {exception.projectId && (
                    <Link to={`/project/${exception.projectId}`} className="mt-2 inline-flex text-sm text-blue-600 hover:text-blue-700">
                      查看项目
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-900">高风险待审批</h2>
          <p className="mt-1 text-sm text-slate-500">老板和总监在这里处理真正有经营影响的动作。</p>
        </div>
        <div className="space-y-3">
          {highRiskApprovals.map((action) => (
            <div key={action.id} className="rounded-xl border border-slate-200 p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="font-medium text-slate-900">{action.title}</div>
                  <p className="text-sm text-slate-600">{action.summary}</p>
                  <div className="text-xs text-slate-500">
                    {getRiskLabel(action.risk)} · 责任人 {action.owner}
                  </div>
                  <Link to={`/project/${action.sourceProjectId}`} className="text-sm text-blue-600 hover:text-blue-700">
                    查看项目
                  </Link>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => rejectAction(action.id, "当前风险过高，暂不执行")}
                    className="rounded-lg bg-white px-3 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50"
                  >
                    拒绝
                  </button>
                  <button
                    onClick={() => approveAction(action.id)}
                    className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    批准
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-[0.8fr,1.2fr] gap-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900">低置信度决策</h2>
            <p className="mt-1 text-sm text-slate-500">需要人工补充判断，避免让大脑自己拍板。</p>
          </div>
          <div className="space-y-3">
            {lowConfidenceDecisions.map((project) => (
              <div key={project.id} className="rounded-xl bg-slate-50 p-4">
                <div className="flex items-start gap-3">
                  <Brain className="mt-0.5 size-4 text-violet-600" />
                  <div className="space-y-1">
                    <div className="font-medium text-slate-900">{project.name}</div>
                    <div className="text-sm text-slate-600">{project.decisionObject?.problemOrOpportunity}</div>
                    <div className="text-xs text-slate-500">当前置信度：{project.decisionObject?.confidence}</div>
                    <Link to={`/project/${project.id}`} className="text-sm text-blue-600 hover:text-blue-700">
                      去补充证据
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900">规则边界</h2>
            <p className="mt-1 text-sm text-slate-500">明确哪些动作可以自动推进，哪些必须人工控制。</p>
          </div>
          <div className="space-y-3">
            {boundaries.map((boundary) => (
              <div key={boundary.id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-start gap-3">
                  <ShieldAlert className="mt-0.5 size-4 text-slate-700" />
                  <div>
                    <div className="font-medium text-slate-900">{boundary.label}</div>
                    <div className="mt-1 text-sm text-slate-600">{boundary.description}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="text-2xl font-semibold text-slate-900">{value}</div>
      <div className="mt-1 text-sm text-slate-500">{label}</div>
    </div>
  );
}
