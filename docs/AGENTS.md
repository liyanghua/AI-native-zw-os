# AGENTS.md

## Read First

UI display copy should default to business-friendly Simplified Chinese unless explicitly requested otherwise.
Do not revert existing Chinese UI labels back to English.
Prefer existing naming conventions already used in navigation, pages, cards, and status labels.
Current priority: keep documentation aligned with the runnable **Vite + React Router** prototype under `src/app/`; object shapes and naming remain governed by `docs/DATA_MODEL.md` (unchanged by doc sync).

Before making any changes, read these files:

1. `docs/README_PRODUCT.md`
2. `docs/ARCHITECTURE.md`
3. `docs/IA_AND_PAGES.md`
4. `docs/DATA_MODEL.md`
5. `docs/PLAN.md`
6. `docs/IMPLEMENT.md`
7. `docs/DECISIONS.md`
8. `docs/Guidelines.md`（界面字体、颜色、卡片与按钮层级；与 `src/styles/theme.css` 等样式入口一致）

Treat them as the product and implementation source of truth. Follow `docs/IA_AND_PAGES.md` §5 for route-to-file mapping.

---

## Product Context

This repo is for an **AI-native lifecycle-driven commerce operating system**.

It is:

- **lifecycle-driven**
- **project-object-centered**
- **pulse-driven**
- **exception-first**
- **human-in-the-loop**
- **agent-orchestrated**
- **review-to-asset-loop**

It is **not**:

- a generic BI dashboard
- a generic task manager
- a generic chat assistant shell
- a collection of unrelated feature pages

The system is built around:

- lifecycle stages
- project objects
- management frontends
- decision objects
- action lifecycle
- governance
- review and asset capture

Management users (prototype labels):

- 老板（CEO）
- 产品研发总监（Product R&D Director）
- 运营与营销总监（Growth / Operations & Marketing Director）
- 视觉总监（Visual Director）

Execution is delegated to agents and runtime layers, so the frontend must focus on:

- command
- orchestration
- governance
- review
- reusable operating assets

---

## Core Product Rules

### 1. Lifecycle is the primary structure
Main lifecycle stages (domain enums—see `DATA_MODEL.md`):

- `opportunity_pool`
- `new_product_incubation`
- `launch_validation`
- `growth_optimization`
- `legacy_upgrade`
- `review_capture`

Do not replace lifecycle structure with department-based or module-based navigation.

### 2. Project Object is the collaboration center
All meaningful work should connect back to a `ProjectObject`.

Do not create page-local concepts that bypass the project object model unless absolutely necessary.

### 3. Role is a view, not a separate product
The four roles share the same underlying object model.

Role-specific experiences should differ by:

- default summaries
- priorities
- page emphasis
- ViewModels

Not by creating separate disconnected systems.

### 4. Distinguish four operating layers clearly
The product should always preserve the distinction between:

- human decisions
- decision brain recommendations
- scenario agent progress
- automation execution results

Do not collapse these into one generic status.

### 5. Exception-first management UI
Management pages should emphasize:

- pulse
- risks
- blockers
- pending approvals
- live health
- exceptions
- agent state

Do not overload management pages with low-value execution detail.
UI display copy should default to business-friendly Simplified Chinese unless explicitly requested otherwise.
Prefer business-facing labels over technical jargon.

### 6. Review must lead to assets
Review is only useful if it improves the next cycle.

Review pages must support:

- lessons learned
- reusable strategy extraction
- asset candidates
- asset publishing

---

## Implementation Rules

### 1. Stay within milestone scope
Only implement the current milestone or explicitly requested scope.

Do not proactively expand into unrelated pages, flows, or refactors.

### 2. Prototype stack (current repo)
- **Build**: Vite 6 + `@vitejs/plugin-react`
- **Routing**: React Router 7（`createBrowserRouter`，定义于 `src/app/routes.tsx`）
- **UI**: React 18、Tailwind 4、Radix 系组件、`src/app/components/ui/*`
- **Layout**: `src/app/components/layout/Layout.tsx`（侧栏 + 顶栏角色切换）

When introducing typed domain code, prefer a dedicated `src/domain/*` layout and align types with `DATA_MODEL.md`; the current prototype may keep presentation-only state inside page components until that layer exists.

### 3. Prefer reusable typed components
Use shared cards, panels, and layouts across dashboards and lifecycle pages where patterns repeat.

### 4. Use ViewModels for page shaping
If a page needs custom formatting or grouping, use ViewModel mappers instead of mutating canonical domain types (once `src/domain` exists).

### 5. Keep routing predictable
Canonical paths are listed in `docs/IA_AND_PAGES.md` §1 and §5. Do not invent parallel URL schemes without updating that doc.

### 6. Use mock data unless real integration is explicitly in scope
For prototype stages, prefer in-component mock content or small local fixtures.

### 7. Embedded AI, not floating generic chat
AI should appear through:

- pulse cards
- decision cards
- evidence panels
- confidence labels
- review suggestions
- asset capture suggestions

Do not default to a floating generic assistant UI.

### 8. Live operating state matters
Where relevant, pages should show:

- project health
- risk level
- blockers
- pending approvals
- agent state
- recent execution updates
- signal freshness

---

## Code Style Rules

### 1. Be conservative with changes
Keep diffs scoped and localized.

### 2. Do not rewrite unrelated files
If a file is unrelated to the current milestone, leave it alone unless necessary for build or consistency.

### 3. Prefer explicit, readable code
Use clear names and predictable structure over clever abstractions.

### 4. Keep the UI management-oriented
Cards and sections should support decision-making, not just data display.

### 5. Preserve naming consistency
Use the naming already established in docs and domain models:
- ProjectObject
- DecisionObject
- ActionItem
- AgentState
- ReviewSummary
- AssetCandidate
- PublishedAsset

Do not invent near-duplicate naming.

---

## Required Workflow for Every Task

For every implementation task:

1. Read `docs/AGENTS.md` and the referenced docs first.
2. Confirm the current milestone or scope.
3. Inspect existing code before adding new structures.
4. Implement only the requested scope.
5. Reuse existing components and patterns where possible.
6. Run validation after changes.
7. Update `docs/IMPLEMENT.md` progress notes.

---

## Validation Requirements

After making changes, run relevant validation.

At minimum, ensure:

- `npm run build` succeeds
- imports resolve
- routes render
- no dead links in the implemented area
- reusable components are used where expected

If validation cannot be run, say so clearly and explain why.

---

## Documentation Update Rules

Update documentation when:

- a structural assumption changes
- a route plan changes
- a major component ownership changes
- a domain model changes
- a milestone is completed

At minimum, update:

- `docs/IMPLEMENT.md`
- and, if needed, the source-of-truth doc that changed

---

## Product-to-Code Mapping Reminder

See **`docs/IA_AND_PAGES.md` §5** for the authoritative path → component table.

Summary:

- 经营指挥台 → `BossDashboard.tsx`
- 三总监台 → `ProductDirectorDashboard.tsx`, `OperationsDirectorDashboard.tsx`, `VisualDirectorDashboard.tsx`
- 生命周期与阶段站 → `src/app/components/lifecycle/*`
- 商品项目详情 → `ProjectDetail.tsx`
- 动作中心 / 风险与审批 / 复盘沉淀 / 经验资产库 → `actions/`, `risk/`, `review/`, `assets/`

---

## If Something Is Ambiguous

If docs are ambiguous:

1. Prefer `docs/README_PRODUCT.md` and `docs/ARCHITECTURE.md` for product intent.
2. Prefer `docs/DATA_MODEL.md` for object shape and naming.
3. Prefer `docs/IA_AND_PAGES.md` for page purpose, routes, and code paths.
4. Prefer `docs/IMPLEMENT.md` for implementation status.
5. Record any important assumption in `docs/IMPLEMENT.md`.

Do not silently invent a conflicting product structure.

---

## Default Instruction for Current Phase

Unless explicitly told otherwise, optimize for:

- prototype quality
- architectural clarity
- strong object model alignment (with `DATA_MODEL.md`)
- reusable UI structure

Not for:

- polished production backend
- real integrations
- premature optimization
- feature sprawl
