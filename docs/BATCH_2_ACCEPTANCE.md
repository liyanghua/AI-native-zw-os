# Batch 2 验收结果

## 1. 改动文件清单

### DB / seed

- `server/db/schema.mjs`
- `server/db/seed.mjs`
- `server/db/knowledge.mjs`
- `server/db/brain.mjs`

### API

- `server/api/server.mjs`
- `src/data-access/apiClient.ts`

### domain types

- `src/domain/types/model.ts`
- `src/domain/types/api.ts`

### repository / data-access

- `src/data-access/localSandboxRepositories/index.ts`
- `src/data-access/localSandboxRepositories/types.ts`
- `src/data-access/localSandboxRepositories/shared.ts`
- `src/data-access/localSandboxRepositories/projectsRepository.ts`
- `src/data-access/localSandboxRepositories/knowledgeRepository.ts`
- `src/data-access/localSandboxRepositories/brainRepository.ts`

### 页面

- `src/app/components/projects/ProjectDetail.tsx`

### 测试

- `tests/local-sandbox-db.test.ts`
- `tests/local-sandbox-api.test.ts`
- `tests/local-sandbox-repositories.test.ts`

### docs

- `docs/README_PRODUCT.md`
- `docs/ARCHITECTURE.md`
- `docs/IA_AND_PAGES.md`
- `docs/DATA_MODEL.md`
- `docs/PLAN.md`
- `docs/IMPLEMENT.md`
- `docs/DECISIONS.md`
- `docs/Guidelines.md`
- `docs/BATCH_2_ACCEPTANCE.md`

## 2. 新增表结构清单

Batch 2 新增的 SQLite 表 / 虚表：

- `knowledge_assets`
- `knowledge_chunks`
- `knowledge_chunks_fts`
- `knowledge_retrieval_logs`

## 3. 新增 API 清单

### `POST /api/knowledge/search`

输入：

- `projectId?`
- `query?`
- `stage?`
- `role?` (`boss` | `director`)
- `assetTypes?`
- `sourceProjectId?`
- `applicability?`

输出：

- `matchedAssets`
- `matchedChunks`
- `retrievalTrace`
- `resultCount`
- `generatedAt`

### `GET /api/projects/:id/knowledge`

输入：

- path param: `projectId`

输出：

- 项目的默认知识证据集合
- 结构同 knowledge search result

### `POST /api/brain/compile-context`

输入：

- `projectId`

输出：

- `decisionContext`
- `projectSnapshot`
- `kpiSummary`
- `risks`
- `opportunities`
- `matchedKnowledge`
- `missingEvidenceFlags`

### `POST /api/brain/compile-decision`

输入：

- `projectId`

输出：

- `decisionObject`
- `evidencePack`

### `POST /api/brain/compile-role-story`

输入：

- `projectId`
- `role` (`boss` | `director`)

输出：

- `roleStory`

## 4. 页面改造结果

### `/project/:id`

结论：`yes`

当前页面已通过 API / repository 展示：

- 项目上下文
- decision summary
- current diagnosis
- recommended actions
- fact evidence
- method evidence
- missing evidence flags
- `boss` / `director` role story 切换区

### 老板 / 总监视角最小接入

结论：`yes`

- Batch 2 没有重做老板页 / 总监页主数据源
- 已在项目详情页完成 `compileRoleStory(projectId, role)` 的最小接入
- 证明同一个 `projectId` 可以输出不同角色的同源叙事

### 当前仍停留在 Batch 1 / legacy 形态的页面

- `/boss`
- `/product-director`
- `/operations-director`
- `/visual-director`
- `/action-center`
- `/risk-approval`
- `/review-assets`
- `/asset-library`

## 5. 文档更新结果

- `README_PRODUCT.md`
  - 标注系统进入“本地知识 + 决策编译”阶段
- `ARCHITECTURE.md`
  - 增加 Knowledge Retrieval / Brain Compile 层
- `IA_AND_PAGES.md`
  - 标注 `/project/:id` 已升级为项目 + 证据 + 决策页面
- `DATA_MODEL.md`
  - 增加 knowledge tables、Decision / Evidence / RoleStory 说明
- `PLAN.md`
  - 标注 Batch 2 已完成项与 Batch 3 进入条件
- `IMPLEMENT.md`
  - 记录 knowledge seed、retrieval API、compile API、项目页升级
- `DECISIONS.md`
  - 新增 light RAG、server-side compile、project detail first 三条决策
- `Guidelines.md`
  - 新增 decision object、evidence pack、role story 的工程约束
- `BATCH_2_ACCEPTANCE.md`
  - 新增本验收文档

## 6. 验收结论

### A. Knowledge 是否已接入 SQLite 并可检索

结论：`yes`

### B. `POST /api/knowledge/search` 是否已打通

结论：`yes`

### C. `POST /api/brain/compile-context` 是否已打通

结论：`yes`

### D. `POST /api/brain/compile-decision` 是否已打通

结论：`yes`

### E. `POST /api/brain/compile-role-story` 是否已打通

结论：`yes`

### F. `/project/:id` 是否已从 API 展示 evidence + decision

结论：`yes`

### G. 是否满足进入 Batch 3 前置条件

结论：`yes`

原因：

- Knowledge / Brain API contract 已建立
- 同一个 `projectId` 已能生成 decision 与 role story
- 项目详情页已能稳定消费 evidence + decision + role story
- 角色页下一步可以在不推翻当前 API 边界的前提下切到同源数据

## 7. 已知风险与遗留问题

- retrieval 仍是 SQLite FTS5 的轻量版，不包含 embedding / semantic rerank
- compile logic 仍以规则驱动为主，还不是可配置 brain pipeline
- 老板 / 总监页目前只是最小接入，主页面仍未切到 RoleStory API
- 动作还没有进入真正执行闭环，writeback / review generate / asset publish 仍在后续批次
