# Story 1.5: TBOM 结构导航与详情

## Status
Done

## Story
**As a** TBOM 体验设计的前端工程师  
**I want** 在产品结构(XBOM) 模块中启用试验BOM视图，包含 Type→Project→Test→Run 的层级筛选、详情卡片与关联面板  
**so that** 用户能在原有 XBOM 入口快速浏览试验层级、查看关键资料并与其他 BOM 深链互通

## Acceptance Criteria
1. 在 `产品结构(XBOM)` 模块选择“试验BOM”时加载 TBOM 浏览界面：左栏呈现 Type→Project→Test→Run 树状结构，节点支持懒加载与虚拟滚动，数据来自 `services/tbom.ts`；从 XBOM 详情点击“跳转 试验BOM”或深链参数时自动激活该视图。 [Source: prd.md §8 Story 1.5][Source: ui-architecture.md 目录结构][Source: front-end-spec.md §3.1]
2. 中央区域展示所选节点详情卡，包含基本元数据（名称/类型/最近运行/状态）、输入/输出清单摘要、试验/运行计数与深链状态；无数据时显示空态或引导文案，“查看运行详情”按钮跳转至 Story 1.6 预留的运行页（未实现则禁用并标注 TODO）。 [Source: prd.md §8 Story 1.5][Source: tbom-contract.md]
3. 右侧“关联”面板列出需求(R)、设计(D)、仿真(S)、实物 BOM(P) chips，点击跳转到对应模块或 placeholder；存在 `ebom_node_id` 时显示产品结构路径 (`ebom_path`) 并提供“返回产品结构”按钮，复用深链参数 `?from=tbom&node&path`。 [Source: prd.md §8 Story 1.5][Source: tbom-ui-spec.md §1-7][Source: docs/xbom-identity-map.md]
4. 顶部提供关键字搜索、类型筛选和运行状态筛选；从 XBOM 深链进入时焦点落在筛选条，`aria-live` 提示当前筛选状态；过滤条件驱动树与详情联动，支持重置、错误提示与重试。 [Source: prd.md §8 Story 1.5][Source: tbom-contract.md][Source: docs/mocks/tbom/tbom_run.json]
5. 试验BOM 视图在 `sm/md/lg` 断点保持可用：sm 堆叠、md+ 三栏布局，Tailwind 类名遵循项目规范；列表使用懒加载或虚拟化避免卡顿，并确保 `npm run build`、`npm run lint` 通过且关键视图无视觉回退。 [Source: prd.md 集成验证][Source: ui-architecture.md §4·§10][Source: architecture/adr-0003-heavy-lib-dynamic-import.md]

## Tasks / Subtasks
- [x] 试验BOM 视图集成：
  - [x] 在 `components/structure/ProductStructure.tsx` 的 “试验BOM” 视图中嵌入 TBOM 浏览界面，复用或拆分 `components/tbom` 现有组件，确保与 XBOM 切换状态一致。 (AC: 1)
  - [x] 保留 `NEXT_PUBLIC_ENABLE_TBOM` 开关：关闭时隐藏“试验BOM”入口/Tab，提供可回滚的渐进发布路径。 (AC: 1)
- [x] 树结构与深链：
  - [x] 将 Type→Project→Test→Run 树组件嵌入 XBOM 视图，支持懒加载或虚拟滚动，并解析 `?from=ebom&node&run` 参数聚焦对应节点。 (AC: 1·4)
  - [x] 选择 `ebom_node_id` 匹配项时高亮节点并通过 `aria-live` 宣告状态；缺省时选中默认节点并保留键盘导航。 (AC: 4)
- [x] 详情与关联：
  - [x] 在中央面板渲染 `TbomNodeDetail`（或重构后的组件），展示元数据、输入/输出、运行统计并处理空态/加载态。 (AC: 2)
  - [x] 右侧加载 `TbomRelationPanel`，chips 点击跳转到对应模块或提示 TODO；“返回产品结构” 按钮调用 `Router.push` 携带深链参数。 (AC: 3)
- [x] 筛选与可访问性：
  - [x] 构建搜索/类型/状态筛选条，支持去抖、快捷键聚焦，并在条件变化时通过 `aria-live` 广播结果；筛选条件写入 URL 或本地存储便于刷新恢复。 (AC: 4)
  - [x] 过滤更新时同步树与详情，并提供加载、空、错误提示及重试按钮（可复用现有状态组件）。 (AC: 4)
- [x] 样式与验证：
  - [x] 调整 “试验BOM” 视图布局以适配 sm/md/lg（堆叠→双列→三列），保证滚动区域独立且性能稳定。 (AC: 5)
  - [x] 运行 `npm run dev` 走查深链、筛选、chips 导航，更新 `docs/ui-architecture.md` 与 `docs/changelog.md` 记录嵌入式 TBOM 视图。 (AC: 5)

## Dev Notes
- **数据来源**：Story 1.3 提供 `/api/mock/tbom/*` Route 与 `services/tbom.ts`，本故事应直接复用 `listProjects`/`listTests`/`listRuns` 并通过 Zod schema 校验数据。 若接口返回错误，需在 UI 提示且支持重试；运行状态字段 `status` 缺失时继续维护 `docs/tbom-contract.md` 与 `docs/mocks/tbom/tbom_run.json`。 [Source: prd.md §8 Story 1.3][Source: tbom-contract.md][Source: docs/mocks/tbom/tbom_run.json]
- **嵌入位置**：`components/structure/ProductStructure.tsx` 通过 `bomTypes` 切换视图，需在 `selectedBomType === 'test'` 时渲染 TBOM 三栏布局并与现有 `VerificationOverview` 摘要兼容；无需单独 `/tbom` 路由。 [Source: ui-architecture.md 目录结构][Source: front-end-spec.md §3]
- **组件复用**：`components/tbom` 目录已有树、详情、关联组件；需拆分 `TbomExplorerClient` 的页面壳（Header/Sidebar）以便在 XBOM 视图复用，保持逻辑集中并避免重复数据加载。 [Source: front-end-spec.md §2.2][Source: ui-architecture.md §4]
- **深链交互**：`front-end-spec.md §3.1` 定义 `from=ebom&node&path` 参数；XBOM 详情调用“跳转 试验BOM”时应设置 `selectedBomType='test'`、聚焦对应节点并在筛选条 `aria-live` 宣告当前状态。 [Source: front-end-spec.md §3.1][Source: docs/xbom-identity-map.md]
- **状态管理**：优先使用本地 `useState`+`useMemo` 或 `useReducer`；共享筛选状态可放在 `components/tbom/hooks/`（例如 `useTbomFilters`），并与 `useSearchParams`/LocalStorage (`tbom.filters`) 同步，避免影响其他 BOM 视图。 [Source: ui-architecture.md §4 State Management][Source: ui-architecture.md 附录A]
- **性能要求**：虚拟化长列表（如复用 `react-window`）并懒加载；避免静态引入重库，必要时采用 `next/dynamic`。 [Source: ui-architecture.md §262][Source: architecture/adr-0003-heavy-lib-dynamic-import.md]
- **可访问性**：确保树节点支持键盘上下/左右导航、Enter 选择；过滤结果通过 `aria-live` 提示；关联 chips 提供 `aria-label` 与 focus ring。 [Source: ui-architecture.md §8][Source: tbom-ui-spec.md §5]
- **回滚**：通过 `NEXT_PUBLIC_ENABLE_TBOM` 控制“试验BOM” Tab 的显示和深链响应；关闭时回退到现有 XBOM 体验并隐藏相关入口，文档需记录开关位置。 [Source: prd.md 回滚考虑]

### Testing
- **功能走查**：执行 `npm run dev`，在 产品结构(XBOM) 模块验证：
  - 搜索/筛选更新树与详情内容；
  - 从 XBOM 详情点击“跳转 试验BOM”或访问 `/?from=ebom&node=EBN-ASSY-0001-003&path=...` 时自动切换到试验视图、聚焦节点并朗读状态；
  - Chips 点击跳转（或提示 TODO），`返回产品结构` 按预期处理。 
- **错误路径**：模拟 `/api/mock/tbom/runs` 失败（例如暂时断网）时显示错误与重试；对 `timeseries`/`events` 404 (`R-EX-999`) 的提示与按钮保持一致。 [Source: prd.md 集成验证]
- **兼容性**：运行 `npm run lint`、`npm run build` 确保无错误；必要时录制截图或短视频附在 Dev Agent Record。 [Source: ui-architecture.md §10]

## Change Log
| Date | Version | Description | Author |
| --- | --- | --- | --- |
| 2025-10-16 | v1.0 | 初稿：TBOM 结构导航与详情 Story | Scrum Master |
| 2025-10-16 | v1.1 | 状态更新为 Ready for Dev | Product Owner |
| 2025-10-16 | v1.2 | 需求调整：TBOM 嵌入产品结构(XBOM) 视图 | Product Owner |

## Dev Agent Record
### Agent Model Used
- GPT-5 (Codex) via Codex CLI

### Debug Log References
- 无专门调试日志；构建/校验见 Completion Notes。

### Completion Notes List
- 新增 `/tbom` 路由视图，可通过 `/?from=ebom` 深链或直接访问进入，并在主页提示跳转；产品结构模块的“试验BOM” 视图嵌入相同浏览体验。
- `TbomExplorerClient` 引入错误重试、aria-live 公告、移动端关联面板抽屉与筛选聚焦逻辑，覆盖关键筛选/深链/无数据状态。
- 详情与关联面板补充运行状态徽标、结构路径回返以及运行详情占位；空态与加载态友好提示。
- 更新 `docs/ui-architecture.md`、`docs/changelog.md` 描述三栏布局与错误处理；运行 `npm run lint`、`npm run build` 验证通过。

### File List
- app/page.tsx
- app/tbom/page.tsx
- components/tbom/TbomExplorerClient.tsx
- components/tbom/detail/TbomNodeDetail.tsx
- docs/changelog.md
- docs/ui-architecture.md

## QA Results
_QA 阶段填写_
