# 冲刺7：仿真BOM视图落地计划

## 目标
- 在仿真BOM入口复用现有方案BOM的结构导航与“仿真验证”工作区，为仿真团队提供同样的比对、筛选、预览体验。
- 确保切换至仿真BOM时界面状态与数据一致性良好，避免沿用方案BOM遗留上下文造成误解。

## 关键需求拆解
1. **结构树复用与标识**
   - `getBomStructureData` 在 `selectedBomType === 'simulation'` 时应返回方案BOM同款树形数据，节点 `bomType` 标记改为 `simulation` 以符合配色与标签。
   - 初始展开节点沿用方案BOM默认行为（展开根节点 `001`）。

2. **Tab 配置对齐**
   - `availableTabs` 需为仿真BOM注入 `['simulation']`，移除结构视图入口但仍复用本地存储偏好。
   - `handleBomTypeChange('simulation')` 初始 Tab 设置为 `simulation`，保留单一仿真验证入口。

3. **仿真验证工作区复用**
   - 放宽 `renderSimulationData` 及关联副作用中的 `selectedBomType === 'solution'` 限制，使 `simulation` 类型也能加载 `SimulationTreePanel`、`SimulationContentPanel`、`SimulationCompareDrawer`、`SimulationFilePreview`。
   - 移除“仅方案BOM支持仿真数据视图”提示，改为在缺少选中节点/数据时的通用空状态。

4. **状态重置与上下文隔离**
   - 切换至仿真BOM时清空 `simulationState.compareQueue`、`lastCompareEvent` 等比对上下文，避免从方案BOM沿用。
   - 关闭移动端导航抽屉、清空 `previewSimulationFile`，与 Tab 切换逻辑保持一致。

5. **交互一致性检查**
   - 验证树节点点击后的右侧内容刷新、分页筛选、文件预览、对比队列操作均可在仿真BOM独立运行。
   - 确认返回方案BOM时状态恢复正常，不影响既有流程。

## 交付物
- `components/structure/ProductStructure.tsx` 代码更新（结构数据、Tab 控制、仿真视图条件、状态重置）。
- 新增/更新的交互截图（待开发完成后补充）。
- 本计划文档随 PR 一并引用。

## 验收标准
- 切换到“仿真BOM”后左侧展示完整产品结构树，节点选中可驱动右侧仿真验证内容。
- `SimulationCompareDrawer` 在仿真BOM首次进入时为空；Tab 区域仅展示“仿真验证”，无残留结构入口。
- 方案BOM原有仿真功能保持可用，切换回方案BOM后 Compare 队列、预览状态符合期望。

## 风险与后续
- **状态共享复杂度**：`useSimulationExplorerState` 现为全局 Hook，需确认是否有跨 BOM 的缓存；必要时可拆分实例或增加 `reset` action。
- **Mock 数据复用**：目前仿真文件/分类 Mock 与方案BOM共享，如后续仿真BOM需要差异化数据，需要补充新的 mock 源。
- **性能考量**：移动端抽屉与比对队列在双入口场景下需观察性能与可用性，视情况在冲刺8 优化。

## 实施记录（2025-10-09）
- 在 `ProductStructure` 中通过 `mapBomType` 复用方案BOM树，`simulation` 入口自动转换节点 `bomType` 并保持根节点展开。
- 仿真BOM Tab 列表精简为 `simulation` 单项，默认进入仿真验证视图，同时沿用本地偏好存储。
- 仿真视图副作用统一以 `isSimulationViewActive` 判定，移动端导航与文件预览在方案/仿真入口之间保持一致，移除旧的限制提示。
- `useSimulationExplorerState` 新增 `RESET` action，切换至仿真BOM时清空对比队列与提示状态，避免沿用方案BOM上下文。
