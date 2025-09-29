# 设计BOM重构 · 已确认前提与决策（2025-09-28）

1) 企业统一ID规范：无；同意采用 `xbom_identity_map`（docs/xbom-identity-map.md）。
2) KPI 阈值与健康度权重：认可文档默认（docs/ebom-kpi-dictionary.md）。
3) 刷新策略：按建议（KPI/基线 1h、V&V 4h；轮询，无 SSE/Webhook）。
4) 安全范围：仅保密分级（不含出口管制）。
5) 跳转签名：不需要 HMAC 签名。
6) 消息/提醒网关：不需要（一期页面内实现即可）。
7) 3D 轻量化：使用 glTF/GLB；不要求压缩（可后续评估 Draco/KTX2）。
8) 一期 3D 交互：需要剖切/隔离/高亮。
9) 试点节点：同意（风扇叶片/风扇盘/燃烧室内胆/HPT 叶片/燃油泵）。
10) 里程碑：沿用 P0/P1/P2 路线图。

未决：各系统接口 baseUrl 与认证方式（阻塞 TASK-004 完成）。

