# 变更记录（Changelog）

> 项目：产品过程数据中心 · 试验BOM增强｜维护：文档基线

## 2025-10-15 · v0.2 · 冻结（Frozen）
- PRD（docs/prd.md）升级为“评审基线 v0.2（冻结）”，并结构化扩展：
  - 将 Story 1.9（EBOM 结构视图：试验挂接入口与徽标）归位到第 8 章，与 1.1–1.8 并列。
  - 新增第 11–14 章：NFR、部署与运维、代码组织与规范、开放问题与术语表。
  - 架构概览补充“入口现状：复用已预留‘跳转 试验BOM’按钮承载深链参数”。
- UI 规范：
  - 新增 docs/tbom-ui-spec.md，定义 EBOM 树挂接入口/徽标/深链（含过渡方案与计划新增项）。
  - 更新 docs/ebom-cockpit-ui-spec.md，指向 TBOM UI 规范并注明已预留入口位置。
  
#### v0.2.1 · 文档更新（不改代码）
- PRD（docs/prd.md）新增并提前“Story 1.1 测试基座（技术）”，其余故事顺延（原 1.1→1.2，…，原 1.9→1.10）。
- 新增技术故事文件：docs/stories/STORY-1.1-testing-baseline.md。

#### v0.2.2 · 文档更新（不改代码）
- PRD（docs/prd.md）按 Must-fix 增补：
  - 新增 Story 1.2 “Tailwind 工具链统一（技术）”、Story 1.3 “Mock API 出口与服务封装（技术）”；
  - 相应顺延后续故事编号至 1.12；
  - 里程碑节将工程基座拆为独立里程碑（M2）。

#### v0.2.3 · 工具链统一（代码+文档）
- 移除 `@tailwindcss/postcss` 等 Tailwind v4 生态包，锁定 `tailwindcss@3.4.17`、`postcss@8.4.47`、`autoprefixer@10.4.21`。
- 更新 README 与 `docs/ui-architecture.md`，明确“Tailwind v3 冻结与升级流程”及禁止事项。
- 运行 `npm run lint`、`npm run build`、`npm run dev -- --port 3100` 验证构建链一致性。

### Front-End Spec（UI/UX） · v0.2 · 冻结（Frozen）
- 新增 docs/front-end-spec.md 并冻结为评审基线 v0.2：
  - IA：站点地图、导航结构（侧边栏主导航 + 模块内二级导航）、权衡与假设。
  - User Flows：
    - 3.1 XBOM→TBOM 深链过滤（Mermaid）
    - 3.2 最小上载导入向导（Mermaid）
    - 3.3 运行详情→Compare（试验/仿真）→证据导出（Mermaid）
  - 视觉系统：色板/排版/图标/间距（对齐 Tailwind 使用）。
  - 可访问性：WCAG 2.1 AA 要求与测试策略。
  - 响应式策略：断点与适配模式。
  - 动效与微交互：原则与关键动效建议。
  - 性能：目标与设计策略（分块/抽稀/Worker/虚拟滚动等）。
  - 下一步：线框任务清单与交接检查表。

### Frontend Architecture（UI Architecture） · v0.2 · 冻结（Frozen）
- 新增 docs/ui-architecture.md 并冻结为评审基线 v0.2：
  - 1 模板/框架结论（沿用 Next.js 15 + React 19 + TS + Tailwind，冻结 Tailwind v3 工具链）。
  - 2 技术栈（补充 fetch+Zod、Visualization 重库懒加载/路由级拆分、HTTP 轻封装）。
  - 3–10 章节：项目结构、状态管理、API 封装、路由与拆分边界、样式约定、测试矩阵、环境变量、开发者规范。
  - 不含代码改动，仅文档更新；与 PRD v0.2 与 front-end-spec v0.2 协同一致。

### ADR（Architecture Decision Records） · 新建索引与草案
- 新建 `docs/architecture/adr-000-index.md`（索引）。
- 计划新增（Accepted）文档：
  - ADR-0001 Tailwind v3 冻结与升级窗口
  - ADR-0002 HTTP 客户端：原生 fetch + 轻量封装 + Zod 解析
  - ADR-0003 重库动态引入与拆分边界
  - ADR-0004 Mock API 出口：Route Handlers vs 静态文件
  - ADR-0005 Compare 口径对齐策略（单位/采样率/重采样）

补充：
- 在 docs/ui-architecture.md 添加“附录 A · 评审走查清单（前端 · Mock）”；
- 在 docs/front-end-spec.md 引用该附录，便于评审时快速查阅。

## 2025-10-15 · v0.1 · 草案（Draft）
- PRD（docs/prd.md）首版：现状分析、范围界定、架构影响、Epic 与 Story 1.1–1.8、里程碑与风险。
- 契约与样例：
  - 新增 docs/tbom-contract.md（v0.1）：层级模型、最小上载契约、通道字典（结构振动：ACC/PSD/FRF/COH）。
  - 新增 docs/mocks/tbom/*：project/test/run、时序/事件/卡片/附件等示例数据。

> 说明：若仅文档调整（无代码改动），按补丁版本记录至下一次 v0.x 变更；代码实现阶段将另起实现版本轨迹。
