"use client";

import type { CockpitKpi } from "./cockpitTypes";
import FreshnessBadge from "./FreshnessBadge";
import type { HealthDetail } from "./healthUtils";

export default function CockpitBar({
  kpis,
  updatedAt,
  windowLabel = "24h",
  weights,
  presetLabel,
  healthDetail,
}: {
  kpis: CockpitKpi[];
  updatedAt?: string;
  windowLabel?: string;
  weights?: { dev?: number; sim?: number; test?: number; risk?: number };
  presetLabel?: string;
  healthDetail?: HealthDetail | null;
}) {
  const health = kpis.find((k) => k.id === "HLT-001");
  const latest = healthDetail?.total ?? health?.series?.[health.series.length - 1]?.v ?? 0;
  const hi = health?.threshold?.high ?? 80;
  const lo = health?.threshold?.low ?? 60;
  const status = latest < lo ? "red" : latest < hi ? "amber" : "green";

  const tooltip = (() => {
    if (healthDetail) {
      const available = healthDetail.factors.filter((f) => !f.missing);
      const parts = available.map(
        (f) => `${f.label}(${(f.normalizedWeight * 100).toFixed(0)}%)×${f.value.toFixed(1)}%`
      );
      const missing = healthDetail.factors.some((f) => f.missing);
      if (!parts.length) return "健康度评分：原始数据缺失";
      return `健康度 = ${parts.join(" + ")} = ${latest.toFixed(1)}${missing ? "（缺失项按剩余权重归一化）" : ""}`;
    }
    if (weights) {
      return `健康度=研发完成度×${(weights.dev ?? 0.25) * 100}% + 仿真完成度×${(weights.sim ?? 0.25) * 100}% + 试验完成度×${(weights.test ?? 0.25) * 100}% + 风险关闭率×${(weights.risk ?? 0.25) * 100}%`;
    }
    return "健康度评分公式";
  })();

  const statusBadge = (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs ${
        status === "green"
          ? "bg-emerald-50 text-emerald-700"
          : status === "amber"
          ? "bg-amber-50 text-amber-700"
          : "bg-rose-50 text-rose-700"
      }`}
    >
      <i className="ri-pulse-line" /> 健康度 {latest.toFixed(1)}
    </span>
  );

  return (
    <>
      <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-2 text-sm text-gray-700">
        {statusBadge}
        <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-1 text-xs text-purple-700">
          <i className="ri-dashboard-2-line" /> 实时全景驾驶舱
        </span>
        {presetLabel && (
          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-xs text-indigo-700 border border-indigo-200" title={`预设：${presetLabel}`}>
            <i className="ri-database-2-line"/> {presetLabel}
          </span>
        )}
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2.5 py-1 text-xs text-gray-600 border border-gray-200">
          <i className="ri-time-line" /> 时间窗 {windowLabel}
        </span>
        <button
          type="button"
          title={`${tooltip}（可在预设管理中调整权重）`}
          aria-label="健康度评分公式"
          className="ml-1 inline-flex items-center gap-1 rounded border border-gray-200 bg-white px-1.5 py-0.5 text-[11px] text-gray-600 hover:border-blue-300"
        >
          <i className="ri-question-line" /> 公式
        </button>
      </div>
      <div className="flex items-center gap-2 text-sm">
        <FreshnessBadge
          updatedAt={updatedAt ?? healthDetail?.updatedAt}
          freshnessSec={health?.freshnessSec}
          trust={healthDetail?.trust ?? health?.trust}
        />
      </div>
      </section>
      {healthDetail && (
        <div className="flex flex-wrap items-center gap-1 text-[11px] text-gray-600">
        {healthDetail.factors.map((f) => (
          <span
            key={f.key}
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 ${
              f.missing
                ? "border-gray-200 bg-gray-50 text-gray-400"
                : "border-indigo-200 bg-indigo-50 text-indigo-700"
            }`}
            title={
              f.missing
                ? `${f.label} 暂无数据`
                : `${f.label}: ${f.value.toFixed(1)}% × ${(f.normalizedWeight * 100).toFixed(0)}% = ${f.contribution.toFixed(1)}`
            }
          >
            <span>{f.label}</span>
            {f.missing ? (
              <span>无数据</span>
            ) : (
              <span className="font-medium text-gray-700">
                {f.value.toFixed(1)}% × {(f.normalizedWeight * 100).toFixed(0)}%
              </span>
            )}
          </span>
        ))}
        </div>
      )}
    </>
  );
}
