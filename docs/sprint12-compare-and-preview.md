# 冲刺 12：对比能力与预览体验改造

更新时间：2025-10-13 11:40

## 目标与范围
- 允许“混合类型”文件进入对比栏，按加入顺序逐卡渲染对应预览，不再强制同类文件才能对比。
- 修复 PDF 预览在弹窗与最大化模式下无法向下滚动的问题，保证可阅读性。
- 梳理几何（STEP）与有限元网格（FEM）的职责边界：几何=轻量 3D 预览，网格=VTK 预览；杜绝同卡双重展示。
- 最大化场景下的内容占比提升：卡片内容尽可能撑满视区，同时在底部预留 10px 缓冲。

不在本次范围：3D 联动视角、导出拼图/CSV、图片滑块在单卡的统一化（已列为下一步工作）。

## 关键改动

### 1) 对比栏混合渲染（保留 result 专用对比）
- 文件：`components/structure/simulation/SimulationCompareDrawer.tsx`
- 逻辑：
  - 当 `items` 全为 `result` 时，保留“曲线叠加 / 图像滑块 / KPI”高级对比。
  - 其他情况（包含混合类型或单一类型非 result）：调用通用渲染 `renderGenericGrid()` 逐卡渲染。
- 实现要点：
  - 归一化工况：根据共享/活动工况将 `conditionVariants` 合并到 `item.preview`（对齐单卡预览行为）。
  - 栅格：`md:grid-cols-2 / xl:grid-cols-3`，卡片容器 `flex-1 min-h-0` 以撑满竖向空间。
  - 最大化：动态计算 `viewerHeight = Math.max(window.innerHeight - 210, 400)`，并给面板与内容容器增加 `pb-[10px]` 以保留底部 10px 缓冲。
  - Bug 修复：工具栏遗留的 `view` 未定义，统一替换为 `currentView`。

### 2) 预览职责拆分（STEP vs FEM）
- 文件：
  - `components/structure/simulation/SimulationPreviewContent.tsx`
  - `components/structure/simulation/SimulationFilePreview.tsx`
- 变化：
  - 移除旧的“几何卡片内固定附带 VTK 网格”逻辑，几何与网格不再同卡展示。
  - 根据扩展名与 `viewerUrl` 判定轻量 3D 或 FEM 网格；轻量 3D 用 `EbomModelViewer`，网格用 `VtkMeshViewer`（仅在网格类型时渲染）。

### 3) PDF 预览滚动修复
- 文件：`components/common/PdfViewer.tsx`
- 调整：将容器 `overflow-hidden` 改为 `overflow-auto`（base 与 overlay 两处），维持固定视口高度，内部 Canvas 可滚动。

### 4) 静态三维资源接入与占位
- 路径：`public/models/`
- 资源：
  - `cfm56-fan-case.glb` + `cfm56-thumb.jpeg`（风扇机匣装配，替换原“宇航员”占位）。
  - `rotor67-tipgap.glb`（NASA Rotor67 叶片 tip-gap，便于叶片几何示例）。
- 数据接入：
  - `components/structure/simulation/data.ts` 中用本地资源替换远程链接，消除 CORS 和外网依赖。
  - 去除 STEP 项的 `nodes/elements` 占位统计，避免被误判为 FEM，从而重复展示。

### 5) 最大化体验增强
- 文件：
  - `components/structure/ebom/EbomModelViewer.tsx` 新增 `height` 属性；
  - `SimulationPreviewContent` 透传 `height` 以适配最大化。
- 容器：最大化 overlay 外层与通用渲染容器统一 `pb-[10px]`，避免内容贴底。

## 路径与组件清单
- 对比栏（全局）：`components/structure/simulation/SimulationCompareDrawer.tsx`
- 单卡预览：`components/structure/simulation/SimulationPreviewContent.tsx`
- PDF：`components/common/PdfViewer.tsx`
- 3D 轻量：`components/structure/ebom/EbomModelViewer.tsx`
- 图片：`components/common/ImageViewer.tsx`

## 验收标准（UAT）
1. 混合类型（STEP + PNG + PDF）加入对比栏时，按顺序逐卡渲染；最大化后每卡高度自适应且底部预留 10px。
2. 仅 result 类型时，仍可切换“曲线/图像”视图，曲线叠加与图像滑块正常；无曲线时自动回退到图像视图。
3. STEP 卡只显示 3D 模型，不再附带“有限元网格预览”卡片；网格文件（如 .msh）才显示 VTK 网格预览。
4. PDF 预览在弹窗与最大化中都可以垂直滚动，缩放百分比、页码与下载按钮正常。
5. 离线/内网环境下，三维轻量模型能稳定加载（使用 `public/models` 下本地资源）。

## 回归与风险
- 3D 占用：GLB 体积较大时，最大化多卡同屏可能造成 GPU 压力；建议启用“仅当前激活卡 auto-render，其余暂停”的优化（后续）。
- 外链依赖：`occt-import-js` 仍通过 CDN 按需加载（仅 STEP/IGES 导入时）；可按需下沉到本地静态目录以彻底离线化（后续）。

## UI/UX 建议（本次已部分落地，详见后续迭代）
- 信息层级：Header 显示文件名与版本，指标（节点/单元）改为紧凑徽章；说明文字减弱、hover/tooltip 展开详情。
- 工具聚拢：卡片仅保留“重置/最大化/更多”，Mock/剖切等次要控件折叠到更多菜单。
- 统一数字格式：大数值 K/M 缩写、`tabular-nums` 等宽数字，便于跨卡对齐。
- 可访问性：所有按钮补充 `aria-label`，焦点可见 `focus:ring`，满足 WCAG AA 对比度。

## 指标与追踪
- 任务完成后应观察：
  - 预览可见区域占比（最大化）≥ 85%。
  - 典型场景 TTI：2 卡混合时 < 2.5s；6 卡混合时 < 4s（受资源大小影响）。
  - 交互错误率：对比栏相关异常（未定义变量、滚动失败等）为 0。

## 下一步（冲刺 13 建议）
1. 3D 联动视角（全局“同步视角”开关）。
2. 导出对比：拼图截图与 KPI/指标 CSV。
3. 图片单卡最大化补齐“滑块/并排/差异”模式，与 result 图像对比一致。
4. 本地化 `occt-import-js` 资源，完全离线渲染 STEP/IGES。

---

### 变更记录（路径与说明）
- `SimulationCompareDrawer.tsx`：新增通用渲染、最大化高度与底部 10px 缓冲、`currentView` 修正。
- `SimulationPreviewContent.tsx`：几何/网格分流，传递 `height`，清理冗余描述。
- `PdfViewer.tsx`：`overflow-auto` 修复滚动（base/overlay）。
- `EbomModelViewer.tsx`：新增 `height` 属性，适配最大化。
- `data.ts`：使用本地 GLB 资源；移除 STEP 的网格统计字段，避免重复渲染。

