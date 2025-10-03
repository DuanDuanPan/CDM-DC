# 仅前端原型联调方案（FE-only）

状态：完成（草案） · 2025-10-03（已实现刷新按钮、时间窗联动KPI、三卡显示开关、健康度公式提示、导出快照、跳转本地提示）
适用范围：在不实现后端/BFF的情况下，用 Mock 数据驱动“实时全景驾驶舱 + XBOM 摘要 + 知识卡”，用于演示与交互评审。

## 1. 数据来源与绑定
- 统一数据模型沿用 BFF 契约（docs/cockpit-bff-api.md），但前端直接读取本仓库的 Mock JSON：
  - KPI：`docs/mocks/kpis.json`
  - 基线健康：`docs/mocks/baseline-health.json`
  - XBOM 摘要（试点：风扇叶片）：`docs/mocks/summary-fan-blade.json`
  - 知识卡：`docs/mocks/knowledge-related.json`
- 绑定策略：
  - 以 `nodeId` 为主键；当前试点覆盖 `EBOM-ROOT/FAN/BLD-GRP/BLD-01` 等 5 个节点；
  - 暂无数据的节点显示“无摘要/数据可能过期”的温和提示；
  - 时效标签/可信级别使用 Mock 中的 `freshnessSec` 与 `trust` 字段。

## 2. 组件清单（新增）
- `CockpitBar`：基线/对比标签、健康灯、数据时效徽标。
- `KpiGrid`：2×3 KPI 小卡；每张卡显示当前值、趋势/阈值提示；
- `BaselineHealthCard`：变更频次/审批率/未闭环/成熟度评分；
- `XbomSummaryCards`：需求/仿真/试验三卡，统一“查看详情”跳转（记录本地审计日志即可）；
- `KnowledgeRail`：经验/标准/评审结论卡片列表；
- `FreshnessBadge`：绿色≤24h、黄色≤72h、红色>72h；
- `JumpButton`：封装跳转参数与本地打点（符合 docs/xbom-summary-card-spec.md）。
- `exportUtils`：`exportDomToPng` 使用 html2canvas（CDN 动态加载）导出 PNG。
  - 另含 `exportDomToPdf`：打开新窗口承载快照并触发浏览器打印（可导出PDF）。

说明：三维模型与设计参数、文档区已存在（`EbomDetailPanel`）。新组件将以“驾驶舱与摘要区域”的形式插入在其上方。

## 3. 集成位置（不改路由，仅改右侧面板）
- 入口：`components/structure/ebom/EbomDetailPanel.tsx`
- 新增“驾驶舱与摘要容器”位于“基线对比”与“节点详情”之间，按以下顺序渲染：
  1) `CockpitBar`
  2) `KpiGrid`
  3) `BaselineHealthCard`
  4) `XbomSummaryCards`
  5) `KnowledgeRail`

## 4. FE-only 数据访问策略
- 方式 A（推荐，最快）：直接 `import` JSON 文件；
  - 优点：零后端、零网络依赖、演示稳定；
  - 限制：构建时静态绑定，无法通过查询参数切换；
- 方式 B：通过 `fetch('/docs/mocks/*.json')` 读取（需将文件同步到 `public/mock` 或在构建时复制）。
  - 优点：更接近真实接口调用；
  - 限制：需要简单的拷贝脚本或 Next 静态目录。

首版建议采用方式 A；已实现通过 `nodeId -> mock json` 的映射，非试点节点返回简化默认摘要（trust=low）。KPI 根据“时间窗（24h/7d/30d）”过滤序列。

## 5. 交互与可用性
- 点击“查看详情/跳转”：仅前端 `console.info` + 写入 `localStorage.jump_log`，并显示“已记录”短提示；
- 刷新按钮：前端更新内部 `refreshAt`，使驾驶舱条与摘要卡的新鲜度徽标立即变为“0h”（模拟刚拉取）；
- 三卡开关：勾选显示 需求/仿真/试验 任意组合；
- 健康度公式：在驾驶舱条点击“公式”按钮，悬停提示加权规则（4×25%）。
- 导出快照：点击“导出快照”将驾驶舱与摘要区域导出为 PNG（使用 html2canvas，CDN 动态加载）。
 - 导出PDF：点击“导出PDF”打开打印视图，选择“存储为PDF”。
 - 阈值面板：点击“阈值”打开前端占位设置（覆盖高/低阈值，保存到 localStorage）。
- 无数据/过期：显示提示与“尝试刷新”操作；
- 无障碍：所有卡片与按钮可键盘聚焦，提供 `aria-label`；

## 6. 性能与预算
- 首屏新增内容的总 JS < 40KB（不含现有依赖）；
- 单次渲染 ≤ 16ms；
- 三维仍按现有实现，新增区块不与 3D 同步渲染；

## 7. 联调步骤（评审用）
1) 切换到“设计BOM”，选中试点节点（风扇叶片）。
2) 在右侧看到：驾驶舱总览条 → KPI 小卡 → 版本健康 → 摘要三卡 → 知识卡 → 现有节点详情。
3) 点击卡片中的“查看详情”会在控制台记录审计，并在本地日志中追加一条。
4) 点击“刷新”，驾驶舱与摘要的时效徽标变为“0h”，模拟刚刷新。
5) 切换到其它 4 个试点节点，可看到对应的摘要卡（已补 Mock）。非试点节点展示简化默认摘要。

## 8. 验收项（FE-only）
- 3步内可定位任一试点节点的驾驶舱与摘要；
- 时效与可信级别正确显示；
- 审计跳转在本地日志可见；
- 3D 与摘要共存无布局冲突；

## 9. 开放问题
- 角色导览的默认 KPI 集与排序待确认；
- 剖切/隔离/高亮的 UI 具体放置与默认状态（见 docs/ebom-cockpit-ui-spec.md）；
