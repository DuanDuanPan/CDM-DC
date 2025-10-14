# Project Brief: 产品过程数据中心

> 草案版本：0.1（2025-10-14）

## Introduction

本简报用于指导“产品过程数据中心（试验领域）”的立项与MVP落地，明确范围、目标与度量，并作为后续PRD/架构输入的上游文档。

- 工作模式：交互式协同起草（本次选择）
- 输出位置：`docs/brief.md`
- 输入材料：
  - 头脑风暴纪要（`docs/brainstorming-session-results.md`）
  - 你提供的其他补充输入（将按后续章节逐步纳入）
- 能力边界：聚焦“数据中心”的汇聚/标准化/洞察/服务；不包含TDM/现场试验执行与流程控制。
- 近期关注：三大MVP方向（需求验证矩阵；设计×仿真×试验协同看板与模型校准；试验知识图谱）。

（如需更换输出路径或追加背景资料，可在任一章节的征询阶段提出。）

## 项目简介

项目“产品过程数据中心”是面向复杂装备研制的前端原型，当前聚焦“试验领域”的数据汇聚、标准化与洞察展示，提供跨设计/仿真/试验的可视化与分析能力。代码实现为 Next.js App Router 的模块化单页应用，内置多种查看器与对比工具，便于快速验证业务流与交互模式。

### 项目定位
- 服务对象：型号总师、项目经理、设计/仿真/试验/质量等多角色协同。
- 目标价值：打通设计—仿真—试验“连续验证”的证据链，提升需求验证透明度与资料成套性，支撑基线变更与对外交付。
- 能力边界：本项目为数据中心前端原型，聚焦“汇聚/标准化/洞察/服务”；不包含 TDM/现场试验控制与流程执行。

### 关键模块（代码对应）
- 仪表盘 Dashboard（components/dashboard/*）：项目健康、KPI 与近期活动总览。
- 数据探索器 Data Explorer（components/explorer/*）：分面筛选、标签体系与资产列表（示例数据）。
- 产品结构 XBOM/EBOM（components/structure/ebom/*）：EBOM 基线与结构树、摘要卡片、影响分析与评审面板。
- 对比中心 Compare（components/compare/*）：方案/工况/试验-仿真/设计-需求/EBOM 基线差异对比，支持 CSV/PNG 导出。
- 仿真与三维预览（components/structure/preview/*, simulation/*）：
  - PDF 与图片查看（components/common/PdfViewer*.tsx, ImageViewer.tsx）；
  - 在线 3D 查看（online-3d-viewer，occt-import-js，rhino3dm，web-ifc）；
  - VTK 网格预览（vtk.js）。
- 成套性管理（components/completion/*）：按模板统计设计/仿真/试验资料完成度。
- 关系图谱（components/graph/RelationGraph.tsx）：组件关系与状态可视化（示例）。
- 上传管理器/设置（components/upload/*, components/settings/*）：原型级文件队列与配置界面。

### 使用场景示例
- 方案/基线变更评审：在对比中心核对 EBOM 差异、参数/曲线/文档差异并导出证据。
- 需求验证透明化：在结构/对比视图中查看“设计/需求”对齐情况与缺口（示例数据）。
- 资料成套性达标：按模板统计资料完成度，提示缺失项与责任人。

### 数据与集成现状
- 当前为前端原型，使用内置示例/Mock 数据（如 components/structure/ebom/data.ts, simulation/data.ts）。
- 3D 依赖资源通过 `scripts/sync-online3dviewer-assets.js` 同步至 `public/3dviewer`。
- 尚未对接后端域服务（ALM/PLM/试验数据源）；接口与真源将按“项目纪要 附录B”中的 MVP 标准推进。

### 技术栈与配置
- 前端框架：Next.js 15（App Router）、React 19、TypeScript、TailwindCSS。
- 可视化与查看器：recharts、pdfjs-dist、online-3d-viewer、vtk.js、rhino3dm、occt-import-js、web-ifc。
- 构建与脚本：见 `package.json` 与 `next.config.ts`，3D 资源拉取脚本位于 `scripts/`。
