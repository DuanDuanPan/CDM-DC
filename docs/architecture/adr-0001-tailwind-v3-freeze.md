# ADR-0001 Tailwind v3 冻结与升级窗口

- Status: Accepted (2025-10-15)

## Context
仓库当前使用 Tailwind v3 配置与插件，但 devDependencies 中存在 `@tailwindcss/postcss ^4`（属于 v4 生态），存在构建链不一致的风险。

## Decision
本迭代冻结在 Tailwind v3 工具链：
- 不引入 v4 生态包（含 `@tailwindcss/postcss`）。
- 如需升级至 v4，另行创建升级窗口与评审（不与 TBOM MVP 并行）。

## Consequences
- 构建链一致，避免 CI/本地差异。
- 视觉系统继续沿用现有原子类，不引入 v4 破坏性变更。
- 升级计划待 ADR-XXXX（后续补充）。
