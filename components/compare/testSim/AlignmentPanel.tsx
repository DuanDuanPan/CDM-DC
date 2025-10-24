import clsx from 'clsx';
import type { ChannelAlignment, AlignmentLogEntry, TestSimChannel } from './types';
import { makeChannelKey } from './utils';

type AlignmentPanelProps = {
  channels: TestSimChannel[];
  alignment: Record<string, ChannelAlignment>;
  log: AlignmentLogEntry[];
  onAlign: (channel: TestSimChannel) => void;
  onSkip: (channel: TestSimChannel) => void;
};

export default function AlignmentPanel({ channels, alignment, log, onAlign, onSkip }: AlignmentPanelProps) {
  if (!channels.length) {
    return null;
  }

  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-sm">
      <header className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold text-slate-900">单位与采样率对齐</h4>
          <p className="text-xs text-slate-500">对齐状态基于各通道的 unit/sampleRate 元数据</p>
        </div>
      </header>

      <div className="space-y-2">
        {channels.map((channel) => {
          const key = channel.key ?? makeChannelKey(channel.runId ?? 'run', channel.channel);
          const entry = alignment[key];
          const unitStatus = entry?.unitStatus ?? 'pending';
          const rateStatus = entry?.sampleRateStatus ?? 'pending';
          const statusClass = (status: string) =>
            clsx(
              'rounded-full px-2 py-0.5 text-[11px] uppercase tracking-wide',
              status === 'aligned'
                ? 'bg-emerald-100 text-emerald-700'
                : status === 'skipped'
                ? 'bg-slate-200 text-slate-600'
                : 'bg-amber-100 text-amber-700',
            );

          return (
            <div
              key={key}
              className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-slate-800">{channel.channel}</span>
                {channel.runLabel ? (
                  <span className="rounded-full bg-white px-2 py-0.5 text-[11px] text-slate-500">{channel.runLabel}</span>
                ) : null}
                <span className="rounded-full bg-white px-2 py-0.5 text-[11px] text-slate-500">
                  单位：{channel.originalUnit ?? channel.unit ?? '未提供'}
                </span>
                <span className="rounded-full bg-white px-2 py-0.5 text-[11px] text-slate-500">
                  采样率：{channel.originalSampleRate ?? channel.sampleRate ?? '未提供'}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className={statusClass(unitStatus)}>单位 {unitStatus}</span>
                <span className={statusClass(rateStatus)}>采样率 {rateStatus}</span>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-white px-2 py-0.5 text-[11px] font-medium text-blue-600 hover:border-blue-300 hover:text-blue-700"
                  onClick={() => onAlign(channel)}
                >
                  <i className="ri-magic-line" />
                  自动对齐
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-500 hover:border-slate-300"
                  onClick={() => onSkip(channel)}
                >
                  <i className="ri-skip-right-line" />
                  忽略
                </button>
              </div>
              {entry?.notes ? (
                <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] text-slate-500">
                  {entry.notes}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <footer className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
        <h5 className="text-xs font-semibold text-slate-700">对齐日志</h5>
        {log.length === 0 ? (
          <p className="mt-2 text-[11px] text-slate-500">尚未记录对齐操作。</p>
        ) : (
          <ul className="mt-2 space-y-1 text-[11px] text-slate-500">
            {log.map((entry, index) => (
              <li key={`${entry.timestamp}-${index}`} className="flex items-center gap-2">
                <span className="text-slate-400">{entry.timestamp}</span>
                <span className="font-medium text-slate-600">{entry.channel}</span>
                <span>{entry.message}</span>
              </li>
            ))}
          </ul>
        )}
      </footer>
    </section>
  );
}
