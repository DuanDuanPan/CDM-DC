'use client';

import type { VerificationRequirementMapping } from './types';

interface TestRequirementMatrixProps {
  items: VerificationRequirementMapping[];
  title?: string;
  description?: string;
  onExport?: () => void;
  onSelectRequirement?: (requirementId: string) => void;
}

const statusChipClass = (status: VerificationRequirementMapping['status']) => {
  switch (status) {
    case 'gap':
      return 'bg-red-50 text-red-600';
    case 'planned':
      return 'bg-amber-50 text-amber-600';
    default:
      return 'bg-emerald-50 text-emerald-600';
  }
};

const statusLabel: Record<VerificationRequirementMapping['status'], string> = {
  gap: '缺口',
  planned: '计划中',
  partial: '部分覆盖'
};

const TestRequirementMatrix = ({
  items,
  title = '需求-试验矩阵',
  description = '追踪需求对应的试验计划与覆盖状态',
  onExport,
  onSelectRequirement
}: TestRequirementMatrixProps) => (
  <section className="rounded-2xl border border-slate-200 bg-white px-5 py-4">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-semibold text-slate-800">{title}</p>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
      <button
        type="button"
        className={`text-xs ${onExport ? 'text-blue-600 hover:text-blue-800' : 'cursor-not-allowed text-slate-300'}`}
        onClick={onExport}
        aria-label="导出需求试验矩阵"
        disabled={!onExport}
      >
        导出矩阵
      </button>
    </div>
    <div className="mt-3 space-y-2">
      {items.length ? (
        items.map(req => (
          <button
            key={req.requirementId}
            type="button"
            onClick={() => onSelectRequirement?.(req.requirementId)}
            className="w-full rounded-lg border border-slate-100 bg-slate-50 px-4 py-3 text-left text-sm transition hover:border-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
          >
            <div className="flex items-center justify-between font-semibold text-slate-900">
              <span>{req.requirementId}</span>
              <span className="text-xs text-slate-500">责任人：{req.owner}</span>
            </div>
            <p className="text-sm text-slate-700">{req.title}</p>
            <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
              <span>已关联试验 {req.linkedTests} 条</span>
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 ${statusChipClass(req.status)}`}>
                {statusLabel[req.status]}
              </span>
            </div>
          </button>
        ))
      ) : (
        <div className="rounded-lg border border-dashed border-slate-200 bg-white px-4 py-3 text-center text-xs text-slate-500">
          尚未关联任何需求与试验，
          <span className="text-blue-600"> 创建试验计划 </span>
          以建立矩阵。
        </div>
      )}
    </div>
  </section>
);

export default TestRequirementMatrix;
