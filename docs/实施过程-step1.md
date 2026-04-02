# 原型升级为真实数据与知识库的单线试点计划

## 摘要
- 目标是把当前前端原型，从页面内联 mock 升级为“商机到复盘”的真实数据、内部知识检索、审批/执行回写闭环。
- 方案采用“单线试点 + 契约优先 + 项目对象中心”，不做全站同时替换，也不先做大而全的平台底座。
- 领域模型继续以 [docs/DATA_MODEL.md](/Users/yichen/Desktop/OntologyBrain/AI-native-操盘智能原型设计/docs/DATA_MODEL.md) 为唯一准绳；当前分散在页面里的局部 mock，需要先收敛成统一接入层，例如 [ProjectDetail.tsx](/Users/yichen/Desktop/OntologyBrain/AI-native-操盘智能原型设计/src/app/components/projects/ProjectDetail.tsx) 这类核心页面要先脱离硬编码数据。
- UI 仍保持嵌入式 AI/知识面板，不引入通用聊天壳；实时只覆盖状态、风险、审批、Agent、KPI，商品定义/复盘正文/资产正文保持版本化快照。
- 不采用“全局页面先接真数据再慢慢整理”，也不采用“先做完整平台再碰页面”，因为这两条都会偏离文档里强调的最短主线验证。

## 关键接口与结构
- 前端新增三层：`src/domain/types/*` 镜像 canonical types，`src/data-access/*` 定义 gateway/repository，`src/view-models/*` 负责页面整形；页面组件只消费 query + ViewModel，不再自带业务 mock。
- `ProjectGateway` 固定提供 `listProjectsByStage`、`getProject`、`getProjectRealtimeSnapshot`、`listPulseItems`，统一承接商机、项目、生命周期和实时状态。
- `ActionGateway` 固定提供 `listActions`、`approveAction`、`rejectAction`、`writeExecutionResult`、`listExecutionLogs`，承接审批、执行、回写。
- `KnowledgeGateway` 固定提供 `searchAssets`、`getAsset`、`listProjectReview`、`publishAssetCandidate`，承接内部知识检索和资产沉淀。
- `DecisionGateway` 固定提供 `compileDecisionObject(projectId)`，输出必须是 `DecisionObject + EvidencePack`，第一版允许人工触发，不要求全自动。
- Pilot 数据源按 5 类接入，而不是按页面接入：商机信号、商品定义/打样、首发/增长 KPI、审批/执行事件、复盘/资产；若暂时没有 API，默认用轻量 adapter 或定时导出，但对前端暴露的 gateway 契约从第一天就固定。
- Pilot 知识库只纳入内部经营知识：`case`、`rule`、`template`、`skill`、`sop`、`evaluation_sample`；每条知识必须带 `stage`、`assetType`、`sourceProjectId`、`publishStatus`、`updatedAt`、`applicability`、来源信息。
- 默认基础设施是“薄服务层 + 关系型存储 + 向量检索 + 30-60 秒轮询刷新”；如果后续换成私有化存储或别的向量能力，只能替换实现，不能改 gateway 和实体形状。

## 实施顺序
1. 先做契约收敛：把 [docs/DATA_MODEL.md](/Users/yichen/Desktop/OntologyBrain/AI-native-操盘智能原型设计/docs/DATA_MODEL.md) 中的枚举和实体抽成共享 TS 类型，并给 API payload 加运行时校验；同时把页面内联 mock 改成统一 repository 返回的临时数据。
2. 先迁移核心协作面：优先把 `/project/:id`、`/action-center`、`/review-assets`、`/asset-library` 改成真实 query 驱动，因为文档已把项目页定义为主协作中心，动作/复盘/资产是闭环关键点。
3. 再做数据归一化：为 5 类源系统建立 adapter，把外部数据统一映射成 `ProjectObject`、`ActionItem`、`ProjectRealtimeSnapshot`、`ReviewSummary`、`PublishedAsset`，并建立稳定的 `projectId` 归一策略，保证同一项目能贯穿阶段页、项目页、动作中心、复盘页。
4. 再做内部知识库：先导入复盘、规则、SOP、模板、案例、评测样本；检索必须支持按生命周期、角色、资产类型、来源项目过滤，知识结果只进入证据面板、复盘面板、资产建议，不单独做聊天入口。
5. 再做决策与回写：增加决策编译服务，把真实项目状态和知识检索结果组合成 `DecisionObject`；审批和执行结果回写后，必须同步更新 action 状态、execution log、project snapshot、review candidate lineage。
6. 再补生命周期入口页：把 `/opportunity-pool`、`/new-product-incubation`、`/launch-verification`、`/growth-optimization` 接到同一数据源上，先做列表/筛选/跳转到项目页，不在第一波塞过多独立逻辑。
7. 最后补角色总览页：`/boss`、`/product-director`、`/operations-director` 只做同源数据的摘要视图，不单独再建一套数据模型。
8. 明确不进本次试点的范围：`/product-upgrade`、多租户 RBAC、外部市场情报知识库、完整多 Agent runtime、WebSocket first 实时架构、自定义仪表盘。

## 测试与验收
- 契约测试：所有 gateway 返回值都要通过 canonical enum/required field 校验，不能再出现页面私有 shape 绕过领域层。
- 映射测试：同一个 pilot 项目要能在机会列表、项目详情、动作中心、复盘与资产页用同一个 `projectId` 被稳定追踪。
- 知识测试：按阶段、类型、来源项目过滤时结果正确；每条证据和知识都能显示来源、更新时间、可用范围。
- 闭环 E2E：接入一个真实商机，形成项目，生成决策，审批一条动作，写回执行结果，看到 KPI/状态更新，生成复盘摘要，再发布一条资产。
- 异常测试：连接器失效、KPI 过期、写回失败、检索为空、低置信度建议、项目 ID 冲突，都必须在 UI 中显式暴露，而不是静默降级。
- 验收标准是业务走查可回答 5 个问题：项目在哪一步、当前最大问题是什么、下一步是什么、谁来拍板、这次沉淀了什么知识。

## 假设与默认值
- 已锁定的策略是：单线试点、主线为“商机到复盘”、第一阶段要有读写闭环、知识库先做内部经营知识。
- 默认实时策略是轮询或轻量流式刷新，不是 WebSocket-first；只有状态型对象实时，正文型对象版本化。
- 默认后端形态是 TypeScript 服务化接口；如果未来拆成 CLI 或私有化执行节点，也必须保持同样的公共契约。
- 如果企业现有系统暂时不给标准 API，允许先用导出文件或桥接服务，但不能改变统一数据模型和统一 gateway 设计。
