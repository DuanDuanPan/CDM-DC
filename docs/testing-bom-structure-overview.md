# 试验BOM多层级结构改造说明（2025-10-17）

## 背景
- 目标：将试验BOM组织形式调整为 **产品结构 → 试验类型 → 试验项目 → 试验任务**，支撑结构视角下的覆盖分析与项目跟踪。
- 参考：沿用仿真BOM的分栏布局、树导航体验与右侧内容区组件化思路，保证跨模块一致性。
- 范围：当前实现基于前端 Mock 数据，覆盖推进系统、控制系统等典型结构节点，后续可与试验管理服务对接。

## 数据模型
- `TestStructureNode`：描述产品结构层级，提供 `id/name/level/children` 信息并生成 `TEST_STRUCTURE_INDEX` 便于面包屑定位。
- `TestTypeDescriptor`：定义试验类型元数据（图标、默认方法、关键指标等），用于树节点和简介卡片。
- `TestProject`：包含结构路径、类型、状态、风险、覆盖度/就绪度、依赖、仪器、文档、试验任务等字段。
- `TestItem`：代表具体试验任务，携带方法、环境、判据、仪器、进度与度量指标，支撑任务级下钻。
- 辅助方法：`collectProjectsInSubtree`、`collectProjectsByTypeAtStructure` 等，支持结构/类型筛选和统计。

## UI 交互
- **树面板**：`TestingTreePanel`
  - 结构节点展示项目汇总并支持展开；
  - 叶子结构显示试验类型节点，再展开到项目与任务；
  - 选中节点高亮，状态徽标、项目数量与风险提示同步刷新。
- **内容工作区**：`TestingContentPanel`
  - 顶部统计条展示项目总量、覆盖度/就绪度均值、高风险数量；
  - 结构/类型视角下按表格列出项目，支持快捷跳转项目详情；
  - 项目详情包含覆盖度/就绪度进度条、资源依赖、资料归档、风险行动；
  - 任务列表与任务详情卡片可快速定位单条试验任务。
- **状态管理**：`useTestingExplorerState`
  - 维护选中节点、展开节点、统计数据以及快捷跳转方法；
  - `reset()` 在 BOM 切换至试验视图时恢复默认展开与选中项目。

## 集成点
- `ProductStructure.tsx`
  - 引入试验树/内容组件并替换原嵌入式 TBOM 视图；
  - BOM 类型切换新增 `test` 分支，重置试验状态；
  - 左侧树根据 `selectedBomType` 决定展示通用结构、仿真树或试验树。
- 资源目录
  - `components/structure/testing/` 下新增 `data.ts`, `types.ts`, `TestingTreePanel.tsx`, `TestingContentPanel.tsx`, `useTestingExplorerState.ts`。

## 后续接入建议
1. **服务对接**：对齐试验管理后台接口，替换 Mock 数据，确认字段/状态映射关系。
2. **权限与视图模板**：扩展保存视图、角色限定、项目筛选器等功能，复用仿真BOM的本地视图能力。
3. **测试覆盖**：为 `TestingTreePanel` 和 `TestingContentPanel` 补充交互测试（React Testing Library），确保节点展开/详情展示无回归。
4. **性能与懒加载**：项目量扩大后可引入分页与虚拟滚动，同时监控结构树渲染性能。
