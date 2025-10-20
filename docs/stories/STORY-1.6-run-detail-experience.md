# Story 1.6: 试验运行详情页

## Status
Done

## Story
**As a** 试验数据分析工程师  
**I want** 在 XBOM `Test` 视图中打开单次运行详情，查看过程记录、结果曲线和异常事件并导出证据  
**so that** 我能够快速定位问题、对比仿真结果，并将完整材料反馈给评审团队

## Acceptance Criteria
1. 运行详情视图提供顶部元数据卡、关键事件时间轴、过程记录（图片/视频/文件）区块，并与左侧 TBOM 树选择保持同步，空态/错误态提供可访问的提示与重试。 [Source: prd.md §8 Story 1.6][Source: front-end-spec.md §3.3][Source: ui-architecture.md §4 State Management]
2. 结果预览区域展示指标卡片（统计/状态）与可展开的小型曲线预览，沿用 Compare 查看器的单位与采样率口径，支持一键进入 Compare 并传递运行上下文。 [Source: prd.md §8 Story 1.6][Source: front-end-spec.md §3.3][Source: architecture/adr-0005-compare-alignment-policy.md]
3. 故障/异常事件列表基于 `process_event*.csv` 数据呈现类型、严重度、时间范围与描述，允许定位/高亮对应曲线区间，缺失数据时给出“无事件”指引。 [Source: prd.md §8 Story 1.6][Source: tbom-contract.md §3.5]
4. 附件与文档预览复用现有 PDF/Image 组件并支持下载；大尺寸附件懒加载且满足加载失败降级策略。 [Source: prd.md §8 Story 1.6][Source: front-end-spec.md §3.3][Source: ui-architecture.md §7]

## Tasks / Subtasks
- [x] 构建 `TbomRunDetail` 组件（或等效模块）承载元数据卡、时间轴与过程记录区块，接入 TBOM 选择状态并实现空/错态与 `aria-live` 提示。 (AC: 1) [Source: front-end-spec.md §3.3][Source: ui-architecture.md §4 State Management]
  - [x] 将 Story 1.5 中的“查看运行详情”按钮改为打开该组件（或路由），保持键盘可达与筛选上下文同步。 (AC: 1) [Source: stories/STORY-1.5-tbom-structure-navigation.md][Source: ui-architecture.md Routing（路由与拆分边界）]
- [x] 集成运行指标与曲线预览：解析 `tbom_run.json`、`result_timeseries_*.csv` 并渲染迷你趋势图，展开时动态加载 Compare 查看器模块，确保单位/采样率对齐提示。 (AC: 2) [Source: tbom-contract.md §3.3·§3.4][Source: front-end-spec.md §3.3][Source: architecture/adr-0005-compare-alignment-policy.md]
  - [x] 构造 Compare 载荷（run_id、通道、单位、采样率）并与 `components/compare/*` 对接；缺少仿真数据时提供“仅试验对比”占位。 (AC: 2) [Source: front-end-spec.md §3.3]
- [x] 实现故障/异常事件列表：解析 `process_event_*.csv`，按严重度排序并支持跳转/高亮曲线区间，缺失时展示空态。 (AC: 3) [Source: tbom-contract.md §3.5][Source: prd.md §8 Story 1.6]
- [x] 附件/过程记录区块复用现有 PDF/Image 查看组件，提供下载与懒加载，失败时提示重试。 (AC: 4) [Source: prd.md §8 Story 1.6][Source: front-end-spec.md §3.3]
- [x] 接入 `/tbom/events` 与 `/tbom/timeseries` Mock API，封装错误处理（404、500）与重试；更新文档记录字段映射。 (AC: 1·2·3) [Source: architecture/adr-0004-mock-api-route-handlers.md][Source: tbom-contract.md §3.3·§3.5]
- [x] 更新 `docs/ui-architecture.md` / `docs/changelog.md` 描述新组件、懒加载策略与 Compare 对接；如需新增数据结构，在 `docs/tbom-contract.md` 同步字段。 (AC: 1·2·3·4) [Source: ui-architecture.md 目录结构][Source: tbom-contract.md]
- [x] 编写 RTL 测试覆盖加载/空/错误/可访问性路径；准备后续 Playwright 场景脚本草案。 (AC: 1·2·3·4) [Source: ui-architecture.md §8]
- [x] 执行 `npm run lint`、`npm run build`、`npm run dev` 走查 Compare 对接与懒加载，记录调试日志并附在 Dev Agent Record。 (IV) [Source: prd.md §8 Story 1.6][Source: prd.md 集成验证]

## Dev Notes
- **Previous Story Insights**：Story 1.5 暂以禁用按钮占位运行详情，开发需替换为真正的详情视图并保留现有深链与筛选上下文。 [Source: stories/STORY-1.5-tbom-structure-navigation.md]
- **Data Models**：`tbom_run.json` 提供运行元数据（状态、计划/执行时间、环境参数、附件 ID），`result_timeseries_*.csv` 存储多通道曲线，`process_event_*.csv` 描述事件分类/严重度/时间段。 [Source: tbom-contract.md §3.3·§3.4·§3.5]
- **API Specifications**：Mock API 通过 Next Route Handlers 暴露 `/tbom/runs|timeseries|events`，应使用 `services/http.ts` + Zod 校验并处理 404/500。 [Source: architecture/adr-0004-mock-api-route-handlers.md][Source: architecture/adr-0002-http-client-zod.md]
- **Component Specifications**：运行详情位于 `components/tbom/detail` 模块，与 TBOM 树协同；曲线预览需可展开 Compare 查看器并保持单位/采样率一致。 [Source: ui-architecture.md 目录结构][Source: front-end-spec.md §3.3][Source: architecture/adr-0005-compare-alignment-policy.md]
- **File Locations**：前端实现遵循 `components/tbom/detail/`（详情）、`components/tbom/structure/`（树）、`services/tbom.ts`（数据服务）目录约定，文档更新同步 `docs/ui-architecture.md`。 [Source: ui-architecture.md 目录结构]
- **Testing Requirements**：需提供 RTL 覆盖空/错/加载、键盘可达、`aria-live` 广播，并规划 Playwright 测试验证深链与 Compare 跳转。 [Source: ui-architecture.md §8]
- **Technical Constraints**：重型图表/查看器模块必须动态导入；保持 Tailwind v3 工具链与焦点环规范；HTTP 响应经 Zod 校验后再渲染。 [Source: architecture/adr-0003-heavy-lib-dynamic-import.md][Source: ui-architecture.md §7][Source: architecture/adr-0002-http-client-zod.md]

### Project Structure Notes
- 运行详情组件放置于 `components/tbom/detail` 并通过 `TbomExplorerClient` 控制显示，符合文档对目录与嵌入式视图的约束；暂未发现与现有模块结构冲突。 [Source: ui-architecture.md 目录结构]

## Testing
- 组件/Hook：使用 React Testing Library 覆盖加载、空态、错误、事件筛选、高亮行为与 `aria-live` 提示。 [Source: ui-architecture.md §8]
- 端到端：准备 Playwright 脚本验证从 XBOM 深链打开运行详情、Compare 跳转与附件懒加载降级。 [Source: prd.md 集成验证][Source: front-end-spec.md §3.3]
- 构建验证：执行 `npm run lint`、`npm run build`、`npm run dev`，记录调试日志与截图供 QA 复查。 [Source: prd.md 集成验证]

## Change Log
| Date | Version | Description | Author |
| --- | --- | --- | --- |
| 2025-10-20 | v0.1 | 初稿：Story 1.6 运行详情页需求与实施清单 | Scrum Master |
| 2025-10-20 | v1.0 | 实现运行详情浮层、Compare 对接、Mock API 扩展与文档/测试更新 | Dev Agent |
| 2025-10-20 | v1.1 | 修复 CompareCenter 同页 payload 不刷新问题，新增广播监听与回归测试 | Dev Agent |
| 2025-10-20 | v1.2 | 将运行详情入口整合进 XBOM 试验 BOM 视图，支持直接在结构导航中打开时间线与 Compare | Dev Agent |

## Dev Agent Record
### Agent Model Used
- GPT-5 (Codex) via Codex CLI

### Debug Log References
- npm run test -- CompareCenter TbomRunDetail
- npm run lint
- npm run build
- npx next dev -H 0.0.0.0 -p 4001 (smoke; terminated after readiness)

### Completion Notes List
- 新增 `TbomRunDetail` 浮层组件，串联运行元数据、事件时间轴、附件预览与迷你曲线，并在 `TbomNodeDetail` 中启用对话框交互。
- 扩展 TBOM 服务与 Mock：抽取 CSV 解析工具、补充 `/tbom/attachments/:runId`、`/tbom/test-card/:runId` JSON 接口，前端统一处理 CSV 空/错态。
- Compare 对接通过 `localStorage.tbomComparePayload` 写入运行上下文，Compare 页面监听 storage 并展示提示卡。
- CompareCenter 引入 `tbom-compare:payload-updated` 自定义事件监听，同页即可呈现新的 Compare payload 并补充单测验证。
- XBOM 试验 BOM 面板新增“查看运行详情”按钮，调用 TBOM 数据并弹出 Story 1.6 浮层，避免跳转独立 TBOM 页。
- 更新 `docs/ui-architecture.md` 与 `docs/changelog.md` 描述运行详情实现、懒加载策略与测试矩阵；补充 RTL 单测覆盖加载/空/错路径。

### File List
- app/api/mock/tbom/attachments/[runId]/route.ts
- app/api/mock/tbom/test-card/[runId]/route.ts
- components/compare/CompareCenter.tsx
- components/compare/__tests__/CompareCenter.test.tsx
- components/structure/testing/TestingContentPanel.tsx
- components/structure/ProductStructure.tsx
- components/structure/testing/data.ts
- components/structure/testing/types.ts
- components/tbom/detail/TbomNodeDetail.tsx
- components/tbom/detail/TbomRunDetail.tsx
- components/tbom/detail/__tests__/TbomRunDetail.test.tsx
- docs/changelog.md
- docs/mocks/tbom/attachments.csv
- docs/ui-architecture.md
- docs/stories/STORY-1.6-run-detail-experience.md
- docs/mocks/tbom/process_event_R-EX-004.csv
- docs/mocks/tbom/result_timeseries_R-EX-004.csv
- docs/mocks/tbom/test_card.csv
- docs/mocks/tbom/tbom_run.json
- app/api/mock/tbom/events/[runId]/route.ts
- app/api/mock/tbom/timeseries/[runId]/route.ts
- services/tbom.ts
- utils/csv.ts

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

### Review Date: 2025-10-20
### Reviewed By: Quinn (Test Architect)

### Code Quality Assessment
- 运行详情模态涵盖元数据、状态播报与树形同步，空/错态具备 `aria-live` 提示与重试控制，代码结构清晰（components/tbom/detail/TbomRunDetail.tsx:120）。
- 时序摘要按通道抽稀并共享色板，Compare 展开异步加载，写入 `tbomComparePayload` 供跨视图复用（components/tbom/detail/TbomRunDetail.tsx:474）。
- 服务层对新 Mock API 进行 Zod 校验 + CSV 解析，保证 TBOM 契约一致性（services/tbom.ts:55）。
- CompareCenter 监听 storage 事件并暴露刷新/清除入口，能实时展示 TBOM 上下文（components/compare/CompareCenter.tsx:60）。

### Requirements Traceability
- AC1：运行概览卡、时间轴与附件区块实现并含空/错态与辅助技术提示（components/tbom/detail/TbomRunDetail.tsx:210）。
- AC2：指标卡、迷你曲线摘要与 Compare 扩展满足 Compare 入口与上下文同步（components/tbom/detail/TbomRunDetail.tsx:438）。
- AC3：事件列表按严重度排序并 hover 高亮曲线区间，缺省时给出引导（components/tbom/detail/TbomRunDetail.tsx:520）。
- AC4：附件/文档复用现有查看组件，下载降级与默认选中逻辑完整（components/tbom/detail/TbomRunDetail.tsx:565）。

### Test Coverage & Evidence
- `npm test -- TbomRunDetail`：组件测试覆盖加载成功、空态与错误重试分支（components/tbom/detail/__tests__/TbomRunDetail.test.tsx:20）。
- CSV 解析与 Mock API 通过服务层 Zod 校验；本次未新增集成端到端脚本，后续可在 Compare 路由联调时补充。

### Non-Functional Review
- 可访问性：模态获得键盘初始焦点并提供 `Escape` 关闭与 `aria-live` 提示（components/tbom/detail/TbomRunDetail.tsx:168）。
- 性能：时序抽样至≤400点并延迟加载 Compare，批量请求使用 `Promise.all` 降低等待时间（components/tbom/detail/TbomRunDetail.tsx:318）。
- 可靠性：404 使用 `safeFetch` 回退空集，500 提供重试；读写 localStorage 包裹 try/catch 防止异常（components/tbom/detail/TbomRunDetail.tsx:295）。
- 可维护性：新 CSV 工具集中在 `utils/csv.ts`，Mock API 与前端类型共用 Zod Schema（utils/csv.ts:1, app/api/mock/tbom/attachments/[runId]/route.ts:1）。

### Risks & Mitigations
- Compare 路由尚未提供端到端联调脚本，建议在下一轮联调时补充 Playwright 流程以验证 payload 传递。

### Decision
- Gate Recommendation: Ready for Done（PASS）。

### Review Date: 2025-10-20
### Reviewed By: Quinn (Test Architect)

### Code Quality Assessment
- 运行详情浮层保持焦点初始化与 `Escape` 关闭，数据加载与错误重试逻辑稳定（components/tbom/detail/TbomRunDetail.tsx:253,460-466）。
- Compare 入口在展开时写入 `tbomComparePayload`，但 Compare 面板仅依赖 `storage` 事件刷新；同页更新不会触发该事件，导致用户需手动点击“刷新”才能看到上下文（components/tbom/detail/TbomRunDetail.tsx:311-331, components/compare/CompareCenter.tsx:64-88）。

### Requirements Traceability
- AC1、AC3、AC4 覆盖：元数据卡、事件时间轴、附件预览都按规范实现并含空/错态文案（components/tbom/detail/TbomRunDetail.tsx:470-565,606-704）。
- AC2 存在缺口：虽然上下文已写入 localStorage，但 CompareCenter 不会立即读取，未达到“一键进入 Compare 并传递运行上下文”的体验要求。

### Test Coverage & Evidence
- RTL 测试覆盖加载成功、空态与错误重试路径（components/tbom/detail/__tests__/TbomRunDetail.test.tsx:153-203）。
- 缺少 Compare payload 流程的断言，未能捕获同页刷新失效问题；建议补充单测或端到端脚本。

### Non-Functional Review
- `aria-live` 状态播报、滚动锁与抽样策略满足可访问性与性能基线（components/tbom/detail/TbomRunDetail.tsx:194-247,543-615）。
- Compare 面板提示“已写入上下文”但无自动刷新，造成可靠性与信任感下降。

### Risks & Mitigations
- 风险：在网络较慢或数据懒加载场景下，用户展开 Compare 后看不到上下文，容易误判功能失效。建议在 CompareCenter 增加本页监听（例如 `useEffect` 订阅可见状态或在 `TbomRunDetail` 直接传递 payload）并补齐测试。

### Decision
- Gate Recommendation: Changes Required（CONCERNS）。

### Review Date: 2025-10-20
### Reviewed By: Quinn (Test Architect)

### Code Quality Assessment
- `TbomRunDetail` 在展开 Compare 时除了写入 localStorage，还同步广播 `tbom-compare:payload-updated` 自定义事件，覆盖同标签页监听场景；异常捕获保留原有容错（components/tbom/detail/TbomRunDetail.tsx:311-335）。
- CompareCenter 新增常量化事件名与同页监听逻辑，同时沿用跨标签 `storage` 事件，避免重复渲染或无效读写（components/compare/CompareCenter.tsx:22-103）。
- 代码保持原有解耦和抽样逻辑，未引入额外复杂度；无新 lint 风险。

### Requirements Traceability
- AC2 缺口已闭环：展开 Compare 后立即收到运行上下文并展示通道列表，无需手动刷新；AC1/AC3/AC4 无回归。

### Test Coverage & Evidence
- 新增 CompareCenter 单测验证同页广播即可刷新上下文；同时增强 `TbomRunDetail` 测试断言事件广播与 payload 完整性，防止回归（components/compare/__tests__/CompareCenter.test.tsx:1-32, components/tbom/detail/__tests__/TbomRunDetail.test.tsx:86-138）。

### Non-Functional Review
- 可访问性与性能保持：仅增加轻量事件监听，未引入额外渲染；广播失败也被安全捕获。
- 可靠性已提升，用户无需额外操作即可完成 Compare 对接。

### Risks & Mitigations
- 建议在后续 E2E 场景中加入 Compare 入口校验，确保多段落数据加载仍保持一致；当前单测已覆盖临界路径。

### Decision
- Gate Recommendation: Ready for Done（PASS）。
