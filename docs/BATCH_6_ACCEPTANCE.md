# Batch 6 Acceptance

## 1. Scope

Batch 6 把当前本地经营闭环沙箱升级为四个更接近生产内核的基础层：

- Runtime Kernel
- Evaluation Harness
- Ontology Governance
- Bridge Adapter Layer

## 2. Key File Changes

### DB / seed

- `server/db/schema.mjs`
- `server/db/seed.mjs`
- `server/db/runtime.mjs`
- `server/db/eval.mjs`
- `server/db/ontology.mjs`
- `server/db/bridge.mjs`
- `server/fixtures/batch6-file-bridge.json`

### API

- `server/api/server.mjs`

### Domain types / repositories

- `src/domain/types/model.ts`
- `src/domain/types/api.ts`
- `src/data-access/apiClient.ts`
- `src/data-access/localSandboxRepositories/runtimeRepository.ts`
- `src/data-access/localSandboxRepositories/evalRepository.ts`
- `src/data-access/localSandboxRepositories/ontologyRepository.ts`
- `src/data-access/localSandboxRepositories/bridgeRepository.ts`
- `src/data-access/localSandboxRepositories/projectsRepository.ts`
- `src/data-access/localSandboxRepositories/index.ts`
- `src/data-access/localSandboxRepositories/shared.ts`
- `src/data-access/localSandboxRepositories/types.ts`

### Pages

- `src/app/components/projects/ProjectDetail.tsx`
- `src/app/components/actions/ActionCenter.tsx`
- `src/app/components/eval/EvalCenter.tsx`
- `src/app/components/ontology/OntologyRegistry.tsx`
- `src/app/components/bridge/BridgeDiagnostics.tsx`
- `src/app/navigation.ts`
- `src/app/routes.tsx`

### Docs

- `docs/README_PRODUCT.md`
- `docs/ARCHITECTURE.md`
- `docs/IA_AND_PAGES.md`
- `docs/DATA_MODEL.md`
- `docs/PLAN.md`
- `docs/IMPLEMENT.md`
- `docs/DECISIONS.md`
- `docs/Guidelines.md`
- `docs/BATCH_6_ACCEPTANCE.md`

## 3. New / Extended Tables

- `workflow_runs`
- `task_runs`
- `runtime_events`
- `retry_records`
- `eval_cases`
- `eval_suites`
- `eval_runs`
- `eval_results`
- `gate_decisions`
- `ontology_registry`
- `ontology_versions`
- `policy_objects`
- `template_objects`
- `skill_objects`
- `source_adapters`
- `bridge_configs`
- `sync_records`
- `connector_registry`

## 4. New APIs

### Runtime

- `GET /api/runtime/workflows`
- `GET /api/runtime/workflows/:id`
- `POST /api/runtime/tasks/:id/retry`
- `POST /api/runtime/tasks/:id/cancel`
- `GET /api/projects/:id/runtime`

### Eval

- `GET /api/eval/cases`
- `GET /api/eval/suites`
- `POST /api/eval/run`
- `GET /api/eval/runs`
- `GET /api/eval/runs/:id`
- `GET /api/projects/:id/eval`

### Ontology

- `GET /api/ontology/registry`
- `GET /api/ontology/registry/:id`
- `POST /api/ontology/activate`
- `POST /api/ontology/deprecate`
- `GET /api/projects/:id/ontology`

### Bridge

- `GET /api/bridge/adapters`
- `POST /api/bridge/sync`
- `GET /api/bridge/sync-records`
- `GET /api/projects/:id/bridge`

## 5. Page Results

- `/project/:id`
  - 已展示 runtime timeline / workflow status
  - 已展示 latest eval gate / eval summary
  - 已展示 ontology references
  - 已展示 bridge freshness / source adapter 摘要
- `/action-center`
  - 已显示 workflow status / workflow summary
- `/eval-center`
  - 已可查看 suites / runs / gate decision，并触发一次 eval run
- `/ontology-registry`
  - 已可查看 registry / versions / lineage，并触发 activate / deprecate
- `/bridge-diagnostics`
  - 已可查看 adapters / sync records / mapping errors / freshness，并触发手动 sync
- 角色页
  - 已开始反映 runtime failed/retryable、gate warning、bridge stale sync 等 Batch 6 摘要

## 6. Acceptance Checklist

### Runtime

- `workflow_runs` / `task_runs` / `runtime_events`: yes
- retry / cancel: yes
- 项目页 runtime timeline: yes

### Eval

- eval cases / suites / runs: yes
- 至少一次 eval run 落库: yes
- gate decision: yes

### Ontology

- ontology registry: yes
- activate / deprecate: yes
- 可见版本 / 状态 / owner: yes

### Bridge

- source adapter / sync record: yes
- 至少一种 bridge mode 可跑通: yes (`file_bridge`)
- sync diagnostics: yes

### Pages

- 至少一个 runtime 视图: yes (`/project/:id`)
- 至少一个 eval 视图: yes (`/eval-center`)
- 至少一个 ontology governance 视图: yes (`/ontology-registry`)
- 至少一个 bridge diagnostics 视图: yes (`/bridge-diagnostics`)

## 7. Verification

Fresh verification completed during Batch 6 implementation:

- `npm test` -> pass
- `npm run build` -> pass

Supplemental DB verification:

- Batch 6 schema / seed 已在测试中覆盖
- 默认 `data/pilot-sandbox.sqlite` 在本地 API 占用时可能出现 `database is locked`
- 已在全新临时库路径上验证 `init + seed` 可跑通

## 8. Known Limits

- Runtime 仍为本地同步驱动，不是完整分布式调度 / worker / queue
- Eval harness 仍为规则驱动，不是模型评测平台
- Ontology registry 是最小治理索引，不是完整内容治理平台
- Bridge 当前只有 `local_mock` / `file_bridge` 可运行；`api_bridge` 仍为占位诊断模式
- Action center 目前只展示 runtime quick status，还不是独立 runtime center
