"use client";

import type { KpiMultiViewData } from "./cockpitTypes";
import EmptyState from "@/components/common/EmptyState";

function Gauge({ value }: { value: number }) {
  const clamped = Math.min(Math.max(value, 0), 1);
  const circumference = Math.PI * 80;
  const offset = circumference * (1 - clamped);
  const color = clamped > 0.75 ? "stroke-emerald-500" : clamped > 0.5 ? "stroke-amber-500" : "stroke-rose-500";

  return (
    <svg viewBox="0 0 120 70" className="h-32 w-full">
      <path d="M10 60 A50 50 0 0 1 110 60" fill="none" stroke="#e2e8f0" strokeWidth={10} strokeLinecap="round" />
      <path
        d="M10 60 A50 50 0 0 1 110 60"
        fill="none"
        className={color}
        strokeWidth={10}
        strokeLinecap="round"
        strokeDasharray={`${circumference} ${circumference}`}
        strokeDashoffset={offset}
      />
      <circle cx={60} cy={60} r={4} fill="#6366f1" />
    </svg>
  );
}

export default function VersionStabilityGauge({ data }: { data: KpiMultiViewData | null }) {
  if (!data?.stability) {
    return <EmptyState dense title="暂无稳定性数据" icon="ri-speed-mini-line" />;
  }
  const changeFreq = data.stability.changeFrequency ?? 0;
  const approvalRate = data.stability.approvalRate ?? 0;
  const completion = approvalRate;
  const unclosed = data.stability.unclosed ?? 0;

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1 text-sm text-gray-700">
          <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-1 text-xs text-violet-700">
            <i className="ri-timer-2-line" /> 版本稳定性
          </span>
          <span className="text-xs text-gray-500">审批率与未闭环变更总览</span>
        </div>
        <div className="text-right text-xs text-gray-500">
          <div>近7日变更频次 <span className="font-medium text-gray-700">{changeFreq}</span></div>
          <div>未闭环 <span className={`font-medium ${unclosed > 0 ? "text-amber-600" : "text-gray-700"}`}>{unclosed}</span></div>
        </div>
      </div>
      <div className="mt-3">
        <Gauge value={completion} />
      </div>
      <div className="mt-2 flex items-center justify-between text-xs text-gray-600">
        <span className="inline-flex items-center gap-1">
          <i className="ri-checkbox-circle-line text-emerald-500" /> 审批率 {Math.round(approvalRate * 100)}%
        </span>
        {typeof completion === "number" && (
          <span className="inline-flex items-center gap-1">
            <i className="ri-line-chart-line text-indigo-500" /> 稳定趋势提升 {Math.round((approvalRate - 0.75) * 100)}%
          </span>
        )}
      </div>
      {data.stability.trend?.length ? (
        <div className="mt-3 flex items-center gap-2 text-[11px] text-gray-500">
          {data.stability.trend.map((p) => (
            <span key={p.t} className="inline-flex flex-col items-center">
              <span className="font-medium text-gray-700">{Math.round(p.value * 100)}%</span>
              <span className="text-[10px] text-gray-400">{p.t.slice(5)}</span>
            </span>
          ))}
        </div>
      ) : null}
    </section>
  );
}
