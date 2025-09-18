interface ControlInterface {
  name: string;
  signal: string;
  latency: string;
  redundancy: string;
  status: 'ok' | 'warning' | 'risk';
  note?: string;
}

interface ControlStrategy {
  title: string;
  mode: string;
  update: string;
  owner: string;
  note?: string;
}

interface DiagnosticMetric {
  label: string;
  value: number;
  status: 'good' | 'warning' | 'risk';
  note?: string;
}

interface ControlOverviewProps {
  interfaces: ControlInterface[];
  strategies: ControlStrategy[];
  diagnostics: DiagnosticMetric[];
}

const interfaceStatusStyle: Record<ControlInterface['status'], string> = {
  ok: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  warning: 'border-amber-200 bg-amber-50 text-amber-700',
  risk: 'border-red-200 bg-red-50 text-red-700'
};

const diagnosticStyle: Record<DiagnosticMetric['status'], string> = {
  good: 'text-emerald-600',
  warning: 'text-amber-600',
  risk: 'text-red-600'
};

const formatPercent = (value: number) => `${Math.round(value * 100)}%`;

const secondaryButtonClass =
  'rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-600 transition-colors hover:border-blue-300 hover:text-blue-600';
const primaryButtonClass =
  'rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white shadow-sm hover:bg-blue-700';

const ControlOverview = ({ interfaces, strategies, diagnostics }: ControlOverviewProps) => (
  <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-lg font-semibold text-gray-900">控制与电子概览</h3>
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
            <i className="ri-database-2-line"></i>
            数据来源 · 控制系统台账 / 仿真回放
          </span>
        </div>
        <p className="text-sm text-gray-500">
          涵盖关键接口规格、控制策略版本与诊断覆盖度，确保控制链路和健康管理符合要求。
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <button type="button" className={secondaryButtonClass}>
          <i className="ri-link-m mr-1"></i>
          校验接口
        </button>
        <button type="button" className={primaryButtonClass}>
          <i className="ri-save-3-line mr-1"></i>
          导出控制策略
        </button>
      </div>
    </div>

    <div className="mt-6 grid gap-6 xl:grid-cols-3">
      <div className="rounded-2xl border border-gray-100 bg-slate-50/70 p-5">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-900">关键接口</h4>
          <span className="text-xs text-gray-400">{interfaces.length} 条</span>
        </div>
        <div className="mt-4 space-y-3">
          {interfaces.map(inter => (
            <div key={inter.name} className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
              <div className="flex items-center justify-between text-sm font-medium text-gray-900">
                <span>{inter.name}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs ${interfaceStatusStyle[inter.status]}`}>
                  {inter.status === 'ok' ? '正常' : inter.status === 'warning' ? '关注' : '风险'}
                </span>
              </div>
              <div className="mt-2 grid gap-1 text-xs text-gray-600">
                <span>信号：{inter.signal}</span>
                <span>延迟：{inter.latency}</span>
                <span>冗余：{inter.redundancy}</span>
                {inter.note && <span>备注：{inter.note}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <h4 className="text-sm font-medium text-gray-900">控制策略</h4>
        <div className="mt-4 space-y-3">
          {strategies.map(strategy => (
            <div key={strategy.title} className="rounded-xl border border-gray-100 bg-slate-50/80 p-3">
              <div className="text-sm font-medium text-gray-900">{strategy.title}</div>
              <div className="mt-1 text-xs text-gray-500">模式：{strategy.mode}</div>
              <div className="mt-1 text-xs text-gray-500">责任人：{strategy.owner}</div>
              <div className="mt-1 text-xs text-gray-500">更新时间：{strategy.update}</div>
              {strategy.note && <p className="mt-2 text-xs text-gray-600">{strategy.note}</p>}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <h4 className="text-sm font-medium text-gray-900">诊断覆盖度</h4>
        <div className="mt-4 space-y-3">
          {diagnostics.map(metric => (
            <div key={metric.label} className="rounded-xl border border-gray-100 bg-slate-50/80 p-3">
              <div className="flex items-center justify-between text-sm font-medium text-gray-900">
                <span>{metric.label}</span>
                <span className={diagnosticStyle[metric.status]}>{formatPercent(metric.value)}</span>
              </div>
              {metric.note && <p className="mt-1 text-xs text-gray-500">{metric.note}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

export default ControlOverview;
