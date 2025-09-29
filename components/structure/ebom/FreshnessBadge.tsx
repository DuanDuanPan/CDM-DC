"use client";

import { Trust } from "./cockpitTypes";

export default function FreshnessBadge({
  updatedAt,
  freshnessSec,
  trust,
}: {
  updatedAt?: string;
  freshnessSec?: number;
  trust?: Trust;
}) {
  const now = Date.now();
  const updated = updatedAt ? new Date(updatedAt).getTime() : now;
  const ageSec = Math.max(0, Math.floor((now - updated) / 1000));
  const sec = freshnessSec ?? ageSec;
  const hours = Math.floor(sec / 3600);

  let color = "text-emerald-700 bg-emerald-50 border-emerald-200";
  if (hours > 72) color = "text-rose-700 bg-rose-50 border-rose-200";
  else if (hours > 24) color = "text-amber-700 bg-amber-50 border-amber-200";

  const trustText = trust ? (trust === 'high' ? '高' : trust === 'mid' ? '中' : '低') : '';

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${color}`}>
      <i className="ri-time-line" />
      <span>{hours}h</span>
      {trust && (
        <span className="ml-1 inline-flex items-center gap-1 rounded bg-white/80 px-1.5 py-0.5 text-[11px] text-gray-600 border border-gray-200">
          <i className="ri-shield-check-line" />可信度{trustText}
        </span>
      )}
    </span>
  );
}

