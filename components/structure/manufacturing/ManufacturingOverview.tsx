interface ReadinessMetric {
  label: string;
  value: number;
  status: 'good' | 'warning' | 'risk';
  note?: string;
}

interface SpecialProcess {
  name: string;
  owner: string;
  status: '已完成' | '进行中' | '计划中';
  risk: '低' | '中' | '高';
  note?: string;
}

interface DeliveryItem {
  item: string;
  supplier: string;
  eta: string;
  status: 'on-time' | 'pending' | 'delay';
  note?: string;
}

type ConstraintStatus = 'open' | 'mitigating' | 'resolved';

interface ProcessConstraint {
  id: string;
  area: string;
  constraint: string;
  impact: string;
  mitigation: string;
  owner: string;
  status: ConstraintStatus;
}

type CapacityRisk = 'low' | 'medium' | 'high';

interface CapacityInsight {
  line: string;
  window: string;
  utilization: number;
  capacity: string;
  risk: CapacityRisk;
  note?: string;
}

type SupplierStatus = 'green' | 'amber' | 'red';

interface SupplierRisk {
  item: string;
  supplier: string;
  status: SupplierStatus;
  ottr: number; // on-time delivery rate
  nextDelivery: string;
  impact: string;
  mitigation: string;
}

interface ManufacturingOverviewProps {
  readiness: ReadinessMetric[];
  specialProcesses: SpecialProcess[];
  delivery: DeliveryItem[];
  constraints: ProcessConstraint[];
  capacity: CapacityInsight[];
  supplierRisks: SupplierRisk[];
}

const readinessBarStyle: Record<ReadinessMetric['status'], string> = {
  good: 'bg-emerald-500',
  warning: 'bg-amber-500',
  risk: 'bg-red-500'
};

const processRiskStyle: Record<SpecialProcess['risk'], string> = {
  低: 'bg-emerald-50 text-emerald-600 border border-emerald-200',
  中: 'bg-amber-50 text-amber-600 border border-amber-200',
  高: 'bg-red-50 text-red-600 border border-red-200'
};

const deliveryStatusStyle: Record<DeliveryItem['status'], string> = {
  'on-time': 'text-emerald-600',
  pending: 'text-amber-600',
  delay: 'text-red-600'
};

const constraintStatusStyle: Record<ConstraintStatus, string> = {
  open: 'border-red-200 bg-red-50 text-red-600',
  mitigating: 'border-amber-200 bg-amber-50 text-amber-700',
  resolved: 'border-emerald-200 bg-emerald-50 text-emerald-700'
};

const capacityRiskPillStyle: Record<CapacityRisk, string> = {
  low: 'bg-emerald-50 text-emerald-600 border border-emerald-200',
  medium: 'bg-amber-50 text-amber-600 border border-amber-200',
  high: 'bg-red-50 text-red-600 border border-red-200'
};

const capacityBarStyle: Record<CapacityRisk, string> = {
  low: 'bg-emerald-500',
  medium: 'bg-amber-500',
  high: 'bg-red-500'
};

const supplierStatusStyle: Record<SupplierStatus, string> = {
  green: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  amber: 'border-amber-200 bg-amber-50 text-amber-700',
  red: 'border-red-200 bg-red-50 text-red-600'
};

const supplierStatusLabel: Record<SupplierStatus, string> = {
  green: '稳定',
  amber: '关注',
  red: '风险'
};

const ManufacturingOverview = ({
  readiness,
  specialProcesses,
  delivery,
  constraints,
  capacity,
  supplierRisks
}: ManufacturingOverviewProps) => {
  const averageReadiness = readiness.length
    ? Math.round((readiness.reduce((total, metric) => total + metric.value, 0) / readiness.length) * 100)
    : 0;
  const warningCount = readiness.filter(metric => metric.status === 'warning').length;
  const riskCount = readiness.filter(metric => metric.status === 'risk').length;
  const delayedDeliveryCount = delivery.filter(item => item.status === 'delay').length;

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">供应链与制造态势</h3>
          <p className="mt-1 text-sm text-gray-500">
            监控制造成熟度、工艺瓶颈和供应风险，确保样机生产节奏与验证窗口对齐。
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
              <div className="text-xs text-gray-500">平均制造成熟度</div>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-2xl font-semibold text-gray-900">{averageReadiness}%</span>
                <span className="text-xs text-gray-400">(加权)</span>
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
              <div className="text-xs text-gray-500">工艺关注项</div>
              <div className="mt-1 text-2xl font-semibold text-amber-600">{warningCount}</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
              <div className="text-xs text-gray-500">风险工序</div>
              <div className="mt-1 text-2xl font-semibold text-red-600">{riskCount}</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
              <div className="text-xs text-gray-500">交付延迟件</div>
              <div className="mt-1 text-2xl font-semibold text-gray-900">{delayedDeliveryCount}</div>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <button className="rounded-lg border border-gray-200 px-3 py-1.5 text-gray-600 transition-colors hover:border-blue-300 hover:text-blue-600">
            <i className="ri-clipboard-line mr-1"></i>
            更新制造状态
          </button>
          <button className="rounded-lg border border-gray-200 px-3 py-1.5 text-gray-600 transition-colors hover:border-blue-300 hover:text-blue-600">
            <i className="ri-share-forward-line mr-1"></i>
            发布供应风险
          </button>
          <button className="rounded-lg bg-blue-600 px-3 py-1.5 text-white hover:bg-blue-700">
            <i className="ri-download-2-line mr-1"></i>
            导出供应计划
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <div className="rounded-2xl border border-gray-100 bg-slate-50/70 p-5">
          <h4 className="text-sm font-medium text-gray-900">制造成熟度</h4>
          <div className="mt-4 space-y-4">
            {readiness.map(metric => (
              <div key={metric.label}>
                <div className="flex items-center justify-between text-sm font-medium text-gray-900">
                  <span>{metric.label}</span>
                  <span>{Math.round(metric.value * 100)}%</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-white">
                  <div
                    className={`h-full rounded-full ${readinessBarStyle[metric.status]}`}
                    style={{ width: `${Math.min(metric.value * 100, 100)}%` }}
                  ></div>
                </div>
                {metric.note && <p className="mt-2 text-xs text-gray-600">{metric.note}</p>}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h4 className="text-sm font-medium text-gray-900">关键特殊工艺</h4>
          <div className="mt-4 space-y-3">
            {specialProcesses.map(process => (
              <div key={process.name} className="rounded-xl border border-gray-100 bg-slate-50/80 p-3">
                <div className="flex items-center justify-between text-sm font-medium text-gray-900">
                  <span>{process.name}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs ${processRiskStyle[process.risk]}`}>{process.risk}风险</span>
                </div>
                <div className="mt-1 text-xs text-gray-500">负责单位：{process.owner}</div>
                <div className="mt-1 text-xs text-gray-500">当前状态：{process.status}</div>
                {process.note && <p className="mt-2 text-xs text-gray-600">{process.note}</p>}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h4 className="text-sm font-medium text-gray-900">关键件交付计划</h4>
          <div className="mt-4 space-y-3">
            {delivery.map(item => (
              <div key={item.item} className="rounded-xl border border-gray-100 bg-slate-50/80 p-3">
                <div className="flex items-center justify-between text-sm font-medium text-gray-900">
                  <span>{item.item}</span>
                  <span className={deliveryStatusStyle[item.status]}>
                    {item.status === 'on-time' ? '按计划' : item.status === 'pending' ? '待确认' : '延迟'}
                  </span>
                </div>
                <div className="mt-1 text-xs text-gray-500">供应商：{item.supplier}</div>
                <div className="mt-1 text-xs text-gray-500">计划到货：{item.eta}</div>
                {item.note && <p className="mt-2 text-xs text-gray-600">{item.note}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h4 className="text-sm font-medium text-gray-900">工艺限制与缓解</h4>
          <div className="mt-4 space-y-3">
            {constraints.map(constraint => (
              <div key={constraint.id} className="rounded-xl border border-gray-100 bg-slate-50/80 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{constraint.area}</div>
                    <div className="text-xs text-gray-500">{constraint.constraint}</div>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs ${constraintStatusStyle[constraint.status]}`}>
                    {constraint.status === 'open' ? '待解决' : constraint.status === 'mitigating' ? '缓解中' : '已闭环'}
                  </span>
                </div>
                <p className="mt-2 text-xs text-gray-600 leading-relaxed">{constraint.impact}</p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500">
                  <span className="rounded-full bg-white px-2 py-0.5 text-gray-700">负责人：{constraint.owner}</span>
                  <span className="rounded-full bg-blue-50 px-2 py-0.5 text-blue-600">{constraint.mitigation}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h4 className="text-sm font-medium text-gray-900">产线能力与排产</h4>
          <div className="mt-4 space-y-3">
            {capacity.map(line => (
              <div key={line.line} className="rounded-xl border border-gray-100 bg-slate-50/80 p-3">
                <div className="flex items-center justify-between text-sm font-medium text-gray-900">
                  <span>{line.line}</span>
                  <span className="rounded-full bg-white px-2 py-0.5 text-xs text-gray-600">窗口：{line.window}</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                  <span>利用率</span>
                  <span>{Math.round(line.utilization * 100)}%</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-white">
                  <div
                    className={`h-full rounded-full ${capacityBarStyle[line.risk]}`}
                    style={{ width: `${Math.min(line.utilization * 100, 100)}%` }}
                  ></div>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                  <span>能力：{line.capacity}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs ${capacityRiskPillStyle[line.risk]}`}>
                    {line.risk === 'low' ? '充裕' : line.risk === 'medium' ? '关注' : '瓶颈'}
                  </span>
                </div>
                {line.note && <p className="mt-2 text-xs text-gray-600">{line.note}</p>}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h4 className="text-sm font-medium text-gray-900">供应风险与协同</h4>
          <div className="mt-4 space-y-3">
            {supplierRisks.map(risk => (
              <div key={`${risk.supplier}-${risk.item}`} className="rounded-xl border border-gray-100 bg-slate-50/80 p-3">
                <div className="flex items-center justify-between text-sm font-medium text-gray-900">
                  <span>{risk.item}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs ${supplierStatusStyle[risk.status]}`}>
                    {supplierStatusLabel[risk.status]}
                  </span>
                </div>
                <div className="mt-1 text-xs text-gray-500">供应商：{risk.supplier}</div>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                  <span>准时率 {Math.round(risk.ottr * 100)}%</span>
                  <span>下次交付 {risk.nextDelivery}</span>
                </div>
                <p className="mt-2 text-xs text-gray-600 leading-relaxed">{risk.impact}</p>
                <div className="mt-2 flex items-start gap-2 text-xs text-blue-600">
                  <i className="ri-lightbulb-line mt-0.5"></i>
                  <span>{risk.mitigation}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ManufacturingOverview;
