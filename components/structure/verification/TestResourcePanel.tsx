import type { BlockerItem } from './VerificationOverview';
import type { VerificationMeasurementAsset, VerificationResourceDependency } from './types';

interface TestResourcePanelProps {
  resources?: VerificationResourceDependency[];
  measurementAssets?: VerificationMeasurementAsset[];
  blockers?: BlockerItem[];
}

const resourceStatusClass: Record<VerificationResourceDependency['status'], string> = {
  conflict: 'text-red-600',
  ok: 'text-emerald-600'
};

const resourceStatusLabel: Record<VerificationResourceDependency['status'], string> = {
  conflict: '冲突',
  ok: '可用'
};

const measurementStatusClass: Record<VerificationMeasurementAsset['status'], string> = {
  warning: 'text-amber-600',
  ok: 'text-emerald-600'
};

const measurementStatusLabel: Record<VerificationMeasurementAsset['status'], string> = {
  warning: '即将到期',
  ok: '已校准'
};

const TestResourcePanel = ({
  resources = [],
  measurementAssets = [],
  blockers = []
}: TestResourcePanelProps) => {
  const conflictResources = resources.filter(resource => resource.status === 'conflict');
  const warningMeasurements = measurementAssets.filter(instrument => instrument.status === 'warning');

  const blockersByResource = conflictResources.reduce<Record<string, BlockerItem[]>>((accumulator, resource) => {
    const relatedBlockers = blockers.filter(blocker => {
      const name = resource.name.toLowerCase();
      return blocker.title.toLowerCase().includes(name) || blocker.impact.toLowerCase().includes(name);
    });
    if (relatedBlockers.length) {
      accumulator[resource.name] = relatedBlockers;
    }
    return accumulator;
  }, {});

  const blockerAlertCount = Object.values(blockersByResource).reduce((count, resourceBlockers) => count + resourceBlockers.length, 0);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white px-5 py-6 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <i className="ri-honour-line text-lg text-blue-500"></i>
            资源与计量保障
          </p>
          <p className="text-xs text-slate-500">
            跟踪关键台架/仪器占用、校准状态与测量不确定度，及时识别对试验窗口的阻塞因素。
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <button type="button" className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-slate-600 transition-colors hover:border-blue-300 hover:text-blue-600">
            <i className="ri-add-circle-line mr-1"></i>
            创建阻塞
          </button>
          <button type="button" className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-slate-600 transition-colors hover:border-emerald-300 hover:text-emerald-700">
            <i className="ri-clipboard-line mr-1"></i>
            导出保障清单
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
          <p className="text-xs text-slate-500">资源冲突</p>
          <div className="mt-1 flex items-baseline gap-2 text-slate-800">
            <span className="text-2xl font-semibold">{conflictResources.length}</span>
            <span className="text-xs text-slate-500">项</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">需与排程/保障团队协同解决。</p>
        </div>
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 px-4 py-3">
          <p className="text-xs text-emerald-700">计量预警</p>
          <div className="mt-1 flex items-baseline gap-2 text-emerald-800">
            <span className="text-2xl font-semibold">{warningMeasurements.length}</span>
            <span className="text-xs text-emerald-700">台</span>
          </div>
          <p className="mt-1 text-xs text-emerald-700">需在窗口前完成校准或替换。</p>
        </div>
        <div className="rounded-xl border border-amber-100 bg-amber-50/70 px-4 py-3">
          <p className="text-xs text-amber-700">关联阻塞</p>
          <div className="mt-1 flex items-baseline gap-2 text-amber-800">
            <span className="text-2xl font-semibold">{blockerAlertCount}</span>
            <span className="text-xs text-amber-700">条</span>
          </div>
          <p className="mt-1 text-xs text-amber-700">依据阻塞状态安排缓解动作。</p>
        </div>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-800">台架与仪器占用</p>
              <p className="text-xs text-slate-500">掌握窗口与责任人，冲突时及时创建阻塞。</p>
            </div>
            <span className="text-xs text-slate-400">{resources.length} 项</span>
          </div>
          <div className="mt-3 space-y-3">
            {resources.length ? (
              resources.map(resource => {
                const relatedBlockers = blockersByResource[resource.name] ?? [];
                return (
                  <article key={`${resource.name}-${resource.availability}`} className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm shadow-sm">
                    <div className="flex items-center justify-between font-medium text-slate-900">
                      <span>{resource.name}</span>
                      <span className={`text-xs ${resourceStatusClass[resource.status]}`}>
                        {resourceStatusLabel[resource.status]}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      类型：{resource.type} · 窗口：{resource.availability} · 负责人：{resource.owner}
                    </p>
                    <p className="mt-1 text-xs text-slate-600">影响：{resource.impact}</p>
                    {resource.mitigation ? (
                      <p className="mt-0.5 text-xs text-slate-500">缓解：{resource.mitigation}</p>
                    ) : null}
                    {relatedBlockers.length ? (
                      <div className="mt-2 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                        <div className="flex items-center gap-1 font-semibold">
                          <i className="ri-error-warning-line"></i>
                          关联阻塞 {relatedBlockers.length} 项
                        </div>
                        <ul className="mt-1 space-y-1">
                          {relatedBlockers.map(blocker => (
                            <li key={blocker.id} className="flex items-start gap-1 leading-relaxed">
                              <span className="mt-0.5 text-amber-500">•</span>
                              <span>
                                {blocker.title} · {blocker.owner}（截止 {blocker.due}）
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </article>
                );
              })
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-6 text-center text-sm text-slate-500">
                <i className="ri-inbox-line text-xl text-slate-400"></i>
                <p className="mt-2">暂无资源冲突，试验窗口覆盖完整。</p>
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-emerald-800">计量与测量保障</p>
              <p className="text-xs text-emerald-700">跟踪校准到期与测量不确定度，确保量值可追溯。</p>
            </div>
            <span className="text-xs text-emerald-500">{measurementAssets.length} 台</span>
          </div>
          <div className="mt-3 space-y-3">
            {measurementAssets.length ? (
              measurementAssets.map(instrument => (
                <article key={`${instrument.instrument}-${instrument.calibrationDue}`} className="rounded-xl border border-emerald-100 bg-white px-4 py-3 text-sm shadow-sm">
                  <div className="flex items-center justify-between font-semibold text-slate-900">
                    <span>{instrument.instrument}</span>
                    <span className={`text-xs ${measurementStatusClass[instrument.status]}`}>
                      {measurementStatusLabel[instrument.status]}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-600">校准到期：{instrument.calibrationDue}</p>
                  <p className="text-xs text-slate-600">不确定度：{instrument.uncertainty}</p>
                  <p className="mt-1 text-xs text-slate-500">责任人：{instrument.owner}</p>
                </article>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-emerald-200 bg-emerald-50/50 px-4 py-6 text-center text-sm text-emerald-700">
                <i className="ri-shield-check-line text-xl"></i>
                <p className="mt-2">暂无计量预警，仪器均在有效期内。</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestResourcePanel;
