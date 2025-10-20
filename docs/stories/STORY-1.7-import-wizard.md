# Story 1.7: 最小上载导入向导

## Status
Draft

## Story
**As a** 试验工程师  
**I want** 在 XBOM `Test` 视图通过导入向导上传最小数据包并即时校验  
**so that** 我能够快速在 TBOM 结构与运行详情核对数据并保留错误日志以便修正

## Acceptance Criteria
1. 导入向导提供“选择契约类型 → 客户端校验 → 映射确认 → 导入结果摘要 → 导入日志回看”五步流程，覆盖 JSON/CSV/ZIP 入口、阻塞/错误提示、键盘导航与 `aria-live` 可达性说明，入口位于 XBOM `Test` Tab 工具区并复用现有按钮样式。 [Source: prd.md §8 Story 1.7][Source: front-end-spec.md §3.2][Source: ui-architecture.md A.3]
2. 客户端依据 `tbom-contract` 校验最小文件集（`tbom_project.json`、`tbom_test.json`、`tbom_run.json`、`process_event*.csv`、`attachments.csv`，可选 `result_timeseries*.csv`/`test_card.csv`），对字段缺失、列头错误、引用不一致给出可下载示例与修复建议。 [Source: prd.md §8 Story 1.7][Source: tbom-contract.md §2·§5][Source: front-end-spec.md §3.2]
3. 导入成功后 TBOM 树、详情与运行页即时刷新并高亮新增/更新记录；错误行支持 CSV 下载并在导入摘要中呈现，失败项可重试，整个流程保持键盘可达与状态播报。 [Source: prd.md §8 Story 1.7][Source: front-end-spec.md §3.2][Source: ui-architecture.md A.3]
4. 更新 `docs/tbom-contract.md` 和示例数据，加入导入流程说明、错误码、样例日志与 ZIP 包结构，版本号递增并在 `docs/changelog.md` 记录。 [Source: prd.md §8 Story 1.7]
5. 导入流程在 100MB 级别文件保持响应（进度条、分块解析、超时/中断提示），与 Mock 数据并存支持增量/覆盖策略，导入日志本地保留 ≥7 天且不引入危险浏览器权限。 [Source: prd.md §8 Story 1.7][Source: prd.md §11 NFR][Source: front-end-spec.md §3.2]

## Tasks / Subtasks
- [ ] 在 `components/structure/ProductStructure` 的 `Test` 工具区注入“导入数据包”入口，挂载新的 `TbomImportWizard` 对话框/抽屉组件，继承现有按钮样式与 `NEXT_PUBLIC_ENABLE_TBOM` 开关，并为每一步设置标题、说明与可见焦点流。 (AC: 1) [Source: front-end-spec.md §3.2][Source: ui-architecture.md §3 Project Structure][Source: ui-architecture.md A.3]
  - [ ] 构建向导外壳（Stepper + 页脚操作区），实现键盘 `Tab`/`Shift+Tab`、`Esc` 关闭、`aria-live` 状态更新与 reduced motion 降级动效。 (AC: 1) [Source: front-end-spec.md §3.2][Source: ui-architecture.md §10]
  - [ ] 追加“导入日志”面板，默认展示最近一次导入状态并提供重试入口。 (AC: 1) [Source: front-end-spec.md §3.2][Source: prd.md §8 Story 1.7]
- [ ] 实现文件选择与校验：使用 React Hook Form + Zod 解析 JSON/CSV/ZIP，复用 `utils/csv.parseCsvRecords` 并提供列头/字段错误提示，支持拖拽与多文件选择。 (AC: 2) [Source: ui-architecture.md §2 Tech Stack][Source: tbom-contract.md §2][Source: architecture/adr-0002-http-client-zod.md]
  - [ ] 校验 `project/test/run/process_event/attachments/test_card` 之间的引用关系与单位/采样率口径，对缺失字段给出修复建议并允许下载示例包。 (AC: 2) [Source: tbom-contract.md §1·§3][Source: prd.md §8 Story 1.7][Source: docs/mocks/tbom]
- [ ] 构建映射确认视图：自动比对现有 TBOM 数据与导入内容，标注新增/更新/冲突项，允许手动调整字段映射与策略（增量/覆盖），并提供可访问的差异列表。 (AC: 1,3,5) [Source: prd.md §8 Story 1.7][Source: front-end-spec.md §3.2]
  - [ ] 为冲突项提供解决策略说明（覆盖/跳过）并在摘要中追加统计。 (AC: 3,5) [Source: prd.md §8 Story 1.7 IV2][Source: front-end-spec.md §3.2]
- [ ] 扩展 `services/tbom.ts` 或新增 `services/tbom-import.ts` 与 `components/tbom/hooks/useTbomImportState`，在导入成功后合并数据源、刷新缓存（项目/试验/运行）、触发树与运行详情的局部刷新，并复用 `localStorage.tbom.filters`/`tbom.lastNode` 维持上下文。 (AC: 3,5) [Source: ui-architecture.md §4 State Management][Source: stories/STORY-1.6-run-detail-experience.md][Source: prd.md §8 Story 1.7]
  - [ ] 当导入包含新运行时，通知 `TbomRunDetail` 与 Compare payload 缓存刷新，保持运行详情与 Compare 入口同步。 (AC: 3) [Source: stories/STORY-1.6-run-detail-experience.md][Source: architecture/adr-0004-mock-api-route-handlers.md]
  - [ ] 在 Mock 环境新增 `POST /api/mock/tbom/import` Route Handler，写入临时缓存并返回导入摘要，确保与现有 Mock 数据并存。 (AC: 2,3,5) [Source: architecture/adr-0004-mock-api-route-handlers.md][Source: docs/mocks/tbom]
- [ ] 实现结果摘要与错误行下载：展示新增/更新/跳过/失败计数，支持导出错误行 CSV、导入日志 JSON，并将日志保留 ≥7 天（IndexedDB/LocalStorage），同时提供重试与回滚操作。 (AC: 1,3,5) [Source: front-end-spec.md §3.2][Source: prd.md §11 NFR][Source: prd.md §8 Story 1.7]
  - [ ] 提供进度条与超时/中断提示，防止大文件导入阻塞主线程，可使用 Web Worker 或 `requestIdleCallback` 解耦解析。 (AC: 5) [Source: prd.md §8 Story 1.7 IV1][Source: ui-architecture.md §10]
- [ ] 更新 `docs/tbom-contract.md` 与示例包：新增导入流程章节、错误码、样例日志与 ZIP 包说明，递增版本号并在 `docs/changelog.md` 记录。 (AC: 4) [Source: prd.md §8 Story 1.7][Source: tbom-contract.md][Source: docs/changelog.md]
- [ ] 补充测试：编写 RTL 用例覆盖成功/错误/空态、键盘导航与 `aria-live` 提示；新增 Playwright 场景模拟导入流程并校验 TBOM 树/运行详情更新；为服务层添加单元测试验证 schema 校验与增量/覆盖策略。 (AC: 2,3,5) [Source: ui-architecture.md A.3][Source: ui-architecture.md §10][Source: front-end-spec.md §3.2]
- [ ] 运行 `npm run lint`、`npm run build`、`npm run test` 验证流程无回归，并将日志纳入 Dev Agent Record。 (AC: 5) [Source: prd.md 集成验证]

## Dev Notes
- **Previous Story Insights**：Story 1.5/1.6 已将 TBOM 树、详情与 Compare 流程整合到 `components/tbom`，并依赖 `services/tbom`、`localStorage.tbomComparePayload` 与筛选状态缓存；导入需刷新这些状态以避免展示与 Compare 载荷不一致。 [Source: stories/STORY-1.5-tbom-structure-navigation.md][Source: stories/STORY-1.6-run-detail-experience.md]
- **Data Models**：最小数据包包含 `tbom_project.json`、`tbom_test.json`、`tbom_run.json`、`process_event*.csv`、`attachments.csv`（可选 `result_timeseries*.csv`、`test_card.csv`），字段与引用规则详见契约 §1–§5；导入需保持 ID、自关联字段、时间/单位口径一致。 [Source: tbom-contract.md §1·§2·§3·§5]
- **API Specifications**：Mock 层通过 Next Route Handlers 提供 `/api/mock/tbom/*`，应新增导入端点并复用 `services/http.ts` + Zod 校验，错误返回 `{ code, message }` 并区分结构缺失/字段错误。 [Source: architecture/adr-0004-mock-api-route-handlers.md][Source: architecture/adr-0002-http-client-zod.md][Source: tbom-contract.md §5]
- **Component Specifications**：导入向导入口位于 XBOM `Test` Tab 工具区，按照 UX 规范提供 5 步流程、映射确认与结果摘要，并在成功后自动高亮新增/更新节点。 [Source: front-end-spec.md §3.2][Source: ui-architecture.md A.3]
- **File Locations**：新组件放置于 `components/tbom/import/`，状态钩子位于 `components/tbom/hooks/`，服务扩展于 `services/tbom*.ts`；测试落在 `components/tbom/__tests__/`。 [Source: ui-architecture.md §3 Project Structure]
- **State & Integration**：导入合并后需更新 `useTbomFilters` 状态、URL 参数与 `localStorage.tbom.filters`，并广播 Compare payload 更新事件，保持与现有深链和 Compare 体验一致。 [Source: ui-architecture.md §4 State Management][Source: stories/STORY-1.6-run-detail-experience.md]
- **Testing Requirements**：按照附录 A 主线 2，需覆盖合法导入、列头错误、缺失文件、键盘交互与日志重试路径；Playwright 场景要验证树节点高亮与 Compare 跳转可用。 [Source: ui-architecture.md A.3][Source: front-end-spec.md §3.2]
- **Technical Constraints**：保持 Tailwind v3 工具链、动态导入重型库、防止阻塞主线程；解析/导出逻辑如需 Worker 必须懒加载；所有文件交互不得请求危险浏览器权限。 [Source: architecture/adr-0003-heavy-lib-dynamic-import.md][Source: ui-architecture.md §10][Source: prd.md §8 Story 1.7]
- **Documentation & Samples**：更新契约版本与示例包，并在 `docs/changelog.md` 记录导入规范调整；如新增样例 ZIP，需与 `docs/mocks/tbom` 同步维护。 [Source: tbom-contract.md][Source: docs/changelog.md][Source: docs/mocks/tbom]

### Project Structure Notes
- 计划在 `components/tbom/import/` 引入导入向导并复用 `components/tbom/hooks` 管理状态，与既有 `structure/`、`detail/` 模块协同，未发现结构冲突。 [Source: ui-architecture.md §3 Project Structure]

## Testing
- RTL：覆盖导入流程的成功、列头错误、缺失文件、键盘焦点与 `aria-live` 提示路径。 [Source: ui-architecture.md A.3][Source: front-end-spec.md §3.2]
- Playwright：模拟完整导入（含失败重试），验证树节点高亮、运行详情刷新与 Compare 入口可用。 [Source: ui-architecture.md A.3][Source: front-end-spec.md §3.2]
- 服务层：针对 schema 校验、增量/覆盖策略与错误码返回编写单元测试与 Mock API 集成测试。 [Source: architecture/adr-0002-http-client-zod.md][Source: tbom-contract.md §5]
- 构建校验：执行 `npm run lint`、`npm run build`、`npm run test`，确保无回归。 [Source: prd.md 集成验证]

## Change Log
| Date | Version | Description | Author |
| --- | --- | --- | --- |
| 2025-10-20 | v0.1 | 初稿：Story 1.7 最小上载导入向导需求与实施清单 | Scrum Master |

## Dev Agent Record
### Agent Model Used
- Pending assignment

### Debug Log References
- Pending

### Completion Notes List
- Pending

### File List
- Pending

## QA Results

### Review Date: —
### Reviewed By: —

### Code Quality Assessment
- Pending QA review。

### Requirements Traceability
- Pending。

### Test Coverage & Evidence
- Pending。

### Non-Functional Review
- Pending。

### Risks & Mitigations
- Pending。

### Decision
- Gate Recommendation: Pending。
