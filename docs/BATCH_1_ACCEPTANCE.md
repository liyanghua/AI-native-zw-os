# Batch 1 验收结果

## 1. 改动文件清单

### 数据库相关

- `server/config.mjs`
- `server/db/client.mjs`
- `server/db/schema.mjs`
- `server/db/init.mjs`
- `server/db/seed.mjs`
- `server/db/projects.mjs`
- `data/.gitkeep`

### API 相关

- `server/api/errors.mjs`
- `server/api/server.mjs`
- `scripts/db-init.mjs`
- `scripts/db-seed.mjs`
- `scripts/api-server.mjs`
- `package.json`
- `vite.config.ts`

### repository / types 相关

- `src/domain/types/model.ts`
- `src/domain/types/api.ts`
- `src/data-access/apiClient.ts`
- `src/data-access/useRemoteQuery.ts`
- `src/data-access/localSandboxRepositories/index.ts`
- `src/data-access/localSandboxRepositories/shared.ts`
- `src/data-access/localSandboxRepositories/types.ts`
- `src/data-access/localSandboxRepositories/lifecycleRepository.ts`
- `src/data-access/localSandboxRepositories/projectsRepository.ts`
- `src/data-access/PilotDataProvider.tsx`

### 前端页面相关

- `src/app/components/lifecycle/LifecycleOverview.tsx`
- `src/app/components/lifecycle/LifecycleStageBoard.tsx`
- `src/app/components/projects/ProjectDetail.tsx`

### 测试相关

- `tests/local-sandbox-db.test.ts`
- `tests/local-sandbox-api.test.ts`
- `tests/local-sandbox-repositories.test.ts`

### docs 相关

- `docs/README_PRODUCT.md`
- `docs/ARCHITECTURE.md`
- `docs/IA_AND_PAGES.md`
- `docs/DATA_MODEL.md`
- `docs/PLAN.md`
- `docs/IMPLEMENT.md`
- `docs/DECISIONS.md`
- `docs/Guidelines.md`
- `docs/BATCH_1_ACCEPTANCE.md`

## 2. 新增表结构清单

已创建的 SQLite 表：

- `projects`
- `project_snapshots`
- `kpi_metrics`
- `opportunities`
- `risk_signals`
- `ontology_entities`
- `stage_rules`
- `actions`
- `reviews`
- `asset_candidates`

## 3. 新增 API 清单

### `GET /api/projects`

输入：

- 可选 query: `stage=<canonical_stage>`

输出：

- `projects[]`
  - `projectId`
  - `name`
  - `stage`
  - `status`
  - `owner`
  - `priority`
  - `category`
  - `latestSnapshotSummary`
  - `currentProblem`
  - `currentGoal`
  - `currentRisk`
  - `kpiSummary[]`
  - `riskCount`
  - `updatedAt`

### `GET /api/projects/:id`

输入：

- path param: `projectId`

输出：

- `project`
- `latestSnapshot`
- `kpis`
- `risks`
- `opportunities`
- `actions`
- `latestReview`
- `assetCandidates`

错误结构：

- `error.code`
- `error.message`
- `error.details?`

## 4. 页面改造结果

已脱离页面内联 mock 主依赖：

- 生命周期总览页 `/lifecycle`
- 生命周期阶段页 `/opportunity-pool` `/new-product-incubation` `/launch-verification` `/growth-optimization`
- 项目详情页 `/project/:id`

当前已打通：

- `SQLite -> API -> repository -> UI`

当前仍未切换的页面：

- 老板 / 总监看板
- 动作中心
- 风险与审批
- 复盘沉淀
- 资产库

这些页面仍暂时保留现有 `pilotRuntime` / repository-first 原型链路。

## 5. 文档更新结果

- `README_PRODUCT.md`
  - 增加 Local Pilot Sandbox / Batch 1 范围和未实现边界
- `ARCHITECTURE.md`
  - 增加 SQLite + Local API + repository 结构说明
- `IA_AND_PAGES.md`
  - 标注 API 驱动页面与仍未迁移页面
- `DATA_MODEL.md`
  - 同步 Batch 1 已落地表结构与类型收敛
- `PLAN.md`
  - 改成 Batch 1 ~ Batch 5 计划
- `IMPLEMENT.md`
  - 增加 SQLite、seed、API、运行方式和 Batch 1 记录
- `DECISIONS.md`
  - 新增 SQLite / Local API / Local Sandbox 决策记录
- `Guidelines.md`
  - 新增页面不得直接依赖内联业务 mock 等工程约束

## 6. 验收结论

### A. 数据底座是否已建立

结论：`yes`

- SQLite 可初始化：`npm run db:init`
- seed 可执行：`npm run db:seed`
- 已有 3 个示例项目：
  - `local-launch-breeze-bag`
  - `local-growth-travel-pro`
  - `local-review-office-classic`

### B. API 是否已打通

结论：`yes`

- `/api/projects`
- `/api/projects/:id`

### C. 页面是否已从 API 获取数据

结论：`yes`

- 生命周期页：已切
- 项目详情页：已切

### D. 是否满足进入 Batch 2 的前置条件

结论：`yes`

原因：

- 本地数据底座已建立
- API contract 已建立
- repository / query 边界已建立
- 生命周期页和项目详情页已经不再依赖页面级内联 mock

## 7. 已知风险与遗留问题

- 当前 schema 仍是 Batch 1 最小骨架，尚未覆盖 Knowledge / Brain / Agent / Execution 全量字段
- Local API 仅覆盖项目列表与项目详情，后续批次还要扩展决策、知识、审批、回写、review / asset API
- 其余页面仍在旧 runtime 链路上，尚未统一迁移到 SQLite / API
- `node:sqlite` 目前仍有 experimental warning，后续如环境约束变化需评估是否切换实现
