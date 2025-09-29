"use client";

import type { EbomTreeNode } from './types';

export default function EbomDocList({ node }: { node: EbomTreeNode | null }) {
  const docs = node?.links?.docs ?? [];
  if (!node) return null;
  return (
    <div className="rounded-xl border border-gray-100 bg-slate-50/70 p-4">
      <div className="mb-2 flex items-center gap-2 text-xs font-medium text-gray-500">
        <i className="ri-file-list-2-line" /> 设计文档
      </div>
      {docs.length === 0 ? (
        <div className="text-sm text-gray-400">暂无文档</div>
      ) : (
        <ul className="divide-y divide-gray-100">
          {docs.map((d) => (
            <li key={d.id} className="flex items-center justify-between py-2 text-sm">
              <div className="flex items-center gap-2">
                <i className={`ri-$
                  {d.type === 'drawing' ? 'draft-line' : d.type === 'spec' ? 'book-2-line' : d.type === 'calc' ? 'functions' : 'file-text-line'} text-gray-600`}></i>
                <span className="text-gray-800">{d.name}</span>
                {d.version && <span className="rounded bg-white px-1.5 py-0.5 text-xs text-gray-500 border border-gray-200">v{d.version}</span>}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400">{d.updatedAt ?? ''}</span>
                {d.url ? (
                  <a href={d.url} target="_blank" className="rounded border border-gray-200 bg-white px-2 py-1 text-xs text-blue-600 hover:border-blue-300">
                    打开
                  </a>
                ) : (
                  <span className="text-xs text-gray-400">无链接</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

