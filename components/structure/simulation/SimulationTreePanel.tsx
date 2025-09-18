import { useMemo } from 'react';
import { SimulationCategory } from './types';
import { TreeNodeReference } from './useSimulationExplorerState';

type TreeNode = {
  id: string;
  label: string;
  type: 'category' | 'instance' | 'folder';
  depth: number;
  reference: TreeNodeReference;
  badge?: string;
  badgeClass?: string;
  icon?: string;
  meta?: string;
  subtitle?: string;
  children?: TreeNode[];
};

const instanceStatusBadge: Record<string, { label: string; className: string }> = {
  approved: { label: '通过', className: 'bg-green-50 text-green-600 border-green-100' },
  'in-progress': { label: '进行中', className: 'bg-blue-50 text-blue-600 border-blue-100' },
  draft: { label: '草稿', className: 'bg-gray-50 text-gray-600 border-gray-100' },
  archived: { label: '归档', className: 'bg-amber-50 text-amber-600 border-amber-100' }
};

interface Props {
  categories: SimulationCategory[];
  selectedNode: TreeNodeReference | null;
  expandedNodeIds: string[];
  onToggleExpand: (id: string) => void;
  onSelectNode: (ref: TreeNodeReference) => void;
}

const buildTree = (categories: SimulationCategory[]): TreeNode[] =>
  categories.map(category => ({
    id: category.id,
    label: category.name,
    type: 'category',
    depth: 0,
    reference: { type: 'category', categoryId: category.id },
    badge: `${category.instances.length}`,
    badgeClass: 'bg-blue-50 text-blue-600 border-blue-100',
    icon: category.icon,
    meta: category.summary || '仿真实例',
    subtitle: category.description,
    children: category.instances.map(instance => ({
      id: instance.id,
      label: instance.name,
      type: 'instance',
      depth: 1,
      reference: { type: 'instance', categoryId: category.id, instanceId: instance.id },
      badge: instanceStatusBadge[instance.status]?.label ?? instance.status,
      badgeClass: instanceStatusBadge[instance.status]?.className,
      icon: 'ri-cpu-line',
      meta: `工况 ${instance.conditions.length}${instance.riskCount ? ` · 风险 ${instance.riskCount}` : ''}`,
      subtitle: instance.summary,
      children: instance.folders.map(folder => ({
        id: folder.id,
        label: `${folder.name}`,
        type: 'folder',
        depth: 2,
        reference: { type: 'folder', categoryId: category.id, instanceId: instance.id, folderId: folder.id },
        badge: `${folder.files.length}`,
        badgeClass: 'bg-gray-50 text-gray-600 border-gray-200',
        icon: 'ri-folder-2-line',
        meta: folder.statusSummary?.map(item => `${item.label || item.status} ${item.count}`).join(' · ') || '文件数',
        subtitle: folder.description
      }))
    }))
  }));

const SimulationTreePanel = ({ categories, selectedNode, expandedNodeIds, onToggleExpand, onSelectNode }: Props) => {
  const tree = useMemo(() => buildTree(categories), [categories]);

  const isSelected = (node: TreeNode) => {
    if (!selectedNode) return false;
    switch (node.type) {
      case 'category':
        return selectedNode.categoryId === node.reference.categoryId && selectedNode.type === 'category';
      case 'instance':
        return selectedNode.instanceId === node.reference.instanceId && selectedNode.type === 'instance';
      case 'folder':
        return selectedNode.folderId === node.reference.folderId && selectedNode.type === 'folder';
      default:
        return false;
    }
  };

  const renderNodes = (nodes: TreeNode[]) =>
    nodes.map(node => {
      const isExpanded = expandedNodeIds.includes(node.id);
      const hasChildren = node.children && node.children.length > 0;
      const selected = isSelected(node);
      return (
        <div key={node.id}>
          <div
            className={`flex items-center px-2 py-1.5 rounded-lg cursor-pointer transition-colors text-sm ${
              selected ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'hover:bg-gray-100 text-gray-700'
            }`}
            style={{ marginLeft: node.depth * 16 }}
            onClick={() => {
              onSelectNode(node.reference);
              if (hasChildren) {
                onToggleExpand(node.id);
              }
            }}
          >
            {hasChildren && (
              <button
                className="w-4 h-4 flex items-center justify-center mr-2 text-xs text-gray-500 hover:text-gray-700"
                onClick={e => {
                  e.stopPropagation();
                  onToggleExpand(node.id);
                }}
              >
                <i className={`ri-${isExpanded ? 'subtract' : 'add'}-line`}></i>
              </button>
            )}
            {(() => {
              const iconName = node.type === 'folder' ? (isExpanded ? 'ri-folder-open-line' : 'ri-folder-3-line') : node.icon;
              if (!iconName) return null;
              return <i className={`${iconName} mr-2 text-base ${selected ? 'text-blue-600' : 'text-gray-400'}`}></i>;
            })()}
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium">{node.label}</div>
              {node.meta && <div className="truncate text-[11px] text-gray-400">{node.meta}</div>}
              {node.subtitle && node.subtitle !== node.meta && (
                <div className="truncate text-[11px] text-gray-300">{node.subtitle}</div>
              )}
            </div>
            {node.badge && (
              <span
                className={`ml-2 text-[11px] px-1.5 py-0.5 rounded-full border ${node.badgeClass || 'bg-gray-50 text-gray-600 border-gray-200'}`}
                title={node.meta}
              >
                {node.badge}
              </span>
            )}
          </div>
          {hasChildren && isExpanded && <div>{renderNodes(node.children!)}</div>}
        </div>
      );
    });

  return (
    <div className="w-72 border-r border-gray-200 bg-gray-50/60 h-full flex flex-col">
      <div className="px-4 py-3 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900">仿真数据</h3>
        <p className="text-xs text-gray-500 mt-1">按类型、实例、文件夹分层导航。</p>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        {renderNodes(tree)}
      </div>
    </div>
  );
};

export default SimulationTreePanel;
