import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Brush,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { exportDomToPng } from '@/components/structure/ebom/exportUtils';
import type { TestSimChannel, TestSimRun } from './types';
import { convertFromCanonical, decimateSeries, makeChannelKey } from './utils';

type TestSimChartProps = {
  runs: TestSimRun[];
  channels: TestSimChannel[];
  alignmentNotes: Record<string, string | undefined>;
  onExportCsv: () => void;
};

type ChartPoint = Record<string, number | string>;

const COLORS = ['#2563EB', '#F97316', '#10B981', '#EC4899', '#6366F1', '#EAB308', '#22D3EE'];

const formatTime = (ts: number) =>
  new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3,
  }).format(ts);

export default function TestSimChart({ runs, channels, alignmentNotes, onExportCsv }: TestSimChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [syncCursor, setSyncCursor] = useState(true);
  const [zoomDomain, setZoomDomain] = useState<[number, number] | null>(null);
  const [hoverTs, setHoverTs] = useState<number | null>(null);

  const chartData = useMemo(() => {
    if (!channels.length) return [];
    const aggregated: Record<number, ChartPoint> = {};
    channels.forEach((channel) => {
      const key = channel.key ?? makeChannelKey(channel.runId ?? 'run', channel.channel);
      const decimated = decimateSeries(channel.samples);
      decimated.forEach((sample) => {
        const base = aggregated[sample.ts] ?? { ts: sample.ts };
        base[key] = convertFromCanonical(sample.value, channel.originalUnit ?? channel.unit);
        aggregated[sample.ts] = base;
      });
    });
    return Object.values(aggregated).sort((a, b) => (a.ts as number) - (b.ts as number));
  }, [channels]);

  const hasSimulationRuns = useMemo(() => runs.some((run) => run.source === 'simulation'), [runs]);
  const hasPendingSimulation = useMemo(
    () => runs.some((run) => run.source === 'simulation' && run.status !== 'ready'),
    [runs],
  );

  useEffect(() => {
    if (!chartData.length || zoomDomain) return;
    const first = chartData[0]?.ts as number | undefined;
    const last = chartData[chartData.length - 1]?.ts as number | undefined;
    if (typeof first === 'number' && typeof last === 'number') {
      setZoomDomain([first, last]);
    }
  }, [chartData, zoomDomain]);

  const handleExportPng = async () => {
    if (!containerRef.current) return;
    await exportDomToPng(containerRef.current, 'compare-test-sim.png', {
      header: {
        title: '试验 / 仿真对比',
        subtitle: `通道 ${channels
          .map((item) => (item.runLabel ? `${item.runLabel} · ${item.channel}` : item.channel))
          .join(', ')}`,
        meta: [
          { label: '运行数量', value: String(runs.length) },
          { label: '通道数量', value: String(channels.length) },
          { label: '时间', value: new Date().toLocaleString() },
        ],
      },
    });
  };

  if (!channels.length) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white text-sm text-slate-500 px-6 text-center">
        {hasSimulationRuns
          ? hasPendingSimulation
            ? '仿真源已同步，等待仿真结果生成后 Compare 将自动加载曲线。'
            : '请选择至少一个通道以绘制对比曲线。'
          : '请选择至少一个通道以绘制对比曲线。'}
      </div>
    );
  }

  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-sm" ref={containerRef}>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-slate-900">曲线对比</h4>
          <p className="text-xs text-slate-500">
            {channels.length} 个通道 · {runs.length} 条运行
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={syncCursor}
              onChange={(event) => setSyncCursor(event.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            同步光标
          </label>
          <button
            type="button"
            onClick={handleExportPng}
            className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 hover:border-blue-200 hover:text-blue-600"
          >
            <i className="ri-image-line" />
            导出 PNG
          </button>
          <button
            type="button"
            onClick={onExportCsv}
            className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 hover:border-blue-200 hover:text-blue-600"
          >
            <i className="ri-file-text-line" />
            导出 CSV
          </button>
        </div>
      </header>

      <div className="h-[420px] w-full">
        <ResponsiveContainer>
          <LineChart
            data={chartData}
            onMouseMove={(state: any) => {
              if (!state?.activePayload?.length) return;
              const first = state.activePayload[0];
              if (first?.payload?.ts && syncCursor) {
                setHoverTs(first.payload.ts as number);
              }
            }}
            onMouseLeave={() => setHoverTs(null)}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis
              dataKey="ts"
              type="number"
              domain={zoomDomain ?? ['auto', 'auto']}
              tickFormatter={(value) => formatTime(value as number)}
            />
            <YAxis tickFormatter={(value) => value.toFixed(2)} />
            <Tooltip
              formatter={(value: number, name: string) => [
                Number.isFinite(value) ? value.toFixed(4) : value,
                name,
              ]}
              labelFormatter={(label) => formatTime(label as number)}
            />
            <Legend />
            {channels.map((channel, index) => {
              const key = channel.key ?? makeChannelKey(channel.runId ?? 'run', channel.channel);
              const displayName = channel.runLabel ? `${channel.runLabel} · ${channel.channel}` : channel.channel;
              return (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                name={displayName}
                dot={false}
                stroke={COLORS[index % COLORS.length]}
                strokeWidth={1.5}
                isAnimationActive={false}
              />
            );
            })}
            {hoverTs && syncCursor ? (
              <ReferenceLine x={hoverTs} stroke="#94A3B8" strokeDasharray="4 2" />
            ) : null}
            <Brush
              dataKey="ts"
              height={24}
              travellerWidth={8}
              tickFormatter={(value) => formatTime(value as number)}
              stroke="#2563EB"
              onChange={(range) => {
                if (!range?.startIndex || !range?.endIndex) return;
                const start = chartData[range.startIndex]?.ts as number | undefined;
                const end = chartData[range.endIndex]?.ts as number | undefined;
                if (typeof start === 'number' && typeof end === 'number') {
                  setZoomDomain([start, end]);
                }
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <footer className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
        <div className="flex flex-wrap gap-2">
          {channels.map((channel, index) => {
            const color = COLORS[index % COLORS.length];
            const key = channel.key ?? makeChannelKey(channel.runId ?? 'run', channel.channel);
            const note = alignmentNotes[key] ?? (channel.unit ? `单位：${channel.unit}` : undefined);
            return (
              <div
                key={key}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1"
              >
                <span className="inline-flex h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                <span className="font-medium text-slate-700">
                  {channel.runLabel ? `${channel.runLabel} · ${channel.channel}` : channel.channel}
                </span>
                <span className="text-slate-400">{note ?? '单位/采样率已对齐'}</span>
              </div>
            );
          })}
        </div>
      </footer>
    </section>
  );
}
