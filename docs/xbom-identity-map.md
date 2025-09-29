# XBOM 标识映射与上下文携带（TASK-008）

状态：完成（草案） · 2025-09-28

## 1. 目标
确保在“设计BOM → 需求/仿真/试验”跳转前后上下文一致，字段唯一可追溯。

## 2. 核心键
- `partNumber` + `revision` + `bomPath` → 设计对象唯一定位
- `requirementId`（需求系统）
- `simulationModelId` / `caseId`（仿真系统）
- `testId` / `sampleId`（试验系统）

## 3. 统一映射表（示例结构）
```json
{
  "key": "EBOM-ROOT/HPT/BLADE",
  "partNumber": "HTB-142",
  "revision": "B",
  "refs": {
    "requirement": ["REQ-ENG-001","REQ-CMB-023"],
    "simulation": [{"model":"CFD-MOD-889","case":"CASE-12"}],
    "test": [{"testId":"TST-HPT-005","sample":"SMP-HTB-01"}]
  }
}
```

## 4. 携带上下文（URL 约定）
- `?from=EBOM&nodeId=...&pn=...&rev=...&ts=ISO&sig=HMAC`
- `sig` 由网关签名（后端接入时启用），前端仅透传。

## 5. 校验工具（待实现）
- 静态校验：对照三方系统导出的清单，核对缺失/重复/冲突。
- 运行校验：跳转时对照映射表校验是否存在并记录日志。

## 6. 开放问题
- 是否已有企业级统一标识规范可直接复用？
- HMAC 签名由哪个网关/服务提供？

