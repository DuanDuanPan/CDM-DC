# BFF Mock 返回格式与刷新策略（统一协议 · 代理/聚合端点）

状态：完成（草案） · 2025-09-28
适用范围：EBOM 驾驶舱与 XBOM 摘要首版原型/演示阶段
前置决策：见 docs/assumptions-2025-09-28.md（仅保密、无HMAC、轮询、glTF/GLB等）

## 1. 统一协议端点（Mock）
- GET `/api/cockpit/kpis?nodeId=...&from=...&to=...&interval=1h|4h|1d`
- GET `/api/cockpit/baseline-health?nodeId=...`
- GET `/api/xbom/summary?nodeId=...`
- GET `/api/knowledge/related?nodeId=...&q=...&limit=6`
- POST `/api/audit/jump`

说明：后续仅替换服务端实现与数据源映射，上述协议保持稳定。

## 2. 刷新与缓存策略（Mock）
- 轮询建议：
  - KPI/基线：每 1 小时；
  - 摘要（需求/仿真/试验）：每 1 小时；
  - 知识：每 4 小时；
- 接口返回：
  - `freshnessSec` 字段与 `nextRefreshAt`（可选）提示客户端策略；
  - Header：`Cache-Control: max-age=300, public`（演示环境）, `ETag`/`If-None-Match` 支持 304；
- 错误与退化：
  - 当下游不可用时返回最近一次成功快照（stale-while-revalidate 语义），并在 payload 标注 `trust: 'mid'|'low'` 与 `stale: true`。

## 3. Mock 行为开关（便于联调与演示）
- 请求头：
  - `X-Mock-Mode: ok|error|stale`（默认 `ok`）
  - `X-Mock-Latency: 200`（毫秒，随机上下波动 20%）
- 查询参数同名将覆盖请求头：`?mock=error&latency=800`

## 4. 返回示例（见 docs/mocks/*.json）
- kpis.json：`/api/cockpit/kpis`
- baseline-health.json：`/api/cockpit/baseline-health`
- summary-fan-blade.json：`/api/xbom/summary?nodeId=EBOM-ROOT/FAN/BLD-GRP/BLD-01`
- knowledge-related.json：`/api/knowledge/related`
- audit-jump.json：`/api/audit/jump`

## 5. 错误码与重试
- 错误格式：`{ code, message, traceId }`
- 常见码：
  - `400` 参数缺失/非法；
  - `401` 未认证；
  - `429` 限流（演示可返回 200 + `limited:true`）；
  - `500` Mock 故障；
- 前端重试：指数退避，最多 3 次；超限后展示“数据可能过期”的黄色提示。

## 6. 身份与上下文
- 使用 xbom_identity_map 锚定 `nodeId` ↔ `partNumber/revision/bomPath`；
- 审计跳转：POST `/api/audit/jump` 记录 `{ from:'EBOM', nodeId, system, at, url, context }`。

## 7. OpenAPI 规范
- 参见：`docs/openapi-ebom-bff.yaml`（覆盖全部端点与核心模型）。

## 8. 试点节点与数据新鲜度
- 试点节点见：`docs/pilot-scope.md`；
- 新鲜度标注：绿色 ≤24h，黄色 24–72h，红色 >72h（见 docs/data-freshness-policy.md）。

