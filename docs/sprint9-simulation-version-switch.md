# Sprint 9 · 仿真详情版本切换方案

## 背景现状

- 仿真 BOM 模块当前只展示实例的最新版本，无法查看历史版本。
- `SimulationInstance` mock 数据仅表达 `version` 与轻量的 `versionHistory` 列表，缺乏多版本内容快照。
- 文件预览、对比、状态筛选等能力都会默认使用“当前版本”数据。

## 目标与范围

1. 在仿真实例详情页提供版本切换入口，允许用户切换到历史版本查看完整上下文。
2. 切换后应更新：实例基础信息、资源指标、亮点、工况、文件夹与文件列表、预览内容等。
3. 保留用户当前选中的文件夹与文件；若目标版本缺失对应条目需要兜底策略。
4. 历史版本支持与最新版本一致的操作（预览、加入对比、下载、打开等）。
5. 对比队列不清空，但需要在项目中标记文件的版本来源。

## 数据模型调整

- 扩展 mock：为每个 `SimulationInstance` 构建 `versions: Record<string, SimulationInstanceSnapshot>`，包含 folders/files/conditions/highlights/资源指标等完整快照。
- 保留 `version` 字段指向“当前版本”，并确保 `versionHistory` 与 `versions` 对齐（含时间、Owner、主要变更）。
- `SimulationFile`、`SimulationFolder` 增加 `belongsToVersion`（或通过外层传入）用于 UI 标识和对比列表。
- 对比项结构（`SimulationFile` copy）增加 `compareVersion` 字段，用于在 Compare Drawer 中展示来源版本。

## 状态管理要求

- `useSimulationExplorerState` 中新增 `selectedInstanceVersion`，默认跟随实例当前版本。
- 切换版本时：
  - 若当前选中 folder 在目标版本不存在，回退到该版本第一个 folder，并提示“已自动跳转到该版本默认文件夹”。
  - 更新分页总数、过滤结果，防止页码越界。
- 保持对比队列、筛选条件不变，仅更新展示数据。

## UI/交互建议

- 将版本切换控件放在 `SimulationInstanceView` 顶部，紧邻标题和“版本 vX.Y”文案。
- 控件形态：
  - 当版本 ≤3：使用分段按钮（Segmented Control）。
  - 当版本 >3：使用带搜索的下拉菜单（默认列出最近 5 个，支持滚动）。
- 切换后局部刷新详情区域；无需额外 loading 遮罩，可使用轻量 skeleton 或渐隐过渡。
- 在文件列表、预览抽屉中通过 badge 显示“版本 vX.Y”，辅助用户识别来源。

## 边界与兜底

- 历史版本缺失某些数据（如 preview mesh）时，用占位提示“历史版本未提供该预览”。
- 若历史版本无文件：
  - 文件夹列表显示空状态“该版本无上传文件”。
  - 预览、对比按钮保持启用但提示“暂无可对比文件”。
- 切换版本后，如进行“打开”“下载”操作，仍引用历史版本数据；后端需在未来支持版本化下载。

## 后续任务拆分

1. **Mock 扩充**：补充 `simulation/data.ts` 多版本快照。
2. **状态与 hooks**：更新 `useSimulationExplorerState` 维护 `selectedInstanceVersion`。
3. **UI 改造**：在 `SimulationInstanceView` 注入版本控件、刷新逻辑。
4. **文件联动**：调整 `SimulationFolderView`、`SimulationFilePreview` 以读取指定版本数据。
5. **对比标识**：在 Compare Drawer 中显示 `compareVersion`。
6. **验证 & 文档**：更新需求文档、准备测试用例覆盖多版本切换、空数据、对比队列持久等场景。

## 实现状态（2025-10-11）

- 数据模型现已为每个仿真实例准备 `versions` 快照，历史版本缺失文件/文件夹时提供兜底提示，并在 UI 中展示 "该版本未上传任何文件" 等消息。
- `useSimulationExplorerState` 新增 `selectedInstanceVersions` 与版本切换通知，缺失节点时自动回退并在实例卡片内显示提示，可手动关闭。
- `SimulationInstanceView` 提供分段/下拉两种版本切换控件，资源、工况、文件夹等信息随版本联动；文件夹卡片、列表、预览均显示所属版本。
- Compare Drawer 保留跨版本文件，同时在条目徽章上标注来源版本，便于追溯；加入对比、批量加入流程均写入 `compareVersion`。
- 空数据与无匹配情形覆盖历史版本文案，确保切换后用户能理解当前版本数据状态。

---
@2025-10-11
