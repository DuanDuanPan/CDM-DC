import type {
  ManufacturingAssumption,
  ManufacturingAssumptionConfidence,
  ManufacturingAssumptionStatus,
  ManufacturingCollaborationInfo,
  ManufacturingCollaborationTrigger,
  ManufacturingOverviewData,
  ManufacturingReadinessMetric,
  ManufacturingRiskHighlight,
  ManufacturingRiskSeverity,
  ManufacturingSnapshotMeta,
  StageGateChecklistItem,
  StageGateStatus,
  ReadinessStatus
} from './types';

const readinessStatusStyle: Record<ReadinessStatus, string> = {
  good: 'bg-emerald-500',
  warning: 'bg-amber-500',
  risk: 'bg-red-500'
};

const stageGateStatusMeta: Record<StageGateStatus, { label: string; className: string }> = {
  open: { label: '待启动', className: 'border-amber-200 bg-amber-50 text-amber-700' },
  'in-progress': { label: '推进中', className: 'border-blue-200 bg-blue-50 text-blue-700' },
  done: { label: '已完成', className: 'border-emerald-200 bg-emerald-50 text-emerald-700' }
};

const assumptionStatusMeta: Record<ManufacturingAssumptionStatus, { label: string; className: string }> = {
  pending: { label: '待确认', className: 'border-amber-200 bg-amber-50 text-amber-700' },
  validating: { label: '验证中', className: 'border-blue-200 bg-blue-50 text-blue-700' },
  validated: { label: '已确认', className: 'border-emerald-200 bg-emerald-50 text-emerald-700' }
};

const assumptionConfidenceMeta: Record<ManufacturingAssumptionConfidence, { label: string; className: string }> = {
  low: { label: '低可信', className: 'border-red-200 bg-red-50 text-red-600' },
  medium: { label: '中可信', className: 'border-amber-200 bg-amber-50 text-amber-700' },
  high: { label: '高可信', className: 'border-emerald-200 bg-emerald-50 text-emerald-700' }
};

const riskSeverityMeta: Record<ManufacturingRiskSeverity, { label: string; className: string; dotClass: string }> = {
  amber: { label: '关注', className: 'border-amber-200 bg-amber-50 text-amber-700', dotClass: 'bg-amber-500' },
  red: { label: '高风险', className: 'border-red-200 bg-red-50 text-red-600', dotClass: 'bg-red-500' }
};

const triggerIcon: Record<ManufacturingCollaborationTrigger['id'], string> = {
  review: 'ri-clipboard-check-line',
  'request-input': 'ri-mail-add-line',
  'sync-baseline': 'ri-link-unlink-m'
};

const formatPercent = (value: number) => `${Math.round(Math.min(Math.max(value, 0), 1) * 100)}%`;

const formatTimestamp = (value?: string) => {
  if (!value) return '尚未触发';
  if (!value.includes('T')) return value;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('zh-CN', { hour12: false });
};

const riskHeatLabel = (value: number) => {
  if (value >= 0.66) return '高风险暴露';
  if (value >= 0.33) return '中风险暴露';
  return '低风险暴露';
};

const ManufacturingOverview = ({
  readinessSummary,
  stageGates,
  assumptions,
  riskHighlights,
  riskRegisterLink,
  collaboration,
  snapshot
}: ManufacturingOverviewData) => {
  const openStageGates = stageGates.filter(gate => gate.status !== 'done').length;

  const renderReadinessMetrics = (metrics: ManufacturingReadinessMetric[]) => {
    if (!metrics.length) {
      return <p className="text-sm text-gray-500">暂未提交制造成熟度指标。</p>;
    }

    return metrics.map(metric => (
      <div key={metric.label}>
        <div className="flex items-center justify-between text-sm font-medium text-gray-900">
          <span>{metric.label}</span>
          <span>{formatPercent(metric.value)}</span>
        </div>
        <div className="mt-2 h-2 rounded-full bg-white">
          <div
            className={`h-full rounded-full ${readinessStatusStyle[metric.status]}`}
            style={{ width: `${Math.round(Math.min(metric.value, 1) * 100)}%` }}
          ></div>
        </div>
        {metric.note && <p className="mt-2 text-xs text-gray-600">{metric.note}</p>}
      </div>
    ));
  };

  const renderStageGates = (items: StageGateChecklistItem[]) => {
    if (!items.length) {
      return <p className="text-sm text-gray-500">暂无 Stage-Gate 条目，等待工艺团队补充。</p>;
    }

    return items.map(item => {
      const meta = stageGateStatusMeta[item.status];
      return (
        <div key={item.id} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <div className="text-sm font-semibold text-gray-900">{item.title}</div>
              <div className="mt-1 text-xs text-gray-500">负责人：{item.owner}</div>
            </div>
            <span className={`rounded-full px-2 py-0.5 text-xs ${meta.className}`}>{meta.label}</span>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-500">
            <span>最近更新：{item.updatedAt}</span>
            {item.note && (
              <span className="inline-flex items-center gap-1 text-blue-600">
                <i className="ri-information-line"></i>
                {item.note}
              </span>
            )}
          </div>
        </div>
      );
    });
  };

  const renderAssumptions = (items: ManufacturingAssumption[]) => {
    if (!items.length) {
      return <p className="text-sm text-gray-500">尚未记录制造假设，请发起“请求工艺输入”。</p>;
    }

    return items.map(item => {
      const statusMeta = assumptionStatusMeta[item.status];
      const confidenceMeta = assumptionConfidenceMeta[item.confidence];
      return (
        <div key={item.id} className="rounded-xl border border-gray-100 bg-white/60 p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="flex-1">
              <div className="text-sm font-semibold text-gray-900">{item.topic}</div>
              <div className="mt-1 text-xs text-gray-500">来源：{item.source}</div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className={`rounded-full px-2 py-0.5 text-xs ${confidenceMeta.className}`}>{confidenceMeta.label}</span>
              <span className={`rounded-full px-2 py-0.5 text-xs ${statusMeta.className}`}>{statusMeta.label}</span>
            </div>
          </div>
          <div className="mt-3 space-y-1 text-xs text-gray-600">
            {item.nextAction && (
              <div className="flex items-center gap-1">
                <i className="ri-play-circle-line text-gray-400"></i>
                <span>下一步：{item.nextAction}</span>
              </div>
            )}
            {item.dueAt && (
              <div className="flex items-center gap-1">
                <i className="ri-time-line text-gray-400"></i>
                <span>目标日期：{item.dueAt}</span>
              </div>
            )}
          </div>
        </div>
      );
    });
  };

  const renderRisks = (items: ManufacturingRiskHighlight[]) => {
    if (!items.length) {
      return <p className="text-sm text-gray-500">暂无制造风险高亮。</p>;
    }

    return items.map(item => {
      const meta = riskSeverityMeta[item.severity];
      return (
        <div key={item.id} className="rounded-xl border border-gray-100 bg-white/60 p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <span className={`h-2.5 w-2.5 rounded-full ${meta.dotClass}`}></span>
              <span>{item.title}</span>
            </div>
            <span className={`rounded-full px-2 py-0.5 text-xs ${meta.className}`}>{meta.label}</span>
          </div>
          <p className="mt-2 text-xs text-gray-600 leading-relaxed">{item.impact}</p>
          <div className="mt-2 flex items-start gap-2 text-xs text-blue-600">
            <i className="ri-lightbulb-line mt-0.5"></i>
            <span>{item.mitigation}</span>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-500">
            <span>责任人：{item.owner}</span>
            <span>复核节点：{item.reviewAt}</span>
            <span>更新：{item.updatedAt}</span>
          </div>
        </div>
      );
    });
  };

  const renderTriggers = (info: ManufacturingCollaborationInfo) => {
    if (!info.triggers.length) {
      return <p className="text-sm text-gray-500">尚未触发协同事件。</p>;
    }

    return info.triggers.map(trigger => (
      <div key={trigger.id} className="flex items-start gap-3 rounded-xl border border-gray-100 bg-white/60 p-4">
        <div className="rounded-full bg-blue-50 p-2 text-blue-600">
          <i className={`${triggerIcon[trigger.id]} text-lg`}></i>
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-gray-900">{trigger.label}</span>
            <span className="text-xs text-gray-500">责任人：{trigger.owner}</span>
          </div>
          <p className="mt-1 text-xs text-gray-600">{trigger.description}</p>
          <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-0.5 text-xs text-slate-600">
            <i className="ri-time-line"></i>
            <span>最近一次：{formatTimestamp(trigger.lastTriggeredAt)}</span>
          </div>
        </div>
      </div>
    ));
  };

  const renderSnapshot = (meta: ManufacturingSnapshotMeta) => {
    return (
      <div className="space-y-4">
        <div>
          <div className="text-xs font-medium text-gray-500">方案制造快照</div>
          <div className="mt-1 text-lg font-semibold text-gray-900">{meta.version}</div>
          <p className="mt-1 text-xs text-gray-500">发布：{meta.publishedAt} · {meta.author}</p>
          {meta.note && <p className="mt-3 text-xs text-gray-600 leading-relaxed">{meta.note}</p>}
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <div className="flex items-center justify-between text-sm text-gray-700">
            <span>未完成关卡</span>
            <span className="text-lg font-semibold text-amber-600">{openStageGates}</span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-white">
            <div
              className="h-full rounded-full bg-blue-500"
              style={{ width: `${Math.round(Math.min(Math.max(readinessSummary.gateCompletion, 0), 1) * 100)}%` }}
            ></div>
          </div>
          <p className="mt-2 text-xs text-gray-500">关卡完成度 {formatPercent(readinessSummary.gateCompletion)}</p>
        </div>
      </div>
    );
  };

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2 rounded-2xl border border-gray-100 bg-slate-50/70 p-6">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-900">制造就绪态势</h3>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
              <i className="ri-compass-3-line"></i>
              方案阶段 · 假设与风险对齐
            </span>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            聚焦制造就绪、关键假设与风险暴露，为方案评审提供“能否进入下一关”的判断依据。
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <div className="text-xs text-gray-500">整体制造成熟度</div>
              <div className="mt-1 text-2xl font-semibold text-gray-900">{formatPercent(readinessSummary.score)}</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <div className="text-xs text-gray-500">Stage-Gate 完成度</div>
              <div className="mt-1 text-2xl font-semibold text-gray-900">{formatPercent(readinessSummary.gateCompletion)}</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <div className="text-xs text-gray-500">风险热度</div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-semibold text-gray-900">{formatPercent(readinessSummary.riskHeat)}</span>
                <span className="text-xs text-gray-500">{riskHeatLabel(readinessSummary.riskHeat)}</span>
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500"
                  style={{ width: `${Math.round(Math.min(Math.max(readinessSummary.riskHeat, 0), 1) * 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
          <div className="mt-6 space-y-4">
            {renderReadinessMetrics(readinessSummary.metrics)}
          </div>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          {renderSnapshot(snapshot)}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Stage-Gate 就绪清单</h4>
              <p className="mt-1 text-xs text-gray-500">列出方案阶段必须通过的制造/供应关卡。</p>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {renderStageGates(stageGates)}
          </div>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">协同触发器</h4>
              <p className="mt-1 text-xs text-gray-500">驱动工艺、设计、供应链同步的关键动作。</p>
            </div>
            <span className="text-xs text-gray-400">更新：{formatTimestamp(collaboration.updatedAt)}</span>
          </div>
          <div className="mt-4 space-y-3">
            {renderTriggers(collaboration)}
          </div>
          {collaboration.note && <p className="mt-4 text-xs text-gray-600">{collaboration.note}</p>}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">制造假设日志</h4>
              <p className="mt-1 text-xs text-gray-500">记录方案阶段仍成立的关键前提，按风险排序。</p>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {renderAssumptions(assumptions)}
          </div>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">制造风险高亮</h4>
              <p className="mt-1 text-xs text-gray-500">Top 风险与缓解动作，供评审快速聚焦。</p>
            </div>
            {riskRegisterLink && (
              <a
                href={riskRegisterLink}
                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
              >
                查看全部
                <i className="ri-external-link-line"></i>
              </a>
            )}
          </div>
          <div className="mt-4 space-y-3">
            {renderRisks(riskHighlights)}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ManufacturingOverview;
