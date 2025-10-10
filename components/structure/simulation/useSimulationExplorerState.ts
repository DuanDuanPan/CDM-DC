import { useEffect, useMemo, useReducer, useRef } from 'react';
import type {
  SimulationCategory,
  SimulationFile,
  SimulationFilters,
  SimulationViewMode,
  SimulationDimensionSelection,
  SimulationSavedView,
  SimulationDimension
} from './types';
import { simulationCategories } from './data';
import { SIMULATION_DIMENSION_LIMIT } from './dimensions';

type NodeType = 'category' | 'instance' | 'folder' | 'file' | 'dimension';

interface TreeNodeReference {
  type: NodeType;
  categoryId?: string;
  instanceId?: string;
  folderId?: string;
  fileId?: string;
  dimensionId?: string;
  dimensionType?: SimulationDimension;
  dimensionValue?: string;
  dimensionLabel?: string;
}

interface ViewSnapshot {
  selectedNode: TreeNodeReference | null;
  expandedNodeIds: string[];
  navVisibleCount: number;
}

interface ExplorerState {
  categories: SimulationCategory[];
  selectedNode: TreeNodeReference | null;
  expandedNodeIds: string[];
  viewMode: SimulationViewMode;
  viewSnapshots: Record<SimulationViewMode, ViewSnapshot>;
  navVisibleCount: number;
  navPageSize: number;
  dimensionSelections: SimulationDimensionSelection[];
  dimensionLimitBreachedAt?: number;
  savedViews: SimulationSavedView[];
  searchKeyword: string;
  page: number;
  pageSize: number;
  compareQueue: SimulationFile[];
  filters: SimulationFilters;
  hasInteracted: boolean;
  lastCompareEvent: {
    type: 'file' | 'instance';
    id: string;
    label: string;
    timestamp: number;
  } | null;
}

type ExplorerAction =
  | { type: 'SELECT_NODE'; payload: TreeNodeReference }
  | { type: 'TOGGLE_EXPAND'; payload: string }
  | { type: 'SET_NAV_VISIBLE_COUNT'; payload: number }
  | { type: 'SET_VIEW_MODE'; payload: SimulationViewMode }
  | { type: 'ADD_DIMENSION_SELECTION'; payload: SimulationDimensionSelection }
  | { type: 'REMOVE_DIMENSION_SELECTION'; payload: string }
  | { type: 'CLEAR_DIMENSION_SELECTIONS' }
  | { type: 'SET_SEARCH'; payload: string }
  | { type: 'SET_PAGE'; payload: number }
  | { type: 'SET_PAGE_SIZE'; payload: number }
  | { type: 'SET_HAS_INTERACTED'; payload: boolean }
  | { type: 'SET_FILTERS'; payload: Partial<SimulationFilters> }
  | { type: 'RESET_PAGE' }
  | { type: 'ADD_COMPARE'; payload: SimulationFile }
  | { type: 'REMOVE_COMPARE'; payload: string }
  | { type: 'REGISTER_COMPARE_EVENT'; payload: { type: 'file' | 'instance'; id: string; label: string } }
  | { type: 'CLEAR_COMPARE' }
  | { type: 'SAVE_VIEW'; payload: SimulationSavedView }
  | { type: 'DELETE_VIEW'; payload: string }
  | { type: 'RENAME_VIEW'; payload: { id: string; name: string } }
  | { type: 'APPLY_VIEW'; payload: SimulationSavedView }
  | { type: 'RESET' };

const NAV_PAGE_SIZE = 30;
const SAVED_VIEW_STORAGE_KEY = 'simulation-explorer-saved-views';

const createDefaultSnapshot = (): ViewSnapshot => ({
  selectedNode: null,
  expandedNodeIds: [],
  navVisibleCount: NAV_PAGE_SIZE
});

const createInitialViewSnapshots = (): Record<SimulationViewMode, ViewSnapshot> => ({
  structure: createDefaultSnapshot(),
  time: createDefaultSnapshot(),
  type: createDefaultSnapshot()
});

const loadSavedViews = (): SimulationSavedView[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(SAVED_VIEW_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.slice(0, 10);
  } catch (error) {
    console.warn('[SimulationExplorer] failed to parse saved views', error);
    return [];
  }
};

const createInitialState = (): ExplorerState => ({
  categories: simulationCategories,
  selectedNode: null,
  expandedNodeIds: [],
  viewMode: 'structure',
  viewSnapshots: createInitialViewSnapshots(),
  navVisibleCount: NAV_PAGE_SIZE,
  navPageSize: NAV_PAGE_SIZE,
  dimensionSelections: [],
  dimensionLimitBreachedAt: undefined,
  savedViews: loadSavedViews(),
  searchKeyword: '',
  page: 1,
  pageSize: NAV_PAGE_SIZE,
  compareQueue: [],
  filters: {
    statuses: [],
    owners: [],
    tags: [],
    timeRange: 'all'
  },
  hasInteracted: false,
  lastCompareEvent: null
});

const persistSnapshotForMode = (
  state: ExplorerState,
  mode: SimulationViewMode,
  override?: Partial<ViewSnapshot>
): Record<SimulationViewMode, ViewSnapshot> => ({
  ...state.viewSnapshots,
  [mode]: {
    ...state.viewSnapshots[mode],
    selectedNode: override?.selectedNode ?? state.selectedNode,
    expandedNodeIds: override?.expandedNodeIds ?? state.expandedNodeIds,
    navVisibleCount: override?.navVisibleCount ?? state.navVisibleCount
  }
});

const applySnapshot = (snapshot: ViewSnapshot | undefined) => ({
  selectedNode: snapshot?.selectedNode ?? null,
  expandedNodeIds: snapshot?.expandedNodeIds ?? [],
  navVisibleCount: snapshot?.navVisibleCount ?? NAV_PAGE_SIZE
});

function explorerReducer(state: ExplorerState, action: ExplorerAction): ExplorerState {
  switch (action.type) {
    case 'SELECT_NODE': {
      const additions: string[] = [];
      if (action.payload.categoryId) {
        additions.push(action.payload.categoryId);
      }
      if ((action.payload.type === 'folder' || action.payload.type === 'instance') && action.payload.instanceId) {
        additions.push(action.payload.instanceId);
      }

      const expandedSet = new Set(state.expandedNodeIds);
      additions.forEach(id => {
        if (id) {
          expandedSet.add(id);
        }
      });

      const expandedNodeIds = Array.from(expandedSet);
      const nextSnapshots = persistSnapshotForMode(state, state.viewMode, {
        selectedNode: action.payload,
        expandedNodeIds
      });
      return {
        ...state,
        selectedNode: action.payload,
        expandedNodeIds,
        viewSnapshots: nextSnapshots,
        page: 1,
        hasInteracted: true
      };
    }
    case 'TOGGLE_EXPAND': {
      const expanded = state.expandedNodeIds.includes(action.payload)
        ? state.expandedNodeIds.filter(id => id !== action.payload)
        : [...state.expandedNodeIds, action.payload];
      const nextSnapshots = persistSnapshotForMode(state, state.viewMode, { expandedNodeIds: expanded });
      return { ...state, expandedNodeIds: expanded, viewSnapshots: nextSnapshots };
    }
    case 'SET_NAV_VISIBLE_COUNT': {
      const nextSnapshots = persistSnapshotForMode(state, state.viewMode, { navVisibleCount: action.payload });
      return { ...state, navVisibleCount: action.payload, viewSnapshots: nextSnapshots };
    }
    case 'SET_VIEW_MODE': {
      if (state.viewMode === action.payload) {
        return state;
      }
      const snapshotsWithCurrent = persistSnapshotForMode(state, state.viewMode);
      const snapshotForNext = snapshotsWithCurrent[action.payload] ?? createDefaultSnapshot();
      return {
        ...state,
        viewMode: action.payload,
        viewSnapshots: snapshotsWithCurrent,
        selectedNode: snapshotForNext.selectedNode,
        expandedNodeIds: snapshotForNext.expandedNodeIds,
        navVisibleCount: snapshotForNext.navVisibleCount,
        page: 1
      };
    }
    case 'ADD_DIMENSION_SELECTION': {
      const existingIndex = state.dimensionSelections.findIndex(sel => sel.dimension === action.payload.dimension);
      if (existingIndex >= 0) {
        const nextSelections = [...state.dimensionSelections];
        nextSelections[existingIndex] = action.payload;
        return { ...state, dimensionSelections: nextSelections, dimensionLimitBreachedAt: undefined };
      }
      if (state.dimensionSelections.length >= SIMULATION_DIMENSION_LIMIT) {
        return { ...state, dimensionLimitBreachedAt: Date.now() };
      }
      return {
        ...state,
        dimensionSelections: [...state.dimensionSelections, action.payload],
        dimensionLimitBreachedAt: undefined
      };
    }
    case 'REMOVE_DIMENSION_SELECTION':
      return {
        ...state,
        dimensionSelections: state.dimensionSelections.filter(sel => sel.id !== action.payload),
        dimensionLimitBreachedAt: undefined
      };
    case 'CLEAR_DIMENSION_SELECTIONS':
      return { ...state, dimensionSelections: [], dimensionLimitBreachedAt: undefined };
    case 'SET_SEARCH':
      return { ...state, searchKeyword: action.payload, page: 1 };
    case 'SET_PAGE':
      return { ...state, page: action.payload };
    case 'SET_PAGE_SIZE':
      return { ...state, pageSize: action.payload, page: 1 };
    case 'SET_HAS_INTERACTED':
      return { ...state, hasInteracted: action.payload };
    case 'SET_FILTERS':
      return {
        ...state,
        filters: {
          statuses: action.payload.statuses ?? state.filters.statuses,
          owners: action.payload.owners ?? state.filters.owners,
          tags: action.payload.tags ?? state.filters.tags,
          timeRange: action.payload.timeRange ?? state.filters.timeRange
        },
        page: 1
      };
    case 'RESET_PAGE':
      return { ...state, page: 1 };
    case 'ADD_COMPARE': {
      const compareKey =
        action.payload.compareKey ??
        (action.payload.activeConditionId ? `${action.payload.id}::${action.payload.activeConditionId}` : action.payload.id);
      if (
        state.compareQueue.some(item => (item.compareKey ?? (item.activeConditionId ? `${item.id}::${item.activeConditionId}` : item.id)) === compareKey)
      ) {
        return state;
      }
      if (state.compareQueue.length >= 6) return state;
      return {
        ...state,
        compareQueue: [...state.compareQueue, { ...action.payload, compareKey }],
        lastCompareEvent: {
          type: 'file',
          id: compareKey,
          label: action.payload.name,
          timestamp: Date.now()
        }
      };
    }
    case 'REMOVE_COMPARE':
      return {
        ...state,
        compareQueue: state.compareQueue.filter(
          item => (item.compareKey ?? (item.activeConditionId ? `${item.id}::${item.activeConditionId}` : item.id)) !== action.payload
        )
      };
    case 'CLEAR_COMPARE':
      return { ...state, compareQueue: [], lastCompareEvent: null };
    case 'REGISTER_COMPARE_EVENT':
      return {
        ...state,
        lastCompareEvent: {
          type: action.payload.type,
          id: action.payload.id,
          label: action.payload.label,
          timestamp: Date.now()
        }
      };
    case 'SAVE_VIEW': {
      const nextViews = [action.payload, ...state.savedViews].filter((view, index, self) => index === self.findIndex(item => item.id === view.id));
      return { ...state, savedViews: nextViews.slice(0, 10) };
    }
    case 'DELETE_VIEW':
      return { ...state, savedViews: state.savedViews.filter(view => view.id !== action.payload) };
    case 'RENAME_VIEW':
      return {
        ...state,
        savedViews: state.savedViews.map(view => (view.id === action.payload.id ? { ...view, name: action.payload.name } : view))
      };
    case 'APPLY_VIEW': {
      const snapshotsWithCurrent = persistSnapshotForMode(state, state.viewMode);
      const snapshotForTarget = snapshotsWithCurrent[action.payload.viewMode] ?? createDefaultSnapshot();
      const restored = applySnapshot(snapshotForTarget);
      return {
        ...state,
        viewMode: action.payload.viewMode,
        viewSnapshots: snapshotsWithCurrent,
        selectedNode: restored.selectedNode,
        expandedNodeIds: restored.expandedNodeIds,
        navVisibleCount: restored.navVisibleCount,
        dimensionSelections: action.payload.selections.slice(0, SIMULATION_DIMENSION_LIMIT),
        searchKeyword: action.payload.searchKeyword,
        filters: action.payload.filters,
        page: 1,
        hasInteracted: true
      };
    }
    case 'RESET':
      return createInitialState();
    default:
      return state;
  }
}

export function useSimulationExplorerState() {
  const [state, dispatch] = useReducer(explorerReducer, createInitialState());
  const hasPersistedSavedViewsRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!hasPersistedSavedViewsRef.current) {
      hasPersistedSavedViewsRef.current = true;
      return;
    }
    window.localStorage.setItem(SAVED_VIEW_STORAGE_KEY, JSON.stringify(state.savedViews.slice(0, 10)));
  }, [state.savedViews]);

  const derived = useMemo(() => {
    const { selectedNode, categories, hasInteracted } = state;
    if (!selectedNode) {
      if (!hasInteracted) {
        return { category: undefined, instance: undefined, folder: undefined, files: [] as SimulationFile[] };
      }

      const firstCategory = categories[0];
      if (!firstCategory) {
        return { category: undefined, instance: undefined, folder: undefined, files: [] as SimulationFile[] };
      }

      return {
        category: firstCategory,
        instance: undefined,
        folder: undefined,
        files: firstCategory.instances.flatMap(inst => inst.folders.flatMap(f => f.files))
      };
    }

    const category = categories.find(c => c.id === selectedNode.categoryId) || categories[0];
    const instance = category?.instances.find(inst => inst.id === selectedNode.instanceId);
    const folder = instance?.folders.find(f => f.id === selectedNode.folderId);
    const files = folder?.files ?? [];

    return { category, instance, folder, files };
  }, [state]);

  return { state, dispatch, ...derived };
}

export type { TreeNodeReference, ExplorerState };
