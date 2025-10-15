# CDM Digital Continuity Prototype

## 快速开始
- 安装依赖：`npm install`
- 启动开发服务：`npm run dev`
- 访问应用：<http://localhost:3000>

## 自动化测试基座
本项目预置了 React Testing Library（Jest）与 Playwright 的最小运行配置。

### 组件测试（Jest + React Testing Library）
- 运行全部组件测试：`npm run test`
- 测试文件放置在与功能相邻的 `__tests__` 目录，例如：`components/tbom/__tests__/NodeTestBadge.test.tsx`
- Jest 会自动加载 `jest.setup.ts` 并启用 `@testing-library/jest-dom` 断言

### 端到端测试（Playwright）
- 首次运行前安装浏览器依赖：`npx playwright install --with-deps`
- 执行测试：`npm run test:e2e`
- Playwright 会自动启动本地开发服务（默认端口 `3000`）；如需自定义基地址，可设置 `PLAYWRIGHT_BASE_URL`
- 测试样例保存在 `e2e/` 目录，例如：`e2e/tbom.deep-link.spec.ts`

### 环境变量
测试运行依赖以下环境变量（本地可在 `.env.local` 中设置）：
- `NEXT_PUBLIC_MOCK_MODE=true`
- `NEXT_PUBLIC_API_BASE=/api/mock`
- `NEXT_PUBLIC_3D_ASSETS_BASE=/3dviewer`

### 常见故障排查
- **Playwright 无法启动浏览器**：执行 `npx playwright install --with-deps` 并确认系统具备必要的图形库（在 CI 中可使用 Playwright 官方 Docker 基础镜像）
- **Jest 找不到全局断言**：确认未移除 `jest.setup.ts` 引入的 `@testing-library/jest-dom`
- **测试读取不到环境变量**：确保 `.env.local` 中声明的变量以 `NEXT_PUBLIC_` 开头，或在启动脚本前以 shell 变量形式导出

## 目录约定
- TBOM 相关组件放置于 `components/tbom/`，结构类组件位于 `components/tbom/structure/`
- 组件与 Hook 的单元测试放至同级 `__tests__/` 目录，并采用 `.test.tsx` 后缀
- 端到端用例集中保存在仓库根目录的 `e2e/` 文件夹中，以功能域或场景命名

## Tailwind 工具链策略
- 本仓库冻结在 Tailwind CSS **v3.4.17**，配套 `postcss@8.4.47`、`autoprefixer@10.4.21`
- 禁止引入 Tailwind v4 生态包（如 `@tailwindcss/postcss`）；如确需升级须提交 ADR 评审并规划独立窗口
- 运行 `npm install` 将保持上述版本锁定；如遇样式异常，先核对 `tailwind.config.js` 的 `content` 范围与自定义插件
