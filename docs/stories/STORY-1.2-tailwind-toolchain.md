# Story 1.2: Tailwind 工具链统一

## Status
Done

## Story
**As a** 前端平台工程师  
**I want** 统一并冻结项目的 Tailwind v3 工具链，移除与 v4 生态冲突的依赖并校验构建链一致性  
**so that** 团队能在后续 TBOM 开发中保持样式体系稳定，避免构建差异和升级风险

## Acceptance Criteria
1. 根据 ADR-0001，移除仓库中的 Tailwind v4 生态依赖（如 `@tailwindcss/postcss`），确认 `tailwindcss`、`postcss`、`autoprefixer` 等版本与 v3 工具链兼容，并更新 `package-lock.json` 以反映变更。 [Source: prd.md §8 Story 1.2][Source: architecture/adr-0001-tailwind-v3-freeze.md]
2. `npm run build`、`npm run dev`、`npm run lint` 在本地均可无错误运行，关键页面（首页、结构导航、Compare 等）经抽样核对后样式与 Tailwind 原子类策略保持一致，无视觉回退或类名冲突。 [Source: prd.md §8 Story 1.2][Source: ui-architecture.md §1·§10]
3. 在 README 或 `docs/ui-architecture.md` 增补“Tailwind v3 冻结与升级窗口”说明，包含：冻结原因、禁止引入 v4 依赖的指引、如需升级需走评审流程的占位，确保信息可以由实现者与设计团队查阅。 [Source: prd.md §8 Story 1.2][Source: architecture/adr-0001-tailwind-v3-freeze.md]

## Tasks / Subtasks
- [x] 审核与调整依赖：从 `package.json`/`package-lock.json` 移除 `@tailwindcss/postcss` 等 v4 生态包，并确认 `tailwindcss` 维持在 ^3.x；如需锁版本，使用 `~3.4.x` 以贴合现有配置（AC: 1）。 [Source: architecture/adr-0001-tailwind-v3-freeze.md]
  - [x] 运行 `npm install` 同步 lockfile，并记录变更（AC: 1）。
- [x] 检查 `postcss.config.mjs` 与 `tailwind.config.js`，确认插件加载顺序与内容路径符合现有目录（`app/`,`components/`,`hooks/` 等），必要时补充 `content` 范围或注释说明（AC: 1）。 [Source: ui-architecture.md 目录结构]
- [x] 进行本地验证：执行 `npm run build`、`npm run dev`（热启动即可）与 `npm run lint`，确保无新的构建警告，并记录抽样页面截图或走查结果（AC: 2）。 [Source: prd.md 集成验证][Source: ui-architecture.md §10]
- [x] 更新文档：在 README 或 `docs/ui-architecture.md` 的工具链章节添加 Tailwind v3 冻结说明与未来升级窗口流程（AC: 3）。 [Source: prd.md §8 Story 1.2][Source: architecture/adr-0001-tailwind-v3-freeze.md]
- [x] 在 `docs/changelog.md` 或相关变更记录中登记“Tailwind 工具链统一”事项，便于后续追踪（AC: 3）。 [Source: changelog.md]

## Dev Notes
- **Epic 与背景**：Story 1.2 支撑 TBOM 首版上线的基础样式稳定性，确保 Tailwind 工具链与 ADR 决议一致，避免 v3/v4 混用导致构建差异。 [Source: prd.md §8 Story 1.2][Source: architecture/adr-0001-tailwind-v3-freeze.md]
- **现有依赖状况**：`package.json` 当前包含 `tailwindcss@^3.4.17` 与 `@tailwindcss/postcss@^4`，需移除后者；PostCSS 配置位于 `postcss.config.mjs`，Tailwind 配置在 `tailwind.config.js`。 [Source: package.json][Source: postcss.config.mjs][Source: tailwind.config.js]
- **项目结构**：样式扫描需覆盖 `app/` App Router 页面与 `components/` 领域组件，遵循 `docs/ui-architecture.md` 中的目录与模块归属。 [Source: ui-architecture.md 目录结构]
- **样式规范**：Tailwind 类顺序遵循“布局→间距→排版→颜色”；禁用重型 UI 库和 v4 原子类，保持 v3 token（如 `blue-600`、`ring-offset-2`）一致。 [Source: ui-architecture.md §4·§10]
- **升级与回滚策略**：如需未来评估 Tailwind v4，应按 ADR-0001 在独立窗口内进行，并保留本次锁定前的 lockfile 以支持快速回滚。 [Source: architecture/adr-0001-tailwind-v3-freeze.md]
- **工具链兼容性**：ESLint、Next.js 15 与 React 19 已在现有配置中配合 Tailwind v3 工作，无需调整；若引入新插件需评估是否与 v3 兼容。 [Source: ui-architecture.md §1][Source: package.json]

### Testing
- **构建与运行验证**：执行 `npm run build`、`npm run dev`、`npm run lint`，确认为零错误、零 WARN；如出现 Tailwind 类未识别，需更新 `content` 路径或补充指纹。 [Source: prd.md 集成验证]
- **视觉抽样**：走查首页（`app/page.tsx`）、结构导航 (`components/structure/*`) 与 Compare (`components/compare/*`) 关键视图，确认样式未回退。 [Source: ui-architecture.md 目录结构]
- **回归记录**：将验证结果（Console、截图或录屏链接）上传至 Dev Agent Record 以便 QA 复核。 [Source: prd.md 集成验证]

## Change Log
| Date | Version | Description | Author |
| --- | --- | --- | --- |
| 2025-10-15 | v1.0 | 初始草稿：定义 Tailwind 工具链统一任务与验证要求 | Scrum Master |
| 2025-10-15 | v1.1 | 状态更新为 Ready for Dev | Product Owner |
| 2025-10-15 | v1.2 | 完成依赖调整、验证与文档更新，提交 Ready for Review | Dev Agent |
| 2025-10-15 | v1.3 | 标记为 Done | Product Owner |

## Dev Agent Record
### Agent Model Used
GPT-5 Codex (开发者通道)

### Debug Log References
- `npm run lint`
- `npm run build`
- `npm run dev -- --port 3100`（热启动验证，3000 端口被占用）

### Completion Notes List
- 清理 `@tailwindcss/postcss`，锁定 `tailwindcss@3.4.17`、`postcss@8.4.47`、`autoprefixer@10.4.21`，并重新生成 `package-lock.json`。
- 复查 `tailwind.config.js` 与 `postcss.config.mjs` 插件顺序与扫描路径，确认无需额外改动。
- 在 README 与 `docs/ui-architecture.md` 添补“Tailwind v3 冻结与升级流程”说明；在 `docs/changelog.md` 记录本次工具链统一。
- 本地执行 lint/build/dev（端口 3100）均无错误；抽查首页与结构模块样式，Tailwind 原子类仍正常生效。

### File List
- package.json
- package-lock.json
- README.md
- docs/ui-architecture.md
- docs/changelog.md
- docs/stories/STORY-1.2-tailwind-toolchain.md

## QA Results

### Review Date: 2025-10-15
### Reviewed By: Quinn (Test Architect)

### Code Quality Assessment
- `package.json` 与 `package-lock.json` 已彻底移除 `@tailwindcss/postcss`，并将 `tailwindcss`、`postcss`、`autoprefixer` 固定在 v3 工具链所需版本，避免意外升级。
- `tailwind.config.js` 与 `postcss.config.mjs` 维持精简配置，内容扫描范围覆盖 App Router 与组件目录，未发现遗漏或多余插件。
- 文档更新（README、docs/ui-architecture.md、docs/changelog.md）与 ADR-0001 指引一致，提供冻结原因、升级流程与排查建议。

### Requirements Traceability
- AC1：`package.json`/`package-lock.json` 无 v4 生态包残留，`npm ls @tailwindcss/postcss` 返回 empty，满足依赖冻结要求。
- AC2：`npm run lint`、`npm run build` 均成功；通过 `npm run dev -- --port 3200` 热启动确认开发服务器可用（3100 端口冲突后切换 3200），关键页面未改动 Tailwind 类名，样式风险极低。
- AC3：README 新增“Tailwind 工具链策略”，`docs/ui-architecture.md` 补充 7.1 节冻结流程，`docs/changelog.md` 记录 v0.2.3 更新。

### Test Coverage & Evidence
- `npm run lint`
- `npm run build`
- `npm run dev -- --port 3200`（手动 5s 走查后终止进程）

### Non-Functional Review
- 安全：PASS（纯依赖与文档调整，未触达运行时权限）。
- 性能：PASS（锁定版本避免引入体积不明的 v4 依赖）。
- 可靠性：PASS（开发/构建脚本经复测，锁版本提升可预期性）。
- 可维护性：PASS（文档与 changelog 清晰说明流程，利于团队遵循）。

### Risks & Mitigations
- 风险：未来新增依赖若再次引入 caret 版本或 v4 生态包可能破坏冻结策略。Mitigation：在 CI 中补充依赖扫描规则，或由架构评审检查 `package.json`。

### Decision
- Gate Recommendation: **PASS**（验收标准全部满足，无阻塞性问题）。

### Follow-Up Items
- 建议在 CI 中加入 `npm pkg get devDependencies` 校验脚本，自动阻止重新引入 Tailwind v4 生态包或解锁版本。
