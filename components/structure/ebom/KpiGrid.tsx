"use client";

import type { CockpitKpi } from "./cockpitTypes";
import { formatRuleType } from "./dynamicThresholds";
import EmptyState from "@/components/common/EmptyState";

function formatThresholdValue(value?: number): string {
  if (value === undefined) return "-";
  return Number.isFinite(value) ? Number(value).toFixed(1) : String(value);
}

function KpiCard({ k, defaultThresh, overrideThresh }: { k: CockpitKpi; defaultThresh?: {low?:number;high?:number;rule?:string}; overrideThresh?: {low?:number;high?:number;rule?:string} }) {
  const last = k.series[k.series.length - 1];
  const prev = k.series[k.series.length - 2];
  const diff = prev ? last.v - prev.v : 0;
  const dynamicRule = k.dynamicRule;
  const ruleType = (dynamicRule?.type as string | undefined) || (k.threshold as any)?.rule || overrideThresh?.rule || defaultThresh?.rule;
  const hi = k.threshold?.high ?? overrideThresh?.high ?? defaultThresh?.high;
  const lo = k.threshold?.low ?? overrideThresh?.low ?? defaultThresh?.low;

  const tooltipParts: string[] = [];
  if (overrideThresh && (overrideThresh.low !== undefined || overrideThresh.high !== undefined)) {
    tooltipParts.push(`覆盖 低 ${formatThresholdValue(overrideThresh.low)} / 高 ${formatThresholdValue(overrideThresh.high)}`);
  }
  if (defaultThresh && (defaultThresh.low !== undefined || defaultThresh.high !== undefined)) {
    tooltipParts.push(`预设 低 ${formatThresholdValue(defaultThresh.low)} / 高 ${formatThresholdValue(defaultThresh.high)}`);
  }
  if (ruleType) {
    tooltipParts.push(`规则：${formatRuleType(ruleType as any)}`);
  }
  if (dynamicRule?.explanation) {
    tooltipParts.push(dynamicRule.explanation);
  }
  const badgeTitle = tooltipParts.join("；");
  const badgeLabel = overrideThresh
    ? '阈值(覆盖)'
    : ruleType
    ? '阈值(动态)'
    : '阈值';

  return (
    <div className="rounded-xl border border-gray-100 bg-slate-50/70 p-4">
      <div className="text-xs font-medium text-gray-500 flex items-center gap-1">
        {k.label}
        {(lo !== undefined || hi !== undefined || ruleType) && (
          <span
            title={badgeTitle}
            className={`inline-flex items-center rounded px-1.5 py-0.5 text-[11px] border ${overrideThresh ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-white text-gray-600 border-gray-200'}`}
          >
            <i className="ri-information-line"/>{badgeLabel}
          </span>
        )}
      </div>
      <div className="mt-1 text-2xl font-semibold text-gray-900 flex items-baseline gap-1">
        <span>{last.v.toFixed(1)}</span>
        <span className="text-sm text-gray-400" title={`单位：${k.unit}`}>{k.unit}</span>
      </div>
      <div className={`mt-2 inline-flex items-center gap-1 text-xs ${diff >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
        <i className={`ri-arrow-${diff >= 0 ? 'up' : 'down'}-line`}></i>
        {diff.toFixed(1)}
      </div>
      {dynamicRule && (
        <div className="mt-2 inline-flex items-center gap-1 rounded-full border border-purple-200 bg-purple-50 px-2 py-0.5 text-[11px] text-purple-700">
          <i className="ri-function-line" />
          {formatRuleType(dynamicRule.type)}
        </div>
      )}
    </div>
  );
}

export default function KpiGrid({ kpis, defaultThresholds, overrides }: { kpis: CockpitKpi[]; defaultThresholds?: Record<string,{low?:number;high?:number}>; overrides?: Record<string,{low?:number;high?:number}> }) {
  if (!kpis?.length) {
    return <EmptyState dense title="暂无 KPI 指标" icon="ri-bar-chart-horizontal-line" description="等待数据刷新后自动展示。" />;
  }
  return (
    <section className="grid gap-3 md:grid-cols-3">
      {kpis.map((k) => {
        const def = defaultThresholds?.[k.id] ?? {};
        const ov = overrides?.[k.id];
        const merged: CockpitKpi = { ...k, threshold: { ...def, ...(k.threshold ?? {}) } } as CockpitKpi;
        return <KpiCard key={k.id} k={merged} defaultThresh={def} overrideThresh={ov} />;
      })}
    </section>
  );
}
