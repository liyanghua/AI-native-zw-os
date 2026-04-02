# Domain Contract Notes

## Canonical Naming
- 生命周期 canonical 枚举继续使用 `launch_validation`、`review_capture`
- UI 文案里允许显示“首发验证 / launch verification”，但不新增新的 enum
- “review closed” 语义落在 `review_capture + ProjectStatus.closed`
- 所有时间字段统一使用 `*At` 命名，格式为 ISO-like timestamp string
- 所有跨对象引用统一使用稳定 ID 字段，例如 `projectId`、`decisionId`、`actionId`、`reviewId`、`assetId`

## Canonical Objects
- `ProjectObject`：统一项目对象，承载 stage/status/health/risk、identity、state machine、decision、actions、review、assets
- `ProjectRealtimeSnapshot`：只承载轻实时状态，包括 KPI、风险、审批、Agent、exception count
- `ProjectIdentity`：项目归一层，不把 `projectId` 当作天然存在
- `DecisionContext` / `DecisionObject`：把证据、诊断、建议动作、审批要求和验证计划结构化
- `ActionItem`：显式带 `actionVersion`、`decisionId`、`idempotencyKey`、`writebackStatus`
- `ReviewSummary` / `ReviewLineage` / `AssetLineage`：把复盘和资产沉淀挂回 source decision/action/execution

## Runtime Validation Coverage
- 关键对象已纳入 `src/domain/runtime/validators.ts`
- 当前校验覆盖：
  - identity / identity logs
  - decision context / decision object
  - action / audit / writeback
  - review / lineage
  - knowledge asset / applicability
  - project object / realtime snapshot / pilot snapshot

## Shape Drift Closed In This Round
- 页面不再直接从 `runtime.*Gateway` 手工拼 detail/action/review/dashboard shape
- `/project/:id`、`/action-center`、`/review-assets`、`/asset-library`、生命周期页、角色页改为消费 repository query
- Risk & Approval 不再直接在页面内做低置信度/审批/规则边界拼装，而是走 `RiskApprovalViewModel`

## Compatibility Notes
- 当前仍保留 `pilotRuntime` 作为底层试点数据源，但页面已不再依赖它的原始 gateway 形状
- repository 层当前返回同步 `QueryResult<T>`，未来替换为真实异步 API 时无需改变页面消费模式
- 5 类 source adapter 目前仍基于本地 seed state，但已经拆成独立 source-binding 边界，可逐步替换成 bridge/API
