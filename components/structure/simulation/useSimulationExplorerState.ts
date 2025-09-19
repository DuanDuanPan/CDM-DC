import { useMemo, useReducer } from 'react';
import type {
  SimulationCategory,
  SimulationFile,
  SimulationFilters
} from './types';
import { simulationCategories } from './data';

type NodeType = 'category' | 'instance' | 'folder' | 'file';

interface TreeNodeReference {
  type: NodeType;
  categoryId?: string;
  instanceId?: string;
  folderId?: string;
  fileId?: string;
}

interface ExplorerState {
  categories: SimulationCategory[];
  selectedNode: TreeNodeReference | null;
  expandedNodeIds: string[];
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
  | { type: 'SET_SEARCH'; payload: string }
  | { type: 'SET_PAGE'; payload: number }
  | { type: 'SET_PAGE_SIZE'; payload: number }
  | { type: 'SET_HAS_INTERACTED'; payload: boolean }
  | { type: 'SET_FILTERS'; payload: Partial<SimulationFilters> }
  | { type: 'RESET_PAGE' }
  | { type: 'ADD_COMPARE'; payload: SimulationFile }
  | { type: 'REMOVE_COMPARE'; payload: string }
  | { type: 'REGISTER_COMPARE_EVENT'; payload: { type: 'file' | 'instance'; id: string; label: string } }
  | { type: 'CLEAR_COMPARE' };

const initialState: ExplorerState = {
  categories: simulationCategories,
  selectedNode: null,
  expandedNodeIds: [],
  searchKeyword: '',
  page: 1,
  pageSize: 20,
  compareQueue: [],
  filters: {
    statuses: [],
    owners: [],
    tags: [],
    timeRange: 'all'
  },
  hasInteracted: false,
  lastCompareEvent: null
};

function explorerReducer(state: ExplorerState, action: ExplorerAction): ExplorerState {
  switch (action.type) {
    case 'SELECT_NODE':
      return { ...state, selectedNode: action.payload, page: 1, hasInteracted: true };
    case 'TOGGLE_EXPAND': {
      const expanded = state.expandedNodeIds.includes(action.payload)
        ? state.expandedNodeIds.filter(id => id !== action.payload)
        : [...state.expandedNodeIds, action.payload];
      return { ...state, expandedNodeIds: expanded };
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
      const compareKey = action.payload.compareKey ?? (action.payload.activeConditionId ? `${action.payload.id}::${action.payload.activeConditionId}` : action.payload.id);
      if (state.compareQueue.some(item => (item.compareKey ?? (item.activeConditionId ? `${item.id}::${item.activeConditionId}` : item.id)) === compareKey)) {
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
        compareQueue: state.compareQueue.filter(item => (item.compareKey ?? (item.activeConditionId ? `${item.id}::${item.activeConditionId}` : item.id)) !== action.payload)
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
    default:
      return state;
  }
}

export function useSimulationExplorerState() {
  const [state, dispatch] = useReducer(explorerReducer, initialState);

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
