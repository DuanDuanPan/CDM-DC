# Sprint 11 · 仿真详情按钮内跳转方案

更新日期：2025-10-11  
责任人：前端 - Codex 支持

---

## 1. 背景
- 设计 BOM 驾驶舱右侧的 XBOM 摘要卡中，“查看仿真详情”按钮目前仍停留在外链跳转方案，仅记录审计日志并打开外部系统。
- Sprint 6 已实现“查看需求详情”内跳转 → 切换到需求 BOM、定位节点并提供返回路径。用户希望仿真也具备相同体验。
- 现有仿真 BOM 模块（`useSimulationExplorerState` + Explorer 组件族）具备树导航与多维过滤能力，但缺少从设计视图唤起的上下文绑定与返回管理。

## 2. 目标
1. 点击“查看仿真详情”后，在前端内部完成视图迁移：切换到仿真 BOM → 默认停留在结构维度 → 聚焦映射到的仿真实例卡片。
2. 保持与需求跳转一致的交互：记录跳转栈、展示「返回设计 BOM」按钮并支持多级返回。
3. 仅依赖 Mock 数据完成验收，无需后端改动。

**非目标**
- 不实现仿真文件/工况级别的自动定位；聚焦到实例卡片即可。
- 不改动后端 API 或认证链路；仍基于前端 Mock 与本地审计日志。
- 不在本冲刺内引入真实 ID 映射或签名校验。

## 3. 数据与 Mock 策略
- 新增静态映射表（计划：`components/structure/simulation/simulationJumpMap.ts`）：
  ```ts
  interface SimulationJumpTarget {
    simBomRefId: string;          // 设计节点 links.simBomRef.id
    nodeIds: string[];            // 可选，用于多节点共用
    categoryId: string;
    instanceId: string;
    defaultVersion?: string;      // 可选，未提供时落回实例当前版本
  }
  ```
- 初始映射以现有 Mock 数据为准：
  - `SIM-BLD-001` → 结构仿真分类 `sim-structure` 中的 `inst-struct-001`
  - `SIM-BLD-002` → `inst-struct-002`
  - `SIM-HPT-001` → 待确认（若无实例则标记为 TODO）
- 映射缺失时降级策略：仍切换至仿真 BOM，但停留在默认结构导航并提示「暂未配置仿真映射」。
- 将映射文件在文档中登记，并在 Mock 变更时同步更新。

## 4. 交互流程
1. 用户在设计 BOM / Cockpit Tab 中点击「查看仿真详情」。
2. `JumpButton` 记录本地审计日志（无需二次确认、不打开新窗口）。
3. 触发 `onViewSimulation` 回调，传入：
   - `simBomRefId`（优先）或 `nodeId`
   - 源节点 `{ id, name }`
4. `ProductStructure.handleNavigateSimulation`：
   - 根据映射表解析目标实例；
   - 写入跳转栈（与需求跳转结构一致，新增 `simulationInstanceId` 字段）；
   - 设置 `autoTransitionRef`，切换 `selectedBomType='simulation'` 与 `activeTab='simulation'`；
   - 注入一次性状态 `pendingSimulationSelection`（包含 categoryId、instanceId、source 信息）。
5. 仿真 Explorer 在 effect 中消费 `pendingSimulationSelection`：
   - 保障 `activeDimensions` 至少含 `['structure']`；
   - 展开结构路径节点；
   - 选中目标实例节点（无需展开文件夹）；
   - 清空一次性状态，保证后续手动操作不被干扰。
6. 视图顶部展示返回按钮文案：「返回设计 BOM · {来源节点名}」，行为完全复用现有需求跳转逻辑。

## 5. 实现计划
| 步骤 | 描述 | 负责人 | 预计 | 备注 |
| --- | --- | --- | --- | --- |
| 1 | 补充仿真跳转映射表（含单测占位） | FE | 0.5d | Mock-only，可随版本扩充 |
| 2 | 扩展 `XbomSummaryCards` 和 `EbomDetailPanel` 回调链路 (`onViewSimulation`) | FE | 0.5d | 与需求回调保持同等参数风格 |
| 3 | `ProductStructure` 新增 `handleNavigateSimulation` & `pendingSimulationSelection` 状态 | FE | 1.0d | 复用 jumpHistory；确保与需求跳转互不影响 |
| 4 | 在仿真 Explorer 中消费 pending 状态，执行维度展开 & 实例选中 | FE | 1.0d | 如需新增 reducer action，保持向后兼容 |
| 5 | 更新返回按钮展示条件与文案 | FE | 0.5d | 支持需求/仿真两种上下文 |
| 6 | 验证流程 + 撰写验收记录 | FE | 0.5d | 包含空映射提示、双次跳转、返回链路 |

## 6. 验收标准
- 点击仿真按钮后 **不弹出新窗口**，仿真视图自动打开且实例卡片被选中。
- 返回按钮文案显示来源节点名称，点击后恢复至原设计视图（含 Tab、展开状态）。
- 多次跳转叠加时，返回顺序正确（LIFO）。
- 映射缺失时展示兜底提示，不影响其他跳转。
- 记录在案的 Mock 映射覆盖现有 XBOM 摘要卡对应节点。

## 7. 风险与缓解
- **映射缺失/错误**：在映射表中添加注释及单测示例，CI 校验 key 是否存在于 Mock 数据。
- **多维视图冲突**：跳转时强制 `activeDimensions` 包含 `structure`，并在返回后按用户操作更新；必要时保留最后一次用户设置。
- **返回堆栈污染**：在 `clearJumpHistory` 调用点确认仿真跳转也能正确清空；跳转栈条目需标注来源类型。

## 8. 文档与后续
- 本文作为 Sprint 11 计划基线，实施完成后需在此文档更新「实施记录」章节，并在 `docs/ebom-redesign-plan.md` 中追加摘要。
- 若后续接入真实 API，应在 `xbom-identity-map.md` 中扩展仿真 ID 对应关系，并替换前端静态映射。

## 9. 实施记录（待更新）
- _2025-10-xx_：实现中。
