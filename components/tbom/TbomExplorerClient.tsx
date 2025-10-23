'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import {
  TbomProject,
  TbomRun,
  TbomRunStatus,
  TbomTest,
} from '@/components/tbom/types';
import TbomTree from '@/components/tbom/structure/TbomTree';
import TbomNodeDetail from '@/components/tbom/detail/TbomNodeDetail';
import TbomRelationPanel from '@/components/tbom/detail/TbomRelationPanel';
import type { TbomFilterSnapshot, TbomNavigationPersistedContext } from '@/components/tbom/relations/types';
import TbomFilterPanel, { TbomTypeStat } from '@/components/tbom/filter/TbomFilterPanel';

type Selection =
  | { level: 'project'; project: TbomProject }
  | { level: 'test'; project: TbomProject; test: TbomTest }
  | { level: 'run'; project: TbomProject; test: TbomTest; run: TbomRun };

export type TbomSelection = Selection;

type TreeProject = {
  project: TbomProject;
  tests: Array<{
    test: TbomTest;
    runs: TbomRun[];
    allRunsCount: number;
  }>;
  allRunsCount: number;
};

type TreeGroup = {
  type: string;
  projects: TreeProject[];
};

type TbomExplorerClientProps = {
  projects: TbomProject[];
  tests: TbomTest[];
  runs: TbomRun[];
  initialParams: {
    from?: string | string[] | undefined;
    node?: string | string[] | undefined;
    run?: string | string[] | undefined;
    path?: string | string[] | undefined;
    domain?: string | string[] | undefined;
    requirementId?: string | string[] | undefined;
    simulationRef?: string | string[] | undefined;
    assetSn?: string | string[] | undefined;
    projectId?: string | string[] | undefined;
    testId?: string | string[] | undefined;
    restore?: string | string[] | undefined;
  };
  initialError?: string | null;
  withChrome?: boolean;
  onRetry?: () => void | Promise<void>;
  navigationPortal?: HTMLElement | null;
  structureSelection?: string;
};

const STATUS_LABELS: Record<TbomRunStatus, string> = {
  planned: '计划中',
  executing: '执行中',
  completed: '已完成',
  aborted: '已中止',
};

type ProductStructureNode = {
  id: string;
  label: string;
  description?: string;
  typeFilter: string;
  children?: ProductStructureNode[];
};

const PRODUCT_STRUCTURE: ProductStructureNode[] = [
  {
    id: '001',
    label: '航空发动机总成',
    description: '顶层结构 · 汇总全部试验',
    typeFilter: 'all',
    children: [
      {
        id: '001-01',
        label: '推进系统',
        description: '压气机、燃烧室、涡轮等关键分系统',
        typeFilter: '结构振动',
        children: [
          { id: '001-01-01', label: '压气机分系统', typeFilter: '结构振动' },
          { id: '001-01-02', label: '燃烧室分系统', typeFilter: '热结构耦合' },
          { id: '001-01-03', label: '涡轮分系统', typeFilter: '结构振动' },
        ],
      },
      {
        id: '001-02',
        label: '控制系统',
        description: '燃油控制、电子控制等子系统',
        typeFilter: 'all',
        children: [
          { id: '001-02-01', label: '燃油控制分系统', typeFilter: 'all' },
          { id: '001-02-02', label: '电子控制分系统', typeFilter: 'all' },
        ],
      },
      {
        id: '001-03',
        label: '结构件系统',
        description: '机匣结构、附件等组成',
        typeFilter: '结构振动',
        children: [
          { id: '001-03-01', label: '机匣结构', typeFilter: '结构振动' },
          { id: '001-03-02', label: '机匣附件', typeFilter: '结构振动' },
        ],
      },
    ],
  },
];

const PRODUCT_STRUCTURE_TYPE_MAP: Record<string, string> = PRODUCT_STRUCTURE.reduce((map, node) => {
  const stack: ProductStructureNode[] = [node];
  while (stack.length) {
    const current = stack.pop()!;
    map[current.id] = current.typeFilter;
    current.children?.forEach((child) => stack.push(child));
  }
  return map;
}, {} as Record<string, string>);

function toSingle(value?: string | string[]): string | undefined {
  if (!value) return undefined;
  return Array.isArray(value) ? value[0] : value;
}

export default function TbomExplorerClient({
  projects,
  tests,
  runs,
  initialParams,
  initialError = null,
  withChrome = true,
  onRetry,
  navigationPortal,
  structureSelection,
}: TbomExplorerClientProps) {
  const router = useRouter();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const announcementRef = useRef<HTMLDivElement>(null);
  const closeDrawerButtonRef = useRef<HTMLButtonElement>(null);
  const filterButtonRef = useRef<HTMLButtonElement | null>(null);
  const hasRestoredRef = useRef(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<TbomRunStatus[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [selection, setSelection] = useState<Selection | null>(null);
  const [loadError, setLoadError] = useState<string | null>(initialError);
  const [isRelationPanelOpen, setRelationPanelOpen] = useState(false);
  const [manualRefreshing, setManualRefreshing] = useState(false);
  const [isRefreshing, startTransition] = useTransition();
  const [isFilterPanelOpen, setFilterPanelOpen] = useState(false);
  const [structureSelectionState, setStructureSelectionState] = useState<string>(structureSelection ?? '001');

  const filterSnapshot = useMemo<TbomFilterSnapshot>(() => ({
    searchTerm,
    typeFilter,
    statusFilter,
    structureSelection: structureSelectionState,
    expandedTreeIds: Array.from(expanded),
  }), [searchTerm, typeFilter, statusFilter, structureSelectionState, expanded]);

  const shouldRestoreContext = useMemo(() => {
    const restoreFlag = toSingle(initialParams.restore);
    const fromValue = toSingle(initialParams.from);
    return restoreFlag === '1' || fromValue === 'structure' || fromValue === 'dashboard';
  }, [initialParams.from, initialParams.restore]);

  const projectsById = useMemo(() => {
    const map = new Map<string, TbomProject>();
    projects.forEach((project) => {
      map.set(project.project_id, project);
    });
    return map;
  }, [projects]);

  const testsByProjectId = useMemo(() => {
    const grouped = new Map<string, TbomTest[]>();
    tests.forEach((test) => {
      const list = grouped.get(test.project_id) ?? [];
      list.push(test);
      grouped.set(test.project_id, list);
    });
    return grouped;
  }, [tests]);

  const runsByTestId = useMemo(() => {
    const grouped = new Map<string, TbomRun[]>();
    runs.forEach((run) => {
      const list = grouped.get(run.test_id) ?? [];
      list.push(run);
      grouped.set(run.test_id, list);
    });
    return grouped;
  }, [runs]);

  const typeStats = useMemo<TbomTypeStat[]>(() => {
    const summary = new Map<string, TbomTypeStat>();
    projects.forEach((project) => {
      const entry = summary.get(project.type) ?? {
        type: project.type,
        projects: 0,
        tests: 0,
        runs: 0,
      };
      entry.projects += 1;
      const projectTests = testsByProjectId.get(project.project_id) ?? [];
      entry.tests += projectTests.length;
      projectTests.forEach((test) => {
        entry.runs += runsByTestId.get(test.test_id)?.length ?? 0;
      });
      summary.set(project.type, entry);
    });
    return Array.from(summary.values());
  }, [projects, testsByProjectId, runsByTestId]);

  const statusStats = useMemo(() => {
    const initial: Record<TbomRunStatus, number> = {
      planned: 0,
      executing: 0,
      completed: 0,
      aborted: 0,
    };
    runs.forEach((run) => {
      initial[run.status] += 1;
    });
    return initial;
  }, [runs]);

  useEffect(() => {
    if (toSingle(initialParams.from) === 'ebom' && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [initialParams.from]);

  useEffect(() => {
    if (!shouldRestoreContext) return;
    if (hasRestoredRef.current) return;
    if (typeof window === 'undefined') return;

    let parsedContext: TbomNavigationPersistedContext | null = null;
    try {
      const raw = window.localStorage.getItem('tbom.context');
      if (raw) {
        parsedContext = JSON.parse(raw) as TbomNavigationPersistedContext;
      }
    } catch (error) {
      console.warn('[TBOM] 无法解析保存的上下文', error);
    }
    if (!parsedContext) return;

    hasRestoredRef.current = true;

    const { filters: storedFilters, selection: storedSelection, anchor } = parsedContext;

    if (storedFilters) {
      setSearchTerm(storedFilters.searchTerm ?? '');
      setTypeFilter(storedFilters.typeFilter ?? 'all');
      setStatusFilter(storedFilters.statusFilter ?? []);
      if (storedFilters.structureSelection) {
        setStructureSelectionState(storedFilters.structureSelection);
      }
      if (storedFilters.expandedTreeIds) {
        setExpanded(new Set(storedFilters.expandedTreeIds));
      }
    }

    if (anchor?.ebomNodeId) {
      setStructureSelectionState(anchor.ebomNodeId);
    }

    let restoredSelection: Selection | null = null;
    if (storedSelection) {
      const project = projects.find((item) => item.project_id === storedSelection.projectId);
      if (!project) {
        return;
      }
      if (storedSelection.level === 'project') {
        restoredSelection = { level: 'project', project };
      } else if (storedSelection.level === 'test' && storedSelection.testId) {
        const test = tests.find((item) => item.test_id === storedSelection.testId);
        if (test) {
          restoredSelection = { level: 'test', project, test };
        }
      } else if (storedSelection.level === 'run' && storedSelection.testId && storedSelection.runId) {
        const test = tests.find((item) => item.test_id === storedSelection.testId);
        const run = runs.find((item) => item.run_id === storedSelection.runId);
        if (test && run) {
          restoredSelection = { level: 'run', project, test, run };
        }
      }
    }

    if (restoredSelection) {
      setSelection(restoredSelection);
    }
  }, [projects, runs, tests, shouldRestoreContext]);

  useEffect(() => {
    setLoadError(initialError ?? null);
  }, [initialError]);

  useEffect(() => {
    if (!isRelationPanelOpen) return;
    if (closeDrawerButtonRef.current) {
      closeDrawerButtonRef.current.focus();
    }
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setRelationPanelOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [isRelationPanelOpen]);

  useEffect(() => {
    if (!loadError) return;
    console.warn('[TBOM] 数据加载失败：', loadError);
  }, [loadError]);

  useEffect(() => {
    if (selection) return;

    const initialRunId = toSingle(initialParams.run);
    if (initialRunId) {
      const run = runs.find((item) => item.run_id === initialRunId);
      if (run) {
        const test = tests.find((item) => item.test_id === run.test_id);
        const project = test ? projectsById.get(test.project_id) : undefined;
        if (project && test) {
          setSelection({ level: 'run', project, test, run });
          setExpanded(
            new Set([
              `type:${project.type}`,
              `project:${project.project_id}`,
              `test:${test.test_id}`,
            ]),
          );
          return;
        }
      }
    }

    const initialNode = toSingle(initialParams.node);
    if (initialNode) {
      const matchedRun = runs.find((item) => item.ebom_node_id === initialNode);
      if (matchedRun) {
        const test = tests.find((item) => item.test_id === matchedRun.test_id);
        const project = test ? projectsById.get(test.project_id) : undefined;
        if (project && test) {
          setSelection({ level: 'run', project, test, run: matchedRun });
          setExpanded(
            new Set([
              `type:${project.type}`,
              `project:${project.project_id}`,
              `test:${test.test_id}`,
            ]),
          );
          return;
        }
      }

      const matchedTest = tests.find((item) => item.ebom_node_id === initialNode);
      if (matchedTest) {
        const project = projectsById.get(matchedTest.project_id);
        if (project) {
          setSelection({ level: 'test', project, test: matchedTest });
          setExpanded(
            new Set([
              `type:${project.type}`,
              `project:${project.project_id}`,
              `test:${matchedTest.test_id}`,
            ]),
          );
          return;
        }
      }

      const project = projects.find((item) =>
        item.relations?.some?.((relation) => relation.kind === 'ebom' && relation.ref_id === initialNode),
      );
      if (project) {
        setSelection({ level: 'project', project });
        setExpanded(new Set([`type:${project.type}`, `project:${project.project_id}`]));
        return;
      }
    }

    if (!projects.length) return;
    const firstProject = projects[0];
    const projectTests = testsByProjectId.get(firstProject.project_id) ?? [];
    if (projectTests.length > 0) {
      const firstTest = projectTests[0];
      const testRuns = runsByTestId.get(firstTest.test_id) ?? [];
      if (testRuns.length > 0) {
        setSelection({ level: 'run', project: firstProject, test: firstTest, run: testRuns[0] });
        setExpanded(
          new Set([
            `type:${firstProject.type}`,
            `project:${firstProject.project_id}`,
            `test:${firstTest.test_id}`,
          ]),
        );
        return;
      }
      setSelection({ level: 'test', project: firstProject, test: firstTest });
      setExpanded(
        new Set([
          `type:${firstProject.type}`,
          `project:${firstProject.project_id}`,
          `test:${firstTest.test_id}`,
        ]),
      );
      return;
    }

    setSelection({ level: 'project', project: firstProject });
    setExpanded(new Set([`type:${firstProject.type}`, `project:${firstProject.project_id}`]));
  }, [
    selection,
    initialParams.run,
    initialParams.node,
    runs,
    tests,
    projects,
    projectsById,
    testsByProjectId,
    runsByTestId,
  ]);

  const searchTermLower = searchTerm.trim().toLowerCase();
  const statusSet = useMemo(() => new Set(statusFilter), [statusFilter]);

  const treeData: TreeGroup[] = useMemo(() => {
    const matchesText = (text?: string | string[]) => {
      if (searchTermLower.length === 0) return true;
      if (!text) return false;
      const value = Array.isArray(text) ? text.join(',') : text;
      return value.toLowerCase().includes(searchTermLower);
    };

    const groupedByType = new Map<string, TreeProject[]>();

    projects.forEach((project) => {
      if (typeFilter !== 'all' && project.type !== typeFilter) {
        return;
      }

      const projectTests = testsByProjectId.get(project.project_id) ?? [];
      const projectMatchesSearch =
        matchesText(project.title) ||
        matchesText(project.objectives) ||
        matchesText(project.baseline_id);

      const testsForTree = projectTests
        .map((test) => {
          const allRuns = runsByTestId.get(test.test_id) ?? [];
          const runsAfterStatus = statusFilter.length > 0
            ? allRuns.filter((run) => statusSet.has(run.status))
            : allRuns;

          const runMatchesSearch = (run: TbomRun) =>
            matchesText(run.run_id) ||
            matchesText(run.operator ?? '') ||
            matchesText(run.status) ||
            matchesText(run.ebom_node_id ?? '');

          const runsMatchingSearch =
            searchTermLower.length > 0 ? runsAfterStatus.filter(runMatchesSearch) : runsAfterStatus;

          const testMatchesSearch =
            matchesText(test.name) || matchesText(test.purpose) || matchesText(test.spec_refs.join(','));

          const runsToDisplay =
            searchTermLower.length === 0 || testMatchesSearch || projectMatchesSearch
              ? runsAfterStatus
              : runsMatchingSearch;

          const shouldInclude =
            runsToDisplay.length > 0 ||
            searchTermLower.length === 0 ||
            testMatchesSearch ||
            projectMatchesSearch;

          if (!shouldInclude) {
            return null;
          }

          return {
            test,
            runs: runsToDisplay,
            allRunsCount: runsAfterStatus.length,
          };
        })
        .filter((item): item is NonNullable<typeof item> => Boolean(item));

      if (testsForTree.length === 0 && !projectMatchesSearch && searchTermLower.length > 0) {
        return;
      }

      const runCount = testsForTree.reduce((sum, item) => sum + item.allRunsCount, 0);

      const projectEntry: TreeProject = {
        project,
        tests: testsForTree,
        allRunsCount: runCount,
      };

      const typeProjects = groupedByType.get(project.type) ?? [];
      typeProjects.push(projectEntry);
      groupedByType.set(project.type, typeProjects);
    });

    return Array.from(groupedByType.entries()).map(([type, entries]) => ({ type, projects: entries }));
  }, [projects, testsByProjectId, runsByTestId, typeFilter, searchTermLower, statusFilter, statusSet]);

  const totalVisibleRuns = useMemo(
    () =>
      treeData.reduce(
        (sum, group) =>
          sum +
          group.projects.reduce(
            (acc, project) => acc + project.tests.reduce((inner, test) => inner + test.runs.length, 0),
            0,
          ),
        0,
      ),
    [treeData],
  );

  useEffect(() => {
    if (!announcementRef.current) return;
    if (loadError) {
      announcementRef.current.textContent = `TBOM 数据加载失败，${loadError}`;
    } else {
      announcementRef.current.textContent = `筛选结果：共匹配 ${totalVisibleRuns} 条运行记录`;
    }
  }, [totalVisibleRuns, statusFilter, typeFilter, searchTermLower, loadError]);

  const toggleExpanded = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleStatusToggle = (status: TbomRunStatus) => {
    setStatusFilter((prev) => {
      if (prev.includes(status)) {
        return prev.filter((item) => item !== status);
      }
      return [...prev, status];
    });
  };

  useEffect(() => {
    if (typeof structureSelection === 'string') {
      setStructureSelectionState(structureSelection);
      const mappedType = PRODUCT_STRUCTURE_TYPE_MAP[structureSelection] ?? 'all';
      setTypeFilter(mappedType);
    }
  }, [structureSelection]);

  const handleStructureSelection = useCallback(
    (nodeId: string) => {
      setStructureSelectionState(nodeId);
      const mappedType = PRODUCT_STRUCTURE_TYPE_MAP[nodeId] ?? 'all';
      setTypeFilter(mappedType);
      setFilterPanelOpen(false);
    },
    [],
  );

  const renderStructureTree = useCallback(
    (nodes: ProductStructureNode[], depth = 0): ReactNode =>
      nodes.map((node) => {
        const isActive = structureSelectionState === node.id;
        const baseClass =
          depth >= 2
            ? 'w-full rounded border border-dashed px-3 py-1.5 text-left transition'
            : 'w-full rounded-lg border px-3 py-2 text-left transition';
        const activeClass = depth >= 2 ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm';
        const inactiveClass = depth >= 2
          ? 'border-slate-300 text-slate-600 hover:border-blue-300 hover:bg-blue-50/60'
          : 'border-slate-200 text-slate-600 hover:border-blue-300 hover:bg-blue-50/60';
        return (
          <div key={node.id} className="space-y-1">
            <button
              type="button"
              onClick={() => handleStructureSelection(node.id)}
              className={`${baseClass} ${isActive ? activeClass : inactiveClass}`}
              style={{ marginLeft: depth * 12 }}
            >
              <span className="flex items-center justify-between">
                <span className="font-medium">{node.label}</span>
                {isActive && <i className="ri-check-line text-base" aria-hidden />}
              </span>
              {node.description && <span className="mt-1 block text-xs text-slate-500">{node.description}</span>}
            </button>
            {node.children && node.children.length > 0 && (
              <div className="space-y-1">{renderStructureTree(node.children, depth + 1)}</div>
            )}
          </div>
        );
      }),
    [handleStructureSelection, structureSelectionState],
  );

  const activeSelection: Selection | null = useMemo(() => {
    if (!selection) return null;
    if (selection.level === 'run') {
      const runStillVisible = treeData
        .flatMap((group) => group.projects)
        .flatMap((item) => item.tests)
        .some((test) => test.runs.some((run) => run.run_id === selection.run.run_id));
      if (!runStillVisible) {
        return {
          level: 'test',
          project: selection.project,
          test: selection.test,
        };
      }
    }
    return selection;
  }, [selection, treeData]);

  const handleRetry = () => {
    if (!loadError) return;
    console.warn('[TBOM] 用户触发重新加载 TBOM 数据');
    setLoadError(null);
    startTransition(() => {
      setRelationPanelOpen(false);
      if (onRetry) {
        setManualRefreshing(true);
        Promise.resolve(onRetry())
          .catch((error) => {
            console.error('[TBOM] 重新加载失败', error);
            setLoadError(error instanceof Error ? error.message : '未知错误');
          })
          .finally(() => {
            setManualRefreshing(false);
          });
      } else {
        router.refresh();
      }
    });
  };

  const isPending = isRefreshing || manualRefreshing;
  const selectedStatusLabels = statusFilter.map((status) => STATUS_LABELS[status]);
  const hasFiltersApplied =
    typeFilter !== 'all' || selectedStatusLabels.length > 0 || searchTerm.trim().length > 0;

  const navigationPanel = (
    <section className="flex flex-col rounded-2xl border border-slate-200/60 bg-white/90 shadow-sm">
      <div className="space-y-5 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1.5">
            <h2 className="text-lg font-semibold text-slate-900">试验结构导航</h2>
            <p className="text-xs leading-relaxed text-slate-500">
              快速定位试验项目、试验与运行状态，支持多条件组合过滤。
            </p>
          </div>
          <div className="relative shrink-0">
            <button
              ref={filterButtonRef}
              type="button"
              onClick={() => setFilterPanelOpen((open) => !open)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-600 shadow-sm transition hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:ring-offset-1"
              aria-haspopup="dialog"
              aria-expanded={isFilterPanelOpen}
            >
              <i className="ri-filter-3-line text-sm" aria-hidden />
              过滤条件
            </button>
            <TbomFilterPanel
              open={isFilterPanelOpen}
              anchorRef={filterButtonRef}
              onClose={() => setFilterPanelOpen(false)}
              activeType={typeFilter}
              typeStats={typeStats}
              statusStats={statusStats}
              activeStatuses={statusFilter}
              onSelectType={(nextType) => setTypeFilter(nextType)}
              onToggleStatus={handleStatusToggle}
              onClear={() => {
                setSearchTerm('');
                setTypeFilter('all');
                setStatusFilter([]);
                setFilterPanelOpen(false);
              }}
            />
          </div>
        </div>
        {loadError && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800" role="alert">
            <p className="font-medium">数据加载失败：{loadError}</p>
            <p className="mt-1">请稍后重试，或检查 Mock 服务状态。</p>
          </div>
        )}
        <section className="space-y-2">
          <p className="text-xs font-medium text-slate-500">产品结构</p>
          <div className="space-y-1">{renderStructureTree(PRODUCT_STRUCTURE)}</div>
        </section>
        {hasFiltersApplied ? (
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="font-medium text-slate-600">当前：</span>
            <span>{typeFilter === 'all' ? '全部类型' : typeFilter}</span>
            {selectedStatusLabels.length > 0 && <span>{selectedStatusLabels.join('、')}</span>}
            {searchTerm.trim() && <span>关键词“{searchTerm.trim()}”</span>}
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setTypeFilter('all');
                setStatusFilter([]);
              }}
              className="inline-flex items-center gap-1 text-blue-600 hover:underline"
            >
              <i className="ri-close-line" /> 清除
            </button>
          </div>
        ) : (
          <span className="text-xs text-slate-500">未应用筛选条件</span>
        )}
        <div className="space-y-2">
          <label htmlFor="tbom-search" className="sr-only">
            搜索试验
          </label>
          <div className="relative">
            <i className="ri-search-line pointer-events-none absolute left-3 top-2.5 text-slate-400"></i>
            <input
              id="tbom-search"
              ref={searchInputRef}
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="搜索项目 / 试验 / 运行 / EBOM 节点"
              className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>
      </div>
      <div className="max-h-[420px] overflow-y-auto px-3 pb-3 lg:max-h-none lg:flex-1">
        {isPending ? (
          <div className="flex h-full flex-col items-center justify-center space-y-2 text-sm text-slate-500">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-blue-200">
              <i className="ri-loader-4-line animate-spin text-blue-500"></i>
            </span>
            <p>正在重新加载 TBOM 数据…</p>
          </div>
        ) : loadError ? (
          <div className="flex h-full flex-col items-center justify-center space-y-3 text-center text-sm text-slate-500">
            <i className="ri-alert-line text-2xl text-amber-500" aria-hidden="true"></i>
            <p>无法加载 TBOM 数据，请稍候重试。</p>
            <button
              type="button"
              onClick={handleRetry}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700"
            >
              <i className="ri-refresh-line"></i>
              重新加载
            </button>
          </div>
        ) : treeData.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center space-y-2 text-center text-sm text-slate-500">
            <i className="ri-file-search-line text-2xl text-slate-400"></i>
            <p>根据当前筛选条件未找到匹配的试验/运行。</p>
            <button
              onClick={() => {
                setSearchTerm('');
                setTypeFilter('all');
                setStatusFilter([]);
              }}
              className="text-xs text-blue-600 hover:underline"
            >
              清除筛选条件
            </button>
          </div>
        ) : (
          <TbomTree
            data={treeData}
            expanded={expanded}
            selection={activeSelection}
            onSelect={(node) => {
              setSelection(node);
              const next = new Set(expanded);
              if (node.level === 'project') {
                next.add(`type:${node.project.type}`);
                next.add(`project:${node.project.project_id}`);
              } else if (node.level === 'test') {
                next.add(`type:${node.project.type}`);
                next.add(`project:${node.project.project_id}`);
                next.add(`test:${node.test.test_id}`);
              } else {
                next.add(`type:${node.project.type}`);
                next.add(`project:${node.project.project_id}`);
                next.add(`test:${node.test.test_id}`);
              }
              setExpanded(next);
            }}
            onToggle={toggleExpanded}
          />
        )}
      </div>
    </section>
  );

  const navigationPortalElement = navigationPortal ? createPortal(navigationPanel, navigationPortal) : null;

  const detailSection = (
    <section className="flex flex-col bg-white/90 border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-200/60 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">节点详情</h2>
          <p className="text-xs text-slate-500">查看试验项目信息、运行趋势与输入输出资料。</p>
        </div>
        <div className="text-xs text-slate-500">
          当前共有 <span className="font-semibold text-slate-700">{totalVisibleRuns}</span> 条运行记录
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        <TbomNodeDetail selection={activeSelection} tests={tests} runs={runs} filters={filterSnapshot} />
      </div>
      <div className="border-t border-slate-200/60 px-4 py-3 lg:hidden">
        <button
          type="button"
          onClick={() => setRelationPanelOpen(true)}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          <i className="ri-links-line" /> 查看关联面板
        </button>
      </div>
    </section>
  );

  const inlineNavigation = !navigationPortal;

  const relationPanel = (
    <section
      className={`bg-white/90 border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden ${
        inlineNavigation ? 'hidden lg:flex lg:flex-col' : 'flex flex-col'
      }`}
    >
      <div className="p-4 border-b border-slate-200/60">
        <h2 className="text-lg font-semibold text-slate-900">关联与跳转</h2>
        <p className="text-xs text-slate-500">查看需求、设计、仿真等跨域信息，或返回产品结构。</p>
      </div>
      <div className="flex-1 overflow-y-auto">
        <TbomRelationPanel selection={activeSelection} filters={filterSnapshot} />
      </div>
    </section>
  );

  const gridClass = inlineNavigation
    ? 'h-full grid grid-cols-1 md:grid-cols-[360px,1fr] lg:grid-cols-[360px,1.5fr,420px] gap-4 p-6'
    : 'h-full grid grid-cols-1 gap-4 p-6 lg:grid-cols-[minmax(0,1.65fr),minmax(0,1fr)]';

  const mainContent = (
    <>
      <div className={gridClass}>
        {inlineNavigation ? (
          <>
            {navigationPanel}
            {detailSection}
            {relationPanel}
          </>
        ) : (
          <>
            {detailSection}
            {relationPanel}
          </>
        )}
      </div>
      <div className="sr-only" aria-live="polite" ref={announcementRef} />
      {navigationPortal && navigationPortalElement}
      {isRelationPanelOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex items-end bg-slate-900/40 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="TBOM 关联与跳转"
            className="w-full max-h-[85vh] rounded-t-3xl bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <div>
                <h2 className="text-base font-semibold text-slate-900">关联与跳转</h2>
                <p className="text-xs text-slate-500">查看需求、设计、仿真等跨域信息。</p>
              </div>
              <button
                type="button"
                ref={closeDrawerButtonRef}
                onClick={() => setRelationPanelOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200"
                aria-label="关闭关联面板"
              >
                <i className="ri-close-line" />
              </button>
            </div>
            <div className="max-h-[65vh] overflow-y-auto">
              <TbomRelationPanel selection={activeSelection} filters={filterSnapshot} />
            </div>
          </div>
        </div>
      )}
    </>
  );

  if (!withChrome) {
    return <div className="relative flex h-full flex-col bg-slate-50 text-slate-900">{mainContent}</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex h-screen">
        <Sidebar
          activeModule="tbom"
          onModuleChange={(module) => {
            if (module === 'tbom') {
              router.push('/tbom');
            } else {
              router.push(`/?module=${module}`);
            }
          }}
        />
        <div className="flex-1 flex flex-col">
          <Header selectedProject="发动机核心机" onProjectChange={() => undefined} />
          <main className="flex-1 overflow-hidden">{mainContent}</main>
        </div>
      </div>
    </div>
  );
}
