# EBOM Sprint-4 Mock 数据

用于 Sprint-4 P0 前端原型演示的集中 JSON 数据源。所有文件均为可直接 import 的模块，配合集成的 `docs/mocks/index.ts` 导出使用。

## 文件说明
- `kpi-multi-view.json`：S4-T001/S4-T002 共享的 KPI 折线/雷达/热力图复合视图数据。
- `xbom-summary-detail.json`：S4-T004 详情抽屉使用的需求/仿真/试验深度字段。
- `jump-log.json`：S4-T006/S4-T019 用于跳转日志侧栏演示的数据样例。
- `validation-matrix.json`：S4-T005 需求×验证热力图及筛选控件所需数据。
- `review-board.json`：S4-T007 评审看板（列表/看板视图）所用任务与指标。
- `impact-graph.json`：S4-T008 变更影响分析原型的节点与关系 Mock。
- `risk-closure.json`：S4-T009 风险闭环面板的热力图、列表与联系人数据。
- `knowledge-catalog.json`：S4-T011 知识目录导航与收藏集所需的分类树。
- `timeline-events.json`：S4-T016 时间线控件的基线、仿真、试验等关键事件。
- `messages.json`：S4-T021 消息中心列表/筛选的消息样例。
- `refresh-strategy.json`：S4-T003/S4-T020 阈值提醒与刷新策略配置面板的数据。

新增或扩展 Mock 数据时，请同步更新 `docs/mocks/index.ts` 的导出清单，并在此 README 中简要说明用途。
