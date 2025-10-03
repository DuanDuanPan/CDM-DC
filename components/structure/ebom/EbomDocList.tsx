"use client";

import type { EbomDocumentLink, EbomTreeNode } from './types';

const statusBadge = (status?: EbomDocumentLink['status']) => {
  if (!status) return null;
  if (status === 'approved') {
    return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] text-emerald-700"><i className="ri-checkbox-circle-line" /> 已批准</span>;
  }
  if (status === 'in-review') {
    return <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] text-amber-700"><i className="ri-timer-line" /> 评审中</span>;
  }
  if (status === 'pending') {
    return <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600"><i className="ri-time-line" /> 待上传</span>;
  }
  if (status === 'missing') {
    return <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[11px] text-rose-700"><i className="ri-alert-line" /> 缺失</span>;
  }
  return null;
};

const docIcon = (type: EbomDocumentLink['type']) => {
  switch (type) {
    case 'drawing':
      return 'ri-draft-line';
    case 'spec':
      return 'ri-book-2-line';
    case 'calc':
      return 'ri-function-line';
    case 'review':
      return 'ri-chat-check-line';
    case 'report':
      return 'ri-pie-chart-2-line';
    case 'image':
      return 'ri-image-line';
    default:
      return 'ri-file-text-line';
  }
};

export default function EbomDocList({ node }: { node: EbomTreeNode | null }) {
  if (!node) return null;
  const docs = node.links?.docs ?? [];
  const pending = docs.filter((d) => d.status === 'pending' || d.status === 'missing' || !d.url);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs font-medium text-gray-500">
        <span className="inline-flex items-center gap-2 text-gray-600">
          <i className="ri-file-list-2-line" /> 设计文档
          <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">共 {docs.length} 个</span>
          {pending.length > 0 && (
            <span className="rounded bg-rose-50 px-2 py-0.5 text-[11px] text-rose-700">待补齐 {pending.length}</span>
          )}
        </span>
        {pending.length > 0 && (
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded border border-rose-200 bg-rose-50 px-2 py-1 text-xs text-rose-700 hover:border-rose-300"
            onClick={() => {
              if (typeof window !== 'undefined') {
                console.info('发起文档补录提醒', pending.map((d) => d.id));
              }
            }}
          >
            <i className="ri-notification-badge-line" /> 发起提醒
          </button>
        )}
      </div>
      {docs.length === 0 ? (
        <div className="text-sm text-gray-400">暂无文档</div>
      ) : (
        <ul className="divide-y divide-gray-100">
          {docs.map((doc) => (
            <li key={doc.id} className="flex flex-wrap items-center justify-between gap-3 py-2 text-sm">
              <div className="flex flex-col gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  <i className={`${docIcon(doc.type)} text-gray-600`}></i>
                  <span className="font-medium text-gray-800">{doc.name}</span>
                  {doc.version && <span className="rounded border border-gray-200 bg-white px-1.5 py-0.5 text-[11px] text-gray-500">v{doc.version}</span>}
                  {statusBadge(doc.status)}
                </div>
                <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-500">
                  {doc.classification && <span className="inline-flex items-center gap-1"><i className="ri-shield-keyhole-line" /> {doc.classification}</span>}
                  {doc.owner && <span className="inline-flex items-center gap-1"><i className="ri-user-line" /> {doc.owner}</span>}
                  {doc.approver && <span className="inline-flex items-center gap-1"><i className="ri-auction-line" /> 审批：{doc.approver}</span>}
                  {doc.approvalAt && <span className="inline-flex items-center gap-1"><i className="ri-calendar-check-line" /> {doc.approvalAt}</span>}
                  {doc.reviewDue && <span className="inline-flex items-center gap-1 text-amber-700"><i className="ri-timer-flash-line" /> 复审：{doc.reviewDue}</span>}
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span>{doc.updatedAt ?? '—'}</span>
                {doc.url ? (
                  <a
                    href={doc.url}
                    target="_blank"
                    className="inline-flex items-center gap-1 rounded border border-gray-200 bg-white px-2 py-1 text-xs text-blue-600 hover:border-blue-300"
                  >
                    <i className="ri-external-link-line" /> 打开
                  </a>
                ) : (
                  <span className="inline-flex items-center gap-1 text-rose-500"><i className="ri-close-circle-line" /> 无链接</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
