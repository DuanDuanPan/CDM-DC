# Frontend Architecture Document — 产品过程数据中心（试验BOM增强）

> 输出目的：为前端实现提供架构级约束与可执行指引，使之与 PRD v0.2（冻结）与 UI/UX 规范保持一致，便于工程落地与 AI 开发辅助。
> 信息来源：docs/prd.md（v0.2 冻结）、docs/front-end-spec.md（v0.2 冻结）、当前代码（Next.js 15 App Router / TS / Tailwind）
> 版本：评审基线 v0.2（冻结）｜日期：2025-10-15

---

## 1. Template and Framework Selection

现有代码已采用 Next.js 15（App Router）+ React 19 + TypeScript + TailwindCSS 的工程骨架，组件按领域分布于 `components/`，顶层路由位于 `app/`。无第三方 UI 组件库与全局状态库，优先使用 React Hooks/Context 与模块内局部状态；样式以 Tailwind 实用类为主，图标库采用 Remix Icon。

- 结论：沿用既有代码骨架，不引入新的前端脚手架或 UI 模板；TBOM 相关视图作为新增模块并与 XBOM 共用设计体系。
- 影响与约束：
  - 路由：继续使用 App Router（碎片化加载、Server/Client 组件分层）。
  - 构建：开发阶段 Turbopack、产物构建使用 Next 构建与 SWC；新增依赖须在 PR 中说明包体影响。
- 样式与组件：Tailwind + 自研组件/模式，禁用重型 UI 套件避免样式冲突与包体放大。
  - 样式与组件：Tailwind + 自研组件/模式。当前迭代冻结在 Tailwind v3 工具链，避免与 @tailwindcss/postcss ^4（v4 生态）并存；如需升级，另行规划窗口。
  - 状态：优先 Hooks/Context；跨页弱共享可用 URL/LocalStorage；仅在明确需要时评估引入轻量库。

### Change Log
| Date | Version | Description | Author |
|---|---|---|---|
| 2025-10-15 | v0.1 | 初始化：基于现有代码确定框架与模板策略 | Architect |
| 2025-10-15 | v0.2（冻结） | 冻结评审基线：新增 3–10 章（结构/状态/API/路由/样式/测试/环境/规范） | Architect |

---

## 2. Frontend Tech Stack（候选填充，待确认）

下表基于当前仓库与规范提案预填，支持评审后微调。

| Category | Technology | Version | Purpose | Rationale |
|---|---|---|---|---|
| Framework | Next.js (App Router) | 15.3.2 | 路由/SSR/编译管线 | 与现有项目一致；Server/Client 组件分层；生态成熟 |
| UI Library | 自研组件 + Remix Icon | — | 视图与图标 | 无第三方 UI 套件，减少冲突与包体 |
| State Management | React Hooks/Context | React 19 | 局部/提升状态 | 复杂度可控；避免额外依赖与水合负担 |
| Routing | Next.js App Router | 15.x | 文件路由/并行/拦截 | 与现有结构一致，易扩展 TBOM 路由段 |
| Build Tool | Next Build（SWC/Turbopack） | 15.x | Dev/Build | 官方工具链，构建稳定；Dev 热更快 |
| Styling | TailwindCSS | 3.4.x | 原子化样式 | 统一设计语言；与现有文件风格一致 |
| Testing | RTL + Playwright（拟引入） | 最新 LTS | 组件/端到端 | 契合 App Router 测试实践；未来接入 CI |
| Component Library | 内部 `components/common/*` | — | 共享基元 | 复用/扩展现有原子组件，避免重复 |
| Form Handling | React Hook Form + Zod（拟引入） | 最新 LTS | 表单与模式校验 | 轻量、与 TS 友好；契约校验可复用 |
| Animation | CSS Transitions（首选） | — | 基础动效 | 性能友好；满足 reduced motion 降级 |
| Dev Tools | TypeScript / ESLint / Tailwind | TS 5.x / ESLint 9.35 / 3.4 | 质量与开发体验 | 与现有工程一致，规则可复用（可选：提交前格式化） |
| HTTP Client | 原生 fetch + 轻量封装（含错误规范化与 Zod 解析） | — | HTTP 调用/错误模型 | 降包体，统一错误与类型解析 |
| Visualization | recharts / pdfjs-dist / online-3d-viewer / vtk.js / rhino3dm / occt-import-js / web-ifc | 各自版本 | 图表/文档/3D/IFC | 强制懒加载与路由级拆分 |

Rationale：遵循“先复用、后扩展”原则，尽量减少新增库；测试与表单库后续按优先级引入以支撑导入向导与关键交互的可测性。

（本节为交互式确认项，见下方选项）

---

## 3. Project Structure（目录与文件放置）

目标：在不改动现有单页编排的前提下，为 TBOM 相关实现提供清晰落位与边界，便于动态拆分与测试。

建议结构（仅文档约束，本迭代不强制改代码）：

```
app/
  layout.tsx                # 共享布局（Server）
  page.tsx                  # 模块编排（Client，现有）

components/
  common/                   # 共享原子组件（按钮、表格、徽标、空/错态等）
  dashboard/ …
  explorer/ …
  structure/                # XBOM（现有）
    ebom/ …                 # EBOM 面板与工具
  compare/ …
  upload/ …
  completion/ …
  graph/ …
  settings/ …

  tbom/                     # 新增（本迭代仅占位与文档约束）
    structure/              # Type→Project→Test→Run 树与筛选（Client）
    detail/                 # Run 详情（记录/结果/事件/附件）（Client）
    import/                 # 导入向导（Client）
    services/               # fetch 封装与契约解析（Server/Client 皆可）
    hooks/                  # 状态钩子：filters、deep-link、import-state（Client）
    types.ts                # TBOM 类型与 Zod 模式
    __tests__/              # 组件/hooks 的 RTL 用例

docs/
  tbom-contract.md          # 契约（已存在）
  mocks/tbom/               # 样例包（已存在）
```

边界与约定：
- 重库（pdfjs-dist / online-3d-viewer / vtk.js / rhino3dm / occt-import-js / web-ifc）一律仅在对应叶子组件内动态 import，不得在顶层静态引入。
- TBOM 目录内的 UI 组件默认为 Client 组件；数据服务和契约校验可在 Server 端执行但需保持无副作用、可在浏览器执行（原型阶段）。
- 运行状态：`tbom_run.status` 提供 `planned/executing/completed/aborted` 四种状态，契约见 `docs/tbom-contract.md`，供 Story 1.5 的筛选与徽标展示使用。
- 共享样式与视觉变量优先使用 Tailwind + CSS vars（见样式章节）。

---

## 4. State Management（最小状态模板）

目标：不引入全局状态库，利用 URL 参数 + 轻量本地缓存 + Hooks/Context 实现 TBOM 过滤、深链与 Compare 载荷传递。

约定：
- URL 参数：`from=ebom&node=<ebom_node_id>&path=<ebom_path>`；TBOM 读取后应用“按结构节点过滤”。
- 本地缓存键：`tbom.filters`（JSON）、`tbom.lastNode`；保留最近选择，便于刷新场景。

示例（仅文档，供实现时参考）：

```ts
// hooks/useTbomFilters.ts
import { useMemo } from 'react';

export type TbomFilters = {
  node?: string | null;     // ebom_node_id
  type?: string | null;     // 试验类型
  status?: string | null;   // 运行状态
};

export function useTbomFilters(): [TbomFilters, (p: Partial<TbomFilters>) => void] {
  if (typeof window === 'undefined') return [{}, () => {}];
  const params = new URLSearchParams(window.location.search);
  const initial: TbomFilters = {
    node: params.get('node'),
    type: params.get('type'),
    status: params.get('status'),
  };
  const state = useMemo(() => ({ ...initial }), []);
  const update = (p: Partial<TbomFilters>) => {
    const next = { ...state, ...p } as TbomFilters;
    const usp = new URLSearchParams(window.location.search);
    Object.entries(next).forEach(([k, v]) => {
      if (v == null || v === '') usp.delete(k); else usp.set(k, String(v));
    });
    const url = new URL(window.location.href);
    url.search = usp.toString();
    window.history.replaceState({}, '', url.toString());
    try { localStorage.setItem('tbom.filters', JSON.stringify(next)); } catch {}
  };
  return [state, update];
}
```

---

## 5. API Integration（服务模式与封装）

HTTP 策略：原生 fetch + 轻量封装；Zod 解析响应；统一错误模型，便于测试与重试策略演进。

示例（文档模板）：

```ts
// services/http.ts
import { z } from 'zod';

export type ApiError = { status: number; code?: string; message: string; details?: unknown };

export async function api<T>(input: RequestInfo, init?: RequestInit, schema?: z.ZodType<T>): Promise<T> {
  const res = await fetch(input, { ...init, headers: { 'Content-Type': 'application/json', ...(init?.headers||{}) } });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw { status: res.status, message: text || res.statusText } as ApiError;
  }
  const data = (await res.json().catch(() => ({}))) as unknown;
  return schema ? schema.parse(data) : (data as T);
}

// services/tbom.ts
import { z } from 'zod';
import { api } from './http';

export const TbomProject = z.object({ project_id: z.string(), type: z.string(), title: z.string() });
export type TbomProject = z.infer<typeof TbomProject>;

export async function listProjects(): Promise<TbomProject[]> {
  const base = process.env.NEXT_PUBLIC_API_BASE || '/api/mock';
  return api(`${base}/tbom/projects`, undefined, z.array(TbomProject));
}
```

说明：原型阶段可从 `docs/mocks/tbom/*.json` 读取并由 BFF 伪装为 REST；迁移到真源时仅替换 base 与 schema。

---

## 6. Routing（路由与拆分边界）

现状：app/page.tsx 以内嵌模块切换为主（单页模式）。本迭代不强制改路由，仅规定深链参数与动态拆分边界。

约束：
- 深链与返回：XBOM → TBOM 使用 `?from=ebom&node&path`；TBOM 顶部显示面包屑并支持返回 XBOM 定位节点（UI 规范已述）。
- 动态拆分：凡涉及 3D/大文件预览/图表重渲染的组件，必须使用 `import("…")` 动态引入；严禁在顶层静态 import 重库。
- 未来路由演进建议（占位）：`app/tbom/page.tsx` 作为独立入口，便于首屏按需加载（非本迭代范围）。

---

## 7. Styling Guidelines（样式约定）

- 工具链：本迭代冻结在 Tailwind v3；不得与 @tailwindcss/postcss ^4（v4 生态）并存。
- 变量与主题：
  - 使用 CSS vars 定义色板/间距/阴影（:root），Tailwind 仅作帮助类；支持深色模式占位（后续迭代）。
  - 焦点环统一：`focus:outline-none focus-visible:ring-2 ring-offset-2 ring-blue-500`。
- 类顺序：布局 → 间距 → 排版 → 颜色（与仓库规范一致）。
- 组件：优先复用 `components/common/*`；严禁在原子组件里直接引入重库与业务逻辑。

### 7.1 Tailwind v3 冻结与升级流程
- 版本矩阵：`tailwindcss@3.4.17`、`postcss@8.4.47`、`autoprefixer@10.4.21` 为唯一支持组合，Lockfile 已冻结对应 semver。
- 禁止事项：不得新增或恢复任何 v4 生态包（`@tailwindcss/postcss`、`tailwindcss/postcss` 等）；CI 将检查 package.json 与 lockfile。
- 变更流程：若团队评估 v4 升级价值，需提出新 ADR（延续 ADR-0001）并在独立迭代窗口执行，保留回滚用 Lockfile。
- 排查指引：当出现类名未生效时，优先确认 `tailwind.config.js` 的 `content` 路径是否覆盖 `app/`、`components/`、`docs/` 示例；其次检查 JIT 编译缓存并执行 `npx tailwindcss -m` 手动验证。

---

## 8. Testing Requirements（最小测试矩阵）

覆盖目标：
- RTL（组件/Hook）：空/错/加载态、键盘可达、aria-live 提示、动态导入组件的回退。
- Playwright（端到端）：
  1) XBOM→TBOM 深链过滤；
  2) 导入向导（成功/错误行回退）；
  3) 运行详情→Compare→导出 CSV/PNG/ZIP（占位验证）。

模板示例（文档）：

```ts
// __tests__/NodeTestBadge.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
test('显示计数与可键盘激活', async () => {
  render(<button aria-label="查看挂接试验，计数 3">试验 3</button>);
  await userEvent.tab();
  expect(document.activeElement).toHaveAccessibleName('查看挂接试验，计数 3');
});
```

```ts
// e2e/tbom.spec.ts (Playwright)
import { test, expect } from '@playwright/test';
test('XBOM→TBOM 深链过滤', async ({ page }) => {
  await page.goto('/?from=ebom&node=EBN-ASSY-0001-003');
  await expect(page.getByText('按结构节点过滤')).toBeVisible();
});
```

---

## 9. Environment Configuration（环境变量）

约定（.env.local，勿入库）：
- `NEXT_PUBLIC_API_BASE`：前端调用基础地址（原型可指向 `/api/mock`）。
- `NEXT_PUBLIC_MOCK_MODE`：`true|false`，是否启用本地样例包。
- `NEXT_PUBLIC_ENABLE_TBOM`：`true|false`，渐进开启 TBOM UI。
- `NEXT_PUBLIC_3D_ASSETS_BASE`：3D 资产路径（例如 `/3dviewer`）。

---

## 10. Frontend Developer Standards（关键规则与速查）

硬性规则：
- 默认 Server 组件；仅在需要状态/事件/浏览器 API 的叶子处使用 `"use client"`。
- 重库一律动态引入；严禁顶层静态 import。
- HTTP 统一通过 `services/http.ts`；所有响应必须通过 Zod 解析后再使用。
- a11y：所有交互有可见焦点；表格列头/单元格关联；关键提示使用 aria-live。
- 性能：长列表虚拟滚动；图表抽稀与 Worker；导出分块与离屏渲染。

速查：
- 开发：`npm run dev`｜构建：`npm run build`｜Lint：`npm run lint`
- 路由深链：`?from=ebom&node=<id>&path=<path>`
- 本地缓存：`tbom.filters`、`tbom.lastNode`

---

## 附录 A · 评审走查清单（前端 · Mock）

### A.1 前置准备
- 配置：`NEXT_PUBLIC_MOCK_MODE=true`，`NEXT_PUBLIC_API_BASE=/api/mock`（如使用），`NEXT_PUBLIC_3D_ASSETS_BASE=/3dviewer`。
- 数据：确认 `docs/mocks/tbom/` 样例文件完整；契约参考 `docs/tbom-contract.md`。
- 文档基线：`docs/prd.md`、`docs/front-end-spec.md`、`docs/ui-architecture.md` 均为 v0.2（冻结）。
- 启动：`npm run dev`（仅本地评审）。

### A.2 主线 1：XBOM → TBOM 深链
- 步骤：在浏览器打开 `/?from=ebom&node=EBN-ASSY-0001-003&path=ASSY-0001/FRAME-02/TOP-PLATE`；在 XBOM 节点详情处验证“跳转 试验BOM”入口与参数；进入 TBOM 验证“按结构节点过滤”。
- 期望：过滤生效；面包屑显示节点路径；键盘可达（焦点至过滤条并朗读）；无错误弹窗、无明显卡顿。

### A.3 主线 2：最小上载导入向导（前端校验）
- 步骤：依次选择 `tbom_project.json`、`tbom_test.json`、`tbom_run.json`、`process_event.csv`、`attachments.csv`，可选 `result_timeseries.csv`；查看映射/校验并提交；再做负例（改错列头）。
- 期望：合法文件通过并高亮新增/更新的 Project/Test/Run；负例出现可读错误（列头/行号）；可下载错误行；全流程可键盘完成并有 aria-live 提示。

### A.4 主线 3：运行详情 → Compare（试验/仿真） → 证据导出
- 步骤：在 TBOM 选中运行 `R-EX-001`，勾选 `ACC_*`/`PSD_*`/`FRF_*`/`COH_*`；送入 Compare；缩放/区间/光标对齐；导出 CSV/PNG；导出证据包。
- 期望：单位/采样率不一致有对齐提示（可统一/跳过并标注）；交互流畅（大数据占位 P95 < 120ms）；Zip 内含结构清单 JSON、图表 PNG、区间统计 JSON、事件 CSV、附件索引。

### A.5 非功能性核查
- 性能：重库（`pdfjs-dist`、`online-3d-viewer`、`vtk.js`、`rhino3dm`、`occt-import-js`、`web-ifc`）仅在叶子组件动态加载；首屏未加载。
- 可达性：焦点可见；表格关联；关键提示 aria-live；`prefers-reduced-motion` 时动效降级。
- 一致性：与 `docs/tbom-contract.md` 字段/时间/单位口径一致。

### A.6 通过标准
- 三条主线均按期望完成且无阻塞错误；负例给出明确可操作的错误信息；动态加载边界与 a11y 核查通过。
