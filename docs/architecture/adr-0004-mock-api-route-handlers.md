# ADR-0004 Mock API 出口：Next Route Handlers vs 静态文件

- Status: Accepted (2025-10-15)

## Context
前端负责、优先 Mock。数据散落在 `docs/mocks/tbom/*`，需要统一对外出口以便服务封装与将来切换 BFF。

## Decision
- 优先使用 Next Route Handlers（`app/api/mock/.../route.ts`）作为统一 Mock API 出口，读取 `docs/mocks` 文件并返回 JSON/CSV。
- 允许静态文件直读用于快速演示，但不作为统一依赖接口。

## Consequences
- 服务层始终走同一前缀（`/api/mock`），便于未来替换为 BFF；本地/构建环境一致。
