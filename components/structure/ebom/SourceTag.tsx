"use client";

import { useMemo } from "react";
import type { Trust } from "./cockpitTypes";

interface SourceDescriptor {
  system: string;
  label?: string;
  updatedAt?: string;
  trust?: Trust;
  freshnessSec?: number;
}

interface SourceTagProps {
  sources: SourceDescriptor[];
  compact?: boolean;
  onRefresh?: () => void;
}

const trustText = {
  high: "高",
  mid: "中",
  low: "低",
} as const;

function formatAge(updatedAt?: string, freshnessSec?: number): string {
  if (!updatedAt && typeof freshnessSec !== "number") return "未知";
  const now = Date.now();
  const updated = updatedAt ? new Date(updatedAt).getTime() : now - (freshnessSec ?? 0) * 1000;
  const ageSec = Math.max(0, Math.round((now - updated) / 1000));
  if (ageSec < 60) return `${ageSec}s`;
  if (ageSec < 3600) return `${Math.floor(ageSec / 60)}m`;
  if (ageSec < 86400) return `${Math.floor(ageSec / 3600)}h`;
  return `${Math.floor(ageSec / 86400)}d`;
}

export default function SourceTag({ sources, compact = false, onRefresh }: SourceTagProps) {
  const aggregated = useMemo(() => {
    if (!sources?.length) return null;
    const primary = sources[0];
    const label = primary.label ?? primary.system;
    const subtitle = sources.length > 1 ? `+${sources.length - 1}` : undefined;
    const age = formatAge(primary.updatedAt, primary.freshnessSec);
    const color = (() => {
      if (primary.trust === "low") return "border-rose-200 bg-rose-50 text-rose-700";
      if (primary.trust === "mid") return "border-amber-200 bg-amber-50 text-amber-700";
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    })();
    const trust = primary.trust ? trustText[primary.trust] : undefined;
    return { primary, label, subtitle, age, color, trust };
  }, [sources]);

  if (!aggregated) return null;

  return (
    <div className="flex items-center gap-1">
      <span
        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${aggregated.color}`}
        title={sources
          .map((s) => `${s.label ?? s.system} · 更新时间 ${s.updatedAt ?? "未知"}${s.trust ? ` · 可信度${trustText[s.trust]}` : ""}`)
          .join("\n")}
      >
        <i className="ri-database-2-line" />
        <span>{aggregated.label}</span>
        <span className="text-[11px] text-gray-500">{aggregated.age}</span>
        {aggregated.trust && (
          <span className="inline-flex items-center gap-0.5 rounded bg-white/80 px-1 py-0 text-[10px] text-gray-600 border border-gray-200">
            <i className="ri-shield-check-line" />{aggregated.trust}
          </span>
        )}
        {aggregated.subtitle && (
          <span className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-white/60 text-[10px] text-gray-600">
            {aggregated.subtitle}
          </span>
        )}
      </span>
      {onRefresh && (
        <button
          type="button"
          onClick={onRefresh}
          className={`inline-flex items-center gap-1 rounded border border-gray-200 bg-white ${compact ? "px-1 py-0.5 text-[11px]" : "px-1.5 py-0.5 text-xs"} text-gray-600 hover:border-blue-300 hover:text-blue-600`}
        >
          <i className="ri-refresh-line" />刷新
        </button>
      )}
    </div>
  );
}
