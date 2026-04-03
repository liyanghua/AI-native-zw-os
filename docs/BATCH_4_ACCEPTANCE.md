# Batch 4 验收结果

## 1. 改动文件清单

### DB / seed

- `server/db/schema.mjs`
- `server/db/init.mjs`
- `server/db/seed.mjs`
- `server/db/projects.mjs`

### orchestration / execution

- `server/db/execution.mjs`
- `server/db/brain.mjs`
- `server/db/roles.mjs`

### API

- `server/api/server.mjs`

### domain types

- `src/domain/types/model.ts`
- `src/domain/types/api.ts`

### repository / data-access

- `src/data-access/apiClient.ts`
- `src/data-access/localSandboxRepositories/index.ts`
- `src/data-access/localSandboxRepositories/projectsRepository.ts`
- `src/data-access/localSandboxRepositories/shared.ts`
- `src/data-access/localSandboxRepositories/types.ts`
- `src/data-access/localSandboxRepositories/executionRepository.ts`

### 页面

- `src/app/components/projects/ProjectDetail.tsx`
- `src/app/components/dashboards/RoleDashboardScreen.tsx`

### tests

- `tests/local-sandbox-db.test.ts`
- `tests/local-sandbox-execution-api.test.ts`
- `tests/local-sandbox-execution-repositories.test.ts`

### docs

- `docs/README_PRODUCT.md`
- `docs/ARCHITECTURE.md`
- `docs/IA_AND_PAGES.md`
- `docs/DATA_MODEL.md`
- `docs/PLAN.md`
- `docs/IMPLEMENT.md`
- `docs/DECISIONS.md`
- `docs/Guidelines.md`
- `docs/BATCH_4_ACCEPTANCE.md`

## 2. 新增 / 变更表结构清单

### 新增表

- `execution_runs`
- `execution_logs`
- `writeback_records`
- `approvals`

### 扩展表

- `actions`
  - `decision_id`
  - `role`
  - `action_domain`
  - `expected_direction`
  - `confidence`
- `reviews`
  - `source_action_id`
  - `source_run_id`
- `asset_candidates`
  - `source_review_id`

## 3. 新增 / 变更 API 清单

### `POST /api/actions/:id/approve`

输入：

- `approvedBy`
- `reason`

输出：

- `action`
- `approval`

### `POST /api/actions/:id/reject`

输入：

- `approvedBy`
- `reason`

输出：

- `action`
- `approval`

### `POST /api/agent/trigger`

输入：

- `projectId`
- `actionId`

输出：

- `action`
- `run`
- `latestLog`

### `POST /api/execution/mock-run`

输入：

- `projectId`
- `actionId`
- `runId`

输出：

- `run`
- `executionResult`
- `latestLog`

### `POST /api/execution/:runId/writeback`

输出：

- `action`
- `updatedProjectSnapshot`
- `updatedKpis`
- `writebackRecord`
- `latestLog`

### `POST /api/review/generate`

输入：

- `projectId`
- `actionId`
- `runId`

输出：

- `review`

### `POST /api/assets/publish-candidate`

输入：

- `projectId`
- `reviewId`

输出：

- `assetCandidate`

### `GET /api/projects/:id/lineage`

输出：

- `projectId`
- `decisionId`
- `actions`
  - `action`
  - `approvals`
  - `runs`
  - `logs`
  - `latestReview`
  - `assetCandidates`

## 4. 页面改造结果

- `/project/:id`
  - `yes`
  - 已可触发最小执行闭环：approve / reject / trigger / mock-run / writeback / review / publish
  - 已展示 execution history / review / asset candidate / lineage
- `/boss`
  - `yes`
  - 已通过 role dashboard 反映审批、执行、review、asset candidate 状态摘要
- `/operations-director`
  - `yes`
  - 已通过 role dashboard 反映 workflow 状态与 action domain
- 动作中心
  - `no`
  - 仍为 legacy 页面，Batch 4 未做正式迁移

## 5. 文档更新结果

- `README_PRODUCT.md`
  - 更新为 Batch 4，本地 mock 执行闭环与未实现边界已同步
- `ARCHITECTURE.md`
  - 增加 Agent Trigger、Mock Execution Connector、Writeback、Review / Asset Loop 说明
- `IA_AND_PAGES.md`
  - 标注 `/project/:id` 已升级为执行闭环页面，角色页已反映 workflow 状态
- `DATA_MODEL.md`
  - 补 execution / writeback / lineage 相关表与对象
- `PLAN.md`
  - 标注 Batch 4 已完成项与 Batch 5 进入条件
- `IMPLEMENT.md`
  - 记录 Batch 4 执行闭环实现与运行边界
- `DECISIONS.md`
  - 新增 mock execution、action domain、SQLite writeback 相关决策
- `Guidelines.md`
  - 新增不得伪造执行状态、必须写回数据库、必须保留 lineage 等约束
- `BATCH_4_ACCEPTANCE.md`
  - 新增本验收文档

## 6. 验收结论

### A. `POST /api/actions/:id/approve` 是否已打通

结论：`yes`

### B. `POST /api/agent/trigger` 是否已打通

结论：`yes`

### C. `POST /api/execution/mock-run` 是否已打通

结论：`yes`

### D. `POST /api/execution/:runId/writeback` 是否已打通

结论：`yes`

### E. `POST /api/review/generate` 是否已打通

结论：`yes`

### F. `POST /api/assets/publish-candidate` 是否已打通

结论：`yes`

### G. `/project/:id` 是否已可展示 execution history / review / asset candidate

结论：`yes`

### H. 是否至少有 1 个项目完整跑通：

`approve -> trigger -> execute -> writeback -> review -> asset candidate`

结论：`yes`

说明：

- Project B 已作为 Batch 4 的完整闭环演示项目
- Project C 提供了 review / asset 的已有闭环占位

### I. 是否满足进入下一批前置条件

结论：`yes`

原因：

- 项目页已经可以承接本地 mock 执行闭环
- writeback / review / asset candidate 已真实写回 SQLite
- 角色页已能看到执行状态变化
- Batch 5 可以把重心转到更完整的执行编排、资产治理、知识循环和非 mock connector 替换

## 7. 已知风险与遗留问题

- execution 仍是 mock connector，不是外部真实系统
- orchestration 仍偏同步 / 规则驱动，没有异步队列和 workflow engine
- 动作中心还未完成正式迁移
- asset candidate 还不是完整治理流
- `product_rnd` / `visual` 的执行逻辑目前比 `operations` 更轻量
