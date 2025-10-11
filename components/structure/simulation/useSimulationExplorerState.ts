import { useEffect, useMemo, useReducer, useRef } from 'react';
import type {
  SimulationCategory,
  SimulationFile,
  SimulationFilters,
  SimulationSavedView,
  SimulationDimension
} from './types';
import { simulationCategories } from './data';

type NodeType = 'category' | 'instance' | 'folder' | 'file' | 'dimension';

export interface TreeNodeReference {
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

interface ExplorerState {
  categories: SimulationCategory[];
  selectedNode: TreeNodeReference | null;
  expandedNodeIds: string[];
  navVisibleCount: number;
  navPageSize: number;
  activeDimensions: SimulationDimension[];
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
  | { type: 'SET_ACTIVE_DIMENSIONS'; payload: SimulationDimension[] }
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
const isSimulationDimension = (value: unknown): value is SimulationDimension =>
  value === 'structure' || value === 'type' || value === 'time';

const normalizeDimensions = (input: SimulationDimension[]): SimulationDimension[] => {
  const result: SimulationDimension[] = [];
  input.forEach(dim => {
    if (isSimulationDimension(dim) && !result.includes(dim)) {
      result.push(dim);
    }
  });
  return result.length > 0 ? result : ['structure'];
};

const normalizeFilters = (input?: Partial<SimulationFilters>): SimulationFilters => ({
  statuses: Array.isArray(input?.statuses) ? input!.statuses : [],
  owners: Array.isArray(input?.owners) ? input!.owners : [],
  tags: Array.isArray(input?.tags) ? input!.tags : [],
  timeRange: input?.timeRange ?? 'all'
});

const normalizeSavedView = (raw: unknown, fallbackIndex: number): SimulationSavedView | null => {
  if (!raw || typeof raw !== 'object') return null;
  const candidate = raw as Partial<SimulationSavedView> & { viewMode?: string };
  const dimensions = normalizeDimensions(
    Array.isArray((candidate as any).dimensions)
      ? ((candidate as any).dimensions as SimulationDimension[])
      : candidate.viewMode && isSimulationDimension(candidate.viewMode)
      ? [candidate.viewMode]
      : ['structure']
  );
  const name = typeof candidate.name === 'string' && candidate.name.trim() ? candidate.name.trim() : `视图 ${fallbackIndex + 1}`;
  const id =
    typeof candidate.id === 'string' && candidate.id.trim()
      ? candidate.id
      : `view-${fallbackIndex + 1}-${Date.now()}`;
  const createdAt =
    typeof candidate.createdAt === 'string' && candidate.createdAt
      ? candidate.createdAt
      : new Date().toISOString();

  return {
    id,
    name,
    createdAt,
    dimensions,
    searchKeyword: typeof candidate.searchKeyword === 'string' ? candidate.searchKeyword : '',
    filters: normalizeFilters(candidate.filters)
  };
};

const loadSavedViews = (): SimulationSavedView[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(SAVED_VIEW_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item, index) => normalizeSavedView(item, index))
      .filter((item): item is SimulationSavedView => Boolean(item))
      .slice(0, 10);
  } catch (error) {
    console.warn('[SimulationExplorer] failed to parse saved views', error);
    return [];
  }
};

const createInitialState = (): ExplorerState => ({
  categories: simulationCategories,
  selectedNode: null,
  expandedNodeIds: [],
  navVisibleCount: NAV_PAGE_SIZE,
  navPageSize: NAV_PAGE_SIZE,
  activeDimensions: ['structure'],
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

function explorerReducer(state: ExplorerState, action: ExplorerAction): ExplorerState {
  switch (action.type) {
    case 'SELECT_NODE': {
      return {
        ...state,
        selectedNode: action.payload,
        page: 1,
        hasInteracted: true
      };
    }
    case 'TOGGLE_EXPAND': {
      const expanded = state.expandedNodeIds.includes(action.payload)
        ? state.expandedNodeIds.filter(id => id !== action.payload)
        : [...state.expandedNodeIds, action.payload];
      return { ...state, expandedNodeIds: expanded };
    }
    case 'SET_NAV_VISIBLE_COUNT':
      return { ...state, navVisibleCount: action.payload };
    case 'SET_ACTIVE_DIMENSIONS': {
      const normalized = normalizeDimensions(action.payload);
      return {
        ...state,
        activeDimensions: normalized,
        selectedNode: null,
        expandedNodeIds: [],
        navVisibleCount: NAV_PAGE_SIZE,
        page: 1
      };
    }
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
        filters: normalizeFilters(action.payload),
        page: 1
      };
    case 'RESET_PAGE':
      return { ...state, page: 1 };
    case 'ADD_COMPARE': {
      const compareKey =
        action.payload.compareKey ??
        (action.payload.activeConditionId ? `${action.payload.id}::${action.payload.activeConditionId}` : action.payload.id);
      if (
        state.compareQueue.some(
          item => (item.compareKey ?? (item.activeConditionId ? `${item.id}::${item.activeConditionId}` : item.id)) === compareKey
        )
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
      const dimensions = normalizeDimensions(action.payload.dimensions);
      const nextView: SimulationSavedView = {
        ...action.payload,
        dimensions
      };
      const nextViews = [nextView, ...state.savedViews].filter(
        (view, index, self) => index === self.findIndex(item => item.id === view.id)
      );
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
      const normalized = normalizeDimensions(action.payload.dimensions);
      return {
        ...state,
        activeDimensions: normalized,
        selectedNode: null,
        expandedNodeIds: [],
        navVisibleCount: NAV_PAGE_SIZE,
        searchKeyword: action.payload.searchKeyword,
        filters: normalizeFilters(action.payload.filters),
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
  const [state, dispatch] = useReducer(explorerReducer, undefined, createInitialState);
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

export type { ExplorerState };
