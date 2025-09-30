"use client";

import { useMemo, useState } from "react";
import type { PageAlert } from "./cockpitTypes";

interface Props {
  alerts: PageAlert[];
}

const levelStyles: Record<PageAlert["level"], string> = {
  info: "border-sky-200 bg-sky-50 text-sky-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  critical: "border-rose-200 bg-rose-50 text-rose-700",
};

export default function PageAlerts({ alerts }: Props) {
  const [dismissed, setDismissed] = useState<Set<string>>(() => new Set());
  const visible = useMemo(() => alerts.filter((alert) => !dismissed.has(alert.id)), [alerts, dismissed]);

  if (!visible.length) return null;

  return (
    <div className="space-y-2">
      {visible.map((alert) => (
        <div key={alert.id} className={`flex flex-col gap-3 rounded-xl border px-4 py-3 text-sm ${levelStyles[alert.level]} md:flex-row md:items-start md:justify-between`}>
          <div className="space-y-1">
            <div className="font-medium text-gray-900/80">{alert.title}</div>
            <p className="text-xs text-gray-600/90">{alert.message}</p>
            {alert.actionLabel && alert.onAction && (
              <button
                type="button"
                onClick={alert.onAction}
                className="inline-flex items-center gap-1 rounded border border-gray-200 bg-white px-2 py-0.5 text-xs text-gray-700 hover:border-gray-300"
              >
                <i className="ri-lightbulb-line" /> {alert.actionLabel}
              </button>
            )}
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setDismissed((prev) => new Set(prev).add(alert.id))}
              className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
            >
              <i className="ri-close-line" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
