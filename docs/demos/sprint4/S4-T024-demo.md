---
task: S4-T024
author: TBD
date: 2025-10-20
status: draft
---

## 目标
> 说明 Mock 数据集中管理方案，包括目录结构、导出函数与数据校验脚本。

## Mock 数据
- 使用文件：`docs/mocks/ebom-sprint4/README.md`, `docs/mocks/index.ts`
- 补充说明：覆盖集中导出的字段与命名约定。

## 关键交互
1. 在前端代码中通过 `import { kpiMultiView } from '@/docs/mocks'` 获取数据。
2. 执行校验脚本确认 JSON 结构（如有）。
3. 新增 Mock 文件后自动更新导出并通过 lint。

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
