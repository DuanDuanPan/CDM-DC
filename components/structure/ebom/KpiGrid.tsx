"use client";

import type { CockpitKpi } from "./cockpitTypes";
import { formatRuleType } from "./dynamicThresholds";
import EmptyState from "@/components/common/EmptyState";

function formatThresholdValue(value?: number): string {
  if (value === undefined || value === null) return "-";
  return Number.isFinite(value) ? Number(value).toFixed(1) : String(value);
}

function KpiCard({
  k,
  defaultThresh,
  overrideThresh,
  onInspect,
  onOpenThreshold,
}: {
  k: CockpitKpi;
  defaultThresh?: { low?: number; high?: number; rule?: string };
  overrideThresh?: { low?: number; high?: number; rule?: string };
  onInspect?: (kpi: CockpitKpi) => void;
  onOpenThreshold?: (kpi: CockpitKpi) => void;
}) {
  const last = k.series[k.series.length - 1];
  const prev = k.series[k.series.length - 2];
  const diff = prev ? last.v - prev.v : 0;
  const dynamicRule = k.dynamicRule;
  const ruleType =
    (dynamicRule?.type as string | undefined) ||
    (k.threshold as any)?.rule ||
    overrideThresh?.rule ||
    defaultThresh?.rule;
  const hi = k.threshold?.high ?? overrideThresh?.high ?? defaultThresh?.high;
  const lo = k.threshold?.low ?? overrideThresh?.low ?? defaultThresh?.low;
  const lastTimestamp = last?.t;

  const tooltipParts: string[] = [];
  if (overrideThresh && (overrideThresh.low !== undefined || overrideThresh.high !== undefined)) {
    tooltipParts.push(
      `覆盖 低 ${formatThresholdValue(overrideThresh.low)} / 高 ${formatThresholdValue(overrideThresh.high)}`,
    );
  }
  if (defaultThresh && (defaultThresh.low !== undefined || defaultThresh.high !== undefined)) {
    tooltipParts.push(
      `预设 低 ${formatThresholdValue(defaultThresh.low)} / 高 ${formatThresholdValue(defaultThresh.high)}`,
    );
  }
  if (ruleType) {
    tooltipParts.push(`规则：${formatRuleType(ruleType as any)}`);
  }
  if (dynamicRule?.explanation) {
    tooltipParts.push(dynamicRule.explanation);
  }
  const badgeTitle = tooltipParts.join("；");
  const badgeLabel = overrideThresh ? "阈值(覆盖)" : ruleType ? "阈值(动态)" : "阈值";

  const trendLabel = diff >= 0 ? "↑" : "↓";
  const trendColor = diff >= 0 ? "text-emerald-600" : "text-rose-600";
  const updatedAt = lastTimestamp ? new Date(lastTimestamp).toLocaleString() : undefined;

  const labelNode = onInspect ? (
    <button
      type="button"
      onClick={() => onInspect(k)}
      className="text-left text-sm font-semibold text-gray-900 transition-colors duration-150 hover:text-indigo-600 focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
    >
      {k.label}
    </button>
  ) : (
    <div className="text-sm font-semibold text-gray-900">{k.label}</div>
  );

  const unitNode = onOpenThreshold ? (
    <button
      type="button"
      onClick={() => onOpenThreshold(k)}
      className="rounded border border-transparent px-2 py-0.5 text-xs font-medium text-indigo-600 transition-colors duration-150 hover:border-indigo-200 hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
      aria-label={`${k.label} 阈值设置`}
    >
      {k.unit || "—"}
    </button>
  ) : (
    <span className="text-sm text-gray-400">{k.unit || "—"}</span>
  );

  return (
    <article className="flex h-full flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        {labelNode}
        {(lo !== undefined || hi !== undefined || ruleType) && (
          <span
            title={badgeTitle}
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] ${
              overrideThresh
                ? "border-amber-200 bg-amber-50 text-amber-700"
                : "border-gray-200 bg-gray-50 text-gray-600"
            }`}
          >
            <i className="ri-pulse-line" /> {badgeLabel}
          </span>
        )}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-semibold text-gray-900">{last.v.toFixed(1)}</span>
        {unitNode}
      </div>
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <span className={`${trendColor} inline-flex items-center gap-1 font-medium`}>
          <i className={`ri-arrow-${diff >= 0 ? "up" : "down"}-line`} /> {trendLabel}
          {Math.abs(diff).toFixed(1)}
        </span>
        {prev && <span className="text-gray-400">较上一周期</span>}
        {updatedAt && <span className="ml-auto text-gray-400">更新：{updatedAt}</span>}
      </div>
      {dynamicRule && (
        <div className="inline-flex w-fit items-center gap-1 rounded-full border border-purple-200 bg-purple-50 px-2 py-0.5 text-[11px] text-purple-700">
          <i className="ri-magic-line" /> {formatRuleType(dynamicRule.type)}
        </div>
      )}
      <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-dashed border-gray-200 pt-3 text-xs">
        {onInspect && (
          <button
            type="button"
            onClick={() => onInspect(k)}
            className="inline-flex items-center gap-1 rounded border border-gray-200 bg-white px-2.5 py-1 font-medium text-gray-600 transition-colors duration-150 hover:border-indigo-200 hover:text-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <i className="ri-line-chart-line" /> 查看趋势
          </button>
        )}
        {onOpenThreshold && (
          <button
            type="button"
            onClick={() => onOpenThreshold(k)}
            className="inline-flex items-center gap-1 rounded border border-gray-200 bg-white px-2.5 py-1 font-medium text-gray-600 transition-colors duration-150 hover:border-purple-200 hover:text-purple-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
          >
            <i className="ri-equalizer-line" /> 动态阈值
          </button>
        )}
      </div>
    </article>
  );
}

export default function KpiGrid({
  kpis,
  defaultThresholds,
  overrides,
  onInspect,
  onOpenThreshold,
}: {
  kpis: CockpitKpi[];
  defaultThresholds?: Record<string, { low?: number; high?: number }>;
  overrides?: Record<string, { low?: number; high?: number }>;
  onInspect?: (kpi: CockpitKpi) => void;
  onOpenThreshold?: (kpi: CockpitKpi) => void;
}) {
  if (!kpis?.length) {
    return (
      <EmptyState
        dense
        title="暂无 KPI 指标"
        icon="ri-bar-chart-horizontal-line"
        description="等待数据刷新后自动展示。"
      />
    );
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {kpis.map((k) => {
        const def = defaultThresholds?.[k.id] ?? {};
        const ov = overrides?.[k.id];
        const merged: CockpitKpi = { ...k, threshold: { ...def, ...(k.threshold ?? {}) } } as CockpitKpi;
        return (
          <KpiCard
            key={k.id}
            k={merged}
            defaultThresh={def}
            overrideThresh={ov}
            onInspect={onInspect}
            onOpenThreshold={onOpenThreshold}
          />
        );
      })}
    </div>
  );
}
