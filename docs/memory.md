# 项目记忆文件

## 1. 项目愿景与阶段
- 产品名称：产品过程数据中心（军工研发领域的过程数据协作平台）。
- 目标：将过程数据管理到参数级，实现分面导航、XBOM 多视图、上下文图谱、对比中心，支撑仿真-试验闭环与数字孪生。
- 里程碑：MVP（手动归集+分面导航+资产详情+通用预览+权限）；Phase 2（XBOM 切换、版本/基线、对比中心、图谱、成套性、协同）；Phase 3（自动采集代理、高级预览、参数分析、PLM 深度集成）。
- KPI：故障分析准备时间→小时级；过程数据入库率≥90%；仿真任务闭环≥60%；评审基线成套性100%。

## 2. 核心术语与范围
- 项目空间：权限隔离与导航单位。
- XBOM：多视图产品结构（方案/需求/设计/仿真/试验/实物）。
- 对比中心：多方案/多工况/跨领域对比入口。
- 上下文关系图谱：需求-设计-仿真-试验链路可视化。
- 成套性：任务/方案交付物完整性状态。

## 3. UI/UX 总体要求
- 主导航：仪表盘｜数据探索器｜产品结构｜对比中心｜上传管理器｜成套性｜图谱｜设置。
- 设计原则：5 次点击内定位、渐进披露、术语与视觉统一、键盘可达（WCAG 2.1 AA）。
- 关键场景：上传流程、XBOM 差异模式、版本对比、对比中心视图、图谱审查、成套性打包。
- 组件栈：Tailwind + RemixIcon；拟用 shadcn/ui/Lucide 风格。

## 4. 代码结构概览（Next.js App Router）
- `app/`
  - `layout.tsx`：加载 Geist/Pacifico 字体，包裹全局样式。
  - `page.tsx`：顶层模块切换（Header + Sidebar + 主体内容）。
  - `globals.css`：引入 Remixicon 与 Tailwind。
- `components/`
  - `Header.tsx`：项目选择、全局搜索、通知入口。状态：`showSearch`、`showProjects`、筛选选项。
  - `Sidebar.tsx`：模块导航+折叠；简单统计卡片。
  - `dashboard/`：`Dashboard`（汇总页）、`StatsGrid`、`ActivityChart`（Recharts AreaChart）、`ProjectHealth`、`RecentAssets`。
  - `explorer/DataExplorer.tsx`：分面导航、标签筛选、视图切换（卡片/表格）、日期筛选、自定义标签、多选批量操作入口。状态：`searchQuery`、`selectedFacets`、`viewMode`、`dateRange`、`selectedTags`、`customTags`、`showMoreTypes` 等。
- `structure/ProductStructure.tsx`：最复杂模块。管理 `selectedBomType`、节点展开 `expandedNodes`、`selectedNode`、角色、版本、标签页、输入/输出数据、需求数据、仿真数据、成套性等。`handleBomTypeChange` 在 1086 行重置视图，`renderTreeNode` 渲染多层结构，含方案/需求不同数据结构与标签页内容（基本信息、需求详情、方案数据、仿真数据）。
  - `structure/ProductStructure.tsx`：最复杂模块。管理 `selectedBomType`、节点展开 `expandedNodes`、`selectedNode`、角色、版本、标签页、输入/输出数据、需求数据、仿真数据、成套性等。`handleBomTypeChange` 重置视图并对方案/需求视角初始化角色，`useEffect` 会在切换 BOM 类型后自动选择树中第一个节点，并针对方案/需求分别默认显示 `basic` 或 `requirement` Tab。`renderTreeNode` 渲染多层结构，含方案/需求不同数据结构与标签页内容。需求详情面板拆分为 `RequirementDetailPanel.tsx`，依赖 `data/requirementRoles.ts`、`data/requirements.ts` 与 `types.ts` 提供的 mock 数据和类型（包含来源、更新时间等丰富字段），支持跨角色指标/结构化参数/行动项展示及导出订阅操作。仿真页改造为模块化组件：`simulation/types.ts`、`simulation/data.ts`、`simulation/useSimulationExplorerState.ts`（树/内容/对比共享状态）、`SimulationTreePanel`、`SimulationContentPanel`、`SimulationFilePreview`、`SimulationCompareDrawer`。仿真 Tab 打开时自动选中第一个类型 → 实例 → 文件夹，支持树形导航、搜索分页、文件在线预览、多版本/工况对比占位以及对比队列（限制 6 项）。
  - `compare/CompareCenter.tsx`：对比模式与数据类型切换、对比项列表、不同视图（参数表、曲线、模型、图像、文档），包含工具条与统计。
  - `upload/UploadManager.tsx`：拖拽/模拟上传队列、状态统计、文件表、最近上传列表。状态：`files`、`dragOver`；`simulateUpload` 周期更新进度。
  - `completion/CompletionPanel.tsx`：成套模板、分类完成度、列表批量选择，底部批量操作条。状态：`activeTemplate`、`selectedItems`。
  - `graph/RelationGraph.tsx`：Canvas 绘制关系图，节点过滤、视图模式、节点详情。状态：`selectedNode`、`viewMode`、`filterType`。
  - `settings/Settings.tsx`：设置页多标签（常规/数据/安全/备份/用户/集成/关于），包含表单控件与开关。状态：`activeTab`、`settings`。

## 5. 数据假数据与结构
- 多处硬编码数组模拟真实数据（BOM 节点、需求列表、输入/输出数据、仿真配置、对比项等），后续可替换为 API 调用。
- 结构模块定义 TypeScript 接口：`BomNode`、`RequirementItem`、`SimulationProject`、`OutputData` 等。
- Explorer/Upload/Completion/Compare 等组件也使用本地状态与静态列表模拟行为。

## 6. 技术约束与集成考虑
- 前端：React + Next.js（App Router）、TypeScript、TailwindCSS、Remixicon、Recharts。
- 后续需考虑：与 Teamcenter/仿真平台/试验台架的接口适配、PLM 同步、权限 RBAC、审计留痕、自动采集代理。
- 非功能：性能指标（分面 <1s、对比中心 ≥30FPS）、安全（零信任、行列级审计）、可维护性（可观测性、灰度）。

## 7. 待注意事项
- 当前所有模块基于静态数据，后续接入真实接口需统一数据模型并补齐状态管理。
- 记忆文件需在每次任务前查阅，如有新增模块/改动，及时更新本文件。
- keep 状态同步：`selectedBomType` 切换逻辑依赖 `handleBomTypeChange` 中的节点 ID（方案：`001`，需求：`REQ-ENGINE-001`）。

## 8. 当前方案数据 Tab 改造任务进度
| 步骤 | 描述 | 状态 |
| --- | --- | --- |
| 1 | 调整方案数据主布局：左侧树卡片化、右侧留白、方案总览头部 | 完成 |
| 2 | 构建总体/性能设计模块（循环参数、工况切换、裕度图表、假设列表） | 完成 |
| 3 | 构建结构/强度模块（载荷工况库、裕度面板、工况追踪） | 完成 |
| 4 | 构建热防护模块（热平衡、冷却指标、工况切换） | 完成 |
| 5 | 构建控制与电子模块（接口规格、控制策略、诊断覆盖） | 完成 |
| 6 | 构建供应链/制造模块（制造成熟度、工艺限制） | 待开始 |
| 7 | 构建试验与验证模块（验证闭环看板、数据包入口） | 待开始 |
| 8 | 构建配置/质量模块（基线一致性、变更影响） | 待开始 |
| 9 | 统一卡片和操作区、添加数据来源提示、视图偏好存储 | 待开始 |
| 10 | 协同与通知入口、响应式与无障碍优化 | 待开始 |
