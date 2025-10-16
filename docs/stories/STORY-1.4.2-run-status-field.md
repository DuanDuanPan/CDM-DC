# Story 1.4.2: TBOM 运行状态字段（status）与筛选支撑（契约+Mock+Schema）

## Status
Done

## Story
**As a** 前端平台工程师  
**I want** 在 TBOM 契约与样例中引入 `run.status` 字段并同步类型/schema  
**so that** 结构导航页（Story 1.5）可以基于真实来源实现“运行状态筛选”，避免开发阶段自行杜撰字段

## Acceptance Criteria
1. 契约更新：在 `docs/tbom-contract.md` 的 `TestRun` 字段表新增 `status`（必填，枚举），并说明取值与语义：
   - 取值：`planned`（计划中）｜`executing`（执行中）｜`completed`（已完成）｜`aborted`（中止/失败）。
   - 语义：用于前端筛选与状态标注；历史补录允许为 `completed`；默认值无（必填）。
   - 在“版本信息/变更记录”处标注新增字段与日期. [Source: prd.md §8 Story 1.5]
2. Mock 数据：在 `docs/mocks/tbom/tbom_run.json` 为每条记录补充 `status` 字段；至少包含 2 个不同取值（例如 `R-EX-001: completed`、`R-EX-002: executing`）。确保与其他引用键（`run_id`/`test_id`/`attachments`）自洽。 [Source: docs/mocks/tbom]
3. 类型与 Schema：在 `components/tbom/types.ts` 的 `TbomRunSchema` 新增 `status`：`z.enum(['planned','executing','completed','aborted'])` 并导出对应 `type`；必要时在 `services/tbom.ts` 复用该 schema。 [Source: ui-architecture.md 目录结构]
4. 服务输出与筛选准备：`services/tbom.ts` 保证 `listRuns()` 返回对象含 `status` 字段；为 Story 1.5 的筛选提供示例 selector（例如 `filterRunsByStatus(runs, ['completed','executing'])`）或在 Dev Notes 给出参考实现。 [Source: prd.md §8 Story 1.5]
5. 文档与记录：在 `docs/ui-architecture.md` 的 TBOM 章节补充一句“运行状态由 `run.status` 提供（契约见 tbom-contract.md）”；在 `docs/changelog.md` 增加“新增 run.status 字段”的条目。 [Source: ui-architecture.md]
6. 验证：
   - `curl http://localhost:3000/api/mock/tbom/runs`（或等效调用）返回对象包含 `status`；
   - `npm run build`、`npm run lint` 通过；
   - 选做：为状态筛选添加最小单元测试或脚本输出示例。 [Source: prd.md 集成验证]

## Tasks / Subtasks
- [x] 更新 `docs/tbom-contract.md`：在 TestRun 字段表与示例 JSON 中加入 `status`，并在“版本信息/变更记录”记录新增字段。 (AC: 1)
- [x] 扩充 `docs/mocks/tbom/tbom_run.json`：为现有运行补充 `status`，并新增一个不同状态的运行样例。 (AC: 2)
- [x] 更新 `components/tbom/types.ts`：在 `TbomRunSchema` 增加 `status` 枚举并导出类型；检查依赖处是否需要最小改动。 (AC: 3)
- [x] 校对 `services/tbom.ts`：确保运行相关 API/聚合函数保留 `status` 字段，并新增 `filterRunsByStatus`。 (AC: 4)
- [x] 文档更新：补充 `docs/ui-architecture.md` 简述与 `docs/changelog.md` 记录。 (AC: 5)
- [x] 验证：运行本地接口/脚本，附运行输出到 Dev Agent Record。 (AC: 6)

## Dev Notes
- **状态取值建议**：`planned`｜`executing`｜`completed`｜`aborted`。后续可扩展为 `queued`、`paused` 等，但本迭代仅保留上述 4 种以简化前端逻辑。筛选器支持多选。 
- **契约一致性**：若历史 Mock 仅有 `R-EX-001`，建议新增 `R-EX-002` 以覆盖第二种状态；保持与 `process_event.csv`/`attachments.csv` 的 `run_id` 关联一致。 
- **兼容策略**：前端消费旧数据时若缺失 `status`，可在 selector 层统一映射为 `completed`（仅临时过渡）；但合入主干前必须补齐契约与 Mock。 
- **无副作用服务**：保持 `services/tbom.ts` 的函数纯粹与可在 Server/Client 两端调用，避免引入顶层重库。 

### Testing
- `curl /api/mock/tbom/runs` 响应对象包含 `status`；
- 运行最小脚本或单元测试验证 `filterRunsByStatus` 行为；
- `npm run build`、`npm run lint` 通过。 

## Change Log
| Date | Version | Description | Author |
| --- | --- | --- | --- |
| 2025-10-16 | v1.0 | 初稿：新增 run.status 字段并同步 Mock/Schema 的实现性要求 | Scrum Master |
| 2025-10-16 | v1.1 | 状态更新为 Done | Product Owner |

## Dev Agent Record
### Agent Model Used
GPT-5 Codex (开发者通道)

### Debug Log References
- `npm run lint`
- `npm run test`
- `npm run build`
- `npm run dev -- --port 4300`（后台）+ `npm run verify:tbom -- http://localhost:4300/api/mock`
- `curl http://localhost:4300/api/mock/tbom/runs`

### Completion Notes List
- `docs/tbom-contract.md` 升级至 v0.3，新增 `run.status` 字段及取值说明。
- `docs/mocks/tbom/tbom_run.json` 补充状态并新增 `R-EX-003` 示例；映射 CSV 与附件保持自洽。
- `components/tbom/types.ts` 与 `services/tbom.ts` 同步增加 `status` 枚举并提供 `filterRunsByStatus`。
- 文档（UI Architecture / Changelog）与 Story 记录已更新；校验脚本输出覆盖状态字段。

### File List
- docs/tbom-contract.md
- docs/mocks/tbom/tbom_run.json
- docs/mocks/tbom/result_timeseries_R-EX-001.csv
- docs/mocks/tbom/result_timeseries_R-EX-002.csv
- docs/mocks/tbom/process_event_R-EX-001.csv
- docs/mocks/tbom/process_event_R-EX-002.csv
- components/tbom/types.ts
- services/tbom.ts
- docs/ui-architecture.md
- docs/changelog.md
- docs/stories/STORY-1.4.2-run-status-field.md

## QA Results

### Review Date: 2025-10-16
### Reviewed By: Quinn (Test Architect)

### Code Quality Assessment
- 契约 `docs/tbom-contract.md` 升级至 v0.3，Run 字段表与示例 JSON 均新增 `status`，枚举含 `planned/executing/completed/aborted` 并在变更历史注明。
- Mock 数据 `docs/mocks/tbom/tbom_run.json` 为每条运行填充 `status`，覆盖 `completed`、`executing`、`planned` 至少三种取值；对应 CSV/附件仍与 `run_id` 自洽。
- `components/tbom/types.ts` 与 `services/tbom.ts` 同步增加 `status` 枚举，`filterRunsByStatus` 支持多选筛选，为后续结构导航提供基础。
- 文档与记录：`docs/ui-architecture.md` TBOM 章节新增状态说明，`docs/changelog.md` 记录 v0.2.5.1 变更。

### Requirements Traceability
- AC1：契约字段表更新并记录语义。
- AC2：Mock 运行数据含状态且键关系正确。
- AC3：类型/schema 导出 `status` 枚举，服务层复用。
- AC4：`filterRunsByStatus` 输出示例符合预期。
- AC5：UI 架构文档与 changelog 均更新。
- AC6：`curl http://localhost:4500/api/mock/tbom/runs`、`npm run lint`、`npm run build` 均通过。

### Test Coverage & Evidence
- `npm run lint`
- `npm run test`
- `npm run build`
- `curl http://localhost:4500/api/mock/tbom/runs`
- `npm run verify:tbom -- http://localhost:4500/api/mock`

### Non-Functional Review
- 安全：PASS（Mock 数据更新，不涉及外部接口）。
- 性能：PASS（新增字段仅为枚举开销，可忽略）。
- 可靠性：PASS（服务/selector 与验证脚本均覆盖新字段）。
- 可维护性：PASS（契约、schema、文档保持同步，未来扩展明确）。

### Risks & Mitigations
- 如需后续扩展更多状态，可提前在契约历史中记录并约定前端默认处理；当前已在文档提示映射策略。

### Decision
- Gate Recommendation: **PASS**。

### Follow-Up Items
- 建议在结构导航实现时复用 `filterRunsByStatus`，并补充最小单元测试验证多状态组合筛选逻辑。
