# EBOM 驾驶舱聚合 API 契约（TASK-002）

状态：完成（草案） · 2025-09-28
依据：docs/ebom-kpi-dictionary.md、docs/xbom-summary-card-spec.md、docs/data-freshness-policy.md
前置假设：
- 暂无企业统一 ID 规范，采用 `xbom_identity_map`（见 docs/xbom-identity-map.md）。
- 无 HMAC 跳转签名要求；仅保密分级；SSE/Webhook 暂不使用（采用轮询）。

## 1. 认证与通用约定
- 认证：Bearer Token（后续可接 OIDC）。
- 头部：`X-Env: dev|stg|prod`（可选）。
- 时间：ISO 8601，统一 UTC 存储，前端本地化显示。
- 错误：`{ code, message, traceId }`。

## 2. 端点定义

### 2.1 GET /api/cockpit/kpis
查询节点的 KPI 时序数据。

Query:
- `nodeId` string 必填（与 EBOM 节点映射）
- `from` ISO 可选
- `to` ISO 可选
- `interval` string 可选（e.g., `1h|4h|1d`）

Response:
```json
{
  "kpis": [
    {
      "id": "HLT-001",
      "label": "研制健康度",
      "unit": "分",
      "series": [{"t": "2025-09-28T00:00:00Z", "v": 78.5}],
      "threshold": {"low": 60, "high": 80, "rule": "R<60,Y<80,G>=80"},
      "freshnessSec": 3600,
      "trust": "high"
    }
  ]
}
```

### 2.2 GET /api/cockpit/baseline-health
返回版本/基线稳定性聚合。

Query: `nodeId` string 必填

Response:
```json
{
  "changes": {"count": 12, "byType": {"added": 3, "removed": 2, "modified": 7}},
  "approvals": {"rate": 0.91, "pending": 3},
  "openItems": {"count": 7},
  "maturityScore": 84
}
```

### 2.3 GET /api/xbom/summary
返回设计节点的需求/仿真/试验摘要（摘要卡片数据）。

Query: `nodeId` string 必填

Response（示例）：
```json
{
  "nodeId": "EBOM-ROOT/FAN/BLD-GRP/BLD-01",
  "source": {"system": "SIMSYS", "updatedAt": "2025-09-28T02:12:00Z", "trust": "mid", "freshnessSec": 7200},
  "requirement": {"coverage": 0.86, "items": [{"id": "REQ-ENG-001", "title": "推力目标", "status": "open"}]},
  "simulation": {"modelVer": "CFD-MOD-889@v2.3", "cases": 12, "lastRunAt": "2025-09-27T15:02:00Z", "hotIssues": 2},
  "test": {"plan": 5, "done": 3, "blockers": 1, "last": "合格"},
  "links": {"detailUrl": "https://sim.example.com/models/CFD-MOD-889"}
}
```

### 2.4 GET /api/knowledge/related
返回与节点相关的知识卡（经验/标准/评审/材料工艺）。

Query: `nodeId` string 必填；`q` string 可选；`limit` number 可选（默认 6）。

Response：
```json
{"items": [
  {"id": "EXP-001", "type": "experience", "title": "风扇叶片前缘磨耗案例", "snippet": "…", "tags": ["风扇","磨耗"], "link": "https://kb/exp/1", "updatedAt": "2025-08-01"}
]}
```

### 2.5 POST /api/audit/jump
记录从 EBOM 跳转外部系统的审计日志。

Body（JumpSpec）：
```json
{"from":"EBOM","nodeId":"EBOM-ROOT/FAN/DISC","system":"SIMSYS","at":"2025-09-28T02:12:00Z","url":"https://sim/...","context":{"partNumber":"DSC-110","rev":"B"}}
```

Response：`{ ok: true, id: "JMP-..." }`

## 3. 缓存与轮询策略
- 前端默认 1 小时轮询 KPI/基线；摘要卡 1 小时；知识卡 4 小时。
- 服务端可通过 `Cache-Control` 与 `nextRefreshAt` 指示客户端策略。

## 4. 待确认
- 实际对接系统的 baseUrl 与认证方式（仍待业务方提供）。
- KPI 字段是否需要按型号/阶段维度进一步切片？

