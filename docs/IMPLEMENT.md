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

### Batch 1 新增的本地沙箱底座

| 项 | 位置 |
|----|------|
| SQLite schema / init / seed | `server/db/*` |
| Local API | `server/api/*` |
| API 运行脚本 | `npm run db:init` / `npm run db:seed` / `npm run api` |
| API DTO | `src/domain/types/api.ts` |
| API client | `src/data-access/apiClient.ts` |
| API-backed repositories | `src/data-access/localSandboxRepositories/*` |
| Batch 1 异步 query hook | `src/data-access/useRemoteQuery.ts` |

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
- 路由：`/product-rnd-director`（兼容 `/product-director`）

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

### 5.16 评测中心
- 组件：`src/app/components/eval/EvalCenter.tsx`
- 路由：`/eval-center`

### 5.17 Ontology Registry
- 组件：`src/app/components/ontology/OntologyRegistry.tsx`
- 路由：`/ontology-registry`

### 5.18 Bridge 诊断
- 组件：`src/app/components/bridge/BridgeDiagnostics.tsx`
- 路由：`/bridge-diagnostics`

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

## 7.1 本地运行方式

1. 初始化数据库
   - `npm run db:init`
2. 写入演示数据
   - `npm run db:seed`
3. 启动本地 API
   - `npm run api`
4. 另开一个终端启动前端
   - `npm run dev`

前端开发环境下，Vite 会把 `/api/*` 代理到 `http://127.0.0.1:4318`。

---

## 8. Progress Notes

### 2026-04-03：Batch 6 运行内核、评测、Ontology 与 Bridge foundation 落地

- **Runtime Kernel**：新增 `workflow_runs`、`task_runs`、`runtime_events`、`retry_records`，并把审批、trigger、mock-run、writeback、review、publish 的状态推进补到 `workflow -> task -> runtime event` 轨迹上。
- **Runtime API**：新增 `GET /api/runtime/workflows`、`GET /api/runtime/workflows/:id`、`POST /api/runtime/tasks/:id/retry`、`POST /api/runtime/tasks/:id/cancel`，项目摘要增加 `GET /api/projects/:id/runtime`。
- **Evaluation Harness**：新增 `eval_cases`、`eval_suites`、`eval_runs`、`eval_results`、`gate_decisions`，并落地 `GET /api/eval/cases`、`GET /api/eval/suites`、`POST /api/eval/run`、`GET /api/eval/runs`、`GET /api/eval/runs/:id`。
- **Ontology Governance**：新增 `ontology_registry`、`ontology_versions`、`policy_objects`、`template_objects`、`skill_objects`，并落地 `GET /api/ontology/registry`、`GET /api/ontology/registry/:id`、`POST /api/ontology/activate`、`POST /api/ontology/deprecate`。
- **Bridge Adapter Layer**：新增 `source_adapters`、`bridge_configs`、`sync_records`、`connector_registry`，并落地 `GET /api/bridge/adapters`、`POST /api/bridge/sync`、`GET /api/bridge/sync-records`；当前 `file_bridge` 使用 repo 内 fixture 做最小 upsert 演示。
- **repository 收口**：`localSandboxRepositories` 新增 `runtimeRepository`、`evalRepository`、`ontologyRepository`、`bridgeRepository`，`projects.getWorkbench(projectId)` 现已聚合 runtime / eval / ontology / bridge 摘要。
- **页面接入**：
  - `/project/:id` 新增 runtime timeline、latest gate、ontology refs、bridge freshness
  - `/action-center` 新增 workflow status / quick status
  - 新增 `/eval-center`
  - 新增 `/ontology-registry`
  - 新增 `/bridge-diagnostics`
- **角色页联动**：角色首页 summary metrics 已开始反映 runtime failed/retryable、gate warnings、bridge stale sync 等 Batch 6 风险信号。
- **未纳入 Batch 6**：分布式 queue / worker、真实 API bridge、完整 ontology 内容平台、复杂异步 runtime 编排仍留到后续批次。

### 2026-04-03：Batch 4 mock 执行闭环落地

- **SQLite 扩展**：新增 `approvals`、`execution_runs`、`execution_logs`、`writeback_records`，并扩展 `actions`、`reviews`、`asset_candidates` 的闭环字段。
- **执行 API**：新增 `POST /api/actions/:id/approve`、`POST /api/actions/:id/reject`、`POST /api/agent/trigger`、`POST /api/execution/mock-run`、`POST /api/execution/:runId/writeback`、`POST /api/review/generate`、`POST /api/assets/publish-candidate`，以及 `GET /api/projects/:id/lineage`。
- **server orchestration**：本地 server 现已承担审批校验、execution run 创建、mock connector 调用、writeback、review generate、asset candidate publish 的状态推进逻辑。
- **domain-aware mock connector**：`operations`、`product_rnd`、`visual` 三类动作域现在返回不同的 request / response payload、指标变化与结果说明。
- **repository 收口**：`localSandboxRepositories` 新增 `executionRepository`，项目工作台聚合查询已带 execution history、review、asset candidate 与 lineage。
- **项目详情页升级**：`/project/:id` 新增 Action Execution、Execution History、Review、Asset Candidate 四个区块，可逐步触发批准 / 驳回 / trigger / mock-run / writeback / review / publish。
- **角色页联动**：`boss` 与 `operations_director` dashboard 已开始反映 pending approvals、execution status、review generated、asset candidate 等闭环状态。
- **未纳入 Batch 4**：真实外部执行 connector、复杂异步 orchestration、动作中心正式迁移、完整资产治理仍留到后续批次。

### 2026-04-03：Batch 5 治理、沉淀、回流与评测闭环落地

- **SQLite 扩展**：新增 `published_assets`、`evaluation_records`、`knowledge_feedback_records`，并扩展 `reviews`、`asset_candidates` 的治理字段。
- **治理 API**：新增 `GET /api/actions`、`GET /api/reviews`、`POST /api/reviews/:id/promote-to-asset`、`GET /api/assets`、`POST /api/assets/:id/publish`、`POST /api/assets/:id/feedback-to-knowledge`、`POST /api/knowledge/feedback`、`GET /api/evaluations`、`POST /api/evaluations/run`、`GET /api/projects/:id/governance`。
- **server compose**：新增 action center、review center、asset library、knowledge feedback、evaluation、project governance summary 的 server 侧治理编排。
- **知识回流**：当前 feedback 策略为“立即物化为新的 `knowledge_assets` + `knowledge_chunks`”，并写 `knowledge_feedback_records`；后续 `POST /api/knowledge/search` 可检索到新增来源。
- **repository 收口**：`localSandboxRepositories` 新增 `governanceRepository`，统一承接 actions / reviews / assets / evaluations / feedback / project governance。
- **页面迁移**：
  - `/action-center` 已正式切到 `GET /api/actions`
  - `/review-assets` 已正式切到 `GET /api/reviews`
  - `/asset-library` 已正式切到 `GET /api/assets`
  - `/project/:id` 已新增治理摘要卡并可跳转治理页
- **角色联动**：角色首页 summary metrics 已开始展示治理层信号，例如待拍板动作、review 生成数、方法资产、知识回流候选。
- **未纳入 Batch 5**：真实向量库、真实 A/B / 实验验证、真实多租户治理、复杂资产编辑器 / CMS、生产级 workflow engine 仍留在后续批次。

### 2026-04-02：Batch 2 本地知识检索与决策编译主线落地

- **SQLite 扩展**：新增 `knowledge_assets`、`knowledge_chunks`、`knowledge_chunks_fts`、`knowledge_retrieval_logs`，通过 `server/db/schema.mjs` 与 `server/db/seed.mjs` 管理。
- **知识 seed**：本地已写入 SOP、rule、case、template、evaluation sample，并在 seed 阶段完成 markdown chunk 化与 FTS 索引落表。
- **Knowledge API**：新增 `POST /api/knowledge/search` 与 `GET /api/projects/:id/knowledge`，后端从 SQLite 检索知识并记录 retrieval log。
- **Brain API**：新增 `POST /api/brain/compile-context`、`POST /api/brain/compile-decision`、`POST /api/brain/compile-role-story`；当前 compile 逻辑为 server 侧规则驱动 + 知识检索组合。
- **repository 收口**：`localSandboxRepositories` 新增 knowledge / brain repository，`projects.getWorkbench(projectId)` 负责聚合项目详情、知识证据、decision context、decision object、boss/director role story。
- **项目详情页升级**：`/project/:id` 现已展示 current problem、decision summary、recommended actions、fact / method evidence、missing evidence flags，以及 `boss` / `director` 的 role story 切换区。
- **未纳入 Batch 2**：动作执行、审批流、Agent trigger、review generate、asset publish、老板 / 总监页主数据源迁移仍在后续批次。

### 2026-04-02：Batch 3 角色闭环入口迁移落地

- **Role Dashboard API**：新增 `GET /api/roles/:role/dashboard`，支持 `boss`、`operations_director`、`product_rnd_director`、`visual_director`，并兼容 `director -> operations_director` alias。
- **Role repository / query**：`localSandboxRepositories` 新增 `rolesRepository`，角色页统一通过 `useRemoteQuery + sandboxRepositories.roles.getDashboard(role)` 获取数据。
- **Server role-aware composition**：新增 role profile、director archetype、role dashboard compose object，服务端按角色生成不同摘要逻辑。
- **页面迁移**：`/boss`、`/operations-director` 已正式迁到 API-backed role dashboard；`/product-rnd-director`、`/visual-director` 已接上 skeleton 页面；`/product-director` 保留兼容跳转。
- **项目页联动**：`/project/:id` 当前支持 4 个 role story 切换，验证角色页与项目详情页围绕同一 `projectId` 同源。
- **未纳入 Batch 3**：execution / writeback、review generate、asset publish、动作中心正式迁移仍留到 Batch 4。

### 2026-04-02：repository-first 收口与 source adapter 拆分

- **数据访问形态**：`PilotDataProvider` 不再对页面直接暴露 `runtime.*Gateway`，而是暴露 `repositories + actions`；页面现在统一消费 `QueryResult<T>` 与对应 ViewModel。
- **新增 repository 层**：已落地 `IdentityRepository`、`ProjectWorkbenchRepository`、`ActionCenterRepository`、`KnowledgeRepository`、`RoleDashboardRepository`、`LifecycleRepository`、`RiskApprovalRepository`。
- **新增 query contract**：补 `src/domain/types/query.ts`，统一 `loading / error / stale / partial / lastUpdatedAt / issues[]`；核心页面通过 `QueryStatusPanel` 显式展示异常态和数据缺口。
- **source adapter 拆分**：`pilotAdapter` 的 source ref 绑定已拆为 5 类 adapter：商机信号、商品定义、KPI 快照、审批/执行事件、复盘/资产。
- **指标与故事线**：新增试点指标计算逻辑 `project_id_resolution_success_rate`、`cross_page_object_consistency_rate`、`decision_compile_success_rate`、`action_writeback_success_rate`、`review_to_asset_lineage_integrity_rate`，并接入老板视图；动作中心新增 decision-driven recommended actions 区域，项目页新增显式“编译上下文 / 编译决策”入口。

### 2026-04-02：Batch 1 Local Pilot Sandbox 落地

- **本地真实数据底座**：新增 `server/db/*` 与 `server/api/*`，默认数据库文件为 `data/pilot-sandbox.sqlite`。
- **已落地 API**：`GET /api/projects`、`GET /api/projects/:id`。
- **seed 数据**：3 个项目，分别覆盖首发验证、增长优化、复盘沉淀。
- **前端切换范围**：`/lifecycle`、生命周期阶段页、`/project/:id` 已切到 API-backed repository；其他页面暂继续保留现有 runtime 链路。
- **占位边界**：项目详情页明确展示 Brain / Knowledge / Agent / Execution 的 `Batch 2+` 占位块，不再伪装为已接通。

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
