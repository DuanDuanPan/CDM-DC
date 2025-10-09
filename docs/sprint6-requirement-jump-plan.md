# Sprint-6 · 需求视图跳转联动设计

更新日期：2025-10-09  
责任人：前端 - Codex 支持

---

## 1. 背景
- 设计 BOM 右侧的 XBOM 摘要卡提供需求、仿真、试验等快速入口，但目前「查看需求详情」只是停留在当前视图。
- 型号师期望点击需求摘要后，直接切换到需求 BOM 并定位相关节点，同时在需求视图里提供一键返回设计视图的能力。
- 需要兼顾现有视图偏好（localStorage）与用户在需求视图内的自定义操作，避免引入状态错乱。

## 2. 目标 & 非目标
**目标**
1. 从 XBOM 摘要点击需求详情时，自动切换到需求 BOM → 需求视图，并定位需求树节点。
2. 提供可多级返回的按钮，恢复到触发跳转前的 BOM 类型 + Tab + 选择节点。
3. 避免覆盖用户本地的视图偏好；当用户在需求视图内主动切换模块时，跳转状态失效。

**非目标**
- 不改动需求视图本身的数据结构、过滤器或角色分类。
- 不渲染需求列表高亮，仅定位需求树节点即可。
- 不涉及后端接口调整，全部基于前端状态。

## 3. 流程概览
1. XBOM 摘要中的需求卡触发 `onViewRequirement({ requirementIds, sourceNodeId })`。
2. `EbomDetailPanel` 上抛事件至 `ProductStructure`，写入跳转栈。
3. `ProductStructure` 保存当前视图（BOM 类型、Tab、选中节点），然后：
   - 设置 `selectedBomType = 'requirement'`。
   - 设置 `activeTab = 'requirement'`（不落地到 localStorage）。
   - 将 `pendingRequirementFocus = requirementIds[0]`。
4. 需求视图渲染完成后，树组件通过暴露的 Effect / ref，滚动并选中 `pendingRequirementFocus`，随后清空该字段。
5. 需求视图顶部展示「← 返回设计 BOM」按钮，按钮文本包含来源节点名。
6. 用户点击按钮时，从跳转栈弹出最近一条记录，恢复 `selectedBomType`、`activeTab`、`selectedNode`。若栈为空或记录的 `fromBomType` 已被用户覆盖，则隐藏按钮。
7. 若用户在需求视图内手动切换 BOM 类型 / 模块，自动清空跳转栈并隐藏返回按钮。

## 4. 状态管理设计
```ts
type JumpEntry = {
  fromBomType: BomType;
  fromTab: string;
  fromNodeId: string | null;
  requirementIds: string[];
  sourceNodeId: string | null;
  createdAt: number;
};

const [jumpHistory, setJumpHistory] = useState<JumpEntry[]>([]);
const [pendingRequirementFocus, setPendingRequirementFocus] = useState<string | null>(null);
```
- 新增 `pushJump(entry)` / `popJump()` 辅助方法，封装入栈出栈逻辑。
- 当手动切换任意 BOM / Tab 时，调用 `clearJumpHistory()`。
- `pendingRequirementFocus` 用于一次性驱动需求树定位，在成功定位后置 `null`。

## 5. 需求树定位与 API
- `RequirementDetailPanel` 或其树组件增加 `focusRequirement(id: string)` 方法。
- 对外暴露 ref 或在 props 增加 `focusRequirementId?: string`。
- 内部 useEffect 监听，当 `focusRequirementId` 变更时：
  1. 展开树节点（若尚未展开）。
  2. 滚动定位并调用现有的选中逻辑。
  3. 触发一次高亮动画（可选）。

## 6. UI 调整
- 在需求视图顶部导航右侧新增返回按钮区域，仅当 `jumpHistory.length > 0` 且 `activeTab === 'requirement'` 时显示。
- 按钮样式：`ri-arrow-left-line` + “返回设计 BOM” + 来源部件名。
- 在返回按钮右侧提供一个 “保持在需求视图” 的 close icon（可选），用户可以主动清空跳转上下文。

## 7. 持久化策略
- 现有 `setStoredTabPreference` 仅在用户主动切换 Tab/BOM 时调用；跳转流程中避免调用，确保偏好不被覆盖。
- 返回后恢复原来的 BOM / Tab，再按原逻辑写入 localStorage。

## 8. 多级跳转栈
- 每次从 XBOM 点击都会 push 一条记录。
- 返回按钮文案显示最近一条来源信息；点击后 pop 并恢复状态。
- 若用户连续点击需求卡进入需求视图，返回按钮应逐条弹出，直至回到最初的设计视图。
- 新增开发者调试日志（`console.debug`) 输出栈长度，便于后续排查。

## 9. 组件改动清单
1. `components/structure/ebom/XbomSummaryCards.tsx`
   - 新增 `onViewRequirement` 回调。
2. `components/structure/ebom/EbomDetailPanel.tsx`
   - 接收回调并调用新 props `onNavigateRequirement`.
3. `components/structure/ProductStructure.tsx`
   - 新增栈状态、跳转处理、返回按钮 UI。
   - 调整视图切换与偏好存储逻辑。
4. 需求树组件（`RequirementDetailPanel` 及其子组件）
   - 添加定位 API。
5. 样式：新增返回按钮、提示条 CSS。

## 10. 测试计划
- **单场景**：从设计视图跳转 → 定位 → 返回，确认状态恢复正常。
- **多级跳转**：连续点击不同节点的需求，验证返回顺序与定位。
- **用户干预**：跳转后在需求视图手动切换到仿真 BOM，应自动清空返回按钮。
- **状态持久化**：刷新页面后确认 localStorage 中的 Tab 偏好未被强制写入需求视图。
- **空数据**：当需求 ID 对应节点不存在时，需 graceful fallback（弹 toast 或保持现状）。

## 11. 风险与缓解
- **需求树不支持目标 ID**：如现有数据结构缺字段，需先同步 `requirementsByNode` 对应 ID 映射。
- **滚动性能问题**：需求树规模较大时定位可能产生卡顿，必要时引入 `requestAnimationFrame` 节流。
- **多视图竞争**：若未来引入 cockpit → 需求跳转，需在栈 entry 中记录来源类型以便提示。

## 12. 时间安排（建议）
| 阶段 | 工作内容 | 预计耗时 |
| --- | --- | --- |
| Day 1 | 状态管理与跳转栈实现，API 调整 | 1.5d |
| Day 2 | 需求树定位、返回按钮 UI、样式完善 | 1.5d |
| Day 3 | 联调、回归测试、文档更新 | 1d |

> 文档同步：完成开发后在本文件追加实施结果，并同步 `docs/ebom-redesign-plan.md` 附录。

## 13. 实施记录（2025-10-09）
- ✅ `ProductStructure` 引入前端跳转栈，记录触发视图的 BOM 类型、Tab、节点与展开状态，支持多级返回并在 console 输出栈深度调试信息。
- ✅ XBOM 摘要卡的「查看需求详情」按钮改为调用 `onViewRequirement`，使用与 `requirementsByNode` 一致的 Mock ID，并透传来源节点名称以供返回按钮展示。
- ✅ `ProductStructure` 自动切换到需求视图时不写入本地偏好，展开并滚动到目标需求节点；顶部新增返回按钮和清空入口。
- ✅ `RequirementDetailPanel` 支持 `focusRequirementId`，滚动并高亮目标需求卡片，定时淡出；父组件在 `onFocusHandled` 后清除一次性状态。
