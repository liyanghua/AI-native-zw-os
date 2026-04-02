# Decisions Log

## D-001 Lifecycle is the primary navigation
Reason:
The product is fundamentally about moving product commerce objects through a lifecycle, not about browsing isolated modules.

Status:
accepted

---

## D-002 Role is a view, not a structure
Reason:
CEO, Product R&D Director, Growth Director, and Visual Director should see different defaults, but the system must remain unified around shared objects and states.

Status:
accepted

---

## D-003 Project Object is the collaboration center
Reason:
We do not want fragmented collaboration across tasks, docs, and isolated modules. The project object is the top-level operating unit.

Status:
accepted

---

## D-004 Frontend is management-oriented, not execution-oriented
Reason:
Execution is delegated to agents and runtime layers. The frontend should optimize for command, orchestration, governance, and review.

Status:
accepted

---

## D-005 Exception-first design
Reason:
Management users should not be overwhelmed by routine tasks. They should see top pulse, risks, blockers, approvals, and exceptions first.

Status:
accepted

---

## D-006 AI is embedded, not a generic chat shell
Reason:
The decision brain should appear through pulse cards, decision cards, evidence panels, risk labels, and review suggestions—not as a floating generic assistant.

Status:
accepted

---

## D-007 Review must lead to assets
Reason:
Review is only valuable if it improves the next cycle. Therefore review pages must support templates, cases, skills, and evaluation samples.

Status:
accepted

---

## D-008 Real-time updates apply selectively
Reason:
Only signals, project state, risks, approvals, blockers, and agent status need real-time updates. Definitions, briefs, and reviews are stage-based content.

Status:
accepted


## D-009 UI default language is Simplified Chinese for business users
Reason:
Primary users are business leaders and directors. Navigation, page titles, cards, and status labels should use business-friendly Chinese.
Status:
accepted

## D-010 Project Object Page is the primary walkthrough and collaboration surface
Reason:
The product must be validated through lifecycle-driven walkthroughs. The project object page is the point where roles, decisions, actions, agents, execution results, review, and asset capture converge.
Status:
accepted

---

## D-011 Batch 1 uses SQLite instead of direct enterprise integrations
Reason:
Batch 1 的目标是先形成可运行、可 seed、可查询、可扩展的本地单机闭环沙箱。直接连真实系统会把工作重点提前拉到权限、网络、对接稳定性和数据脏读问题上，反而延缓主线验证。
Status:
accepted

---

## D-012 Lifecycle pages and project detail must go through API, not page mock
Reason:
如果页面继续直接依赖页面级业务 mock，就无法形成可复用的数据底座，也无法证明后续三个闭环可以建立在统一 contract 之上。Batch 1 必须先让 SQLite -> API -> repository -> UI 跑通。
Status:
accepted

---

## D-013 Build a Local Pilot Sandbox before full-fidelity integration
Reason:
本项目当前优先验证经营主线、角色主线和协同主线的骨架，而不是立即完成全真集成。Local Pilot Sandbox 允许先确定 domain contract、API contract 和页面消费边界，再逐步替换底层数据源。
Status:
accepted

---

## D-014 Batch 2 uses SQLite-based light RAG instead of a vector database
Reason:
Batch 2 的目标是让同一个项目能拿到 method evidence 并进入决策编译，而不是先建设完整向量平台。SQLite FTS5 + metadata 过滤足以支撑本地单机沙箱验证，同时保留后续替换为 embedding / vector store 的空间。
Status:
accepted

---

## D-015 compileDecision and compileRoleStory must stay in the API layer
Reason:
如果 `DecisionObject` 或 `RoleStory` 由前端页面拼装，会重新引入页面私有业务逻辑，破坏统一 contract，也无法保证老板与总监看到的是同源叙事。Batch 2 必须把编译逻辑沉到 server API 层。
Status:
accepted

---

## D-016 Project Detail is the first landing surface for evidence and decision
Reason:
相比先重做完整动作中心或老板页，项目详情页是最短主线：同一个 `projectId` 上同时汇集项目上下文、事实证据、方法证据、决策对象和角色叙事，更适合作为 Batch 2 的第一落点。
Status:
accepted

---

## D-017 Director cannot remain a generic role
Reason:
Batch 3 需要证明不同总监角色在同一个项目对象上看到的不是“同一页换个标题”，而是不同的关注点和决策范围。因此 `director` 不能继续作为主角色扩张，只保留兼容 alias。
Status:
accepted

---

## D-018 Split director archetypes before deeper workflow automation
Reason:
先拆出 `operations_director`、`product_rnd_director`、`visual_director`，才能让后续 execution / writeback / review / asset loop 有明确的角色接入点，否则自动化只会继续围绕一个泛化总监展开，无法支持真实协同。
Status:
accepted

---

## D-019 Role composition must stay on the server side
Reason:
如果角色页在前端临时拼接 dashboard 逻辑，就会重新引入页面私有真相，也会导致角色页和项目详情页对同一个 `projectId` 的理解不一致。Batch 3 必须把角色编排沉到 server compose 层。
Status:
accepted
