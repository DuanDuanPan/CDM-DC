"use client";

import { useMemo, useState } from "react";
import type { MessageCenterData, MessageCenterItem } from "./cockpitTypes";

interface Props {
  open: boolean;
  onClose: () => void;
  data: MessageCenterData | null;
}

const levelBadge: Record<MessageCenterItem["level"], string> = {
  critical: "bg-rose-100 text-rose-700",
  warning: "bg-amber-100 text-amber-700",
  info: "bg-slate-100 text-slate-700",
};

export default function MessageCenterDrawer({ open, onClose, data }: Props) {
  const [typeFilter, setTypeFilter] = useState<"全部" | MessageCenterItem["type"]>("全部");
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [localStatus, setLocalStatus] = useState<Record<string, MessageCenterItem["status"]>>({});

  const messages = useMemo(() => {
    if (!data) return [];
    return data.messages.filter((msg) => {
      const status = localStatus[msg.id] ?? msg.status;
      if (onlyUnread && status !== "unread") return false;
      if (typeFilter !== "全部" && msg.type !== typeFilter) return false;
      return true;
    });
  }, [data, typeFilter, onlyUnread, localStatus]);

  if (!open || !data) return null;

  const markAsRead = (id: string, next: MessageCenterItem["status"]) => {
    setLocalStatus((prev) => ({ ...prev, [id]: next }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <div className="text-base font-semibold text-gray-900">消息中心</div>
            <div className="text-xs text-gray-500">更新于 {new Date(data.updatedAt).toLocaleString()}</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-gray-200 bg-white px-3 py-1 text-sm text-gray-700 hover:border-gray-300"
          >
            <i className="ri-close-line" /> 关闭
          </button>
        </div>

        <div className="flex items-center justify-between gap-3 border-b bg-slate-50/80 px-6 py-3 text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <span>类型</span>
            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value as typeof typeFilter)}
              className="rounded border border-gray-300 bg-white px-3 py-1 text-sm text-gray-700"
            >
              <option value="全部">全部</option>
              <option value="alert">告警</option>
              <option value="task">待办</option>
              <option value="info">通知</option>
            </select>
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              className="rounded border-gray-300"
              checked={onlyUnread}
              onChange={(event) => setOnlyUnread(event.target.checked)}
            />
            仅看未读
          </label>
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
            {(data.channels ?? []).map((channel) => (
              <span key={channel} className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2 py-0.5">
                <i className="ri-notification-badge-line"></i> {channel}
              </span>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-white">
          {messages.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-gray-500">
              暂无消息
            </div>
          ) : (
            <div className="space-y-3 p-6">
              {messages.map((msg) => {
                const status = localStatus[msg.id] ?? msg.status;
                return (
                  <article key={msg.id} className="rounded-2xl border border-gray-100 bg-slate-50/70 p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] ${levelBadge[msg.level]}`}>
                          {msg.type === "alert" ? "告警" : msg.type === "task" ? "待办" : "通知"}
                        </span>
                        <span className="text-sm font-semibold text-gray-900">{msg.title}</span>
                      </div>
                      <div className="text-[11px] text-gray-500">{new Date(msg.createdAt).toLocaleString()}</div>
                    </div>
                    <div className="mt-2 text-xs text-gray-600">{msg.body}</div>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-gray-500">
                      {msg.owner && <span>责任：{msg.owner}</span>}
                      {msg.dueAt && <span>截止：{new Date(msg.dueAt).toLocaleString()}</span>}
                      {msg.category && <span>分类：{msg.category}</span>}
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-600">
                      <button
                        type="button"
                        onClick={() => markAsRead(msg.id, status === "read" ? "unread" : "read")}
                        className="rounded border border-gray-200 bg-white px-2 py-1 text-xs text-gray-600 hover:border-indigo-300 hover:text-indigo-600"
                      >
                        <i className={status === "read" ? "ri-mail-line" : "ri-mail-open-line"}></i> {status === "read" ? "标记未读" : "标记已读"}
                      </button>
                      {msg.actions?.map((action, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className="rounded border border-indigo-200 bg-indigo-50 px-2 py-1 text-xs text-indigo-700 hover:border-indigo-300"
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
