'use client';

import { useEffect, useMemo, useState } from 'react';
import type { TbomProject, TbomRun, TbomTest } from '@/components/tbom/types';
import { listProjects as listTbomProjects, listRuns as listTbomRuns, listTests as listTbomTests } from '@/services/tbom';

type RunPickerDialogProps = {
  open: boolean;
  onClose: () => void;
  onSelect: (run: { run: TbomRun; test: TbomTest; project: TbomProject }) => void;
};

export default function RunPickerDialog({ open, onClose, onSelect }: RunPickerDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<TbomProject[]>([]);
  const [tests, setTests] = useState<TbomTest[]>([]);
  const [runs, setRuns] = useState<TbomRun[]>([]);

  useEffect(() => {
    if (!open) return;
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [projectList, testList, runList] = await Promise.all([
          listTbomProjects(),
          listTbomTests(),
          listTbomRuns(),
        ]);
        if (!mounted) return;
        setProjects(projectList);
        setTests(testList);
        setRuns(runList);
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : '加载失败');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [open]);

  const runsWithMeta = useMemo(() => {
    if (!runs.length) return [];
    const testMap = new Map(tests.map((item) => [item.test_id, item]));
    const projectMap = new Map(projects.map((item) => [item.project_id, item]));
    return runs
      .map((run) => {
        const test = testMap.get(run.test_id);
        if (!test) return null;
        const project = projectMap.get(test.project_id);
        if (!project) return null;
        return { run, test, project };
      })
      .filter((value): value is { run: TbomRun; test: TbomTest; project: TbomProject } => Boolean(value));
  }, [projects, runs, tests]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/60 px-4">
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900">选择试验运行</h3>
            <p className="text-xs text-slate-500">从 TBOM 运行库加载曲线数据进入 Compare 模块</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200"
          >
            <i className="ri-close-line" />
          </button>
        </header>

        <div className="max-h-[420px] overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex h-40 items-center justify-center text-sm text-slate-500">
              <i className="ri-loader-2-line animate-spin text-base" />
              <span className="ml-2">正在加载运行数据…</span>
            </div>
          ) : error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
              加载失败：{error}
            </div>
          ) : (
            <ul className="space-y-3">
              {runsWithMeta.map(({ run, test, project }) => (
                <li
                  key={run.run_id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="text-sm font-semibold text-slate-800">
                        运行 {run.run_id} · 试验 {test.name}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-slate-500">
                        <span>项目：{project.title}</span>
                        <span>状态：{run.status}</span>
                        {run.executed_at ? <span>执行：{new Date(run.executed_at).toLocaleString()}</span> : null}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onSelect({ run, test, project });
                        onClose();
                      }}
                      className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                    >
                      <i className="ri-checkbox-circle-line" />
                      选择
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
