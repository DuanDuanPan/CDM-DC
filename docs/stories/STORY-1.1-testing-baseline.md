# Story 1.1: Testing Baseline

## Status
Done

## Story
**As a** 前端平台工程师  
**I want** 建立 React Testing Library 与 Playwright 的最小可运行测试基座并提供示例  
**so that** 团队能够持续验证 TBOM 主路径并为后续故事扩展自动化测试

## Acceptance Criteria
1. 建立最小测试基座，完成 RTL 与 Playwright 依赖安装、脚本配置，并确认 `npm run test` 与 `npm run test:e2e` 在本地 headless 运行成功且不会破坏 `npm run build` 流程；失败时需输出可读错误与排查步骤。 [Source: prd.md §8 Story 1.1]
2. 提供两个示例用例：
   - RTL：针对 `NodeTestBadge`（或现有等价组件）验证键盘聚焦、可见焦点环与 `aria-live` 提示断言；
   - Playwright：访问 `/?from=ebom&node=EBN-ASSY-0001-003` 时，页面展示“按结构节点过滤”入口或占位元素；
   两个示例需具备 Mock 数据或占位 UI，默认运行通过。 [Source: prd.md §8 Story 1.1][Source: ui-architecture.md §8]
3. 在 README 或 `docs/ui-architecture.md` 附录新增“如何运行测试”与常见故障排查，覆盖 Playwright/RTL 依赖安装提示、环境变量准备及 CI 预留说明。 [Source: prd.md §8 Story 1.1][Source: ui-architecture.md 附录 A]

## Tasks / Subtasks
- [x] 安装并配置测试依赖，新增 `@testing-library/react`、`@testing-library/user-event`、`@testing-library/jest-dom`、`@playwright/test`，并在 `package.json` 添加 `test` 与 `test:e2e` 脚本（AC: 1）。 [Source: prd.md §8 Story 1.1]
  - [x] 创建 `jest.setup.ts`（或更新现有设置），在其中导入 `@testing-library/jest-dom`，并在 `next.config.ts`/`jest.config.ts` 配置 `setupFilesAfterEnv`（AC: 1）。 [Source: ui-architecture.md §8]
  - [x] 初始化 `playwright.config.ts`，设置 `testDir: 'e2e'` 与 `use: { headless: true }`，确保默认执行 headless（AC: 1）。 [Source: ui-architecture.md §8]
- [x] 创建组件测试示例，在 `components/tbom/__tests__/NodeTestBadge.test.tsx`（或现有目录）编写键盘聚焦与 `aria-live` 断言示例，并使用 Mock 挂载组件（AC: 2）。 [Source: ui-architecture.md §8][Source: tbom-ui-spec.md §4]
  - [x] 若 `NodeTestBadge` 尚未存在，提供最小可测试组件放置于 `components/tbom/structure/NodeTestBadge.tsx`（临时 Mock，保持后续可替换），并同步更新使用该组件的模块引用（AC: 2）。 [Source: tbom-ui-spec.md §4]
- [x] 创建 Playwright 用例 `e2e/tbom.deep-link.spec.ts`，覆盖深链场景，并使用 Mock 或占位页面确保“按结构节点过滤”元素可见（AC: 2）。 [Source: front-end-spec.md §3.1][Source: ui-architecture.md §8]
- [x] 在 README 或 `docs/ui-architecture.md`“附录 A”新增运行指南、依赖安装与 CI 预留说明，并注明 `NEXT_PUBLIC_MOCK_MODE`、`NEXT_PUBLIC_API_BASE` 的取值要求（AC: 3）。 [Source: ui-architecture.md §9][Source: ui-architecture.md 附录 A]
- [x] 更新文档或任务结果，说明测试目录放置标准、命名约定以及与 `components/tbom` 新目录对齐情况（AC: 3）。 [Source: ui-architecture.md 目录结构]
- [x] 验证 `npm run build` 及现有 lint 保持通过，并输出测试运行截图或日志链接作为 Dev Agent Record 输入（AC: 1, 2）。 [Source: prd.md 集成验证]

## Dev Notes
- **Previous Story Insights**：当前 Epic 尚无完成故事提供参考记录。
- **Component Specifications**：`NodeTestBadge` 需展示试验计数、支持键盘与鼠标交互、提供 Tooltip/aria-label，并在空态/错误态表现一致；建议放置于 `components/tbom/structure/` 并支持 `aria-label="查看挂接试验，计数 X"`。 [Source: tbom-ui-spec.md §4-5]
- **File Locations**：TBOM 相关组件与测试放入 `components/tbom/`（含 `structure/`, `detail/`, `import/`, `hooks/`, `services/`, `types.ts`, `__tests__/`），保持与 App Router `app/` 页面解耦。 [Source: ui-architecture.md 目录结构]
- **Testing Requirements**：RTL 覆盖键盘可达、aria-live 与动态导入回退；Playwright 覆盖 XBOM→TBOM 深链、导入向导与 Compare 主线，默认 headless 运行。 [Source: ui-architecture.md §8]
- **Environment Variables**：测试环境需准备 `NEXT_PUBLIC_MOCK_MODE=true`、`NEXT_PUBLIC_API_BASE=/api/mock`、`NEXT_PUBLIC_3D_ASSETS_BASE=/3dviewer`，确保本地与 Mock 数据一致。 [Source: ui-architecture.md §9]
- **Technical Constraints**：前端默认 Server Component，重库只可在叶子组件动态 import，HTTP 访问统一通过 `services/http.ts` 并以 Zod 校验响应；所有交互需保留可见焦点与 aria-live 通知。 [Source: ui-architecture.md §10]
- **Project Structure Notes**：新增测试与组件应遵循 Tailwind 类顺序与共享组件复用规范；若需引入额外 Mock 数据，应放置在 `docs/mocks/tbom/` 并记录来源。 [Source: ui-architecture.md §3][Source: ui-architecture.md 附录 A]
- **Data Models**：本故事仅使用 Mock 数据，不涉及新增数据模型；若后续涉及需参照 `docs/tbom-contract.md`。 [Source: tbom-ui-spec.md §7]
- **API Specifications**：暂不接入真实 BFF，维持 Mock 路由 `/api/mock/tbom`；API 细节参考后续 Story 1.3。 [Source: tbom-ui-spec.md §7]
- **Testing Strategy Alignment**：参照 `docs/ui-architecture.md` 示例，在 Jest 中引入 `userEvent.tab()` 验证焦点，在 Playwright 中检查 `page.getByText('按结构节点过滤')` 可见。 [Source: ui-architecture.md §8]

### Testing
- **测试目录约定**：组件/Hook 用例放置在 `components/tbom/__tests__/`，Playwright 用例放在仓库根 `e2e/`，与 `testDir` 保持一致。 [Source: ui-architecture.md 目录结构][Source: ui-architecture.md §8]
- **RTL 断言**：示例需验证键盘 Tab 聚焦、`toHaveAccessibleName` 以及 aria-live 通知可捕获，默认使用 `@testing-library/user-event`。 [Source: ui-architecture.md §8]
- **Playwright 场景**：深链访问 `/?from=ebom&node=EBN-ASSY-0001-003` 后断言“按结构节点过滤”可见，后续故事将扩展导入向导与 Compare。 [Source: front-end-spec.md §3.1][Source: ui-architecture.md §8]
- **CI 预留**：架构文档未提供 Playwright 安装的 CI 指南，需在文档中明确告知缺失或待补充。 

## Change Log
| Date | Version | Description | Author |
| --- | --- | --- | --- |
| 2025-10-15 | v1.0 | 初始草稿，依据模板补齐章节与任务 | Scrum Master |
| 2025-10-15 | v1.1 | 状态更新为 Ready for Dev | Product Owner |
| 2025-10-15 | v1.2 | 完成测试基座与示例，提交 Ready for Review | Dev Agent |
| 2025-10-15 | v1.3 | 状态更新为 Done | Product Owner |

## Dev Agent Record
### Agent Model Used
GPT-5 Codex (开发者通道)

### Debug Log References
- `npm run lint`（通过）
- `npm run test`（通过）
- `NEXT_PUBLIC_MOCK_MODE=true NEXT_PUBLIC_API_BASE=/api/mock NEXT_PUBLIC_3D_ASSETS_BASE=/3dviewer npm run test:e2e`（通过）
- `npm run build`（通过）

### Completion Notes List
- 新增 Jest/RTL 与 Playwright 依赖、脚本与配置，完成 `jest.setup.ts`、`jest.config.ts`、`playwright.config.ts`。
- 落地 `NodeTestBadge` 组件、RTL 示例测试与 `/app` 深链入口占位，确保键盘可达与 aria-live 提示。
- 编写 `e2e/tbom.deep-link.spec.ts` 以验证 `/?from=ebom&node=...` 场景下“按结构节点过滤”入口可见。
- 更新 README 记录测试运行、目录约定与必备环境变量；补充 pdfjs/vtk 类型声明与模拟数据、VTK 组件的类型修正，确保 `npm run build` 可通过。
- 2025-10-15：复核 `npm run lint`、`npm run test`、`npm run test:e2e`、`npm run build` 全部通过，状态确认 Ready for Review。

### File List
- package.json
- package-lock.json
- jest.config.ts
- jest.setup.ts
- playwright.config.ts
- app/page.tsx
- components/tbom/structure/NodeTestBadge.tsx
- components/tbom/__tests__/NodeTestBadge.test.tsx
- components/compare/EbomMiniTreeDiff.tsx
- components/structure/ebom/types.ts
- components/structure/simulation/SimulationDimensionManager.tsx
- components/structure/simulation/data.ts
- components/structure/simulation/VtkMeshViewer.tsx
- components/structure/simulation/useSimulationExplorerState.ts
- e2e/tbom.deep-link.spec.ts
- README.md
- types/pdfjs-dist.d.ts
- types/vtkjs.d.ts
- docs/stories/STORY-1.1-testing-baseline.md

## QA Results

### Review Date: 2025-10-15
### Reviewed By: Quinn (Test Architect)

### Code Quality Assessment
- `NodeTestBadge` 将可访问性要点（焦点环、aria-live）封装为轻量组件，结构清晰且便于后续替换真实数据源。
- `jest.config.ts`、`playwright.config.ts` 配置最小化且遵循 Next.js 官方建议，未发现多余覆写；新增类型声明文件解决 `pdfjs`、`vtk` 缺口，构建验证已通过。
- `app/page.tsx` 的深链占位逻辑使用纯展示状态，不涉及外部依赖，符合当前 Mock 预期。

### Requirements Traceability
- AC1（测试基座可运行）：审阅 `package.json` 新增脚本与依赖、`jest.setup.ts`、`playwright.config.ts`，本地执行 `npm run test`、`npm run test:e2e`、`npm run build` 均成功。
- AC2（示例用例）：`components/tbom/__tests__/NodeTestBadge.test.tsx` 覆盖键盘聚焦与 aria-live；`e2e/tbom.deep-link.spec.ts` 验证深链入口展示与 NodeTestBadge 集成。
- AC3（文档）：`README.md` 补充测试运行指引、依赖安装与故障排查，定位明确。

### Test Coverage & Evidence
- 单元测试：`npm run test` → 1 套件 / 2 用例全部通过。
- 端到端测试：`NEXT_PUBLIC_MOCK_MODE=true NEXT_PUBLIC_API_BASE=/api/mock NEXT_PUBLIC_3D_ASSETS_BASE=/3dviewer npm run test:e2e` → 1 场景通过。
- 构建验证：`npm run build` 产物成功，未触发 lint/type 错误。

### Non-Functional Review
- 安全：PASS（纯前端 Mock，未暴露敏感接口）。
- 性能：PASS（新增资产体积极小，`NodeTestBadge` 常量渲染）。
- 可靠性：PASS（Playwright 配置含 webServer 复用，保证测试稳定性，aria-live 逻辑无需外部依赖）。
- 可维护性：PASS（README 记录运行方式，测试文件贴近被测模块，Mock 组件职责明确）。

### Risks & Mitigations
- 低风险：`NodeTestBadge` 目前以常量 `count=3` 演示，后续接入真实数据需同步更新测试断言；文档已提示 Mock 环境变量，建议保持。

### Decision
- Gate Recommendation: **PASS**（满足全部验收标准，未发现阻塞性缺陷）。

### Follow-Up Items
- 建议在 Story 1.3 或后续接入真实试验数据时，将 `NodeTestBadge` 的 `count` 改为由服务返回的值，并扩展 Playwright 场景验证不同计数状态。
