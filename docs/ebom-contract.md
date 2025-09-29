# 设计BOM（E‑BOM）最小数据契约（MVP）

目标（一期，浏览/对比）：
- 泛化：兼容多类型 XBOM，当前落地 E‑BOM；
- 主数据源：本系统；
- 安全：仅涉密分级（不含出口管制字段）；
- 能力：树浏览 + 基线对比（新增/移除/数量/版本变化）。

## 核心对象

### EbomPartRef
- `id`: string，树节点唯一标识（建议“路径式”便于稳定对比）。
- `partNumber`: string，部件号。
- `name`: string，名称。
- `revision`: string，版本（如 A/B/C）。
- `lifecycle`: Draft | Released | Obsolete。
- `confidentiality`: 公开 | 内部 | 秘密 | 机密。
- `findNo?`: string，位置号。
- `qty?`: number，数量（默认 1）。
- `uom?`: string，单位（EA/g/mL…）。
- `phantom?`: boolean，幻影件/打包件。
- `safetyCritical?`: boolean，安全关键标记（SC/CC）。
- `llp?`: boolean，寿命限制件标记（LLP）。
- `effectivity?`: { `serialRange?`, `dateRange?`, `blockPoint?` }。
- `substitutes?`: [{ `partNumber`, `reason?`, `priority?` }] 替代/取代链。
- `links?`: { `designDocId?`, `cadId?`, `simBomRef?`, `testBomRef?` } 关联。

### EbomBaseline
- `id`, `label`, `date`, `description?`。
- `root`: EbomTreeNode（递归 children）。

## 对比规则（MVP）
- 基于节点 `id` 一致性进行集合对比：
  - 不在新基线 → `removed`；不在旧基线 → `added`；
  - 在两侧均存在 → 比较 `qty`, `revision`；差异 → `modified` 并记录字段级变化。
- 后续扩展：`findNo`、`uom`、`lifecycle`、`effectivity`、`substitutes` 的差异。

## 校验（前端基础校验）
- 树无环；同级 `id` 唯一；数量为正；涉密字段必填；SC/LLP 若为 true，显示对应徽标。

## UI 布局（XBOM 面板）
- 左侧：E‑BOM 树；
- 右侧：
  - 顶部信息条：基线选择与“浏览/对比”能力提示；
  - 对比表：列出新增/移除/修改；
  - 详情卡：随节点切换展示“基本信息 / 配置与效期 / 替代链 / 关联链接”；
  - 快捷跳转：仿真BOM / 试验BOM（设计域内快速跳转）。

## 文件位置
- 类型：`components/structure/ebom/types.ts`
- 示例数据：`components/structure/ebom/data.ts`
- 面板：`components/structure/ebom/EbomDetailPanel.tsx`
- 集成：`components/structure/ProductStructure.tsx`（BOM 类型 = `design` 时启用）。

