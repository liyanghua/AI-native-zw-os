# System Architecture

## 1. 总体分层

系统采用五层结构：

1. Human Decision Layer
2. Decision Brain Layer
3. Scenario Agent Layer
4. Execution and Automation Layer
5. Real-time Update Layer

---

## 2. Human Decision Layer

这是管理前台层，面向四类角色（界面中文见侧栏顶栏）：

- 老板 · 经营指挥台（`/boss`）
- 产品研发总监台（`/product-director`）
- 运营与营销总监台（`/operations-director`）
- 视觉总监台（`/visual-director`）

这一层不负责具体执行，而负责：
- 目标设定
- 资源取舍
- 高风险审批
- 低置信度判断
- 组织学习

---

## 3. Decision Brain Layer

经营大脑是系统核心编译层，不是聊天 UI。

建议在前端原型中体现以下能力模块：

- Goal Interpreter
- Context Compiler
- Decision Generator
- Evidence & Confidence Engine
- Review & Attribution Engine
- Asset Retrieval & Capture Engine

前端需要把这些能力体现为：
- Pulse cards
- Decision cards
- Evidence panels
- Confidence / risk labels
- Review-to-asset panels

---

## 4. Scenario Agent Layer

场景 Agent 按生命周期推进项目。

建议至少抽象以下 Agent：

- Opportunity Agent
- New Product Agent
- Diagnosis Agent
- Content Strategy Agent
- Visual Strategy Agent
- Execution Agent
- Upgrade Agent
- Review Capture Agent
- Governance Agent
- Data Observer Agent

前端需要能展示：
- 当前活跃 Agent
- Agent 状态
- Agent 最近动作
- Agent 是否等待人工接管
- Agent 关联的项目对象

---

## 5. Execution and Automation Layer

这是动作落地层，负责：
- 调用 runtime
- 调用业务系统
- 派发任务
- 自动执行低风险动作
- 执行日志记录
- 状态回写
- 风险告警
- 回滚

前端要体现为：
- Action Hub
- Governance Console
- Approval Queue
- Execution Feed
- Audit Trail

---

## 6. Real-time Update Layer

需要实时更新的对象：

- 项目健康度
- 生命周期状态
- 风险等级
- 待批动作
- Agent 状态
- 关键经营指标
- 阻塞状态

不要求实时更新的对象：

- 商品定义正文
- 视觉策略正文
- 复盘结论正文
- 资产详情页正文

---

## 7. 前端页面架构

前端分为三类页面（路由与组件文件见 `docs/IA_AND_PAGES.md` §5）：

### A. Management Frontend
- 经营指挥台（老板）
- 三类总监工作台
- 生命周期总览（`/lifecycle`）
- 风险与审批（`/risk-approval`）
- 复盘沉淀（`/review-assets`）

### B. Lifecycle Workspaces
- 商机池、新品孵化、首发验证、增长优化、老品升级（各对应 `/opportunity-pool` … `/product-upgrade`）

### C. Shared Hubs
- 商品项目详情（`/project/:id`）：跨阶段、跨角色协作与走查的主承载面。
- 动作中心（`/action-center`）
- 经验资产库（`/asset-library`）

---

## 8. 核心前端交互原则

1. Pulse-driven  
   首页和关键页面不是静态 dashboard，而是主动展示今日脉冲。

2. Exception-first  
   管理者优先看到例外、高风险、待批和阻塞，而不是普通任务。

3. Project-object-centered  
   所有重要交互最终落在项目对象上。

4. Lifecycle-driven  
   主结构按生命周期推进，而不是按部门或功能平铺。

5. Human-in-the-loop  
   高风险动作和低置信度建议必须可被人工审核和接管。

6. Review-to-asset-loop  
   复盘不是结束，必须可以沉淀为资产并被后续调用。

---

## 9. 技术实现建议（前端原型阶段）

**当前仓库已采用：**

- Vite + React + React Router（嵌套路由，根布局 `Layout` + `Outlet`）
- Tailwind 4 + Radix 系 UI 组件
- 页面级静态 / 局部 mock 展示（领域类型仍以 `docs/DATA_MODEL.md` 为归依）

**仍建议逐步补强：**

- typed mock schemas 与 `ProjectObject` 全量对齐
- mock state machine for lifecycle
- agent execution feed mock
- live status polling mock or local reactive state

本阶段重点是：
- 信息架构与路由与产品主线一致
- 管理向界面可读、可走查
- 组件可复用
- 与 `DATA_MODEL.md` 的概念边界一致（实现可迭代落地）