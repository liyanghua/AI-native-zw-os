# Implement Instructions

## 0. 当前仓库形态（与可运行代码一致）

本仓库 **可运行原型** 为 **Vite 6 + React 18 + React Router 7 + Tailwind 4** 的单页应用。

| 项 | 位置 |
|----|------|
| 入口 | `src/main.tsx` → `src/app/App.tsx`（`RouterProvider`） |
| 路由 | `src/app/routes.tsx`（`createBrowserRouter`） |
| 布局与导航 | `src/app/components/layout/Layout.tsx` |
| 页面实现 | `src/app/components/dashboards/*`、`lifecycle/*`、`projects/*`、`actions/*`、`risk/*`、`review/*`、`assets/*` |
| 样式 | `src/styles/index.css`（`tailwind.css`、`theme.css`） |
| 构建 | `package.json`：`npm run dev` / `npm run build` |

以下为 **实现约定**：领域类型、ViewModel、集中 mock 等可按里程碑逐步引入 `src/domain/*`、`src/state/*`；**与 `DATA_MODEL.md` 对齐时以该文档为准**（本次未改 `DATA_MODEL.md`）。

---

## 1. Source of Truth

以下文件（均在 `docs/`）为产品与结构事实来源：

1. `docs/README_PRODUCT.md`
2. `docs/ARCHITECTURE.md`
3. `docs/IA_AND_PAGES.md`
4. `docs/DATA_MODEL.md`
5. `docs/PLAN.md`
6. `docs/DECISIONS.md`

若实现与上述文档冲突，应先改文档或记录偏差再推进。

---

## 2. Core Rules

1. Keep scope limited to the current milestone or requested slice.
2. Prefer reusable components over page-only ad hoc markup.
3. Preserve lifecycle-driven and project-object-centered **product** structure（导航与故事线与 README / IA 一致）.
4. Do not turn the product into a generic dashboard-only or chat-shell experience.
5. Surface management decisions, approvals, exceptions, and live state clearly where the page goal requires it.
6. Distinguish explicitly between human decisions, AI recommendations, agent progress, and automation results.
7. Use mock / static presentation data until real integrations are in scope.
8. Update **§8 Progress Notes** when routes、主要组件归属或技术栈假设变化.

---

## 3. Frontend Design Rules

1. Cards and sections should feel **management-oriented**（便于取舍与审批），而非纯数据堆砌。
2. Default layout should emphasize pulse、风险、机会、待审批、阻塞、项目健康（随页面调整权重）。
3. AI modules should be embedded in-page, not a floating generic assistant.
4. Action lifecycle and governance should be visually understandable on 动作中心 / 风险与审批 等页。
5. Review / 复盘沉淀 pages should communicate path toward assets（与 README 闭环一致）.
6. **视觉与交互**：以 `docs/Guidelines.md` 与 `src/styles/theme.css`（经 `index.css` 引入）为令牌参考；壳层为 `Layout.tsx`（侧栏 + 顶栏角色切换）。

---

## 4. Code Rules

1. Use TypeScript for components; keep props and small local types explicit.
2. When introducing shared domain types, centralize under `src/domain/types/*`（对齐 `DATA_MODEL.md`）.
3. Shared UI primitives live in `src/app/components/ui/*`.
4. Keep route definitions in `src/app/routes.tsx`；新增页面时同步更新 `docs/IA_AND_PAGES.md` §5。
5. Prefer ViewModel mappers for page-specific formatting instead of duplicating domain shapes in every file（在 domain 层落地后）.

---

## 5. Product-to-Code Mapping（原型）

详细路径表见 **`docs/IA_AND_PAGES.md` §5**。本节为按产品目标的快速索引。

### 5.1 经营指挥台（老板）
- 组件：`src/app/components/dashboards/BossDashboard.tsx`
- 路由：`/`、`/boss`

### 5.2 产品研发总监台
- 组件：`src/app/components/dashboards/ProductDirectorDashboard.tsx`
- 路由：`/product-director`

### 5.3 运营与营销总监台
- 组件：`src/app/components/dashboards/OperationsDirectorDashboard.tsx`
- 路由：`/operations-director`

### 5.4 视觉总监台
- 组件：`src/app/components/dashboards/VisualDirectorDashboard.tsx`
- 路由：`/visual-director`

### 5.5 生命周期总览
- 组件：`src/app/components/lifecycle/LifecycleOverview.tsx`
- 路由：`/lifecycle`

### 5.6–5.10 生命周期阶段站
| 阶段（中文导航） | 组件 |
|------------------|------|
| 商机池 | `lifecycle/OpportunityPool.tsx` |
| 新品孵化 | `lifecycle/NewProductIncubation.tsx` |
| 首发验证 | `lifecycle/LaunchVerification.tsx` |
| 增长优化 | `lifecycle/GrowthOptimization.tsx` |
| 老品升级 | `lifecycle/ProductUpgrade.tsx` |

### 5.11 商品项目详情
- 组件：`src/app/components/projects/ProjectDetail.tsx`
- 路由：`/project/:id`

### 5.12 动作中心
- 组件：`src/app/components/actions/ActionCenter.tsx`
- 路由：`/action-center`

### 5.13 风险与审批
- 组件：`src/app/components/risk/RiskAndApproval.tsx`
- 路由：`/risk-approval`

### 5.14 复盘沉淀
- 组件：`src/app/components/review/ReviewAndAssets.tsx`
- 路由：`/review-assets`

### 5.15 经验资产库
- 组件：`src/app/components/assets/AssetLibrary.tsx`
- 路由：`/asset-library`

---

## 6. Implementation Sequence Rules

When extending beyond the current prototype:

1. Stabilize routes and `Layout` navigation.
2. Introduce or align domain types with `DATA_MODEL.md`.
3. Extract repeated UI into shared blocks.
4. Add ViewModels and mocks where needed.

---

## 7. Validation Checklist Per Change

- `npm run build` 通过
- 主要路由可访问、侧栏高亮与路径一致
- 无显而易见坏链（Link `to` 与 `routes.tsx` 一致）
- 文档（至少 `IA_AND_PAGES` / `IMPLEMENT`）与代码同步

---

## 8. Progress Notes

### 2026-04-02：repository-first 收口与 source adapter 拆分

- **数据访问形态**：`PilotDataProvider` 不再对页面直接暴露 `runtime.*Gateway`，而是暴露 `repositories + actions`；页面现在统一消费 `QueryResult<T>` 与对应 ViewModel。
- **新增 repository 层**：已落地 `IdentityRepository`、`ProjectWorkbenchRepository`、`ActionCenterRepository`、`KnowledgeRepository`、`RoleDashboardRepository`、`LifecycleRepository`、`RiskApprovalRepository`。
- **新增 query contract**：补 `src/domain/types/query.ts`，统一 `loading / error / stale / partial / lastUpdatedAt / issues[]`；核心页面通过 `QueryStatusPanel` 显式展示异常态和数据缺口。
- **source adapter 拆分**：`pilotAdapter` 的 source ref 绑定已拆为 5 类 adapter：商机信号、商品定义、KPI 快照、审批/执行事件、复盘/资产。
- **指标与故事线**：新增试点指标计算逻辑 `project_id_resolution_success_rate`、`cross_page_object_consistency_rate`、`decision_compile_success_rate`、`action_writeback_success_rate`、`review_to_asset_lineage_integrity_rate`，并接入老板视图；动作中心新增 decision-driven recommended actions 区域，项目页新增显式“编译上下文 / 编译决策”入口。

### 2026-04-02：V2 单线试点骨架落地

- **范围**：当前原型已从“页面内联 mock 展示”升级为本地 `pilotRuntime` 驱动的 V2 闭环骨架，覆盖 `ProjectIdentity`、生命周期状态机、`DecisionContext` / `DecisionObject`、审批/执行/复盘/资产 lineage、幂等写回记录，以及 `/project/:id`、`/action-center`、`/review-assets`、`/asset-library`、生命周期入口页、角色看板的统一 query + ViewModel 消费。
- **canonical 约束**：生命周期枚举继续对齐 `DATA_MODEL.md`，内部保持 `launch_validation` / `review_capture`；V2 文案中的 `launch_verification` / `review_closed` 暂不作为新的 canonical enum 引入。`review_closed` 语义落在 `review_capture + ProjectStatus.closed`。
- **前端结构**：`src/domain/types/*` 已补齐 identity / state machine / decision / lineage / HITL schema；`src/domain/runtime/*` 已补齐对应 labels / validators；`src/data-access/*` 已升级为可追溯 pilot runtime；`src/view-models/*` 负责页面整形，页面组件不再直接拼业务 shape。
- **行为约束**：写回链路现在显式区分 `executionStatus` 与 `writebackStatus`，并通过 `idempotencyKey` + writeback record 做幂等；知识资产已带结构化 `applicability`，检索可按阶段 / 角色 / 业务目标过滤；状态迁移通过 exit criteria 阻断非法推进。
- **试点边界**：`/product-upgrade` 明确调整为“范围说明页”，不进入本轮真实数据接入；当前仍采用本地 pilot runtime + 轮询刷新，不引入开放式聊天壳和 WebSocket-first 实时架构。

### 2026-04：文档与 Vite 原型对齐

- **背景**：`docs/` 中部分路径、Next.js 里程碑记录与当前仓库不一致；用户要求按 **系统原型** 更新 `docs/`（**保留 `DATA_MODEL.md` 不动**）。
- **原型事实**：侧栏品牌为「AI-native / 经营操盘系统V2」；路由与组件映射以 `src/app/routes.tsx` 与 `docs/IA_AND_PAGES.md` §5 为准。
- **范围**：已更新 `IA_AND_PAGES.md`、`AGENTS.md`、`IMPLEMENT.md`（本节及映射）、`ARCHITECTURE.md`、`README_PRODUCT.md`、`Guidelines.md`、`Instructions.md`、`PLAN.md`、`lang.md` 等中与路径/技术栈冲突的表述；**未修改** `DATA_MODEL.md`。
- **后续**：若在原型中引入 `src/domain`、`src/state` 或与 `DATA_MODEL` 双向绑定的 mock，请在 §8 追加条目并指向具体 PR / 提交说明。

---

### 历史说明（仅供参考）

此前文档中关于 **Next.js App Router**（如 `src/app/command-center/page.tsx`）、**大规模 milestone 文件清单** 的描述对应另一套脚手架迭代，**不等同于当前 Figma/Make 导出后的 Vite 目录**。产品意图仍以 `README_PRODUCT.md`、`ARCHITECTURE.md`、`DATA_MODEL.md` 为准；**代码路径**以本节与 `IA_AND_PAGES.md` §5 为准。
