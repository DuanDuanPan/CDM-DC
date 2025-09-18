import { useState } from 'react';

interface OperatingPoint {
  id: string;
  name: string;
  description: string;
  parameters: {
    thrust: string;
    specificImpulse: string;
    fuelFlow: string;
    pressureRatio: string;
    turbineInletTemp: string;
  };
  margins: {
    surgeMargin: number;
    turbineMargin: number;
    thrustMargin: number;
  };
}

interface PerformanceOverviewProps {
  operatingPoints: OperatingPoint[];
  assumptions: Array<{ title: string; detail: string }>;
}

const marginBars = (
  margins: OperatingPoint['margins']
): Array<{ label: string; value: number; color: string }> => [
  { label: '喘振裕度', value: margins.surgeMargin, color: 'bg-blue-500' },
  { label: '涡轮热裕度', value: margins.turbineMargin, color: 'bg-emerald-500' },
  { label: '推力裕度', value: margins.thrustMargin, color: 'bg-purple-500' }
];

const PerformanceOverview = ({ operatingPoints, assumptions }: PerformanceOverviewProps) => {
  const [activePointId, setActivePointId] = useState(operatingPoints[0]?.id ?? '');
  const activePoint = operatingPoints.find(point => point.id === activePointId) || operatingPoints[0];

  if (!activePoint) return null;

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-900">循环参数与性能概览</h3>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
              <i className="ri-database-2-line"></i>
              数据来源 · 循环仿真库 / 试车结果
            </span>
          </div>
          <p className="text-sm text-gray-500">
            支持多工况切换，快速查看推力、比冲、燃油流量等关键参数及裕度。
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {operatingPoints.map(point => (
            <button
              key={point.id}
              onClick={() => setActivePointId(point.id)}
              className={`rounded-full px-3 py-1.5 text-sm transition-all ${
                activePointId === point.id
                  ? 'bg-blue-600 text-white shadow'
                  : 'border border-gray-200 bg-slate-50 text-gray-600 hover:border-blue-300 hover:text-blue-600'
              }`}
            >
              {point.name}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-gray-100 bg-slate-50/70 p-5">
          <h4 className="text-sm font-medium text-gray-900">工况说明</h4>
          <p className="mt-2 text-sm text-gray-600 leading-relaxed">{activePoint.description}</p>
          <div className="mt-4 space-y-3 text-sm text-gray-700">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">推力</span>
              <span className="font-medium text-gray-900">{activePoint.parameters.thrust}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">比冲</span>
              <span className="font-medium text-gray-900">{activePoint.parameters.specificImpulse}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">燃油流量</span>
              <span className="font-medium text-gray-900">{activePoint.parameters.fuelFlow}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">压力比</span>
              <span className="font-medium text-gray-900">{activePoint.parameters.pressureRatio}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">涡前温度</span>
              <span className="font-medium text-gray-900">{activePoint.parameters.turbineInletTemp}</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h4 className="text-sm font-medium text-gray-900">裕度分析</h4>
          <div className="mt-4 space-y-4">
            {marginBars(activePoint.margins).map(bar => (
              <div key={bar.label}>
                <div className="flex items_center justify-between text-xs text-gray-500">
                  <span>{bar.label}</span>
                  <span className="font-medium text-gray-700">{Math.round(bar.value * 100)}%</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${bar.color}`}
                    style={{ width: `${Math.min(bar.value * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h4 className="text-sm font-medium text-gray-900">关键假设</h4>
          <ul className="mt-4 space-y-3 text-sm text-gray-700">
            {assumptions.map(assumption => (
              <li key={assumption.title} className="rounded-lg border border-slate-100 bg-slate-50/80 p-3">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                  <i className="ri-sticky-note-line text-blue-500"></i>
                  <span>{assumption.title}</span>
                </div>
                <p className="mt-1 text-xs text-gray-600 leading-relaxed">{assumption.detail}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};

export default PerformanceOverview;
