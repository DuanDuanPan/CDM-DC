'use client';

import type { VerificationStructureCoverage } from './types';

interface TestCoverageHeatmapProps {
  nodes: VerificationStructureCoverage[];
  title?: string;
  description?: string;
  onViewAll?: () => void;
  onSelectNode?: (nodeId: string) => void;
}

const riskColor = (risk: VerificationStructureCoverage['risk']) => {
  switch (risk) {
    case '高':
      return 'bg-red-500';
    case '中':
      return 'bg-amber-500';
    default:
      return 'bg-emerald-500';
  }
};

const TestCoverageHeatmap = ({
  nodes,
  title = '结构热力图',
  description = '按结构节点查看计划覆盖度与缺口',
  onViewAll,
  onSelectNode
}: TestCoverageHeatmapProps) => (
  <section className="rounded-2xl border border-slate-200 bg-gradient-to-br from-indigo-50 to-blue-50 px-5 py-4">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-semibold text-indigo-800">{title}</p>
        <p className="text-xs text-indigo-700">{description}</p>
      </div>
      <button
        type="button"
        onClick={onViewAll}
        disabled={!onViewAll}
        className={`text-xs ${onViewAll ? 'text-indigo-700 hover:text-indigo-900' : 'cursor-not-allowed text-indigo-300'}`}
        aria-label="查看全部结构节点覆盖情况"
      >
        查看全部
      </button>
    </div>
    <div className="mt-3 space-y-3">
      {nodes.length ? (
        nodes.map(node => (
          <button
            key={node.nodeId}
            type="button"
            onClick={() => onSelectNode?.(node.nodeId)}
            className="w-full rounded-xl border border-indigo-100 bg-white/80 px-4 py-3 text-left transition hover:border-indigo-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
            aria-label={`节点 ${node.nodeName} 覆盖 ${Math.round(node.actual * 100)}%`}
          >
            <div className="flex items-center justify-between text-sm font-medium text-slate-900">
              <span>{node.nodeName}</span>
              <span>{Math.round(node.actual * 100)}% / {Math.round(node.target * 100)}%</span>
            </div>
            <div className="mt-1 h-2 rounded-full bg-slate-100">
              <div
                className={`h-2 rounded-full ${riskColor(node.risk)}`}
                style={{ width: `${Math.min(node.actual * 100, 100)}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-slate-500">阻塞 {node.blockers} 项 · 风险 {node.risk}</p>
          </button>
        ))
      ) : (
        <div className="rounded-xl border border-dashed border-indigo-200 bg-white/60 px-4 py-3 text-center text-xs text-indigo-700">
          暂无结构节点覆盖数据，请先挂接试验计划。
        </div>
      )}
    </div>
  </section>
);

export default TestCoverageHeatmap;
