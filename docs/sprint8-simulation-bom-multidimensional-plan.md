# 冲刺8：仿真BOM多维组织方案

## 背景与目标
- 当前仿真BOM视图沿用 `components/structure/ProductStructure.tsx` 中的 `renderSimulationData` 模块，左侧由 `SimulationTreePanel` 按仿真类型 → 实例 → 文件夹构成（来源：`components/structure/simulation/data.ts` 的 `simulationCategories` Mock 数据）。
- 总师提出在仿真BOM内引入多维组织能力：保持现有产品结构视角，同时新增按时间（月度）与仿真类型的组织方式，并支持任意两维组合过滤，右侧内容布局与交互沿用现状。
- 本冲刺以 **前端 Mock 实现** 为目标，为后续与真实服务对接预留接口，且不得回归影响方案BOM（`selectedBomType === 'solution'`）下的仿真验证体验，同时为验收设定量化目标：① 总师跨月巡检时长相较现状缩短 ≥30%；② 仿真缺口从发现到指派的平均耗时 ≤1 天（通过内部试用或模拟流程评估）。

## 用户价值（多角色视角）
1. **总师**：在结构视角下快速巡检跨专业覆盖度，结合时间/类型组合定位仿真缺口，保存专题视图以缩短决策耗时（目标缩短 ≥30%）。
2. **系统负责人**：聚焦所属结构节点，使用“结构+时间”筛选确认交付节奏与风险；常用视图可沉淀周期巡检任务。
3. **专业工程师**：以仿真类型视角查看专业队列，搭配时间维度识别趋势；自动标注提示帮助识别类型缺失或异常。
4. **组合过滤（专题洞察）**：如“2025/02 + 流体仿真”快速汇聚专题数据，加速跨团队协同闭环。
5. **个人视图沉淀**：保存自定义视图仅对当前用户生效，可维护最多 10 个视图（命名≤30 字符，按创建时间倒序展示），支持重命名与删除。

## 现状梳理
| 模块 | 作用 | 代码入口 |
| --- | --- | --- |
| 左侧仿真树 | `SimulationTreePanel` 将 `simulationCategories` 渲染为类型树 | `components/structure/simulation/SimulationTreePanel.tsx` |
| 仿真内容区 | `SimulationContentPanel` 根据选中节点、搜索与过滤项展示实例/文件夹/文件 | `components/structure/simulation/SimulationContentPanel.tsx` |
| 状态管理 | `useSimulationExplorerState` 维护分类、节点选中、分页、过滤器（状态/Owner/标签/时间范围）等 | `components/structure/simulation/useSimulationExplorerState.ts` |
| 数据源 | `simulationCategories` Mock 仅包含类型→实例→文件夹结构 | `components/structure/simulation/data.ts` |
| 关联入口 | 方案BOM与仿真BOM共用 `renderSimulationData()`；切换至仿真BOM时调用 `simulationDispatch({ type: 'RESET' })` | `components/structure/ProductStructure.tsx:3074` |

痛点：
- 数据模型没有产品结构、月份或类型标签字段，无法支撑多维查询。
- 状态 Hook 仅允许单维列表过滤，没有视角切换、组合过滤、懒加载机制。
- UI 仅支持类型视角，缺少视角切换、选中条件提示、统计概览、保存视图等体验。
- 方案BOM也复用同一套仿真组件，改造需明确隔离策略以避免回归。

## 需求拆解
1. **视角切换**
   - 需要提供 `结构 / 时间（月） / 类型` 三个视角，默认进入结构视角（与现状一致）；方案BOM仍默认展示类型视角。
   - 视角切换控件位于仿真内容区左侧顶部的吸顶容器中，与统计条并列显示，桌面端固定展示（本期不做移动端适配）。
   - 视角切换要保留各自的展开状态与滚动位置。
2. **组合过滤（最多两维）**
   - 结构+时间、结构+类型、时间+类型任意组合；当已有两项时再选择第三项需弹出提示“最多选择两种维度，先清除已有条件”。
   - 左侧面板顶部展示已选条件标签，可一键清空；清空操作仅作用于组合维度，不影响状态/Owner/标签等细粒度过滤。
3. **时间维度**
   - 粒度：月（如 2025/01、2025/02），按年份分组可折叠；Mock 生成器将 `executedAt` 随机分布在 2024-10 至 2025-03，前端基于该 ISO UTC 字符串派生 `timeBucket`。
   - 缺省时间的实例归入“未定义月份”分组，并在统计条中单独计数提示。
4. **仿真类型维度**
   - 使用统一字典进行标签映射；对缺失类型的实例自动推断并标记“自动标注”状态，并提供反馈入口记录异常（Mock 阶段在前端日志收集）。
5. **结构维度**
   - 沿用方案BOM树（产品结构），并在叶节点挂载仿真实例计数。
   - 切换视角时仍需显示节点面包屑路径。
6. **过滤结果**
   - 右侧内容沿用 `SimulationContentPanel`，根据已选维度动态过滤实例及其文件。
7. **懒加载**
   - 左侧树/列表和右侧文件列表需引入分页或“加载更多”机制，单次加载不超过 30 条（前端 Mock 实现）。
8. **保存视图**
   - 允许当前用户保存组合条件（保存在 localStorage），并在左侧顶部提供“常用视图”快速入口；最多保存 10 个视图，命名长度 ≤30 字符，按创建时间倒序展示，可重命名与删除，超限时需先删除旧视图。

## 交互与UI策略（遵循现有规范）
- 顶部吸顶容器包含视角切换 Tab（Segmented control）与统计条，切换时保留各视角的展开状态与滚动位置。
- 已选条件以标签形式呈现，支持 hover 显示来源维度并提供单独清除入口。
- 左侧统计条展示命中实例数、异常/通过占比等实例级指标，并可点击滚动到右侧相关内容。
- 支持 `Cmd/Ctrl+F` 聚焦搜索框；在时间/类型视角下面包屑显示“视角 > 条件 > 节点”。
- 空状态提供“清空条件 / 回到结构视角”操作，并提示当前过滤组合。

## 技术方案
### 数据建模
1. 扩展 `SimulationInstance`：
   - 新增 `structureNodeId`、`structurePath`、`simulationType`（字典值）、`autoTagged`（布尔）、`executedAt`（ISO 字符串）等字段。
   - 新增 `timeBucket` 派生字段（形如 `2025-01`）。
2. 增补 Mock 生成器
   - 在 `components/structure/simulation/data.ts` 中构建基础实例数组（含结构信息、类型、时间），然后派生为不同视角所需的数据结构：
     - `structureBuckets`: 基于产品结构树聚合实例。
     - `timeBuckets`: 按月份（含实例列表）组织。
     - `typeBuckets`: 保持现状但添加统计与自动标注提示。
   - 缺省信息处理：无 `simulationType` 的实例按规则推断 `autoTagged=true`，并记入前端日志；无 `executedAt` 的实例归入“未定义月份”。
3. 字典配置
   - 新增 `simulationTypeDictionary`（中文名称、图标、主色），供 UI 与推断逻辑复用。

### 状态管理
- 扩展 `useSimulationExplorerState`：
  - 新增 `viewMode: 'structure' | 'time' | 'type'`。
  - 新增 `activeDimensions`（结构节点 ID / 月份键 / 类型键）数组，最长 2 项。
  - 为每个视角缓存 `expandedNodeIds`、`scrollOffset`。
  - 管理 `savedViews`（序列化至 localStorage，键如 `simulation-bom-favorites`，按用户 ID 或浏览器隔离）。
  - 增加 `SET_VIEW_MODE`、`SET_DIMENSIONS`、`TOGGLE_DIMENSION`, `LOAD_MORE` 等 action。
- 组合过滤应用于 `SimulationContentPanel` 的 `aggregatedFiles` 与实例集合，确保与现有状态筛选（statuses、owners、tags、timeRange）兼容。

### 组件改造
1. **ProductStructure.tsx**
   - 在 `renderSimulationData` 中注入视角切换控件、统计条、常用视图入口。
   - 将树面板抽象为 `SimulationNavigationPanel`，根据 `viewMode` 渲染不同数据源。
2. **SimulationTreePanel**
   - 拆分为三个子组件或在内部根据 `mode` 构建树节点。
   - 支持懒加载：节点展开时再生成子节点（Mock场景可在前端分批 slice）。
3. **SimulationContentPanel**
   - 接收新的 `activeDimensions`、`viewMode`，在 `aggregatedFiles` 和 `filteredCategoryInstances` 阶段应用多维过滤。
   - 加入顶部条件标签、统计条、“保存视图”入口。
4. **新增组件**
   - `SimulationViewChips`：展示与管理已选条件。
   - `SimulationSavedViews`：列表/保存对话框。
   - `SimulationStatsBar`：显示命中实例总数、通过率等（Mock 计算）。

### 懒加载策略
- 结构/时间/类型节点展开时仅加载前 30 条子项，提供 “加载更多” 按钮。
- `SimulationContentPanel` 文件列表沿用现有分页（page/pageSize），在组合过滤时重置页码。
- Mock 数据中预留 50+ 实例以验证懒加载与分页行为。

### 兼容性与回归保护
- 保持 `selectedBomType === 'solution'` 时的行为：
  - 默认视角为类型，隐藏结构/时间视角按钮（或灰掉），确保现有方案BOM仿真标签可直接使用。
  - 仅在 `selectedBomType === 'simulation'` 时开放多维功能与保存视图入口。
- `simulationDispatch({ type: 'RESET' })` 时重置视角为结构视角，避免沿用方案BOM上下文。

## 开发任务拆解
1. **数据层**
   - [ ] 重构 `simulationCategories` 为原始实例数组与派生视图。
   - [ ] 新增类型字典、结构节点索引、月份派生工具（含自动推断标记）。
2. **状态管理**
   - [ ] 扩展 `useSimulationExplorerState` action 与 state，覆盖视角、组合过滤、保存视图、懒加载。
   - [ ] 为本地存储偏好（视角、展开状态、savedViews）设计序列化协议。
3. **UI 组件**
   - [ ] 引入视角切换控件、条件标签、统计条。
   - [ ] 改造 `SimulationTreePanel` 以支持三种布局与懒加载。
   - [ ] 更新 `SimulationContentPanel` 过滤逻辑并对组合条件进行提示。
4. **交互反馈**
   - [ ] 保存视图、加载更多、自动标注信息的提示文案（含超限提示与反馈入口）。
   - [ ] 空状态、错误状态（Mock 失败）处理。
5. **测试 & 验证**
   - [ ] 手动覆盖：结构→时间/类型切换；组合过滤；保存视图读取；懒加载。
   - [ ] 回归：方案BOM仿真 Tab、对比抽屉、文件预览、compare 队列上限。
   - [ ] 校验统计条指标口径，确保实例级命中数、异常占比与过滤结果一致。
   - [ ] 通过内部试用或模拟流程验证量化目标（巡检用时缩短 ≥30%，缺口指派耗时 ≤1 天）。
   - [ ] 记录测试数据、步骤与结果，形成冲刺验收报告。
6. **文档 & 跟踪**
   - [ ] 更新 `docs/simulation-data-dictionary.md`（若存在）描述新字段。
   - [ ] 追加界面截图、交互说明供评审参考。

## 测试策略
- **总体原则**
  - 以端到端手工验证为主，补充关键 reducer/组件的单元测试（React Testing Library）。
  - 高优先级路径：视角切换、两维组合过滤、compare 队列、保存视图、懒加载、自动类型标记。
  - 持续以方案BOM仿真视图为回归基线，确保 `selectedBomType === 'solution'` 流程零回退。
- **测试范围**
  | 场景 | 目标 | 说明 |
  | --- | --- | --- |
  | 视角切换 | 结构 ↔ 时间 ↔ 类型状态保持 | 验证展开节点缓存、面包屑、统计条同步刷新 |
  | 组合过滤 | 任意两维（结构+时间、结构+类型、时间+类型） | 条件标签渲染一致；超过两维时给出限制提示 |
  | 懒加载 | 左侧节点与右侧文件列表 | 校验 30 条阈值、“加载更多”按钮、滚动回弹体验 |
  | 保存视图 | 保存 / 应用 / 删除 / 重命名 | 只对当前用户可见；切换浏览器/会话需重新创建 |
  | 自动标注 | 类型推断标记呈现 | 缺省类型实例显示“自动标注”；可被过滤命中 |
  | Compare 队列 | 加入、去重、上限、跨视角持久 | 队列最大 6 项；切换视角不丢失；清空按钮有效 |
  | 搜索与筛选 | 与现有状态过滤组合 | 搜索框、状态/Owner/标签/时间范围互操作无冲突 |
  | 统计条 | 指标口径一致性 | 命中实例数、异常/通过率与右侧列表数据一致 |
  | 方案BOM回归 | `selectedBomType === 'solution'` | 视图扩展对方案场景透明；compare、预览保留现状 |
- **测试用例设计**
  - 输出用例详单（前置数据、步骤、期望/实际、截图）。
  - Mock 数据需覆盖：跨月实例、混合类型、缺失类型、多个结构节点、自动推断成功/失败。
  - 记录性能指标（Chrome Performance），懒加载交互耗时 < 200ms。
  - 设计专项用例测量巡检时长与缺口指派耗时，支撑量化指标验收。
- **自动化建议**
  - Reducer/Hook 单元测试：`useSimulationExplorerState` 的 `SET_VIEW_MODE`、`SET_DIMENSIONS`、`RESET`、保存视图逻辑。
  - 组件测试：视角切换控件、条件标签渲染、懒加载按钮。
  - E2E（可选 Playwright）：核心路径“选择视角→组合过滤→加入 compare→保存视图”，纳入后续 CI。
  - localStorage 行为断言（保存视图、偏好恢复）。
- **验收步骤**
  1. 使用测试用例清单覆盖所有视角、过滤组合、保存视图、懒加载。
  2. 与产品/设计共走查统计条、标签、提示文案。
  3. 回归方案BOM仿真功能与 compare 流程。
  4. 输出《仿真BOM多维组织验证报告》，归档至 `docs/qa/`。
  5. 汇总巡检时长与缺口指派耗时的试用数据，确认量化目标达成情况。

## 验收标准
- 仿真BOM左侧支持三种视角，组合过滤不超过两维且超限提示生效。
- 右侧内容与 compare 功能在新旧视角下均可正常工作，compare 队列跨视角保持。
- 保存视图仅对当前浏览器用户生效，可成功保存/应用/删除，最多 10 个且命名校验通过。
- 懒加载在视角与内容区域均可触发，滚动或点击“加载更多”后数据追加无明显卡顿（关键操作耗时 <200ms）。
- 统计条指标与过滤结果一致，异常/通过占比计算准确。
- 方案BOM中的仿真验证 Tab 行为与冲刺7一致。
- 内部试用或模拟流程显示：总师跨月巡检任务用时缩短 ≥30%，仿真缺口指派平均耗时 ≤1 天。

## 风险与缓解
| 风险 | 影响 | 缓解措施 |
| --- | --- | --- |
| 前端 Mock 数据量不足导致体验难以验证 | 难以测试懒加载与组合过滤 | 提前扩充 Mock 数据（≥50 实例、涵盖多月份/类型）。 |
| 视角切换与 compare 队列共享状态冲突 | compare 队列在不同视角下失效 | compare 缓存按 `viewMode` 打标签，切换时保持一致或给出提示。 |
| 自动类型推断准确性 | 误导用户 | 在 Mock 阶段明确标记“自动标注”，并提供反馈入口。 |
| 多维过滤信息噪音 | 用户难以识别重点 | 通过内部试用/设计走查收集反馈，必要时优化默认视图或增加指引。 |
| 范围限定（仅桌面端） | 移动/小屏体验缺失 | 文档明确范围，提示后续视需求评估移动端改造。 |

## 进一步跟进
- 与数据团队确认自动标注的人工校正流程与反馈闭环需求。
- 评估保存视图是否需在后续迭代支持团队共享或账号级同步能力。
