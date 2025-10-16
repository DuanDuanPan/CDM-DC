# Story 1.4: TBOM 领域模型与最小上载契约

## Status
Done

## Story
**As a** 前端平台工程师  
**I want** 整理 TBOM 的数据契约、Mock 样例与 TypeScript 类型  
**so that** 团队能够在后续 TBOM 视图开发中直接消费一致的结构化数据并保持契约可追溯

## Acceptance Criteria
1. `docs/tbom-contract.md` 升级为 v0.1 完整稿，覆盖层级/字段/示例、跨域追溯键、单位/采样率规则与校验要点，所有字段定义与示例同步更新且含版本日期。 [Source: prd.md §8 Story 1.4][Source: tbom-contract.md]
2. `docs/mocks/tbom/` 下的样例数据与契约一致：至少提供 2 个 `project`、对应 `test`、≥2 个 `run`，并保证 `run_id`、`test_id`、`project_id`、`ebom_node_id`、`attachments` 等互相引用正确；CSV（timeseries/process_event/test_card/attachments）字段齐全、包含示例值，缺失字段需标注占位。 [Source: prd.md §8 Story 1.4][Source: docs/mocks/tbom]
3. 新增 `components/tbom/types.ts`（或按目录结构更新同名文件），定义 TBOM 领域模型的 TypeScript 类型与 Zod schema（Project/Test/Run/TimeseriesMeta 等），并导出供 `services/tbom.ts` 与未来组件复用；类型需覆盖必填/可选字段、嵌套关系及跨域键。 [Source: prd.md §8 Story 1.4][Source: ui-architecture.md 目录结构][Source: tbom-contract.md]
4. 通过 `services/tbom.ts` 或临时脚本加载 Mock 数据并提供最小 selector：例如 `groupRunsByProject`、`listRunsByEbomNode`，验证契约可被正确解析；运行示例脚本需在 README 或 Dev Notes 记录调用方式，确认成功输出与错误路径（如缺失文件）均可复现。 [Source: prd.md §8 Story 1.4][Source: architecture/adr-0002-http-client-zod.md]

## Tasks / Subtasks
- [x] 更新 `docs/tbom-contract.md`：补齐字段表、通道字典、错误处理与版本信息；在文件顶部写明当前版本号与日期。 (AC: 1)
- [x] 校对并扩充 `docs/mocks/tbom/*.json` 与 CSV：
  - [x] 增加第二个 `project/test/run` 样例及相应 CSV 行；
  - [x] 确认所有引用键（`project_id`、`test_id`、`run_id`、`attachment`、`relations` 等）自洽；
  - [x] 若无法提供真实值，可使用占位但需注明 TODO。 (AC: 2)
- [x] 在 `components/tbom/types.ts` 定义并导出 `TbomProjectSchema`、`TbomTestSchema`、`TbomRunSchema` 等 Zod schema 及对应 TypeScript `type`，并补充集合类型（例如 `TbomTimeseriesPoint`）。 (AC: 3)
  - [x] 更新 `services/tbom.ts` 引用上述 schema（若 Story 1.3 已创建），避免重复定义。 (AC: 3)
- [x] 编写最小数据加载脚本（可置于 `scripts/verify-tbom-data.ts` 或 `docs/examples/`），调用服务封装拉取 Mock 数据并输出：
  - [x] `project` 列表；
  - [x] 指定 `ebom_node_id` 对应的 `run` 集合；
  - [x] 错误场景（例如请求不存在 `run_id`）返回结构化错误。 (AC: 4)
- [x] 在 README 或 `docs/ui-architecture.md` 的相关章节记录执行脚本步骤与数据来源；在 `docs/changelog.md` 追加条目说明契约与样例更新。 (AC: 1,2,4)

## Dev Notes
- **契约范围**：TBOM 层级包括 `TestType → TestProject → Test → TestRun`，核心字段详见 `docs/tbom-contract.md` §1–§6；需明确跨域追溯键（`requirement_id`、`ebom_node_id` 等）与单位规范。 [Source: tbom-contract.md]
- **Mock 数据来源**：样例位于 `docs/mocks/tbom/`，原始文件包含单个项目与运行；本故事需扩充并保持 CSV/JSON 字段同步，建议通过脚本校验键名一致性。 [Source: docs/mocks/tbom]
- **目录结构**：`components/tbom/` 预计包含 `structure/`, `detail/`, `import/`, `services/`, `hooks/`, `types.ts`，确保类型文件放在此目录并通过 barrel 或直接导出供组件/服务使用。 [Source: ui-architecture.md 目录结构]
- **服务封装**：Story 1.3 的 `services/http.ts` + `services/tbom.ts` 将复用本故事定义的 schema，保持 fetch 封装无副作用，支持 Server/Client 双端调用。 [Source: architecture/adr-0002-http-client-zod.md]
- **数据校验策略**：Zod schema 应区分必填与可选字段（如 `ebom_path?`）。时间字段需使用 ISO8601 字符串；数值字段按照契约指定单位（`g^2/Hz`、`m/s^2` 等）。 [Source: tbom-contract.md]
- **回滚与兼容**：若新增样例数据导致其他 Story 的 E2E 依赖变化，需在 `docs/changelog.md` 记录，并保留旧数据备份（可在 `docs/mocks/tbom/archive/` 创建副本）。 [Source: prd.md 回滚考虑]

### Testing
- **契约校验**：执行数据加载脚本，确认 Zod 校验通过；对异常 runId/assertion 触发时应输出 `{ error: 'RUN_NOT_FOUND' }` 或类似结构化错误。 [Source: architecture/adr-0002-http-client-zod.md]
- **引用完整性**：使用脚本断言 `project_id`/`test_id`/`run_id` 在 JSON 之间互相存在，并确保 CSV 与 JSON 共享 runId。 [Source: prd.md §8 Story 1.4]
- **CI 兼容**：`npm run lint`、`npm run build` 保持通过；必要时运行 `npm run test` 验证类型与服务脚本。 [Source: prd.md 集成验证]

## Change Log
| Date | Version | Description | Author |
| --- | --- | --- | --- |
| 2025-10-15 | v1.0 | 初稿：定义 TBOM 契约、样例与类型构建 Story | Scrum Master |
| 2025-10-16 | v1.1 | 状态更新为 Ready for Dev | Product Owner |
| 2025-10-16 | v1.2 | 契约升级、Mock 数据扩充、类型/schema 与验证脚本完成 | Dev Agent |

## Dev Agent Record
### Agent Model Used
GPT-5 Codex (开发者通道)

### Debug Log References
- `npm run lint`
- `npm run test`
- `npm run build`
- `npm run verify:tbom -- http://localhost:4100/api/mock`

### Completion Notes List
- `docs/tbom-contract.md` 升级为 v0.2，补齐层级字段表、跨域追溯键、单位与示例。
- 扩充 `docs/mocks/tbom/*`，新增第二个 Project/Test/Run 及对应 CSV（时序、事件、试验卡、附件）并同步路由映射。
- 新增 `components/tbom/types.ts` 提供 Zod schema/type，`services/tbom.ts` 改为复用并补充聚合函数。
- 编写 `scripts/verify-tbom-data.ts` 脚本与 `npm run verify:tbom` 命令，README/Changelog 记录执行方式与变更。

### File List
- docs/tbom-contract.md
- docs/mocks/tbom/tbom_project.json
- docs/mocks/tbom/tbom_test.json
- docs/mocks/tbom/tbom_run.json
- docs/mocks/tbom/result_timeseries_R-EX-001.csv
- docs/mocks/tbom/result_timeseries_R-EX-002.csv
- docs/mocks/tbom/process_event_R-EX-001.csv
- docs/mocks/tbom/process_event_R-EX-002.csv
- docs/mocks/tbom/test_card.csv
- docs/mocks/tbom/attachments.csv
- components/tbom/types.ts
- services/http.ts
- services/tbom.ts
- scripts/verify-tbom-data.ts
- README.md
- docs/changelog.md
- package.json
- package-lock.json

## QA Results

### Review Date: 2025-10-16
### Reviewed By: Quinn (Test Architect)

### Code Quality Assessment
- 契约文档 `docs/tbom-contract.md` 升级为 v0.2，字段表、跨域追溯键与示例齐备；`components/tbom/types.ts`、`services/tbom.ts` 共享 Zod schema 与 selector，消除了重复定义。
- `docs/mocks/tbom/` 的第二套 Project/Test/Run 样例与 CSV 已与 Route Handler 映射同步（参见 `timeseries`/`events` 路由常量），404 兜底保持一致。
- 验证脚本改用 `tsx` 运行，能够直接消费服务封装并输出统计、错误示例，READ ME 的执行指引已覆盖。

### Requirements Traceability
- AC1：`docs/tbom-contract.md` v0.2 覆盖字段/示例/校验要点并标注版本日期。
- AC2：Mock JSON/CSV 提供 2 个项目、2 个运行，互相关联字段（`project_id`、`test_id`、`run_id`、`attachments`、`ebom_node_id`）校验通过。
- AC3：`components/tbom/types.ts` 暴露 Project/Test/Run schema/type，`services/tbom.ts` 复用并提供 selector。
- AC4：`npm run verify:tbom -- http://localhost:4400/api/mock` 成功运行，输出项目/运行统计及 404 错误示例，验证契约可解析。

### Test Coverage & Evidence
- `npm run lint`
- `npm run test`
- `npm run build`
- `curl http://localhost:4400/api/mock/tbom/projects`
- `curl http://localhost:4400/api/mock/tbom/timeseries/R-EX-001`
- `curl http://localhost:4400/api/mock/tbom/timeseries/R-EX-999`
- `npm run verify:tbom -- http://localhost:4400/api/mock`

### Non-Functional Review
- 安全：PASS（Mock 数据仍为本地文件，未引入外部接口）。
- 性能：PASS（Zod/schema 与脚本执行开销极小）。
- 可靠性：PASS（验证脚本成功运行并覆盖成功/错误路径）。
- 可维护性：PASS（类型集中输出，脚本与文档指引完备）。

### Risks & Mitigations
- 后续新增 Mock 文件时需同步更新 `TIMESERIES_MAP`/`EVENT_MAP` 常量；建议在文档中保留扩展步骤（当前已注明），并可考虑按约定命名规则自动读取。

### Decision
- Gate Recommendation: **PASS**。

### Follow-Up Items
- 可在后续迭代中加入 CI 步骤运行 `npm run verify:tbom`，确保契约扩展时自动校验。
