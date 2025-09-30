"use client";

import type { RiskClosureData } from "./cockpitTypes";

interface Props {
  data: RiskClosureData | null;
}

export default function RiskClosurePanel({ data }: Props) {
  if (!data) {
    return null;
  }

  const { summary, heatmap, risks, contacts } = data;

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
          <i className="ri-shield-check-line text-emerald-500" /> 风险闭环概览
        </div>
        <span className="text-xs text-gray-500">更新于 {new Date(data.updatedAt).toLocaleString()}</span>
      </div>

      <div className="mt-3 grid gap-2 text-xs text-gray-600 md:grid-cols-4">
        <div className="rounded-lg bg-rose-50 px-3 py-2">
          <div className="text-lg font-semibold text-rose-700">{summary.open}</div>
          <div>开放风险</div>
        </div>
        <div className="rounded-lg bg-amber-50 px-3 py-2">
          <div className="text-lg font-semibold text-amber-700">{summary.dueSoon}</div>
          <div>即将到期</div>
        </div>
        <div className="rounded-lg bg-rose-100 px-3 py-2">
          <div className="text-lg font-semibold text-rose-800">{summary.overdue}</div>
          <div>已逾期</div>
        </div>
        <div className="rounded-lg bg-emerald-50 px-3 py-2">
          <div className="text-lg font-semibold text-emerald-700">{(summary.closedRate * 100).toFixed(0)}%</div>
          <div>关闭率</div>
        </div>
      </div>

      <div className="mt-4 overflow-auto rounded-xl border border-gray-100">
        <table className="min-w-full text-xs text-gray-600">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-gray-500">类别/时效</th>
              {heatmap.cols.map((col) => (
                <th key={col} className="px-3 py-2 text-center font-medium text-gray-500">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {heatmap.rows.map((row, rowIndex) => (
              <tr key={row} className="even:bg-slate-50/40">
                <td className="px-3 py-2 text-sm text-gray-700">{row}</td>
                {heatmap.values[rowIndex]?.map((value, colIndex) => (
                  <td key={`${row}-${colIndex}`} className="px-3 py-2 text-center text-sm text-gray-900">
                    {value}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 space-y-3">
        {risks.slice(0, 3).map((risk) => (
          <div key={risk.id} className="rounded-xl border border-gray-100 bg-slate-50/70 p-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-gray-900">{risk.title}</div>
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] ${
                risk.status === "overdue"
                  ? "bg-rose-100 text-rose-700"
                  : risk.status === "open"
                  ? "bg-amber-100 text-amber-700"
                  : "bg-emerald-100 text-emerald-700"
              }`}
              >
                {risk.status === "overdue" ? "逾期" : risk.status === "open" ? "待关闭" : "处理中"}
              </span>
            </div>
            <div className="mt-1 text-xs text-gray-500 space-y-1">
              <div><i className="ri-user-line mr-1" /> 责任人：{risk.owner ?? "未指派"}</div>
              <div><i className="ri-alarm-warning-line mr-1" /> 截止：{risk.due}</div>
              <div><i className="ri-flashlight-line mr-1" /> 严重度：{risk.severity.toUpperCase()}</div>
              {risk.actions?.length ? (
                <ul className="mt-1 list-disc pl-4 text-[11px] text-gray-600">
                  {risk.actions.map((action, idx) => (
                    <li key={idx}>{action}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      {contacts && (
        <div className="mt-4 rounded-xl bg-blue-50 px-3 py-2 text-xs text-blue-700">
          <div className="font-semibold"><i className="ri-phone-line mr-1" /> 联系窗口</div>
          <div className="mt-1 flex flex-wrap gap-3">
            {Object.entries(contacts).map(([key, value]) => (
              <span key={key}>{key}：{value}</span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
