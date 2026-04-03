# Batch 5 Acceptance

## 1. 改动文件清单

### DB / seed

- `server/db/schema.mjs`
- `server/db/init.mjs`
- `server/db/seed.mjs`
- `server/db/governance.mjs`

### API

- `server/api/server.mjs`

### Governance / evaluation / feedback

- `server/db/governance.mjs`
- `server/db/roles.mjs`

### Domain types / DTO

- `src/domain/types/model.ts`
- `src/domain/types/api.ts`

### Repository / data access

- `src/data-access/apiClient.ts`
- `src/data-access/localSandboxRepositories/governanceRepository.ts`
- `src/data-access/localSandboxRepositories/index.ts`
- `src/data-access/localSandboxRepositories/projectsRepository.ts`
- `src/data-access/localSandboxRepositories/shared.ts`
- `src/data-access/localSandboxRepositories/types.ts`

### Pages

- `src/app/components/actions/ActionCenter.tsx`
- `src/app/components/review/ReviewAndAssets.tsx`
- `src/app/components/assets/AssetLibrary.tsx`
- `src/app/components/projects/ProjectDetail.tsx`
- `src/app/components/dashboards/RoleDashboardScreen.tsx`

### Tests

- `tests/local-sandbox-db.test.ts`
- `tests/local-sandbox-governance-api.test.ts`
- `tests/local-sandbox-governance-repositories.test.ts`

### Docs

- `docs/README_PRODUCT.md`
- `docs/ARCHITECTURE.md`
- `docs/IA_AND_PAGES.md`
- `docs/DATA_MODEL.md`
- `docs/PLAN.md`
- `docs/IMPLEMENT.md`
- `docs/DECISIONS.md`
- `docs/Guidelines.md`
- `docs/BATCH_5_ACCEPTANCE.md`

## 2. 新增 / 变更表结构清单

### 新增表

- `published_assets`
- `evaluation_records`
- `knowledge_feedback_records`

### 扩展表

- `reviews`
  - `review_status`
  - `review_type`
  - `review_quality_score`
  - `is_promoted_to_asset`
  - `updated_at`
- `asset_candidates`
  - `asset_type`
  - `review_status`
  - `publish_status`
  - `reusability_score`
  - `feedback_to_knowledge`
  - `updated_at`

## 3. 新增 / 变更 API 清单

- `GET /api/actions`
  - 输入：`role`、`actionDomain`、`approvalStatus`、`executionStatus`、`projectId`
  - 输出：`ActionCenterResponse`
- `GET /api/reviews`
  - 输入：`projectId`、`reviewStatus`、`reviewType`、`sourceActionId`
  - 输出：`ReviewCenterResponse`
- `POST /api/reviews/:id/promote-to-asset`
  - 输入：`assetType`、`operator`、`reason`
  - 输出：`{ review, assetCandidate }`
- `GET /api/assets`
  - 输入：`projectId`、`publishStatus`、`assetType`
  - 输出：`AssetLibraryResponse`
- `POST /api/assets/:id/publish`
  - 输入：`operator`、`reason`
  - 输出：`{ publishedAsset }`
- `POST /api/assets/:id/feedback-to-knowledge`
  - 输入：`feedbackMode`、`operator`
  - 输出：`{ feedback }`
- `POST /api/knowledge/feedback`
  - 输入：`sourceType`、`sourceId`、`feedbackMode`、`operator`
  - 输出：`{ feedback }`
- `GET /api/evaluations`
  - 输入：`projectId`、`evaluationType`
  - 输出：`{ records, summary }`
- `POST /api/evaluations/run`
  - 输入：`projectId`、`scope`
  - 输出：`{ records, summary }`
- `GET /api/projects/:id/governance`
  - 输出：`{ actionsSummary, reviewSummary, assetSummary, evaluationSummary, feedbackSummary }`

## 4. 页面改造结果

- `/action-center`
  - 已 API 化
  - 已脱离页面级 mock
  - 当前展示跨项目动作列表、过滤器、审批/执行状态、项目跳转
- `/review-assets`
  - 已 API 化
  - 已脱离页面级 mock
  - 当前作为 Review Center，展示 review 列表、质量分、治理状态、promote to asset
- `/asset-library`
  - 已 API 化
  - 已脱离页面级 mock
  - 当前统一展示 candidate / published asset、publish status、feedback status、来源 review / project
- `/project/:id`
  - 已新增 governance summary
  - 已可跳转 `/action-center?projectId=...`
  - 已可跳转 `/review-assets?projectId=...`
  - 已可跳转 `/asset-library?projectId=...`
- 角色页
  - 已可看到治理层摘要指标，例如待拍板、待执行、方法资产、知识回流候选

## 5. 文档更新结果

- `README_PRODUCT.md`
  - 更新为 Batch 5 阶段，补 action center / review center / asset library / knowledge feedback / evaluation
- `ARCHITECTURE.md`
  - 补充 governance / feedback / evaluation 层
- `IA_AND_PAGES.md`
  - 更新 `/action-center`、`/review-assets`、`/asset-library` 已 API 化
  - 更新 `/project/:id` 的治理摘要能力
- `DATA_MODEL.md`
  - 补 `published_assets`、`evaluation_records`、`knowledge_feedback_records`
  - 说明 governance compose objects
- `PLAN.md`
  - 标记 Batch 5 已完成项
  - 说明后续生产化方向
- `IMPLEMENT.md`
  - 增加 Batch 5 落地说明
- `DECISIONS.md`
  - 增加 Batch 5 的 3 条治理决策
- `Guidelines.md`
  - 增加 governance / feedback / evaluation 的工程约束
- `BATCH_5_ACCEPTANCE.md`
  - 新增本文件

## 6. 验收结论

### A. `GET /api/actions` 是否已打通

- yes

### B. `GET /api/reviews` 是否已打通

- yes

### C. `GET /api/assets` 是否已打通

- yes

### D. `POST /api/knowledge/feedback` 是否已打通

- yes

### E. `POST /api/evaluations/run` 是否已打通

- yes

### F. 是否至少有 1 条 review 成功 promote 到 asset

- yes

### G. 是否至少有 1 条 asset 成功 feedback 到 knowledge

- yes

### H. 是否至少有 1 次 evaluation run 成功落库

- yes

### I. `/action-center`、`/review-assets`、`/asset-library` 是否已脱离页面级 mock

- yes

### J. 是否满足进入下一阶段前置条件

- yes

当前阻塞点不在治理链路本身，而在生产化替换层：

- execution 仍是 mock connector
- evaluation 仍是规则驱动
- knowledge feedback 仍是轻量模式

## 7. 已知风险与遗留问题

- evaluation 逻辑仍偏规则驱动，尚未接入更真实的验证机制
- knowledge feedback 仍是轻量模式，尚未引入更复杂的合并、去重与人工校对流
- 资产治理仍是最小流程，不是完整 CMS / 资产运营平台
- 还未进入真实多项目协同执行与生产化调度
- `risk-approval` 页面仍未迁移到治理层 API
