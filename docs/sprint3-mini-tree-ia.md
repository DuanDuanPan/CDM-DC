# Sprint-3 · Mini Tree IA 草案模版

- **会议时间**：填写评审时间（默认 2025-10-03 14:00）
- **参会角色**：结构组 / Compare / 设计域 / 体验
- **背景**：
  - 目标：概述迷你树只读对齐 Compare 状态的目标。
  - 范围：限定展示层级、交互限制。

## 1. 信息架构
- 节点来源与映射：
  - 左树数据源 → 并排迷你树节点 → 状态同步策略。
- 展示层级：
  - 层级说明、最大展开深度、默认展开规则。
- 属性清单：
  - 节点字段（名称、部件号、差异标记等）与来源说明。

## 2. 交互流程
- 基本操作：hover、选中、对齐 Compare 状态。
- 差异标记：颜色 / 图标 / Tooltip。
- 无权限/空数据处理：加载态、空态。

## 3. 数据契约
data-contract:
```ts
interface MiniTreeNode {
  id: string;
  label: string;
  partNumber?: string;
  diffType?: 'added' | 'removed' | 'modified' | null;
  children?: MiniTreeNode[];
  meta?: Record<string, unknown>;
}
```
- 字段描述：逐项说明。
- 状态同步：与 `useEbomCompareState` 的交互点。

## 4. 风险与依赖
- 后端接口需求：接口名 / 字段 / 时序。
- 前端实现风险：性能 / 状态同步。
- 待确认事项：列出责任人与截止时间。

## 5. 决议 & Action Items
- 决议列表：
  - `[ ]` 项目 / 责任人 / 完成时间
- 附件：Demo 链接、原型地址。

---
> 填写完成后，请在评审结束当日上传会议纪要并链接至 docs/ebom-redesign-plan.md。
