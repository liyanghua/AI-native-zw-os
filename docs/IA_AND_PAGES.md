# Information Architecture and Pages

本文档与可运行原型一致：`src/app/routes.tsx` + `src/app/components/layout/Layout.tsx`。

---

## 1. Global Navigation（侧栏一级结构）

侧栏按分组呈现（与代码中 `navigation` 数组一致；`separator` 为视觉分隔）：

| 中文（界面） | 路径 |
|-------------|------|
| 经营指挥台 | `/`、`/boss` |
| 生命周期总览 | `/lifecycle` |
| ——（分隔） | —— |
| 商机池 | `/opportunity-pool` |
| 新品孵化 | `/new-product-incubation` |
| 首发验证 | `/launch-verification` |
| 增长优化 | `/growth-optimization` |
| 老品升级 | `/product-upgrade` |
| ——（分隔） | —— |
| 动作中心 | `/action-center` |
| 风险与审批 | `/risk-approval` |
| 复盘沉淀 | `/review-assets` |
| 经验资产库 | `/asset-library` |

产品语义上仍对应 IA 中的 Command Center、Lifecycle stages、Action Hub、Governance、Review、Assets；**界面文案以中文为准**（见 `lang.md`）。

---

## 2. Role Views（顶部角色切换）

与代码中 `roles` 一致；切换角色会 `navigate` 到对应路径：

| id | 中文 | 路径 |
|----|------|------|
| boss | 老板 | `/boss` |
| product | 产品研发总监 | `/product-director` |
| operations | 运营与营销总监 | `/operations-director` |
| visual | 视觉总监 | `/visual-director` |

角色视图改变默认进入的「指挥台」页面及顶部强调点，不改变产品与 `DATA_MODEL.md` 中的底层对象定义。

---

## 3. Core Pages（产品能力 · 与原型对应）

以下沿用产品侧英文页名便于与 `DATA_MODEL`、架构文档对照；括号内为路由。

### 3.1 CEO Command Center（`/boss`，首页同）

Goal:
- show top business pulse
- show top opportunities, top risks, top pending approvals
- show battle status and resource allocation
- show organization and AI efficiency

Core models:
- `PulseBundle`
- `ProjectObject[]`
- `ActionItem[]`
- `ExceptionItem[]`

---

### 3.2 Product R&D Director Desk（`/product-director`）

Goal:
- review opportunity pool
- review new product incubation pipeline
- compare product definition options
- track sampling and feasibility risk
- review legacy upgrade opportunities

Core models:
- `PulseBundle`
- `ProjectObject[]`
- `DecisionObject`
- `ProductDefinition`
- `SamplingReview`

---

### 3.3 Growth / Operations Director Desk（`/operations-director`）

Goal:
- review launch and growth pulse
- identify top product opportunities/risks
- compare optimization plans
- approve key actions
- track blockers and agent state

注：原型侧栏文案为「运营与营销总监」，与 README 中「运营&营销总监」一致。

Core models:
- `PulseBundle`
- `ProjectObject[]`
- `ActionItem[]`
- `ExceptionItem[]`
- `AgentState[]`
- `ProjectRealtimeSnapshot`

---

### 3.4 Visual Director Desk（`/visual-director`）

Goal:
- review visual expression priorities
- compare visual versions
- identify visual upgrade opportunities
- track template reuse and visual asset quality

Core models:
- `PulseBundle`
- `ProjectObject[]`
- `ExpressionPlan`
- `CreativeVersion[]`
- `PublishedAsset[]`

---

### 3.5 Lifecycle Overview（`/lifecycle`）

Goal:
- show all projects across lifecycle stages
- show bottlenecks, approvals, health and live state
- serve as operating map of the system

Core models:
- `ProjectObject[]`
- `LifecycleOverviewVM`
- `ProjectRealtimeSnapshot[]`
- `ExceptionItem[]`
- `ActionItem[]`

---

### 3.6 Opportunity Pool（`/opportunity-pool`）

Goal:
- maintain opportunity candidates
- score and rank them
- turn opportunity into project

Core models:
- `ProjectObject[]`
- `OpportunitySignal[]`
- `OpportunityAssessment`
- `DecisionObject`

---

### 3.7 New Product Incubation（`/new-product-incubation`）

Goal:
- move opportunity into launchable product project

Core models:
- `ProjectObject[]`
- `ProductDefinition`
- `SamplingReview`
- `DecisionObject`
- `ActionItem[]`

---

### 3.8 Launch Validation（`/launch-verification`）

Goal:
- validate whether launched product is worth scaling

Core models:
- `ProjectObject[]`
- `ExpressionPlan`
- `CreativeVersion[]`
- `DecisionObject`
- `ProjectRealtimeSnapshot`

---

### 3.9 Growth Optimization（`/growth-optimization`）

Goal:
- optimize mature and high-potential products
- support explosive growth strategy

Core models:
- `ProjectObject[]`
- `DecisionObject`
- `ActionItem[]`
- `AgentState[]`
- `ProjectRealtimeSnapshot`

---

### 3.10 Legacy Upgrade（`/product-upgrade`）

Goal:
- identify and execute upgrade opportunities for legacy products

路由路径为 `product-upgrade`，产品域阶段枚举仍可为 `legacy_upgrade`（见 `docs/DATA_MODEL.md`，本次未改）。

Core models:
- `ProjectObject[]`
- `DecisionObject`
- `ProductDefinition`
- `ExpressionPlan`
- `ReviewSummary`

---

### 3.11 Project Object Page（`/project/:id`）

Goal:
- unify all collaboration around one project object

Core models:
- `ProjectObject`
- `DecisionObject`
- `ProductDefinition`
- `ExpressionPlan`
- `ActionItem[]`
- `AgentState[]`
- `ReviewSummary`
- `AssetCandidate[]`
- `ProjectRealtimeSnapshot`

---

### 3.12 Action Hub（`/action-center`）

Goal:
- manage decision-to-action lifecycle

Core models:
- `ActionItem[]`
- `ApprovalRecord[]`
- `ExecutionLog[]`

---

### 3.13 Governance Console（`/risk-approval`）

Goal:
- manage exceptions, high-risk items, low-confidence suggestions, and agent failures

界面名「风险与审批」；路径 `risk-approval`。

Core models:
- `ExceptionItem[]`
- `ActionItem[]`
- `DecisionObject[]`
- `PolicyBoundary[]`
- `ExecutionLog[]`

---

### 3.14 Review to Asset Loop（`/review-assets`）

Goal:
- turn outcome into learning and reusable assets

Core models:
- `ReviewSummary`
- `AttributionFactor[]`
- `AssetCandidate[]`
- `PublishedAsset[]`

---

### 3.15 Asset Hub（`/asset-library`）

Goal:
- manage reusable operating assets

Core models:
- `PublishedAsset[]`
- `AssetCandidate[]`

---

## 4. Product-to-Page Mapping

| Product Goal | Primary Page / Area | Core Objects |
|---|---|---|
| Show executive business pulse, key risks, and strategic approvals | 经营指挥台 `/boss` | `PulseBundle`, `ProjectObject`, `ActionItem`, `ExceptionItem` |
| Review opportunities, incubation status, and definition quality | 产品研发总监台 + 阶段站 | `ProjectObject`, `OpportunityAssessment`, `DecisionObject`, `ProductDefinition`, `SamplingReview` |
| Review launch, growth, blockers, approvals, and battle priorities | 运营与营销总监台 + 首发/增长站 | `ProjectObject`, `DecisionObject`, `ActionItem`, `ProjectRealtimeSnapshot`, `ExceptionItem` |
| Review expression strategy, version performance, and reusable visual assets | 视觉总监台 | `ProjectObject`, `ExpressionPlan`, `CreativeVersion`, `PublishedAsset` |
| Show lifecycle distribution, bottlenecks, and health | 生命周期总览 `/lifecycle` | `ProjectObject`, `ProjectRealtimeSnapshot`, `ActionItem`, `ExceptionItem` |
| Center all collaboration around one project | 商品项目详情 `/project/:id` | `ProjectObject`, `DecisionObject`, `ProductDefinition`, `ExpressionPlan`, `ActionItem`, `ReviewSummary` |
| Manage action lifecycle from suggestion to rollback | 动作中心 `/action-center` | `ActionItem`, `ApprovalRecord`, `ExecutionLog` |
| Handle exceptions, policy boundaries, and high-risk actions | 风险与审批 `/risk-approval` | `ExceptionItem`, `PolicyBoundary`, `DecisionObject`, `ActionItem` |
| Turn review into reusable operating assets | 复盘沉淀 + 经验资产库 | `ReviewSummary`, `AssetCandidate`, `PublishedAsset` |

---

## 5. Page-to-Code Mapping（当前仓库）

路由定义：`src/app/routes.tsx`。布局与侧栏：`src/app/components/layout/Layout.tsx`。应用入口：`src/main.tsx`、`src/app/App.tsx`。

| 路径 | 组件文件 |
|------|-----------|
| `/`、`/boss` | `src/app/components/dashboards/BossDashboard.tsx` |
| `/product-director` | `src/app/components/dashboards/ProductDirectorDashboard.tsx` |
| `/operations-director` | `src/app/components/dashboards/OperationsDirectorDashboard.tsx` |
| `/visual-director` | `src/app/components/dashboards/VisualDirectorDashboard.tsx` |
| `/lifecycle` | `src/app/components/lifecycle/LifecycleOverview.tsx` |
| `/project/:id` | `src/app/components/projects/ProjectDetail.tsx` |
| `/opportunity-pool` | `src/app/components/lifecycle/OpportunityPool.tsx` |
| `/new-product-incubation` | `src/app/components/lifecycle/NewProductIncubation.tsx` |
| `/launch-verification` | `src/app/components/lifecycle/LaunchVerification.tsx` |
| `/growth-optimization` | `src/app/components/lifecycle/GrowthOptimization.tsx` |
| `/product-upgrade` | `src/app/components/lifecycle/ProductUpgrade.tsx` |
| `/action-center` | `src/app/components/actions/ActionCenter.tsx` |
| `/risk-approval` | `src/app/components/risk/RiskAndApproval.tsx` |
| `/review-assets` | `src/app/components/review/ReviewAndAssets.tsx` |
| `/asset-library` | `src/app/components/assets/AssetLibrary.tsx` |
| `*` | `src/app/components/NotFound.tsx` |

共享 UI：`src/app/components/ui/*`。样式入口：`src/styles/index.css`（含 `tailwind.css`、`theme.css`）。

---

## 6. Global UI Requirements

Every important page should support:
- pulse-driven summary
- risk / confidence labels
- evidence panel
- approval state
- project health
- agent state or execution feed if relevant
- clear distinction between:
  - human decisions
  - AI recommendations
  - agent progress
  - automation results
