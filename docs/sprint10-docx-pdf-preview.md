# Sprint 10 · DOCX → PDF 在线预览方案

## 背景现状
- 仿真结构模块已支持多版本切换，但 `.docx` 文档仍以原文件下载方式提供，缺少在线预览体验。
- 后端计划在自有文件服务器内完成 DOCX→PDF 转换，现阶段先以 Mock PDF 占位验证前端交互与性能。
- Compare Drawer 与文件预览抽屉均依赖统一的文件展示组件，缺少对 PDF 渲染和版本同步的适配。

## 目标与范围
1. 在仿真实例详情、文件抽屉、Compare Drawer 中提供 PDF 在线预览能力（先行接入 Mock PDF）。
2. 完善数据模型，区分 `docxUrl` 与 `pdfUrl`、`previewStatus` 等字段，确保版本切换及对比场景一致性。
3. 后续可替换 Mock PDF 为真实转换结果，确保方案对真实接口透明、可扩展。

不在本次范围：批注/编辑、权限体系改造（复用当前签名 URL 方案）、移动端 UI 重构。

## 技术路线分析
- **服务端转换 + 前端 PDF.js 渲染（首选）**  
  - 后端：以 LibreOffice headless 或现有转换微服务将 `.docx` 转为 `.pdf` 并缓存；当前阶段用 Mock PDF URL 替代。  
  - 前端：使用 Mozilla PDF.js（通过 `react-pdf` 或 `react-pdf-viewer` 封装）渲染，支持分页、缩放、加载态。  
- **回退选项**  
  - 浏览器原生 `<embed>` 展示：作为兜底，当 PDF.js 初始化失败时提示并提供下载链接。  
  - 批注等高级能力留待评估商业 SDK（Apryse、PSPDFKit），暂不引入。

## 数据契约调整
- `SimulationFile` 扩展字段：
  - `docxUrl: string`（原始文档地址，仅下载用）
  - `pdfUrl?: string`（转换后 PDF 预览地址，Mock 阶段指向静态资源）
  - `previewStatus: 'ready' | 'processing' | 'unavailable' | 'mock'`
  - `convertedAt?: string`（转换完成时间，便于缓存与失效控制）
- 对比队列条目写入 `previewVersion`, `pdfUrl`，避免跨版本混淆。
- API 新增 `GET /simulation/instances/:id/files/:fileId/preview`（可直接返回签名 URL 或 302 重定向至文件服务器）。

## 前端实现规划
- 新建 `components/common/PdfViewer.tsx`（Server Component 包裹 Client Viewer）：
  - 懒加载 `pdfjs-dist`，展示加载 Skeleton、错误提示与下载回退。
  - Prop: `sourceUrl`, `fileName`, `onFail`.
- 在 `SimulationContentPanel`、`SimulationInstanceView`、`SimulationCompareDrawer` 等消费端统一通过 `PdfViewer` 访问 `pdfUrl`。
- Compare Drawer：支持双栏 PDF 预览，Mock 阶段使用相同 PDF 验证缩放/同步滚动策略。
- 加入可观察指标（加载耗时、失败率）以便后续监控。

## 后端与基础设施
- 暂定流程：上传 DOCX → 存储 → 排队转换（Mock 阶段直接返回静态 PDF 路径）。
- 转换完成后写回 `pdfUrl` 与 `convertedAt`，对外暴露短期有效的签名链接。
- 需定义缓存策略：常用文档保留 7 天；版本变更触发刷新。
- 记录转换失败原因，返回 `previewStatus = 'unavailable'` 供 UI 提示。

## 对比/版本场景处理
- 版本切换时优先读取目标版本 `pdfUrl`；若缺失，展示“该版本未生成 PDF 预览”文案并提供下载。
- Compare Drawer 双栏：若任一文件缺少 `pdfUrl`，保留条目但提示只支持下载对比。
- Mock 阶段：提供 2 份示例 PDF（标准版与差异版），覆盖正常与差异对比用例。

## 风险与兜底
- **转换失败/延迟**：UI 提示“正在生成 PDF，稍后重试”，并暴露刷新按钮。
- **大文件性能**：PDF.js 渲染大于 100MB 时需警告；考虑分页/虚拟化或预生成低分辨率缩略。
- **浏览器兼容**：Safari iOS 需测试；失败时回退至原生下载。
- **安全性**: 签名 URL 需绑定用户会话及短时效，禁止跨租户访问。

## 任务拆分
1. **数据层**：后端返回 Mock PDF 字段，更新 TypeScript `SimulationFile` 类型。
2. **组件开发**：实现 `PdfViewer`、在相关视图中接入渲染逻辑。
3. **Compare Drawer**：实现双栏 PDF 预览、Mock 数据接入与交互验证。
4. **兜底体验**：添加加载 Skeleton、错误提示、下载回退。
5. **监控文档**：在 `docs/` 内记录接口、状态枚举与故障流程（当前文档）。
6. **准备真实转换**：评估 LibreOffice 服务部署、缓存与日志方案，为切换真实数据做准备。

## 测试计划
- 功能：加载成功、Mock 返回 `mock` 状态、无 `pdfUrl`、加载失败重试。
- 版本切换：不同版本 `pdfUrl` 切换、缺失兜底。
- Compare Drawer：同一/不同版本双栏对比、一个缺失 PDF。
- 浏览器：Chrome、Edge、Safari（含 iPad）、Firefox。

## 实现状态（2025-10-11）
- 前端完成：`components/common/PdfViewer` 已落地，Simulation File Preview、Compare Drawer 引入同一渲染组件，支持分页、缩放、状态兜底以及 DOCX 下载回退。
- Mock 数据：结构仿真与流体仿真示例补全 `docxUrl` / `pdfUrl` / `previewStatus` / `convertedAt` 字段，使用本地 `/mock/pdf/*.pdf` 静态资源覆盖 `ready`、`mock`、`processing`、`unavailable` 四种态。
- 待办事项：对接后端签名 URL 与真实转换接口，安排 Safari / iPad 兼容验证，并补充转换失败监控上报。

## 前端实现要点（2025-10-11）
- 新增组件 `PdfViewer`（懒加载 `pdfjs-dist`），提供工具栏、缩放、适应宽度、重试及错误态反馈。
- `SimulationFolderView` 增加 PDF 状态徽标；`SimulationFilePreview` 与 `SimulationCompareDrawer` 统一通过 `PdfViewer` 呈现 PDF，缺失时提示下载回退。
- Mock 数据提供示例 PDF（标准版、差异版）与状态组合，便于前端独立验证多场景。
