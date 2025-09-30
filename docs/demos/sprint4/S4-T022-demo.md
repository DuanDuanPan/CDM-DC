---
task: S4-T022
author: TBD
date: 2025-10-20
status: draft
---

## 目标
> 展示页面内提醒气泡在 KPI 预警、跳转阻塞等场景下的触发与消退逻辑。

## Mock 数据
- 使用文件：`docs/mocks/ebom-sprint4/kpi-multi-view.json`, `docs/mocks/ebom-sprint4/jump-log.json`
- 补充说明：利用阈值覆盖和跳转失败场景触发提醒。

## 关键交互
1. 当 KPI 低于阈值时浮现提醒气泡并允许延后。
2. 处理提醒后写入完成记录并隐藏气泡。
3. 多提醒堆叠时按照优先级依次播放。

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
