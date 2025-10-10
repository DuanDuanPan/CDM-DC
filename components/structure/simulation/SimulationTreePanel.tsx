import { useCallback, useMemo } from 'react';
import {
  SIMULATION_DIMENSION_DESCRIPTORS,
  SIMULATION_DIMENSION_LIMIT,
  getSimulationTypeInfo
} from './dimensions';
import { SIMULATION_STRUCTURE_TREE, type SimulationStructureDefinition } from './structureTree';
import type {
  SimulationCategory,
  SimulationDimension,
  SimulationDimensionSelection,
  SimulationInstance,
  SimulationSavedView,
  SimulationViewMode
} from './types';
import type { TreeNodeReference } from './useSimulationExplorerState';

const VIEW_MODE_TABS: Array<{ value: SimulationViewMode; label: string; icon: string }> = [
  { value: 'structure', label: '结构', icon: 'ri-mind-map' },
  { value: 'time', label: '时间', icon: 'ri-calendar-2-line' },
  { value: 'type', label: '类型', icon: 'ri-apps-line' }
];

type TreeNodeType = 'category' | 'instance' | 'folder' | 'dimension';

interface TreeNode {
  id: string;
  label: string;
  type: TreeNodeType;
  depth: number;
  reference: TreeNodeReference;
  badge?: string;
  badgeClass?: string;
  icon?: string;
  meta?: string;
  subtitle?: string;
  children?: TreeNode[];
  muted?: boolean;
}

interface FlatInstance {
  category: SimulationCategory;
  instance: SimulationInstance;
}

interface TreeBuildResult {
  nodes: TreeNode[];
  hasMore: boolean;
  totalTopLevel: number;
  visibleTopLevel: number;
}

interface Props {
  categories: SimulationCategory[];
  viewMode: SimulationViewMode;
  dimensionSelections: SimulationDimensionSelection[];
  selectedNode: TreeNodeReference | null;
  expandedNodeIds: string[];
  navVisibleCount: number;
  navPageSize: number;
  onToggleExpand: (id: string) => void;
  onSelectNode: (ref: TreeNodeReference) => void;
  onLoadMore: () => void;
  onRemoveSelection: (id: string) => void;
  onClearSelections: () => void;
  showViewControls?: boolean;
  availableViewModes?: SimulationViewMode[];
  onViewModeChange?: (mode: SimulationViewMode) => void;
  dimensionLimitBreachedAt?: number;
  savedViews?: SimulationSavedView[];
  onSaveView?: (name: string) => void;
  onApplySavedView?: (id: string) => void;
  onDeleteSavedView?: (id: string) => void;
  onRenameSavedView?: (id: string, name: string) => void;
  enableDimensionSelection?: boolean;
}

const instanceStatusBadge: Record<SimulationInstance['status'], { label: string; className: string }> = {
  approved: { label: '已通过', className: 'bg-green-50 text-green-600 border-green-100' },
  'in-progress': { label: '进行中', className: 'bg-blue-50 text-blue-600 border-blue-100' },
  draft: { label: '草稿', className: 'bg-gray-50 text-gray-600 border-gray-100' },
  archived: { label: '已归档', className: 'bg-amber-50 text-amber-600 border-amber-100' }
};

const flattenInstances = (categories: SimulationCategory[]): FlatInstance[] =>
  categories.flatMap(category => category.instances.map(instance => ({ category, instance })));

const deriveTimeBucket = (instance: SimulationInstance): string => {
  if (instance.timeBucket) return instance.timeBucket;
  if (!instance.executedAt) return 'undefined';
  const executedDate = new Date(instance.executedAt);
  if (Number.isNaN(executedDate.getTime())) return 'undefined';
  return `${executedDate.getUTCFullYear()}-${String(executedDate.getUTCMonth() + 1).padStart(2, '0')}`;
};

const formatMonthLabel = (bucket: string) => {
  if (bucket === 'undefined') return '未定义月份';
  const [year, month] = bucket.split('-');
  if (!year || !month) return bucket;
  return `${year}/${month}`;
};

const matches = (selection: SimulationDimensionSelection, item: FlatInstance) => {
  switch (selection.dimension) {
    case 'structure': {
      const id = selection.value;
      return (
        item.instance.primaryStructureId === id ||
        item.instance.structurePath?.includes(id) ||
        item.instance.alternateStructureIds?.includes(id) ||
        false
      );
    }
    case 'time': {
      const bucket = deriveTimeBucket(item.instance);
      return bucket === selection.value;
    }
    case 'type': {
      const instanceType = item.instance.typeCode ?? item.category.typeCode ?? item.category.id;
      return instanceType === selection.value;
    }
    default:
      return true;
  }
};

const filterInstances = (instances: FlatInstance[], selections: SimulationDimensionSelection[]) => {
  if (selections.length === 0) return instances;
  return instances.filter(item => selections.every(selection => matches(selection, item)));
};

const buildInstanceNode = (item: FlatInstance, depth: number): TreeNode => ({
  id: item.instance.id,
  label: item.instance.name,
  type: 'instance',
  depth,
  reference: { type: 'instance', categoryId: item.category.id, instanceId: item.instance.id },
  badge: instanceStatusBadge[item.instance.status]?.label ?? item.instance.status,
  badgeClass: instanceStatusBadge[item.instance.status]?.className,
  icon: 'ri-cpu-line',
  meta: `版本 ${item.instance.version} · Owner ${item.instance.owner}`,
  subtitle: item.instance.summary,
  muted: item.instance.typeAnnotationSource === 'auto',
  children: item.instance.folders.map(folder => ({
    id: folder.id,
    label: folder.name,
    type: 'folder',
    depth: depth + 1,
    reference: {
      type: 'folder',
      categoryId: item.category.id,
      instanceId: item.instance.id,
      folderId: folder.id
    },
    badge: `${folder.files.length}`,
    badgeClass: 'bg-gray-50 text-gray-600 border-gray-200',
    icon: 'ri-folder-2-line',
    meta: folder.statusSummary?.map(entry => `${entry.label || entry.status} ${entry.count}`).join(' · ') || '文件数',
    subtitle: folder.description
  }))
});

const applyNavLimit = (nodes: TreeNode[], navVisibleCount: number): TreeBuildResult => {
  const limit = Math.max(navVisibleCount, 1);
  const visible = nodes.slice(0, limit);
  return {
    nodes: visible,
    hasMore: nodes.length > visible.length,
    totalTopLevel: nodes.length,
    visibleTopLevel: visible.length
  };
};

const buildTypeTree = (
  categories: SimulationCategory[],
  filteredInstances: FlatInstance[],
  hasFilters: boolean,
  navVisibleCount: number,
  allowTypeDimension: boolean
): TreeBuildResult => {
  const filteredMap = new Map<string, FlatInstance[]>();
  filteredInstances.forEach(item => {
    const next = filteredMap.get(item.category.id) ?? [];
    next.push(item);
    filteredMap.set(item.category.id, next);
  });

  const nodes = categories.reduce<TreeNode[]>((acc, category) => {
    const instances = hasFilters ? filteredMap.get(category.id) ?? [] : category.instances.map(instance => ({ category, instance }));
    if (hasFilters && instances.length === 0) {
      return acc;
    }
    const info = getSimulationTypeInfo(category.typeCode ?? category.id);
    const referenceValue = category.typeCode ?? category.id;
    const isDimension = allowTypeDimension;
    const categoryNode: TreeNode = {
      id: category.id,
      label: category.name,
      type: isDimension ? 'dimension' : 'category',
      depth: 0,
      reference: isDimension
        ? {
            type: 'dimension',
            dimensionType: 'type',
            dimensionId: referenceValue,
            dimensionValue: referenceValue,
            dimensionLabel: category.name
          }
        : { type: 'category', categoryId: category.id },
      badge: hasFilters ? `${instances.length}/${category.instances.length}` : `${category.instances.length}`,
      badgeClass: info?.color ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-gray-50 text-gray-600 border-gray-200',
      icon: info?.icon ?? category.icon,
      meta: category.summary || info?.description || '仿真实例',
      subtitle: category.description,
      children: instances.map(item => buildInstanceNode(item, 1))
    };
    return [...acc, categoryNode];
  }, []);

  return applyNavLimit(nodes, navVisibleCount);
};

const buildStructureTree = (
  filteredInstances: FlatInstance[],
  allInstances: FlatInstance[],
  hasFilters: boolean,
  navVisibleCount: number
): TreeBuildResult => {
  const groupByStructure = (list: FlatInstance[]) => {
    const map = new Map<string, FlatInstance[]>();
    list.forEach(item => {
      const key =
        item.instance.primaryStructureId ??
        item.instance.structurePath?.[item.instance.structurePath.length - 1];
      if (!key) return;
      const arr = map.get(key) ?? [];
      arr.push(item);
      map.set(key, arr);
    });
    return map;
  };

  const totalMap = groupByStructure(allInstances);
  const filteredMap = groupByStructure(filteredInstances);

  interface BuildResult {
    node: TreeNode;
    totalCount: number;
    filteredCount: number;
  }

  const buildNode = (definition: SimulationStructureDefinition, depth: number): BuildResult | null => {
    const childResults = (definition.children ?? [])
      .map(child => buildNode(child, depth + 1))
      .filter(Boolean) as BuildResult[];

    const totalOwn = totalMap.get(definition.id) ?? [];
    const filteredOwn = filteredMap.get(definition.id) ?? [];
    const totalFromChildren = childResults.reduce((sum, child) => sum + child.totalCount, 0);
    const filteredFromChildren = childResults.reduce((sum, child) => sum + child.filteredCount, 0);

    const totalCount = totalOwn.length + totalFromChildren;
    const filteredCount = filteredOwn.length + filteredFromChildren;

    if (!hasFilters && totalCount === 0) {
      return null;
    }

    if (hasFilters && filteredCount === 0) {
      return null;
    }

    const instancesToShow = hasFilters ? filteredOwn : totalOwn;
    const children: TreeNode[] = [
      ...childResults.map(child => child.node),
      ...instancesToShow.map(item => buildInstanceNode(item, depth + 1))
    ];

    const badge =
      hasFilters && filteredCount !== totalCount ? `${filteredCount}/${totalCount}` : `${totalCount}`;

    const node: TreeNode = {
      id: definition.id,
      label: definition.name,
      type: 'dimension',
      depth,
      reference: {
        type: 'dimension',
        dimensionType: 'structure',
        dimensionId: definition.id,
        dimensionValue: definition.id,
        dimensionLabel: definition.name
      },
      badge,
      badgeClass: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      icon: depth === 0 ? 'ri-mind-map' : depth === 1 ? 'ri-stack-line' : 'ri-node-tree',
      meta: depth === 0 ? '产品级结构' : depth === 1 ? '系统级结构' : '分系统',
      children
    };

    return { node, totalCount, filteredCount };
  };

  const nodes = SIMULATION_STRUCTURE_TREE.map(node => buildNode(node, 0))
    .filter(Boolean)
    .map(result => (result as BuildResult).node);

  return applyNavLimit(nodes, navVisibleCount);
};

const buildTimeTree = (
  filteredInstances: FlatInstance[],
  allInstances: FlatInstance[],
  hasFilters: boolean,
  navVisibleCount: number
): TreeBuildResult => {
  const groupByMonth = (list: FlatInstance[]) => {
    const map = new Map<string, FlatInstance[]>();
    list.forEach(item => {
      const key = deriveTimeBucket(item.instance);
      const arr = map.get(key) ?? [];
      arr.push(item);
      map.set(key, arr);
    });
    return map;
  };

  const totalMap = groupByMonth(allInstances);
  const filteredMap = groupByMonth(filteredInstances);
  const monthKeys = Array.from(new Set([...totalMap.keys(), ...filteredMap.keys()]));
  const yearKeys = Array.from(
    new Set(monthKeys.map(key => (key === 'undefined' ? 'undefined' : key.split('-')[0])))
  ).sort((a, b) => {
    if (a === 'undefined') return 1;
    if (b === 'undefined') return -1;
    return Number(b) - Number(a);
  });

  const nodes = yearKeys.reduce<TreeNode[]>((acc, year) => {
    const months = monthKeys
      .filter(key => (key === 'undefined' ? year === 'undefined' : key.startsWith(year)))
      .sort((a, b) => {
        if (a === 'undefined') return 1;
        if (b === 'undefined') return -1;
        return a > b ? -1 : 1;
      });

    const childNodes = months.reduce<TreeNode[]>((children, monthKey) => {
      const totalList = totalMap.get(monthKey) ?? [];
      const filteredList = filteredMap.get(monthKey) ?? [];
      const instancesToShow = hasFilters ? filteredList : totalList;
      if (hasFilters && filteredList.length === 0) {
        return children;
      }
      const badge =
        hasFilters && filteredList.length !== totalList.length
          ? `${filteredList.length}/${totalList.length}`
          : `${totalList.length}`;

      const node: TreeNode = {
        id: `month-${monthKey}`,
        label: formatMonthLabel(monthKey),
        type: 'dimension',
        depth: 1,
        reference: {
          type: 'dimension',
          dimensionType: 'time',
          dimensionId: monthKey,
          dimensionValue: monthKey,
          dimensionLabel: formatMonthLabel(monthKey)
        },
        badge,
        badgeClass: 'bg-violet-50 text-violet-600 border-violet-100',
        icon: 'ri-calendar-event-line',
        meta: '月份分组',
        children: instancesToShow.map(item => buildInstanceNode(item, 2))
      };
      return [...children, node];
    }, []);

    const totalCount = months.reduce((sum, monthKey) => sum + (totalMap.get(monthKey)?.length ?? 0), 0);
    const filteredCount = months.reduce(
      (sum, monthKey) => sum + (filteredMap.get(monthKey)?.length ?? 0),
      0
    );

    if (!hasFilters && totalCount === 0) {
      return acc;
    }

    if (hasFilters && filteredCount === 0) {
      return acc;
    }

    const badge =
      hasFilters && filteredCount !== totalCount ? `${filteredCount}/${totalCount}` : `${totalCount}`;

    const yearNode: TreeNode = {
      id: `year-${year}`,
      label: year === 'undefined' ? '未定义年份' : `${year} 年`,
      type: 'dimension',
      depth: 0,
      reference: {
        type: 'dimension',
        dimensionId: year,
        dimensionValue: year
      },
      badge,
      badgeClass: 'bg-indigo-50 text-indigo-600 border-indigo-100',
      icon: 'ri-calendar-2-line',
      meta: '年份分组',
      children: childNodes
    };

    return [...acc, yearNode];
  }, []);

  return applyNavLimit(nodes, navVisibleCount);
};

const dimensionDescriptorMap = new Map<SimulationDimension, string>(
  SIMULATION_DIMENSION_DESCRIPTORS.map(descriptor => [descriptor.id, descriptor.label])
);

const viewModeDescriptions: Record<SimulationViewMode, { title: string; hint: string }> = {
  structure: { title: '结构视角', hint: '沿用方案BOM结构，聚焦仿真实例归属' },
  time: { title: '时间视角', hint: '按月份梳理执行节奏与缺口' },
  type: { title: '类型视角', hint: '按仿真专业分类浏览实例' }
};

const SimulationTreePanel = ({
  categories,
  viewMode,
  dimensionSelections,
  selectedNode,
  expandedNodeIds,
  navVisibleCount,
  navPageSize,
  onToggleExpand,
  onSelectNode,
  onLoadMore,
  onRemoveSelection,
  onClearSelections,
  showViewControls = true,
  availableViewModes = ['structure', 'time', 'type'],
  onViewModeChange,
  dimensionLimitBreachedAt,
  savedViews = [],
  onSaveView,
  onApplySavedView,
  onDeleteSavedView,
  onRenameSavedView,
  enableDimensionSelection = true
}: Props) => {
  const flatInstances = useMemo(() => flattenInstances(categories), [categories]);
  const filteredInstances = useMemo(
    () => filterInstances(flatInstances, dimensionSelections),
    [flatInstances, dimensionSelections]
  );
  const hasFilters = dimensionSelections.length > 0;

  const tree = useMemo<TreeBuildResult>(() => {
    if (viewMode === 'structure') {
      return buildStructureTree(filteredInstances, flatInstances, hasFilters, navVisibleCount);
    }
    if (viewMode === 'time') {
      return buildTimeTree(filteredInstances, flatInstances, hasFilters, navVisibleCount);
    }
    return buildTypeTree(categories, filteredInstances, hasFilters, navVisibleCount, enableDimensionSelection);
  }, [categories, filteredInstances, flatInstances, hasFilters, navVisibleCount, viewMode, enableDimensionSelection]);

  const viewTabs = useMemo(
    () => VIEW_MODE_TABS.filter(tab => availableViewModes.includes(tab.value)),
    [availableViewModes]
  );

  const triggerSaveView = useCallback(() => {
    if (!onSaveView) return;
    if (typeof window === 'undefined') return;
    const suggested = `视图 ${savedViews.length + 1}`;
    const input = window.prompt('保存当前组合视图，命名（≤30 字符）', suggested);
    if (!input) return;
    const trimmed = input.trim().slice(0, 30);
    if (!trimmed) return;
    onSaveView(trimmed);
  }, [onSaveView, savedViews.length]);

  const triggerRenameView = useCallback(
    (view: SimulationSavedView) => {
      if (!onRenameSavedView) return;
      if (typeof window === 'undefined') return;
      const next = window.prompt('重命名视图', view.name);
      if (!next) return;
      const trimmed = next.trim().slice(0, 30);
      if (!trimmed) return;
      onRenameSavedView(view.id, trimmed);
    },
    [onRenameSavedView]
  );

  const isSelected = (node: TreeNode) => {
    if (!selectedNode) return false;
    switch (node.reference.type) {
      case 'category':
        return selectedNode.type === 'category' && selectedNode.categoryId === node.reference.categoryId;
      case 'instance':
        return selectedNode.type === 'instance' && selectedNode.instanceId === node.reference.instanceId;
      case 'folder':
        return selectedNode.type === 'folder' && selectedNode.folderId === node.reference.folderId;
      case 'dimension':
        return (
          selectedNode.type === 'dimension' &&
          selectedNode.dimensionType === node.reference.dimensionType &&
          selectedNode.dimensionId === node.reference.dimensionId
        );
      default:
        return false;
    }
  };

  const renderNodes = (nodes: TreeNode[]) =>
    nodes.map(node => {
      const expanded = expandedNodeIds.includes(node.id);
      const hasChildren = (node.children?.length ?? 0) > 0;
      const selected = isSelected(node);
      const dimensionActive =
        node.reference.type === 'dimension' &&
        dimensionSelections.some(
          selection =>
            selection.dimension === node.reference.dimensionType &&
            selection.value === node.reference.dimensionValue
        );
      const active = selected || dimensionActive;
      const inlineBadge = node.type === 'instance' ? node.badge : null;
      const trailingBadge = node.type !== 'instance' ? node.badge : null;
      const titleText = node.subtitle || node.meta || node.label;
      const renderInlineBadge = () => {
        if (!inlineBadge) return null;
        if (inlineBadge === '已通过') {
          return (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] text-emerald-600">
              <i className="ri-checkbox-circle-line text-[12px]"></i>
              通过
            </span>
          );
        }
        return (
          <span className="rounded-full border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-[10px] text-blue-600">
            {inlineBadge}
          </span>
        );
      };
      return (
        <div key={node.id}>
          <div
            className={`flex items-center gap-2 rounded-md border border-transparent px-2 py-1 text-sm transition-colors duration-150 ${
              active ? 'border-blue-200 bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-blue-50'
            } ${node.muted ? 'opacity-80' : ''}`}
            style={{ marginLeft: node.depth * 16 }}
            title={titleText}
            onClick={() => {
              onSelectNode(node.reference);
              if (hasChildren) {
                onToggleExpand(node.id);
              }
            }}
          >
            {hasChildren && (
              <button
                className="w-4 h-4 flex items-center justify-center text-[11px] text-gray-400 hover:text-gray-600"
                onClick={event => {
                  event.stopPropagation();
                  onToggleExpand(node.id);
                }}
              >
                <i className={`ri-${expanded ? 'subtract' : 'add'}-line`}></i>
              </button>
            )}
            {(() => {
              const iconName =
                node.type === 'folder'
                  ? expanded
                    ? 'ri-folder-open-line'
                    : 'ri-folder-3-line'
                  : node.icon;
              if (!iconName) return null;
              return <i className={`${iconName} text-sm ${active ? 'text-blue-500' : 'text-gray-400'}`}></i>;
            })()}
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex items-center gap-2">
                <span className="truncate font-medium leading-5">{node.label}</span>
                {renderInlineBadge()}
              </div>
              {node.meta && <span className="truncate text-[11px] text-gray-400">{node.meta}</span>}
            </div>
            {trailingBadge && (
              <span
                className={`ml-2 text-[11px] px-1.5 py-0.5 rounded-full border ${
                  node.badgeClass || 'bg-gray-50 text-gray-600 border-gray-200'
                }`}
              >
                {trailingBadge}
              </span>
            )}
          </div>
          {hasChildren && expanded && <div>{renderNodes(node.children!)}</div>}
        </div>
      );
    });

  const viewDescriptor = viewModeDescriptions[viewMode];
  const showDimensionChips = showViewControls && dimensionSelections.length > 0;
  const limitWarningVisible = showViewControls && Boolean(dimensionLimitBreachedAt);
  const selectionSummary = `命中 ${filteredInstances.length} / ${flatInstances.length} 个仿真实例`;

  return (
    <div className="flex h-full flex-col bg-gray-50/60">
      <div className="sticky top-0 z-10 border-b border-gray-200 bg-white/95 px-3 py-2 backdrop-blur">
        <div className="flex flex-col gap-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            {showViewControls ? (
              <div className="inline-flex rounded-md border border-gray-200 bg-white p-0.5 text-[11px] shadow-sm">
                {viewTabs.map(tab => {
                  const active = tab.value === viewMode;
                  return (
                    <button
                      key={tab.value}
                      className={`inline-flex items-center gap-1 rounded-md px-2 py-1 transition-colors ${
                        active ? 'bg-blue-500 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'
                      }`}
                      onClick={() => onViewModeChange?.(tab.value)}
                      type="button"
                      title={`切换至${tab.label}视角`}
                    >
                      <i className={`${tab.icon} text-xs`}></i>
                      <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <span className="text-sm font-semibold text-gray-900">{viewDescriptor.title}</span>
            )}
            {showViewControls && onSaveView ? (
              <button
                className="ml-auto inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-1 text-[11px] text-gray-600 transition-colors hover:border-blue-200 hover:text-blue-600"
                onClick={triggerSaveView}
                type="button"
              >
                保存当前视图
              </button>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
            {showViewControls ? (
              <>
                <span className="text-gray-400">常用视图</span>
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-blue-600">{selectionSummary}</span>
              </>
            ) : (
              <span>{selectionSummary}</span>
            )}
          </div>
        </div>
        {viewDescriptor.hint && (
          <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
            <span className="font-medium text-gray-900">{viewDescriptor.title}</span>
            <span className="truncate text-gray-400">{viewDescriptor.hint}</span>
          </div>
        )}
        {limitWarningVisible && (
          <div className="mt-2 inline-flex items-center gap-1 rounded border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] text-amber-600">
            <i className="ri-error-warning-line"></i>
            最多选择 {SIMULATION_DIMENSION_LIMIT} 个维度，先清除已有条件
          </div>
        )}
        {showViewControls && savedViews.length > 0 && (
          <div className="mt-1 flex gap-1 overflow-x-auto rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-[11px] text-gray-600">
            {savedViews.map(view => (
              <span
                key={view.id}
                className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-1 shadow-sm"
              >
                <button
                  className="text-gray-700 hover:text-blue-600"
                  onClick={() => onApplySavedView?.(view.id)}
                  type="button"
                  title={`应用视图：${view.name}`}
                >
                  <i className="ri-layout-row-line mr-1 text-sm text-blue-500"></i>
                  {view.name}
                </button>
                {onRenameSavedView && (
                  <button
                    className="text-gray-400 hover:text-blue-600"
                    onClick={() => triggerRenameView(view)}
                    type="button"
                    title="重命名"
                  >
                    <i className="ri-edit-2-line text-xs"></i>
                  </button>
                )}
                {onDeleteSavedView && (
                  <button
                    className="text-gray-400 hover:text-red-500"
                    onClick={() => onDeleteSavedView(view.id)}
                    type="button"
                    title="删除"
                  >
                    <i className="ri-delete-bin-line text-xs"></i>
                  </button>
                )}
              </span>
            ))}
          </div>
        )}
        {showDimensionChips && (
          <div className="mt-2 flex flex-wrap items-center gap-2 rounded-md bg-blue-50/40 px-2 py-1 text-[11px] text-gray-600">
            {dimensionSelections.map(selection => {
              const label = dimensionDescriptorMap.get(selection.dimension) ?? selection.dimension;
              return (
                <span
                  key={selection.id}
                  className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5"
                >
                  <span className="truncate max-w-[120px]" title={`${label} · ${selection.label}`}>
                    {label} · {selection.label}
                  </span>
                  <button
                    className="text-blue-500 hover:text-blue-700"
                    onClick={() => onRemoveSelection(selection.id)}
                    type="button"
                    title="移除筛选"
                  >
                    <i className="ri-close-line text-xs"></i>
                  </button>
                </span>
              );
            })}
            <button
              className="ml-auto text-[11px] text-blue-600 hover:text-blue-800"
              onClick={onClearSelections}
              type="button"
              title="清空组合筛选"
            >
              清空
            </button>
          </div>
        )}
      </div>
      <div className="flex-1 overflow-y-auto px-2 pb-3 pt-2 space-y-1">
        {tree.nodes.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white/60 px-3 py-6 text-center text-xs text-gray-500">
            暂无匹配节点，请调整筛选条件。
          </div>
        ) : (
          renderNodes(tree.nodes)
        )}
      </div>
      {tree.hasMore && (
        <div className="border-t border-gray-200 bg-white px-3 py-2">
          <button
            className="w-full rounded-lg border border-gray-300 bg-gray-50 py-1.5 text-xs text-gray-600 hover:bg-gray-100"
            onClick={onLoadMore}
            type="button"
          >
            加载更多（{tree.visibleTopLevel}/{tree.totalTopLevel}）
            <span className="ml-1 text-gray-400">+{navPageSize}</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default SimulationTreePanel;
