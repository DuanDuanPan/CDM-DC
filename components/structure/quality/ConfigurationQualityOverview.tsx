interface BaselineMetric {
  label: string;
  value: string;
  status: 'aligned' | 'deviation' | 'risk';
  trend: string;
  note?: string;
}

interface ChangeImpact {
  id: string;
  title: string;
  domain: string;
  impact: string;
  scope: string;
  owner: string;
  status: 'assessing' | 'approving' | 'implemented';
  risk: 'low' | 'medium' | 'high';
  due: string;
  note?: string;
}

interface BaselineGap {
  item: string;
  plan: string;
  current: string;
  delta: string;
  owner: string;
  status: 'ok' | 'watch' | 'issue';
  note?: string;
}

interface QualityGate {
  name: string;
  stage: string;
  owner: string;
  scheduled: string;
  completion: number;
  status: 'on-track' | 'attention' | 'delayed';
  finding?: string;
}

interface NonConformance {
  id: string;
  type: string;
  severity: 'minor' | 'major' | 'critical';
  module: string;
  owner: string;
  status: 'open' | 'containment' | 'closed';
  due: string;
  note?: string;
}

interface ConfigurationQualityOverviewProps {
  baselineMetrics: BaselineMetric[];
  changeImpacts: ChangeImpact[];
  baselineGaps: BaselineGap[];
  qualityGates: QualityGate[];
  nonConformances: NonConformance[];
}

const baselineStatusStyle: Record<BaselineMetric['status'], string> = {
  aligned: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  deviation: 'border-amber-200 bg-amber-50 text-amber-700',
  risk: 'border-red-200 bg-red-50 text-red-700'
};

const changeStatusStyle: Record<ChangeImpact['status'], string> = {
  assessing: 'bg-slate-100 text-slate-600 border border-slate-200',
  approving: 'bg-blue-50 text-blue-600 border border-blue-200',
  implemented: 'bg-emerald-50 text-emerald-600 border border-emerald-200'
};

const changeRiskStyle: Record<ChangeImpact['risk'], string> = {
  low: 'text-emerald-600',
  medium: 'text-amber-600',
  high: 'text-red-600'
};

const gapStatusStyle: Record<BaselineGap['status'], string> = {
  ok: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  watch: 'border-amber-200 bg-amber-50 text-amber-700',
  issue: 'border-red-200 bg-red-50 text-red-600'
};

const gateStatusStyle: Record<QualityGate['status'], string> = {
  'on-track': 'text-emerald-600',
  attention: 'text-amber-600',
  delayed: 'text-red-600'
};

const nonConformanceSeverityStyle: Record<NonConformance['severity'], string> = {
  minor: 'bg-slate-100 text-slate-600 border border-slate-200',
  major: 'bg-amber-50 text-amber-700 border border-amber-200',
  critical: 'bg-red-50 text-red-600 border border-red-200'
};

const nonConformanceStatusStyle: Record<NonConformance['status'], string> = {
  open: 'border-red-200 bg-red-50 text-red-600',
  containment: 'border-amber-200 bg-amber-50 text-amber-700',
  closed: 'border-emerald-200 bg-emerald-50 text-emerald-700'
};

const secondaryButtonClass =
  'rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-600 transition-colors hover:border-blue-300 hover:text-blue-600';
const primaryButtonClass =
  'rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white shadow-sm hover:bg-blue-700';

const ConfigurationQualityOverview = ({
  baselineMetrics,
  changeImpacts,
  baselineGaps,
  qualityGates,
  nonConformances
}: ConfigurationQualityOverviewProps) => (
  <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
      <div className="flex-1 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-lg font-semibold text-gray-900">配置与质量保障</h3>
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
            <i className="ri-database-2-line"></i>
            数据来源 · CCB / 质量问题库
          </span>
        </div>
        <p className="text-sm text-gray-500">
          跟踪基线一致性、变更影响与质量事件，保障方案配置稳定并及时闭环缺陷。
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {baselineMetrics.map(metric => (
            <div key={metric.label} className={`rounded-xl border bg-slate-50/80 p-3 ${baselineStatusStyle[metric.status]}`}>
              <div className="text-xs text-gray-500">{metric.label}</div>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-2xl font-semibold text-gray-900">{metric.value}</span>
                <span className={`text-xs ${metric.trend.startsWith('-') ? 'text-red-600' : metric.trend.startsWith('+') ? 'text-emerald-600' : 'text-gray-400'}`}>
                  {metric.trend}
                </span>
              </div>
              {metric.note && <div className="mt-2 text-xs text-gray-600 leading-relaxed">{metric.note}</div>}
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <button type="button" className={secondaryButtonClass}>
          <i className="ri-git-commit-line mr-1"></i>
          提交配置变更
        </button>
        <button type="button" className={secondaryButtonClass}>
          <i className="ri-shield-check-line mr-1"></i>
          启动质量审查
        </button>
        <button type="button" className={primaryButtonClass}>
          <i className="ri-file-chart-line mr-1"></i>
          查看配置报告
        </button>
      </div>
    </div>

    <div className="mt-6 grid gap-6 xl:grid-cols-7">
      <div className="rounded-2xl border border-gray-100 bg-slate-50/70 p-5 xl:col-span-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-900">变更影响分析</h4>
          <span className="text-xs text-gray-400">{changeImpacts.length} 项待跟踪</span>
        </div>
        <div className="mt-4 space-y-3">
          {changeImpacts.map(impact => (
            <div key={impact.id} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-sm font-medium text-gray-900">{impact.title}</div>
                  <div className="text-xs text-gray-500">{impact.id} · {impact.domain}</div>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs ${changeStatusStyle[impact.status]}`}>
                  {impact.status === 'assessing' ? '评估中' : impact.status === 'approving' ? '审批中' : '已实施'}
                </span>
              </div>
              <div className="mt-2 grid gap-2 text-xs text-gray-500 sm:grid-cols-2">
                <span>影响范围：{impact.scope}</span>
                <span>责任人：{impact.owner}</span>
                <span>完成目标：{impact.due}</span>
                <span>
                  风险：<span className={`font-medium ${changeRiskStyle[impact.risk]}`}>{impact.risk === 'low' ? '低' : impact.risk === 'medium' ? '中' : '高'}</span>
                </span>
              </div>
              <p className="mt-2 text-xs text-gray-600 leading-relaxed">{impact.impact}</p>
              {impact.note && <div className="mt-2 text-xs text-amber-600">{impact.note}</div>}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm xl:col-span-3">
        <h4 className="text-sm font-medium text-gray-900">基线差异与闭环</h4>
        <div className="mt-4 space-y-3">
          {baselineGaps.map(gap => (
            <div key={gap.item} className="rounded-xl border border-gray-100 bg-slate-50/80 p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-900">{gap.item}</div>
                  <div className="text-xs text-gray-500">计划 {gap.plan} · 当前 {gap.current}</div>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs ${gapStatusStyle[gap.status]}`}>{gap.delta}</span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                <span>责任人：{gap.owner}</span>
                <span>状态：{gap.status === 'ok' ? '已对齐' : gap.status === 'watch' ? '需关注' : '偏差'}</span>
              </div>
              {gap.note && <div className="mt-2 text-xs text-gray-600 leading-relaxed">{gap.note}</div>}
            </div>
          ))}
        </div>
      </div>
    </div>

    <div className="mt-6 grid gap-6 xl:grid-cols-7">
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm xl:col-span-4">
        <h4 className="text-sm font-medium text-gray-900">质量门审核</h4>
        <div className="mt-4 space-y-3">
          {qualityGates.map(gate => (
            <div key={gate.name} className="rounded-xl border border-gray-100 bg-slate-50/80 p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-900">{gate.name}</div>
                  <div className="text-xs text-gray-500">阶段：{gate.stage} · {gate.owner}</div>
                </div>
                <span className={`text-xs font-semibold ${gateStatusStyle[gate.status]}`}>
                  {gate.status === 'on-track' ? '按计划' : gate.status === 'attention' ? '需关注' : '延迟'}
                </span>
              </div>
              <div className="mt-2">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>完成度</span>
                  <span>{Math.round(gate.completion * 100)}%</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-white">
                  <div className="h-full rounded-full bg-blue-500" style={{ width: `${Math.min(gate.completion * 100, 100)}%` }}></div>
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-500">计划节点：{gate.scheduled}</div>
              {gate.finding && <div className="mt-2 text-xs text-amber-600">{gate.finding}</div>}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm xl:col-span-3">
        <h4 className="text-sm font-medium text-gray-900">质量问题与纠正</h4>
        <div className="mt-4 space-y-3">
          {nonConformances.map(issue => (
            <div key={issue.id} className="rounded-xl border border-gray-100 bg-slate-50/80 p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-900">{issue.type}</div>
                  <div className="text-xs text-gray-500">{issue.id} · {issue.module}</div>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs ${nonConformanceSeverityStyle[issue.severity]}`}>
                  {issue.severity === 'minor' ? '一般' : issue.severity === 'major' ? '严重' : '关键'}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                <span>责任人：{issue.owner}</span>
                <span>截止：{issue.due}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs ${nonConformanceStatusStyle[issue.status]}`}>
                  {issue.status === 'open' ? '未关闭' : issue.status === 'containment' ? '遏制中' : '已关闭'}
                </span>
              </div>
              {issue.note && <div className="mt-2 text-xs text-gray-600 leading-relaxed">{issue.note}</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

export default ConfigurationQualityOverview;
