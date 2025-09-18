interface SummaryMetric {
  label: string;
  value: string;
  trend: string;
  status: 'good' | 'warning' | 'risk';
  note?: string;
}

interface CoverageItem {
  area: string;
  coverage: number;
  tests: number;
  critical: number;
  lastRun: string;
  status: 'on-track' | 'attention' | 'delayed';
  note?: string;
}

interface CampaignItem {
  id: string;
  name: string;
  scope: string;
  window: string;
  owner: string;
  progress: number;
  status: 'preparing' | 'running' | 'done';
  note?: string;
}

interface EvidencePackage {
  id: string;
  name: string;
  owner: string;
  updatedAt: string;
  size: string;
  status: 'pending' | 'uploaded' | 'in-review';
  type: string;
  note?: string;
}

interface BlockerItem {
  id: string;
  title: string;
  impact: string;
  owner: string;
  due: string;
  status: 'open' | 'mitigating' | 'cleared';
  note?: string;
}

interface VerificationOverviewProps {
  summary: SummaryMetric[];
  coverage: CoverageItem[];
  campaigns: CampaignItem[];
  packages: EvidencePackage[];
  blockers: BlockerItem[];
}

const summaryStatusStyle: Record<SummaryMetric['status'], string> = {
  good: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  warning: 'border-amber-200 bg-amber-50 text-amber-700',
  risk: 'border-red-200 bg-red-50 text-red-700'
};

const coverageStatusStyle: Record<CoverageItem['status'], string> = {
  'on-track': 'text-emerald-600',
  attention: 'text-amber-600',
  delayed: 'text-red-600'
};

const campaignStatusLabel: Record<CampaignItem['status'], string> = {
  preparing: '准备中',
  running: '执行中',
  done: '已完成'
};

const campaignStatusStyle: Record<CampaignItem['status'], string> = {
  preparing: 'bg-slate-100 text-slate-600 border border-slate-200',
  running: 'bg-blue-50 text-blue-600 border border-blue-200',
  done: 'bg-emerald-50 text-emerald-600 border border-emerald-200'
};

const packageStatusLabel: Record<EvidencePackage['status'], string> = {
  pending: '待提交',
  uploaded: '已上传',
  'in-review': '评审中'
};

const packageStatusStyle: Record<EvidencePackage['status'], string> = {
  pending: 'bg-amber-50 text-amber-700 border border-amber-200',
  uploaded: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  'in-review': 'bg-blue-50 text-blue-600 border border-blue-200'
};

const blockerStatusLabel: Record<BlockerItem['status'], string> = {
  open: '待解决',
  mitigating: '紧跟中',
  cleared: '已解除'
};

const blockerStatusStyle: Record<BlockerItem['status'], string> = {
  open: 'border-red-200 bg-red-50 text-red-600',
  mitigating: 'border-amber-200 bg-amber-50 text-amber-700',
  cleared: 'border-emerald-200 bg-emerald-50 text-emerald-700'
};

const secondaryButtonClass =
  'rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-600 transition-colors hover:border-blue-300 hover:text-blue-600';
const primaryButtonClass =
  'rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white shadow-sm hover:bg-blue-700';

const VerificationOverview = ({ summary, coverage, campaigns, packages, blockers }: VerificationOverviewProps) => (
  <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
      <div className="flex-1 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-lg font-semibold text-gray-900">试验与验证闭环</h3>
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
            <i className="ri-database-2-line"></i>
            数据来源 · 试验台账 / V&V 系统
          </span>
        </div>
        <p className="text-sm text-gray-500">
          聚焦验证覆盖率、试验任务执行和数据包交付，确保关键指标在投产前完成闭环。
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {summary.map(metric => (
            <div key={metric.label} className={`rounded-xl border bg-slate-50/80 p-3 ${summaryStatusStyle[metric.status]}`}>
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
          <i className="ri-flag-2-line mr-1"></i>
          创建验证任务
        </button>
        <button type="button" className={secondaryButtonClass}>
          <i className="ri-upload-cloud-2-line mr-1"></i>
          上传试验数据包
        </button>
        <button type="button" className={primaryButtonClass}>
          <i className="ri-bar-chart-box-line mr-1"></i>
          打开验证看板
        </button>
      </div>
    </div>

    <div className="mt-6 grid gap-6 xl:grid-cols-7">
      <div className="rounded-2xl border border-gray-100 bg-slate-50/70 p-5 xl:col-span-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-900">验证覆盖与关键工况</h4>
          <span className="text-xs text-gray-400">{coverage.length} 个区域</span>
        </div>
        <div className="mt-4 space-y-3">
          {coverage.map(item => (
            <div key={item.area} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-sm font-medium text-gray-900">{item.area}</div>
                  <div className="text-xs text-gray-500">最近更新：{item.lastRun}</div>
                </div>
                <span className={`text-sm font-semibold ${coverageStatusStyle[item.status]}`}>
                  覆盖 {Math.round(item.coverage * 100)}%
                </span>
              </div>
              <div className="mt-3 grid gap-3 text-xs text-gray-500 sm:grid-cols-3">
                <span>计划试验：{item.tests} 项</span>
                <span>关键工况：{item.critical} 个</span>
                <span>状态：{item.status === 'on-track' ? '按计划' : item.status === 'attention' ? '需关注' : '延迟'}</span>
              </div>
              {item.note && <div className="mt-2 text-xs text-gray-600 leading-relaxed">{item.note}</div>}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm xl:col-span-3">
        <h4 className="text-sm font-medium text-gray-900">试验任务进展</h4>
        <div className="mt-4 space-y-3">
          {campaigns.map(campaign => (
            <div key={campaign.id} className="rounded-xl border border-gray-100 bg-slate-50/80 p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-900">{campaign.name}</div>
                  <div className="text-xs text-gray-500">窗口：{campaign.window} · {campaign.owner}</div>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs ${campaignStatusStyle[campaign.status]}`}>
                  {campaignStatusLabel[campaign.status]}
                </span>
              </div>
              <p className="mt-2 text-xs text-gray-600 leading-relaxed">{campaign.scope}</p>
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>进度</span>
                  <span>{Math.round(campaign.progress * 100)}%</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-white">
                  <div className="h-full rounded-full bg-blue-500" style={{ width: `${Math.min(campaign.progress * 100, 100)}%` }}></div>
                </div>
              </div>
              {campaign.note && <div className="mt-2 text-xs text-amber-600">{campaign.note}</div>}
            </div>
          ))}
        </div>
      </div>
    </div>

    <div className="mt-6 grid gap-6 xl:grid-cols-7">
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm xl:col-span-4">
        <h4 className="text-sm font-medium text-gray-900">验证数据包</h4>
        <div className="mt-4 space-y-3">
          {packages.map(pkg => (
            <div key={pkg.id} className="rounded-xl border border-gray-100 bg-slate-50/80 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-sm font-medium text-gray-900">{pkg.name}</div>
                  <div className="text-xs text-gray-500">{pkg.type} · {pkg.size}</div>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs ${packageStatusStyle[pkg.status]}`}>
                  {packageStatusLabel[pkg.status]}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                <span>负责人：{pkg.owner}</span>
                <span>更新时间：{pkg.updatedAt}</span>
              </div>
              {pkg.note && <div className="mt-2 text-xs text-gray-600 leading-relaxed">{pkg.note}</div>}
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <button className="rounded-lg border border-gray-200 px-2.5 py-1 text-gray-600 transition-colors hover:border-blue-300 hover:text-blue-600">
                  <i className="ri-download-2-line mr-1"></i>
                  下载数据
                </button>
                <button className="rounded-lg border border-gray-200 px-2.5 py-1 text-gray-600 transition-colors hover:border-blue-300 hover:text-blue-600">
                  <i className="ri-share-forward-line mr-1"></i>
                  推送评审
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm xl:col-span-3">
        <h4 className="text-sm font-medium text-gray-900">风险与阻塞项</h4>
        <div className="mt-4 space-y-3">
          {blockers.map(blocker => (
            <div key={blocker.id} className="rounded-xl border border-gray-100 bg-slate-50/80 p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-900">{blocker.title}</div>
                  <div className="text-xs text-gray-500">{blocker.owner} · 截止 {blocker.due}</div>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs ${blockerStatusStyle[blocker.status]}`}>
                  {blockerStatusLabel[blocker.status]}
                </span>
              </div>
              <p className="mt-2 text-xs text-gray-600 leading-relaxed">{blocker.impact}</p>
              {blocker.note && <div className="mt-2 text-xs text-amber-600">{blocker.note}</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

export default VerificationOverview;
