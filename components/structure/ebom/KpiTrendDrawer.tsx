"use client";

import { useMemo } from "react";
import type { CockpitKpi } from "./cockpitTypes";
import FreshnessBadge from "./FreshnessBadge";

interface Props {
  open: boolean;
  kpi: CockpitKpi | null;
  onClose: () => void;
  onOpenThreshold?: (kpi: CockpitKpi) => void;
}

function buildTrendPath(points: CockpitKpi["series"]) {
  if (!points.length) return "";
  const values = points.map((point) => point.v);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  return points
    .map((point, index) => {
      const x = (index / Math.max(points.length - 1, 1)) * 100;
      const y = 100 - ((point.v - min) / span) * 100;
      return `${x},${y}`;
    })
    .join(" ");
}

function formatDiff(latest?: number, previous?: number) {
  if (latest === undefined || previous === undefined) return null;
  const delta = latest - previous;
  const DirectionIcon = delta >= 0 ? "ri-arrow-up-line" : "ri-arrow-down-line";
  return {
    delta,
    icon: DirectionIcon,
    tone: delta >= 0 ? "text-emerald-600" : "text-rose-600",
  };
}

export default function KpiTrendDrawer({ open, kpi, onClose, onOpenThreshold }: Props) {
  const series = useMemo(() => kpi?.series ?? [], [kpi]);
  const last = series[series.length - 1];
  const prev = series[series.length - 2];
  const diff = useMemo(() => formatDiff(last?.v, prev?.v), [last?.v, prev?.v]);
  const threshold = kpi?.threshold;
  const path = useMemo(() => buildTrendPath(series), [series]);
  const chartMinMax = useMemo(() => {
    if (!series.length) return { min: 0, max: 0 };
    const values = series.map((point) => point.v);
    const min = Math.min(...values);
    const max = Math.max(...values);
    return { min, max };
  }, [series]);

  if (!open || !kpi) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        className="flex w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <div className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <i className="ri-line-chart-line text-indigo-500" /> {kpi.label}
            </div>
            <div className="mt-1 text-xs text-gray-500">单位：{kpi.unit || "—"}</div>
          </div>
          <div className="flex items-center gap-3">
            <FreshnessBadge
              updatedAt={last?.t}
              freshnessSec={kpi.freshnessSec}
              trust={kpi.trust}
            />
            <button
              type="button"
              onClick={onClose}
              className="rounded border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:border-gray-300"
            >
              <i className="ri-close-line" /> 关闭
            </button>
          </div>
        </div>

        <div className="grid gap-4 px-6 py-5 md:grid-cols-[2fr_1fr] md:items-start">
          <div className="rounded-2xl border border-gray-200 bg-gradient-to-b from-white to-slate-50 p-4 shadow-sm">
            {series.length ? (
              <svg viewBox="0 0 100 100" className="h-52 w-full">
                <defs>
                  <linearGradient id="trend-fill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="rgba(79,70,229,0.18)" />
                    <stop offset="100%" stopColor="rgba(129,140,248,0.02)" />
                  </linearGradient>
                </defs>
                <polygon
                  points={`${path} 100,100 0,100`}
                  fill="url(#trend-fill)"
                  opacity={0.7}
                />
                <polyline
                  points={path}
                  fill="none"
                  stroke="rgb(79 70 229)"
                  strokeWidth={2.2}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
                {threshold?.high !== undefined && (
                  <line
                    x1={0}
                    x2={100}
                    y1={(1 - (threshold.high - chartMinMax.min) / ((chartMinMax.max - chartMinMax.min) || 1)) * 100}
                    y2={(1 - (threshold.high - chartMinMax.min) / ((chartMinMax.max - chartMinMax.min) || 1)) * 100}
                    stroke="rgba(16,185,129,0.6)"
                    strokeDasharray="4 3"
                    strokeWidth={1}
                  />
                )}
                {threshold?.low !== undefined && (
                  <line
                    x1={0}
                    x2={100}
                    y1={(1 - (threshold.low - chartMinMax.min) / ((chartMinMax.max - chartMinMax.min) || 1)) * 100}
                    y2={(1 - (threshold.low - chartMinMax.min) / ((chartMinMax.max - chartMinMax.min) || 1)) * 100}
                    stroke="rgba(248,113,113,0.6)"
                    strokeDasharray="4 3"
                    strokeWidth={1}
                  />
                )}
                {series.map((point, index) => {
                  const x = (index / Math.max(series.length - 1, 1)) * 100;
                  const y = 100 - ((point.v - chartMinMax.min) / ((chartMinMax.max - chartMinMax.min) || 1)) * 100;
                  return <circle key={point.t} cx={x} cy={y} r={1.8} fill="rgb(99 102 241)" />;
                })}
              </svg>
            ) : (
              <div className="flex h-52 items-center justify-center text-sm text-gray-500">
                暂无趋势数据
              </div>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-500">
              <span className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-indigo-700">
                <i className="ri-honour-line" /> 值域 {chartMinMax.min.toFixed(1)} ~ {chartMinMax.max.toFixed(1)}
              </span>
              {threshold?.high !== undefined || threshold?.low !== undefined ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-amber-700">
                  <i className="ri-alert-line" /> 阈值 {formatThreshold(threshold)}
                </span>
              ) : null}
              {onOpenThreshold && (
                <button
                  type="button"
                  onClick={() => onOpenThreshold(kpi)}
                  className="inline-flex items-center gap-1 rounded border border-gray-200 bg-white px-2 py-0.5 font-medium text-gray-600 transition-colors duration-150 hover:border-purple-200 hover:text-purple-600"
                >
                  <i className="ri-equalizer-line" /> 调整阈值
                </button>
              )}
            </div>
          </div>
          <div className="space-y-3">
            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="text-sm font-semibold text-gray-900">当前表现</div>
              <div className="mt-2 space-y-2 text-sm text-gray-600">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">最新值</span>
                  <span className="text-base font-semibold text-gray-900">{last?.v.toFixed(1)}</span>
                </div>
                {diff && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">较上一周期</span>
                    <span className={`inline-flex items-center gap-1 text-sm font-medium ${diff.tone}`}>
                      <i className={diff.icon} /> {Math.abs(diff.delta).toFixed(1)}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">最后更新时间</span>
                  <span className="text-xs text-gray-500">{last?.t ? new Date(last.t).toLocaleString() : "—"}</span>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="text-sm font-semibold text-gray-900">历史记录</div>
              <ul className="mt-2 max-h-48 space-y-2 overflow-auto text-xs text-gray-600">
                {series.slice().reverse().map((point) => (
                  <li key={point.t} className="flex items-center justify-between">
                    <span>{new Date(point.t).toLocaleString()}</span>
                    <span className="font-mono text-gray-700">{point.v.toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatThreshold(threshold?: { high?: number; low?: number }) {
  if (!threshold) return "—";
  const parts: string[] = [];
  if (threshold.low !== undefined) parts.push(`低 ${threshold.low}`);
  if (threshold.high !== undefined) parts.push(`高 ${threshold.high}`);
  return parts.length ? parts.join(" / ") : "—";
}
