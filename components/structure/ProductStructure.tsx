
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Tooltip from '@/components/common/Tooltip';
import { requirementRoles, requirementRoleInsights } from './data/requirementRoles';
import { requirementsByNode } from './data/requirements';
import RequirementDetailPanel from './RequirementDetailPanel';
import { RequirementRoleKey } from './types';
import PerformanceOverview from './performance/PerformanceOverview';
import StructuralOverview from './structure/StructuralOverview';
import ThermalOverview from './thermal/ThermalOverview';
import ControlOverview from './control/ControlOverview';
import ManufacturingOverview from './manufacturing/ManufacturingOverview';
import VerificationOverview from './verification/VerificationOverview';
import TestCoverageHeatmap from './verification/TestCoverageHeatmap';
import TestRequirementMatrix from './verification/TestRequirementMatrix';
import TestResourcePanel from './verification/TestResourcePanel';
import SimulationCorrelationPlan from './verification/SimulationCorrelationPlan';
import VerificationEvidenceExport from './verification/VerificationEvidenceExport';
import ConfigurationQualityOverview from './quality/ConfigurationQualityOverview';
import CollaborationHub from './collaboration/CollaborationHub';
import SimulationTreePanel from './simulation/SimulationTreePanel';
import SimulationContentPanel from './simulation/SimulationContentPanel';
import SimulationFilePreview from './simulation/SimulationFilePreview';
import SimulationCompareDrawer from './simulation/SimulationCompareDrawer';
import SimulationDimensionManager from './simulation/SimulationDimensionManager';
import { useSimulationExplorerState, TreeNodeReference } from './simulation/useSimulationExplorerState';
import type { SimulationFile, SimulationFilters, SimulationDimension } from './simulation/types';
import { simulationJumpTargets, SIMULATION_JUMP_UNMAPPED, type SimulationJumpTarget } from './simulation/simulationJumpMap';
import { clearSimulationRunsFromStorage } from './simulation/testSimBridge';
import ProductDefinitionPanel from './definition/ProductDefinitionPanel';
import EbomDetailPanel from './ebom/EbomDetailPanel';
import { EBOM_BASELINES } from './ebom/data';
import { TestingTreePanel } from './testing/TestingTreePanel';
import { TestingContentPanel } from './testing/TestingContentPanel';
import { TEST_STRUCTURE_TREE, TEST_PROJECTS, TEST_TYPES } from './testing/data';
import { useTestingExplorerState } from './testing/useTestingExplorerState';
import TbomRunDetail from '@/components/tbom/detail/TbomRunDetail';
import TbomImportWizard from '@/components/tbom/import/TbomImportWizard';
import type { TbomRun } from '@/components/tbom/types';
import { useTbomPanelState } from './hooks/useTbomPanelState';
import ProductStructureHome from './ProductStructureHome';
import type { BomNode, BomType, Version } from './types';
import { REQUIREMENT_BOM_TREE } from './data/requirementBomTree';
import { SOLUTION_OVERVIEW, SOLUTION_VERSIONS } from './data/solutionOverview';

const mapBomType = (nodes: BomNode[], nextType: string): BomNode[] =>
  nodes.map((node) => ({
    ...node,
    bomType: nextType,
    children: node.children ? mapBomType(node.children, nextType) : undefined
  }));

const TBOM_FEATURE_ENABLED = process.env.NEXT_PUBLIC_ENABLE_TBOM !== 'false';

const TBOM_RUN_STATUS_LABEL: Record<TbomRun['status'], string> = {
  planned: '计划中',
  executing: '执行中',
  completed: '已完成',
  aborted: '已中止',
};

const formatImportTimestamp = (iso: string): string => {
  try {
    const value = new Date(iso);
    return `${value.toLocaleDateString()} ${value.toLocaleTimeString()}`;
  } catch {
    return iso;
  }
};

const VIEW_PREFERENCE_PREFIX = 'product-structure-active-tab';
const NON_SIMULATION_DIMENSIONS: SimulationDimension[] = ['type'];

const SIMULATION_JUMP_MAP_BY_REF = new Map<string, SimulationJumpTarget>();
const SIMULATION_JUMP_MAP_BY_NODE = new Map<string, SimulationJumpTarget>();

simulationJumpTargets.forEach((target) => {
  SIMULATION_JUMP_MAP_BY_REF.set(target.simBomRefId, target);
  target.nodeIds?.forEach((nodeId) => {
    if (!SIMULATION_JUMP_MAP_BY_NODE.has(nodeId)) {
      SIMULATION_JUMP_MAP_BY_NODE.set(nodeId, target);
    }
  });
});

const resolveSimulationJumpTarget = (
  simBomRefId?: string | null,
  nodeId?: string | null,
): SimulationJumpTarget | null => {
  if (simBomRefId) {
    const direct = SIMULATION_JUMP_MAP_BY_REF.get(simBomRefId);
    if (direct) {
      return direct;
    }
  }
  if (nodeId) {
    const byNode = SIMULATION_JUMP_MAP_BY_NODE.get(nodeId);
    if (byNode) {
      return byNode;
    }
  }
  return null;
};

type JumpEntry = {
  kind: 'requirement' | 'simulation';
  fromBomType: string;
  fromTab: string;
  fromNodeId: string | null;
  fromExpandedNodes: string[];
  targetBomType: string;
  targetTab: string;
  requirementIds?: string[];
  simulationTarget?: {
    simBomRefId?: string | null;
    categoryId: string;
    instanceId: string;
    defaultVersion?: string;
  };
  sourceNodeId: string | null;
  sourceNodeName?: string | null;
  createdAt: number;
};

type SimulationJumpSelection = {
  categoryId: string;
  instanceId: string;
  defaultVersion?: string;
  simBomRefId?: string | null;
  sourceNodeId: string | null;
  sourceNodeName?: string | null;
};

type SimulationJumpFeedback = {
  type: 'info' | 'warning';
  message: string;
  timestamp: number;
};

type TbomLinkPayload = {
  from: string | null;
  domain: string | null;
  node: string | null;
  path: string | null;
  requirementId: string | null;
  simulationRef: string | null;
  assetSn: string | null;
  projectId: string | null;
  testId: string | null;
  runId: string | null;
};

type ProductStructureProps = {
  tbomLink?: TbomLinkPayload | null;
};

const BOM_TYPE_LABELS: Record<string, string> = {
  requirement: '需求 BOM',
  solution: '方案 BOM',
  design: '设计 BOM',
  simulation: '仿真 BOM',
  test: '试验 BOM',
  physical: '实物 BOM',
  process: '工艺视图',
  management: '管理视图',
};

function findNodeById(id: string, nodes: BomNode[]): BomNode | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findNodeById(id, node.children);
      if (found) return found;
    }
  }
  return null;
}

const getStoredTabPreference = (bomType: string) => {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(`${VIEW_PREFERENCE_PREFIX}-${bomType}`);
};

const setStoredTabPreference = (bomType: string, tabId: string) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(`${VIEW_PREFERENCE_PREFIX}-${bomType}`, tabId);
};

const secondaryActionButtonClass =
  'rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-600 transition-colors hover:border-blue-300 hover:text-blue-600';
const primaryActionButtonClass =
  'rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white shadow-sm hover:bg-blue-700';

/* Simulation interfaces added */
/* Component */
export default function ProductStructure({ tbomLink = null }: ProductStructureProps) {
  const router = useRouter();
  const [selectedBomType, setSelectedBomType] = useState(() => {
    if (!tbomLink?.domain) return 'requirement';
    if (tbomLink.domain === 'simulation') return 'simulation';
    if (tbomLink.domain === 'ebom') return 'test';
    if (tbomLink.domain === 'physical') return 'test';
    return 'requirement';
  });
  const [expandedNodes, setExpandedNodes] = useState<string[]>(['001']);
  const [selectedNode, setSelectedNode] = useState<string | null>(tbomLink?.node ?? null);
  const [selectedRole, setSelectedRole] = useState('system');
  const [selectedRequirementRole, setSelectedRequirementRole] = useState<RequirementRoleKey>('system-team');
  const [selectedVersion, setSelectedVersion] = useState('v2.1');
  const [activeTab, setActiveTab] = useState(() => {
    if (!tbomLink?.domain) return 'module-home';
    if (tbomLink.domain === 'requirement') return 'requirement';
    if (tbomLink.domain === 'simulation') return 'simulation';
    if (tbomLink.domain === 'ebom') return 'structure';
    if (tbomLink.domain === 'physical') return 'structure';
    return 'module-home';
  });
  const [showDetailedReport, setShowDetailedReport] = useState(false);
  const [activePhase, setActivePhase] = useState('concept');
  const [requirementsInView, setRequirementsInView] = useState(false);
  const [jumpHistory, setJumpHistory] = useState<JumpEntry[]>([]);
  const [pendingRequirementFocus, setPendingRequirementFocus] = useState<string | null>(null);
  const [pendingTreeScrollTarget, setPendingTreeScrollTarget] = useState<string | null>(null);
  const [pendingSimulationSelection, setPendingSimulationSelection] = useState<SimulationJumpSelection | null>(null);
  const [simulationJumpFeedback, setSimulationJumpFeedback] = useState<SimulationJumpFeedback | null>(null);
  const [simulationWarningToast, setSimulationWarningToast] = useState<SimulationJumpFeedback | null>(null);
  const [skipNextTabPersistence, setSkipNextTabPersistence] = useState(false);
  const autoTransitionRef = useRef(false);
  const previousBomTypeRef = useRef(selectedBomType);
  const previousActiveTabRef = useRef(activeTab);
  const treeContainerRef = useRef<HTMLDivElement | null>(null);
  const requirementIdToNodeMap = useMemo(() => {
    const map = new Map<string, string>();
    Object.entries(requirementsByNode).forEach(([nodeId, list]) => {
      list.forEach((req) => {
        map.set(req.id, nodeId);
      });
    });
    return map;
  }, []);
  const getRequirementNodeIdForRequirement = useCallback(
    (requirementId: string) => requirementIdToNodeMap.get(requirementId) ?? null,
    [requirementIdToNodeMap]
  );
  const getRequirementNodePath = useCallback((targetId: string | null) => {
    if (!targetId) return null;
    const path: string[] = [];
    const dfs = (nodes: BomNode[], trail: string[]): boolean => {
      for (const node of nodes) {
        const nextTrail = [...trail, node.id];
        if (node.id === targetId) {
          path.push(...nextTrail);
          return true;
        }
        if (node.children && dfs(node.children, nextTrail)) {
          return true;
        }
      }
      return false;
    };
    dfs(REQUIREMENT_BOM_TREE, []);
    return path.length ? path : null;
  }, []);
  const clearJumpHistory = useCallback(() => {
    setJumpHistory((prev) => {
      if (!prev.length) return prev;
      if (typeof window !== 'undefined') {
        console.debug('[ProductStructure] jump stack length: 0');
      }
      return [];
    });
    setPendingRequirementFocus(null);
    setPendingTreeScrollTarget(null);
    setPendingSimulationSelection(null);
    setSimulationJumpFeedback(null);
    setSimulationWarningToast(null);
  }, []);

  useEffect(() => {
    if (!tbomLink) {
      return;
    }
    if (tbomLink.domain === 'requirement' && tbomLink.requirementId) {
      setSelectedBomType('requirement');
      setActiveTab('requirement');
      setPendingRequirementFocus(tbomLink.requirementId);
      const requirementNodeId = getRequirementNodeIdForRequirement(tbomLink.requirementId);
      if (requirementNodeId) {
        setSelectedNode(requirementNodeId);
        setPendingTreeScrollTarget(requirementNodeId);
      }
      return;
    }
    if (tbomLink.domain === 'simulation' && tbomLink.simulationRef) {
      const target = resolveSimulationJumpTarget(tbomLink.simulationRef, tbomLink.node);
      if (target) {
        setSelectedBomType('simulation');
        setActiveTab('simulation');
        setPendingSimulationSelection({
          categoryId: target.categoryId,
          instanceId: target.instanceId,
          defaultVersion: target.defaultVersion,
          simBomRefId: target.simBomRefId,
          sourceNodeId: tbomLink.node ?? null,
          sourceNodeName: tbomLink.path ?? tbomLink.node ?? null,
        });
      }
      return;
    }
    if (tbomLink.domain === 'ebom' && tbomLink.node) {
      setSelectedBomType((prev) => (prev === 'simulation' ? prev : 'test'));
      setActiveTab('structure');
      setSelectedNode(tbomLink.node);
      setPendingTreeScrollTarget(tbomLink.node);
      return;
    }
    if (tbomLink.domain === 'physical') {
      setSelectedBomType('test');
      setActiveTab('structure');
    }
  }, [getRequirementNodeIdForRequirement, tbomLink]);

  const dismissSimulationFeedback = useCallback(() => {
    setSimulationJumpFeedback(null);
  }, []);

  const dismissSimulationToast = useCallback(() => {
    setSimulationWarningToast(null);
  }, []);

  const pushSimulationWarning = useCallback((message: string) => {
    setSimulationWarningToast({ type: 'warning', message, timestamp: Date.now() });
  }, []);

  const tbomTargetNode = tbomLink?.node ?? null;

  const handleRequirementJump = useCallback((requirementId: string) => {
    setActiveTab('definition');
    setPendingRequirementFocus(requirementId);
  }, []);

  const handleReturnToTbom = useCallback(() => {
    const params = new URLSearchParams();
    params.set('module', 'structure');
    params.set('domain', 'ebom');
    params.set('from', 'tbom');
    params.set('restore', '1');
    if (tbomTargetNode) {
      params.set('node', tbomTargetNode);
    }
    router.push(`/?${params.toString()}`);
  }, [router, tbomTargetNode]);

  
  const {
    state: simulationState,
    dispatch: simulationDispatch,
    category: currentSimulationCategory,
    instance: currentSimulationInstance,
    instanceSnapshot: currentSimulationSnapshot,
    folder: currentSimulationFolder,
    files: currentSimulationFiles,
    activeInstanceVersion: currentSimulationVersion,
    versionNotice: simulationVersionNotice
  } = useSimulationExplorerState();
  const [previewSimulationFile, setPreviewSimulationFile] = useState<SimulationFile | null>(null);
  const [isSimulationNavOpen, setIsSimulationNavOpen] = useState(false);
  const [compareToast, setCompareToast] = useState<{ label: string; type: 'file' | 'instance' } | null>(null);
  const [isDimensionManagerOpen, setIsDimensionManagerOpen] = useState(false);
  const dimensionManagerAnchorRef = useRef<HTMLButtonElement | null>(null);
  const testPanelRef = useRef<HTMLDivElement | null>(null);

  const [testingState, testingActions] = useTestingExplorerState(TEST_PROJECTS);
  const {
    selectNode: selectTestingNode,
    toggleExpand: toggleTestingNode,
    selectProjectById: selectTestingProject,
    selectItemById: selectTestingItem,
    reset: resetTestingState
  } = testingActions;
  const {
    linkedRunEntries,
    tbomImportState,
    tbomImportActions,
    latestImportLog,
    latestImportStats,
    runDetailContext,
    runDetailError,
    isRunDetailLoading,
    ensureTbomData,
    openRunDetail: handleOpenRunDetail,
    closeRunDetail,
    resetRunDetailError,
  } = useTbomPanelState({ tbomTargetNode });

  useEffect(() => {
    resetRunDetailError();
  }, [testingState.selectedItem, resetRunDetailError]);

  useEffect(() => {
    if (selectedBomType !== 'test') {
      closeRunDetail();
      return;
    }

    ensureTbomData().catch((error) => {
      console.error('[ProductStructure] 预加载 TBOM 数据失败', error);
    });
  }, [selectedBomType, ensureTbomData, closeRunDetail]);

  const toggleDimensionManager = useCallback(() => {
    setIsDimensionManagerOpen(prev => !prev);
  }, []);

  useEffect(() => {
    const canShowSimulationNav = activeTab === 'simulation' && (selectedBomType === 'solution' || selectedBomType === 'simulation');
    if (!canShowSimulationNav) {
      setIsSimulationNavOpen(false);
    }
  }, [activeTab, selectedBomType]);

  useEffect(() => {
    if (!isSimulationNavOpen) {
      setIsDimensionManagerOpen(false);
    }
  }, [isSimulationNavOpen]);

  useEffect(() => {
    if (!simulationState.lastCompareEvent) return;
    setCompareToast({
      label: simulationState.lastCompareEvent.label,
      type: simulationState.lastCompareEvent.type
    });
    const timer = window.setTimeout(() => setCompareToast(null), 2400);
    return () => window.clearTimeout(timer);
  }, [simulationState.lastCompareEvent]);

  useEffect(() => {
    if (!simulationJumpFeedback || simulationJumpFeedback.type !== 'info') return;
    const timer = window.setTimeout(() => setSimulationJumpFeedback(null), 3200);
    return () => window.clearTimeout(timer);
  }, [simulationJumpFeedback]);

  useEffect(() => {
    if (!simulationWarningToast) return;
    const timer = window.setTimeout(() => setSimulationWarningToast(null), 4800);
    return () => window.clearTimeout(timer);
  }, [simulationWarningToast]);

  useEffect(() => {
    const isSimulationViewActive = activeTab === 'simulation' && (selectedBomType === 'solution' || selectedBomType === 'simulation');
    if (!isSimulationViewActive) {
      setPreviewSimulationFile(null);
      return;
    }
    const node = simulationState.selectedNode;
    if (node?.type === 'file') {
      const file = currentSimulationFiles.find(f => f.id === node.fileId);
      if (file) {
        setPreviewSimulationFile(file);
        return;
      }
    }
    setPreviewSimulationFile(null);
  }, [activeTab, selectedBomType, simulationState.selectedNode, currentSimulationFiles]);

  const isSimulationBom = selectedBomType === 'simulation';
  const isTestBom = selectedBomType === 'test';
  const activeDimensionsForTree = isSimulationBom ? simulationState.activeDimensions : NON_SIMULATION_DIMENSIONS;

  useEffect(() => {
    if (!isSimulationBom) {
      setIsDimensionManagerOpen(false);
    }
  }, [isSimulationBom]);

  const handleNodeSelect = useCallback(
    (ref: TreeNodeReference) => {
      simulationDispatch({ type: 'SELECT_NODE', payload: ref });
      setIsSimulationNavOpen(false);
    },
    [simulationDispatch]
  );

  const handleToggleExpand = useCallback(
    (id: string) => {
      simulationDispatch({ type: 'TOGGLE_EXPAND', payload: id });
    },
    [simulationDispatch]
  );

  const handleLoadMoreNav = useCallback(() => {
    simulationDispatch({
      type: 'SET_NAV_VISIBLE_COUNT',
      payload: simulationState.navVisibleCount + simulationState.navPageSize
    });
  }, [simulationDispatch, simulationState.navVisibleCount, simulationState.navPageSize]);

  useEffect(() => {
    if (!pendingSimulationSelection) return;
    if (selectedBomType !== 'simulation' || activeTab !== 'simulation') return;

    const { categoryId, instanceId, defaultVersion, simBomRefId, sourceNodeName } = pendingSimulationSelection;

    if (!simulationState.activeDimensions.includes('structure')) {
      simulationDispatch({ type: 'SET_ACTIVE_DIMENSIONS', payload: ['structure', ...simulationState.activeDimensions] });
      return;
    }

    const category = simulationState.categories.find(cat => cat.id === categoryId);
    const instance = category?.instances.find(inst => inst.id === instanceId);
    if (!category || !instance) {
      const warning = simBomRefId
        ? `未找到仿真实例映射（${simBomRefId}），请在仿真 BOM 中手动定位。`
        : '未找到仿真实例映射，请在仿真 BOM 中手动定位。';
      pushSimulationWarning(warning);
      setPendingSimulationSelection(null);
      return;
    }

    if (defaultVersion && simulationState.selectedInstanceVersions[instanceId] !== defaultVersion) {
      simulationDispatch({ type: 'SET_INSTANCE_VERSION', payload: { instanceId, version: defaultVersion } });
      return;
    }

    const structurePath = Array.isArray(instance.structurePath) ? instance.structurePath : [];
    for (const structureId of structurePath) {
      const nodeId = `dimension:structure:${structureId}`;
      if (!simulationState.expandedNodeIds.includes(nodeId)) {
        simulationDispatch({ type: 'TOGGLE_EXPAND', payload: nodeId });
        return;
      }
    }

    handleNodeSelect({ type: 'instance', categoryId, instanceId });
    setPendingSimulationSelection(null);
    const infoMessage = sourceNodeName
      ? `已定位到仿真实例「${instance.name}」，来源：${sourceNodeName}`
      : `已定位到仿真实例「${instance.name}」`;
    setSimulationJumpFeedback({ type: 'info', message: infoMessage, timestamp: Date.now() });
  }, [
    pendingSimulationSelection,
    selectedBomType,
    activeTab,
    simulationState,
    simulationDispatch,
    handleNodeSelect,
    pushSimulationWarning,
  ]);

  const handleActiveDimensionsChange = useCallback(
    (next: SimulationDimension[]) => {
      simulationDispatch({ type: 'SET_ACTIVE_DIMENSIONS', payload: next });
    },
    [simulationDispatch]
  );

  const handleResetDimensions = useCallback(() => {
    handleActiveDimensionsChange(['structure']);
    setIsDimensionManagerOpen(false);
  }, [handleActiveDimensionsChange]);

  const handleSaveCurrentView = useCallback(
    (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      simulationDispatch({
        type: 'SAVE_VIEW',
        payload: {
          id: `view-${Date.now()}`,
          name: trimmed,
          createdAt: new Date().toISOString(),
          dimensions: simulationState.activeDimensions,
          searchKeyword: simulationState.searchKeyword,
          filters: simulationState.filters
        }
      });
    },
    [simulationDispatch, simulationState.activeDimensions, simulationState.filters, simulationState.searchKeyword]
  );

  const handleSaveViewShortcut = useCallback(() => {
    if (typeof window === 'undefined') return;
    const suggested = `组合 ${simulationState.savedViews.length + 1}`;
    const input = window.prompt('保存当前维度组合名称（≤30 字符）', suggested);
    if (!input) return;
    const trimmed = input.trim().slice(0, 30);
    if (!trimmed) return;
    handleSaveCurrentView(trimmed);
  }, [handleSaveCurrentView, simulationState.savedViews.length]);

  const handleApplySavedView = useCallback(
    (viewId: string) => {
      const targetView = simulationState.savedViews.find(view => view.id === viewId);
      if (!targetView) return;
      simulationDispatch({ type: 'APPLY_VIEW', payload: targetView });
    },
    [simulationDispatch, simulationState.savedViews]
  );

  const handleDeleteSavedView = useCallback(
    (viewId: string) => {
      simulationDispatch({ type: 'DELETE_VIEW', payload: viewId });
    },
    [simulationDispatch]
  );

  const handleRenameSavedView = useCallback(
    (viewId: string, name: string) => {
      simulationDispatch({ type: 'RENAME_VIEW', payload: { id: viewId, name } });
    },
    [simulationDispatch]
  );

  const simulationTreeBaseProps = useMemo(
    () => ({
      categories: simulationState.categories,
      activeDimensions: activeDimensionsForTree,
      selectedNode: simulationState.selectedNode,
      expandedNodeIds: simulationState.expandedNodeIds,
      navVisibleCount: simulationState.navVisibleCount,
      navPageSize: simulationState.navPageSize,
      onToggleExpand: handleToggleExpand,
      onSelectNode: handleNodeSelect,
      onLoadMore: handleLoadMoreNav
    }),
    [
      activeDimensionsForTree,
      simulationState.categories,
      simulationState.expandedNodeIds,
      simulationState.navPageSize,
      simulationState.navVisibleCount,
      simulationState.selectedNode,
      handleToggleExpand,
      handleNodeSelect,
      handleLoadMoreNav
    ]
  );

  const renderSimulationNavTree = () => (
    <div className="relative flex h-full flex-col">
      <SimulationDimensionManager
        open={isDimensionManagerOpen}
        anchorRef={dimensionManagerAnchorRef}
        onClose={() => setIsDimensionManagerOpen(false)}
        activeDimensions={simulationState.activeDimensions}
        onChange={handleActiveDimensionsChange}
        savedViews={simulationState.savedViews}
        onSaveView={handleSaveCurrentView}
        onApplySavedView={handleApplySavedView}
        onDeleteSavedView={handleDeleteSavedView}
        onRenameSavedView={handleRenameSavedView}
      />
      <div className="flex-1 overflow-hidden">
        <SimulationTreePanel
          {...simulationTreeBaseProps}
          headerActions={
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="inline-flex h-8 w-8 items-center justify-center rounded border border-gray-200 text-gray-600 hover:border-blue-200 hover:text-blue-600"
                onClick={handleResetDimensions}
                title="重置组合"
                aria-label="重置组合"
              >
                <i className="ri-refresh-line text-sm" />
              </button>
              <button
                type="button"
                className="inline-flex h-8 w-8 items-center justify-center rounded border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100"
                onClick={handleSaveViewShortcut}
                title="保存当前维度组合"
                aria-label="保存当前维度组合"
              >
                <i className="ri-save-3-line text-sm" />
              </button>
              <button
                type="button"
                ref={dimensionManagerAnchorRef}
                onClick={toggleDimensionManager}
                className={`inline-flex h-8 w-8 items-center justify-center rounded border ${
                  isDimensionManagerOpen
                    ? 'border-blue-300 bg-blue-50 text-blue-600'
                    : 'border-gray-200 text-gray-600 hover:border-blue-200 hover:text-blue-600'
                }`}
                aria-expanded={isDimensionManagerOpen}
                aria-controls="simulation-dimension-manager"
                title="管理维度组合"
                aria-label="管理维度组合"
              >
                <i className="ri-equalizer-line text-sm" />
              </button>
            </div>
          }
        />
      </div>
    </div>
  );

  const renderSolutionTree = () => <SimulationTreePanel {...simulationTreeBaseProps} />;

  const renderDesktopTree = () => {
    if (isSimulationBom) {
      return null;
    }
    return renderSolutionTree();
  };

  const renderOverlayTree = () => (isSimulationBom ? renderSimulationNavTree() : renderSolutionTree());

  const versions: Version[] = SOLUTION_VERSIONS;
  const solutionOverview = SOLUTION_OVERVIEW;
  const roles = [
    { id: 'system', name: '系统组', icon: 'ri-stack-line' },
    { id: 'assembly', name: '总装专家', icon: 'ri-tools-line' },
    { id: 'component', name: '部件负责人', icon: 'ri-puzzle-line' }
  ];
  const [contentScrolled, setContentScrolled] = useState(false);
  const [pendingDeepLink, setPendingDeepLink] = useState<string | null>(null);
  // 需求视图的全局筛选（与需求面板联动）
  const [requirementFilters, setRequirementFilters] = useState({
    keyword: '',
    status: 'all' as 'all' | 'in-progress' | 'pending' | 'completed',
    priority: 'all' as 'all' | 'high' | 'medium' | 'low',
    type: 'all' as 'all' | 'performance' | 'functional' | 'interface' | 'quality',
    showOnlyLinked: false,
  });

  const bomTypes: BomType[] = [
    // 调整顺序：需求BOM 放在 方案BOM 前面
    { id: 'requirement', name: '需求BOM', count: 23, icon: 'ri-file-list-2-line', color: 'green' },
    { id: 'solution', name: '方案BOM', count: 15, icon: 'ri-lightbulb-line', color: 'blue' },
    { id: 'design', name: '设计BOM', count: 45, icon: 'ri-pencil-ruler-2-line', color: 'purple' },
    { id: 'simulation', name: '仿真BOM', count: 32, icon: 'ri-computer-line', color: 'orange' },
    { id: 'test', name: '试验BOM', count: 18, icon: 'ri-test-tube-line', color: 'red' },
    { id: 'physical', name: '实物BOM', count: 67, icon: 'ri-cube-line', color: 'indigo' }
  ];

  // 根据BOM类型获取对应的数据结构
  const getBomStructureData = (): BomNode[] => {
    const solutionStructure: BomNode[] = [
      {
          id: '001',
          name: '航空发动机总成',
          level: 0,
          bomType: 'solution',
          unitType: 'product',
          nodeCategory: 'assembly',
          children: [
            {
              id: '001-01',
              name: '推进系统',
              level: 1,
              bomType: 'solution',
              unitType: 'system',
              nodeCategory: 'system',
              children: [
                {
                  id: '001-01-01',
                  name: '压气机分系统',
                  level: 2,
                  bomType: 'solution',
                  unitType: 'subsystem',
                  subsystemType: 'compressor',
                  nodeCategory: 'subsystem',
                  children: [
                    {
                      id: '001-01-01-A',
                      name: '方案A-三级低压设计',
                      level: 3,
                      bomType: 'solution',
                      unitType: 'design_scheme_a',
                      nodeCategory: 'component',
                      schemeType: 'A'
                    },
                    {
                      id: '001-01-01-B',
                      name: '方案B-二级低压设计',
                      level: 3,
                      bomType: 'solution',
                      unitType: 'design_scheme_b',
                      nodeCategory: 'component',
                      schemeType: 'B'
                    }
                  ]
                },
                {
                  id: '001-01-02',
                  name: '燃烧室分系统',
                  level: 2,
                  bomType: 'solution',
                  unitType: 'subsystem',
                  nodeCategory: 'subsystem',
                  children: [
                    {
                      id: '001-01-02-A',
                      name: '方案A-环形燃烧室',
                      level: 3,
                      bomType: 'solution',
                      unitType: 'design_scheme_a',
                      nodeCategory: 'component',
                      schemeType: 'A'
                    },
                    {
                      id: '001-01-02-B',
                      name: '方案B-管形燃烧室',
                      level: 3,
                      bomType: 'solution',
                      unitType: 'design_scheme_b',
                      nodeCategory: 'component',
                      schemeType: 'B'
                    }
                  ]
                }
              ]
            },
            {
              id: '001-02',
              name: '控制系统',
              level: 1,
              bomType: 'solution',
              unitType: 'system',
              nodeCategory: 'system',
              children: [
                {
                  id: '001-02-01',
                  name: '燃油控制分系统',
                  level: 2,
                  bomType: 'solution',
                  unitType: 'subsystem',
                  nodeCategory: 'subsystem',
                  children: [
                    {
                      id: '001-02-01-A',
                      name: '方案A-FADEC控制',
                      level: 3,
                      bomType: 'solution',
                      unitType: 'design_scheme_a',
                      nodeCategory: 'component',
                      schemeType: 'A'
                    }
                  ]
                }
              ]
            }
          ]
      }
    ];

    if (selectedBomType === 'solution') {
      return solutionStructure;
    }

    if (selectedBomType === 'simulation') {
      return mapBomType(solutionStructure, 'simulation');
    }

    if (selectedBomType === 'requirement') {
      return REQUIREMENT_BOM_TREE;
    }

    // 设计BOM（E-BOM）树
    if (selectedBomType === 'design') {
      const current = EBOM_BASELINES[EBOM_BASELINES.length - 1]; // 使用最新基线作为浏览树
      const convert = (n: any, level = 0): BomNode => ({
        id: n.id,
        name: `${n.name}`,
        level,
        bomType: 'design',
        unitType: 'part',
        nodeCategory: n.phantom ? 'phantom' : 'part',
        children: (n.children || []).map((c: any) => convert(c, level + 1))
      });
      return [convert(current.root, 0)];
    }

    // 默认返回空数组
    return [];
  };

  const handleBomTypeChange = useCallback((bomTypeId: string) => {
    const auto = autoTransitionRef.current;
    if (!auto && selectedBomType === 'requirement' && bomTypeId !== 'requirement') {
      clearJumpHistory();
    }
    setSelectedBomType(bomTypeId);
    setSelectedNode(null);

    if (bomTypeId === 'solution') {
      setActiveTab('structure');
      setExpandedNodes(['001']);
      setSelectedRole('system');
      setCompareToast(null);
    } else if (bomTypeId === 'simulation') {
      setActiveTab('simulation');
      setExpandedNodes(['001']);
      setIsSimulationNavOpen(false);
      setPreviewSimulationFile(null);
      setCompareToast(null);
      simulationDispatch({ type: 'RESET' });
    } else if (bomTypeId === 'test') {
      setActiveTab('structure');
      resetTestingState();
    } else if (bomTypeId === 'requirement') {
      setActiveTab('requirement');
      setExpandedNodes(['REQ-ENGINE-001']);
      setSelectedRequirementRole('system-team');
    } else if (bomTypeId === 'design') {
      setActiveTab('structure');
      setExpandedNodes(['EBOM-ROOT']);
      setSelectedNode('EBOM-ROOT');
    } else {
      setActiveTab('structure');
      setExpandedNodes([]);
    }
  }, [selectedBomType, clearJumpHistory, simulationDispatch, resetTestingState]);

  const handleHomeNavigate = useCallback(
    (target: { bomType: 'solution' | 'simulation' | 'test' | 'design' | 'requirement'; tab?: string }) => {
      autoTransitionRef.current = true;
      handleBomTypeChange(target.bomType);
      if (target.tab) {
        setActiveTab(target.tab);
      }
    },
    [handleBomTypeChange, setActiveTab]
  );

  // 读取对比中心写入的 EBOM 定位指令（一次性消费）
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem('ebomDeepLink');
      if (raw) {
        const obj = JSON.parse(raw);
        if (obj && obj.module === 'structure' && obj.bomType === 'design' && typeof obj.nodeId === 'string') {
          setPendingDeepLink(obj.nodeId);
          if (selectedBomType !== 'design') {
            handleBomTypeChange('design');
          }
        }
      }
    } catch {}
  }, [selectedBomType, handleBomTypeChange]);

  // 在设计BOM视图就绪后定位到目标节点并展开父层
  useEffect(() => {
    if (selectedBomType !== 'design' || !pendingDeepLink) return;
    const root = EBOM_BASELINES[EBOM_BASELINES.length - 1].root as any;
    const pathIds: string[] = [];
    const walk = (n: any, path: string[]): boolean => {
      if (n.id === pendingDeepLink) { pathIds.push(...path); return true; }
      for (const c of (n.children || [])) {
        if (walk(c, [...path, c.id])) return true;
      }
      return false;
    };
    walk(root, [root.id]);
    if (pathIds.length) {
      setExpandedNodes(prev => Array.from(new Set([...prev, ...pathIds])));
      setSelectedNode(pendingDeepLink);
    }
    try { window.localStorage.removeItem('ebomDeepLink'); } catch {}
    setPendingDeepLink(null);
  }, [selectedBomType, pendingDeepLink]);

  const bomStructureData = getBomStructureData();
  const currentRequirementNode = selectedNode ? findNodeById(selectedNode, bomStructureData) : null;
  const currentRequirementList = selectedNode ? requirementsByNode[selectedNode] || [] : [];
  const requirementStats = {
    total: currentRequirementList.length,
    high: currentRequirementList.filter(item => item.priority === 'high').length,
    inProgress: currentRequirementList.filter(item => item.status === 'in-progress').length,
    pending: currentRequirementList.filter(item => item.status === 'pending').length
  };

  const handleNavigateRequirement = useCallback(
    ({
      requirementIds,
      sourceNodeId,
      sourceNodeName,
    }: {
      requirementIds: string[];
      sourceNodeId?: string | null;
      sourceNodeName?: string | null;
    }) => {
      if (!requirementIds?.length) return;
      const firstRequirementId = requirementIds[0];
      const targetRequirementNodeId = getRequirementNodeIdForRequirement(firstRequirementId);
      const resolvedSourceNodeId = sourceNodeId ?? selectedNode ?? null;
      let resolvedSourceName = sourceNodeName ?? null;
      if (!resolvedSourceName && resolvedSourceNodeId) {
        const sourceNode = findNodeById(resolvedSourceNodeId, bomStructureData);
        resolvedSourceName = sourceNode?.name ?? null;
      }

      const entry: JumpEntry = {
        kind: 'requirement',
        fromBomType: selectedBomType,
        fromTab: activeTab,
        fromNodeId: selectedNode,
        fromExpandedNodes: [...expandedNodes],
        targetBomType: 'requirement',
        targetTab: 'requirement',
        requirementIds: [...requirementIds],
        sourceNodeId: resolvedSourceNodeId,
        sourceNodeName: resolvedSourceName,
        createdAt: Date.now(),
      };

      autoTransitionRef.current = true;
      setJumpHistory((prev) => {
        const next = [...prev, entry];
        if (typeof window !== 'undefined') {
          console.debug('[ProductStructure] jump stack length:', next.length);
        }
        return next;
      });

      const path = getRequirementNodePath(targetRequirementNodeId);
      const expandIds = path ? path.slice(0, -1) : ['REQ-ENGINE-001'];
      const uniqueExpandIds = Array.from(new Set(expandIds.length ? expandIds : ['REQ-ENGINE-001']));
      setExpandedNodes(uniqueExpandIds);
      setSkipNextTabPersistence(true);
      setSelectedBomType('requirement');
      setActiveTab('requirement');
      setSelectedRequirementRole('system-team');
      const resolvedRequirementNode = targetRequirementNodeId ?? 'REQ-ENGINE-001';
      setSelectedNode(resolvedRequirementNode);
      setPendingRequirementFocus(firstRequirementId);
      setPendingTreeScrollTarget(resolvedRequirementNode);
    },
    [
      selectedBomType,
      activeTab,
      selectedNode,
      expandedNodes,
      bomStructureData,
      getRequirementNodeIdForRequirement,
      getRequirementNodePath,
    ]
  );

  const handleNavigateSimulation = useCallback(
    ({
      simBomRefId,
      nodeId,
      sourceNodeId,
      sourceNodeName,
    }: {
      simBomRefId?: string | null;
      nodeId?: string | null;
      sourceNodeId?: string | null;
      sourceNodeName?: string | null;
    }) => {
      const resolvedSourceNodeId = sourceNodeId ?? selectedNode ?? null;
      let resolvedSourceName = sourceNodeName ?? null;
      if (!resolvedSourceName && resolvedSourceNodeId) {
        const sourceNode = findNodeById(resolvedSourceNodeId, bomStructureData);
        resolvedSourceName = sourceNode?.name ?? null;
      }

      const target = resolveSimulationJumpTarget(simBomRefId ?? undefined, nodeId ?? undefined);

      const entry: JumpEntry = {
        kind: 'simulation',
        fromBomType: selectedBomType,
        fromTab: activeTab,
        fromNodeId: selectedNode,
        fromExpandedNodes: [...expandedNodes],
        targetBomType: 'simulation',
        targetTab: 'simulation',
        simulationTarget: target
          ? {
              simBomRefId: simBomRefId ?? null,
              categoryId: target.categoryId,
              instanceId: target.instanceId,
              defaultVersion: target.defaultVersion,
            }
          : undefined,
        sourceNodeId: resolvedSourceNodeId,
        sourceNodeName: resolvedSourceName,
        createdAt: Date.now(),
      };

      autoTransitionRef.current = true;
      setJumpHistory((prev) => {
        const next = [...prev, entry];
        if (typeof window !== 'undefined') {
          console.debug('[ProductStructure] jump stack length:', next.length);
        }
        return next;
      });

      setSkipNextTabPersistence(true);
      setSelectedBomType('simulation');
      setActiveTab('simulation');
      setPendingRequirementFocus(null);
      setPendingTreeScrollTarget(null);
      setSimulationJumpFeedback(null);
      setSimulationWarningToast(null);

      if (target) {
        setPendingSimulationSelection({
          categoryId: target.categoryId,
          instanceId: target.instanceId,
          defaultVersion: target.defaultVersion,
          simBomRefId: simBomRefId ?? null,
          sourceNodeId: resolvedSourceNodeId,
          sourceNodeName: resolvedSourceName,
        });
      } else {
        setPendingSimulationSelection(null);
        if (simBomRefId) {
          const warning = SIMULATION_JUMP_UNMAPPED.has(simBomRefId)
            ? `仿真映射暂未配置（${simBomRefId}），请在仿真 BOM 中手动定位。`
            : `暂未找到仿真映射（${simBomRefId}），已停留在默认仿真视图。`;
          pushSimulationWarning(warning);
        } else {
          pushSimulationWarning('暂未配置仿真映射，已停留在默认仿真视图。');
        }
      }

      simulationDispatch({ type: 'RESET' });
    },
    [
      activeTab,
      bomStructureData,
      expandedNodes,
      selectedBomType,
      selectedNode,
      simulationDispatch,
      pushSimulationWarning,
    ]
  );

  const handleJumpBack = useCallback(() => {
    if (!jumpHistory.length) return;
    const entry = jumpHistory[jumpHistory.length - 1];
    autoTransitionRef.current = true;
    setSkipNextTabPersistence(true);
    setJumpHistory((prev) => {
      const next = prev.slice(0, -1);
      if (typeof window !== 'undefined') {
        console.debug('[ProductStructure] jump stack length:', next.length);
      }
      return next;
    });
    setSelectedBomType(entry.fromBomType);
    setActiveTab(entry.fromTab);
    setExpandedNodes(entry.fromExpandedNodes.length ? [...entry.fromExpandedNodes] : []);
    setSelectedNode(entry.fromNodeId ?? null);
    setPendingRequirementFocus(null);
    setPendingTreeScrollTarget(entry.fromNodeId ?? null);
    setPendingSimulationSelection(null);
    setSimulationJumpFeedback(null);
    if (entry.kind === 'simulation') {
      simulationDispatch({ type: 'RESET' });
    }
  }, [jumpHistory, simulationDispatch]);

  const latestJump = jumpHistory.length ? jumpHistory[jumpHistory.length - 1] : null;
  const isInJumpContext = Boolean(
    latestJump && selectedBomType === latestJump.targetBomType && activeTab === latestJump.targetTab,
  );
  const isRequirementJumpContext = Boolean(isInJumpContext && latestJump?.kind === 'requirement');
  const isSimulationJumpContext = Boolean(isInJumpContext && latestJump?.kind === 'simulation');
  const backButtonLabel = latestJump
    ? `返回${BOM_TYPE_LABELS[latestJump.fromBomType] ?? '上一视图'}${latestJump.sourceNodeName ? ` · ${latestJump.sourceNodeName}` : ''}`
    : '';
  const toggleNodeExpansion = (nodeId: string) => {
    setExpandedNodes(prev => 
      prev.includes(nodeId)
        ? prev.filter(id => id !== nodeId)
        : [...prev, nodeId]
    );
  };

  const handleNodeClick = (nodeId: string) => {
    setSelectedNode(nodeId);

    // 需求BOM点击节点时自动切换到需求Tab
    if (selectedBomType === 'requirement') {
      setActiveTab('requirement');
    }

    // 根据节点自动切换身份（方案BOM时）
    if (selectedBomType === 'solution') {
      const node = findNodeById(nodeId, bomStructureData);
      if (node) {
        if (node.nodeCategory === 'assembly') {
          setSelectedRole('system');
        } else if (node.nodeCategory === 'system') {
          setSelectedRole('assembly');
          // 点击系统级节点（如推进系统）时，直接进入“产品定义”视图
          setActiveTab('definition');
        } else if (node.nodeCategory === 'subsystem' || node.nodeCategory === 'component') {
          setSelectedRole('component');
        }
      }
    }
  };

  const handleHeatmapNodeSelect = (nodeId: string) => {
    handleNodeClick(nodeId);
    setActiveTab('test');
  };

  const getFirstAvailableNode = (nodes: BomNode[]): BomNode | null => {
    if (!nodes || nodes.length === 0) return null;
    const [firstNode] = nodes;
    if (!firstNode) return null;
    if (firstNode.children && firstNode.children.length > 0) {
      return firstNode;
    }
    return firstNode;
  };

  useEffect(() => {
    if (autoTransitionRef.current) {
      autoTransitionRef.current = false;
      return;
    }
    if (!bomStructureData.length) return;
    const firstNode = getFirstAvailableNode(bomStructureData);
    if (firstNode) {
      handleNodeClick(firstNode.id);
    }

    const storedTab = getStoredTabPreference(selectedBomType);
    const normalizedTab = storedTab === 'solution' ? 'overview' : storedTab;
    const typeTabs = selectedBomType === 'solution'
      ? ['overview', 'definition', 'design', 'simulation', 'test', 'process', 'management']
      : selectedBomType === 'simulation'
      ? ['simulation']
      : selectedBomType === 'requirement'
      ? ['requirement']
      : selectedBomType === 'design'
      ? ['structure', 'cockpit']
      : ['structure'];

    const availableTabs = ['module-home', ...typeTabs];

    if (normalizedTab && availableTabs.includes(normalizedTab)) {
      setActiveTab(normalizedTab);
      return;
    }

    if (activeTab === 'module-home') {
      return;
    }

    if (typeTabs.length > 0) {
      setActiveTab(typeTabs[0]);
    } else {
      setActiveTab('module-home');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBomType]);

  useEffect(() => {
    if (skipNextTabPersistence) {
      setSkipNextTabPersistence(false);
      return;
    }
    setStoredTabPreference(selectedBomType, activeTab);
  }, [activeTab, selectedBomType, skipNextTabPersistence]);

  useEffect(() => {
    if (previousBomTypeRef.current === 'requirement' && selectedBomType !== 'requirement' && !autoTransitionRef.current) {
      clearJumpHistory();
    }
    previousBomTypeRef.current = selectedBomType;
  }, [selectedBomType, clearJumpHistory]);

  useEffect(() => {
    if (selectedBomType === 'requirement' && activeTab !== 'requirement' && activeTab !== 'module-home' && !autoTransitionRef.current) {
      clearJumpHistory();
    }
    previousActiveTabRef.current = activeTab;
  }, [activeTab, selectedBomType, clearJumpHistory]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!pendingTreeScrollTarget) return;
    const frame = window.requestAnimationFrame(() => {
      const container = treeContainerRef.current;
      if (!container) {
        setPendingTreeScrollTarget(null);
        return;
      }
      const el = container.querySelector<HTMLElement>(`[data-tree-node-id="${pendingTreeScrollTarget}"]`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      setPendingTreeScrollTarget(null);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [pendingTreeScrollTarget, expandedNodes, selectedBomType]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (activeTab !== 'definition') {
      setRequirementsInView(false);
      return;
    }
    const target = document.getElementById('requirements-section');
    if (!target) {
      setRequirementsInView(false);
      return;
    }
    const observer = new IntersectionObserver(
      entries => {
        const entry = entries[0];
        setRequirementsInView(entry ? entry.isIntersecting : false);
      },
      {
        rootMargin: '-120px 0px -60% 0px',
        threshold: [0, 0.25, 0.5, 0.75]
      }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [activeTab, selectedNode]);

  const getNodeIcon = (node: BomNode) => {
    if (node.bomType === 'solution') {
      if (node.schemeType) {
        return 'ri-lightbulb-line';
      }
      switch (node.nodeCategory) {
        case 'assembly': return 'ri-stack-line';
        case 'system': return 'ri-settings-4-line';
        case 'subsystem': return 'ri-puzzle-line';
        default: return 'ri-circle-line';
      }
    }
    
    if (node.bomType === 'requirement') {
      switch (node.unitType) {
        case 'product_functional_unit': return 'ri-stack-line';
        case 'subsystem_functional_unit': return 'ri-settings-4-line';
        case 'component_assembly': return 'ri-puzzle-line';
        case 'important_part': return 'ri-tools-line';
        default: return 'ri-file-list-2-line';
      }
    }
    
    switch (node.bomType) {
      case 'design': return 'ri-pencil-ruler-2-line';
      case 'simulation': return 'ri-computer-line';
      case 'test': return 'ri-test-tube-line';
      case 'physical': return 'ri-cube-line';
      default: return 'ri-circle-line';
    }
  };

const getNodeTone = (node: BomNode) => {
  if (node.bomType === 'solution' && node.schemeType) {
    return node.schemeType === 'A'
      ? { bg: 'bg-blue-50', text: 'text-blue-600' }
      : { bg: 'bg-emerald-50', text: 'text-emerald-600' };
  }

  if (node.bomType === 'requirement') {
    switch (node.unitType) {
      case 'product_functional_unit':
        return { bg: 'bg-violet-50', text: 'text-violet-600' };
      case 'subsystem_functional_unit':
        return { bg: 'bg-indigo-50', text: 'text-indigo-600' };
      case 'component_assembly':
        return { bg: 'bg-blue-50', text: 'text-blue-600' };
      case 'important_part':
        return { bg: 'bg-amber-50', text: 'text-amber-600' };
      default:
        return { bg: 'bg-slate-50', text: 'text-slate-500' };
    }
  }

  switch (node.bomType) {
    case 'solution':
      return { bg: 'bg-blue-50', text: 'text-blue-600' };
    case 'design':
      return { bg: 'bg-purple-50', text: 'text-purple-600' };
    case 'simulation':
      return { bg: 'bg-orange-50', text: 'text-orange-600' };
    case 'test':
      return { bg: 'bg-rose-50', text: 'text-rose-600' };
    case 'physical':
      return { bg: 'bg-indigo-50', text: 'text-indigo-600' };
    default:
      return { bg: 'bg-slate-100', text: 'text-slate-500' };
  }
};

const TAG_TONE_CLASS: Record<'primary' | 'warning' | 'neutral', string> = {
  primary: 'border-blue-200 text-blue-600 bg-blue-50',
  warning: 'border-amber-200 text-amber-700 bg-amber-50',
  neutral: 'border-gray-200 text-gray-500 bg-white/80',
};

const buildNodeTags = (node: BomNode) => {
  const tags: Array<{ label: string; tone: 'primary' | 'warning' | 'neutral' }> = [];

  if (node.bomType === 'requirement') {
    switch (node.unitType) {
      case 'component_assembly':
        tags.push({ label: '成附件', tone: 'primary' });
        break;
      case 'important_part':
        tags.push({ label: '重要零件', tone: 'warning' });
        break;
      case 'product_functional_unit':
        tags.push({ label: '产品级', tone: 'neutral' });
        break;
      case 'subsystem_functional_unit':
        tags.push({ label: '子系统级', tone: 'neutral' });
        break;
      default:
        break;
    }
  }

  if (node.schemeType) {
    tags.push({ label: `方案${node.schemeType}`, tone: 'neutral' });
  }

  return tags;
};

  const renderTreeNode = (node: BomNode) => {
    const isExpanded = expandedNodes.includes(node.id);
    const hasChildren = node.children && node.children.length > 0;
    const isSelected = selectedNode === node.id;
    const iconTone = getNodeTone(node);
    const tags = buildNodeTags(node);
    const primaryName = node.name.replace(/\s*\(.*?\)\s*/g, '').trim();
    const nodeTooltip = (
      <div className="max-w-[240px] space-y-1.5 text-[11px] leading-relaxed text-slate-100">
        <div className="flex items-center justify-between">
          <span className="text-slate-300">节点 ID</span>
          <span className="font-mono">{node.id}</span>
        </div>
        {node.description ? <p className="text-slate-200">{node.description}</p> : null}
        {tags.length ? (
          <div>
            <div className="text-slate-300">标签</div>
            <ul className="mt-1 space-y-0.5 text-slate-100">
              {tags.map((tag) => (
                <li key={`${node.id}-${tag.label}`}>{tag.label}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    );

    return (
      <div key={node.id}>
        <div
          className={`relative flex items-start gap-3 rounded-lg border border-transparent px-3 py-1.5 text-xs leading-5 transition-colors hover:bg-slate-50 ${
            isSelected ? 'border-blue-300 bg-white shadow-sm' : ''
          }`}
          style={{ marginLeft: `${node.level * 20}px` }}
          data-tree-node-id={node.id}
          onClick={() => handleNodeClick(node.id)}
        >
          {isSelected && <span className="absolute inset-y-1 left-1 w-1 rounded-full bg-blue-500"></span>}

          <div className="flex h-full flex-col items-center justify-start pt-0.5">
            {hasChildren ? (
              <button
                type="button"
                className="flex h-5 w-5 items-center justify-center rounded-md border border-gray-200 text-gray-400 transition hover:border-blue-200 hover:text-blue-600"
                onClick={(event) => {
                  event.stopPropagation();
                  toggleNodeExpansion(node.id);
                }}
                aria-label={isExpanded ? '收起节点' : '展开节点'}
              >
                <i className={`ri-${isExpanded ? 'subtract' : 'add'}-line text-xs`}></i>
              </button>
            ) : (
              <div className="h-5 w-5" />
            )}
          </div>

          <div className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md ${iconTone.bg} ${iconTone.text}`}>
            <i className={`${getNodeIcon(node)} text-sm`}></i>
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="flex min-w-0 items-center gap-2">
              <span className="truncate font-medium text-gray-900">{primaryName || node.name}</span>
              <Tooltip content={nodeTooltip}>
                <button
                  type="button"
                  onClick={(event) => event.stopPropagation()}
                  className="inline-flex h-5 w-5 items-center justify-center rounded-full text-slate-400 transition hover:text-blue-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-1"
                  aria-label={`查看${primaryName || node.name}详情`}
                >
                  <i className="ri-information-line text-xs" />
                  <span className="sr-only">查看{primaryName || node.name}详情</span>
                </button>
              </Tooltip>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-medium tracking-wide text-slate-400">{node.id}</span>
              {tags.length ? (
                <div className="flex flex-wrap justify-end gap-1">
                  {tags.map((tag) => (
                    <span
                      key={`${node.id}-${tag.label}`}
                      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${TAG_TONE_CLASS[tag.tone]}`}
                    >
                      {tag.label}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

        </div>

        {hasChildren && isExpanded && (
          <div>
            {node.children!.map(child => renderTreeNode(child))}
          </div>
        )}
      </div>
    );
  };

  // 渲染输入数据区域（合并版本）
  
  

  const phaseStatusStyle: Record<string, string> = {
    done: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    'in-progress': 'border-blue-200 bg-blue-50 text-blue-600',
    attention: 'border-amber-200 bg-amber-50 text-amber-700',
    pending: 'border-slate-200 bg-slate-50 text-slate-600'
  };

  const renderPhaseSwitcher = () => {
    if (!solutionOverview.phases?.length) return null;
    const active = solutionOverview.phases.find(phase => phase.id === activePhase) || solutionOverview.phases[0];

    return (
      <div className="mt-6 space-y-4">
        <div className="flex flex-wrap gap-2">
          {solutionOverview.phases.map(phase => (
            <button
              key={phase.id}
              type="button"
              onClick={() => setActivePhase(phase.id)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                activePhase === phase.id
                  ? 'border-blue-500 bg-blue-50 text-blue-600 shadow-sm'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-blue-300 hover:text-blue-600'
              }`}
              aria-pressed={activePhase === phase.id}
            >
              <span>{phase.label}</span>
              <span className="ml-2 text-[11px] text-gray-400">{phase.timeline}</span>
            </button>
          ))}
        </div>

        {active && (
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-xl border border-gray-100 bg-slate-50/80 p-4">
              <div className="text-xs text-gray-400">阶段状态</div>
              <div className="mt-2 inline-flex items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-xs ${phaseStatusStyle[active.status] || 'border-slate-200 bg-slate-50 text-slate-600'}`}>
                  {active.label}
                </span>
                <span className="text-xs text-gray-400">{active.timeline}</span>
              </div>
              <p className="mt-3 text-sm text-gray-600 leading-relaxed">{active.summary}</p>
            </div>

            <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm lg:col-span-2">
              <div className="text-xs text-gray-400">阶段重点</div>
              <ul className="mt-3 space-y-2 text-sm text-gray-700">
                {active.highlights?.map((item, index) => (
                  <li key={`${active.id}-highlight-${index}`} className="flex items-start gap-2">
                    <span className="mt-1 inline-block h-2 w-2 rounded-full bg-blue-400"></span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderOverview = () => (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-blue-600">
              <i className="ri-compass-3-line"></i>
              概览
            </span>
            <span>基线版本：{solutionOverview.baseline}</span>
            <span>对比：{solutionOverview.compareTo}</span>
          </div>
          <h2 className="mt-2 text-xl font-semibold text-gray-900">航空发动机方案状态</h2>
          <p className="mt-1 text-sm text-gray-500">责任人：{solutionOverview.owner} · 最近更新 {solutionOverview.updatedAt}</p>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <i className="ri-database-2-line"></i>
            <span>数据来源 · 方案基线台账 / 风险库</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <button type="button" className={secondaryActionButtonClass}>
            <i className="ri-refresh-line mr-1"></i>
            切换基线
          </button>
          <button type="button" className={secondaryActionButtonClass}>
            <i className="ri-git-merge-line mr-1"></i>
            变更影响
          </button>
          <button type="button" className={primaryActionButtonClass}>
            <i className="ri-download-2-line mr-1"></i>
            导出报告
          </button>
        </div>
      </div>

      {renderPhaseSwitcher()}

      <div className="mt-6 grid gap-4 lg:grid-cols-5">
        {solutionOverview.metrics.map((metric, index) => (
          <div
            key={`${metric.label}-${index}`}
            className="rounded-xl border border-gray-100 bg-slate-50/70 p-4"
          >
            <div className="text-xs font-medium text-gray-500">{metric.label}</div>
            <div className="mt-2 text-2xl font-semibold text-gray-900">{metric.value}</div>
            <div className={`mt-2 inline-flex items-center gap-1 text-xs ${
              metric.status === 'good'
                ? 'text-emerald-600'
                : metric.status === 'warning'
                ? 'text-orange-600'
                : 'text-gray-500'
            }`}>
              <i className={`ri-arrow-${metric.trend.startsWith('-') ? 'down' : 'up'}-line`}></i>
              {metric.trend}
            </div>
          </div>
        ))}
        <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4">
          <div className="text-xs font-medium text-amber-700 flex items-center gap-1">
            <i className="ri-error-warning-line"></i>
            风险提示
          </div>
          <ul className="mt-2 space-y-2 text-sm text-amber-700">
            {solutionOverview.risks.map((risk, index) => (
              <li key={`${risk.label}-${index}`} className="flex items-start gap-2">
                <span className="mt-1 inline-block h-2 w-2 rounded-full bg-amber-500"></span>
                <span>{risk.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );

  const renderRoleBasedSummary = () => {
    if (selectedBomType !== 'solution' || activeTab !== 'overview') return null;

    const summaryData = {
      system: {
        title: '系统组视图',
        cards: [
          {
            title: '性能/裕度',
            items: [
              { label: '推力裕度', value: '8.5%', status: 'good', trend: '+0.5%' },
              { label: '比冲裕度', value: '12.3%', status: 'excellent', trend: '+1.2%' },
              { label: '功率平衡偏差', value: '2.1%', status: 'warning', trend: '-0.3%' }
            ]
          },
          {
            title: '覆盖/断链',
            items: [
              { label: '仿真覆盖率', value: '87%', status: 'good', trend: '+5%' },
              { label: '试验覆盖率', value: '72%', status: 'warning', trend: '+2%' },
              { label: '需求追溯', value: '94%', status: 'excellent', trend: '+1%' }
            ]
          },
          {
            title: '控制时序',
            items: [
              { label: '启动序列', value: '完整', status: 'excellent', trend: '稳定' },
              { label: '关机序列', value: '完整', status: 'excellent', trend: '稳定' },
              { label: '节流响应', value: '2.1s', status: 'good', trend: '-0.1s' }
            ]
          }
        ]
      },
      assembly: {
        title: '总装专家视图',
        cards: [
          {
            title: '装配就绪度R',
            items: [
              { label: '综合就绪度', value: '78%', status: 'warning', trend: '+3%' },
              { label: '物料就绪', value: '85%', status: 'good', trend: '+2%' },
              { label: '工装就绪', value: '92%', status: 'excellent', trend: '+1%' }
            ]
          },
          {
            title: 'XBOM差异',
            items: [
              { label: '映射一致率', value: '91%', status: 'good', trend: '+2%' },
              { label: '新增项目', value: '12', status: 'warning', trend: '+3' },
              { label: '未映射项', value: '5', status: 'warning', trend: '-2' }
            ]
          },
          {
            title: '风险/变更',
            items: [
              { label: '高RPN项目', value: '8', status: 'warning', trend: '+1' },
              { label: '开放ECN', value: '15', status: 'good', trend: '-3' },
              { label: '开放MRB', value: '3', status: 'excellent', trend: '-1' }
            ]
          }
        ]
      },
      component: {
        title: '部件负责人视图',
        cards: [
          {
            title: 'KPI与红线距离',
            items: [
              { label: '压差红线', value: '15%', status: 'good', trend: '+2%' },
              { label: '转速红线', value: '25%', status: 'excellent', trend: '+1%' },
              { label: '温度红线', value: '8%', status: 'warning', trend: '-1%' }
            ]
          },
          {
            title: '接口一致性',
            items: [
              { label: '几何接口', value: '96%', status: 'excellent', trend: '+1%' },
              { label: '电气接口', value: '89%', status: 'good', trend: '0%' },
              { label: '控制接口', value: '92%', status: 'excellent', trend: '+2%' }
            ]
          },
          {
            title: '可靠性高RPN',
            items: [
              { label: '轴封磨损', value: 'RPN:120', status: 'warning', trend: '-10' },
              { label: '临界转速', value: 'RPN:85', status: 'good', trend: '-15' },
              { label: '气蚀风险', value: 'RPN:65', status: 'good', trend: '-5' }
            ]
          }
        ]
      }
    };

    const currentData = summaryData[selectedRole as keyof typeof summaryData];

    const getStatusColor = (status: string) => {
      switch (status) {
        case 'excellent': return 'text-green-600';
        case 'good': return 'text-blue-600';
        case 'warning': return 'text-orange-600';
        case 'danger': return 'text-red-600';
        default: return 'text-gray-600';
      }
    };

    const getStatusBg = (status: string) => {
      switch (status) {
        case 'excellent': return 'bg-green-50 text-green-700 border-green-200';
        case 'good': return 'bg-blue-50 text-blue-700 border-blue-200';
        case 'warning': return 'bg-orange-50 text-orange-700 border-orange-200';
        case 'danger': return 'bg-red-50 text-red-700 border-red-200';
        default: return 'bg-gray-50 text-gray-700 border-gray-200';
      }
    };

    return (
      <>
        <div className="p-6 bg-gray-50/30">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">{currentData.title}</h3>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">基于&quot;分类—汇总—呈现&quot;的跨域数据摘要</span>
              <button 
                onClick={() => setShowDetailedReport(true)}
                className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 whitespace-nowrap"
              >
                查看详细报告
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {currentData.cards.map((card, cardIndex) => (
              <div key={cardIndex} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-gray-900">{card.title}</h4>
                  <button className="text-blue-600 hover:text-blue-800 text-sm">
                    查看明细
                  </button>
                </div>

                <div className="space-y-4">
                  {card.items.map((item, itemIndex) => (
                    <div key={itemIndex} className="flex justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-700">{item.label}</span>
                          <div className={`px-2 py-0.5 rounded-full text-xs border ${getStatusBg(item.status)}`}>
                            {item.status === 'excellent' ? '优秀' : 
                             item.status === 'good' ? '良好' : 
                             item.status === 'warning' ? '警告' : '危险'}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`text-lg font-semibold ${getStatusColor(item.status)}`}>
                            {item.value}
                          </span>
                          <span className="text-xs text-gray-500">
                            {item.trend.startsWith('+') ? '↗' : item.trend.startsWith('-') ? '↘' : '→'} {item.trend}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex justify-between">
                    <button className="text-xs text-blue-600 hover:text-blue-800">
                      专业操作
                    </button>
                    <button className="text-xs text-gray-500 hover:text-gray-700">
                      历史趋势
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 text-xs text-gray-500 text-center">
            * 基于标准化指标计算，支持多维度汇总和版本差异追踪
          </div>
        </div>

        {/* 详细报告弹窗 */}
        {showDetailedReport && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden mx-4">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                  {currentData.title} - 详细报告
                </h2>
                <button 
                  onClick={() => setShowDetailedReport(false)}
                  className="text-gray-400 hover:text-gray-600 w-6 h-6 flex items-center justify-center"
                >
                  <i className="ri-close-line text-xl"></i>
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
                <div className="space-y-8">
                  {/* 报告概览 */}
                  <div className="bg-blue-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">报告概览</h3>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">85.7%</div>
                        <div className="text-sm text-gray-600">总体健康度</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">23</div>
                        <div className="text-sm text-gray-600">优秀指标</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">8</div>
                        <div className="text-sm text-gray-600">警告指标</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">2</div>
                        <div className="text-sm text-gray-600">风险指标</div>
                      </div>
                    </div>
                  </div>

                  {/* 详细分析 */}
                  {currentData.cards.map((card, index) => (
                    <div key={index} className="bg-white border border-gray-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">{card.title} - 详细分析</h3>
                      
                      <div className="space-y-6">
                        {card.items.map((item, itemIndex) => (
                          <div key={itemIndex} className="border-l-4 border-blue-200 pl-4">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium text-gray-900">{item.label}</h4>
                              <div className={`px-2 py-0.5 text-xs rounded-full ${
                                item.status === 'excellent' ? 'bg-green-100 text-green-700' :
                                item.status === 'good' ? 'bg-blue-100 text-blue-700' :
                                item.status === 'warning' ? 'bg-orange-100 text-orange-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {item.status === 'excellent' ? '优秀' : 
                                 item.status === 'good' ? '良好' : 
                                 item.status === 'warning' ? '警告' : '危险'}
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-sm">
                              <div>
                                <span className="text-gray-600">当前值: </span>
                                <span className={`font-semibold ${getStatusColor(item.status)}`}>
                                  {item.value}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-600">变化趋势: </span>
                                <span className="font-medium">
                                  {item.trend.startsWith('+') ? '↗ 上升' : item.trend.startsWith('-') ? '↘ 下降' : '→ 稳定'} {item.trend}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-600">目标值: </span>
                                <span className="font-medium text-green-600">
                                  {item.label.includes('推力') ? '>8.0%' :
                                   item.label.includes('覆盖') ? '>90%' :
                                   item.label.includes('响应') ? '<3.0s' : '达标'}
                                </span>
                              </div>
                            </div>
                            
                            <div className="mt-3 p-3 bg-gray-50 rounded text-sm text-gray-700">
                              <strong>分析建议: </strong>
                              {item.status === 'excellent' ? '指标表现优秀，建议继续保持当前策略。' :
                               item.status === 'good' ? '指标表现良好，可考虑进一步优化提升。' :
                               item.status === 'warning' ? '指标存在警告，建议重点关注并制定改进措施。' :
                               '指标存在风险，需要立即采取纠正行动。'}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* 历史趋势图 */}
                      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-3">历史趋势分析</h4>
                        <div className="h-32 bg-white rounded border flex items-center justify-center text-gray-500">
                          <div className="text-center">
                            <i className="ri-line-chart-line text-3xl mb-2"></i>
                            <p className="text-sm">过去30天趋势图表</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* 改进建议 */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">改进建议</h3>
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-green-100 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                          <i className="ri-check-line text-green-600 text-sm"></i>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">优化功率平衡控制</h4>
                          <p className="text-sm text-gray-700">当前功率平衡偏差为2.1%，建议调整控制算法参数，目标控制在1.5%以内。</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                          <i className="ri-lightbulb-line text-blue-600 text-sm"></i>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">提升试验覆盖率</h4>
                          <p className="text-sm text-gray-700">试验覆盖率为72%，建议增加关键工况的试验验证，目标提升到85%以上。</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-orange-100 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                          <i className="ri-alert-line text-orange-600 text-sm"></i>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">关注温度红线距离</h4>
                          <p className="text-sm text-gray-700">温度红线距离仅为8%，需要密切监控并考虑增加冷却措施。</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
                <button 
                  onClick={() => setShowDetailedReport(false)}
                  className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 whitespace-nowrap"
                >
                  关闭
                </button>
                <button className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 whitespace-nowrap">
                  导出PDF报告
                </button>
                <button className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 whitespace-nowrap">
                  生成改进计划
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  const renderSimulationData = () => {
    if (selectedBomType !== 'solution' && selectedBomType !== 'simulation') {
      return null;
    }

    const handleSelectCategory = (categoryId: string) => {
      handleNodeSelect({ type: 'category', categoryId });
    };

    const handleSearchChange = (keyword: string) => {
      simulationDispatch({ type: 'SET_SEARCH', payload: keyword });
    };

    const handlePageChange = (page: number) => {
      simulationDispatch({ type: 'SET_PAGE', payload: page });
    };

    const handlePageSizeChange = (size: number) => {
      simulationDispatch({ type: 'SET_PAGE_SIZE', payload: size });
    };

    const handleAddCompareFile = (file: SimulationFile) => {
      const conditionId = file.activeConditionId || file.conditions?.[0]?.id;
      const conditionName = file.activeConditionName || file.conditions?.find(condition => condition.id === conditionId)?.name;
      const compareKey = file.compareKey ?? (conditionId ? `${file.id}::${conditionId}` : file.id);
      const variant = conditionId ? file.conditionVariants?.[conditionId] : undefined;
      const compareVersion = file.compareVersion ?? file.belongsToVersion ?? file.version;
      const compareMeta = {
        categoryId: currentSimulationCategory?.id ?? file.compareMeta?.categoryId,
        categoryName: currentSimulationCategory?.name ?? file.compareMeta?.categoryName,
        instanceId: currentSimulationInstance?.id ?? file.compareMeta?.instanceId ?? file.id,
        instanceName: currentSimulationInstance?.name ?? file.compareMeta?.instanceName,
        version: compareVersion ?? currentSimulationSnapshot?.version ?? currentSimulationInstance?.version,
      };
      simulationDispatch({
        type: 'ADD_COMPARE',
        payload: {
          ...file,
          activeConditionId: conditionId,
          activeConditionName: conditionName,
          compareKey,
           compareVersion,
          compareMeta,
          preview: variant ? { ...variant } : file.preview
        }
      });
    };

    const handleFilterChange = (nextFilters: Partial<SimulationFilters>) => {
      simulationDispatch({ type: 'SET_FILTERS', payload: nextFilters });
    };

    const handleInstanceVersionChange = (instanceId: string, version: string) => {
      simulationDispatch({ type: 'SET_INSTANCE_VERSION', payload: { instanceId, version } });
    };

    const handleDismissVersionNotice = () => {
      simulationDispatch({ type: 'CLEAR_VERSION_NOTICE' });
    };

    const handleRemoveCompareFile = (fileId: string) => {
      simulationDispatch({ type: 'REMOVE_COMPARE', payload: fileId });
    };

    const handleClearCompare = () => {
      simulationDispatch({ type: 'CLEAR_COMPARE' });
      clearSimulationRunsFromStorage();
    };

    const handleRegisterCompareInstance = (instanceId: string, instanceName: string) => {
      simulationDispatch({
        type: 'REGISTER_COMPARE_EVENT',
        payload: { type: 'instance', id: instanceId, label: instanceName }
      });
    };

    const handleSelectInstance = (instanceId: string) => {
      if (!currentSimulationCategory) return;
      handleNodeSelect({
        type: 'instance',
        categoryId: currentSimulationCategory.id,
        instanceId
      });
    };

    const handleSelectFolder = (folderId: string) => {
      if (!currentSimulationCategory || !currentSimulationInstance) return;
      handleNodeSelect({
        type: 'folder',
        categoryId: currentSimulationCategory.id,
        instanceId: currentSimulationInstance.id,
        folderId
      });
    };

    const handlePreviewFile = (file: SimulationFile) => {
      setPreviewSimulationFile(file);
    };

  const handleOpenFolderFromPreview = (file: SimulationFile) => {
      const currentCategoryId = currentSimulationCategory?.id;
      const currentInstanceId = currentSimulationInstance?.id;
      const snapshotMatch = currentSimulationSnapshot?.folders.find(folder => folder.files.some(f => f.id === file.id));
      if (snapshotMatch && currentCategoryId && currentInstanceId) {
        handleNodeSelect({
          type: 'folder',
          categoryId: currentCategoryId,
          instanceId: currentInstanceId,
          folderId: snapshotMatch.id
        });
        setPreviewSimulationFile(null);
        return;
      }

      let resolvedCategoryId = currentCategoryId;
      let resolvedInstanceId = currentInstanceId;
      let resolvedFolderId: string | undefined;
      let resolvedVersion: string | undefined;

      simulationState.categories.forEach(cat => {
        cat.instances.forEach(inst => {
          Object.values(inst.versions ?? {}).forEach(instanceSnapshot => {
            if (resolvedFolderId) return;
            const folderHit = instanceSnapshot.folders.find(folder => folder.files.some(f => f.id === file.id));
            if (folderHit) {
              resolvedCategoryId = cat.id;
              resolvedInstanceId = inst.id;
              resolvedFolderId = folderHit.id;
              resolvedVersion = instanceSnapshot.version;
            }
          });
        });
      });

      if (!resolvedCategoryId || !resolvedInstanceId || !resolvedFolderId || !resolvedVersion) return;
      simulationDispatch({ type: 'SET_INSTANCE_VERSION', payload: { instanceId: resolvedInstanceId, version: resolvedVersion } });
      handleNodeSelect({
        type: 'folder',
        categoryId: resolvedCategoryId,
        instanceId: resolvedInstanceId,
        folderId: resolvedFolderId
      });
      setPreviewSimulationFile(null);
    };

    const showSimulationBar = Boolean(isSimulationJumpContext || latestJump);
    const simulationBarMessage = simulationJumpFeedback?.type === 'info'
      ? simulationJumpFeedback.message
      : latestJump?.sourceNodeName
      ? `来源：${latestJump.sourceNodeName}`
      : latestJump
      ? `已从${BOM_TYPE_LABELS[latestJump.fromBomType] ?? '上一视图'}跳转`
      : '';
    const resolvedSimulationBarMessage = simulationBarMessage || '仿真视图上下文已锁定';

    return (
      <div className="relative flex h-full">
        {isSimulationNavOpen && (
          <div className="fixed inset-0 z-40 flex md:hidden">
            <div className="absolute inset-0 bg-black/40" onClick={() => setIsSimulationNavOpen(false)}></div>
            <div className="relative ml-auto h-full w-72 max-w-full bg-white shadow-xl">
              {renderOverlayTree()}
            </div>
          </div>
        )}
        <div className="hidden md:flex h-full">
          {renderDesktopTree()}
        </div>
        <div className="flex-1 flex flex-col bg-gray-50">
          {showSimulationBar ? (
            <div className="sticky top-0 z-20 border-b border-gray-100 bg-white/85 px-4 py-2 text-xs text-slate-600 backdrop-blur">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <i className={`ri-${simulationJumpFeedback ? 'information-line text-blue-500' : 'compass-3-line text-blue-400'} text-sm`}></i>
                  <span className="truncate">{resolvedSimulationBarMessage}</span>
                  {simulationJumpFeedback?.type === 'info' ? (
                    <button
                      type="button"
                      onClick={dismissSimulationFeedback}
                      className="text-xs text-slate-400 transition hover:text-slate-600"
                      aria-label="关闭提示"
                    >
                      <i className="ri-close-line"></i>
                    </button>
                  ) : null}
                </div>
                {latestJump ? (
                  <div className="flex items-center gap-1.5">
                    {isSimulationJumpContext ? (
                      <button
                        type="button"
                        onClick={handleJumpBack}
                        className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] font-medium text-blue-700 hover:border-blue-300 hover:text-blue-800"
                      >
                        <i className="ri-arrow-left-line"></i>
                        {backButtonLabel || '返回上一个视图'}
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={clearJumpHistory}
                      className="inline-flex items-center justify-center rounded-md border border-gray-200 bg-white px-2 py-1 text-[11px] text-gray-400 hover:text-gray-600"
                      aria-label="清除跳转上下文"
                    >
                      <i className="ri-close-line"></i>
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
          <div className="flex-1 overflow-y-auto">
            <SimulationContentPanel
              category={currentSimulationCategory}
              instance={currentSimulationInstance}
              instanceSnapshot={currentSimulationSnapshot}
              folder={currentSimulationFolder}
              page={simulationState.page}
              pageSize={simulationState.pageSize}
              searchKeyword={simulationState.searchKeyword}
              hasInteracted={simulationState.hasInteracted}
              categories={simulationState.categories}
              selectedVersions={simulationState.selectedInstanceVersions}
              activeVersion={currentSimulationVersion}
              versionNotice={
                currentSimulationInstance && simulationVersionNotice?.instanceId === currentSimulationInstance.id
                  ? simulationVersionNotice.message
                  : null
              }
              filters={simulationState.filters}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              onSearchChange={handleSearchChange}
              onFilterChange={handleFilterChange}
              onSelectInstance={handleSelectInstance}
              onSelectCategory={handleSelectCategory}
              onSelectFolder={handleSelectFolder}
              onPreviewFile={handlePreviewFile}
              onAddCompareFile={handleAddCompareFile}
              onAddCompareInstance={handleSelectInstance}
              onRegisterCompareInstance={handleRegisterCompareInstance}
              onOpenNavigation={() => setIsSimulationNavOpen(true)}
              onChangeVersion={handleInstanceVersionChange}
              onDismissVersionNotice={handleDismissVersionNotice}
            />
          </div>
          <SimulationCompareDrawer
            items={simulationState.compareQueue}
            onRemove={handleRemoveCompareFile}
            onClear={handleClearCompare}
          />
        </div>
        <SimulationFilePreview
          file={previewSimulationFile}
          onClose={() => setPreviewSimulationFile(null)}
          onOpenFolder={handleOpenFolderFromPreview}
          onAddCompare={handleAddCompareFile}
        />
        {simulationWarningToast ? (
          <div className="pointer-events-auto fixed top-20 right-6 z-50 max-w-sm">
            <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-white/95 px-4 py-3 text-xs text-amber-700 shadow-lg backdrop-blur">
              <i className="ri-alert-line text-base"></i>
              <span className="leading-relaxed">{simulationWarningToast.message}</span>
              <button
                type="button"
                onClick={dismissSimulationToast}
                className="ml-auto text-amber-500 transition hover:text-amber-700"
                aria-label="关闭警告"
              >
                <i className="ri-close-line"></i>
              </button>
            </div>
          </div>
        ) : null}
        {compareToast && (
          <div className="pointer-events-none fixed bottom-28 right-8 z-50">
            <div className="flex items-center gap-3 rounded-xl bg-slate-900/90 px-4 py-3 text-sm text-white shadow-lg">
              <i className="ri-checkbox-circle-line text-lg text-green-400"></i>
              <div className="flex flex-col">
                <span>{compareToast.type === 'file' ? '文件已加入对比栏' : '实例文件已加入对比栏'}</span>
                <span className="text-xs text-slate-300">{compareToast.label}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  

  


  

  

  return (
    <div className="h-full bg-slate-50">
      <div className="flex h-full gap-6 px-6 py-6">
        {/* 左侧产品结构区域 */}
        {activeTab !== 'module-home' && (
        <div className="w-[26rem] min-w-[24rem] flex flex-col rounded-2xl border border-gray-200 bg-white shadow-sm">
          {/* 版本和BOM类型选择 - 缩小区域 */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-900">产品结构(XBOM)</h2>
              <select 
                value={selectedVersion}
                onChange={(e) => setSelectedVersion(e.target.value)}
                className="px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 pr-6"
              >
                {versions.map(version => (
                  <option key={version.id} value={version.id}>
                    {version.name} - {version.description}
                  </option>
                ))}
              </select>
            </div>
            
            {/* BOM类型选择 - 简化为水平标签 */}
            <div className="flex flex-wrap gap-2">
              {bomTypes.map((bomType) => (
                <button
                  key={bomType.id}
                  onClick={() => handleBomTypeChange(bomType.id)}
                  className={`flex-1 flex items-center space-x-1 px-3 py-1 rounded text-xs transition-colors ${
                    selectedBomType === bomType.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-white hover:bg-gray-50 border border-gray-200 text-gray-700'
                  }`}
                >
                  <i className={bomType.icon}></i>
                  <span>{bomType.name}</span>
                  <span className="text-xs opacity-75">({bomType.count})</span>
                </button>
              ))}
            </div>
          </div>

          {/* BOM树结构 */}
          <div className="flex-1 overflow-y-auto p-4" ref={isTestBom ? undefined : treeContainerRef}>
            {isTestBom ? (
              <TestingTreePanel
                structure={TEST_STRUCTURE_TREE}
                projects={testingState.projects}
                selectedNode={testingState.selectedNode}
                expandedNodeIds={testingState.expandedNodeIds}
                onSelectNode={selectTestingNode}
                onToggleExpand={toggleTestingNode}
                testTypes={TEST_TYPES}
                density="compact"
              />
            ) : isSimulationBom && activeTab === 'simulation' ? (
              renderSimulationNavTree()
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-3">
                  <div className="space-y-1">{bomStructureData.map(node => renderTreeNode(node))}</div>
                </div>
              </div>
            )}
          </div>

          {/* 角色选择 - 仅方案BOM显示 */}
      {selectedBomType === 'solution' && (
        <div className="p-4 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-900 mb-2">角色视图</h3>
          <div className="flex space-x-1">
            {roles.map((role) => (
              <button
                    key={role.id}
                    onClick={() => setSelectedRole(role.id)}
                    className={`flex-1 flex items-center justify-center space-x-1 px-2 py-1 rounded text-xs transition-colors ${
                      selectedRole === role.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <i className={role.icon}></i>
                    <span>{role.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        )}

        {/* 右侧内容区域 */}
        <div className="flex-1 flex flex-col">
          {/* Tab切换 */}
          <div className={`border-b border-gray-200 bg-white px-6 py-4 transition-shadow ${contentScrolled ? 'shadow-sm' : ''}`}>
            <div className="flex space-x-8" role="tablist" aria-label="方案视图">
              {(() => {
                const tabs: Array<{ id: string; name: string; icon: string }> = [
                  { id: 'module-home', name: '首页', icon: 'ri-home-5-line' },
                ];
                if (selectedBomType === 'solution') {
                  tabs.push(
                    { id: 'overview', name: '概览', icon: 'ri-compass-3-line' },
                    { id: 'definition', name: '产品定义', icon: 'ri-book-2-line' },
                    { id: 'design', name: '设计实现', icon: 'ri-pencil-ruler-2-line' },
                    { id: 'simulation', name: '仿真验证', icon: 'ri-computer-line' },
                    { id: 'test', name: '试验与测量', icon: 'ri-test-tube-line' },
                    { id: 'process', name: '工艺与生产', icon: 'ri-tools-line' },
                    { id: 'management', name: '管理与保障', icon: 'ri-shield-check-line' }
                  );
                } else if (selectedBomType === 'simulation') {
                  tabs.push({ id: 'simulation', name: '仿真验证', icon: 'ri-computer-line' });
                } else if (selectedBomType === 'requirement') {
                  tabs.push(
                    { id: 'requirement', name: 'XBOM', icon: 'ri-node-tree' }
                  );
                } else if (selectedBomType === 'design') {
                  tabs.push(
                    { id: 'structure', name: '结构视图', icon: 'ri-stack-line' },
                    { id: 'cockpit', name: '实时驾驶舱', icon: 'ri-dashboard-2-line' }
                  );
                } else {
                  tabs.push(
                    { id: 'structure', name: '结构视图', icon: 'ri-node-tree' }
                  );
                }
                return tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 py-2 px-1 border-b-2 text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                    type="button"
                    role="tab"
                    aria-selected={activeTab === tab.id}
                    aria-controls={`panel-${tab.id}`}
                    id={`tab-${tab.id}`}
                    tabIndex={activeTab === tab.id ? 0 : -1}
                  >
                    <i className={tab.icon}></i>
                    <span>{tab.name}</span>
                  </button>
                ));
              })()}
            </div>
          </div>

        {/* 内容区域 */}
        <div
          className="flex-1 overflow-y-auto pr-1 pt-4 md:pt-6 pb-0 scroll-pt-20"
          onScroll={(e) => setContentScrolled((e.currentTarget as HTMLDivElement).scrollTop > 0)}
        >
          {activeTab === 'module-home' ? (
            <div
              role="tabpanel"
              id="panel-module-home"
              aria-labelledby="tab-module-home"
              className="h-full"
            >
              <ProductStructureHome currentBomType={selectedBomType} onQuickNavigate={handleHomeNavigate} />
            </div>
          ) : (
            <>
            {/* 次级工具条：在内容顶部形成层级分隔，可放筛选/导出等操作 */}
            {selectedBomType === 'requirement' && activeTab === 'requirement' && (
              <div className="sticky top-0 z-10 px-6 py-2 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b border-gray-100">
                <div className="flex flex-col gap-2">
                  {isRequirementJumpContext && latestJump && (
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={handleJumpBack}
                        className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:border-blue-300 hover:text-blue-800"
                      >
                        <i className="ri-arrow-left-line"></i>
                        {backButtonLabel}
                      </button>
                      <button
                        type="button"
                        onClick={clearJumpHistory}
                        className="inline-flex items-center justify-center rounded-full border border-gray-200 bg-white p-1 text-gray-400 hover:text-gray-600"
                        aria-label="清除跳转上下文"
                      >
                        <i className="ri-close-line"></i>
                      </button>
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-xs font-medium text-gray-500 mr-2">快速筛选</div>
                    {/* 状态切片 */}
                    {['all','in-progress','pending','completed'].map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setRequirementFilters(prev => ({ ...prev, status: v as any }))}
                        className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${requirementFilters.status === v ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-700'}`}
                      >
                        {v === 'all' ? '全部' : v === 'in-progress' ? '进行中' : v === 'pending' ? '待启动' : '已完成'}
                      </button>
                    ))}
                    <span className="text-gray-300">|</span>
                    {/* 类型切片 */}
                    {[
                      {v:'all', l:'全部'},
                      {v:'performance', l:'性能'},
                      {v:'functional', l:'功能'},
                      {v:'interface', l:'接口'},
                      {v:'quality', l:'六性'},
                    ].map(opt => (
                      <button
                        key={opt.v}
                        type="button"
                        onClick={() => setRequirementFilters(prev => ({ ...prev, type: opt.v as any }))}
                        className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${requirementFilters.type === opt.v ? 'bg-slate-50 border-slate-300 text-slate-700' : 'border-gray-200 text-gray-600 hover:border-slate-300 hover:text-slate-700'}`}
                      >
                        {opt.l}
                      </button>
                    ))}
                    <label className="ml-2 inline-flex items-center gap-1 text-xs text-gray-600">
                      <input
                        type="checkbox"
                        className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={requirementFilters.showOnlyLinked}
                        onChange={(e) => setRequirementFilters(prev => ({ ...prev, showOnlyLinked: e.target.checked }))}
                      />
                      仅关注
                    </label>
                    <div className="relative ml-auto">
                      <i className="ri-search-line pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-gray-400"></i>
                      <input
                        value={requirementFilters.keyword}
                        onChange={(e) => setRequirementFilters(prev => ({ ...prev, keyword: e.target.value }))}
                        placeholder="搜索需求关键词"
                        className="w-56 rounded-md border border-gray-200 pl-7 pr-3 py-1.5 text-xs focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                    <button
                      type="button"
                      className="text-xs px-3 py-1.5 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100"
                      onClick={() => setRequirementFilters({ keyword: '', status: 'all', priority: 'all', type: 'all', showOnlyLinked: false })}
                    >
                      重置
                    </button>
                    <button type="button" className="text-xs px-3 py-1.5 rounded-md border border-blue-300 text-blue-600 hover:bg-blue-50">
                      导出
                    </button>
                  </div>
                </div>
              </div>
            )}
            <div className="min-h-full space-y-6">
              {activeTab === 'requirement' && selectedBomType === 'requirement' && (
                <div
                  role="tabpanel"
                  id="panel-requirement"
                  aria-labelledby="tab-requirement"
                  className="space-y-6"
                >
                  <RequirementDetailPanel
                    selectedNode={selectedNode}
                    selectedBomType={selectedBomType}
                    selectedRequirementRole={selectedRequirementRole}
                    onRequirementRoleChange={setSelectedRequirementRole}
                    requirementRoles={requirementRoles}
                    requirementRoleInsights={requirementRoleInsights}
                    requirementsByNode={requirementsByNode}
                    currentNode={currentRequirementNode ? { id: currentRequirementNode.id, name: currentRequirementNode.name } : null}
                    filters={requirementFilters}
                    onFiltersChange={setRequirementFilters}
                    focusRequirementId={pendingRequirementFocus}
                    onFocusHandled={() => setPendingRequirementFocus(null)}
                  />
                </div>
              )}
              {activeTab === 'structure' && selectedBomType !== 'design' && (
                selectedBomType === 'test' ? (
                  <div role="tabpanel" id="panel-structure" aria-labelledby="tab-structure">
                    {TBOM_FEATURE_ENABLED ? (
                      <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-1 items-start gap-3">
                          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm">
                            <i className="ri-inbox-unarchive-line text-lg" aria-hidden />
                          </span>
                          <div className="space-y-1">
                            <div className="text-sm font-semibold text-blue-900">导入 TBOM 数据包</div>
                            <p className="text-xs text-blue-700">
                              支持 JSON / CSV / ZIP，导入成功后自动刷新 TBOM 树、运行详情与 Compare 缓存。
                            </p>
                            {latestImportLog && latestImportStats ? (
                              <p className="text-xs text-blue-600">
                                上次导入 {formatImportTimestamp(latestImportLog.completedAt)} · 新增
                                {' '}
                                {latestImportStats.imported}
                                {' '}
                                · 更新
                                {' '}
                                {latestImportStats.updated}
                                {' '}
                                · 失败
                                {' '}
                                {latestImportStats.failed}
                              </p>
                            ) : (
                              <p className="text-xs text-blue-600">尚未执行导入，可上传示例数据包体验完整流程。</p>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 sm:flex-row">
                          {latestImportLog ? (
                            <button
                              type="button"
                              onClick={() => {
                                tbomImportActions.open();
                                tbomImportActions.goToStep('logs');
                                tbomImportActions.showLog(latestImportLog.logId);
                              }}
                              className="inline-flex items-center gap-2 rounded-md border border-blue-200 bg-white px-3 py-1.5 text-xs font-medium text-blue-600 shadow-sm transition hover:border-blue-300 hover:text-blue-700"
                            >
                              <i className="ri-history-line text-sm" aria-hidden />
                              查看导入日志
                            </button>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => tbomImportActions.open()}
                            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow transition hover:bg-blue-700"
                          >
                            <i className="ri-upload-2-line" aria-hidden />
                            导入数据包
                          </button>
                        </div>
                      </div>
                    ) : null}
                    {tbomTargetNode ? (
                      <div className="mb-4 rounded-2xl border border-blue-100 bg-white px-4 py-4 text-sm text-slate-700">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">挂接试验列表</p>
                            <p className="text-xs text-slate-500">
                              结构节点 {tbomTargetNode}
                              {tbomLink?.path ? ` · ${tbomLink.path}` : ''}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={handleReturnToTbom}
                            className="inline-flex items-center gap-2 rounded-md border border-blue-200 px-3 py-1.5 text-xs font-medium text-blue-600 transition hover:border-blue-300 hover:text-blue-700"
                          >
                            <i className="ri-share-reverse-line" aria-hidden /> 返回 TBOM
                          </button>
                        </div>
                        {linkedRunEntries.length ? (
                          <ul className="mt-3 space-y-2">
                            {linkedRunEntries.map(({ run, test, project }) => (
                              <li
                                key={run.run_id}
                                className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between"
                              >
                                <div className="space-y-1">
                                  <div className="font-medium text-slate-900">{test.name}</div>
                                  <div className="text-slate-500">
                                    运行 {run.run_id} · {TBOM_RUN_STATUS_LABEL[run.status]} · 序列号 {run.test_item_sn ?? '未提供'}
                                  </div>
                                  <div className="text-slate-400">
                                    项目 {project.title} ({project.project_id})
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleOpenRunDetail({ projectId: project.project_id, testId: test.test_id, runId: run.run_id })}
                                  className="inline-flex items-center gap-2 self-start rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-blue-700"
                                >
                                  <i className="ri-external-link-line" aria-hidden /> 查看运行
                                </button>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="mt-3 text-xs text-slate-500">
                            暂未查询到挂接该结构节点的运行记录，可在 TBOM 中维护后刷新查看。
                          </p>
                        )}
                      </div>
                    ) : null}
                    <TestingContentPanel
                      projects={testingState.projects}
                      stats={testingState.stats}
                      selectedNode={testingState.selectedNode}
                      selectedProject={testingState.selectedProject}
                      selectedItem={testingState.selectedItem}
                      onSelectProject={selectTestingProject}
                      onSelectItem={selectTestingItem}
                      onOpenRunDetail={handleOpenRunDetail}
                      runDetailLoading={isRunDetailLoading}
                      runDetailError={runDetailError}
                    />
                  </div>
                ) : (
                  <div
                    className="rounded-2xl border border-dashed border-gray-200 bg-white p-6 text-center text-gray-500"
                    role="tabpanel"
                    id="panel-structure"
                    aria-labelledby="tab-structure"
                  >
                    <i className="ri-node-tree text-4xl mb-2"></i>
                    <p>结构视图内容</p>
                  </div>
                )
              )}

              {selectedBomType === 'design' && (activeTab === 'structure' || activeTab === 'cockpit') && (
                <div
                  role="tabpanel"
                  id={`panel-${activeTab}`}
                  aria-labelledby={`tab-${activeTab}`}
                  className="space-y-6"
                >
                  <EbomDetailPanel
                    selectedNodeId={selectedNode}
                    onNavigateBomType={(t) => handleBomTypeChange(t)}
                    onSelectNode={(id) => handleNodeClick(id)}
                    activeView={activeTab === 'cockpit' ? 'cockpit' : 'structure'}
                    onNavigateRequirement={handleNavigateRequirement}
                    onViewSimulation={handleNavigateSimulation}
                  />
                </div>
              )}

              {activeTab === 'definition' && selectedBomType === 'solution' && (
                <div role="tabpanel" id="panel-definition" aria-labelledby="tab-definition" className="space-y-6 focus:outline-none">
                  <ProductDefinitionPanel
                    node={currentRequirementNode ? { id: currentRequirementNode.id, name: currentRequirementNode.name, unitType: currentRequirementNode.unitType as any, subsystemType: (currentRequirementNode as any).subsystemType } : null}
                    versionId={selectedVersion}
                    onNavigateToNode={(nodeId) => handleNodeClick(nodeId)}
                    defaultRole={selectedRole as 'system' | 'assembly' | 'component'}
                  />
                  <section className="rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50/80 to-indigo-50/60 px-6 py-5 shadow-sm flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="max-w-xl space-y-1">
                      <div className="flex items-center gap-2 text-sm font-semibold text-blue-700">
                        <i className="ri-compass-3-line"></i>
                        需求闭环 · Requirement Traceability
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">从产品定义到需求BOM，一次看清状态</h3>
                      <p className="text-sm text-gray-600">
                        当前节点关联 {requirementStats.total} 条需求，进行中 {requirementStats.inProgress} 条，待启动 {requirementStats.pending} 条，高优 {requirementStats.high} 条。
                        支持导出清单、同步主数据与快速筛选。
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <button
                        type="button"
                        className="rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-blue-700 hover:border-blue-300 hover:text-blue-800"
                        onClick={() => setActiveTab('definition')}
                      >
                        <i className="ri-refresh-line mr-1"></i>
                        同步主数据
                      </button>
                      <button
                        type="button"
                        className={`rounded-lg px-3 py-1.5 text-sm shadow-sm transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                          requirementsInView ? 'bg-blue-700 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                        onClick={() => {
                          const el = document.getElementById('requirements-section');
                          if (el) {
                            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }
                        }}
                        aria-pressed={requirementsInView}
                      >
                        <i className="ri-file-list-2-line mr-1"></i>
                        查看需求清单
                      </button>
                    </div>
                  </section>
                  <div id="requirements-section" className="scroll-mt-[120px]">
                    <RequirementDetailPanel
                      selectedNode={selectedNode}
                      selectedBomType={selectedBomType}
                      selectedRequirementRole={selectedRequirementRole}
                      onRequirementRoleChange={setSelectedRequirementRole}
                      requirementRoles={requirementRoles}
                      requirementRoleInsights={requirementRoleInsights}
                      requirementsByNode={requirementsByNode}
                      currentNode={currentRequirementNode ? { id: currentRequirementNode.id, name: currentRequirementNode.name } : null}
                      focusRequirementId={pendingRequirementFocus}
                      onFocusHandled={() => setPendingRequirementFocus(null)}
                    />
                 </div>
               </div>
              )}

              {activeTab === 'overview' && selectedBomType === 'solution' && (
                <div
                  className="space-y-6"
                  role="tabpanel"
                  id="panel-overview"
                  aria-labelledby="tab-overview"
                >
                  {renderOverview()}
                  {/* 概览下仅展示总览信息与阶段切换；专业面板迁移至六域 */}
                </div>
              )}

              {activeTab === 'simulation' && (selectedBomType === 'solution' || selectedBomType === 'simulation') && (
                <div role="tabpanel" id="panel-simulation" aria-labelledby="tab-simulation" className="space-y-6">
                  {renderSimulationData()}
                </div>
              )}

              {activeTab === 'design' && selectedBomType === 'solution' && (
                <div role="tabpanel" id="panel-design" aria-labelledby="tab-design" className="space-y-6">
                  <PerformanceOverview
                    operatingPoints={solutionOverview.performance.operatingPoints}
                    assumptions={solutionOverview.performance.assumptions}
                  />
                  <StructuralOverview
                    loadCases={solutionOverview.structure.loadCases}
                    margins={solutionOverview.structure.margins}
                    validation={solutionOverview.structure.validation}
                  />
                  <ThermalOverview
                    scenarios={solutionOverview.thermal.scenarios}
                    effectiveness={solutionOverview.thermal.effectiveness}
                    assumptions={solutionOverview.thermal.assumptions}
                  />
                  <ControlOverview
                    interfaces={solutionOverview.control.interfaces}
                    strategies={solutionOverview.control.strategies}
                    diagnostics={solutionOverview.control.diagnostics}
                  />
                  {renderRoleBasedSummary()}
                </div>
              )}

              {activeTab === 'test' && selectedBomType === 'solution' && (
                <div
                  ref={testPanelRef}
                  role="tabpanel"
                  id="panel-test"
                  aria-labelledby="tab-test"
                  className="space-y-6"
                >
                  <section className="rounded-2xl border border-blue-100 bg-white/80 px-5 py-5 shadow-sm">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-blue-700 flex items-center gap-2">
                          <i className="ri-test-tube-line"></i>
                          验证成熟度摘要
                        </p>
                        <h3 className="text-xl font-semibold text-slate-900">方案阶段关键门控一览</h3>
                        <p className="text-sm text-slate-600">按阶段查看目标覆盖率、当前进展与预计闭环时间，评估是否满足概念/初样/试样/正样门。</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-sm font-medium text-blue-700 hover:border-blue-300"
                        >
                          <i className="ri-download-2-line" aria-hidden></i>
                          导出摘要 CSV
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTab('test')}
                          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white shadow hover:bg-blue-700"
                        >
                          <i className="ri-link"></i>
                          跳转试验BOM
                        </button>
                      </div>
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {(solutionOverview.verification.maturity ?? []).map((phase) => (
                        <div
                          key={phase.phase}
                          className="rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3"
                        >
                          <div className="flex items-center justify-between text-sm font-semibold text-slate-800">
                            <span>{phase.phase}</span>
                            <span className={`text-xs font-medium ${phase.status === 'risk' ? 'text-red-600' : phase.status === 'warning' ? 'text-amber-600' : 'text-emerald-600'}`}>
                              {phase.status === 'risk' ? '高风险' : phase.status === 'warning' ? '注意' : '达成'}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-slate-600">目标 {Math.round(phase.target * 100)}% · 当前 {Math.round(phase.actual * 100)}%</p>
                          <p className="text-xs text-slate-500">ETA：{phase.eta} · 负责人 {phase.owner}</p>
                          <div className="mt-2 h-2 rounded-full bg-slate-200">
                            <div
                              className={`h-2 rounded-full ${phase.status === 'risk' ? 'bg-red-500' : phase.status === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'}`}
                              style={{ width: `${Math.min(phase.actual * 100, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-700">试验方案资产</p>
                        <p className="text-xs text-slate-500">集中管理试验技术要求、大纲、试验卡片等文档，随时查看版本与审签状态。</p>
                      </div>
                      <div className="flex gap-2">
                        <button type="button" className="rounded-md border border-slate-200 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50">上传</button>
                        <button type="button" className="rounded-md border border-slate-200 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50">批量导出</button>
                      </div>
                    </div>
                    <div className="mt-4 overflow-x-auto">
                      <table className="w-full text-left text-sm text-slate-700">
                        <thead>
                          <tr className="text-xs uppercase tracking-wide text-slate-500">
                            <th className="py-2">文档</th>
                            <th className="py-2">责任人</th>
                            <th className="py-2">版本</th>
                            <th className="py-2">状态</th>
                            <th className="py-2">更新时间</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(solutionOverview.verification.assets ?? []).map((asset) => (
                            <tr key={asset.id} className="border-t border-slate-100 text-sm">
                              <td className="py-2 font-medium text-slate-900">{asset.name}</td>
                              <td className="py-2">{asset.owner}</td>
                              <td className="py-2">{asset.version}</td>
                              <td className="py-2 text-xs">
                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 ${asset.status === 'approved' ? 'bg-emerald-50 text-emerald-700' : asset.status === 'in-review' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                                  {asset.status}
                                </span>
                              </td>
                              <td className="py-2 text-slate-500">{asset.updatedAt}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>

                  <VerificationOverview
                    summary={solutionOverview.verification.summary}
                    coverage={solutionOverview.verification.coverage}
                    campaigns={solutionOverview.verification.campaigns}
                    packages={solutionOverview.verification.packages}
                    blockers={solutionOverview.verification.blockers}
                  />

                  <div className="grid gap-6 lg:grid-cols-2">
                    <TestCoverageHeatmap
                      nodes={solutionOverview.verification.structureCoverage ?? []}
                      onSelectNode={handleHeatmapNodeSelect}
                    />
                    <TestRequirementMatrix
                      items={solutionOverview.verification.requirementMappings ?? []}
                      onSelectRequirement={handleRequirementJump}
                    />
                  </div>

                  <TestResourcePanel
                    resources={solutionOverview.verification.resourceDependencies ?? []}
                    measurementAssets={solutionOverview.verification.measurementAssets ?? []}
                    blockers={solutionOverview.verification.blockers ?? []}
                  />

                  <SimulationCorrelationPlan
                    plans={solutionOverview.verification.simulationPlan ?? []}
                  />

                  <VerificationEvidenceExport
                    verification={solutionOverview.verification}
                    baseline={solutionOverview.baseline}
                    productName={selectedNode?.name ?? '方案试验驾驶舱'}
                    captureElement={testPanelRef.current ?? null}
                  />
                </div>
              )}

              {activeTab === 'process' && selectedBomType === 'solution' && (
                <div role="tabpanel" id="panel-process" aria-labelledby="tab-process" className="space-y-6">
                  <ManufacturingOverview {...solutionOverview.manufacturing} />
                </div>
              )}

              {activeTab === 'management' && selectedBomType === 'solution' && (
                <div role="tabpanel" id="panel-management" aria-labelledby="tab-management" className="space-y-6">
                  <ConfigurationQualityOverview
                    baselineMetrics={solutionOverview.configuration.baselineMetrics}
                    changeImpacts={solutionOverview.configuration.changeImpacts}
                    baselineGaps={solutionOverview.configuration.baselineGaps}
                    qualityGates={solutionOverview.configuration.qualityGates}
                    nonConformances={solutionOverview.configuration.nonConformances}
                  />
                  <CollaborationHub
                    presence={solutionOverview.collaboration.presence}
                    activities={solutionOverview.collaboration.activities}
                    notifications={solutionOverview.collaboration.notifications}
                    actions={solutionOverview.collaboration.actions}
                    reviews={solutionOverview.collaboration.reviews}
                  />
                </div>
              )}
            </div>
            </>
          )}
          </div>
        </div>
      </div>
      {runDetailContext ? (
        <TbomRunDetail
          run={runDetailContext.run}
          test={runDetailContext.test}
          project={runDetailContext.project}
          onClose={closeRunDetail}
        />
      ) : null}
      {TBOM_FEATURE_ENABLED ? (
        <TbomImportWizard state={tbomImportState} actions={tbomImportActions} />
      ) : null}
    </div>
  );
}
