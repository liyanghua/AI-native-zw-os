# Plan

当前实施计划按 **Batch 1 ~ Batch 5** 推进，而不是一次性全站替换。

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

当前已具备角色闭环入口的页面：

- `/boss`
- `/operations-director`
- `/product-rnd-director`（skeleton）
- `/visual-director`（skeleton）

## Batch 5：协同闭环验证

目标：

- 人 × 大脑 × Agent × 执行端协同跑通
- 业务主线闭环、角色闭环、协同闭环都能用同一 pilot 项目演示
- 增加更完整的试点指标和验收走查
