'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import TbomExplorerClient from '@/components/tbom/TbomExplorerClient';
import { listProjects, listTests, listRuns } from '@/services/tbom';
import type { TbomProject, TbomRun, TbomTest } from '@/components/tbom/types';

type TbomEmbeddedViewProps = {
  navigationPortal?: HTMLElement | null;
  structureSelection?: string;
};

export default function TbomEmbeddedView({ navigationPortal, structureSelection = "001" }: TbomEmbeddedViewProps) {
  const searchParams = useSearchParams();
  const [projects, setProjects] = useState<TbomProject[]>([]);
  const [tests, setTests] = useState<TbomTest[]>([]);
  const [runs, setRuns] = useState<TbomRun[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [projectList, testList, runList] = await Promise.all([
        listProjects(),
        listTests(),
        listRuns(),
      ]);
      setProjects(projectList);
      setTests(testList);
      setRuns(runList);
    } catch (err) {
      const message = err instanceof Error ? err.message : '未知错误';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const initialParams = useMemo(() => {
    const paramsObject: Record<string, string | undefined> = {};
    const from = searchParams.get('from');
    const node = searchParams.get('node');
    const run = searchParams.get('run');
    const path = searchParams.get('path');
    if (from) paramsObject.from = from;
    if (node) paramsObject.node = node;
    if (run) paramsObject.run = run;
    if (path) paramsObject.path = path;
    return paramsObject;
  }, [searchParams]);

  if (isLoading && projects.length === 0 && tests.length === 0 && runs.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center space-y-3 rounded-2xl border border-slate-200 bg-white/90">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-blue-200">
          <i className="ri-loader-4-line animate-spin text-blue-500"></i>
        </span>
        <p className="text-sm text-slate-500">正在加载试验 BOM 数据…</p>
      </div>
    );
  }

  return (
    <TbomExplorerClient
      projects={projects}
      tests={tests}
      runs={runs}
      initialParams={initialParams}
      initialError={error}
      withChrome={false}
      onRetry={loadData}
      navigationPortal={navigationPortal}
      structureSelection={structureSelection}
    />
  );
}
