'use client';

import { createPortal } from 'react-dom';
import dynamic from 'next/dynamic';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import ImageViewer from '@/components/common/ImageViewer';
import PdfViewer from '@/components/common/PdfViewer';
import TbomRelationChips from '@/components/tbom/relations/TbomRelationChips';
import type { TbomSelection } from '@/components/tbom/TbomExplorerClient';
import type { TbomFilterSnapshot } from '@/components/tbom/relations/types';
import type {
  TbomAttachment,
  TbomProject,
  TbomRun,
  TbomRunEvent,
  TbomTest,
  TbomTestCardRow,
  TbomTimeseriesChannel,
} from '@/components/tbom/types';
import {
  getRunEvents,
  getRunTimeseries,
  listRunAttachments,
  listRunTestCard,
} from '@/services/tbom';
import { ApiError } from '@/services/http';

const CompareCenter = dynamic(() => import('@/components/compare/CompareCenter'), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500">
      正在加载 Compare 模块...
    </div>
  ),
});

type TbomRunDetailProps = {
  run: TbomRun;
  test: TbomTest;
  project: TbomProject;
  filters?: TbomFilterSnapshot | null;
  onClose: () => void;
};

type ChartDatum = Record<string, number | string> & {
  tsMs: number;
  tsLabel: string;
};

type HighlightRange = {
  start: number;
  end: number;
};

const STATUS_TONE: Record<TbomRun['status'], { label: string; tone: string }> = {
  planned: { label: '计划中', tone: 'bg-slate-200 text-slate-700' },
  executing: { label: '执行中', tone: 'bg-blue-200 text-blue-700' },
  completed: { label: '已完成', tone: 'bg-emerald-200 text-emerald-700' },
  aborted: { label: '已中止', tone: 'bg-rose-200 text-rose-700' },
};

const SEVERITY_META: Record<string, { label: string; tone: string }> = {
  critical: { label: '严重', tone: 'bg-rose-100 text-rose-700 border-rose-200' },
  major: { label: '重要', tone: 'bg-amber-100 text-amber-700 border-amber-200' },
  minor: { label: '提示', tone: 'bg-slate-100 text-slate-600 border-slate-200' },
  info: { label: '信息', tone: 'bg-blue-100 text-blue-700 border-blue-200' },
};

function severityTone(severity: string): { label: string; tone: string } {
  const key = severity?.toLowerCase?.() ?? 'info';
  return SEVERITY_META[key] ?? {
    label: severity,
    tone: 'bg-slate-100 text-slate-600 border-slate-200',
  };
}

function formatDateTime(value?: string) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date);
}

function formatTimeLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3,
  }).format(date);
}

function useBodyScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [active]);
}

async function safeFetch<T>(loader: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await loader();
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return fallback;
    }
    throw error;
  }
}

function buildChartData(channels: TbomTimeseriesChannel[]): ChartDatum[] {
  if (!channels.length) return [];
  const base = channels[0];
  if (!base.samples.length) return [];
  const length = base.samples.length;
  const maxPoints = 400;
  const step = Math.max(1, Math.floor(length / maxPoints));
  const data: ChartDatum[] = [];

  for (let i = 0; i < length; i += step) {
    const sample = base.samples[i];
    const tsMs = Date.parse(sample.ts);
    if (!Number.isFinite(tsMs)) {
      continue;
    }
    const entry: ChartDatum = {
      tsMs,
      tsLabel: formatTimeLabel(sample.ts),
    };
    channels.forEach((channel) => {
      const channelSample = channel.samples[i];
      if (!channelSample) return;
      entry[channel.channel] = Number(channelSample.value.toFixed(3));
    });
    data.push(entry);
  }

  return data;
}

function computeSampleInterval(channels: TbomTimeseriesChannel[]): number | null {
  const base = channels[0];
  if (!base || base.samples.length < 2) {
    return null;
  }
  const first = Date.parse(base.samples[0].ts);
  const second = Date.parse(base.samples[1].ts);
  if (!Number.isFinite(first) || !Number.isFinite(second)) {
    return null;
  }
  const interval = Math.abs(second - first);
  return interval > 0 ? interval : null;
}

function summarizeChannels(channels: TbomTimeseriesChannel[]) {
  return channels.map((channel) => {
    if (!channel.samples.length) {
      return {
        channel: channel.channel,
        unit: channel.unit,
        sampleRate: channel.sampleRate ?? null,
        min: null,
        max: null,
        mean: null,
      } as const;
    }
    let min = Number.POSITIVE_INFINITY;
    let max = Number.NEGATIVE_INFINITY;
    let sum = 0;
    channel.samples.forEach((sample) => {
      if (sample.value < min) min = sample.value;
      if (sample.value > max) max = sample.value;
      sum += sample.value;
    });
    const mean = sum / channel.samples.length;
    return {
      channel: channel.channel,
      unit: channel.unit,
      sampleRate: channel.sampleRate ?? null,
      min: Number(min.toFixed(3)),
      max: Number(max.toFixed(3)),
      mean: Number(mean.toFixed(3)),
    } as const;
  });
}

function classifySeverity(severity: string) {
  const normalised = severity?.toLowerCase?.();
  switch (normalised) {
    case 'critical':
      return 0;
    case 'major':
      return 1;
    case 'minor':
      return 2;
    default:
      return 3;
  }
}

export default function TbomRunDetail({ run, test, project, filters = null, onClose }: TbomRunDetailProps) {
  const [mounted, setMounted] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('正在加载运行详情...');
  const [events, setEvents] = useState<TbomRunEvent[]>([]);
  const [attachments, setAttachments] = useState<TbomAttachment[]>([]);
  const [testCard, setTestCard] = useState<TbomTestCardRow[]>([]);
  const [timeseries, setTimeseries] = useState<TbomTimeseriesChannel[]>([]);
  const [selectedAttachmentId, setSelectedAttachmentId] = useState<string | null>(null);
  const [isCompareExpanded, setCompareExpanded] = useState(false);
  const [highlightRange, setHighlightRange] = useState<HighlightRange | null>(null);

  useBodyScrollLock(true);

  const selectionForRelations = useMemo<TbomSelection>(
    () => ({
      level: 'run',
      project,
      test,
      run,
    }),
    [project, run, test],
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !closeButtonRef.current) return;
    closeButtonRef.current.focus();
  }, [mounted]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setStatusMessage('正在加载运行详情...');
    try {
      const [eventData, attachmentData, testCardData, timeseriesData] = await Promise.all([
        safeFetch(() => getRunEvents(run.run_id), [] as TbomRunEvent[]),
        safeFetch(() => listRunAttachments(run.run_id), [] as TbomAttachment[]),
        safeFetch(() => listRunTestCard(run.run_id), [] as TbomTestCardRow[]),
        safeFetch(() => getRunTimeseries(run.run_id), [] as TbomTimeseriesChannel[]),
      ]);
      setEvents(eventData);
      setAttachments(attachmentData);
      setTestCard(testCardData);
      setTimeseries(timeseriesData);
      setStatusMessage('运行详情加载完成，可继续浏览关键事件与曲线预览。');
      if (attachmentData.length > 0) {
        setSelectedAttachmentId(attachmentData[0].file_id);
      } else {
        setSelectedAttachmentId(null);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '未知错误';
      setError(message);
      setStatusMessage(`运行详情加载失败：${message}`);
    } finally {
      setLoading(false);
    }
  }, [run.run_id]);

  useEffect(() => {
    load();
  }, [load]);

  const severitySortedEvents = useMemo(() => {
    return [...events].sort((a, b) => {
      const severityRank = classifySeverity(a.severity) - classifySeverity(b.severity);
      if (severityRank !== 0) return severityRank;
      const aTs = Date.parse(a.start_ts ?? '');
      const bTs = Date.parse(b.start_ts ?? '');
      return aTs - bTs;
    });
  }, [events]);

  const chartData = useMemo(() => buildChartData(timeseries), [timeseries]);
  const channelSummaries = useMemo(() => summarizeChannels(timeseries), [timeseries]);
  const sampleInterval = useMemo(() => computeSampleInterval(timeseries), [timeseries]);

  useEffect(() => {
    if (!isCompareExpanded) return;
    const payload = {
      runId: run.run_id,
      projectId: project.project_id,
      testId: test.test_id,
      channels: channelSummaries.map((summary) => ({
        channel: summary.channel,
        unit: summary.unit ?? undefined,
        sampleRate: summary.sampleRate ?? undefined,
        min: summary.min,
        max: summary.max,
      })),
      generatedAt: new Date().toISOString(),
    } as const;
    try {
      window.localStorage.setItem('tbomComparePayload', JSON.stringify(payload));
    } catch (err) {
      console.warn('[TBOM] 无法写入 Compare payload', err);
    }
    try {
      window.dispatchEvent(new CustomEvent('tbom-compare:payload-updated', { detail: payload }));
    } catch (err) {
      console.warn('[TBOM] 无法广播 Compare payload 更新事件', err);
    }
  }, [isCompareExpanded, run.run_id, project.project_id, test.test_id, channelSummaries]);

  const selectedAttachment = useMemo(() => {
    if (!selectedAttachmentId) return null;
    return attachments.find((item) => item.file_id === selectedAttachmentId) ?? null;
  }, [attachments, selectedAttachmentId]);

  const attachmentPreview = useMemo(() => {
    if (!selectedAttachment) return null;
    if (selectedAttachment.type === 'image') {
      return (
        <ImageViewer
          src={selectedAttachment.path}
          alt={selectedAttachment.desc}
          height={320}
          allowMaximize
        />
      );
    }
    if (selectedAttachment.path?.toLowerCase().endsWith('.pdf')) {
      return (
        <PdfViewer
          fileName={selectedAttachment.desc || selectedAttachment.file_id}
          sourceUrl={selectedAttachment.path}
          previewStatus="mock"
          height={320}
        />
      );
    }
    return (
      <div className="flex h-[320px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-600">
        <i className="ri-file-text-line text-2xl text-slate-400" />
        <div>该附件类型暂不支持预览，可使用下方按钮下载。</div>
        <a
          href={selectedAttachment.path}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700"
          target="_blank"
          rel="noreferrer"
        >
          <i className="ri-download-2-line" />
          下载附件
        </a>
      </div>
    );
  }, [selectedAttachment]);

  const handleEventHover = useCallback(
    (event: TbomRunEvent | null) => {
      if (!event) {
        setHighlightRange(null);
        return;
      }
      const start = Date.parse(event.start_ts ?? '');
      const endSource = event.end_ts ? Date.parse(event.end_ts) : undefined;
      const fallback = sampleInterval ?? 10;
      if (!Number.isFinite(start)) {
        setHighlightRange(null);
        return;
      }
      const end = Number.isFinite(endSource || NaN) ? (endSource as number) : start + fallback;
      setHighlightRange({ start, end });
    },
    [sampleInterval],
  );

  if (!mounted) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/50 px-4 py-8">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`运行 ${run.run_id} 详情`}
        className="flex h-full max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
      >
        <span className="sr-only" aria-live="polite">
          {statusMessage}
        </span>
        <header className="flex flex-col gap-3 border-b border-slate-200 bg-slate-900/95 px-8 py-6 text-white sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-xs font-medium uppercase tracking-wide">
                运行详情
              </span>
              <h2 className="text-2xl font-semibold">{run.run_id}</h2>
              <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${STATUS_TONE[run.status].tone}`}>
                <i className="ri-pulse-line" />
                {STATUS_TONE[run.status].label}
              </span>
            </div>
            <p className="text-sm text-slate-200">
              {project.title} · {test.name}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-200">
            <div>
              计划时间：<span className="font-medium text-white/90">{formatDateTime(run.planned_at)}</span>
            </div>
            <div>
              执行时间：<span className="font-medium text-white/90">{formatDateTime(run.executed_at)}</span>
            </div>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1 rounded-full border border-white/30 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <i className="ri-close-line" />
              关闭
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto bg-slate-50/80">
          <div className="grid gap-6 p-8">
            {loading ? (
              <div className="flex h-60 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/80 text-sm text-slate-500">
                <i className="ri-loader-2-line animate-spin text-lg" />
                <span className="ml-2">加载运行详情...</span>
              </div>
            ) : error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-6 text-sm text-rose-700">
                <div className="flex items-center gap-2 text-base font-semibold">
                  <i className="ri-error-warning-line" /> 运行详情加载失败
                </div>
                <p className="mt-2 text-rose-600/80">{error}</p>
                <button
                  type="button"
                  onClick={load}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-xs font-medium text-white hover:bg-rose-700"
                >
                  <i className="ri-refresh-line" /> 重试
                </button>
              </div>
            ) : (
              <>
                <section className="space-y-3 rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold text-slate-900">跨域关联导航</h3>
                    <span className="text-xs text-slate-500">
                      支持 Ctrl/⌘ + 点击在新标签打开。
                    </span>
                  </div>
                  <TbomRelationChips
                    selection={selectionForRelations}
                    filters={filters}
                    runOverride={run}
                    dense
                  />
                  <p className="text-xs text-slate-500">
                    点击 chips 可同步 Compare/仿真上下文并保留 TBOM 筛选，下方概览会实时刷新。
                  </p>
                </section>

                <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-sm">
                  <h3 className="text-base font-semibold text-slate-900">运行概览</h3>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                      <div className="text-slate-500">操作者</div>
                      <div className="mt-1 text-base font-semibold text-slate-900">{run.operator ?? '—'}</div>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                      <div className="text-slate-500">试验件/序列号</div>
                      <div className="mt-1 text-base font-semibold text-slate-900">{run.test_item_sn ?? '—'}</div>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                      <div className="text-slate-500">挂接结构节点</div>
                      <div className="mt-1 text-xs font-semibold text-slate-900 break-words">
                        {run.ebom_node_id ?? test.ebom_node_id ?? '—'}
                      </div>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                      <div className="text-slate-500">附件数量</div>
                      <div className="mt-1 text-base font-semibold text-slate-900">{attachments.length}</div>
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
                    <h4 className="mb-3 text-sm font-semibold text-slate-800">试验环境参数</h4>
                    {Object.entries(run.environment ?? {}).length === 0 ? (
                      <p className="text-xs text-slate-500">未提供环境参数。</p>
                    ) : (
                      <dl className="grid gap-x-6 gap-y-3 text-sm text-slate-700 sm:grid-cols-2 lg:grid-cols-3">
                        {Object.entries(run.environment ?? {}).map(([key, value]) => (
                          <div key={key} className="flex items-center justify-between gap-4">
                            <dt className="text-slate-500">{key}</dt>
                            <dd className="font-medium text-slate-900">{String(value)}</dd>
                          </div>
                        ))}
                      </dl>
                    )}
                  </div>
                </section>

                <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-base font-semibold text-slate-900">结果预览与对比</h3>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => setCompareExpanded((prev) => !prev)}
                        className="inline-flex items-center gap-2 rounded-lg border border-blue-200 px-3 py-1.5 font-medium text-blue-600 hover:bg-blue-50"
                      >
                        <i className="ri-slideshow-2-line" />
                        {isCompareExpanded ? '收起 Compare' : '展开 Compare' }
                      </button>
                    </div>
                  </div>

                  {channelSummaries.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                      暂无时序数据，稍后可重新导入或检查数据源。
                    </div>
                  ) : (
                    <>
                      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {channelSummaries.map((summary) => (
                          <div key={summary.channel} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-slate-900">{summary.channel}</span>
                              {summary.unit ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[11px] text-blue-700">
                                  {summary.unit}
                                </span>
                              ) : null}
                            </div>
                            <div className="mt-2 grid grid-cols-3 gap-2 text-[11px] text-slate-500">
                              <div>
                                <div className="text-slate-400">均值</div>
                                <div className="font-semibold text-slate-900">{summary.mean ?? '—'}</div>
                              </div>
                              <div>
                                <div className="text-slate-400">最小</div>
                                <div className="font-semibold text-emerald-700">{summary.min ?? '—'}</div>
                              </div>
                              <div>
                                <div className="text-slate-400">最大</div>
                                <div className="font-semibold text-rose-700">{summary.max ?? '—'}</div>
                              </div>
                            </div>
                            <div className="mt-2 text-[11px] text-slate-500">
                              采样率：{summary.sampleRate ? `${summary.sampleRate} Hz` : '—'}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                        <ResponsiveContainer width="100%" height={320}>
                          <LineChart data={chartData} margin={{ left: 16, right: 32, top: 16, bottom: 8 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#cbd5f5" />
                            <XAxis
                              dataKey="tsMs"
                              type="number"
                              tickFormatter={(value) => formatTimeLabel(new Date(value).toISOString())}
                              tick={{ fontSize: 12, fill: '#475569' }}
                            />
                            <YAxis tick={{ fontSize: 12, fill: '#475569' }} stroke="#cbd5f5" />
                            <Tooltip
                              content={({ active, payload }) => {
                                if (!active || !payload?.length) return null;
                                const item = payload[0].payload as ChartDatum;
                                return (
                                  <div className="rounded-lg border border-slate-200 bg-white/95 px-3 py-2 text-xs text-slate-600 shadow">
                                    <div className="font-semibold text-slate-900">{item.tsLabel}</div>
                                    <ul className="mt-2 space-y-1">
                                      {payload.map((entry) => (
                                        <li key={entry.dataKey} className="flex items-center gap-2">
                                          <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }}></span>
                                          <span>{entry.dataKey}</span>
                                          <span className="font-semibold text-slate-900">{entry.value}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                );
                              }}
                            />
                            <Legend
                              wrapperStyle={{ fontSize: 11 }}
                            />
                            {highlightRange ? (
                              <ReferenceArea
                                x1={highlightRange.start}
                                x2={highlightRange.end}
                                fill="#f97316"
                                fillOpacity={0.12}
                                stroke="#fb923c"
                                strokeOpacity={0.6}
                              />
                            ) : null}
                            {timeseries.map((channel, index) => (
                              <Line
                                key={channel.channel}
                                type="monotone"
                                dataKey={channel.channel}
                                strokeWidth={1.6}
                                dot={false}
                                stroke={LINE_COLORS[index % LINE_COLORS.length]}
                              />
                            ))}
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                      {isCompareExpanded ? (
                        <div className="grid gap-4 rounded-2xl border border-blue-200 bg-blue-50/60 p-4">
                          <div className="flex items-center gap-2 text-sm font-semibold text-blue-800">
                            <i className="ri-route-line" /> Compare 预览（试验上下文已写入 `tbomComparePayload`）
                          </div>
                          <CompareCenter />
                        </div>
                      ) : null}
                    </>
                  )}
                </section>

                <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white/95 px-6 py-6 shadow-sm lg:grid-cols-[1fr,1fr]">
                  <div className="space-y-4">
                    <h3 className="text-base font-semibold text-slate-900">关键事件时间轴</h3>
                    {severitySortedEvents.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                        当前运行无异常事件，保持稳定。
                      </div>
                    ) : (
                      <ol className="space-y-3 text-sm text-slate-700">
                        {severitySortedEvents.map((event) => {
                          const tone = severityTone(event.severity);
                          return (
                            <li
                              key={event.event_id}
                              onMouseEnter={() => handleEventHover(event)}
                              onMouseLeave={() => handleEventHover(null)}
                              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 shadow-sm transition hover:border-blue-200 hover:bg-blue-50"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="text-sm font-semibold text-slate-900">{event.desc ?? event.event_id}</div>
                                <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${tone.tone}`}>
                                  <i className="ri-alert-line" />
                                  {tone.label}
                                </span>
                              </div>
                              <div className="mt-2 grid gap-2 text-xs text-slate-500 sm:grid-cols-2">
                                <div>
                                  开始：<span className="font-medium text-slate-700">{formatDateTime(event.start_ts)}</span>
                                </div>
                                <div>
                                  结束：<span className="font-medium text-slate-700">{formatDateTime(event.end_ts)}</span>
                                </div>
                                <div>
                                  类型：<span className="font-medium text-slate-700">{event.category ?? '—'}</span>
                                </div>
                                <div>
                                  编码：<span className="font-medium text-slate-700">{event.code ?? '—'}</span>
                                </div>
                              </div>
                            </li>
                          );
                        })}
                      </ol>
                    )}
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-base font-semibold text-slate-900">过程记录与附件</h3>
                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                      {attachments.length === 0 ? (
                        <div className="text-sm text-slate-500">暂无附件记录。</div>
                      ) : (
                        <div className="grid gap-3">
                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                            <i className="ri-information-line" /> 选择附件预览或下载，图片/PDF 将在右侧呈现。
                          </div>
                          <div className="space-y-2">
                            {attachments.map((attachment) => {
                              const active = attachment.file_id === selectedAttachmentId;
                              return (
                                <button
                                  key={attachment.file_id}
                                  type="button"
                                  onClick={() => setSelectedAttachmentId(attachment.file_id)}
                                  className={`w-full rounded-lg border px-3 py-2 text-left text-xs transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-200 ${
                                    active
                                      ? 'border-blue-300 bg-blue-50 text-blue-700'
                                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-blue-50/50'
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="font-medium">{attachment.desc || attachment.file_id}</span>
                                    <span className="text-[11px] text-slate-400">{formatDateTime(attachment.ts)}</span>
                                  </div>
                                  <div className="mt-1 text-[11px] text-slate-500">
                                    类型：{attachment.type} · 路径：{attachment.path}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                      {attachmentPreview ?? (
                        <div className="flex h-[320px] items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500">
                          从左侧选择一个附件查看预览或下载。
                        </div>
                      )}
                    </div>
                  </div>
                </section>

                <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white/95 px-6 py-6 shadow-sm">
                  <h3 className="text-base font-semibold text-slate-900">试验卡片参数</h3>
                  {testCard.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                      暂无试验卡片参数记录。
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-slate-200 text-sm text-slate-700">
                        <thead>
                          <tr className="bg-slate-100 text-xs uppercase tracking-wide text-slate-500">
                            <th scope="col" className="px-4 py-2 text-left">参数</th>
                            <th scope="col" className="px-4 py-2 text-left">数值</th>
                            <th scope="col" className="px-4 py-2 text-left">单位</th>
                            <th scope="col" className="px-4 py-2 text-left">来源</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {testCard.map((row) => (
                            <tr key={`${row.param_name}-${row.value}`} className="hover:bg-blue-50/40">
                              <td className="px-4 py-2 font-medium text-slate-900">{row.param_name}</td>
                              <td className="px-4 py-2 text-slate-700">{row.value}</td>
                              <td className="px-4 py-2 text-slate-500">{row.unit ?? '—'}</td>
                              <td className="px-4 py-2 text-slate-500">{row.source ?? '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              </>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

const LINE_COLORS = ['#2563eb', '#f97316', '#10b981', '#ec4899', '#6366f1', '#14b8a6'];
