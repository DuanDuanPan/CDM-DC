"use client";

import { useMemo, useState } from "react";
import type { KpiMultiViewData } from "./cockpitTypes";
import EmptyState from "@/components/common/EmptyState";

function normalizeSeries(series: Array<{ value: number }>): { min: number; max: number } {
  const values = series.map((p) => p.value);
  if (!values.length) return { min: 0, max: 1 };
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (min === max) return { min: min - 1, max: max + 1 };
  return { min, max };
}

function LineChart({ points }: { points: Array<{ t: string; value: number }> }) {
  if (!points.length) return <EmptyState dense title="暂无折线数据" icon="ri-line-chart-line" />;
  const { min, max } = normalizeSeries(points);
  const path = points
    .map((p, idx) => {
      const x = (idx / Math.max(points.length - 1, 1)) * 100;
      const y = 100 - ((p.value - min) / (max - min)) * 100;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg viewBox="0 0 100 100" className="h-36 w-full rounded-xl border border-gray-100 bg-gradient-to-b from-white to-slate-50 p-2">
      <polyline points={path} fill="none" stroke="rgb(79 70 229)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      {points.map((p, idx) => {
        const x = (idx / Math.max(points.length - 1, 1)) * 100;
        const y = 100 - ((p.value - min) / (max - min)) * 100;
        return <circle key={p.t} cx={x} cy={y} r={1.8} fill="rgb(99 102 241)" />;
      })}
    </svg>
  );
}

function RadarChart({ dimensions }: { dimensions: Array<{ label: string; value: number; threshold?: number }> }) {
  if (!dimensions.length) return <EmptyState dense title="暂无雷达数据" icon="ri-asterisk" />;
  const step = (Math.PI * 2) / dimensions.length;
  const points = dimensions
    .map((dim, idx) => {
      const angle = step * idx - Math.PI / 2;
      const radius = Math.max(0, Math.min(dim.value, 1));
      const x = 50 + Math.cos(angle) * radius * 45;
      const y = 50 + Math.sin(angle) * radius * 45;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <div className="flex h-36 w-full items-center justify-center rounded-xl border border-gray-100 bg-gradient-to-b from-white to-slate-50 p-3">
      <svg viewBox="0 0 100 100" className="h-full w-full">
        <polygon points={points} fill="rgba(79,70,229,0.15)" stroke="rgb(79 70 229)" strokeWidth={1.2} />
        {dimensions.map((dim, idx) => {
          const angle = step * idx - Math.PI / 2;
          const x = 50 + Math.cos(angle) * 50;
          const y = 50 + Math.sin(angle) * 50;
          const valuePosX = 50 + Math.cos(angle) * 55;
          const valuePosY = 50 + Math.sin(angle) * 55;
          return (
            <g key={dim.label}>
              <line x1={50} y1={50} x2={x} y2={y} stroke="rgba(148,163,184,0.6)" strokeWidth={0.8} />
              <text x={valuePosX} y={valuePosY} textAnchor="middle" dominantBaseline="middle" className="fill-slate-500 text-[10px]">
                {dim.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function Heatmap({ rows, cols, values }: { rows: string[]; cols: string[]; values: number[][] }) {
  if (!rows.length || !cols.length) return <EmptyState dense title="暂无热力图数据" icon="ri-grid-line" />;
  return (
    <div className="overflow-hidden rounded-xl border border-gray-100">
      <table className="min-w-full divide-y divide-gray-100 text-xs">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-2 py-1 text-left text-gray-500">模块</th>
            {cols.map((col) => (
              <th key={col} className="px-2 py-1 text-left text-gray-500">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIdx) => (
            <tr key={row} className="divide-x divide-white">
              <th className="bg-gray-50 px-2 py-1 text-left text-gray-600">{row}</th>
              {cols.map((col, colIdx) => {
                const value = values?.[rowIdx]?.[colIdx] ?? 0;
                const percent = Math.round(value * 100);
                const bg = `rgba(99, 102, 241, ${Math.min(Math.max(value, 0.1), 1)})`;
                return (
                  <td key={col} className="px-2 py-1 text-center text-[11px] text-white" style={{ background: bg }}>
                    {percent}%
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const VIEW_OPTIONS = [
  { id: "line", label: "折线" },
  { id: "radar", label: "雷达" },
  { id: "heatmap", label: "热力图" },
] as const;

type ViewType = (typeof VIEW_OPTIONS)[number]["id"];

export default function KpiMultiView({ data }: { data: KpiMultiViewData | null }) {
  const [view, setView] = useState<ViewType>("line");
  const chart = useMemo(() => {
    if (!data) return <EmptyState dense title="暂无 KPI 数据" icon="ri-dashboard-2-line" />;
    const fallbackSeries = data.timeWindows?.[0]?.series ?? [];
    switch (view) {
      case "line":
        return (
          <LineChart
            points={(data.timeWindows.find((w) => w.label === "24h")?.series ?? fallbackSeries).map((p) => ({
              t: p.t,
              value: p.value,
            }))}
          />
        );
      case "radar":
        return <RadarChart dimensions={(data.radar?.dimensions ?? []).map((d) => ({ label: d.label, value: d.value, threshold: d.threshold }))} />;
      case "heatmap":
        return <Heatmap rows={data.heatmap?.rows ?? []} cols={data.heatmap?.cols ?? []} values={data.heatmap?.values ?? []} />;
      default:
        return null;
    }
  }, [data, view]);

  if (!data) {
    return <EmptyState dense title="暂无 KPI 数据" icon="ri-dashboard-2-line" />;
  }

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between text-sm text-gray-700">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-xs text-indigo-700">
            <i className="ri-bar-chart-2-line" /> KPI 多视图
          </span>
          {data.baseline && (
            <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-slate-50 px-2 py-0.5 text-[11px] text-gray-600">
              <i className="ri-git-branch-line" /> 基线 {data.baseline}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 text-xs">
          {VIEW_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setView(option.id)}
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 border ${
                view === option.id
                  ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                  : "border-gray-200 bg-white text-gray-600 hover:border-indigo-200 hover:text-indigo-600"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-3">{chart}</div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
        {data.threshold?.rule && (
          <span className="inline-flex items-center gap-1 rounded border border-purple-200 bg-purple-50 px-2 py-0.5 text-purple-700">
            <i className="ri-function-line" /> 规则 {data.threshold.rule} μ={data.threshold.mu ?? "—"} σ={data.threshold.sigma ?? "—"}
          </span>
        )}
        {data.threshold?.overrides && Object.keys(data.threshold.overrides).length > 0 && (
          <span className="inline-flex items-center gap-1 rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-amber-700">
            <i className="ri-alert-line" /> 覆盖 {Object.keys(data.threshold.overrides).join("、")}
          </span>
        )}
      </div>
    </section>
  );
}
