# ADR-0002 HTTP 客户端：原生 fetch + 轻量封装 + Zod 解析

- Status: Accepted (2025-10-15)

## Context
需要统一错误模型与类型解析，且优先 Mock，无后端 SDK；需避免 axios 等带来包体增量。

## Decision
- 使用原生 `fetch`，在 `services/http.ts` 进行轻量封装（超时/错误规范化/可插拔重试）。
- 在服务层用 Zod 对响应做一次强校验，UI 仅消费通过校验的数据。

## Consequences
- 降低包体与耦合；错误与数据结构集中管理。
- 契约变更时仅更新 schema，不必在组件内散改。
