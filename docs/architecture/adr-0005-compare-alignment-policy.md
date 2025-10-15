# ADR-0005 Compare 口径对齐策略（单位/采样率/重采样）

- Status: Accepted (2025-10-15)

## Context
试验与仿真数据的单位与采样率经常不一致，需要在 Compare 中提供可解释的对齐策略并最小化误差。

## Decision
- 单位：按 `docs/tbom-contract.md` 的推荐单位进行统一（ACC: g 或 m/s^2；PSD: g^2/Hz；FRF: m/s^2/N 或 g/N）。
- 采样率：对比前进行重采样或插值（线性/保持），默认提示并允许跳过；记录“对齐说明”。
- 元数据：保留原始单位与采样率，导出时写入证据包元信息。

## Consequences
- 用户可复现实验；导出材料具可审计性；实现上需要在图表加载前做一次转换（Worker 优先）。
