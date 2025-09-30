"use client";

import { useMemo, useState } from "react";
import type { JumpLogData, JumpLogEntry } from "./cockpitTypes";
import EmptyState from "@/components/common/EmptyState";

function loadLocalLog(): JumpLogEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem("jump_log");
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed
        .map((item, idx) => ({
          id: item.id ?? `local-${idx}`,
          ts: item.ts ?? item.at ?? new Date().toISOString(),
          system: item.system ?? item.context?.system ?? "UNKNOWN",
          target: item.url ?? item.target ?? "#",
          actor: item.actor ?? { type: "user", id: "unknown" },
          context: item.context ?? {},
          status: item.status ?? item.result ?? "success",
        }))
        .reverse();
    }
    return [];
  } catch {
    return [];
  }
}

interface Props {
  open: boolean;
  data: JumpLogData | null;
  onClose: () => void;
  version?: number;
}

export default function JumpLogPanel({ open, data, onClose, version = 0 }: Props) {
  const [systemFilter, setSystemFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const mergedEntries = useMemo(() => {
    if (!open) return [];
    void version;
    const base = data?.entries ?? [];
    const local = loadLocalLog();
    return [...local, ...base];
  }, [open, data, version]);

  const systems = useMemo(() => {
    const set = new Set<string>();
    mergedEntries.forEach((entry) => set.add(entry.system));
    return Array.from(set);
  }, [mergedEntries]);

  const filtered = mergedEntries.filter((entry) => {
    if (systemFilter !== "ALL" && entry.system !== systemFilter) return false;
    if (statusFilter !== "ALL" && (entry.status ?? "success") !== statusFilter) return false;
    return true;
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end bg-black/30 backdrop-blur-sm">
      <aside className="h-full w-full max-w-lg overflow-y-auto border-l border-gray-200 bg-white p-6 shadow-xl">
        <header className="flex items-start justify-between">
          <div>
            <div className="text-xs uppercase tracking-wide text-gray-400">跳转日志</div>
            <h3 className="text-lg font-semibold text-gray-900">上下文追踪</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs text-gray-600 hover:border-gray-300"
          >
            <i className="ri-close-line" /> 关闭
          </button>
        </header>

        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-gray-600">
          <label className="flex items-center gap-1">
            系统
            <select
              value={systemFilter}
              onChange={(event) => setSystemFilter(event.target.value)}
              className="rounded border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700"
            >
              <option value="ALL">全部</option>
              {systems.map((sys) => (
                <option key={sys} value={sys}>
                  {sys}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-1">
            状态
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700"
            >
              <option value="ALL">全部</option>
              <option value="success">成功</option>
              <option value="cancelled">取消</option>
              <option value="auto">自动</option>
            </select>
          </label>
        </div>

        <div className="mt-4 space-y-3">
          {filtered.length === 0 && <EmptyState dense title="暂无跳转记录" icon="ri-exchange-box-line" description="触发跳转后将自动记录上下文。" />}
          {filtered.map((entry) => (
            <article key={entry.id} className="rounded-xl border border-gray-100 bg-slate-50/70 p-3 shadow-sm">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{new Date(entry.ts).toLocaleString()}</span>
                <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 ${
                  entry.status === "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : entry.status === "cancelled"
                    ? "border-amber-200 bg-amber-50 text-amber-700"
                    : "border-slate-200 bg-slate-50 text-slate-600"
                }`}>
                  {entry.status ?? "success"}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm text-gray-700">
                <span className="inline-flex items-center gap-1">
                  <i className="ri-database-2-line text-indigo-500"></i>
                  {entry.system}
                </span>
                <a
                  href={entry.target}
                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  打开
                  <i className="ri-external-link-line"></i>
                </a>
              </div>
              <div className="mt-2 text-xs text-gray-500 space-y-1">
                <div>
                  操作人：{entry.actor?.id} {entry.actor?.role ? `(${entry.actor.role})` : ""}
                </div>
                {entry.context && (
                  <details className="rounded border border-dashed border-gray-200 bg-white px-3 py-2">
                    <summary className="cursor-pointer text-xs text-gray-600">
                      查看上下文
                    </summary>
                    <pre className="mt-2 overflow-x-auto text-xs text-gray-500">{JSON.stringify(entry.context, null, 2)}</pre>
                  </details>
                )}
              </div>
            </article>
          ))}
        </div>
      </aside>
    </div>
  );
}
