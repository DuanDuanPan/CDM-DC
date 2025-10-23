import { useCallback } from 'react';
import type { MouseEvent } from 'react';
import { useRouter } from 'next/navigation';
import type { TbomSelection } from '@/components/tbom/TbomExplorerClient';
import type { TbomRunStatus, TbomRun } from '@/components/tbom/types';
import { TBOM_DOMAIN_DEFINITIONS, type TbomDomainKey } from './constants';
import type {
  TbomFilterSnapshot,
  TbomNavigationPersistedContext,
} from './types';

export type TbomRelationChipState = 'ready' | 'empty' | 'error';

export type TbomRelationChipDescriptor = {
  domain: TbomDomainKey;
  state: TbomRelationChipState;
  label: string;
  refLabel?: string;
  refId?: string;
  reason?: string;
  ariaLabel?: string;
  announceMessage?: string;
  hrefParams?: Record<string, string | undefined>;
  extras?: {
    ebomNodeId?: string;
    ebomPath?: string;
    testItemSn?: string;
    assemblyBomId?: string;
    statusFilter?: TbomRunStatus[];
  };
};

type UseTbomCrossDomainNavigationOptions = {
  selection: TbomSelection | null;
  filters?: TbomFilterSnapshot | null;
  onAnnounce?: (message: string) => void;
  runOverride?: TbomRun | null;
};

const CONTEXT_STORAGE_KEY = 'tbom.context';
const FILTER_STORAGE_KEY = 'tbom.filters';

const toSearchParams = (params: Record<string, string | undefined>): string => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }
    search.set(key, value);
  });
  return search.toString();
};

const persistFilters = (filters?: TbomFilterSnapshot | null) => {
  if (!filters) return;
  if (typeof window === 'undefined') return;
  const serialisable = {
    searchTerm: filters.searchTerm,
    typeFilter: filters.typeFilter,
    statusFilter: filters.statusFilter,
    structureSelection: filters.structureSelection,
    expandedTreeIds: filters.expandedTreeIds ?? [],
  };
  try {
    window.localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(serialisable));
  } catch (error) {
    console.warn('[TBOM] 无法持久化筛选上下文', error);
  }
};

const persistContext = (
  selection: TbomSelection,
  chip: TbomRelationChipDescriptor,
  filters?: TbomFilterSnapshot | null,
  runOverride?: TbomRun | null,
) => {
  const selectionSummary = (() => {
    switch (selection.level) {
      case 'project':
        return {
          level: 'project' as const,
          projectId: selection.project.project_id,
        };
      case 'test':
        return {
          level: 'test' as const,
          projectId: selection.project.project_id,
          testId: selection.test.test_id,
        };
      case 'run':
      default:
        return {
          level: 'run' as const,
          projectId: selection.project.project_id,
          testId: selection.test.test_id,
          runId: selection.run.run_id,
        };
    }
  })();

  const referenceRun =
    selection.level === 'run' ? selection.run : runOverride ?? null;

  const context: TbomNavigationPersistedContext = {
    version: 1,
    timestamp: new Date().toISOString(),
    selection: selectionSummary,
    filters: filters ?? undefined,
    anchor: {
      domain: chip.domain,
      refId: chip.refId,
      label: chip.label,
      ebomNodeId: chip.extras?.ebomNodeId,
      ebomPath: chip.extras?.ebomPath,
    },
    extras: referenceRun
      ? {
          testItemSn: referenceRun.test_item_sn,
          assemblyBomId: referenceRun.assembly_bom_id,
        }
      : undefined,
  };

  try {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.setItem(CONTEXT_STORAGE_KEY, JSON.stringify(context));
  } catch (error) {
    console.warn('[TBOM] 无法持久化 TBOM 上下文', error);
  }
};

export const useTbomCrossDomainNavigation = ({
  selection,
  filters = null,
  onAnnounce,
  runOverride = null,
}: UseTbomCrossDomainNavigationOptions) => {
  const router = useRouter();

  const makeAnnouncement = useCallback(
    (message: string) => {
      onAnnounce?.(message);
    },
    [onAnnounce],
  );

  const navigate = useCallback(
    (chip: TbomRelationChipDescriptor, openMode: 'current' | 'new') => {
      if (!selection) {
        makeAnnouncement('当前尚未选择 TBOM 节点，无法跳转。');
        return;
      }
      if (chip.state !== 'ready') {
        makeAnnouncement(chip.reason ?? `${chip.label}暂不可用。`);
        return;
      }
      const definition = TBOM_DOMAIN_DEFINITIONS[chip.domain];
      const baseParams: Record<string, string | undefined> = {
        module: definition.module,
        from: 'tbom',
        domain: chip.domain,
        ...chip.hrefParams,
      };

      const targetSearch = toSearchParams(baseParams);
      const href = `/?${targetSearch}`;

      persistFilters(filters);
      persistContext(selection, chip, filters, runOverride ?? undefined);

      makeAnnouncement(`${definition.ariaPrefix}导航已开启，正在跳转。`);
      if (openMode === 'new') {
        window.open(href, '_blank', 'noopener');
      } else {
        router.push(href);
      }
    },
    [filters, makeAnnouncement, router, runOverride, selection],
  );

  const handleChipClick = useCallback(
    (chip: TbomRelationChipDescriptor, event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      if (!selection) {
        makeAnnouncement('尚未选择 TBOM 节点，无法跳转。');
        return;
      }
      if (chip.state !== 'ready') {
        makeAnnouncement(chip.reason ?? `${chip.label}暂不可用。`);
        return;
      }
      const openMode =
        event.metaKey || event.ctrlKey || event.button === 1 ? 'new' : 'current';
      navigate(chip, openMode);
    },
    [makeAnnouncement, navigate, selection],
  );

  const handleChipFocus = useCallback(
    (chip: TbomRelationChipDescriptor) => {
      const definition = TBOM_DOMAIN_DEFINITIONS[chip.domain];
      const stateMessage =
        chip.state === 'ready'
          ? `${definition.ariaPrefix}可用，关联标识 ${chip.refLabel ?? chip.refId ?? ''}`
          : chip.state === 'empty'
          ? `${definition.ariaPrefix}暂无关联`
          : `${definition.ariaPrefix}发生错误`;
      makeAnnouncement(stateMessage.trim());
    },
    [makeAnnouncement],
  );

  return {
    handleChipClick,
    handleChipFocus,
  };
};
