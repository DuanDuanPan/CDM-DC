# XBOM 摘要卡片协议与 UI 规范（TASK-006）

状态：完成（草案） · 2025-09-28

## 1. 目标
为设计BOM右侧提供统一的“需求/仿真/试验”摘要卡标准，含字段规范、时效与可信级别标签、统一跳转组件携带上下文。

## 2. 数据协议（XbomSummary）
```ts
interface XbomSummary {
  nodeId: string;
  source: {
    system: 'REQSYS' | 'SIMSYS' | 'TESTSYS';
    updatedAt: string;    // ISO
    trust: 'high' | 'mid' | 'low';
    freshnessSec: number; // 建议阈值标签
  };
  requirement?: {
    coverage: number; // 0..1
    items: Array<{ id: string; title: string; status: 'open'|'done'|'risk'; owner?: string }>;
  };
  simulation?: {
    modelVer: string;
    cases: number;
    lastRunAt?: string;
    hotIssues?: number;
    queueLen?: number; // 计算队列提示
  };
  test?: {
    plan: number; done: number; blockers?: number; last?: string; anomalies?: Array<{ type: string; count: number }>; // 异常分类摘要
  };
  links?: {
    detailUrl: string; // 外部系统深链
    context?: Record<string,string>; // 跳转上下文参数
  };
}
```

## 3. UI 规范
- 卡片头：系统图标 + 名称 + 数据来源/时效徽标（绿≤24h，黄≤72h，红>72h）。
- 主体：
  - 需求卡：覆盖率进度条 + 3条需求摘要（优先 open/risk）。
  - 仿真卡：模型版本 + 用例数 + 最近计算时间 + 热点问题数。
  - 试验卡：计划/完成数 + 最近一次结论 + 阻塞数。
- 底部：统一“查看详情”按钮（使用跳转组件携带 `nodeId/system/updatedAt`）。

## 4. 跳转组件（JumpSpec）
```ts
interface JumpSpec {
  from: 'EBOM';
  nodeId: string;
  system: 'REQSYS'|'SIMSYS'|'TESTSYS';
  at: string; // ISO now
  url: string; // 目标地址
  context?: Record<string,string>; // e.g., partNumber, demandId
}
```
- 审计：前端先写入本地 `jump_log`（待后端接管）。

## 5. 刷新策略
- 默认每 1 小时刷新，支持“手动刷新”按钮；
- 若 `freshnessSec > 72h*3600` 显示红色标签并提示“可能过期”。

## 6. 开放问题
- 需求系统字段是否包含密级，需否落在卡片上？
- 仿真卡是否展示“计算队列长度”？
- 试验卡的“异常类型”是否需要分类展示？
