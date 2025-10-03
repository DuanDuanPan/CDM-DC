# 设计BOM（E‑BOM）最小数据契约（MVP+Sprint5 扩展）

目标（一期，浏览/对比）：
- 泛化：兼容多类型 XBOM，当前落地 E‑BOM；
- 主数据源：本系统；
- 安全：仅涉密分级（不含出口管制字段）；
- 能力：树浏览 + 基线对比（新增/移除/数量/版本变化）。

> Sprint5 将前端体验扩展为“基线工作台 + 差异追溯 + 迷你树规模守卫 + 效期可视化 + 替代链精细化 + 文档责任提醒”，以下契约同步补齐 Mock 字段，真实接口待冲刺6 对接。

## 核心对象

### EbomBaseline
```ts
interface EbomBaseline {
  id: string;
  label: string;
  date: string; // YYYY-MM-DD
  description?: string;
  category?: 'development' | '试制' | '量产' | '验证';
  applicableBatch?: string[];
  techState?: string; // Release 标签
  releasedBy?: string;
  tags?: string[];
  riskLevel?: 'low' | 'medium' | 'high';
  root: EbomTreeNode;
}
```
- **新增字段**：`category`、`applicableBatch`、`techState`、`tags`、`riskLevel` 支撑基线工作台展示/筛选。
- 前端在本期通过 `localStorage` 维护 `favorites`、`recent`，接口补齐后由 BFF 持久化。

### EbomPartRef / EbomTreeNode
```ts
interface EbomPartRef {
  id: string;
  partNumber: string;
  name: string;
  revision: string;
  lifecycle: 'Draft' | 'Released' | 'Obsolete';
  confidentiality: '公开' | '内部' | '秘密' | '机密';
  class?: 'fan-blade' | 'fan-disk' | 'compressor-stage' | 'combustor-liner' | 'turbine-disk' | 'turbine-blade' | 'gearbox' | 'fuel-pump' | 'controller' | 'generic';
  path?: string[]; // 自动透传树路径
  productFamily?: string;
  subsystem?: string;
  owner?: string; // 责任人/小组
  ownerDiscipline?: string; // 责任专业
  nodeCategory?: string; // engine/module/part
  findNo?: string;
  qty?: number;
  uom?: string;
  orientation?: string; // 安装方向
  dependencies?: string[]; // 装配前提
  qualityChecks?: string[]; // 质量控制点
  phantom?: boolean;
  safetyCritical?: boolean;
  llp?: boolean;
  parentId?: string | null;
  effectivity?: Effectivity;
  effectivityTimeline?: EffectivityTimelineSegment[];
  effectivityCoverage?: number; // 0-1
  effectivityConflicts?: EffectivityConflict[];
  crossDomainStatuses?: CrossDomainStatus[]; // 仿真/试验/制造对齐情况
  substitutes?: EbomSubstitute[];
  links?: {
    designDocId?: string;
    cadId?: string;
    gltfUrl?: string;
    posterUrl?: string;
    simBomRef?: { id: string; label: string };
    testBomRef?: { id: string; label: string };
    docs?: EbomDocumentLink[];
  };
  designParams?: Array<{ name: string; value: string; unit?: string; status?: 'ok' | 'risk' | 'watch' }>;
  changeTrace?: {
    ecoId?: string;
    ccbStatus?: 'pending' | 'approved' | 'rejected' | 'in-review';
    approvalState?: 'draft' | 'in-review' | 'approved' | 'released';
    lastChangedBy?: string;
    lastChangedAt?: string;
  };
  dataQuality?: {
    score: number; // 0-1
    updatedAt: string;
    updatedBy: string;
    source: 'manual' | 'system' | 'simulation' | 'test';
  };
}
```
- `effectivityTimeline`/`effectivityCoverage` 驱动冲刺5 时间轴 + 覆盖率展示。
- `crossDomainStatuses` 驱动仿真/试验一致性卡片。
- `changeTrace`、`dataQuality`、`ownerDiscipline` 供差异表徽标、数据质量提醒。

### EffectivityTimelineSegment
```ts
interface EffectivityTimelineSegment {
  id: string;
  label: string;
  start: string; // YYYY-MM-DD
  end: string;
  status: 'in-range' | 'warning' | 'expired';
  notes?: string;
}
```

### EffectivityConflict
```ts
interface EffectivityConflict {
  id: string;
  severity: 'low' | 'medium' | 'high';
  title: string;
  description?: string;
}
```

### CrossDomainStatus
```ts
interface CrossDomainStatus {
  label: string;
  system: 'simulation' | 'test' | 'manufacturing' | 'quality';
  status: 'aligned' | 'mismatch' | 'pending';
  lastSynced?: string;
  link?: string;
  coverage?: number;
}
```

### EbomSubstitute
```ts
interface EbomSubstitute {
  partNumber: string;
  reason?: string;
  priority?: number;
  type?: 'permanent' | 'temporary' | 'repair';
  effectiveRange?: { start?: string; end?: string; batch?: string };
  approver?: string;
  approvalAt?: string;
  inventoryPolicy?: 'use-first' | 'controlled' | 'limit';
  riskLevel?: 'low' | 'medium' | 'high';
  compareParams?: Array<{ name: string; baseline: string; substitute: string; unit?: string }>;
}
```
- 用于替代链卡片、对比弹窗、库存策略提示。

### EbomDocumentLink
```ts
interface EbomDocumentLink {
  id: string;
  name: string;
  type: 'spec' | 'drawing' | 'calc' | 'review' | 'report' | 'image';
  version?: string;
  updatedAt?: string;
  owner?: string;
  url?: string;
  classification?: Confidentiality;
  approver?: string;
  approvalAt?: string;
  reviewDue?: string;
  status?: 'approved' | 'pending' | 'in-review' | 'missing';
}
```
- `status` + `reviewDue` 驱动文档责任提醒与“待上传”提示。

### EbomDiffChange（差异表）
```ts
interface EbomDiffChange {
  id: string;
  partNumber: string;
  name: string;
  changeType: 'added' | 'removed' | 'modified';
  fields?: Array<{ field: string; from?: string; to?: string }>;
  path: string[];
  safetyCritical?: boolean;
  llp?: boolean;
  ownerDiscipline?: string;
  ecoId?: string;
  ccbStatus?: 'pending' | 'approved' | 'rejected' | 'in-review';
  approvalState?: 'draft' | 'in-review' | 'approved' | 'released';
}
```
- 差异表用于筛选/导出时添加责任专业、ECO、审批状态。

## 对比规则（MVP 保持）
- 基于节点 `id` 一致性进行集合对比：
  - 不在新基线 → `removed`；不在旧基线 → `added`；
  - 在两侧均存在 → 比较数量/版本/单位/生命周期/效期/替代链 → `modified`。
- Sprint5 增补：
  - 结构路径 `path` 用于迷你树、导出。
  - `ownerDiscipline` 支持责任专业筛选。

## 校验（前端 Mock 自检）
- 树无环；同级 `id` 唯一；数量为正；涉密字段必填；SC/LLP 若为 true，显示对应徽标。
- 时间轴需按 `start`→`end` 排序；`coverage` 0~1；`compareParams` 字段一致。

## 文件位置
- 类型定义：`components/structure/ebom/types.ts`
- Mock 数据：`components/structure/ebom/data.ts`
- 面板：`components/structure/ebom/EbomDetailPanel.tsx`
- 迷你树：`components/structure/ebom/EbomMiniTreePreview.tsx`
- 状态共享：`components/structure/ebom/useEbomCompareState.ts`

## Mock 策略（冲刺5）
- 所有扩展字段在前端 Mock 填充，真实接口对接计划在冲刺6 启动。
- 性能测试使用 10k+ 节点生成脚本（待补充于 `docs/mocks`）。
- 收藏/最近基线暂存 `localStorage`，生产实现交由 BFF。

