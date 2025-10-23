# Story 1.9: Compare 试验维度对比

## Status
Approved

## Story
**As a** 仿真与试验对比分析工程师  
**I want** 在 Compare 中直接加载试验运行与仿真结果进行 ACC/PSD/FRF/COH 对比  
**so that** 我能够快速发现差异、校验单位和采样率并导出对比结果支撑评审

## Acceptance Criteria
1. Compare 模块新增“试验”数据源，可从 TBOM payload 或在 Compare 中选择 1..N 个 `TestRun` 叠加显示。 [Source: prd.md §8 Story 1.9][Source: front-end-spec.md §3.3]
2. 通道选择器提供 `ACC_*`、`PSD_*`、`FRF_*`、`COH_*` 快速筛选与定位，支持多选与显式标注当前通道集合。 [Source: prd.md §8 Story 1.9][Source: docs/tbom-contract.md §3.4·§4.1]
3. 单位与采样率自动对齐：Compare 读取 TBOM/仿真通道元数据并依据契约给出转换/重采样提示，可一键统一或选择跳过，并记录处理结果。 [Source: prd.md §8 Story 1.9][Source: architecture/adr-0005-compare-alignment-policy.md][Source: docs/tbom-contract.md §4.1·§8]
4. 图表交互支持缩放、区间选择、光标对齐与游标读数，并对 10 万点/通道（≤4 通道）保持 P95 交互延迟 <120 ms（抽稀/分块加载提醒可见）。 [Source: prd.md §8 Story 1.9][Source: docs/ui-architecture.md §8 Testing Requirements][Source: docs/changelog.md · Compare 对接条目]
5. Compare 导出新增“当前视图 CSV”与“图像 PNG”能力，导出内容匹配筛选后的通道与对齐策略，并在 Dev Agent Record 中记录。 [Source: prd.md §8 Story 1.9][Source: front-end-spec.md §3.3]

## Tasks / Subtasks
- [ ] 扩展 Compare 数据源以加载 TBOM 运行：在 `components/compare/CompareCenter.tsx` 引入 `test`/`test-sim` 模式，解析 `tbomComparePayload` 并允许手动追加运行；显示来源、时间戳与颜色标签。 (AC: 1) [Source: prd.md §8 Story 1.9][Source: front-end-spec.md §3.3][Source: stories/STORY-1.6-run-detail-experience.md]
  - [ ] 若 `tbomComparePayload` 缺失，提供“从试验视图加载”入口并回退到操作指引；保留清除与刷新机制。 (AC: 1) [Source: ui-architecture.md §6 Routing][Source: docs/changelog.md · Compare 对接]
- [ ] 构建通道选择器与快速筛选：在 Compare 曲线面板新增 `channel` 过滤 UI，提供 `ACC_*`/`PSD_*`/`FRF_*`/`COH_*` tag 以及文本搜索；同步更新曲线 legend 与导出集合。 (AC: 2) [Source: prd.md §8 Story 1.9][Source: docs/tbom-contract.md §3.4][Source: front-end-spec.md §3.3]
- [ ] 实现单位/采样率对齐逻辑：根据 TBOM 与仿真曲线 metadata（单位、采样率）执行校验；当不一致时提示转换策略（转换至 SI 或维持原值），并在执行后标记状态。 (AC: 3, IV1) [Source: architecture/adr-0005-compare-alignment-policy.md][Source: docs/tbom-contract.md §4.1·§8]
  - [ ] 引入对齐结果记录（如 warning chips + 日志面板），并支持撤销/重新对齐。 (AC: 3) [Source: prd.md §8 Story 1.9]
- [ ] 连接仿真数据对比：在 `components/structure/simulation/SimulationCompareDrawer.tsx` / `SimulationPreviewContent.tsx` 或新桥接模块中暴露仿真结果选择接口，使 Compare 可拉取 `simulation_result_id` 并与试验运行组合。 (AC: 1, IV2) [Source: prd.md §8 Story 1.9][Source: docs/sprint11-simulation-jump-plan.md][Source: docs/sprint12-compare-and-preview.md]
  - [ ] 当仿真结果缺失时提供占位与补充说明，不阻塞试验曲线渲染。 (AC: 1, IV2) [Source: front-end-spec.md §3.3]
- [ ] 升级曲线渲染层：为试验/仿真曲线抽稀、分块加载与性能标记提供 Hook/Worker，确保 4 通道×10 万点交互性能满足要求。 (AC: 4, IV3) [Source: prd.md §8 Story 1.9][Source: docs/ui-architecture.md §8][Source: architecture/adr-0003-heavy-lib-dynamic-import.md]
  - [ ] 提供缩放、区间选择、光标对齐和游标读数 UI，键盘可达并带 aria-live 提示。 (AC: 4) [Source: front-end-spec.md §3.3]
- [ ] 导出功能扩展：复用/增强 `exportDomToPng` 并新增 CSV 生成逻辑（含单位/采样率/对齐备注），导出前校验通道集合与对齐状态。 (AC: 5) [Source: prd.md §8 Story 1.9][Source: front-end-spec.md §3.3]
- [ ] 更新文档与日志：在 `docs/ui-architecture.md` 或 `docs/front-end-spec.md` 记录 Compare 试验模式流程，在 `docs/changelog.md` 标记版本；若引入新对齐策略，补充 `docs/tbom-contract.md` 对应说明。 (AC: 3-5) [Source: prd.md §8 Story 1.9][Source: docs/changelog.md][Source: docs/ui-architecture.md §8]
- [ ] 测试与验证：完成单元、组件与 Playwright 场景（详见 Testing），并执行 `npm run lint`、`npm run build`、数据对齐脚本或专用脚本验证 10 万点性能与单位校验。 (AC: 1-5, IV1-3) [Source: ui-architecture.md §8][Source: prd.md 集成验证]

## Dev Notes
- **Previous Story Insights**：Story 1.6 已在 `TbomRunDetail` 写入 `tbomComparePayload` 并广播事件，需要复用并扩展 payload 结构（添加统计、对齐提示）；Story 1.7 的导入刷新 TBOM 数据后应确保 Compare 重载最新运行；Story 1.8 将 chips 导航与返回守卫串联 Compare，需要保持事件名称与路由守卫一致。 [Source: stories/STORY-1.6-run-detail-experience.md][Source: stories/STORY-1.7-import-wizard.md][Source: stories/STORY-1.8-cross-domain-traceability.md]
- **Data Models**：时序 CSV 通道命名及单位定义见 `docs/tbom-contract.md` §3.4、§4.1、§8；仿真结果映射依赖 `relations[].ref_id (kind=simulation)` 与仿真 Explorer 映射表（`simulationJumpMap`）。 Compare 对齐需读取 `unit`、`sampleRate` 并按 ADR-0005 自动或提示转换。 [Source: docs/tbom-contract.md §3.4·§4.1·§8][Source: architecture/adr-0005-compare-alignment-policy.md][Source: docs/sprint11-simulation-jump-plan.md]
- **API / Services**：试验侧数据来自 `services/tbom.ts`（`getRunTimeseries`、`getRunEvents`）；仿真侧目前由 Mock Explorer（`components/structure/simulation` 模块）管理，需要新增共享 selector 或服务层封装。 所有请求继续经 `services/http.ts`（fetch+Zod），对齐错误需抛出结构化信息。 [Source: services/tbom.ts][Source: architecture/adr-0002-http-client-zod.md][Source: docs/sprint12-compare-and-preview.md]
- **Component Specifications**：Compare 入口在 `components/tbom/detail/TbomRunDetail.tsx`；Compare 主体 `components/compare/CompareCenter.tsx` 需新增“试验/仿真”模式 UI、通道筛选、图表组件（可置于 `components/compare/testSim/` 新目录）；仿真对接沿用 `components/structure/simulation/` 中的 selectors 与 Compare Drawer。 重库（图表、导出）需动态导入遵循 ADR-0003。 [Source: components/tbom/detail/TbomRunDetail.tsx][Source: components/compare/CompareCenter.tsx][Source: architecture/adr-0003-heavy-lib-dynamic-import.md]
- **File Locations**：在 `components/compare/` 下新增 `testSim/` 子目录存放曲线渲染、快速筛选、对齐提示组件；公共 hooks 可放 `components/compare/hooks/`；性能/抽稀工具可放 `utils/decimation.ts`。 若需扩展 TBOM payload 类型，更新 `components/tbom/types.ts` 与相关测试。 [Source: ui-architecture.md §3 Project Structure]
- **Testing Requirements**：依照 `docs/ui-architecture.md` §8 扩展 RTL + Playwright；性能验证需覆盖抽稀与 10 万点交互；导出结果验证 CSV/PNG 内容；通道筛选需包含键盘访问。 [Source: docs/ui-architecture.md §8][Source: prd.md §8 Story 1.9]
- **Technical Constraints**：保持 `tbomComparePayload` 与 broadcast 事件名称不变；构建必须满足 `npm run lint`、`npm run build`；高耗图表模块动态导入，避免增加默认 bundle。 [Source: architecture/adr-0003-heavy-lib-dynamic-import.md][Source: docs/ui-architecture.md §6]
- **Documentation Notes**：完成后更新 `docs/ui-architecture.md`（Compare 章节）与 `docs/changelog.md`；若对契约字段或对齐策略有新增，更新 `docs/tbom-contract.md` 相关段落。 [Source: docs/ui-architecture.md §8][Source: docs/changelog.md][Source: docs/tbom-contract.md §4.1]

### Testing
- **RTL**：覆盖 Compare 试验模式初始化、通道筛选、单位对齐提示、导出按钮状态与无仿真占位；验证键盘聚焦与 aria-live。 [Source: ui-architecture.md §8]
- **Playwright**：1) `/?from=tbom&compare=run` 深链进入 Compare 试验模式，验证通道筛选和仿真选择；2) 执行单位对齐、缩放/区间/光标操作并导出 PNG 与 CSV；3) 注入 10 万点 mock 数据验证抽稀与性能提示；4) 仿真缺失时占位与返回路径。 [Source: prd.md §8 Story 1.9][Source: ui-architecture.md §8]
- **Performance & Build**：运行 `npm run lint`、`npm run build`、新增脚本或测试验证 10 万点抽稀耗时；记录结果于 Dev Agent Record。 [Source: prd.md 集成验证][Source: docs/ui-architecture.md §8]

## Change Log
| Date | Version | Description | Author |
| --- | --- | --- | --- |
| 2025-10-23 | v0.1 | 初稿：Compare 试验维度对比 Story | Scrum Master |

## Dev Agent Record
### Agent Model Used
- Pending

### Debug Log References
- Pending

### Completion Notes List
- Pending

### File List
- Pending

## QA Results
_QA 阶段填写_
