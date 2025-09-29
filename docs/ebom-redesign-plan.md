# 设计BOM（E‑BOM）功能重构 · 分析与设计方案（MVP→阶段化演进）

作者：过程数据中心
日期：2025-09-28（美国时区）
状态：草案（进行中）
更新记录：
- 2025-09-28 完成 TASK-001/006/008/009 草案文档，链接见下文（由助手提交）。
- 2025-09-28 完成 TASK-002/003 草案文档；TASK-004 进行中（缺系统接口）。
- 2025-09-29 完成 TASK-002-03 动态阈值规则库 FE 原型（含 µ±σ/分位/阶段计算与 UI 抽屉）。
- 2025-09-29 启动 TASK-003-03 并排迷你树轻量版，实现设计BOM页预览与基线联动。
- 2025-09-29 完成 TASK-004-03 初版实现：并排迷你树支持分段加载 + 滚动触发增量渲染。
- 2025-09-29 完成 TASK-005-03 知识检索 UI 占位，接入 Mock 搜索与智能检索入口。

## 1. 目标与范围
- 目标：以设计BOM为统一入口，构建“实时全景驾驶舱 + XBOM 摘要卡片与跳转 + 知识沉淀”的一期能力，打通需求—设计—验证的数字线程，并为中期创新与 Moonshot 预留接口。
- 范围：仅设计域视角（保密分级），实现“浏览/对比/摘要”级能力；深度操作仍由各 XBOM 系统承载。
- 约束：
  - 主数据源：本系统为 EBOM 主数据，外部系统（需求/仿真/试验/PLM）提供摘要接口；
  - 安全：只考虑保密分级（不含出口管制字段）。

## 2. 现有基础（仓库清点）
- XBOM框架：`components/structure/ProductStructure.tsx` 已支持 `requirement/solution/design` 切换与左树右详布局。
- 设计BOM基础：
  - 对比：`ebom/EbomDetailPanel.tsx` 基线选择与差异清单（新增/移除/数量/版本）。
  - 详情：节点基本信息、效期、替代链、关联链接（CAD/文档/仿真/试验）、设计参数（按 `class` 分类）。
  - 三维：`ebom/EbomModelViewer.tsx` 基于 `<model-viewer>` 预览 glTF/GLB；
  - 文档：`ebom/EbomDocList.tsx` 摘要列表；
  - 数据契约：`ebom/types.ts` 与 `docs/ebom-contract.md`；样例数据：`ebom/data.ts`。
- 关联模块：
  - 仿真页：`structure/simulation/*` 已有树/内容/对比占位与预览；
  - 对比中心：`components/compare/CompareCenter.tsx`；
  - 关系图谱：`components/graph/RelationGraph.tsx`；
  - 文档/记忆：`docs/memory.md` 对 XBOM 模块结构有记录。

## 3. 与需求对比（Gap 分析 → 解决思路）
以下按“Detailed Functional Requirements (FR)”逐条评估：

- FR-001 实时状态驾驶舱（缺口大）
  - 现状：无统一驾驶舱；无指标库/阈值/健康度算法；仅静态卡片。
  - 方案：新增“驾驶舱”子模块与数据聚合 API，提供 KPI 看板、版本稳定性、健康度信号灯；支持快照+近实时刷新。

- FR-002 需求—设计—验证链路（中度缺口）
  - 现状：仿真页独立存在、需求页独立存在；设计BOM右侧无统一“摘要卡片与一键跳转”。
  - 方案：在 EBOM 节点右侧注入“需求卡 / 仿真卡 / 试验卡”三张标准化摘要卡片，带数据来源与时效标签，提供统一跳转组件；增加“需求覆盖率热力图/验证矩阵”只读版（从外部系统汇总）。

- FR-003 协同与评审（较大缺口）
  - 现状：无评审看板、无变更影响分析器、无风险闭环仪表；
  - 方案：一期提供只读汇总（评审列表、变更计数、风险统计）与“跳转外部系统”能力；二期实现影响图与自动提醒。

- FR-004 知识沉淀（高价值、可独立推进）
  - 现状：无统一经验库；文档分散；
  - 方案：建立知识索引与标签体系，提供“经验/标准/评审结论/材料工艺参数”四类入口；在 EBOM 节点侧边栏显示相关知识卡与检索框。

- FR-005 交互与导航（可增量落地）
  - 现状：有三维预览，但无剖切/爆炸/高亮联动；无角色导览/时间线；
  - 方案：MVP 先做“角色导览预设 + 时间线只读 + 3D 高亮/隔离/简单剖切”；进阶再做爆炸与测量。

- FR-006 数据摘要与跳转机制（核心脊梁）
  - 现状：缺统一的摘要模板、可信级别/时效标签、审计日志；
  - 方案：定义统一“摘要卡片协议”，实现 `useXbomSummary(nodeId)` Hook 与跳转组件；记录跳转日志（仅客户端先存本地/后端再接）。

- FR-007 通知与提醒（一期可轻量）
  - 现状：无；
  - 方案：一期提供页面内提醒与消息中心只读（本地模拟/轻后端）；二期接入规则引擎与多渠道。

## 4. 目标架构（一期）
- 前端层：
  - EBOM 驾驶舱视图：`/structure/design/cockpit` 嵌入为 EBOM Tab（或右侧顶部信息区）。
  - 摘要卡片层：统一卡片组件（需求/仿真/试验/工艺/知识），支持数据来源与时效标签、刷新策略、跳转按钮。
  - 三维交互：`model-viewer` + 可选 three.js 插件位（剖切/高亮/隔离）。
- 聚合服务层（后端或 BFF）：
  - `/api/cockpit/kpis?nodeId=…`：KPI 时序与阈值；
  - `/api/cockpit/baseline-health?nodeId=…`：变更频次、审批率、未闭环；
  - `/api/xbom/summary?nodeId=…`：需求/仿真/试验摘要统一返回；
  - `/api/knowledge/related?nodeId=…&q=…`：经验/标准/评审结论检索。
- 标识与映射：
  - 建立 `xbom_identity_map`（零件号/需求号/试验号/仿真模型号）与上下文携带策略（query/hash/state），确保跨系统一致。
- 安全与合规：
  - 只读视图 + 保密分级水印/标识；跳转记录审计；字段级隐藏遵从角色权限。

## 5. 数据契约（提案）
- KPI（CockpitKpi）
  - `{ id, label, unit, series: [{t, v}], threshold?: { high?, low?, rule? }, freshnessSec }`
- 版本健康（BaselineHealth）
  - `{ changes:{count, byType}, approvals:{rate, pending}, openItems:{count}, maturityScore:[0..100] }`
- XBOM摘要（XbomSummary）
  - `{ nodeId, source:{system, updatedAt, trust:'high|mid|low'}, requirement:{coverage, items:[{id,status,owner}]}, simulation:{modelVer, cases, lastRunAt, hotIssues}, test:{planVsActual, lastResult, blockers} }`
- 知识卡（KnowledgeCard）
  - `{ id, type:'experience|standard|review|material', title, snippet, tags, link, updatedAt }`

注：一期可由前端模拟 JSON，后端逐步替换。

## 6. 交互与信息架构（IA）
- EBOM右侧信息区（顺序）：
  1) “实时全景驾驶舱”（总览条 + KPI 小卡 + 版本健康 + 健康灯）；
  2) “XBOM 摘要卡”三张（需求/仿真/试验），统一跳转按钮；
  3) “知识沉淀”建议卡（相关经验/标准/评审结论）；
  4) 节点详情（基本/效期/替代链/设计参数/3D/文档）。
- 角色导览：顶部提供角色切换（总师/系统/试验），不同角色默认显示不同卡片组合与排序。
- 时间线：版本与事件折叠控件，默认隐藏次要事件，支持过滤（仿真/试验）。

## 7. 路线图与里程碑
- P0（第1–2周）“打地基”
  - 统一字段字典与标识映射表；摘要卡片协议与 UI 规范；Cockpit KPI 列表与阈值字典；Mock API。
- P1（第3–6周）“可用版本”
  - 实时驾驶舱（FR-001）首版：KPI 看板/版本健康/健康度灯 + 手动刷新/每小时轮询；
  - XBOM摘要卡与跳转（FR-002/FR-006）：三卡 + 跳转组件 + 时效标签；
- P2（第7–12周）“增强版”
  - 知识沉淀（FR-004）试运行：索引/检索/相关卡；
  - 交互增强（FR-005）：3D 高亮/隔离、角色导览预设、时间线只读；
  - 轻量提醒（FR-007）：页面内消息中心 + 阈值触发。

与业务时间线对齐：
- #1 驾驶舱：3个月可用版本交付；
- #2 摘要卡+跳转：2–3个月完成核心链路（与P1并行推进接口对接）；
- #3 知识沉淀：第3–4个月启动试运行。

## 8. 验收与指标（与需求对齐）
- 找信息 ≤3 步（关键角色路径）；
- 3D 结构响应 ≤2s；
- 跨系统字段一致性 ≥99%；
- 提醒误报率 ≤5%；
- 使用采纳：关键角色日均使用 ≥30 分钟；提醒平均响应 <24 小时；
- 知识覆盖：前三大系统核心经验上线；材料/工艺数据库覆盖 ≥80%。

## 9. 风险与缓解
- 数据时效性：接口实时性不足 → 以“时效标签+手动刷新+增量更新”缓解；
- 标识映射不一致：建立 `xbom_identity_map` 与校验任务；
- 阈值与健康度争议：引入“规则字典 + 责任人”机制；
- 三维文件过大：统一轻量化规范（Draco/KTX2/Meshopt）与大小门槛；
- 安全审计：跳转日志与访问水印；
- 变更影响范围计算复杂：首版只读统计，二期异步离线分析。

## 10. 任务清单（待建 Jira/Epics）
- EPIC-EBOM-001 实时全景驾驶舱（FR-001）
  - TASK-001 指标库与阈值字典（字段、单位、采样频率）【已完成草案】→ docs/ebom-kpi-dictionary.md
  - TASK-002 Cockpit API（`/api/cockpit/kpis`、`/baseline-health`、缓存策略）
  - TASK-003 前端 Cockpit 视图（KPI 小卡、趋势、版本健康、健康灯）
  - TASK-004 数据来源对接计划（仿真/试验/PLM 列表与负责人）
  - TASK-005 健康度评分规则与落地（权重与解释）
- EPIC-EBOM-002 XBOM 摘要卡与跳转（FR-002/FR-006）
  - TASK-006 摘要卡协议与 UI 规范（需求/仿真/试验）【已完成草案】→ docs/xbom-summary-card-spec.md
  - TASK-007 统一跳转组件与上下文携带（带来源/时间/节点）
  - TASK-008 标识映射表 `xbom_identity_map` 与校验工具【已完成草案】→ docs/xbom-identity-map.md
  - TASK-009 时效标签/可信级别显示与刷新策略【已完成草案】→ docs/data-freshness-policy.md

## 附：已新增文档
- docs/cockpit-bff-api.md（TASK-002）【已完成草案】
- docs/ebom-cockpit-ui-spec.md（TASK-003）【已完成草案】
- docs/pilot-scope.md（TASK-004 子项：试点范围）【进行中】
- docs/assumptions-2025-09-28.md（确认的 10 条前提）【已完成】
- docs/bff-mock-plan.md（BFF Mock 返回与刷新策略）【已完成草案】
- docs/openapi-ebom-bff.yaml（OpenAPI 规范）【已完成草案】
- docs/mocks/*.json（Mock 示例数据集）【已完成草案】
- docs/frontend-prototype-integration.md（仅前端原型联调方案）【进行中】

## FE-only 原型实现进展（2025-09-28）
- 新增组件：CockpitBar、KpiGrid、BaselineHealthCard、XbomSummaryCards、KnowledgeRail、FreshnessBadge、JumpButton。
- 集成位置：`components/structure/ebom/EbomDetailPanel.tsx`，插入在“基线对比”与“节点详情”之间。
- 数据绑定：直接 import `docs/mocks/*.json`。
- 已补齐试点摘要：风扇盘（summary-fan-disk.json）、燃烧室内胆（summary-comb-liner.json）、HPT 叶片（summary-hpt-blade.json）、燃油泵（summary-fuel-pump.json）。
- 交互增强：新增“刷新”按钮（模拟更新时效）、三卡显示开关（需求/仿真/试验）、健康度公式提示按钮；JumpButton 点击后显示“已记录”短提示。
  - 时间窗联动：KPI 支持 24h/7d/30d 过滤；新增“导出快照（PNG）”。
  - 阈值显示：KPI 卡片的“阈值”标记会在覆盖时显示“阈值(覆盖)”并悬停展示“覆盖/默认”两套值。
  - 知识卡：新增搜索与标签筛选，支持快速定位相关经验。

## 对比中心细化（阶段一）
- 新增“EBOM基线对比”模式：选择左右两条基线，输出新增/移除/修改统计与列表（数量/版本变更）。
  - 支持筛选（全部/仅新增/仅移除/仅修改）、导出 CSV、显示节点路径；点击差异行会写入 EBOM 定位指令（localStorage.ebomDeepLink）。
  - 新增并排迷你树：左右基线并排缩略树，差异项标记“新增/移除/修改”，可配合“仅显示差异”。

## 后续推进（阶段二）
- KPI 预设与动态阈值：
  - 预设配置与管理（导入/导出/复制/重命名/删除）；权重编辑与总和提示；CockpitBar 显示“当前预设+公式权重”；
  - 支持 rule='mu_sigma'，阈值(动态)依据当前时间窗序列计算；
- EBOM 并排视图：
  - 连线与行内标注；悬停联动；深度/仅子树/仅字段变化过滤；导出并排PNG；

## 任务排期（采纳项：2/3/4/5）

优先级规则：P0=高优，P1=中优（当期）、P2=后续。工期为理想人日/周（前端+BFF+评审），可并行时已拆。

### EPIC-EBOM-002 驾驶舱与KPI（P0/P1，2.5–4周）
- 目标：将权重/阈值方案真正用于健康度评分，完善预设治理与动态阈值规则。
- Tasks（按优先级）
  - P0 TASK-002-01 健康度评分落地与解释说明（前端计算版 + 文档）：3d
  - P0 TASK-002-02 KPI 字典补齐阈值/单位/取值域（含试验覆盖、风险超期等）：4d
  - P1 TASK-002-03 动态阈值规则库设计（mu_sigma/percentile/stage-based）与UI占位：5d
  - P1 TASK-002-04 预设治理方案（角色权限/变更审计/组织共享）设计文档：3d
  - P1 TASK-002-05 预设→评分联动与导入/导出一致性测试：2d

### EPIC-EBOM-003 设计BOM视图（P1，2–3周）
- 目标：完善基线对比字段、与对比中心状态同步、并排树轻量预览。
- Tasks
  - P1 TASK-003-01 差异字段扩展：findNo/uom/lifecycle/effectivity/substitutes：5d
  - P1 TASK-003-02 与对比中心状态同步（基线/筛选/深度→URL参数 & 跨模块存储）：4d
  - P1 TASK-003-03 设计BOM页内“并排迷你树”轻量版（只读）：4d
  - P1 TASK-003-04 3D 功能增强（剖切/隔离先行；测量/爆炸占位）：4d

### EPIC-EBOM-004 对比中心（P1，2–3周）
- 目标：并排视图体验优化与大数据性能增强。
- Tasks
  - P1 TASK-004-01 并排视图 pill 样式统一（vA→vB / 36→40 对称显示）：3d
  - P1 TASK-004-02 列表⇄并排视图双向联动与同步高亮：4d
  - P1 TASK-004-03 虚拟滚动/分段加载，超千节点性能保障：5d
  - P1 TASK-004-04 导出并排PNG增强（标题/日期/基线信息/页眉）：2d

### EPIC-EBOM-005 知识沉淀（P1，2周）
- 目标：类型化模板与收藏/检索体验完善。
- Tasks
  - P1 TASK-005-01 类型化模板（经验/标准/评审/材料）卡片字段与版式：5d
  - P1 TASK-005-02 收藏夹增强（分组/批量/标签编辑/导出清单MD）：3d
  - P1 TASK-005-03 检索服务对接方案与UI占位（权重/同义词/高亮/去重）：4d

### 里程碑与排期建议（当期8–12周可并行）
- SPRINT-1（2周，状态：已完成）
  - TASK-002-01、TASK-002-02、TASK-003-01、TASK-004-01、TASK-005-01
- SPRINT-2（3–4周，状态：已完成）
  - TASK-003-02、TASK-004-02、TASK-004-04、TASK-005-02
- SPRINT-3（3–4周，状态：进行中，启动：2025-09-29）
  - TASK-002-03、TASK-003-03、TASK-004-03、TASK-005-03

#### Sprint-3 日程（2025-09-29 ~ 2025-10-18）
- **第1周（09-29 ~ 10-04）**
  - 09-29 ~ 10-01：完成 TASK-002-03 收尾验收，联同结构组梳理迷你树节点数据契约，输出《Mini Tree IA》草案。
  - 10-02 ~ 10-04：实现 TASK-003-03 UI 框架与 Mock 数据绑定，准备并排树交互演示 Demo。
  - 里程碑：10-04 前完成迷你树交互评审，确认后端接口需求清单。
  - 评审安排：10-03 14:00 (结构组/Compare/设计域)——迷你树 IA 联席评审。
- **第2周（10-06 ~ 10-11）**
  - 10-06 ~ 10-08：TASK-004-03 虚拟滚动方案验证，完成性能基线测试脚本与 1k/5k 节点对比数据。
  - 10-09 ~ 10-11：集成 Compare 状态同步与滚动分段加载，安排跨团队联合走查。
  - 里程碑：10-11 前提交《虚拟滚动性能报告》并更新 Compare 技术文档。
  - 评审安排：10-10 16:00 (结构组/性能组/QA)——虚拟滚动性能评审。
- **第3周（10-13 ~ 10-18）**
  - 10-13 ~ 10-15：收敛 TASK-004-03 余项，开始 TASK-005-03 检索 UI 占位、搜索权重配置。
  - 10-16 ~ 10-18：完成知识检索 Mock 接入、整体验收与 Sprint 故事验收会准备。
  - 里程碑：10-18 前交付 TASK-005-03 Demo + 文档更新，释放回顾资料。
  - 评审安排：10-17 15:00 (知识库/设计/验证代表)——知识检索体验验收；10-18 10:00 Sprint 回顾会。

> 说明：若BFF实时接入提前准备好，可将部分 P0 项（评分/字典）前置到 SPRINT-1 完成；其余项按风险分散至后续冲刺。

## 知识沉淀卡片细化（阶段一）
- 新增搜索与标签筛选；类型筛选（经验/标准/评审/材料）与“收藏/仅看收藏”（localStorage.kb_fav_ids）；
- 新增“收藏导出”入口（CSV/JSON）。
- 计划下一步：按类型筛选（经验/标准/评审/材料）与收藏/订阅（本地收藏）。

## 选择的联调路径
仅前端原型联调（FE-only）：先用本地 Mock JSON 驱动 UI，不落后端代码，后续替换为真实 BFF 即可。
- EPIC-EBOM-003 知识沉淀（FR-004）
  - TASK-010 标签体系与目录结构（型号/系统/问题/工艺）
  - TASK-011 索引与检索接口（Mock→真实搜索）
  - TASK-012 相关知识卡组件 + EBOM 侧边栏对接
  - TASK-013 审核流程与角色权限（只读落地）
- EPIC-EBOM-004 交互与导航增强（FR-005/部分 FR-007）
  - TASK-014 3D 高亮/隔离/简易剖切（基于 three.js 插件位）
  - TASK-015 角色导览预设与布局保存
  - TASK-016 时间线控件（版本/里程碑/协同事件）
  - TASK-017 轻量消息中心与阈值提醒（页面内）
- EPIC-EBOM-005 基础设施与安全
  - TASK-018 元数据字典与配置中心（系统ID、接口、认证方式）
  - TASK-019 跳转审计日志（前端先打点，后端接口预留）
  - TASK-020 轻量性能预算与观测（RUM + Web Vitals）

## 11. 开放问题（需与相关团队确认）
1) 现有 XBOM 接口是否支持按节点实时刷新（SSE/轮询频率限制）？
2) 风险与提醒规则的权威归口是谁（质量/总师办/各专业）？
3) 需求/仿真/试验系统的统一标识是否已有标准？若无，是否由我们主导？
4) 3D 轻量化约束清单是否已形成公司级规范？
5) 知识库的审核与更新频率、责任人名单？

## 12. 附录（字段草案）
- CockpitKpi：`{ id, label, unit, series:[{t:ISO,v:number}], threshold:{high?,low?,rule?}, freshnessSec:number }`
- BaselineHealth：`{ changes:{count,byType:{added,removed,modified}}, approvals:{rate:number,pending:number}, openItems:{count:number}, maturityScore:number }`
- XbomSummary：`{ nodeId, source:{system,updatedAt,trust}, requirement:{coverage:number,items:[{id,status,owner}]}, simulation:{modelVer:string,cases:number,lastRunAt:string,hotIssues:number}, test:{plan:number,done:number,last:string,blockers:number} }`
- KnowledgeCard（阶段一 FE-only）：
  - 共性：`{ id, type, title, snippet, tags:string[], link, updatedAt }`
  - type='experience'：`issue, impact, solution, stage?, owner?`
  - type='standard'：`docId, version, scope, status('mandatory'|'recommended'), owner?`
  - type='review'：`meeting, date, conclusion, owner?, actions[]?`
  - type='material'：`material, spec, process, temperature?, supplier?`

— 以上方案面向“一期可交付 + 二期可扩展”的平衡设计，待评审确认后进入原型与接口联调阶段。
