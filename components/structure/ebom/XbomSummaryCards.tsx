"use client";

import type { XbomSummary } from "./cockpitTypes";
import FreshnessBadge from "./FreshnessBadge";
import JumpButton from "./JumpButton";

export default function XbomSummaryCards({ summary, overrideUpdatedAt, showReq = true, showSim = true, showTest = true }: { summary: XbomSummary | null; overrideUpdatedAt?: string; showReq?: boolean; showSim?: boolean; showTest?: boolean }) {
  if (!summary) return (
    <section className="rounded-2xl border border-dashed border-gray-200 bg-white p-4 text-center text-gray-500">
      <i className="ri-links-line text-2xl" />
      <div className="mt-1">暂无 XBOM 摘要数据</div>
    </section>
  );

  const head = (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm text-gray-700">
        <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-xs text-indigo-700">
          <i className="ri-node-tree" /> XBOM 摘要
        </span>
        <span className="text-xs text-gray-500">来源：{summary.source.system}</span>
      </div>
      <FreshnessBadge updatedAt={overrideUpdatedAt ?? summary.source.updatedAt} freshnessSec={summary.source.freshnessSec} trust={summary.source.trust} />
    </div>
  );

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm space-y-3">
      {head}
      <div className="grid gap-3 md:grid-cols-3">
        {/* 需求卡 */}
        {showReq && (
        <div className="rounded-xl border border-gray-100 bg-slate-50/70 p-3 flex flex-col gap-2">
          <div className="text-xs font-medium text-gray-500 flex items-center gap-1"><i className="ri-file-list-2-line"/>需求</div>
          <div className="text-2xl font-semibold text-gray-900">{Math.round((summary.requirement?.coverage ?? 0)*100)}%</div>
          <ul className="text-sm text-gray-700 space-y-1">
            {(summary.requirement?.items ?? []).slice(0,3).map(it => (
              <li key={it.id} className="flex items-center gap-2">
                <span className={`inline-block h-2 w-2 rounded-full ${it.status==='open'?'bg-amber-500':it.status==='risk'?'bg-rose-500':'bg-emerald-500'}`}></span>
                <span className="truncate" title={it.title}>{it.title}</span>
              </li>
            ))}
          </ul>
          <div className="mt-auto">
            <JumpButton label="查看需求详情" url={summary.links?.detailUrl} />
          </div>
        </div>)}
        {/* 仿真卡 */}
        {showSim && (
        <div className="rounded-xl border border-gray-100 bg-slate-50/70 p-3 flex flex-col gap-2">
          <div className="text-xs font-medium text-gray-500 flex items-center gap-1"><i className="ri-computer-line"/>仿真</div>
          <div className="text-sm text-gray-700">模型：{summary.simulation?.modelVer ?? '—'}</div>
          <div className="text-2xl font-semibold text-gray-900">{summary.simulation?.cases ?? 0}<span className="ml-1 text-sm text-gray-500">算例</span></div>
          <div className="text-xs text-gray-500">最近：{summary.simulation?.lastRunAt ?? '—'}{typeof summary.simulation?.queueLen === 'number' ? ` · 队列：${summary.simulation?.queueLen}` : ''}</div>
          <div className="mt-auto">
            <JumpButton label="查看仿真详情" url={summary.links?.detailUrl} />
          </div>
        </div>)}
        {/* 试验卡 */}
        {showTest && (
        <div className="rounded-xl border border-gray-100 bg-slate-50/70 p-3 flex flex-col gap-2">
          <div className="text-xs font-medium text-gray-500 flex items-center gap-1"><i className="ri-test-tube-line"/>试验</div>
          <div className="text-2xl font-semibold text-gray-900">{summary.test?.done ?? 0}<span className="ml-1 text-sm text-gray-500">/ {summary.test?.plan ?? 0}</span></div>
          <div className="text-xs text-gray-500">阻塞：{summary.test?.blockers ?? 0} · 最近：{summary.test?.last ?? '—'}{Array.isArray(summary.test?.anomalies) ? ` · 异常：${(summary.test!.anomalies!).reduce((s,a)=>s+a.count,0)}` : ''}</div>
          <div className="mt-auto">
            <JumpButton label="查看试验详情" url={summary.links?.detailUrl} />
          </div>
        </div>)}
      </div>
    </section>
  );
}
