import { useEffect, useMemo, useReducer, useRef } from 'react';
import type {
  SimulationCategory,
  SimulationFile,
  SimulationFilters,
  SimulationSavedView,
  SimulationDimension,
  SimulationInstanceSnapshot,
  SimulationFolder
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
  selectedInstanceVersions: Record<string, string>;
  versionChangeNotice: VersionChangeNotice | null;
}

type VersionChangeNotice = { instanceId: string; message: string; timestamp: number };

const buildInitialInstanceVersionMap = (categories: SimulationCategory[]): Record<string, string> => {
  const map: Record<string, string> = {};
  categories.forEach(category => {
    category.instances.forEach(instance => {
      map[instance.id] = instance.version;
    });
  });
  return map;
};

interface VersionChangeResolutionInput {
  selectedNode: TreeNodeReference | null;
  snapshot?: SimulationInstanceSnapshot;
  instanceId: string;
  categoryId?: string;
}

const resolveNodeAfterVersionChange = ({
  selectedNode,
  snapshot,
  instanceId,
  categoryId
}: VersionChangeResolutionInput): { node: TreeNodeReference | null; notice: string | null } => {
  if (!selectedNode || selectedNode.instanceId !== instanceId || !snapshot) {
    return { node: selectedNode, notice: null };
  }

  const folders = snapshot.folders ?? [];
  if (folders.length === 0) {
    return {
      node: {
        type: 'instance',
        categoryId: categoryId ?? selectedNode.categoryId,
        instanceId
      },
      notice: '该版本暂无文件夹，已返回实例视图'
    };
  }

  const currentFolderId = selectedNode.folderId;
  const targetFolder = currentFolderId ? folders.find(folder => folder.id === currentFolderId) : undefined;

  if (!currentFolderId || targetFolder) {
    if (selectedNode.fileId && targetFolder) {
      const targetFile = targetFolder.files.find(file => file.id === selectedNode.fileId);
      if (targetFile) {
        return { node: selectedNode, notice: null };
      }
      const fallbackFile = targetFolder.files[0];
      if (fallbackFile) {
        return {
          node: {
            ...selectedNode,
            type: 'file',
            folderId: targetFolder.id,
            fileId: fallbackFile.id
          },
          notice: '该版本缺少原选中文件，已跳转至首个可用文件'
        };
      }
      return {
        node: {
          type: 'folder',
          categoryId: categoryId ?? selectedNode.categoryId,
          instanceId,
          folderId: targetFolder.id
        },
        notice: '该版本文件夹暂无文件，已返回文件夹视图'
      };
    }
    return { node: selectedNode, notice: null };
  }

  const fallbackFolder = folders[0];
  return {
    node: {
      type: 'folder',
      categoryId: categoryId ?? selectedNode.categoryId,
      instanceId,
      folderId: fallbackFolder.id
    },
    notice: '该版本缺少原选中文件夹，已自动跳转到默认文件夹'
  };
};

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
  | { type: 'SET_INSTANCE_VERSION'; payload: { instanceId: string; version: string } }
  | { type: 'CLEAR_VERSION_NOTICE' }
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
  return result.length > 0 ? result : (['structure'] as SimulationDimension[]);
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

const createInitialState = (): ExplorerState => {
  const versionMap = buildInitialInstanceVersionMap(simulationCategories);
  return {
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
    lastCompareEvent: null,
    selectedInstanceVersions: versionMap,
    versionChangeNotice: null
  };
};

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
    case 'SET_INSTANCE_VERSION': {
      const { instanceId, version } = action.payload;
      const selectedInstanceVersions = {
        ...state.selectedInstanceVersions,
        [instanceId]: version
      };
      let selectedNode = state.selectedNode;
      let versionChangeNotice = state.versionChangeNotice;

      const category = state.categories.find(cat => cat.instances.some(inst => inst.id === instanceId));
      const instance = category?.instances.find(inst => inst.id === instanceId);
      const snapshot = instance?.versions?.[version];

      if (instance && snapshot) {
        const { node, notice } = resolveNodeAfterVersionChange({
          selectedNode,
          snapshot,
          instanceId,
          categoryId: category?.id
        });
        selectedNode = node;
        versionChangeNotice = notice
          ? { instanceId, message: notice, timestamp: Date.now() }
          : versionChangeNotice && versionChangeNotice.instanceId === instanceId
          ? null
          : versionChangeNotice;
      }

      return {
        ...state,
        selectedInstanceVersions,
        selectedNode,
        versionChangeNotice,
        page: 1
      };
    }
    case 'CLEAR_VERSION_NOTICE':
      return { ...state, versionChangeNotice: null };
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
    const { selectedNode, categories, hasInteracted, selectedInstanceVersions } = state;

    const defaultResult = {
      category: undefined as SimulationCategory | undefined,
      instance: undefined as SimulationCategory['instances'][number] | undefined,
      instanceSnapshot: undefined as SimulationInstanceSnapshot | undefined,
      folder: undefined as SimulationFolder | undefined,
      files: [] as SimulationFile[],
      activeInstanceVersion: undefined as string | undefined
    };

    const resolveSnapshot = (inst?: SimulationCategory['instances'][number]) => {
      if (!inst) return { snapshot: undefined as SimulationInstanceSnapshot | undefined, activeVersion: undefined as string | undefined };
      const requestedVersion = selectedInstanceVersions[inst.id] ?? inst.version;
      const snapshots = inst.versions ?? {};
      const snapshot =
        (requestedVersion && snapshots[requestedVersion]) ||
        (inst.version && snapshots[inst.version]) ||
        Object.values(snapshots)[0];
      return {
        snapshot,
        activeVersion: snapshot?.version ?? requestedVersion ?? inst.version
      };
    };

    if (!selectedNode) {
      if (!hasInteracted) {
        return defaultResult;
      }

      const firstCategory = categories[0];
      if (!firstCategory) {
        return defaultResult;
      }

      const firstInstance = firstCategory.instances[0];
      const { snapshot, activeVersion } = resolveSnapshot(firstInstance);
      if (snapshot) {
        const firstFolder = snapshot.folders[0];
        return {
          category: firstCategory,
          instance: firstInstance,
          instanceSnapshot: snapshot,
          folder: firstFolder,
          files: firstFolder?.files ?? [],
          activeInstanceVersion: activeVersion
        };
      }

      return {
        category: firstCategory,
        instance: firstInstance,
        instanceSnapshot: undefined,
        folder: undefined,
        files: firstCategory.instances.flatMap(inst => inst.folders.flatMap(f => f.files)),
        activeInstanceVersion: activeVersion
      };
    }

    const category = categories.find(c => c.id === selectedNode.categoryId) || categories[0];
    const instance = category?.instances.find(inst => inst.id === selectedNode.instanceId);
    const { snapshot, activeVersion } = resolveSnapshot(instance);

    if (!snapshot) {
      const fallbackFolder = instance?.folders.find(f => f.id === selectedNode.folderId);
      const fallbackFiles = fallbackFolder?.files ?? (instance ? instance.folders.flatMap(f => f.files) : []);
      return {
        category,
        instance,
        instanceSnapshot: undefined,
        folder: fallbackFolder,
        files: fallbackFiles,
        activeInstanceVersion: activeVersion
      };
    }

    const folder = selectedNode.folderId ? snapshot.folders.find(f => f.id === selectedNode.folderId) : undefined;
    const files = folder?.files ?? [];

    return {
      category,
      instance,
      instanceSnapshot: snapshot,
      folder,
      files,
      activeInstanceVersion: activeVersion
    };
  }, [state]);

  return { state, dispatch, ...derived, versionNotice: state.versionChangeNotice };
}

export type { ExplorerState };
