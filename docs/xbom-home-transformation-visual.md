# XBOM 首页 · 转化流程可视化区域设计

状态：草案 · 2025-10-28

## 1. 设计目标
- 在 XBOM 首页清晰展示 RBOM→ABOM→DBOM→CAEBOM/TBOM 的转化逻辑，帮助用户理解跨域数据如何沿数字线索流动。
- 结合“原理对象”概念，让用户在任意阶段均能追溯到统一的工程原理锚点。
- 提供行动入口，引导用户直接跳转到对应 BOM 视图或查看详细文档。

## 2. 信息架构
```
┌──────────────────────────────────────────────────┐
│ Title 区：XBOM 转化全景 + 更新时间 + 说明标签      │
├──────────────────────────────────────────────────┤
│ 主时间轴（横向 5 步）                           │
│  RBOM → ABOM → DBOM → CAEBOM → TBOM             │
│  · 每步显示核心产出、原理对象作用、关键字段       │
├──────────────────────────────────────────────────┤
│ 原理对象提示卡 + 关键指标（底部两列）            │
│  · 左：原理对象贯穿说明 + 快捷跳转                 │
│  · 右：最新转化 KPI（覆盖率、映射完整度、异常数）  │
└──────────────────────────────────────────────────┘
```

## 3. 组件布局
- 区块放置：位于首页 hero 区块下方、角色快捷入口之前（替换/扩展现有 `FLOW_STEPS` 区块）。
- 容器样式：`rounded-3xl border border-blue-100 bg-gradient-to-r from-white via-blue-50/60 to-indigo-50/40 shadow-sm`。
- 视觉注意：首页 hero 已有渐变背景，设计评审需对比叠加效果；若层级过重，优先降级本区背景为浅色实体或加大外边距分隔。
- 内部分为三个分区：
  1. **标题行**：左侧标题 + 副标题，右侧显示最后同步时间与“查看详细机制”链接。
  2. **流程时间轴**：五段横向步骤卡（响应式在小屏改为纵向）。
  3. **底部信息条**：原理对象卡片 + 指标卡片并排（在小屏垂直堆叠）。

## 4. 交互与文案
### 4.1 标题区
- 标题：`XBOM 转化全景`。
- 副标题：`从需求到试验的数字主线，原理对象贯穿每一步`。
- 状态徽标：显示 `lastSyncedAt`（例如“更新：2025-10-25 14:05”）。
- 链接按钮：`了解转化机制` → 打开 `docs/xbom-transformation-mechanism.md` 的在线预览；使用跳转组件传入 `doc=xbom-transformation`。

### 4.2 时间轴步骤
每个步骤卡包含：
- 图标（Remix Icon 建议）
- 主标题（例如“RBOM · 需求结构”）
- 副标题（例如“系统需求 → 原理对象映射”）
- 关键信息点（2 条 bullet）：
  - 数据产出（如“需求树 + 原理对象 ID”）
  - 下一步输入/触发条件（如“系统设计工具生成候选方案”）
- CTA：`打开 {BOM}` 按钮 → 调用 `onQuickNavigate`。
- 悬停显示更多细节：利用 Tooltip 展示核心字段列表。
- 当步骤出现校验异常（如映射缺失）时，步骤卡底部显示红色警示条，文案 `发现 3 项未映射原理对象`。

### 4.3 原理对象卡
- 标题：`原理对象 · 统一锚点`。
- 内容：
  - 简述原理对象定义及作用。
  - 展示最近活跃的原理对象（如“PO-TP-COAX · 状态：选定 · 覆盖节点 5 个”）。
  - CTA：`查看原理对象词典` → 跳转至对应列表页/文档。
- 背景图形：淡雅原理图样式或 icon overlay。

### 4.4 指标卡
- 标题：`转化健康度`。
- 指标列表（示例）：
  - `映射完整度：96%`（RBOM → 原理对象 → DBOM 覆盖率）
  - `待补仿真节点：4`（DBOM → CAEBOM 缺口）
  - `试验计划滞后：1`（TBOM 未按基线同步）
- 每个指标附状态颜色（绿/黄/红阈值可配置）。
- CTA：`查看详细指标` → 打开 Dashboard。

## 5. 数据契约 (前端 props 建议)
```ts
interface TransformationOverviewData {
  lastSyncedAt: string; // ISO 时间
  steps: Array<{
    id: 'rbom' | 'abom' | 'dbom' | 'caebom' | 'tbom';
    title: string; // RBOM · 需求结构
    subtitle: string; // 系统需求 → 原理对象映射
    icon: string; // Remix icon class
    highlights: string[]; // 2-3 条 bullet
    bomTarget: QuickNavigateTarget;
    warnings?: Array<{ level: 'info'|'warning'|'error'; message: string }>;
  }>;
  principleHighlight: {
    id: string;
    name: string;
    status: 'candidate' | 'selected' | 'retired';
    coverage: number; // 0..1
    relatedNodes: number; // 关联节点数
    updatedAt: string;
  };
  healthIndicators: Array<{
    label: string;
    value: string; // "96%"
    trend?: 'up'|'down'|'flat';
    status: 'good'|'warn'|'alert';
    hint?: string; // tooltip 提示
    link?: QuickNavigateTarget;
  }>;
}
```
- 缺省行为：若 `principleHighlight` 缺失，则隐藏原理对象卡，转而显示 `CTA` 引导用户创建。
- 数据来源：
  - `lastSyncedAt`/`steps`: 数字线索服务 `GET /xbom/transformation/overview`。
  - `principleHighlight`: 原理对象词典服务 `GET /principles/highlight`。
  - `healthIndicators`: 指标服务 `GET /metrics/transformation`。

## 6. 文档预览实现
- 采用内嵌 Markdown 预览：点击“了解转化机制”后，加载 `docs/xbom-transformation-mechanism.md` 并在统一的 `Modal`/`Drawer` 中渲染，沿用现有 UI 组件库。
- 封装 `useMarkdownPreview(docId)` hook，负责请求、缓存与错误处理；后续若改为外部文档系统，只需替换 hook 内部实现。
- 若解析失败，显示降级提示与原始文件下载按钮，确保用户仍可获取信息。

## 7. 数据依赖与 Mock 计划
- 首次上线阶段使用本地 mock：在 `public/mock/xbom-transformation.json` 或 `app/api` 目录提供静态数据，并在 Storybook 中复用。
- `useTransformationOverview()` hook 先消费 mock 接口，并暴露 `loading/error/data` 状态，便于切换到真实 API。
- 与后端约定：健康指标返回数值（number），前端统一格式化为百分比或数量字符串；警示信息返回数组以支持多条提示。
- mock 数据至少覆盖三类场景（正常、告警、缺失），配合单元测试验证 UI 呈现。

## 8. 响应式与可访问性
- 中小屏（<1024px）：时间轴改为纵向堆叠，CTA 按钮宽度 100%。
- 移动端显示顺序：时间轴 → 原理对象卡 → 指标卡。
- 使用 `aria-labelledby` 将标题关联到区域容器，保证屏幕阅读器读取顺序。CTA 按钮附 `aria-label` 提示目标视图。

## 9. 实施步骤建议
1. **组件搭建**：在 `components/structure/ProductStructureHome.tsx` 中新增 `TransformationOverview` 子组件，替代现有 `FLOW_STEPS`。
2. **数据接入**：定义 `useTransformationOverview()` hook，从暂存 mock 数据开始，后续对接真实 API。
3. **指标与警示**：引入状态色 token（`bg-green-100 text-green-600` 等），并在有警示时展示 tooltip。
4. **文档链接**：集成跳转组件，链接到 `XBOM 转化机制说明` 文档。
5. **验收清单**：
   - 各步骤 CTA 能正确触发 `onQuickNavigate`。
   - 原理对象卡显示最新状态或引导创建。
   - 指标卡根据状态显示颜色；当 `status='alert'` 时出现警示 icon。
   - 删除旧的 `FLOW_STEPS` 常量并更新单元测试/故事书（若有）。

## 10. 后续扩展
- 加入 `变更影响视图`，显示最近的 ECO 对哪些步骤产生影响。
- 在每个步骤卡中加入“最近更新”标签，展示最新的仿真/试验证据数量。
- 支持“全屏流程图”，提供更复杂的跨系统映射可视化。
