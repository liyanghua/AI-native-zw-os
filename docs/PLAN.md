# Plan

当前实施计划按 **Batch 1 ~ Batch 6** 推进，而不是一次性全站替换。

## Batch 1：Local Pilot Sandbox

目标：先建立本地真实数据底座，让生命周期页和项目详情页脱离页面级内联 mock。

已完成：

- SQLite schema / init / seed
- 3 个演示项目
- 本地 Node API
- `GET /api/projects`
- `GET /api/projects/:id`
- `apiClient + localSandboxRepositories + useRemoteQuery`
- 生命周期总览 / 生命周期阶段页 / `/project/:id` 切到 API-backed repository
- 8 份文档与实现同步

进入 Batch 2 的前置条件：

- Batch 1 数据链路稳定
- 页面不再直接依赖页面级业务 mock
- 后续能力能在现有 SQLite / API / repository 结构上追加，而不用推翻重来

## Batch 2：知识、决策与对象继续收敛

目标：

- 引入 Knowledge / Evidence 接入边界
- 补 Brain 决策编译 API
- 继续统一 domain contract、repository contract、异常态表达

已完成：

- SQLite knowledge tables / chunk / retrieval log
- 本地知识 seed（SOP / rule / case / template / evaluation sample）
- `POST /api/knowledge/search`
- `GET /api/projects/:id/knowledge`
- `POST /api/brain/compile-context`
- `POST /api/brain/compile-decision`
- `POST /api/brain/compile-role-story`
- `/project/:id` 升级为项目 + 证据 + 决策页面
- `boss` / `director` 的同源 role story 在项目页最小接入

进入 Batch 3 的前置条件：

- Knowledge / Brain API contract 稳定
- 同一个 `projectId` 已能编译 DecisionObject 与 RoleStory
- 项目详情页已能消费 evidence + decision + role story
- 老板 / 总监页可在不推翻现有结构的前提下切到同源数据

## Batch 3：角色闭环与同源摘要

目标：

- 老板 / 总监基于同一项目对象推进不同故事线
- 角色页继续切到同源数据，而不是保留页面私有逻辑

已完成：

- `GET /api/roles/:role/dashboard`
- `director -> operations_director` alias 兼容
- `boss` 页面正式迁移到 role dashboard API
- `operations_director` 页面正式迁移到 role dashboard API
- `product_rnd_director` / `visual_director` API-backed skeleton 页面
- `/product-rnd-director` canonical 路由与 `/product-director` 兼容跳转
- `/project/:id` 支持 4 个 role story 切换

进入 Batch 4 的前置条件：

- 角色入口已与同一个 `projectId` 保持同源
- 角色页能稳定跳到同一个 `/project/:id`
- role-aware composition 与 project detail 不再冲突
- 下一步可以把重点转到 execution / writeback / review / asset loop

## Batch 4：动作、执行、回写、review / asset loop

目标：

- 接入审批流
- 接入执行 writeback
- 接入 review 生成与 asset publish 占位服务
- 补齐 lineage / audit / idempotency

已完成：

- `POST /api/actions/:id/approve`
- `POST /api/actions/:id/reject`
- `POST /api/agent/trigger`
- `POST /api/execution/mock-run`
- `POST /api/execution/:runId/writeback`
- `POST /api/review/generate`
- `POST /api/assets/publish-candidate`
- `GET /api/projects/:id/lineage`
- SQLite execution tables / writeback / lineage 扩展
- `/project/:id` 执行闭环区块接入
- `boss` / `operations_director` dashboard 最小反映执行状态

进入 Batch 5 的前置条件：

- 至少 1 个项目可以在本地沙箱中跑通 approve -> trigger -> execute -> writeback -> review -> asset candidate
- 项目页能看到 execution history / review / asset candidate
- 角色页能看到同一项目的闭环状态变化
- 下一步可以把重点转到更完整的协同编排、资产治理和知识循环

当前已具备角色闭环入口的页面：

- `/boss`
- `/operations-director`
- `/product-rnd-director`（skeleton）
- `/visual-director`（skeleton）

## Batch 5：治理、沉淀、回流与评测闭环

目标：

- 把项目级执行闭环升级为治理闭环
- 建立 action center / review center / asset library
- 建立 knowledge feedback loop 与 evaluation loop
- 让角色页能看到治理层状态摘要

已完成：

- `GET /api/actions`
- `GET /api/reviews`
- `POST /api/reviews/:id/promote-to-asset`
- `GET /api/assets`
- `POST /api/assets/:id/publish`
- `POST /api/assets/:id/feedback-to-knowledge`
- `POST /api/knowledge/feedback`
- `GET /api/evaluations`
- `POST /api/evaluations/run`
- `GET /api/projects/:id/governance`
- `/action-center` 正式切到 API-backed governance repository
- `/review-assets` 正式切到 API-backed review center
- `/asset-library` 正式切到 API-backed asset library
- `/project/:id` 新增治理摘要，并可跳转治理页
- review -> asset -> publish -> feedback to knowledge -> evaluation run 的本地沙箱链路可演示

当前三闭环 + 治理闭环成立程度：

- 经营主线闭环：已可在本地 SQLite / API 沙箱中跑通
- 角色闭环：已具备同源 dashboard + governance summary 入口
- 人 × 大脑 × Agent × 执行端协同闭环：已具备 mock execution 验证链路
- 治理闭环：已具备治理对象、知识回流、规则评测与摘要面板

后续若继续演进，优先补：

- 非 mock connector 的真实执行端替换
- 更完整的动作中心主交互与审批治理
- 更复杂的资产治理与外部知识库发布
- 更真实的 evaluation / verification 逻辑
- 多项目协同执行与生产化调度

## Batch 6：运行内核、评测、Ontology 治理与桥接层

目标：

- 把 execution 升级为 `workflow -> task -> event` 的 runtime kernel
- 把零散 evaluation 升级为可复跑的 harness
- 把 role profile / stage rule / action policy / review pattern / template / skill 纳入 ontology registry
- 为未来真实系统接入建立统一 bridge adapter layer

已完成：

- `GET /api/projects/:id/runtime`
- `GET /api/projects/:id/eval`
- `GET /api/projects/:id/ontology`
- `GET /api/projects/:id/bridge`
- `GET /api/runtime/workflows`
- `GET /api/runtime/workflows/:id`
- `POST /api/runtime/tasks/:id/retry`
- `POST /api/runtime/tasks/:id/cancel`
- `GET /api/eval/cases`
- `GET /api/eval/suites`
- `POST /api/eval/run`
- `GET /api/eval/runs`
- `GET /api/eval/runs/:id`
- `GET /api/ontology/registry`
- `GET /api/ontology/registry/:id`
- `POST /api/ontology/activate`
- `POST /api/ontology/deprecate`
- `GET /api/bridge/adapters`
- `POST /api/bridge/sync`
- `GET /api/bridge/sync-records`
- `/project/:id` 新增 runtime timeline、latest eval gate、ontology references、bridge freshness
- `/action-center` 新增 workflow / runtime status 摘要
- 新增 `/eval-center`、`/ontology-registry`、`/bridge-diagnostics`

当前系统的成立程度：

- 经营主线闭环：本地沙箱中可持续运行，并具备 runtime timeline 与 bridge freshness 诊断
- 角色闭环：角色首页已能看到 runtime/eval/bridge 风险摘要
- 人 × 大脑 × Agent × 执行闭环：已具备 workflow/task/event 级状态追踪、retry 与 cancel 的最小能力
- 治理闭环：已扩展为 eval harness、ontology governance、bridge diagnostics

若继续往生产化演进，优先补：

- worker / queue 驱动的异步 runtime
- 更真实的 gate / eval case 编排与基准集
- 更完整的 ontology 内容平台与变更审计
- 非 mock connector 与真实 file/api bridge 映射治理
