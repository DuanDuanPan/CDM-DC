# Story 1.10: 方案阶段试验与测量驾驶舱

## Status
Draft

## Story
**As a** 方案阶段的系统/试验联合评审小组成员  
**I want** 在方案BOM的“试验与测量”域中获得聚焦试验方案设计、资源与计量保障的驾驶舱  
**so that** 我可以在评审会上判断验证覆盖是否充分、资源/仪器是否受控，并一键跳转到试验BOM执行视图

## Acceptance Criteria
1. Test Tab 顶部新增“验证成熟度摘要”卡：按需求/风险分组列出目标覆盖率、当前覆盖率、预计闭环时间，并用红黄绿状态提示是否满足阶段门（概念/初样/试样/正样），支持下载摘要为 CSV。  
   [Source: docs/需求文档.md §10.1][Source: docs/prd.md §8]
2. 在摘要下方呈现“试验方案资产”清单，集中展示试验技术要求、试验方案、大纲、试验卡片等文件，含版本号、责任人、审批状态，并允许批量导出/跳转审签记录。  
   [Source: docs/prd.md §8 Story 1.12][Source: docs/prd.md §8 文档资产]
3. 为 Test Tab 引入“结构热力图 + 需求矩阵”视角：  
   - 左侧根据 EBOM 节点显示覆盖热力图（高亮缺口节点，提供筛选）；  
   - 右侧显示需求/指标与试验计划的矩阵，支持按节点过滤与跳转到 TBOM 结构筛选；  
   - 空态提示“尚未挂接试验计划，并提供创建入口”。  
   [Source: docs/需求文档.md §10.2][Source: docs/tbom-ui-spec.md §3]
4. 增加“资源与计量保障”版块：列出关键台架/仪器/计量设备的占用计划、校准到期时间、不确定度、责任人，并允许为冲突/过期项创建阻塞；与 blockers 列表联动，给出缓解计划与影响范围。  
   [Source: docs/需求文档.md §10.3][Source: docs/prd.md §8 资源依赖]
5. 新增“仿真对标计划”表格：对每个试验计划记录关联的仿真模型、指标、目标偏差与计划对比窗口，允许一键将计划送入 Compare（参考 Story 1.9），若仿真结果缺失则显示占位与补充指引。  
   [Source: docs/front-end-spec.md §3.3][Source: docs/prd.md §8 Story 1.9]
6. “证据包导出”扩展：支持选择阶段/节点，一次导出“验证成熟度摘要 + 方案资产 + 资源/计量状态 + 仿真对标计划”的打包文件，并在 Dev Agent Record 中记录导出动作。  
   [Source: docs/prd.md §8 证据要求][Source: docs/front-end-spec.md §3.3]

## Tasks / Subtasks
- [ ] 信息架构更新：在 `components/structure/ProductStructure.tsx` 内为 `activeTab === 'test' && selectedBomType === 'solution'` 引入新的分区布局（摘要、资产、热力图/矩阵、资源/计量、对标计划、导出），并确保响应式断点下展示合理。 (AC: 1-4)  
  [Source: docs/需求文档.md §10.3][Source: docs/front-end-spec.md §2]
- [ ] 数据模型扩展：为 `solutionOverview.verification` 与相关 mock 数据补齐 `phaseTarget`, `linkedRequirements`, `resourceDependencies`, `measurementAssets`, `simulationPlan` 字段，为新组件提供示例数据。 (AC: 1-5)  
  [Source: docs/testing-bom-structure-overview.md §数据模型][Source: docs/prd.md §8]
- [ ] 结构热力图与需求矩阵组件：新建 `components/structure/verification/TestCoverageHeatmap.tsx` 与 `TestRequirementMatrix.tsx`，支持按节点/需求过滤、ARIA 可达性、空态指引。 (AC: 3)  
  [Source: docs/需求文档.md §10.2]
- [ ] 资源与计量面板：实现 `TestResourcePanel`，展示台架/仪器计划、校准状态、测量不确定度，并与 blockers 数据联动生成告警。 (AC: 4)  
  [Source: docs/需求文档.md §166][Source: docs/prd.md 资源约束]
- [ ] 仿真对标计划表 + Compare 入口：构建 `SimulationCorrelationPlan` 组件，复用 Story 1.9 的 Compare payload 逻辑，实现“一键送入 Compare”按钮及缺失占位提示。 (AC: 5)  
  [Source: docs/front-end-spec.md §3.3][Source: docs/stories/STORY-1.9-compare-test-sim.md]
- [ ] 证据包导出脚本：扩展现有导出工具，聚合各分区数据并输出 zip（含 CSV/JSON/PDF 摘要），记录导出日志，更新文档。 (AC: 6)  
  [Source: docs/prd.md §8 证据要求][Source: docs/changelog.md]
- [ ] 文档与回归：更新 `docs/front-end-spec.md`、`docs/changelog.md`、`docs/bff-mock-plan.md` 以记录新的 UI/数据契约，并对 Test Tab 相关交互执行 Playwright 回归。 (AC: 1-6)  
  [Source: docs/front-end-spec.md][Source: docs/changelog.md]

## Dev Notes
- 依赖 Story 1.5 的 BOM 切换与结构筛选能力，需确保新增热力图/矩阵与现有 `TestingTreePanel` 状态保持一致。  
- 与 Story 1.9 的 Compare 扩展共享 Compare payload 结构，新增字段需兼容已落地的对齐策略。  
- Feature Flag：沿用 `NEXT_PUBLIC_ENABLE_TBOM` 与新的 `NEXT_PUBLIC_ENABLE_TEST_COCKPIT`（待配置）双控，确保可灰度发布与快速回滚。

