---
task: S4-T026
author: TBD
date: 2025-10-20
status: draft
---

## 目标
> 定义空态/异常态的统一规范，并与 KPI 视图和摘要卡示例对齐。

## Mock 数据
- 使用文件：`docs/mocks/ebom-sprint4/kpi-multi-view.json`, `docs/mocks/ebom-sprint4/xbom-summary-detail.json`
- 补充说明：可构造空数组或缺失字段以验证兜底态。

## 关键交互
1. 在无数据时展示空态提示与下一步指引。
2. 出现异常数据（如 `null` 值）时展示错误态并允许重试。
3. 空态与错误态具备统一的视觉语言与可访问性。

## 截图 / 录屏链接
- 截图：
- 录屏：

## 验证记录
- [ ] UI 自检通过
- [ ] Storybook / 原型链接可访问
- [ ] Mock 数据字段与契约一致
- 备注：

## 后续动作
- 
