# Sprint-4 P1 前端原型演示

> 更新时间：2025-09-29

## S4-T003 / S4-T020 阈值与提醒策略
- 入口：EBOM 驾驶舱工具条「刷新策略」按钮；阈值面板新增责任人、更新时间与禁用逻辑。
- Mock：`docs/kpi-threshold-config.json`、`docs/mocks/ebom-sprint4/refresh-strategy.json`
- 关键交互：
  - 查看自动刷新频率、SLA、渠道；
  - 切换自动刷新开关（本地状态）；
  - 提醒规则展示模板与样式预览；
  - PageAlerts 提示阻塞策略并定位到面板。

## S4-T005 验证链路矩阵
- 入口：驾驶舱工具条「验证矩阵」、摘要卡下方总览卡片。
- Mock：`docs/mocks/ebom-sprint4/validation-matrix.json`
- 关键交互：热力图 / 列表视图切换、阶段 / 责任人筛选、状态图例展示。

## S4-T007~S4-T009 协同与评审战情板
- 组件：`ReviewBoardPanel`、`ImpactAnalysisPanel`、`RiskClosurePanel`
- Mock：`docs/mocks/ebom-sprint4/review-board.json`、`impact-graph.json`、`risk-closure.json`
- 关键交互：看板 / 列表切换、高影响节点提示、风险热力图与联系人信息。

## S4-T011 知识目录导航
- 组件：`KnowledgeCatalogPanel` + `KnowledgeRail`
- Mock：`docs/mocks/ebom-sprint4/knowledge-catalog.json`
- 关键交互：按目录/收藏筛选知识卡、与收藏夹互斥切换。

## S4-T014 三维交互增强
- 组件：`EbomModelViewer`
- 关键交互：隔离子组件、剖切平面、高亮模式（Mock 控件）。

## S4-T016 时间线控件
- 组件：`TimelinePanel`
- Mock：`docs/mocks/ebom-sprint4/timeline-events.json`
- 关键交互：按类别过滤、基线里程碑展示。

## S4-T021 消息中心
- 组件：`MessageCenterDrawer`
- Mock：`docs/mocks/ebom-sprint4/messages.json`
- 关键交互：类型筛选、未读过滤、标记已读、快捷入口显示未读数。

> 所有组件在 `components/structure/ebom/` 下实现，并接入 `docs/mocks/index.ts` 中集中导出的 Mock 数据。
