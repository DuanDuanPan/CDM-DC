# 产品过程数据中心 · 试验BOM增强 PRD（Brownfield）

> 版本：评审基线 v0.2（冻结）｜日期：2025-10-15｜来源：IDE 分析 + `docs/brief.md`
> 分片目录：见 `docs/prd/000-index.md`

---

## 1. 现有项目分析与上下文（Intro Project Analysis and Context）

### 1.1 分析来源（Analysis Source）
- 方式：IDE 基于仓库文档的现场分析（未发现 `document-project` 自动化产物）
- 参考：`docs/brief.md`（2025-10-14）、仓库 `components/` 目录与现有脚本

### 1.2 当前项目状态（Current Project State）
- 项目形态：Next.js 15（App Router）前端原型，聚焦“产品过程数据中心（试验领域）”。
- 已有 XBOM 侧重点：需求 BOM、方案 BOM、设计 BOM、仿真 BOM 已完成设计/实现；对比中心、结构浏览、查看器等模块可用。
- 试验 BOM 现状：尚未开始实现，代码与界面均为空白，仅有规划意图。
- 数据与集成：当前以 Mock 数据为主，尚未对接后端域服务（ALM/PLM/试验数据源）。
- 可视化能力：PDF/图片查看、3D（online-3d-viewer / vtk.js / rhino3dm / occt-import-js / web-ifc）已接入原型层面的展示链路。
- 技术栈：React 19、TypeScript、TailwindCSS；recharts、pdfjs-dist 等。
- 关键假设：本次增强在现有前端原型上演进，短期仍以前端为主，不强依赖立即落地的后端真源。

---

## 2. 可用文档分析（Available Documentation Analysis）

> 若存在 `document-project` 产物应优先引用；本仓库未发现，以下以现有文档清单为准。

### 2.1 文档清单（Checklist）
- [部分] 技术栈说明：`docs/frontend-prototype-integration.md`
- [缺失] 源码结构/架构说明：未发现 `docs/architecture/*`
- [部分] 编码规范/样式：仓库有团队规范说明（见项目 AGENTS 指南），缺少专门技术文档条目
- [有] API 文档（局部）：`docs/openapi-ebom-bff.yaml`，`docs/cockpit-bff-api.md`
- [部分] 外部 API 文档：未见明确外部系统对接说明
- [有] UX/UI 规范（局部）：`docs/UI:UX 规格说明书.md`
- [部分] 技术债/约束：`docs/assumptions-2025-09-28.md` 等，未成体系
- [其他] 业务与计划：`docs/ebom-contract.md`、多份 sprint 方案与对比体验文档

### 2.2 结论与建议
- 现有文档足以支撑前端原型工作，但对“试验 BOM”领域缺少专用的领域模型、接口合同与集成说明。
- 建议：后续补齐《试验域数据字典与指标口径》《试验结果最小上载契约（CSV/JSON）》与《XBOM 关联策略（试验⇄设计/仿真）》三类文档。

---

## 3. 增强范围界定（Enhancement Scope Definition）

### 3.1 增强类型（复选）
- [x] 新功能补齐（试验 BOM 首次实现）
- [x] 与现有系统的集成（中期：通过 BFF/标准契约接入试验结果与主数据）
- [ ] 重大功能改造（对既有模块的大规模重构暂不在本次范围）
- [ ] 性能/可扩展性专项
- [ ] UI/UX 全面改版（本次以域功能补齐为主）
- [ ] 技术栈升级
- [ ] 缺陷修复与稳定性专项

### 3.2 业务目标（初稿）
- 在现有 XBOM 能力基础上，补齐“试验 BOM（TBOM）”的结构、版本与关系视图。
- 建立“试验计划/项/工步/样件/试验运行/结果数据集”的最小领域模型，并与需求/设计/仿真对象建立可追溯关联。
- 以“需求验证矩阵（MVP1）”为牵引，打通需求→用例→试验结果的可视链路，并在对比中心支持“试验-仿真/试验-设计”对比与证据导出。

### 3.3 不在范围（本次）
- 不替代 TDM/现场试验执行与流程控制；不直接操作线下系统。
- 不强依赖立即上线的后端真源；前期以最小上载契约（CSV/JSON）+ BFF 过渡层为主。

### 3.4 成功度量（建议）
- 可视：首个 TBOM 结构视图与基线切换可用；
- 可链：至少 3 类跨域关联（TBOM⇄需求、TBOM⇄设计、TBOM⇄仿真）在 UI 可见并可追溯；
- 可比：对比中心新增“试验”维度的差异对比与导出；
- 可用：关键路径交互的 95% 成功率，P95 渲染 < 2.5s（以原型数据规模为准）。

---

## 4. 架构与集成影响概述（Architecture & Integration Preview）
- 数据接入：短期以 CSV/JSON 最小上载 + 解析映射到 TBOM；中期通过 BFF 统一接口；远期对接 TDM/PLM 真源。
- XBOM 对齐：以统一主数据与字典（指标/信号口径）保证跨域一致性。
- 版本与基线：TBOM 支持版本/基线切换，并与 EBOM/仿真 BOM 的变更对齐。
- 挂接点：试验类型（TestType）与试验对象（Test/TestRun）挂接在“产品结构树”节点（EBOM Node）上，允许从结构树节点出发检索其关联试验。
- 可视化与查看器：沿用现有查看器与对比能力，新增“试验结果”视图与指标卡片。
 - 入口现状：XBOM 结构面板（EBOM 节点详情区域）已预留“跳转 试验BOM”入口，后续复用该入口承载深链与过滤参数。

---

## 5. 后续章节占位（将与干系人交互式完善）
- Epic 结构（需征询）：单一 Epic vs 多 Epic 的选择与理由。
- Epic 明细与故事序列：包含验收标准、集成验证（确保既有功能不回退）与回滚考虑。

> 注：本 PRD 为 Brownfield 增强文档，强调“在不破坏既有能力的前提下”增量集成与交付。

***

（文档仍在交互式起草中，后续章节将根据确认逐步补全。）

---

## 6. TBOM 领域模型与数据契约（初稿）

> 基于你提供的结构与 `docs/brief.md` 补充整理，集中定义层级、输入/输出工件、标识与最小上载契约，以便前端原型与后续 BFF/真源对齐。

### 6.1 层级结构（Hierarchy）
- 试验类型（TestType）
  - 试验项目（TestProject）
    - XX 试验（Test）
      - XX 次上台 / XX 次试车（TestRun）

说明：`TestType → TestProject → Test → TestRun` 为主层级；`TestRun` 与“试验件装配 BOM（AssemblyBOM）”“实物 BOM（PhysicalBOM/SN 级）”建立关联，并可回链至需求、设计与仿真对象。
同时，试验类型与试验对象需要“挂接”到产品结构树节点（EBOM Node），以便从结构视图发现与导航到相关试验。

### 6.2 输入/输出工件（Artifacts）
- 项目级输入（面向 TestProject）：
  - 试验技术要求、试验大纲、大纲评审记录、试验项目方案
- 运行级输入（面向 TestRun）：
  - 本次试验技术要求、试验方案、试验卡片、试验件本次装配 BOM（关联实物 BOM）
- 运行级输出（面向 TestRun）：
  - 试验过程记录（图片/视频/文件/参数等）、试验结果数据（含曲线/指标）、过程事件（含故障/异常）
- 项目级输出（面向 TestProject）：
  - 试验报告、试验分析报告、试验结果评审记录

### 6.3 标识与版本/基线（Identifiers & Baseline）
- `type_id`, `project_id`, `test_id`, `run_id`
- `version`（对象版本）、`baseline_id`（用于基线切换与对比）
- `created_at`, `planned_at`, `executed_at`, `operator`
- 运行环境/工况：`environment`（温度、工况、设备台架等可扩展字段）

### 6.4 最小上载契约（CSV/JSON，建议）
- `tbom_project.json`
  - `project_id`, `type`, `title`, `objectives`, `input_docs[]`, `baseline_id`, `relations[]`
- `tbom_test.json`
  - `test_id`, `project_id`, `name`, `purpose`, `spec_refs[]`
- `tbom_run.json`（或 `tbom_run.csv`）
  - `run_id`, `test_id`, `run_index`, `planned_at`, `executed_at`, `operator`, `environment`, `test_item_sn`, `assembly_bom_id`, `attachments[]`
- `result_timeseries.*`（按信号拆分或宽表：`ts, signal_code, value, unit, sr`）
  - 元数据：`run_id`, `channel`, `unit`, `sample_rate`, `file_ref`
- `process_event.csv`
  - `event_id`, `run_id`, `category`（fault/anomaly/note）、`severity`, `start_ts`, `end_ts`, `desc`, `code`
- `test_card.csv`
  - `param_name`, `value`, `unit`, `source`
- `attachments.csv`
  - `file_id`, `type`（image/video/file）、`path/url`, `ts`, `desc`, `run_id`

说明：前端原型阶段以上述契约驱动数据导入与展示；中期由 BFF 提供统一 Graph/REST 接口对接真源。

### 6.5 跨域关联键（Traceability Keys）
- 需求：`requirement_id`
- 设计/EBOM：`ebom_node_id`（结构树节点 ID）、`ebom_path`（可选：节点路径字符串），以及 `ebom_item_id`（物料项，含配置/版本）
- 仿真：`simulation_case_id` / `simulation_result_id`
- 实物 BOM（SN 级）：`physical_bom_sn`

### 6.6 权限与密级（占位）
- 标记敏感度与访问控制策略（本次前端原型以 UI 标示与假数据隔离为主，后续与权限体系对齐）。

---

## 7. Epic 结构（征询）

建议采用“单一 Epic：试验 BOM 首版上线”，理由：范围围绕同一领域模型闭环（结构导航→运行详情→导入契约→跨域关联→对比中心扩展），内部依赖强、跨域影响集中，适合作为一个连贯的增量。

问题征询：是否同意以“单一 Epic”覆盖首版交付？如需并行推进多条互不相关的增强，可拆分多 Epic。

---

## 8. Epic 1：试验 BOM 首版上线（草案）

**Epic 目标**：在不破坏既有能力的前提下，交付首个可用的 TBOM 视图与运行详情，具备最小上载导入、跨域关联与基础对比能力，为后续真源对接与报告输出铺路。

### Story 1.1 测试基座（技术）
验收标准：
1: 建立最小测试基座：组件/Hook 使用 React Testing Library（RTL），端到端使用 Playwright（headless 可运行）。
2: 提供示例用例：
   - RTL：节点徽标/按钮可被键盘聚焦，焦点环可见；aria-live 提示可断言。
   - Playwright：访问 `/?from=ebom&node=…` 时能看到“按结构节点过滤”的占位元素（或 Mock 页）。
3: 在 README 或 `docs/ui-architecture.md` 附录补充“如何运行测试”。

集成验证（IV）：
IV1: 新增测试不会影响 `npm run build`；
IV2: 预留 `npm run test` 与 `npm run test:e2e` 脚本本地可运行。

回滚考虑：
如 Playwright 引入阻力，可先落地 RTL 与最小 e2e 占位脚本（标注 TODO），不阻塞后续实现。

故事文档：`docs/stories/STORY-1.1-testing-baseline.md`

### Story 1.2 Tailwind 工具链统一（技术）
验收标准：
1: 按 ADR-0001 冻结 Tailwind v3 工具链，移除与 v4 生态冲突的依赖（如 `@tailwindcss/postcss ^4`）。
2: `next build`、`npm run dev` 与 `npm run lint` 正常；样式与类名策略不受影响。
3: 在 `docs/ui-architecture.md` 或 README 记录升级窗口与注意事项（若未来评估 v4）。

集成验证（IV）：
IV1: 新增/调整依赖不引入构建警告或体积异常；
IV2: 关键页面视觉对比无差异（抽样截图/走查）。

回滚考虑：
如需恢复原依赖，保留变更前的 lockfile 备份与说明；不影响后续功能开发。

### Story 1.3 Mock API 出口与服务封装（技术）
验收标准：
1: 建立统一 Mock API 路由前缀 `/api/mock/tbom`，至少包含：
   - `GET /projects` → `docs/mocks/tbom/tbom_project.json`
   - `GET /tests` → `docs/mocks/tbom/tbom_test.json`
   - `GET /runs` → `docs/mocks/tbom/tbom_run.json`
   - `GET /timeseries/:runId` → `result_timeseries.csv`（按需返回 CSV 文本）
   - `GET /events/:runId` → `process_event.csv`
2: 建立服务封装：
   - `services/http.ts`：原生 fetch 轻封装（超时/错误规范化）；
   - `services/tbom.ts`：Zod schema 对响应进行校验（与 `docs/tbom-contract.md` 对齐）。
3: 环境变量：`.env.example` 补充 `NEXT_PUBLIC_API_BASE=/api/mock`、`NEXT_PUBLIC_MOCK_MODE=true` 等示例。

集成验证（IV）：
IV1: 本地可通过 `/api/mock/tbom/*` 获取样例数据；
IV2: 服务封装可被调用并返回通过 Zod 校验的数据；
IV3: 不引入任何重库的顶层静态 import；满足动态拆分边界约束。

回滚考虑：
若 Route Handlers 引入复杂性，可暂以静态文件直读方案过渡，但需保留统一前缀接口形态以便后续替换。

### Story 1.4 建立 TBOM 领域模型与最小上载契约
验收标准：
1: `docs/tbom-contract.md` 完成“层级/字段/示例”文档，含 CSV/JSON 样例与字段释义。
2: `docs/mocks/tbom/*` 提供示例数据，覆盖 project/test/run、时序结果、事件与附件索引。
3: 前端 `types.ts`（按仓库规范）定义 `TestType/TestProject/Test/TestRun` 与核心工件类型。
4: 在本地加载 Mock 数据并通过基础 selector 获取/过滤。

集成验证（IV）：
IV1: `npm run build` 通过，既有 EBOM/Compare 页面不回退。
IV2: `npm run lint` 通过，无新增告警。
IV3: Mock 数据规模下导航/列表渲染 P95 < 2.5s。

### Story 1.5 TBOM 结构导航与详情（Type→Project→Test→Run）
验收标准：
1: 新增 `/tbom` 入口与侧边导航项；左侧树按层级展开筛选。
2: 中区展示所选节点详情卡片：关键元数据、输入/输出清单概览、关联计数。
3: 右侧“关联”面板：显示需求/设计/仿真/实物BOM 链接，可跳转至对应模块；若存在 `ebom_node_id`，显示“产品结构节点路径（`ebom_path`）”并支持从结构视图反向进入。
4: 支持关键字过滤、类型/状态筛选，空态与加载态完整。

集成验证（IV）：
IV1: 与现有 `components/structure/*` 风格一致，a11y 可达。
IV2: `sm/md/lg` 断点布局正常，虚拟滚动避免长列表卡顿。
IV3: 不影响现有路由与侧边栏行为。

### Story 1.6 试验运行详情页：过程记录/结果/事件/附件
验收标准：
1: 运行详情视图：时间轴（关键事件）、过程记录（图片/视频/文件）与元数据卡片。
2: 结果预览：指标卡片 + 小型曲线预览（可展开查看器）。
3: 故障/异常事件列表：类型/严重度/时间范围/描述，可定位到曲线区间。
4: 复用现有 PDF/Image 组件，统一附件预览交互与下载。

集成验证（IV）：
IV1: 加载失败与无数据时提供降级与引导。
IV2: 与 `Compare` 模块的曲线查看器保持一致的单位/口径显示。
IV3: 大附件懒加载，不阻塞页面主渲染。

### Story 1.7 最小上载导入向导（CSV/JSON）
验收标准：
1: 导入向导：选择契约类型→校验字段→映射确认→导入结果摘要→可回看日志。
2: 支持 `tbom_project.json/tbom_test.json/tbom_run.json/process_event.csv/attachments.csv` 等最小集。
3: 导入后可在 `/tbom` 结构与运行详情即时可见；错误行提供下载。
4: 更新 `docs/tbom-contract.md`：导入规范、错误码、样例包与校验规则。

集成验证（IV）：
IV1: 大文件处理 UI 不冻结，超时/中断有提示与重试。
IV2: 与 Mock 数据并存，支持增量导入与覆盖策略。
IV3: 不引入浏览器危险权限（安全加分项：仅本地解析）。

### Story 1.8 跨域关联与可追溯（TBOM ⇄ 需求/设计/仿真/实物BOM）
验收标准：
1: 在节点详情与运行页展示跨域关联 chips（需求/EBOM/仿真/实物BOM）。
2: 节点间跳转保留筛选上下文；支持“返回 TBOM”面包屑链路；从“产品结构树”节点页可直接查看挂接的试验类型与试验列表（基于 `ebom_node_id`）。
3: 在 `docs/` 增补《指标口径与映射约定》小节，统一单位/信号代号。

集成验证（IV）：
IV1: 需求与仿真页面可接受来自 TBOM 的深链接参数。
IV2: Compare 中选择 TBOM 运行后，可与仿真结果进行基础对比（占位到位）。
IV3: 单一路由守卫策略，避免循环跳转。

### Story 1.9 Compare 扩展：试验维度对比（ACC/PSD/FRF/COH）
验收标准：
1: Compare 模块新增“试验”数据源，可从 TBOM 选择 1..N 个 `TestRun` 做叠加对比；
2: 通道选择器支持 `ACC_*`/`PSD_*`/`FRF_*`/`COH_*` 快速筛选与定位；
3: 单位与采样率自动对齐：若不一致，提供转换/重采样提示并允许一键统一；
4: 图表支持缩放、区间选择、光标对齐、游标读数；
5: 导出：支持 CSV（当前视图数据）与 PNG（图像）。

集成验证（IV）：
IV1: 口径校验：通道单位与采样率经 `tbom-contract.md` 所列规则校验通过；
IV2: 与仿真结果对比：可选择一个 `simulation_result_id` 与一个/多个 `TestRun` 进行 PSD 或 ACC 时域对比（占位即可，口径统一完成）；
IV3: 性能：对 10 万点/通道、4 通道数据进行交互，P95 交互延迟 < 120ms（使用抽稀/分块加载）。

### Story 1.10 证据导出与结果包
验收标准：
1: 在运行详情与 Compare 视图，支持导出“试验证据包（zip）”：结构清单（JSON）、选定图表 PNG、区间统计 JSON、事件 CSV、附件索引；
2: 支持模板化文件名与 remark（来源/版本/时间戳/基线号）；
3: 导出日志可回看，并支持再次下载。

集成验证（IV）：
IV1: 不包含敏感字段（基于前端白名单）；
IV2: 大文件分块打包，不阻塞 UI 主线程；
IV3: 与现有导出（Compare/结构）命名规范一致。

### Story 1.11 性能与大文件处理（技术故事）
验收标准：
1: 时序数据采用分块加载 + 视口抽稀（decimation），图表缩放不触发整表重算；
2: 附件懒加载与并发上限控制，失败重试与取消；
3: `next build` 监控包体变化，新增依赖需在 PR 中说明体积开销与替代方案；
4: 文档化性能策略于 `docs/frontend-prototype-integration.md`。

### Story 1.12 EBOM 结构视图：试验挂接入口与徽标
验收标准：
1: 复用既有“跳转 试验BOM”入口（位于 EBOM 节点详情区域）；
   - 增加深链参数：`?from=ebom&node=<ebom_node_id>&path=<ebom_path>`；
   - 点击后 TBOM 侧自动应用结构节点过滤；
2: EBOM 树节点右侧显示“试验”徽标与计数（合计 TestRun），空态不显示；
2: 悬停显示类型分布与最近运行时间；
3: 点击跳转 `/tbom?node=<ebom_node_id>&path=<ebom_path>&from=ebom`，TBOM 侧自动应用结构节点过滤；
4: 右键菜单包含“查看挂接试验”“在新标签中打开 TBOM”；
5: ARIA/键盘可达：Tab 聚焦徽标，Enter 打开，Shift+Enter 新标签打开。

集成验证（IV）：
IV1: 计数来自 Mock 聚合或 BFF 聚合（按阶段实现），结构树滚动/虚拟化下不卡顿；
IV2: 反向导航：TBOM 面包屑显示 `ebom_path`，一键返回结构视图并定位节点；
IV3: 与 `docs/tbom-ui-spec.md` 一致，文案多语言 key 接入。

---

## 9. 里程碑与交付（占位）
- M1 契约与样例（已完成）：`docs/tbom-contract.md` 与 `docs/mocks/tbom/*`；
- M2 工程基座：Story 1.1（测试）+ 1.2（Tailwind 工具链）+ 1.3（Mock API 与服务封装）；
- M3 TBOM 结构与详情：Story 1.5；
- M4 导入向导：Story 1.7；
- M5 Compare 试验维度与证据包：Story 1.9/1.10；
- M6 稳定性与性能加固：Story 1.11；

注：时间窗待项目确定（此前沟通为“暂无”），可按 2–3 周迭代节奏编排。

---

## 10. 风险与应对（初稿）
- 数据口径不一致（单位/采样率/零偏）：
  - 应对：Compare 内置统一/提示；`tbom-contract.md` 标注强制单位与校验规则。
- 大文件导致渲染卡顿：
  - 应对：分块 + 抽稀 + Web Worker；图表组件按需加载。
- 跨域关联不完整（需求/仿真/实物 BOM）：
  - 应对：允许占位关联；PRD 附录提供“必需/可选”最小字段集合。
- 导入质量控制不足：
  - 应对：向导中提供字段校验、错误行下载与重试；保留导入日志。
---

## 11. 非功能性需求（NFR）
- 性能（以原型规模为准）
  - 路由切换 P95 < 2.5s；首屏可交互 TTI < 2.0s；
  - 曲线交互（10万点×≤4 通道）P95 交互延迟 < 120ms（抽稀/分块/Worker）。
- 可用性与可达性（a11y）
  - 键盘操作覆盖主要交互；焦点管理与可见焦点；ARIA 标签齐全。
- 可靠性
  - 导入向导具备数据校验、回滚/重试；错误行下载与日志保留 ≥ 7 天（本地）。
- 国际化与本地化（i18n）
  - 文案集中管理；单位/小数格式随语言环境切换；
  - 通道代号保持英文缩写，展示层可扩展中文别名。
- 安全与隐私
  - 前端不落地敏感原始数据，证据包导出采用白名单字段；
  - 附件链接仅作占位，真实服务侧需鉴权与审计（后续 BFF 接入时落实）。

## 12. 部署与运维（DevOps 概要）
- 构建：`npm run build`（Next.js 15）；环境变量放置 `.env.local`，在 `docs/` 记录所需键。
- 配置：`next.config.ts` 与 `tailwind.config.js` 联动更新；第三方库引入需在 PR 说明包体影响。
- 监控与日志（原型阶段）
  - 前端事件：导入/导出/对比等关键操作在控制台打点；
  - 错误：全局错误边界 + 用户提示；
  - 后续对接 BFF 时引入统一审计与埋点（不在本次范围）。

## 13. 代码组织与规范（落地指引）
- 路由与组件
  - TBOM 视图建议 `components/tbom/*`（树、详情、导入向导、视图状态钩子）；
  - 与 EBOM 的挂接点：在 `components/structure/ebom/*` 内新增徽标/计数组件与深链处理；
  - Compare 扩展在 `components/compare/*` 下新增“试验”数据源与通道选择器。
- 风格与技术规范
  - 组件默认 Server Component，含状态/事件的叶子组件使用 Client；
  - Tailwind 类顺序：布局→间距→排版→颜色；复用 `common/` 原子组件；
  - 类型集中声明于各模块 `types.ts`，与 `docs/tbom-contract.md` 字段保持一致。

## 14. 开放问题与术语表（初稿）
- 开放问题
  - Q1：证据包的“区间统计”是否包含峰值/均方根/频带积分等可选项？
  - Q2：导入向导是否需要支持 Excel（xlsx）直传，还是仅 CSV/JSON？
  - Q3：事件（fault/anomaly）的严重度分级是否采用现有质量体系分级？
- 术语表
  - TBOM：Test Bill of Materials，试验域对象与运行的结构化视图。
  - TestRun：一次上台/试车运行；
  - PSD：功率谱密度（g^2/Hz）；FRF：频响函数（m/s^2/N 或 g/N）；COH：相干函数。
