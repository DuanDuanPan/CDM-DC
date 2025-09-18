interface LoadCase {
  id: string;
  name: string;
  description: string;
  load: string;
  boundary: string;
  status: 'completed' | 'in-progress' | 'pending';
}

interface StructuralMargin {
  label: string;
  value: string;
  status: 'good' | 'warning' | 'risk';
  note?: string;
}

interface ValidationItem {
  title: string;
  owner: string;
  due: string;
  status: 'done' | 'doing' | 'pending';
  note?: string;
}

interface StructuralOverviewProps {
  loadCases: LoadCase[];
  margins: StructuralMargin[];
  validation: ValidationItem[];
}

const loadCaseStatusStyle: Record<LoadCase['status'], string> = {
  completed: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  'in-progress': 'bg-blue-50 text-blue-600 border border-blue-200',
  pending: 'bg-slate-50 text-slate-600 border border-slate-200'
};

const marginStatusStyle: Record<StructuralMargin['status'], string> = {
  good: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  warning: 'border-amber-200 bg-amber-50 text-amber-700',
  risk: 'border-red-200 bg-red-50 text-red-700'
};

const validationStatusStyle: Record<ValidationItem['status'], string> = {
  done: 'bg-emerald-500',
  doing: 'bg-blue-500',
  pending: 'bg-gray-300'
};

const secondaryButtonClass =
  'rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-600 transition-colors hover:border-blue-300 hover:text-blue-600';
const primaryButtonClass =
  'rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white shadow-sm hover:bg-blue-700';

const StructuralOverview = ({ loadCases, margins, validation }: StructuralOverviewProps) => (
  <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-lg font-semibold text-gray-900">结构载荷与裕度概览</h3>
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
            <i className="ri-database-2-line"></i>
            数据来源 · 结构解算 / 试验闭环
          </span>
        </div>
        <p className="text-sm text-gray-500">
          汇总关键载荷工况、结构裕度以及验证闭环状态，辅助结构强度审查。
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <button type="button" className={secondaryButtonClass}>
          <i className="ri-refresh-line mr-1"></i>
          更新载荷库
        </button>
        <button type="button" className={primaryButtonClass}>
          <i className="ri-download-2-line mr-1"></i>
          导出结构摘要
        </button>
      </div>
    </div>

    <div className="mt-6 grid gap-6 xl:grid-cols-3">
      <div className="rounded-2xl border border-gray-100 bg-slate-50/70 p-5">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-900">载荷工况库</h4>
          <span className="text-xs text-gray-400">{loadCases.length} 条</span>
        </div>
        <div className="mt-4 space-y-3">
          {loadCases.map(caseItem => (
            <div key={caseItem.id} className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-900">{caseItem.name}</div>
                  <div className="text-xs text-gray-500">{caseItem.id}</div>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs ${loadCaseStatusStyle[caseItem.status]}`}>
                  {caseItem.status === 'completed'
                    ? '已完成'
                    : caseItem.status === 'in-progress'
                    ? '进行中'
                    : '待启动'}
                </span>
              </div>
              <p className="mt-2 text-xs text-gray-600 leading-relaxed">{caseItem.description}</p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-500">
                <span>载荷：{caseItem.load}</span>
                <span>边界：{caseItem.boundary}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <h4 className="text-sm font-medium text-gray-900">结构裕度</h4>
        <div className="mt-4 space-y-3">
          {margins.map(margin => (
            <div
              key={margin.label}
              className={`rounded-xl border px-4 py-3 ${marginStatusStyle[margin.status]}`}
            >
              <div className="flex items-center justify-between text-sm font-medium">
                <span>{margin.label}</span>
                <span>{margin.value}</span>
              </div>
              {margin.note && <p className="mt-2 text-xs text-gray-600">{margin.note}</p>}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <h4 className="text-sm font-medium text-gray-900">验证闭环</h4>
        <div className="mt-4">
          {validation.map((item, index) => (
            <div key={`${item.title}-${index}`} className="relative pl-6 pb-4 text-xs text-gray-500 last:pb-0">
              <span
                className={`absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full ${validationStatusStyle[item.status]}`}
              ></span>
              {index < validation.length - 1 && (
                <span className="absolute left-1 top-4 bottom-0 w-px bg-gray-200"></span>
              )}
              <div className="flex flex-wrap items-center gap-2 text-gray-600">
                <span className="text-sm font-medium text-gray-900">{item.title}</span>
                <span>{item.due}</span>
                <span>· {item.owner}</span>
              </div>
              {item.note && <div className="mt-1 text-gray-400">{item.note}</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

export default StructuralOverview;
