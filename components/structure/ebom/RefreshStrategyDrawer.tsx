"use client";

import { useMemo, useState } from "react";
import PageAlerts from "./PageAlerts";
import type { PageAlert, RefreshStrategyData } from "./cockpitTypes";

interface Props {
  open: boolean;
  onClose: () => void;
  data: RefreshStrategyData | null;
}

export default function RefreshStrategyDrawer({ open, onClose, data }: Props) {
  const [auto, setAuto] = useState<Record<string, boolean>>({});

  const previewAlerts = useMemo<PageAlert[]>(() => {
    if (!data?.previewAlerts) return [];
    return data.previewAlerts.map((alert) => ({
      ...alert,
      actionLabel: "查看设置",
      onAction: () => void 0,
    }));
  }, [data]);

  if (!open || !data) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex h-[85vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <div className="text-base font-semibold text-gray-900">刷新与提醒策略</div>
            <div className="text-xs text-gray-500">更新于 {new Date(data.updatedAt).toLocaleString()} · FE-only Mock 配置</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-gray-200 bg-white px-3 py-1 text-sm text-gray-700 hover:border-gray-300"
          >
            <i className="ri-close-line" /> 关闭
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-white">
          <section className="border-b px-6 py-4">
            <div className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <i className="ri-time-line text-indigo-500" /> 数据刷新窗口
            </div>
            <div className="mt-3 overflow-hidden rounded-xl border border-gray-100">
              <table className="min-w-full text-sm text-gray-700">
                <thead className="bg-gray-50 text-xs text-gray-500">
                  <tr>
                    <th className="px-3 py-2 text-left">数据源</th>
                    <th className="px-3 py-2 text-left">频率</th>
                    <th className="px-3 py-2 text-left">责任人 / SLA</th>
                    <th className="px-3 py-2 text-left">渠道</th>
                    <th className="px-3 py-2 text-center">自动刷新</th>
                    <th className="px-3 py-2 text-left">状态</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white text-xs">
                  {data.strategies.map((strategy) => {
                    const enabled = auto[strategy.id] ?? strategy.autoRefresh;
                    return (
                      <tr key={strategy.id}>
                        <td className="px-3 py-2 font-medium text-gray-900">{strategy.label}</td>
                        <td className="px-3 py-2">{strategy.frequency}</td>
                        <td className="px-3 py-2">
                          <div className="flex flex-col">
                            <span>{strategy.owner ?? "未指派"}</span>
                            <span className="text-[11px] text-gray-500">SLA：{strategy.sla ?? "—"}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex flex-wrap gap-1">
                            {(strategy.channels ?? []).map((channel) => (
                              <span key={channel} className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-gray-600">
                                {channel}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <label className="inline-flex items-center gap-2 text-[11px]">
                            <input
                              type="checkbox"
                              className="rounded border-gray-300"
                              checked={enabled}
                              onChange={(event) => setAuto((prev) => ({ ...prev, [strategy.id]: event.target.checked }))}
                            />
                            {enabled ? "开启" : "关闭"}
                          </label>
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] ${
                              strategy.status === "healthy"
                                ? "bg-emerald-50 text-emerald-700"
                                : strategy.status === "warning"
                                ? "bg-amber-50 text-amber-700"
                                : "bg-rose-50 text-rose-700"
                            }`}
                          >
                            {strategy.status === "healthy" ? "正常" : strategy.status === "warning" ? "告警" : "阻塞"}
                          </span>
                          {strategy.notes && (
                            <div className="mt-1 text-[11px] text-gray-500">{strategy.notes}</div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {data.reminderRules?.length ? (
            <section className="border-b px-6 py-4">
              <div className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <i className="ri-notification-4-line text-amber-500" /> 提醒规则
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                {data.reminderRules.map((rule) => (
                  <div key={rule.id} className="rounded-xl border border-gray-100 bg-slate-50/70 p-3 text-xs text-gray-600">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-gray-900">{rule.condition}</div>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] ${
                          rule.level === "critical"
                            ? "bg-rose-100 text-rose-700"
                            : rule.level === "warning"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {rule.level === "critical" ? "高" : rule.level === "warning" ? "中" : "低"}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {(rule.channel ?? []).map((channel) => (
                        <span key={channel} className="rounded-full bg-white px-2 py-0.5 text-[11px] text-gray-600">
                          {channel}
                        </span>
                      ))}
                    </div>
                    <div className="mt-1 text-[11px] text-gray-500">责任：{rule.owner ?? "未指定"}，冷却：{rule.cooldown ?? "—"}</div>
                    {rule.templates?.length ? (
                      <ul className="mt-2 space-y-1 text-[11px] text-gray-500">
                        {rule.templates.map((tpl, idx) => (
                          <li key={idx} className="rounded bg-white px-2 py-1">
                            <i className="ri-chat-smile-2-line mr-1" /> {tpl}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {previewAlerts.length ? (
            <section className="px-6 py-4">
              <div className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <i className="ri-eye-line text-emerald-500" /> 提醒样式预览
              </div>
              <div className="mt-3">
                <PageAlerts alerts={previewAlerts} />
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
