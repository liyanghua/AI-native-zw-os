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

---

## D-020 Batch 4 uses mock execution before real system integration
Reason:
Batch 4 的目标是先证明推荐动作可以进入可执行、可回写、可复盘、可沉淀资产的闭环，而不是提前解决真实外部系统权限、可靠性、回滚和异步编排问题。先用 mock connector 可以把 action / execution / writeback / review / asset 的 contract 稳定下来，再替换底层执行端。
Status:
accepted

---

## D-021 Director archetypes must map to different action domains
Reason:
如果 `operations_director`、`product_rnd_director`、`visual_director` 仍共用一套泛化 action shape，就无法体现真实协同分工，也无法让后续 connector、writeback 和 review 结果有结构差异。Batch 4 必须显式区分 `operations`、`product_rnd`、`visual` 三类动作域。
Status:
accepted

---

## D-022 Writeback, review, and asset candidate must persist to SQLite
Reason:
如果执行成功、review 生成、asset candidate 发布只停留在 UI 状态，就无法形成真正可追溯的本地闭环，也无法让角色页和项目详情页共享同一套事实来源。Batch 4 必须把 writeback、review、asset candidate 真实写回 SQLite。
Status:
accepted

---

## D-023 Upgrade from project execution loop to governance loop
Reason:
如果系统只停留在单项目执行闭环，动作、review、asset 仍然会散落在项目页内部，无法形成跨项目、跨角色的经营治理视图。Batch 5 必须补 action center、review center、asset library，把执行闭环升级为治理闭环。
Status:
accepted

---

## D-024 Review and asset must feed back into knowledge
Reason:
review 和 asset 只有在能够反向成为后续项目可检索的方法证据时，才真正构成组织学习闭环。因此 Batch 5 规定 knowledge feedback 必须真实生成新的 knowledge asset / chunk，而不是只改 UI 状态。
Status:
accepted

---

## D-025 Evaluation must persist to SQLite
Reason:
如果 decision / action / execution / review / asset 的评测结果只在前端临时算分，就无法审计历史，也无法为老板和总监提供可追溯的闭环质量信号。Batch 5 必须把 evaluation records 真实写入 SQLite。
Status:
accepted

---

## D-026 Runtime Kernel must sit above execution runs
Reason:
如果系统只有 `execution_run` 而没有 `workflow -> task -> event` 的更上层运行模型，就无法清晰表达等待审批、等待写回、失败重试、取消等状态，也无法在项目页或动作中心展示可审计 timeline。Batch 6 必须补 runtime kernel。
Status:
accepted

---

## D-027 Eval harness needs dedicated cases, suites, runs, and gates
Reason:
Batch 5 的 `evaluation_records` 更适合治理摘要和轻量评分历史，无法承担可复跑回归、suite 级 summary、gate decision 的职责。Batch 6 必须新增独立 eval harness 表与 API，而不是继续把所有评测塞进一张表。
Status:
accepted

---

## D-028 Ontology governance should use a unified registry
Reason:
role profile、stage rule、action policy、review pattern、template、skill 如果继续散落在 seed、代码常量和单张表里，就很难做版本、状态、owner 和 lineage 管理。Batch 6 必须引入统一 ontology registry 和 version record。
Status:
accepted

---

## D-029 Bridge adapters must stay in a dedicated server bridge layer
Reason:
未来真实系统接入不可直接写死在页面、runtime compile 或 repository 中，否则 bridge mode、mapping errors、freshness 和 sync diagnostics 都会失控。Batch 6 必须把 local mock、file bridge、api bridge 收敛到统一 bridge adapter layer。
Status:
accepted
