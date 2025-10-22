# 变更记录（Changelog）

> 项目：产品过程数据中心 · 试验BOM增强｜维护：文档基线

## 2025-10-21 · Story 1.7 · Import Wizard
- 前端实现：新增 `components/tbom/import/TbomImportWizard` 导入向导、`useTbomImportState` 状态钩子与工具栏入口，覆盖契约选择、文件校验、映射确认、导入摘要与日志回看。
- 服务与 Mock：新增 `services/tbom-import.ts` 封装导入接口，Mock Route `/api/mock/tbom/import` 支持 FormData 上传、内存合并与导入日志返回；Mock 读取函数引入覆盖写入能力。
- UI 集成：`components/structure/ProductStructure` 注入“导入数据包”工具面板、最近日志摘要与向导挂载；运行详情在导入成功后刷新 TBOM 数据。
- 文档与样例：`docs/tbom-contract.md` 升级至 v0.4，补充导入流程、错误码、ZIP 结构与日志示例；`docs/changelog.md` 记录 Story 1.7，Mock 数据说明同步更新。
- 测试：新增 `components/tbom/__tests__/TbomImportWizard.test.tsx` 覆盖向导基础交互，确保契约选择与步骤跳转可用。

## 2025-10-20 · Story 1.6 · Run Detail Experience
- 前端实现：新增 `components/tbom/detail/TbomRunDetail` 浮层组件，承载运行元数据卡、迷你曲线预览、异常事件时间轴以及附件懒加载预览；`TbomNodeDetail` 改为以按钮打开浮层并保持键盘可达与 `aria-live` 提示。
- 数据与服务：扩展 Mock Route（`/tbom/attachments/:runId`、`/tbom/test-card/:runId`）返回 JSON，前端通过 `services/tbom.ts` 解析 CSV（events/timeseries）并推导单位/采样率统计；抽取 `utils/csv.ts` 复用 CSV 解析逻辑。
- Compare 对接：运行详情将所选通道写入 `localStorage.tbomComparePayload`，`CompareCenter` 监听 storage 事件并展示“来自 TBOM 的运行上下文”提示卡，可刷新与清除载荷。
- 文档更新：`docs/ui-architecture.md` 增补运行详情浮层与 Compare 载荷传递方案、Mock API 扩展说明；`docs/changelog.md` 记录 Story 1.6 进展。

## 2025-10-16 · v0.3 · Draft（进行中）
### 2025-10-20 · 文档更新（角色与 XBOM）
- 新增《数字线索 · 角色体系与 XBOM 关系》（docs/digital-thread-roles-xbom.md），从型号总师与工业软件方案视角，梳理角色职责、读写边界、与 XBOM 的映射契约与度量体系，并提出交互落地建议（模块首页、XBOM 视图、角色化入口、证据统一抽屉）。
- `/tbom` 结构导航页上线：通过深链或直接访问进入，大纲支持类型/状态筛选、深链自动展开与 aria-live 公告；左侧导航暂不展示独立入口。
- 新增移动端抽屉式“关联与跳转”面板，桌面端保留三列布局；错误态提供重试按钮并记录 `console.warn`。
- `app/page.tsx` 在接收 `?from=ebom` 深链时提示并引导跳转到 `/tbom` 专用页面。
- `docs/ui-architecture.md` 更新状态管理章节，补充 `/tbom` 布局、深链与错误处理说明。

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

#### v0.2.4 · Mock API 出口与服务封装
- 新增 `app/api/mock/tbom/*` Route Handlers，读取 `docs/mocks/tbom/` 中的 JSON/CSV，支持 timeseries 404 兜底。
- 新增 `services/http.ts`（原生 fetch + Zod 校验封装）与 `services/tbom.ts`，统一对外服务函数。
- 提供 `.env.example`，并在 README 说明 Mock API 所需环境变量；Story 1.3 标记为 Ready for Review。
- 调整 `next.config.ts` 至 `output: 'standalone'`，以便在开发/构建阶段运行 Mock API Route Handlers。

#### v0.2.5 · TBOM 契约与样例扩充
- `docs/tbom-contract.md` 升级为 v0.2，补充字段表、跨域追溯键、示例与校验策略。
- `docs/mocks/tbom/` 增加第二套 Project/Test/Run 数据及对应 CSV（时序、事件、试验卡、附件），确保引用自洽。
- 新增 `components/tbom/types.ts` 提供 TBOM Zod schema/type，`services/tbom.ts` 复用并增加 `groupRunsByProject`、`listRunsByEbomNode`。
- 新增 `scripts/verify-tbom-data.ts` 校验脚本及 `npm run verify:tbom` 命令，README 增补执行方式。
- v0.2.5.1：契约新增 `run.status` 字段及枚举，Mock 数据和 schema 同步支持状态筛选，并提供 `filterRunsByStatus` 辅助函数。

### Front-End Spec（UI/UX） · v0.2 · 冻结（Frozen）
- 新增 docs/front-end-spec.md 并冻结为评审基线 v0.2：
  - IA：站点地图、导航结构（侧边栏主导航 + 模块内二级导航）、权衡与假设。
  - User Flows：
    - 3.1 XBOM→Test Tab 深链过滤（Mermaid）
    - 3.2 最小上载导入向导（Mermaid）
    - 3.3 运行详情→Compare（试验/仿真）→证据导出（Mermaid）
  - 视觉系统：色板/排版/图标/间距（对齐 Tailwind 使用）。
  - 可访问性：WCAG 2.1 AA 要求与测试策略。
  - 响应式策略：断点与适配模式。
  - 动效与微交互：原则与关键动效建议。
  - 性能：目标与设计策略（分块/抽稀/Worker/虚拟滚动等）。
  - 下一步：线框任务清单与交接检查表。
- 2025-10-16 更新（v0.3-draft）：试验BOM 视图内嵌 XBOM `Test` Tab，调整导航/用户流程/导入向导与深链说明，Mermaid 流程同步更新。

### Frontend Architecture（UI Architecture） · v0.2 · 冻结（Frozen）
- 新增 docs/ui-architecture.md 并冻结为评审基线 v0.2：
  - 1 模板/框架结论（沿用 Next.js 15 + React 19 + TS + Tailwind，冻结 Tailwind v3 工具链）。
  - 2 技术栈（补充 fetch+Zod、Visualization 重库懒加载/路由级拆分、HTTP 轻封装）。
  - 3–10 章节：项目结构、状态管理、API 封装、路由与拆分边界、样式约定、测试矩阵、环境变量、开发者规范。
  - 不含代码改动，仅文档更新；与 PRD v0.2 与 front-end-spec v0.2 协同一致。
- 2025-10-16 更新：路由章节改为 XBOM 单页内 Tab 嵌入试验视图，明确深链参数与 Feature Flag 回滚策略。

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
