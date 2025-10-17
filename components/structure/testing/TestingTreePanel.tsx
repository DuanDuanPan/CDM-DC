import { Fragment, useMemo } from 'react';
import type { TestProject, TestProjectStatus, TestStructureNode, TestTypeDescriptor, TestingNodeReference } from './types';
import { TEST_STRUCTURE_INDEX, collectProjectsInSubtree, projectMatchesExactStructure, getTestType } from './data';

interface TestingTreePanelProps {
  structure: TestStructureNode[];
  projects: TestProject[];
  selectedNode: TestingNodeReference | null;
  expandedNodeIds: string[];
  onSelectNode: (node: TestingNodeReference) => void;
  onToggleExpand: (nodeId: string) => void;
  testTypes: TestTypeDescriptor[];
}

const structureIconByLevel = (level: number): string => {
  if (level <= 0) return 'ri-mind-map';
  if (level === 1) return 'ri-stack-line';
  if (level === 2) return 'ri-node-tree';
  if (level === 3) return 'ri-ancient-gate-line';
  return 'ri-checkbox-blank-circle-line';
};

const statusTone: Record<TestProjectStatus, { label: string; className: string }> = {
  planned: { label: '计划', className: 'border-slate-200 bg-slate-50 text-slate-600' },
  'in-progress': { label: '进行中', className: 'border-blue-200 bg-blue-50 text-blue-600' },
  completed: { label: '已完成', className: 'border-emerald-200 bg-emerald-50 text-emerald-600' },
  blocked: { label: '受阻', className: 'border-amber-200 bg-amber-50 text-amber-600' }
};

const itemStatusTone: Record<string, { label: string; className: string }> = {
  planned: { label: '计划', className: 'border-slate-200 bg-slate-50 text-slate-600' },
  'in-progress': { label: '进行中', className: 'border-blue-200 bg-blue-50 text-blue-600' },
  scheduled: { label: '排程', className: 'border-indigo-200 bg-indigo-50 text-indigo-600' },
  completed: { label: '已完成', className: 'border-emerald-200 bg-emerald-50 text-emerald-600' },
  blocked: { label: '受阻', className: 'border-amber-200 bg-amber-50 text-amber-600' }
};

const isSamePath = (left: string[], right: string[]): boolean => {
  if (left.length !== right.length) return false;
  return left.every((id, index) => id === right[index]);
};

const makeStructureNodeReference = (path: string[], id: string): TestingNodeReference => ({
  type: 'structure',
  id,
  structurePath: [...path]
});

const makeTypeNodeReference = (path: string[], typeId: string): TestingNodeReference => ({
  type: 'type',
  id: `${path.join('/')}:${typeId}`,
  structurePath: [...path],
  typeId
});

const makeProjectNodeReference = (project: TestProject): TestingNodeReference => ({
  type: 'project',
  id: project.id,
  structurePath: [...project.structurePath],
  typeId: project.typeId,
  projectId: project.id
});

const makeItemReference = (project: TestProject, itemId: string): TestingNodeReference => ({
  type: 'item',
  id: itemId,
  structurePath: [...project.structurePath],
  typeId: project.typeId,
  projectId: project.id,
  itemId
});

const getTypeToneClass = (descriptor?: TestTypeDescriptor): string => {
  switch (descriptor?.tone) {
    case 'blue':
      return 'border-blue-200 bg-blue-50 text-blue-600';
    case 'emerald':
      return 'border-emerald-200 bg-emerald-50 text-emerald-600';
    case 'violet':
      return 'border-violet-200 bg-violet-50 text-violet-600';
    case 'orange':
      return 'border-orange-200 bg-orange-50 text-orange-600';
    case 'amber':
      return 'border-amber-200 bg-amber-50 text-amber-600';
    default:
      return 'border-slate-200 bg-slate-50 text-slate-600';
  }
};

const projectSummary = (project: TestProject): string => {
  const { coverage, readiness } = project;
  const coverageLabel = `${Math.round(coverage)}% 覆盖`;
  const readinessLabel = `${Math.round(readiness)}% 就绪`;
  return `${coverageLabel} · ${readinessLabel}`;
};

const CARET_CLASSES =
  'flex h-6 w-6 items-center justify-center rounded-md text-gray-400 transition hover:text-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500';

const NODE_CONTAINER_BASE =
  'group relative flex items-start gap-3 rounded-xl border px-3 py-2 text-sm leading-5 transition-colors duration-150';

const ITEM_CONTAINER_BASE =
  'group relative flex items-start gap-3 rounded-xl border px-3 py-2 text-xs leading-4 transition-colors duration-150';

const BADGE_BASE =
  'inline-flex items-center justify-center rounded-full border px-2 py-0.5 text-[11px] font-medium whitespace-nowrap';

export function TestingTreePanel({
  structure,
  projects,
  selectedNode,
  expandedNodeIds,
  onSelectNode,
  onToggleExpand,
  testTypes
}: TestingTreePanelProps) {
  const typeMap = useMemo(() => new Map(testTypes.map(type => [type.id, type])), [testTypes]);

  const renderSpacer = () => <span className="h-5 w-5" aria-hidden="true" />;

  const renderCountBadge = (count: number, tone: 'neutral' | 'accent' = 'neutral') => {
    const toneClass =
      tone === 'accent'
        ? 'border-emerald-200 bg-emerald-50 text-emerald-600'
        : 'border-slate-200 bg-white text-slate-600';
    return (
      <span className={`${BADGE_BASE} ${toneClass}`}>
        {count}
        <span className="ml-1 text-[10px]">项</span>
      </span>
    );
  };

  const renderProjectNode = (project: TestProject, depth: number) => {
    const nodeId = `project:${project.id}`;
    const isSelected =
      (selectedNode?.type === 'project' && selectedNode.projectId === project.id) ||
      (selectedNode?.type === 'item' && selectedNode.projectId === project.id);
    const hasItems = project.items.length > 0;
    const isExpanded = expandedNodeIds.includes(nodeId);
    const statusInfo = statusTone[project.status];

    return (
      <div key={project.id}>
        <div
          className={`${NODE_CONTAINER_BASE} ${
            isSelected
              ? 'border-blue-200 bg-blue-50/80 shadow-sm'
              : 'border-transparent hover:border-slate-200 hover:bg-slate-50'
          }`}
          style={{ marginLeft: `${depth * 20}px` }}
          onClick={() => onSelectNode(makeProjectNodeReference(project))}
        >
          {isSelected && <span className="absolute inset-y-2 left-1 w-1 rounded-full bg-blue-500" />}
          <div className="flex h-full flex-col items-center justify-start pt-0.5">
            {hasItems ? (
              <button
                type="button"
                className={CARET_CLASSES}
                onClick={event => {
                  event.stopPropagation();
                  onToggleExpand(nodeId);
                }}
                aria-label={isExpanded ? '收起试验项目' : '展开试验项目'}
              >
                <i className={`ri-${isExpanded ? 'arrow-down-s-line' : 'arrow-right-s-line'} text-base`} />
              </button>
            ) : (
              renderSpacer()
            )}
          </div>
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-orange-50 text-orange-500">
            <i className="ri-test-tube-line text-base" />
          </div>
          <div className="flex min-w-0 items-start gap-3">
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex min-w-0 items-center gap-2">
                <span className="truncate font-medium text-gray-900" title={project.name}>
                  {project.name}
                </span>
                <span className={`${BADGE_BASE} ${statusInfo.className}`}>{statusInfo.label}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                <span className="truncate" title={projectSummary(project)}>
                  {projectSummary(project)}
                </span>
                <span className="text-slate-300">•</span>
                <span className="font-mono text-slate-400">{project.code}</span>
              </div>
            </div>
            <div className="ml-auto flex-shrink-0">
              {renderCountBadge(project.items.length, project.riskLevel === 'high' ? 'accent' : 'neutral')}
            </div>
          </div>
        </div>
        {hasItems && isExpanded ? (
          <div className="ml-6 border-l border-dashed border-gray-200 pl-4">
            {project.items.map(itemEntry => {
              const tone = itemStatusTone[itemEntry.status] ?? itemStatusTone.planned;
              const isItemSelected = selectedNode?.type === 'item' && selectedNode.itemId === itemEntry.id;
              return (
                <div key={itemEntry.id} className="mt-2">
                  <div
                    className={`${ITEM_CONTAINER_BASE} cursor-pointer ${
                      isItemSelected
                        ? 'border-blue-200 bg-blue-50/70 shadow-sm'
                        : 'border-transparent hover:border-slate-200 hover:bg-slate-50'
                    }`}
                    onClick={() => onSelectNode(makeItemReference(project, itemEntry.id))}
                  >
                    {isItemSelected && <span className="absolute inset-y-2 left-1 w-1 rounded-full bg-blue-500" />}
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-white text-slate-400">
                      <i className="ri-checkbox-blank-circle-fill text-[9px]" />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="truncate text-gray-900" title={itemEntry.name}>
                          {itemEntry.name}
                        </span>
                        <span className={`${BADGE_BASE} ${tone.className}`}>{tone.label}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <span className="truncate">{itemEntry.method}</span>
                        <span className="text-slate-300">•</span>
                        <span className="truncate">{itemEntry.environment}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}
      </div>
    );
  };

  const renderTypeNodes = (structurePath: string[], depth: number) => {
    const projectsAtLevel = projects.filter(project => projectMatchesExactStructure(project, structurePath));
    if (!projectsAtLevel.length) return null;
    const typeBuckets = new Map<string, TestProject[]>();
    projectsAtLevel.forEach(project => {
      const current = typeBuckets.get(project.typeId) ?? [];
      current.push(project);
      typeBuckets.set(project.typeId, current);
    });
    return Array.from(typeBuckets.entries()).map(([typeId, bucket]) => {
      const nodeId = `type:${structurePath.join('/')}:${typeId}`;
      const isExpanded = expandedNodeIds.includes(nodeId);
      const descriptor = typeMap.get(typeId) ?? getTestType(typeId);
      const label = descriptor?.name ?? `试验类型 ${typeId}`;
      const isSelected =
        selectedNode?.type === 'type' && selectedNode.typeId === typeId && isSamePath(selectedNode.structurePath, structurePath);
      return (
        <Fragment key={nodeId}>
          <div
            className={`${NODE_CONTAINER_BASE} ${
              isSelected
                ? 'border-blue-200 bg-blue-50/70 shadow-sm'
                : 'border-transparent hover:border-slate-200 hover:bg-slate-50'
            }`}
            style={{ marginLeft: `${depth * 20}px` }}
            onClick={() => onSelectNode(makeTypeNodeReference(structurePath, typeId))}
          >
            {isSelected && <span className="absolute inset-y-2 left-1 w-1 rounded-full bg-blue-500" />}
            <div className="flex h-full flex-col items-center justify-start pt-0.5">
              <button
                type="button"
                className={CARET_CLASSES}
                onClick={event => {
                  event.stopPropagation();
                  onToggleExpand(nodeId);
                }}
                aria-label={isExpanded ? '收起试验类型' : '展开试验类型'}
              >
                <i className={`ri-${isExpanded ? 'arrow-down-s-line' : 'arrow-right-s-line'} text-base`} />
              </button>
            </div>
            <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md ${getTypeToneClass(descriptor)}`}>
              <i className={`${descriptor?.icon ?? 'ri-dashboard-line'} text-base`} />
            </div>
            <div className="flex min-w-0 items-start gap-3">
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="truncate font-medium text-gray-900" title={label}>
                    {label}
                  </span>
                </div>
                <span className="text-[11px] text-slate-500">
                  {descriptor?.description ?? '试验类型'}
                </span>
              </div>
              <div className="ml-auto flex-shrink-0">{renderCountBadge(bucket.length, 'accent')}</div>
            </div>
          </div>
          {isExpanded ? bucket.map(project => renderProjectNode(project, depth + 1)) : null}
        </Fragment>
      );
    });
  };

  const renderStructureNode = (node: TestStructureNode, path: string[], depth: number) => {
    const nodeId = `structure:${node.id}`;
    const isExpanded = expandedNodeIds.includes(nodeId);
    const projectsInSubtree = collectProjectsInSubtree(projects, path);
    const hasChildren = Boolean(node.children?.length) || Boolean(projectsInSubtree.length);
    const isSelected = selectedNode?.type === 'structure' && isSamePath(selectedNode.structurePath, path);
    const structureInfo = TEST_STRUCTURE_INDEX.get(node.id);

    return (
      <div key={node.id}>
        <div
          className={`${NODE_CONTAINER_BASE} ${
            isSelected
              ? 'border-blue-200 bg-blue-50/70 shadow-sm'
              : 'border-transparent hover:border-slate-200 hover:bg-slate-50'
          }`}
          style={{ marginLeft: `${depth * 20}px` }}
          onClick={() => onSelectNode(makeStructureNodeReference(path, node.id))}
        >
          {isSelected && <span className="absolute inset-y-2 left-1 w-1 rounded-full bg-blue-500" />}
          <div className="flex h-full flex-col items-center justify-start pt-0.5">
            {hasChildren ? (
              <button
                type="button"
                className={CARET_CLASSES}
                onClick={event => {
                  event.stopPropagation();
                  onToggleExpand(nodeId);
                }}
                aria-label={isExpanded ? '收起结构节点' : '展开结构节点'}
              >
                <i className={`ri-${isExpanded ? 'arrow-down-s-line' : 'arrow-right-s-line'} text-base`} />
              </button>
            ) : (
              renderSpacer()
            )}
          </div>
          <div
            className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md ${
              node.level <= 1 ? 'bg-slate-100 text-slate-600' : 'bg-white text-slate-400'
            }`}
          >
            <i className={`${structureIconByLevel(node.level)} text-base`} />
          </div>
          <div className="flex min-w-0 items-start gap-3">
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex min-w-0 items-center gap-2">
                <span className="truncate font-medium text-gray-900" title={node.name}>
                  {node.name}
                </span>
              </div>
              {structureInfo?.description ? (
                <span className="line-clamp-1 text-[11px] text-slate-500">{structureInfo.description}</span>
              ) : null}
            </div>
            <div className="ml-auto flex-shrink-0">{renderCountBadge(projectsInSubtree.length)}</div>
          </div>
        </div>

        {hasChildren && isExpanded ? (
          <div className="ml-6 border-l border-dashed border-gray-200 pl-4">
            {node.children?.map(child => renderStructureNode(child, [...path, child.id], depth + 1))}
            {renderTypeNodes(path, depth + 1)}
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-200 px-3 py-2">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">试验结构</div>
          <div className="text-sm text-gray-800">产品结构 → 试验类型 → 试验项目</div>
        </div>
      </div>
      <div className="px-2 py-3 space-y-1">
        {structure.map(node => renderStructureNode(node, [node.id], 0))}
      </div>
    </div>
  );
}
