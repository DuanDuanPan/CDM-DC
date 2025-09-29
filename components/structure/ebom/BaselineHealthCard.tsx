"use client";

import type { BaselineHealth } from "./cockpitTypes";

export default function BaselineHealthCard({ data }: { data: BaselineHealth | null }) {
  if (!data) return null;
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-800">
        <i className="ri-git-branch-line text-purple-600" /> 版本基线稳定性
      </div>
      <div className="grid gap-3 md:grid-cols-4">
        <div className="rounded-lg border border-gray-100 bg-slate-50/60 p-3">
          <div className="text-xs text-gray-500">近7天变更</div>
          <div className="mt-1 text-xl font-semibold text-gray-900">{data.changes.count}</div>
          <div className="mt-1 text-xs text-gray-500">+
            新{data.changes.byType.added} / 删{data.changes.byType.removed} / 改{data.changes.byType.modified}
          </div>
        </div>
        <div className="rounded-lg border border-gray-100 bg-slate-50/60 p-3">
          <div className="text-xs text-gray-500">审批完成率</div>
          <div className="mt-1 text-xl font-semibold text-gray-900">{Math.round(data.approvals.rate * 100)}%</div>
          <div className="mt-1 text-xs text-gray-500">待办 {data.approvals.pending}</div>
        </div>
        <div className="rounded-lg border border-gray-100 bg-slate-50/60 p-3">
          <div className="text-xs text-gray-500">未闭环事项</div>
          <div className="mt-1 text-xl font-semibold text-gray-900">{data.openItems.count}</div>
        </div>
        <div className="rounded-lg border border-gray-100 bg-slate-50/60 p-3">
          <div className="text-xs text-gray-500">成熟度评分</div>
          <div className="mt-1 text-xl font-semibold text-gray-900">{data.maturityScore}</div>
        </div>
      </div>
    </section>
  );
}

