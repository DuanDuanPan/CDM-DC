"use client";

import { useEffect, useMemo, useState } from "react";
import type { CockpitKpi, DynamicThresholdRule } from "./cockpitTypes";
import { formatRuleType, groupRulesByKpi, listDynamicThresholdRules } from "./dynamicThresholds";

interface Props {
  open: boolean;
  onClose: () => void;
  kpis: CockpitKpi[];
  initialKpiId?: string | null;
}

const typeOptions: Array<{ value: "all" | DynamicThresholdRule["type"]; label: string }> = [
  { value: "all", label: "全部类型" },
  { value: "mu_sigma", label: "µ±σ" },
  { value: "percentile", label: "分位" },
  { value: "stage", label: "阶段" },
];

function RuleCard({ rule }: { rule: DynamicThresholdRule }) {
  const boundsText = [
    rule.bounds.low !== undefined ? `低：${rule.bounds.low}` : null,
    rule.bounds.high !== undefined ? `高：${rule.bounds.high}` : null,
    rule.bounds.red !== undefined ? `红线：${rule.bounds.red}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const paramsEntries = Object.entries(rule.parameters ?? {});

  return (
    <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
            {rule.label}
            <span className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[11px] text-indigo-700">
              <i className="ri-function-line" /> {formatRuleType(rule.type)}
            </span>
          </div>
          <div className="mt-1 text-xs text-gray-500">
            来源：{rule.source} · 计算窗口：{rule.window ?? "—"}
          </div>
        </div>
        <span className="text-[11px] text-gray-500">评估时间 {new Date(rule.lastEvaluatedAt).toLocaleString()}</span>
      </div>
      <div className="mt-3 rounded-lg bg-slate-50/80 p-3 text-sm text-gray-700">
        <div className="font-medium text-gray-800">阈值区间</div>
        <div className="text-xs text-gray-600">{boundsText || "未提供"}</div>
      </div>
      {paramsEntries.length > 0 && (
        <div className="mt-3 grid gap-2 text-xs text-gray-600 md:grid-cols-2">
          {paramsEntries.map(([key, value]) => (
            <div key={key} className="rounded border border-gray-100 bg-white px-2 py-1">
              <span className="text-gray-500">{key}：</span>
              <span className="font-mono text-gray-700">{String(value)}</span>
            </div>
          ))}
        </div>
      )}
      {rule.samples?.length ? (
        <div className="mt-3">
          <div className="text-xs font-medium text-gray-700">样本快照</div>
          <div className="mt-1 grid grid-cols-3 gap-2 text-[11px] text-gray-600">
            {rule.samples.slice(-6).map((point) => (
              <div key={`${rule.id}-${point.t}`} className="rounded border border-gray-100 bg-slate-50 px-2 py-1">
                <div className="font-mono text-gray-700">{point.v}</div>
                <div className="text-[10px] text-gray-400">{point.t}</div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
      {rule.explanation && (
        <p className="mt-3 rounded-lg bg-amber-50/70 px-3 py-2 text-xs text-amber-800">
          <i className="ri-information-line mr-1" /> {rule.explanation}
        </p>
      )}
    </article>
  );
}

export default function DynamicThresholdDrawer({ open, onClose, kpis, initialKpiId }: Props) {
  const grouped = useMemo(() => groupRulesByKpi(), []);
  const allRules = useMemo(() => listDynamicThresholdRules(), []);

  const kpiWithRule = useMemo(() => {
    const ids = new Set(allRules.map((r) => r.kpiId));
    return kpis.filter((kpi) => ids.has(kpi.id));
  }, [allRules, kpis]);

  const kpiOptions = useMemo(() => {
    const map = new Map<string, CockpitKpi>();
    kpiWithRule.forEach((item) => map.set(item.id, item));
    kpis.forEach((item) => {
      if (!map.has(item.id)) {
        map.set(item.id, item);
      }
    });
    return Array.from(map.values());
  }, [kpiWithRule, kpis]);

  const [activeKpiId, setActiveKpiId] = useState<string | null>(initialKpiId ?? null);
  const [typeFilter, setTypeFilter] = useState<(typeof typeOptions)[number]["value"]>("all");

  useEffect(() => {
    if (!open) return;
    if (initialKpiId) {
      setActiveKpiId(initialKpiId);
      return;
    }
    setActiveKpiId((prev) => {
      if (prev) return prev;
      const first = kpiOptions[0]?.id ?? allRules[0]?.kpiId ?? null;
      return first;
    });
  }, [open, initialKpiId, kpiOptions, allRules]);

  if (!open) return null;

  const rules = (activeKpiId ? grouped[activeKpiId] ?? [] : allRules).filter((rule) =>
    typeFilter === "all" ? true : rule.type === typeFilter
  );

  const activeLabel = activeKpiId
    ? kpis.find((item) => item.id === activeKpiId)?.label ?? activeKpiId
    : "全部 KPI";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex h-[80vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <div className="text-base font-semibold text-gray-900">动态阈值规则库（Mock）</div>
            <div className="text-xs text-gray-500">未来将对接 `/api/cockpit/threshold-rules`，当前展示 docs/mocks 中的样例数据。</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:border-gray-300"
          >
            <i className="ri-close-line" /> 关闭
          </button>
        </div>
        <div className="flex flex-col gap-4 border-b px-6 py-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-700">
            <span className="text-xs text-gray-500">KPI</span>
            <select
              value={activeKpiId ?? ""}
              onChange={(event) => setActiveKpiId(event.target.value || null)}
              className="rounded border border-gray-300 bg-white px-3 py-1 text-sm"
            >
              <option value="">全部（{allRules.length} 条规则）</option>
              {kpiOptions.map((kpi) => (
                <option key={kpi.id} value={kpi.id}>
                  {kpi.label}（{kpi.id}）
                </option>
              ))}
            </select>
            <span className="text-xs text-gray-500">规则类型</span>
            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value as (typeof typeOptions)[number]["value"])}
              className="rounded border border-gray-300 bg-white px-3 py-1 text-sm"
            >
              {typeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">
              <i className="ri-flashlight-line" /> Mock 数据
            </span>
            <span>当前 KPI：{activeLabel}</span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto bg-slate-50/60 px-6 py-4">
          {rules.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
              当前筛选无匹配规则，请调整 KPI 或规则类型。
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {rules.map((rule) => (
                <RuleCard key={rule.id} rule={rule} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
