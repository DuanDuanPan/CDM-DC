'use client';

import { useEffect, useRef } from 'react';
import type { TbomRunStatus } from '@/components/tbom/types';

export type TbomTypeStat = {
  type: string;
  projects: number;
  tests: number;
  runs: number;
};

const STATUS_LABELS: Record<TbomRunStatus, string> = {
  planned: '计划中',
  executing: '执行中',
  completed: '已完成',
  aborted: '已中止',
};

const STATUS_ACCENTS: Record<TbomRunStatus, { base: string; dot: string; active: string }> = {
  planned: {
    base: 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300',
    dot: 'bg-slate-400',
    active: 'border-slate-600 bg-slate-600 text-white',
  },
  executing: {
    base: 'border-blue-200 bg-blue-50 text-blue-700 hover:border-blue-300',
    dot: 'bg-blue-500',
    active: 'border-blue-600 bg-blue-600 text-white',
  },
  completed: {
    base: 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300',
    dot: 'bg-emerald-500',
    active: 'border-emerald-600 bg-emerald-600 text-white',
  },
  aborted: {
    base: 'border-rose-200 bg-rose-50 text-rose-700 hover:border-rose-300',
    dot: 'bg-rose-500',
    active: 'border-rose-600 bg-rose-600 text-white',
  },
};

interface TbomFilterPanelProps {
  open: boolean;
  anchorRef: React.RefObject<HTMLElement | null>;
  onClose: () => void;
  activeType: string;
  typeStats: TbomTypeStat[];
  statusStats: Record<TbomRunStatus, number>;
  activeStatuses: TbomRunStatus[];
  onSelectType: (type: string) => void;
  onToggleStatus: (status: TbomRunStatus) => void;
  onClear: () => void;
}

export default function TbomFilterPanel({
  open,
  anchorRef,
  onClose,
  activeType,
  typeStats,
  statusStats,
  activeStatuses,
  onSelectType,
  onToggleStatus,
  onClear,
}: TbomFilterPanelProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!panelRef.current) return;
      const anchor = anchorRef.current;
      if (panelRef.current.contains(target)) return;
      if (anchor && anchor.contains(target)) return;
      onClose();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, anchorRef, onClose]);

  if (!open) return null;

  const totalProjects = typeStats.reduce((sum, item) => sum + item.projects, 0);
  const totalRuns = typeStats.reduce((sum, item) => sum + item.runs, 0);
  const totalTests = typeStats.reduce((sum, item) => sum + item.tests, 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-label="试验过滤"
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
      <div className="flex items-center justify-between px-4 pt-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">过滤条件</h3>
          <p className="text-xs text-slate-500">项目 {totalProjects} · 试验 {totalTests} · 运行 {totalRuns}</p>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="text-xs text-blue-600 hover:text-blue-700"
        >
          重置
        </button>
      </div>

      <div className="px-4 pb-4">
        <section className="mt-4 space-y-2">
          <header className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">项目类型</span>
            <span className="text-[11px] text-slate-400">单选</span>
          </header>
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => onSelectType('all')}
              className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-sm transition focus:outline-none focus:ring-2 focus:ring-blue-200 focus:ring-offset-1 ${
                activeType === 'all'
                  ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                  : 'border-slate-200 text-slate-600 hover:border-blue-200 hover:bg-blue-50/60'
              }`}
            >
              <div>
                <p className="font-medium">全部类型</p>
                <p className="text-xs text-slate-400">项目 {totalProjects} · 试验 {totalTests} · 运行 {totalRuns}</p>
              </div>
              {activeType === 'all' && <i className="ri-check-line text-lg" aria-hidden />}
            </button>
            {typeStats.map(({ type, projects, tests, runs }) => {
              const active = activeType === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => onSelectType(active ? 'all' : type)}
                  className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-sm transition focus:outline-none focus:ring-2 focus:ring-blue-200 focus:ring-offset-1 ${
                    active
                      ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                      : 'border-slate-200 text-slate-600 hover:border-blue-200 hover:bg-blue-50/60'
                  }`}
                >
                  <div>
                    <p className="font-medium">{type}</p>
                    <p className="text-xs text-slate-400">项目 {projects} · 试验 {tests} · 运行 {runs}</p>
                  </div>
                  {active && <i className="ri-check-line text-lg" aria-hidden />}
                </button>
              );
            })}
          </div>
        </section>

        <section className="mt-6 space-y-2">
          <header className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">运行状态</span>
            <span className="text-[11px] text-slate-400">多选</span>
          </header>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(STATUS_LABELS) as TbomRunStatus[]).map((status) => {
              const active = activeStatuses.includes(status);
              const accent = STATUS_ACCENTS[status];
              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => onToggleStatus(status)}
                  aria-pressed={active}
                  className={`flex items-center justify-between rounded-xl border px-3 py-2 text-left text-xs font-medium transition focus:outline-none focus:ring-2 focus:ring-blue-200 focus:ring-offset-1 ${
                    active ? accent.active : accent.base
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${active ? 'bg-white/80' : accent.dot}`} aria-hidden />
                    {STATUS_LABELS[status]}
                  </span>
                  <span className="text-[11px] opacity-80">运行 {statusStats[status]}</span>
                </button>
              );
            })}
          </div>
        </section>

        <div className="mt-6 flex items-center justify-end gap-2 text-xs text-slate-500">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-slate-600 hover:bg-slate-50"
          >
            关闭
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}
