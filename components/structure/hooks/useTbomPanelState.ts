import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTbomImportState } from '@/components/tbom/hooks/useTbomImportState';
import type { TbomProject, TbomRun, TbomTest } from '@/components/tbom/types';
import {
  listProjects as listTbomProjects,
  listRuns as listTbomRuns,
  listTests as listTbomTests,
} from '@/services/tbom';
import type { TbomImportSummary } from '@/components/tbom/import/types';
import type { TestItemTbomRef } from '../testing/types';

type TbomDataset = {
  projects: TbomProject[];
  tests: TbomTest[];
  runs: TbomRun[];
};

type LinkedRunEntry = {
  run: TbomRun;
  test: TbomTest;
  project: TbomProject;
};

export type TbomPanelState = {
  linkedRunEntries: LinkedRunEntry[];
  tbomImportState: ReturnType<typeof useTbomImportState>['state'];
  tbomImportActions: ReturnType<typeof useTbomImportState>['actions'];
  latestImportLog: TbomImportSummary | null;
  latestImportStats: { imported: number; updated: number; failed: number } | null;
  runDetailContext: LinkedRunEntry | null;
  runDetailError: string | null;
  isRunDetailLoading: boolean;
  ensureTbomData: () => Promise<TbomDataset>;
  openRunDetail: (ref: TestItemTbomRef) => Promise<void>;
  closeRunDetail: () => void;
  resetRunDetailError: () => void;
};

type UseTbomPanelStateArgs = {
  tbomTargetNode: string | null;
};

export function useTbomPanelState({ tbomTargetNode }: UseTbomPanelStateArgs): TbomPanelState {
  const tbomDataPromiseRef = useRef<Promise<TbomDataset> | null>(null);
  const [tbomData, setTbomData] = useState<TbomDataset | null>(null);
  const [linkedRuns, setLinkedRuns] = useState<TbomRun[]>([]);
  const [runDetailContext, setRunDetailContext] = useState<LinkedRunEntry | null>(null);
  const [runDetailError, setRunDetailError] = useState<string | null>(null);
  const [isRunDetailLoading, setIsRunDetailLoading] = useState(false);

  const ensureTbomData = useCallback(async () => {
    if (tbomData) {
      return tbomData;
    }

    if (!tbomDataPromiseRef.current) {
      tbomDataPromiseRef.current = (async () => {
        try {
          const [projects, tests, runs] = await Promise.all([
            listTbomProjects(),
            listTbomTests(),
            listTbomRuns(),
          ]);
          const data: TbomDataset = { projects, tests, runs };
          setTbomData(data);
          return data;
        } catch (error) {
          tbomDataPromiseRef.current = null;
          throw error;
        }
      })();
    }

    return tbomDataPromiseRef.current!;
  }, [tbomData]);

  const tbomImport = useTbomImportState({
    loadExistingData: ensureTbomData,
    onDataMutated: (data) => {
      setTbomData(data);
      tbomDataPromiseRef.current = Promise.resolve(data);
    },
  });

  const { state: tbomImportState, actions: tbomImportActions } = tbomImport;

  useEffect(() => {
    if (!tbomTargetNode) {
      setLinkedRuns([]);
      return;
    }

    let cancelled = false;
    ensureTbomData()
      .then((data) => {
        if (cancelled) return;
        const runsForNode = data.runs.filter((run) => run.ebom_node_id === tbomTargetNode);
        setLinkedRuns(runsForNode);
      })
      .catch(() => {
        if (cancelled) return;
        setLinkedRuns([]);
      });

    return () => {
      cancelled = true;
    };
  }, [ensureTbomData, tbomTargetNode]);

  const linkedRunEntries = useMemo<LinkedRunEntry[]>(() => {
    if (!tbomTargetNode || !tbomData || !linkedRuns.length) {
      return [];
    }
    const testById = new Map(tbomData.tests.map((test) => [test.test_id, test]));
    const projectById = new Map(tbomData.projects.map((project) => [project.project_id, project]));
    return linkedRuns
      .map((run) => {
        const test = testById.get(run.test_id);
        if (!test) return null;
        const project = projectById.get(test.project_id);
        if (!project) return null;
        return { run, test, project };
      })
      .filter((entry): entry is LinkedRunEntry => Boolean(entry));
  }, [linkedRuns, tbomData, tbomTargetNode]);

  const latestImportLog = useMemo<TbomImportSummary | null>(
    () => tbomImportState.logs[0] ?? null,
    [tbomImportState.logs],
  );

  const latestImportStats = useMemo(() => {
    if (!latestImportLog) {
      return null;
    }
    return Object.values(latestImportLog.counters).reduce(
      (acc, counter) => ({
        imported: acc.imported + counter.imported,
        updated: acc.updated + counter.updated,
        failed: acc.failed + counter.failed,
      }),
      { imported: 0, updated: 0, failed: 0 },
    );
  }, [latestImportLog]);

  const openRunDetail = useCallback(
    async (ref: TestItemTbomRef) => {
      setRunDetailError(null);
      setIsRunDetailLoading(true);

      try {
        const data = await ensureTbomData();
        const project = data.projects.find((item) => item.project_id === ref.projectId);
        const test = data.tests.find((item) => item.test_id === ref.testId);
        const run = data.runs.find((item) => item.run_id === ref.runId);

        if (!project || !test || !run) {
          setRunDetailError('未找到对应的运行数据');
          return;
        }

        setRunDetailContext({ project, test, run });
      } catch (error) {
        console.error('[useTbomPanelState] 加载 TBOM 运行数据失败', error);
        setRunDetailError(error instanceof Error ? error.message : '加载运行详情失败');
      } finally {
        setIsRunDetailLoading(false);
      }
    },
    [ensureTbomData],
  );

  const closeRunDetail = useCallback(() => {
    setRunDetailContext(null);
    setRunDetailError(null);
  }, []);

  const resetRunDetailError = useCallback(() => {
    setRunDetailError(null);
  }, []);

  return {
    linkedRunEntries,
    tbomImportState,
    tbomImportActions,
    latestImportLog,
    latestImportStats,
    runDetailContext,
    runDetailError,
    isRunDetailLoading,
    ensureTbomData,
    openRunDetail,
    closeRunDetail,
    resetRunDetailError,
  };
}
