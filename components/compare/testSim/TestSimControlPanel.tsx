import clsx from 'clsx';
import type { ChannelFilterTag, TestSimChannelKind, TestSimRun } from './types';
import { CHANNEL_TAGS, makeChannelKey } from './utils';

type TestSimControlPanelProps = {
  runs: TestSimRun[];
  selectedRunIds: string[];
  selectedChannels: string[];
  quickFilters: TestSimChannelKind[];
  onToggleRun: (runId: string) => void;
  onSelectChannels: (channels: string[]) => void;
  onToggleFilter: (tagId: TestSimChannelKind) => void;
  onAddRun?: () => void;
  onRefresh?: () => void;
  pending: boolean;
  onGenerateMockSimulation?: () => void;
};

export default function TestSimControlPanel({
  runs,
  selectedRunIds,
  selectedChannels,
  quickFilters,
  onToggleRun,
  onSelectChannels,
  onToggleFilter,
  onAddRun,
  onRefresh,
  pending,
  onGenerateMockSimulation,
}: TestSimControlPanelProps) {
  const testRuns = runs.filter((run) => run.source !== 'simulation');
  const simulationRuns = runs.filter((run) => run.source === 'simulation');
  const channelEntries = runs.flatMap((run) =>
    run.channels.map((channel) => {
      const key = channel.key ?? makeChannelKey(run.runId, channel.channel);
      return {
        key,
        name: channel.channel,
        runLabel: channel.runLabel ?? run.label,
        kind: CHANNEL_TAGS.find((tag) => tag.matcher(channel.channel))?.id ?? 'OTHER',
      };
    }),
  );

  const seenChannelKeys = new Set<string>();
  const channelItems = channelEntries.filter((item) => {
    if (seenChannelKeys.has(item.key)) return false;
    seenChannelKeys.add(item.key);
    return true;
  });

  const activeChannelSet = new Set(selectedChannels.length ? selectedChannels : channelItems.map((item) => item.key));
  const hasPendingSimulation = simulationRuns.some((run) => run.status !== 'ready');

  const renderTag = (tag: ChannelFilterTag) => {
    const active = quickFilters.includes(tag.id);
    return (
      <button
        key={tag.id}
        type="button"
        onClick={() => onToggleFilter(tag.id)}
        className={clsx(
          'rounded-full border px-3 py-1 text-xs font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300',
          active
            ? 'border-blue-300 bg-blue-50 text-blue-700'
            : 'border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:text-blue-600',
        )}
      >
        #{tag.label}
      </button>
    );
  };

  return (
    <aside className="space-y-6 rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm">
      <header className="space-y-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">试验 / 仿真数据源</p>
          <h3 className="text-base font-semibold text-slate-900">Test-Sim Compare</h3>
        </div>
        {(onRefresh || onGenerateMockSimulation || onAddRun) && (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              {onRefresh ? (
                <button
                  type="button"
                  onClick={onRefresh}
                  className="inline-flex h-8 min-w-[96px] items-center justify-center gap-1 whitespace-nowrap rounded-md border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 transition hover:border-blue-200 hover:text-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-200"
                  disabled={pending}
                >
                  <i className="ri-refresh-line" />
                  刷新
                </button>
              ) : null}
              {onGenerateMockSimulation ? (
                <button
                  type="button"
                  onClick={onGenerateMockSimulation}
                  className="inline-flex h-8 min-w-[124px] items-center justify-center gap-1 whitespace-nowrap rounded-md border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 transition hover:border-blue-200 hover:text-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-200"
                >
                  <i className="ri-flask-line" />
                  生成仿真示例
                </button>
              ) : null}
            </div>
            {onAddRun ? (
              <button
                type="button"
                onClick={onAddRun}
                className="inline-flex h-8 min-w-[96px] items-center justify-center gap-1 whitespace-nowrap rounded-md bg-blue-600 px-3 text-xs font-medium text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-200"
              >
                <i className="ri-add-line" />
                添加运行
              </button>
            ) : null}
          </div>
        )}
      </header>

      <section className="space-y-3">
        <h4 className="text-sm font-semibold text-slate-900">已选运行</h4>
        {testRuns.length === 0 ? (
          <p className="text-xs text-slate-500">
            暂无试验运行。可从 TBOM 运行详情发送 compare payload，或点击“添加运行”选择试验。
          </p>
        ) : (
          <ul className="space-y-2">
            {testRuns.map((run) => {
              const active = selectedRunIds.includes(run.runId);
              return (
                <li
                  key={run.runId}
                  className={clsx(
                    'flex items-start justify-between gap-2 rounded-xl border px-3 py-2 text-xs transition',
                    active ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-600',
                  )}
                >
                  <div>
                    <div className="font-medium">{run.label}</div>
                    <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-slate-500">
                      <span>运行 {run.runId}</span>
                      <span>试验 {run.testId}</span>
                      <span>项目 {run.projectId}</span>
                      {run.recordedAt ? <span>{run.recordedAt}</span> : null}
                      <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] text-slate-500">
                        试验
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onToggleRun(run.runId)}
                    className={clsx(
                      'rounded-full border px-2 py-1 text-[11px] font-medium transition',
                      active
                        ? 'border-blue-400 bg-white text-blue-700 hover:border-blue-500'
                        : 'border-slate-200 hover:border-blue-300 hover:text-blue-600',
                    )}
                  >
                    {active ? '已选' : '选用'}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h4 className="text-sm font-semibold text-slate-900">仿真源</h4>
        {simulationRuns.length === 0 ? (
          <p className="text-xs text-slate-500">
            暂无仿真源。前往仿真模块 Compare 栏点击“同步到 Compare”将仿真结果推送至此。
          </p>
        ) : (
          <ul className="space-y-2">
            {simulationRuns.map((run) => {
              const active = selectedRunIds.includes(run.runId);
              const statusLabel = run.status === 'ready' ? '仿真数据就绪' : '等待仿真结果';
              const statusClass =
                run.status === 'ready'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-600'
                  : 'border-amber-200 bg-amber-50 text-amber-700';
              return (
                <li
                  key={run.runId}
                  className={clsx(
                    'flex items-start justify-between gap-2 rounded-xl border px-3 py-2 text-xs transition',
                    active ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-600',
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="font-medium text-slate-900">{run.label}</div>
                      {run.originLabel ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                          {run.originLabel}
                        </span>
                      ) : null}
                      <span className={clsx('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium', statusClass)}>
                        <i className={run.status === 'ready' ? 'ri-check-line' : 'ri-time-line'} />
                        {statusLabel}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-slate-500">
                      <span>仿真 {run.runId}</span>
                      <span>实体 {run.projectId}</span>
                      <span>场景 {run.testId}</span>
                      {run.recordedAt ? <span>{run.recordedAt}</span> : null}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onToggleRun(run.runId)}
                    className={clsx(
                      'rounded-full border px-2 py-1 text-[11px] font-medium transition',
                      active
                        ? 'border-blue-400 bg-white text-blue-700 hover:border-blue-500'
                        : 'border-slate-200 hover:border-blue-300 hover:text-blue-600',
                    )}
                  >
                    {active ? '已选' : '选用'}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        {simulationRuns.length > 0 && hasPendingSimulation ? (
          <p className="rounded-lg border border-amber-200 bg-amber-50/70 px-3 py-2 text-[11px] text-amber-700">
            部分仿真源尚未生成曲线，Compare 将在结果就绪后自动刷新。可在仿真模块重新同步以获取最新数据。
          </p>
        ) : null}
      </section>

      <section className="space-y-3">
        <h4 className="text-sm font-semibold text-slate-900">通道筛选</h4>
        <div className="flex flex-wrap gap-2">{CHANNEL_TAGS.map(renderTag)}</div>
        {channelItems.length ? (
          <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50/60">
            <ul className="divide-y divide-slate-200">
              {channelItems.map((item) => {
                const isActive = activeChannelSet.has(item.key);
                return (
                  <li key={item.key}>
                    <label className="flex cursor-pointer items-center justify-between px-3 py-2 text-xs text-slate-600">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          checked={isActive}
                          onChange={(event) => {
                            const checked = event.target.checked;
                            if (checked) {
                              onSelectChannels(Array.from(new Set([...activeChannelSet, item.key])));
                            } else {
                              const next = Array.from(activeChannelSet).filter((channel) => channel !== item.key);
                              onSelectChannels(next);
                            }
                          }}
                        />
                        <span className="font-medium text-slate-700">{item.name}</span>
                        <span className="text-[10px] text-slate-400">{item.runLabel}</span>
                      </div>
                      <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-600">
                        {item.kind}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : (
          <p className="text-xs text-slate-500">暂无通道数据。</p>
        )}
      </section>
    </aside>
  );
}
