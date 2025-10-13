# 冲刺13：对比栏体验增强

更新时间：2025-10-13

## 1. 功能概览
- **混合对比布局**：卡片统一 `px-5 / py-4`、`gap-4`，标题附类型徽章与版本信息；对卡片容器添加 `tabIndex` 与 `aria-labelledby`。
- **3D 视角同步**：新增 `CompareSyncContext`，默认开启；全局工具栏提供“同步视角”按钮（支持关闭）。`EbomModelViewer` 监听 `camera-change` 广播并应用。
- **图片预览模式**：`ImageViewer` 支持 `单图/滑块/并排/差异` 四模式，最大化时按钮切换为“退出”，并在徽章中展示当前模式。
- **PDF 浮层控件**：`PdfViewerClient` 将分页/倍率控件改为右上角浮层，新增 `90%/100%/125%` 预设，保留“适应宽/复位”。
- **本地资源**：STEP 默认使用 `/models/cfm56-fan-case.glb` 与缩略图，移除外网依赖。

## 2. 关键路径
- `components/structure/simulation/SimulationCompareDrawer.tsx`
  - 新增同步上下文 Provider、性能打点（`compare:items-update:*`、`compare:maximized`）。
  - 全局工具栏加入“同步视角”按钮，chip 列表移除时提供 `aria-label`。
- `components/structure/simulation/SimulationPreviewContent.tsx`
  - 调整几何信息展示为徽章；传递 `comparisonSources` 至图片 viewer；STEP Fallback 改为本地模型。
- `components/structure/ebom/EbomModelViewer.tsx`
  - 接入同步上下文，监听/广播 camera 状态。
- `components/common/ImageViewer.tsx`
  - 新增模式状态机、滑块实现、并排/差异布局；按钮 `aria-pressed`。
- `components/common/PdfViewerClient.tsx`
  - 控件浮层化，缩放预设按钮；简化信息栏。

## 3. 性能与可观测性
- 打点：`performance.mark('compare:items-update:N')`、`performance.mark('compare:maximized')`。
- 图像/3D 控件仍为客户端渲染；同步广播透传字符串属性（camera-orbit/target/field-of-view）。
- 无新增第三方依赖。

## 4. 后续 TODO
- 卡片“更多”菜单接入实际操作（重置视角、导出单卡等）。
- 支持 3D 同步时暂停后台卡片渲染（IntersectionObserver）。
- 将 PDF 浮层控件移动到 `PdfViewer` 外层以便复用。
- 整合导出功能（拼图/CSV）。
