"use client";

import { useMemo, useState } from "react";
import type { ReviewBoardData, ReviewBoardItem } from "./cockpitTypes";

interface Props {
  data: ReviewBoardData | null;
}

const riskColor: Record<string, string> = {
  red: "bg-rose-100 text-rose-700",
  amber: "bg-amber-100 text-amber-700",
  green: "bg-emerald-100 text-emerald-700",
};

export default function ReviewBoardPanel({ data }: Props) {
  const [view, setView] = useState<"kanban" | "list">("kanban");

  const columns = data?.columns ?? [];
  const list = data?.list ?? [];

  const metrics = useMemo(() => data?.metrics, [data]);

  const renderCard = (item: ReviewBoardItem) => (
    <div key={item.id} className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-gray-900">{item.title}</div>
        {item.risk && (
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] ${riskColor[item.risk] ?? "bg-slate-100 text-slate-600"}`}>
            <i className="ri-alert-line" /> {item.risk.toUpperCase()}
          </span>
        )}
      </div>
      <div className="mt-2 text-xs text-gray-500 space-y-1">
        <div>
          <i className="ri-calendar-2-line mr-1" /> {item.scheduledAt ?? "待排期"}
        </div>
        <div>
          <i className="ri-briefcase-line mr-1" /> 责任人：{item.owner ?? "未指派"}
        </div>
        {item.tags?.length ? (
          <div className="flex flex-wrap gap-1">
            {item.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-gray-600">
                #{tag}
              </span>
            ))}
          </div>
        ) : null}
        {item.nextAction && (
          <div className="rounded-lg bg-amber-50/60 px-3 py-1 text-amber-700">
            下一步：{item.nextAction}
          </div>
        )}
        {item.checklist?.length ? (
          <ul className="mt-2 space-y-1 text-[11px] text-gray-600">
            {item.checklist.map((task, idx) => (
              <li key={idx} className="flex items-center gap-2">
                <span className={`ri-checkbox-${task.done ? "circle-fill text-emerald-500" : "blank-circle-line text-gray-400"}`}></span>
                {task.label}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      {item.decision && (
        <div className="mt-2 rounded-md bg-emerald-50 px-2 py-1 text-xs text-emerald-700">
          决议：{item.decision}
        </div>
      )}
    </div>
  );

  if (!data) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-4 text-center text-sm text-gray-500">
        暂无评审数据
      </div>
    );
  }

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
          <i className="ri-calendar-event-fill text-indigo-500" /> 评审看板
          <span className="text-xs text-gray-500">更新于 {new Date(data.updatedAt).toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <button
            type="button"
            onClick={() => setView("kanban")}
            className={`rounded border px-2.5 py-1 ${
              view === "kanban" ? "border-indigo-500 bg-indigo-50 text-indigo-600" : "border-gray-200 bg-white"
            }`}
          >
            <i className="ri-layout-column-line" /> 看板
          </button>
          <button
            type="button"
            onClick={() => setView("list")}
            className={`rounded border px-2.5 py-1 ${
              view === "list" ? "border-indigo-500 bg-indigo-50 text-indigo-600" : "border-gray-200 bg-white"
            }`}
          >
            <i className="ri-list-unordered" /> 列表
          </button>
        </div>
      </div>

      {metrics && (
        <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-gray-600 md:grid-cols-4">
          <div className="rounded-lg bg-slate-50 px-3 py-2">
            <div className="text-lg font-semibold text-gray-900">{metrics.total}</div>
            <div>总评审</div>
          </div>
          <div className="rounded-lg bg-amber-50 px-3 py-2">
            <div className="text-lg font-semibold text-amber-700">{metrics.inProgress}</div>
            <div>进行中</div>
          </div>
          <div className="rounded-lg bg-emerald-50 px-3 py-2">
            <div className="text-lg font-semibold text-emerald-700">{metrics.completed}</div>
            <div>已完成</div>
          </div>
          <div className="rounded-lg bg-rose-50 px-3 py-2">
            <div className="text-lg font-semibold text-rose-700">{metrics.atRisk}</div>
            <div>风险项</div>
          </div>
        </div>
      )}

      {metrics?.nextMilestone && (
        <div className="mt-3 rounded-xl bg-indigo-50 px-4 py-2 text-xs text-indigo-700">
          <i className="ri-flag-2-fill mr-1" /> 下一个里程碑：{metrics.nextMilestone}
        </div>
      )}

      {view === "kanban" ? (
        <div className="mt-4 overflow-x-auto pb-2">
          <div className="grid min-w-[720px] grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {columns.map((column) => (
              <div key={column.id} className="space-y-3 rounded-2xl border border-gray-100 bg-slate-50/70 p-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-gray-700">{column.title}</div>
                  <span className="text-xs text-gray-500">{column.items.length}</span>
                </div>
                <div className="space-y-3">
                  {column.items.length ? column.items.map(renderCard) : (
                    <div className="rounded-lg border border-dashed border-gray-300 bg-white px-3 py-6 text-center text-xs text-gray-400">
                      暂无数据
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {list.map(renderCard)}
        </div>
      )}
    </section>
  );
}
