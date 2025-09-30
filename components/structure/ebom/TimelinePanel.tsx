"use client";

import { useMemo, useState } from "react";
import type { TimelineData } from "./cockpitTypes";

interface Props {
  data: TimelineData | null;
}

export default function TimelinePanel({ data }: Props) {
  const [filter, setFilter] = useState<string>("全部");

  const categories = data?.categories ?? {};

  const events = useMemo(() => {
    if (!data) return [];
    return data.events.filter((event) => filter === "全部" || event.type === filter);
  }, [data, filter]);

  if (!data) {
    return null;
  }

  const badgeColor = (type: string): string => categories[type]?.color ?? "#a855f7";

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
          <i className="ri-time-line text-slate-600" /> 时间线
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>类别</span>
          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            className="rounded border border-gray-300 bg-white px-3 py-1 text-sm text-gray-700"
          >
            <option value="全部">全部</option>
            {Object.keys(categories).map((key) => (
              <option key={key} value={key}>
                {categories[key].label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-3 space-y-4">
        {data.milestones?.length ? (
          <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-2 text-xs text-indigo-700">
            <div className="font-semibold"><i className="ri-flag-2-fill mr-1" /> 关键里程碑</div>
            <div className="mt-1 flex flex-wrap gap-3">
              {data.milestones.map((milestone) => (
                <span key={milestone.id} className="inline-flex items-center gap-1">
                  <i className="ri-checkbox-blank-circle-fill text-indigo-400 text-[8px]"></i>
                  {milestone.title} ({milestone.timestamp})
                </span>
              ))}
            </div>
          </div>
        ) : null}

        <div className="relative pl-4">
          <div className="absolute left-1 top-1 bottom-1 w-px bg-slate-200" aria-hidden></div>
          <div className="space-y-4">
            {events.map((event) => (
              <div key={event.id} className="relative ml-2"> 
                <span
                  className="absolute -left-[1.15rem] top-1 flex h-4 w-4 items-center justify-center rounded-full border border-white shadow"
                  style={{ backgroundColor: badgeColor(event.type) }}
                  aria-hidden
                ></span>
                <div className="rounded-xl border border-gray-100 bg-slate-50/70 px-3 py-2">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-gray-900">{event.title}</div>
                    <span className="text-[11px] text-gray-500">{event.timestamp}</span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
                    <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2 py-0.5" style={{ color: badgeColor(event.type) }}>
                      {categories[event.type]?.label ?? event.type}
                    </span>
                    {event.owner && <span>责任：{event.owner}</span>}
                    {event.status && <span>状态：{event.status}</span>}
                  </div>
                  {event.description && (
                    <div className="mt-1 text-xs text-gray-600">{event.description}</div>
                  )}
                </div>
              </div>
            ))}
            {events.length === 0 && (
              <div className="rounded-xl border border-dashed border-gray-300 bg-white px-3 py-6 text-center text-xs text-gray-500">
                当前筛选无事件
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
