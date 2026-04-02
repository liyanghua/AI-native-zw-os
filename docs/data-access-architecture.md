# Data Access Architecture

## Current Direction
当前原型已经从 `runtime/gateway` 直连页面，升级为：

`source adapter -> gateway/runtime -> repository/query -> view-model -> page`

页面不再自己拼业务 shape，也不再直接消费 `runtime.*Gateway`。

## Layer Responsibilities

### 1. Source Adapter
- 路径：`src/data-access/source-adapters/*`
- 职责：把 5 类 source 的 raw payload 绑定到 canonical source refs
- 当前拆分：
  - `opportunitySignalAdapter`
  - `productDefinitionAdapter`
  - `kpiSnapshotAdapter`
  - `executionEventAdapter`
  - `reviewAssetAdapter`

### 2. Gateway / Runtime
- 路径：`src/data-access/pilotRuntime.ts`
- 职责：维持试点数据闭环、写回、审批、决策编译、lineage、identity
- 对上保持稳定 gateway contract：
  - `ProjectGateway`
  - `IdentityGateway`
  - `ActionGateway`
  - `KnowledgeGateway`
  - `DecisionGateway`
  - `LineageGateway`

### 3. Repository
- 路径：`src/data-access/repositories/*`
- 职责：跨 gateway 组装 query，产出页面可直接消费的数据形状
- 当前包含：
  - `IdentityRepository`
  - `ProjectWorkbenchRepository`
  - `ActionCenterRepository`
  - `KnowledgeRepository`
  - `RoleDashboardRepository`
  - `LifecycleRepository`
  - `RiskApprovalRepository`

### 4. Query Contract
- 路径：`src/domain/types/query.ts`
- 统一结构：
  - `data`
  - `loading`
  - `error`
  - `stale`
  - `partial`
  - `lastUpdatedAt`
  - `issues[]`
- 页面统一通过 `QueryStatusPanel` 暴露 connector error / stale KPI / missing evidence / writeback failure / identity conflict / partial data

### 5. View Model
- 路径：`src/view-models/*`
- 职责：只做展示整形，不做 source 级拼装
- 典型对象：
  - `projectDetail`
  - `actionCenter`
  - `reviewAssets`
  - `assetLibrary`
  - `lifecycle`
  - `dashboards`
  - `riskApproval`

## Mutation Flow
- Provider 不再暴露 runtime，本轮改为暴露：
  - `repositories`
  - `actions`
- `actions` 当前包含：
  - `approveAction`
  - `rejectAction`
  - `writeExecutionResult`
  - `publishAssetCandidate`
  - `compileDecisionContext`
  - `compileDecisionObject`
  - `transitionProjectStage`

## Why This Matters
- 未来底层从本地 seed state 切到真实 API / bridge 时，页面不需要改消费方式
- query contract 能统一承接 stale / partial / error，而不是让每个页面各自发明状态判断
- repository 把“同一 projectId 上的多对象拼装”固定下来，避免重新回到页面级私有 shape
