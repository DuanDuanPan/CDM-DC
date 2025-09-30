"use client";

import type { ImpactGraphData, ImpactGraphNode } from "./cockpitTypes";

interface Props {
  data: ImpactGraphData | null;
}

const impactBadge: Record<string, string> = {
  high: "bg-rose-100 text-rose-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-emerald-100 text-emerald-700",
};

const typeIcon: Record<ImpactGraphNode["type"], string> = {
  part: "ri-cube-line",
  requirement: "ri-road-map-line",
  simulation: "ri-line-chart-line",
  test: "ri-test-tube-line",
  process: "ri-settings-3-line",
  supplier: "ri-building-line",
  document: "ri-article-line",
  risk: "ri-shield-cross-line",
};

export default function ImpactAnalysisPanel({ data }: Props) {
  if (!data) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
          <i className="ri-flow-chart" /> 变更影响分析
        </div>
        <span className="text-xs text-gray-500">更新于 {new Date(data.updatedAt).toLocaleString()}</span>
      </div>

      <div className="mt-3 grid gap-2 text-xs text-gray-600 md:grid-cols-3">
        {(["high", "medium", "low"] as const).map((level) => (
          <div key={level} className="rounded-lg bg-slate-50 px-3 py-2">
            <div className="text-sm font-semibold text-gray-900">{data.factors[level] ?? 0}</div>
            <div className="text-gray-500">{level === "high" ? "高影响" : level === "medium" ? "中影响" : "低影响"}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {data.nodes.slice(0, 6).map((node) => (
          <div key={node.id} className="rounded-xl border border-gray-100 bg-slate-50/70 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <i className={`${typeIcon[node.type]} text-gray-500`} /> {node.label}
              </div>
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] ${impactBadge[node.impact]}`}>
                {node.impact === "high" ? "高" : node.impact === "medium" ? "中" : "低"} 影响
              </span>
            </div>
            <div className="mt-1 text-xs text-gray-500 space-y-1">
              {node.change && <div><i className="ri-edit-2-line mr-1" /> 变更：{node.change}</div>}
              {node.status && <div><i className="ri-timer-flash-line mr-1" /> 状态：{node.status}</div>}
              {node.owner && <div><i className="ri-user-voice-line mr-1" /> 责任人：{node.owner}</div>}
            </div>
          </div>
        ))}
      </div>

      {data.recommendations?.length ? (
        <div className="mt-4 rounded-xl bg-indigo-50 px-3 py-2 text-xs text-indigo-700">
          <div className="font-semibold"><i className="ri-compass-3-line mr-1" /> 建议</div>
          <ul className="mt-1 list-disc pl-4">
            {data.recommendations.map((text, idx) => (
              <li key={idx}>{text}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
