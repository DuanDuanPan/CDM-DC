"use client";

import { useMemo, useState } from 'react';
import type { EbomDocumentLink, EbomTreeNode } from './types';

type DocStatus = NonNullable<EbomDocumentLink['status']>;

type StatusToken = {
  label: string;
  icon: string;
  className: string;
  description?: string;
};

const STATUS_ORDER: DocStatus[] = ['approved', 'in-review', 'pending', 'missing'];

const fallbackToken: StatusToken = {
  label: '未分类',
  icon: 'ri-information-line',
  className: 'bg-slate-100 text-slate-600',
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

interface Props {
  node: EbomTreeNode | null;
  statusTokens: Record<string, StatusToken>;
}

export default function EbomDocList({ node, statusTokens }: Props) {
  const docsWithStatus = useMemo(() => {
    const list = node?.links?.docs ?? [];
    return list.map((doc) => ({ ...doc, status: (doc.status ?? 'pending') as DocStatus }));
  }, [node]);

  const [activeStatus, setActiveStatus] = useState<'all' | DocStatus>('all');
  const [classificationFilter, setClassificationFilter] = useState<'all' | EbomDocumentLink['classification'] | '__none__'>('all');
  const [selectedDoc, setSelectedDoc] = useState<(EbomDocumentLink & { status: DocStatus }) | null>(null);

  const statusSummary = useMemo(() => {
    const counts = new Map<DocStatus, number>();
    docsWithStatus.forEach((doc) => {
      counts.set(doc.status, (counts.get(doc.status) ?? 0) + 1);
    });
    return STATUS_ORDER.map((status) => ({
      status,
      count: counts.get(status) ?? 0,
      token: statusTokens[status] ?? fallbackToken,
    }));
  }, [docsWithStatus, statusTokens]);

  const classificationOptions = useMemo(() => {
    const set = new Set<EbomDocumentLink['classification']>();
    let includeNone = false;
    docsWithStatus.forEach((doc) => {
      if (doc.classification) {
        set.add(doc.classification);
      } else {
        includeNone = true;
      }
    });
    return { list: Array.from(set), includeNone };
  }, [docsWithStatus]);

  const reminderDocs = useMemo(
    () => docsWithStatus.filter((doc) => doc.status === 'pending' || doc.status === 'missing' || !doc.url),
    [docsWithStatus]
  );

  const filteredDocs = useMemo(
    () =>
      docsWithStatus.filter((doc) => {
        const matchStatus = activeStatus === 'all' || doc.status === activeStatus;
        const matchClassification =
          classificationFilter === 'all'
            || (classificationFilter === '__none__' ? !doc.classification : doc.classification === classificationFilter);
        return matchStatus && matchClassification;
      }),
    [docsWithStatus, activeStatus, classificationFilter]
  );

  const sortedDocs = useMemo(() => {
    return filteredDocs
      .slice()
      .sort((a, b) => {
        const indexA = STATUS_ORDER.indexOf(a.status);
        const indexB = STATUS_ORDER.indexOf(b.status);
        if (indexA !== indexB) return indexA - indexB;
        const timeA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const timeB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return timeB - timeA;
      });
  }, [filteredDocs]);

  const totalDocs = docsWithStatus.length;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-600">
        <div className="inline-flex items-center gap-2 text-sm font-semibold text-gray-900">
          <i className="ri-file-list-2-line" /> 设计文档
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">共 {totalDocs} 个</span>
        </div>
        {reminderDocs.length > 0 && (
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded border border-rose-200 bg-rose-50 px-2 py-1 text-xs text-rose-700 hover:border-rose-300"
            onClick={() => {
              if (typeof window !== 'undefined') {
                console.info('发起文档补录提醒', reminderDocs.map((doc) => doc.id));
              }
            }}
          >
            <i className="ri-notification-badge-line" /> 待补齐 {reminderDocs.length}
          </button>
        )}
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <button
          type="button"
          onClick={() => setActiveStatus('all')}
          className={`rounded-xl border px-3 py-2 text-left text-xs transition focus:outline-none focus:ring-2 focus:ring-indigo-200 ${
            activeStatus === 'all'
              ? 'border-indigo-200 bg-indigo-50 text-indigo-700 shadow-sm'
              : 'border-gray-200 bg-white text-gray-600 hover:border-indigo-200 hover:text-indigo-600'
          }`}
          aria-pressed={activeStatus === 'all'}
        >
          <div className="flex items-center justify-between text-sm font-semibold">
            <span className="inline-flex items-center gap-1"><i className="ri-stack-line" /> 全部</span>
            <span>{totalDocs}</span>
          </div>
          <p className="mt-1 text-[11px] text-gray-500">显示所有文档信息</p>
        </button>
        {statusSummary.map(({ status, count, token }) => (
          <button
            key={status}
            type="button"
            onClick={() => setActiveStatus(status)}
            className={`rounded-xl border px-3 py-2 text-left text-xs transition focus:outline-none focus:ring-2 focus:ring-indigo-200 ${
              activeStatus === status
                ? 'border-indigo-200 bg-indigo-50 text-indigo-700 shadow-sm'
                : 'border-gray-200 bg-white text-gray-600 hover:border-indigo-200 hover:text-indigo-600'
            }`}
            aria-pressed={activeStatus === status}
          >
            <div className="flex items-center justify-between text-sm font-semibold">
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] ${token.className}`}>
                <i className={token.icon}></i> {token.label}
              </span>
              <span>{count}</span>
            </div>
            {token.description && <p className="mt-1 text-[11px] text-gray-500">{token.description}</p>}
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-gray-500">
        <label htmlFor="doc-classification" className="font-medium text-gray-600">
          密级
        </label>
        <select
          id="doc-classification"
          value={classificationFilter}
          onChange={(event) => setClassificationFilter(event.target.value as typeof classificationFilter)}
          className="rounded border border-gray-300 bg-white px-2 py-1 text-xs"
        >
          <option value="all">全部</option>
          {classificationOptions.list.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
          {classificationOptions.includeNone && <option value="__none__">未标记</option>}
        </select>
        <span className="ml-auto text-gray-400">
          {filteredDocs.length}/{totalDocs} 已筛选
        </span>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        {sortedDocs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 px-4 py-10 text-center text-sm text-gray-500">
            当前筛选条件下暂无文档
          </div>
        ) : (
          sortedDocs.map((doc) => {
            const token = statusTokens[doc.status] ?? fallbackToken;
            return (
              <button
                key={doc.id}
                type="button"
                onClick={() => setSelectedDoc(doc)}
                className="flex h-full flex-col rounded-xl border border-gray-200 bg-white px-4 py-3 text-left text-sm text-gray-700 transition hover:border-indigo-200 hover:shadow focus:outline-none focus:ring-2 focus:ring-indigo-200"
                aria-haspopup="dialog"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                    <i className={`${docIcon(doc.type)} text-gray-500`}></i>
                    <span className="line-clamp-1">{doc.name}</span>
                  </div>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] ${token.className}`}>
                    <i className={token.icon}></i> {token.label}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
                  {doc.version && <span className="inline-flex items-center gap-1"><i className="ri-hashtag"></i> v{doc.version}</span>}
                  {doc.updatedAt && <span className="inline-flex items-center gap-1"><i className="ri-time-line"></i> {doc.updatedAt}</span>}
                  {doc.owner && <span className="inline-flex items-center gap-1"><i className="ri-user-line"></i> {doc.owner}</span>}
                  {doc.classification && <span className="inline-flex items-center gap-1"><i className="ri-shield-keyhole-line"></i> {doc.classification}</span>}
                </div>
                {doc.reviewDue && (
                  <div className="mt-2 inline-flex items-center gap-1 text-[11px] text-amber-700">
                    <i className="ri-timer-flash-line"></i> 待复审 {doc.reviewDue}
                  </div>
                )}
              </button>
            );
          })
        )}
      </div>

      {selectedDoc && (
        <div className="fixed inset-0 z-30 flex items-end justify-center bg-slate-900/30 backdrop-blur-sm sm:items-center sm:px-6">
          <button
            type="button"
            aria-label="关闭文档详情"
            className="absolute inset-0"
            onClick={() => setSelectedDoc(null)}
          />
          <div
            className="relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl sm:max-w-2xl sm:rounded-3xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="doc-detail-title"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div id="doc-detail-title" className="flex items-center gap-2 text-base font-semibold text-gray-900">
                  <i className={`${docIcon(selectedDoc.type)} text-indigo-500`}></i>
                  {selectedDoc.name}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
                  {selectedDoc.version && <span className="inline-flex items-center gap-1"><i className="ri-hashtag"></i> v{selectedDoc.version}</span>}
                  {selectedDoc.updatedAt && <span className="inline-flex items-center gap-1"><i className="ri-time-line"></i> 更新时间 {selectedDoc.updatedAt}</span>}
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] ${(statusTokens[selectedDoc.status] ?? fallbackToken).className}`}>
                    <i className={(statusTokens[selectedDoc.status] ?? fallbackToken).icon}></i> {(statusTokens[selectedDoc.status] ?? fallbackToken).label}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDoc(null)}
                className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2 py-1 text-xs text-gray-500 hover:border-gray-300"
              >
                <i className="ri-close-line"></i> 关闭
              </button>
            </div>

            <div className="mt-4 space-y-2 text-sm text-gray-700">
              {selectedDoc.owner && (
                <div className="flex items-center gap-2">
                  <i className="ri-user-line text-indigo-500"></i>
                  <span className="font-medium text-gray-800">责任人</span>
                  <span>{selectedDoc.owner}</span>
                </div>
              )}
              {selectedDoc.approver && (
                <div className="flex items-center gap-2">
                  <i className="ri-auction-line text-indigo-500"></i>
                  <span className="font-medium text-gray-800">审批</span>
                  <span>{selectedDoc.approver}</span>
                </div>
              )}
              {selectedDoc.approvalAt && (
                <div className="flex items-center gap-2">
                  <i className="ri-calendar-check-line text-indigo-500"></i>
                  <span className="font-medium text-gray-800">批准时间</span>
                  <span>{selectedDoc.approvalAt}</span>
                </div>
              )}
              {selectedDoc.reviewDue && (
                <div className="flex items-center gap-2 text-amber-700">
                  <i className="ri-timer-flash-line"></i>
                  <span className="font-medium">复审截止</span>
                  <span>{selectedDoc.reviewDue}</span>
                </div>
              )}
              {selectedDoc.classification && (
                <div className="flex items-center gap-2">
                  <i className="ri-shield-keyhole-line text-indigo-500"></i>
                  <span className="font-medium text-gray-800">密级</span>
                  <span>{selectedDoc.classification}</span>
                </div>
              )}
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-gray-500">
              {selectedDoc.url ? (
                <a
                  href={selectedDoc.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-indigo-700 hover:border-indigo-300"
                >
                  <i className="ri-external-link-line"></i> 打开文档
                </a>
              ) : (
                <span className="inline-flex items-center gap-1 rounded border border-rose-200 bg-rose-50 px-3 py-1.5 text-rose-700">
                  <i className="ri-close-circle-line"></i> 暂无链接
                </span>
              )}
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    console.info('提醒单条文档', selectedDoc.id);
                  }
                }}
                className="inline-flex items-center gap-1 rounded border border-gray-200 bg-white px-3 py-1.5 text-gray-600 hover:border-indigo-200 hover:text-indigo-600"
              >
                <i className="ri-notification-badge-line"></i> 提醒责任人
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
