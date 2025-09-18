interface ThermalScenario {
  id: string;
  name: string;
  maxTemp: string;
  target: string;
  heatFlux: string;
  cooling: string;
  status: 'good' | 'warning' | 'risk';
}

interface ThermalEffectiveness {
  label: string;
  value: number;
  trend: string;
  status: 'good' | 'warning' | 'risk';
  note?: string;
}

interface ThermalOverviewProps {
  scenarios: ThermalScenario[];
  effectiveness: ThermalEffectiveness[];
  assumptions: string[];
}

const statusBadge: Record<ThermalScenario['status'], string> = {
  good: 'bg-emerald-50 text-emerald-600 border border-emerald-200',
  warning: 'bg-amber-50 text-amber-600 border border-amber-200',
  risk: 'bg-red-50 text-red-600 border border-red-200'
};

const trendStyle = (trend: string) =>
  trend.startsWith('+')
    ? 'text-emerald-600'
    : trend.startsWith('-')
    ? 'text-red-600'
    : 'text-gray-500';

const secondaryButtonClass =
  'rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-600 transition-colors hover:border-blue-300 hover:text-blue-600';
const primaryButtonClass =
  'rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white shadow-sm hover:bg-blue-700';

const ThermalOverview = ({ scenarios, effectiveness, assumptions }: ThermalOverviewProps) => (
  <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-lg font-semibold text-gray-900">热防护与冷却概览</h3>
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
            <i className="ri-database-2-line"></i>
            数据来源 · 热分析 / 环境试验
          </span>
        </div>
        <p className="text-sm text-gray-500">
          覆盖核心燃烧区、涡轮部件和尾喷口的温度、热流密度及冷却效率，跟踪热裕度变化。
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <button type="button" className={secondaryButtonClass}>
          <i className="ri-flask-line mr-1"></i>
          更新热分析
        </button>
        <button type="button" className={primaryButtonClass}>
          <i className="ri-download-2-line mr-1"></i>
          导出热平衡
        </button>
      </div>
    </div>

    <div className="mt-6 grid gap-6 xl:grid-cols-3">
      <div className="rounded-2xl border border-gray-100 bg-slate-50/70 p-5">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-900">关键区域</h4>
          <span className="text-xs text-gray-400">{scenarios.length} 个</span>
        </div>
        <div className="mt-4 space-y-3">
          {scenarios.map(scenario => (
            <div key={scenario.id} className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-900">{scenario.name}</div>
                  <div className="text-xs text-gray-500">{scenario.id}</div>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs ${statusBadge[scenario.status]}`}>
                  {scenario.status === 'good' ? '正常' : scenario.status === 'warning' ? '关注' : '风险'}
                </span>
              </div>
              <div className="mt-3 grid gap-1 text-xs text-gray-600">
                <span>最大温度：{scenario.maxTemp}</span>
                <span>目标：{scenario.target}</span>
                <span>热流密度：{scenario.heatFlux}</span>
                <span>冷却方案：{scenario.cooling}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <h4 className="text-sm font-medium text-gray-900">冷却效率与裕度</h4>
        <div className="mt-4 space-y-3">
          {effectiveness.map(item => (
            <div key={item.label} className="rounded-xl border border-gray-100 bg-slate-50/80 p-3">
              <div className="flex items-center justify-between text-sm font-medium text-gray-900">
                <span>{item.label}</span>
                <span>{Math.round(item.value * 100)}%</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
                <span>{item.note || '—'}</span>
                <span className={`flex items-center gap-1 ${trendStyle(item.trend)}`}>
                  <i className={`ri-arrow-${item.trend.startsWith('-') ? 'down' : 'up'}-s-line`}></i>
                  {item.trend}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <h4 className="text-sm font-medium text-gray-900">建模假设</h4>
        <ul className="mt-4 space-y-3 text-sm text-gray-700">
          {assumptions.map((item, index) => (
            <li key={`${item}-${index}`} className="rounded-lg border border-slate-100 bg-slate-50/80 p-3">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                <i className="ri-thermometer-line text-orange-500"></i>
                <span>假设 {index + 1}</span>
              </div>
              <p className="mt-1 text-xs text-gray-600 leading-relaxed">{item}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  </section>
);

export default ThermalOverview;
