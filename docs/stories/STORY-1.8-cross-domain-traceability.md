# Story 1.8: 跨域关联与可追溯

## Status
Done

## Story
**As a** 系统工程师  
**I want** 在 TBOM 节点与运行详情中查看需求/设计/仿真/实物的关联并保持往返导航  
**so that** 我能够从试验视角验证跨域覆盖并快速跳转到对应域做进一步分析

## Acceptance Criteria
1. 在 TBOM 节点详情与运行详情页展示需求、EBOM、仿真、实物 BOM 关联 chips，支持键盘焦点与 aria-live 状态播报，空/错态提示清晰并符合既有视觉语言。 [Source: prd.md §8 Story 1.8]
2. 跨域 chips、面包屑或返回按钮保持筛选上下文：从 TBOM 跳转到需求/设计/仿真/实物视图能带上深链参数，返回时保留节点高亮与筛选条件；产品结构树节点详情可直接浏览挂接试验列表（基于 `ebom_node_id`）并进入 TBOM。 [Source: prd.md §8 Story 1.8][Source: front-end-spec.md §3.1][Source: tbom-ui-spec.md §3]
3. 在 `docs/tbom-contract.md` 新增《指标口径与映射约定》小节（建议置于第 4 章之后，锚点 `## 4.1 指标口径与映射约定`），列出需求/设计/仿真/实物与 TBOM 的字段映射与单位口径同步规则，并在 `docs/changelog.md` 记录版本。 [Source: prd.md §8 Story 1.8][Source: tbom-contract.md §4]

## Tasks / Subtasks
- [x] 扩展 TBOM 关联组件以呈现跨域 chips 并复用现有可访问性策略，覆盖节点详情与运行详情页面。 (AC: 1) [Source: prd.md §8 Story 1.8][Source: tbom-ui-spec.md §3][Source: ui-architecture.md §8]
  - [x] 更新 `TbomRelationPanel`（或等效组件）根据 `relations`、`ebom_node_id` 渲染需求/EBOM/仿真/实物 chips，区分正常/空/错误状态并保持键盘可达。 (AC: 1) [Source: tbom-contract.md §1·§4]
  - [x] 在 `TbomRunDetail` 中复用 chips，将 `test_item_sn`、仿真引用等运行上下文映射到跳转参数，并播报状态变化。 (AC: 1) [Source: tbom-contract.md §3.3·§4][Source: stories/STORY-1.6-run-detail-experience.md]
- [x] 构建跨域导航与返回链路，确保筛选与深链上下文不丢失，同时落实 PRD 集成验证要求。 (AC: 2, IV1-3) [Source: prd.md §8 Story 1.8][Source: front-end-spec.md §3.1]
  - [x] 为 chips 点击增加导航逻辑：跳转到需求/仿真/结构视图时写入 `from=tbom` 等参数，支持新标签与当前页；返回 TBOM 时恢复 `tbom.filters`、节点高亮与运行详情状态。 (AC: 2, IV3) [Source: ui-architecture.md §6 Routing][Source: docs/xbom-identity-map.md]
  - [x] 在产品结构节点详情面板呈现“挂接试验”列表（类型、最近运行、状态），复用 `listRunsByEbomNode` 聚合，支持快捷进入 TBOM 并通过 `components/structure/ProductStructure.tsx` 触发 TBOM 页签切换。 (AC: 2, IV1) [Source: prd.md §8 Story 1.8][Source: tbom-ui-spec.md §3]
  - [x] 更新需求视图容器（`components/structure/RequirementDetailPanel.tsx` & 相关状态 in `components/structure/ProductStructure.tsx`）以解析 `from=tbom` 深链、预选对应需求并展示返回 TBOM 入口，满足 IV1。 (IV1) [Source: prd.md §8 Story 1.8][Source: ui-architecture.md §6]
  - [x] 更新仿真模块（`components/structure/simulation/*`，含 `SimulationTreePanel`、`SimulationContentPanel`）接受 TBOM 传入的筛选维度并在返回时回写 `tbom.filters`，满足 IV1。 (IV1) [Source: prd.md §8 Story 1.8][Source: ui-architecture.md §6]
  - [x] 在 Compare 模块中（`components/compare/CompareCenter.tsx`）扩展 TBOM payload 使得选择运行后可直接加载仿真占位数据，并在接收 `from=tbom` 参数时对齐单位/采样率提示，满足 IV2。 (IV2) [Source: prd.md §8 Story 1.8][Source: architecture/adr-0005-compare-alignment-policy.md]
  - [x] 在 `app/page.tsx` 引入防循环路由守卫：区分 TBOM→其他模块与 EBOM→TBOM 深链，避免 `from=tbom` 和 `from=ebom` 互相触发无限跳转，并维持筛选上下文缓存。 (IV3) [Source: prd.md §8 Story 1.8][Source: ui-architecture.md §6]
- [x] 在 `docs/` 新增《指标口径与映射约定》小节，并同步 `docs/changelog.md` 记录。 (AC: 3) [Source: prd.md §8 Story 1.8][Source: tbom-contract.md §4]
- [x] 编写测试覆盖跨域导航、chips 可访问性与深链恢复。 (AC: 1,2) [Source: ui-architecture.md §8]
  - [x] RTL：验证 chips 键盘可达、aria-live 提示与空/错态渲染。 (AC: 1) [Source: ui-architecture.md §8]
  - [x] Playwright：模拟从 `/?from=ebom&node=…` 进入 TBOM，点击 chips 跳转（需求、仿真、Compare 与 EBOM 挂接试验列表）及面包屑返回后保持筛选/高亮，并验证“挂接试验”列表可见。 (AC: 2, IV1-3) [Source: front-end-spec.md §3.1][Source: ui-architecture.md §8]
- [x] 运行 `npm run lint`、`npm run build` 验证无回归，并记录结果供 Dev Agent 留存。 (AC: 1-3) [Source: prd.md 集成验证]

## Dev Notes
- **Previous Story Insights**：Story 1.5 已在 TBOM 右侧提供关联面板与“返回产品结构”占位，本故事需在此基础上补全 chips 数据与跳转；Story 1.6 的运行详情已集成 Compare 深链并通过事件/LocalStorage 同步上下文，扩展 chips 时需重用该机制；Story 1.7 的导入向导会刷新树与详情缓存并高亮新增运行，跨域导航需尊重该刷新状态。 [Source: stories/STORY-1.5-tbom-structure-navigation.md][Source: stories/STORY-1.6-run-detail-experience.md][Source: stories/STORY-1.7-import-wizard.md]
- **Data Models**：`tbom_project.json` 的 `relations[]{kind,ref_id}` 提供需求与仿真引用；`tbom_test.json` 及 `tbom_run.json` 暴露 `ebom_node_id`、`ebom_path`，运行层还包含 `test_item_sn`（实物追溯）；这些字段需映射到 chips 与导航参数。 [Source: tbom-contract.md §1·§3·§4]
- **API Specifications**：TBOM 数据统一通过 Next Route Handlers `/api/mock/tbom/*` 暴露，前端仍使用 `services/http.ts` + Zod 校验的轻量封装；新增聚合或映射接口须复用该前缀及错误模型。 [Source: architecture/adr-0004-mock-api-route-handlers.md][Source: architecture/adr-0002-http-client-zod.md]
- **Component Specifications**：`front-end-spec` 定义 `?from=ebom&node&path` 深链与返回体验，`tbom-ui-spec` 要求在节点详情展示关联 chips 与“返回 TBOM”入口；chips 需遵循现有焦点样式与 tooltip 设计。 [Source: front-end-spec.md §3.1][Source: tbom-ui-spec.md §3·§5]
- **File Locations**：TBOM 视图相关代码位于 `components/tbom/`（结构/详情/关联/导入），嵌入 XBOM 的入口在 `components/structure/ProductStructure.tsx`；若尚无 `components/tbom/relations/` 目录，需要创建该子目录以集中 chips/导航组件，并在 `components/tbom/hooks/` 管理共享逻辑。 需求/仿真/Compare 容器分别位于 `components/structure/RequirementDetailPanel.tsx`、`components/structure/simulation/*`、`components/compare/CompareCenter.tsx`，路由守卫则位于 `app/page.tsx`。 [Source: ui-architecture.md §3 Project Structure][Source: ui-architecture.md §6]
- **Testing Requirements**：最小测试矩阵要求 RTL 覆盖空/错态与键盘可达，Playwright 验证 XBOM→TBOM 深链与 chips 交互；新增或更新测试需落位在 `components/tbom/__tests__/` 与 `e2e/`. [Source: ui-architecture.md §8]
- **Technical Constraints**：深链参数与返回逻辑需遵守 `ui-architecture` 路由约束，不拆分独立 `/tbom` 首屏；样式继续使用 Tailwind v3 工具链与既有类顺序，交互需提供 aria-live 提示。 [Source: ui-architecture.md §6 Routing][Source: ui-architecture.md §7]
- **Documentation Notes**：新增《指标口径与映射约定》需说明各域字段映射、单位与示例，并在 `docs/changelog.md` 记录版本号。 [Source: prd.md §8 Story 1.8][Source: tbom-contract.md §4]

### Testing
- **RTL**：覆盖 chips 渲染状态、键盘导航与 aria-live 播报，确保无数据/错误时提示正确。 [Source: ui-architecture.md §8]
- **Playwright**：验证 `/?from=ebom&node=…` 深链进入 TBOM 后 chips 跳转与面包屑返回保持筛选与节点高亮，并确认需求/仿真页面接收参数、Compare 加载占位、EBOM “挂接试验”列表渲染及路由守卫生效。 [Source: front-end-spec.md §3.1][Source: ui-architecture.md §8]
- **Build Verification**：执行 `npm run lint`、`npm run build` 记录结果，确保跨域增强未引入构建或样式回退。 [Source: prd.md 集成验证]

## Change Log
| Date | Version | Description | Author |
| --- | --- | --- | --- |
| 2025-10-23 | v0.1 | 初稿：跨域关联与可追溯 Story | Scrum Master |
| 2025-10-23 | v0.2 | 补充 IV1-3 集成任务、文档锚点与模块指引 | Scrum Master |
| 2025-10-23 | v1.0 | 标记 Story 完成并移交开发 | Product Owner |
| 2025-10-23 | v1.0 | 完成跨域 chips、导航回写、文档与测试交付 | Codex |
| 2025-10-23 | v1.1 | 修复 run 详情导航未持久化筛选并补充回归测试 | Codex |

## Dev Agent Record
### Agent Model Used
- Codex (GPT-5)

### Debug Log References
- `npm run lint`（现有 `useTbomImportState` Hook 仍触发历史告警，未阻塞）
- `npm run test -- TbomRunDetail`
- `npm run build`（补齐 jszip 等依赖并修正导入 schema，构建通过）

### Completion Notes List
- 新增 `components/tbom/relations/*` 统一 chips 渲染、导航与上下文持久化，`TbomRelationPanel`、`TbomRunDetail` 接入 aria-live 提示与状态区分。
- 扩展 `app/page.tsx`、`ProductStructure`、`CompareCenter`、`Dashboard` 接收 `from=tbom` 深链，提供返回 TBOM、挂接试验列表与 Compare payload 自动加载。
- 调整 `ProductStructure`、`Dashboard` “返回 TBOM” 按钮，改为回到 XBOM 试验 BOM 视图并延续 TBOM 上下文。
- `TbomExplorerClient` 恢复 `tbom.context`/`tbom.filters`，更新文档 `docs/tbom-contract.md`、`docs/changelog.md` 并补充 RTL/Playwright 覆盖。
- 修复 TbomRunDetail 缺失的 `filterSnapshot` 传递以保留跨域导航筛选，并新增 RTL/Playwright 覆盖 run-detail → 结构视图往返场景。

### File List
- app/page.tsx
- app/tbom/page.tsx
- components/compare/CompareCenter.tsx
- components/dashboard/Dashboard.tsx
- components/structure/ProductStructure.tsx
- components/tbom/TbomExplorerClient.tsx
- components/tbom/detail/TbomRelationPanel.tsx
- components/tbom/detail/TbomRunDetail.tsx
- components/tbom/detail/TbomNodeDetail.tsx
- components/tbom/detail/__tests__/TbomRunDetail.test.tsx
- components/tbom/hooks/useTbomImportState.ts
- components/tbom/relations/constants.ts
- components/tbom/relations/types.ts
- components/tbom/relations/TbomRelationChips.tsx
- components/tbom/relations/useTbomCrossDomainNavigation.ts
- components/tbom/__tests__/TbomRelationChips.test.tsx
- docs/tbom-contract.md
- docs/changelog.md
- e2e/tbom.deep-link.spec.ts
- services/tbom-import.ts

## QA Results

### Review Date: 2025-10-23
### Reviewed By: Quinn (Test Architect)

### Findings
- ✅ Verified the regression fix: `TbomRunDetail` now accepts the active `filterSnapshot` and forwards it to `TbomRelationChips`, so `useTbomCrossDomainNavigation` persists both `tbom.filters` and `tbom.context` before routing。Filters remain intact after the run-detail → Product Structure → “返回 TBOM” loop. (components/tbom/detail/TbomRunDetail.tsx:25-34, 492-500; components/tbom/detail/TbomNodeDetail.tsx:20-52)
- ✅ “返回 TBOM” 按钮现返回 XBOM 结构模块并激活试验 BOM 视图；回退不再跳到 `/tbom` 独立路由，符合导航预期。 (components/structure/ProductStructure.tsx:5096-5107; components/dashboard/Dashboard.tsx:60-68)

### Requirements Traceability
- AC1: ✅ Chips retain aria-live feedback and state handling across explorer panels and run detail.
- AC2: ✅ Filter/search context restores when returning from cross-domain navigation initiated in run detail; manual verification and automation confirm.
- AC3: ✅ Documentation updates (`docs/tbom-contract.md` §4.1, changelog entry) still accurate post-fix.

### Test Coverage & Evidence
- Added RTL coverage in `components/tbom/detail/__tests__/TbomRunDetail.test.tsx:226-261`, asserting filter persistence and router navigation.
- New Playwright scenario `e2e/tbom.deep-link.spec.ts:23-49` exercises the run-detail → structure → return flow and confirms restored search input.
- Existing chips accessibility/unit tests continue to pass.

### Non-Functional Review
- Accessibility & resilience unchanged: chips announce state, storage writes guarded with try/catch, and no regressions observed in the modal experience.

### Risks & Mitigations
- No outstanding blockers; recommend monitoring browser storage quotas in lower-memory devices as a follow-up, though current usage remains minimal.

### Decision
- Gate Recommendation: PASS（AC1–AC3 均已满足，阻塞缺陷解除）
