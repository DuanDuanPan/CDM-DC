import { useMemo } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { SIMULATION_DIMENSION_DESCRIPTORS, SIMULATION_TYPE_DICTIONARY, getSimulationTypeInfo } from './dimensions';
import { SIMULATION_STRUCTURE_TREE, type SimulationStructureDefinition } from './structureTree';
import type { SimulationCategory, SimulationDimension, SimulationInstance } from './types';
import type { TreeNodeReference } from './useSimulationExplorerState';

type TreeNodeType = 'dimension' | 'instance' | 'folder';

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
  children: TreeNode[];
  muted?: boolean;
  instanceCount?: number;
  order?: number;
}

interface TreeBuildResult {
  nodes: TreeNode[];
  hasMore: boolean;
  totalTopLevel: number;
  visibleTopLevel: number;
}

interface Props {
  categories: SimulationCategory[];
  activeDimensions: SimulationDimension[];
  selectedNode: TreeNodeReference | null;
  expandedNodeIds: string[];
  navVisibleCount: number;
  navPageSize: number;
  onToggleExpand: (id: string) => void;
  onSelectNode: (ref: TreeNodeReference) => void;
  onLoadMore: () => void;
  headerActions?: ReactNode;
}

interface StructureInfo {
  id: string;
  name: string;
  level: number;
  order: number;
  parentId?: string;
}

const instanceStatusBadge: Record<SimulationInstance['status'], { label: string; className: string }> = {
  approved: { label: '已通过', className: 'bg-green-50 text-green-600 border-green-100' },
  'in-progress': { label: '进行中', className: 'bg-blue-50 text-blue-600 border-blue-100' },
  draft: { label: '草稿', className: 'bg-gray-50 text-gray-600 border-gray-100' },
  archived: { label: '已归档', className: 'bg-amber-50 text-amber-600 border-amber-100' }
};

const dimensionDescriptorMap = new Map(SIMULATION_DIMENSION_DESCRIPTORS.map(descriptor => [descriptor.id, descriptor]));

const typeOrderMap = new Map(SIMULATION_TYPE_DICTIONARY.map((item, index) => [item.code, index]));

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

const buildStructureIndex = (
  nodes: SimulationStructureDefinition[],
  parentId?: string,
  orderOffset = 0,
  map = new Map<string, StructureInfo>()
): Map<string, StructureInfo> => {
  nodes.forEach((node, index) => {
    const info: StructureInfo = {
      id: node.id,
      name: node.name,
      level: node.level,
      order: orderOffset + index,
      parentId
    };
    map.set(node.id, info);
    if (node.children?.length) {
      buildStructureIndex(node.children, node.id, orderOffset + index * 100, map);
    }
  });
  return map;
};

const structureInfoMap = buildStructureIndex(SIMULATION_STRUCTURE_TREE);

const ensureChild = (children: TreeNode[], id: string, factory: () => TreeNode) => {
  let node = children.find(item => item.id === id);
  if (!node) {
    node = factory();
    children.push(node);
  }
  return node;
};

const updateBadges = (nodes: TreeNode[]) => {
  nodes.forEach(node => {
    if (node.type === 'dimension') {
      node.badge = `${node.instanceCount ?? 0}`;
    }
    if (node.children.length > 0) {
      updateBadges(node.children);
    }
  });
};

const sortTreeNodes = (nodes: TreeNode[]) => {
  if (nodes.length <= 1) return;
  const allFolders = nodes.every(node => node.type === 'folder');
  if (!allFolders) {
    nodes.sort((a, b) => {
      if (a.type === 'dimension' && b.type === 'dimension') {
        const aDim = a.reference.dimensionType;
        const bDim = b.reference.dimensionType;
        if (aDim === 'time' && bDim === 'time') {
          return (b.order ?? 0) - (a.order ?? 0);
        }
        return (a.order ?? 0) - (b.order ?? 0);
      }
      if (a.type === 'dimension') return -1;
      if (b.type === 'dimension') return 1;
      if (a.type === 'instance' && b.type === 'instance') {
        return a.label.localeCompare(b.label, 'zh-CN');
      }
      if (a.type === 'instance') return -1;
      if (b.type === 'instance') return 1;
      return 0;
    });
  }
  nodes.forEach(node => sortTreeNodes(node.children));
};

const buildHierarchyTree = (categories: SimulationCategory[], activeDimensions: SimulationDimension[]): TreeNode[] => {
  const root: TreeNode[] = [];

  categories.forEach(category => {
    category.instances.forEach(instance => {
      let currentDepth = 0;
      let currentChildren = root;
      const trail: TreeNode[] = [];

      activeDimensions.forEach(dimension => {
        if (dimension === 'structure') {
          const structurePath = instance.structurePath?.length ? instance.structurePath : ['undefined-structure'];
          structurePath.forEach((structureId, index) => {
            const info = structureInfoMap.get(structureId);
            const label = info?.name ?? `结构节点 ${structureId}`;
            const nodeId = `dimension:structure:${structureId}`;
            const reference: TreeNodeReference = {
              type: 'dimension',
              dimensionType: 'structure',
              dimensionId: structureId,
              dimensionValue: structureId,
              dimensionLabel: label
            };
            const meta =
              info?.level === 0 ? '产品级结构' : info?.level === 1 ? '系统级结构' : info?.level === 2 ? '分系统' : '结构层级';
            const icon =
              info?.level === 0 ? 'ri-mind-map' : info?.level === 1 ? 'ri-stack-line' : 'ri-node-tree';
            const node = ensureChild(currentChildren, nodeId, () => ({
              id: nodeId,
              label,
              type: 'dimension',
              depth: currentDepth,
              reference,
              icon,
              badgeClass: 'bg-emerald-50 text-emerald-600 border-emerald-100',
              meta,
              children: [],
              instanceCount: 0,
              order: info?.order ?? index
            }));
            node.depth = currentDepth;
            trail.push(node);
            currentChildren = node.children;
            currentDepth += 1;
          });
        }
        if (dimension === 'type') {
          const typeCode = instance.typeCode ?? category.typeCode ?? category.id;
          const info = getSimulationTypeInfo(typeCode);
          const label = info?.name ?? category.name;
          const nodeId = `dimension:type:${typeCode}`;
          const reference: TreeNodeReference = {
            type: 'dimension',
            dimensionType: 'type',
            dimensionId: typeCode,
            dimensionValue: typeCode,
            dimensionLabel: label
          };
          const order = typeOrderMap.get(typeCode) ?? -trail.length;
          const node = ensureChild(currentChildren, nodeId, () => ({
            id: nodeId,
            label,
            type: 'dimension',
            depth: currentDepth,
            reference,
            icon: info?.icon ?? 'ri-apps-line',
            badgeClass: 'bg-blue-50 text-blue-600 border-blue-100',
            meta: info?.description ?? '仿真类型',
            children: [],
            instanceCount: 0,
            order
          }));
          node.depth = currentDepth;
          trail.push(node);
          currentChildren = node.children;
          currentDepth += 1;
        }
        if (dimension === 'time') {
          const bucket = deriveTimeBucket(instance);
          const label = formatMonthLabel(bucket);
          const nodeId = `dimension:time:${bucket}`;
          const reference: TreeNodeReference = {
            type: 'dimension',
            dimensionType: 'time',
            dimensionId: bucket,
            dimensionValue: bucket,
            dimensionLabel: label
          };
          const order = bucket === 'undefined' ? Number.NEGATIVE_INFINITY : Number(bucket.replace('-', ''));
          const node = ensureChild(currentChildren, nodeId, () => ({
            id: nodeId,
            label,
            type: 'dimension',
            depth: currentDepth,
            reference,
            icon: 'ri-calendar-2-line',
            badgeClass: 'bg-violet-50 text-violet-600 border-violet-100',
            meta: '月份分组',
            children: [],
            instanceCount: 0,
            order
          }));
          node.depth = currentDepth;
          trail.push(node);
          currentChildren = node.children;
          currentDepth += 1;
        }
      });

      const instanceNode: TreeNode = {
        id: `instance:${instance.id}`,
        label: instance.name,
        type: 'instance',
        depth: currentDepth,
        reference: {
          type: 'instance',
          categoryId: category.id,
          instanceId: instance.id
        },
        badge: instanceStatusBadge[instance.status]?.label ?? instance.status,
        badgeClass: instanceStatusBadge[instance.status]?.className,
        icon: 'ri-cpu-line',
        meta: `版本 ${instance.version} · Owner ${instance.owner}`,
        subtitle: instance.summary,
        children: instance.folders.map(folder => ({
          id: folder.id,
          label: folder.name,
          type: 'folder',
          depth: currentDepth + 1,
          reference: {
            type: 'folder',
            categoryId: category.id,
            instanceId: instance.id,
            folderId: folder.id
          },
          badge: `${folder.files.length}`,
          badgeClass: 'bg-gray-50 text-gray-600 border-gray-200',
          icon: 'ri-folder-2-line',
          meta:
            folder.statusSummary?.map(entry => `${entry.label || entry.status} ${entry.count}`).join(' · ') ||
            '文件数',
          subtitle: folder.description,
          children: []
        })),
        muted: instance.typeAnnotationSource === 'auto'
      };
      currentChildren.push(instanceNode);
      trail.forEach(node => {
        node.instanceCount = (node.instanceCount ?? 0) + 1;
      });
    });
  });

  updateBadges(root);
  sortTreeNodes(root);
  return root;
};

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

const SimulationTreePanel = ({
  categories,
  activeDimensions,
  selectedNode,
  expandedNodeIds,
  navVisibleCount,
  navPageSize,
  onToggleExpand,
  onSelectNode,
  onLoadMore,
  headerActions
}: Props) => {
  const hierarchy = useMemo(
    () => buildHierarchyTree(categories, activeDimensions),
    [categories, activeDimensions]
  );

  const tree = useMemo(() => applyNavLimit(hierarchy, navVisibleCount), [hierarchy, navVisibleCount]);

  const selectionSummary =
    activeDimensions.length === 0
      ? '未选择维度'
      : activeDimensions
          .map(dimension => dimensionDescriptorMap.get(dimension)?.label ?? dimension)
          .join(' → ');

  const isSelected = (node: TreeNode) => {
    if (!selectedNode) return false;
    switch (node.reference.type) {
      case 'dimension':
        return (
          selectedNode.type === 'dimension' &&
          selectedNode.dimensionType === node.reference.dimensionType &&
          selectedNode.dimensionId === node.reference.dimensionId
        );
      case 'instance':
        return selectedNode.type === 'instance' && selectedNode.instanceId === node.reference.instanceId;
      case 'folder':
        return selectedNode.type === 'folder' && selectedNode.folderId === node.reference.folderId;
      default:
        return false;
    }
  };

  const renderNodes = (nodes: TreeNode[]) =>
    nodes.map(node => {
      const expanded = expandedNodeIds.includes(node.id);
      const hasChildren = node.children.length > 0;
      const selected = isSelected(node);

      return (
        <div key={node.id} className="space-y-1">
          <div
            className={`flex items-start gap-2 rounded-md px-2 py-1.5 text-xs ${
              selected
                ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-200'
                : 'hover:bg-gray-50 text-gray-600'
            }`}
            style={{ paddingLeft: `${Math.min(node.depth, 6) * 12}px` }}
          >
            <button
              className={`flex items-center gap-2 ${hasChildren ? 'text-left flex-1' : 'text-left flex-1'}`}
              onClick={() => {
                if (hasChildren) {
                  onToggleExpand(node.id);
                }
                onSelectNode(node.reference);
              }}
              type="button"
            >
              {hasChildren && (
                <span className="text-[10px] text-gray-400">
                  <i className={`ri-arrow-${expanded ? 'down' : 'right'}-s-line`} />
                </span>
              )}
              {node.icon && <i className={`${node.icon} text-sm text-gray-400`} />}
              <span className="truncate font-medium text-gray-700">{node.label}</span>
            </button>
            {node.badge && (
              <span
                className={`inline-flex min-w-[40px] justify-center rounded-full border px-2 py-0.5 text-[10px] font-medium whitespace-nowrap flex-shrink-0 ${node.badgeClass}`}
              >
                {node.badge}
              </span>
            )}
          </div>
          {node.meta && (
          <div
            className="ml-[calc(12px*var(--depth))] pl-6 pr-2 text-[10px] text-gray-400"
            style={{ '--depth': Math.min(node.depth, 6) } as CSSProperties}
          >
              {node.meta}
            </div>
          )}
          {expanded && hasChildren && (
            <div className="ml-3 border-l border-dashed border-gray-200 pl-2">{renderNodes(node.children)}</div>
          )}
        </div>
      );
    });

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-sm font-semibold text-gray-900">仿真导航</div>
            <div className="mt-1 text-[11px] text-gray-500">当前层级：{selectionSummary}</div>
          </div>
          {headerActions ? <div className="flex items-center gap-2">{headerActions}</div> : null}
        </div>
      </div>
      <div className="flex-1 space-y-1 overflow-y-auto px-2 pb-3 pt-2">
        {tree.nodes.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white/60 px-3 py-6 text-center text-xs text-gray-500">
            暂无仿真实例。
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
