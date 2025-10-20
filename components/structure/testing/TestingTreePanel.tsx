import { Fragment, useMemo } from 'react';
import Tooltip from '@/components/common/Tooltip';
import type {
  TestItem,
  TestProject,
  TestProjectStatus,
  TestStructureNode,
  TestTypeDescriptor,
  TestingNodeReference
} from './types';
import { TEST_STRUCTURE_INDEX, collectProjectsInSubtree, projectMatchesExactStructure, getTestType } from './data';

interface TestingTreePanelProps {
  structure: TestStructureNode[];
  projects: TestProject[];
  selectedNode: TestingNodeReference | null;
  expandedNodeIds: string[];
  onSelectNode: (node: TestingNodeReference) => void;
  onToggleExpand: (nodeId: string) => void;
  testTypes: TestTypeDescriptor[];
  density?: TreeDensity;
}

const structureIconByLevel = (level: number): string => {
  if (level <= 0) return 'ri-mind-map';
  if (level === 1) return 'ri-stack-line';
  if (level === 2) return 'ri-node-tree';
  if (level === 3) return 'ri-ancient-gate-line';
  return 'ri-checkbox-blank-circle-line';
};

export type TreeDensity = 'comfortable' | 'compact';

const DENSITY_CONFIG: Record<
  TreeDensity,
  {
    indent: number;
    nodePadding: string;
    nodeGap: string;
    itemPadding: string;
    itemGap: string;
    metaGap: string;
    stackSpacing: string;
    itemStackGap: string;
    caretSize: string;
    spacerSize: string;
    projectIconContainer: string;
    projectIconText: string;
    typeIconContainer: string;
    typeIconText: string;
    itemIconContainer: string;
    itemIconText: string;
    badgeSize: string;
    secondaryText: string;
    branchMargin: string;
    branchPadding: string;
  }
> = {
  comfortable: {
    indent: 12,
    nodePadding: 'px-3 py-2',
    nodeGap: 'gap-3',
    itemPadding: 'px-3 py-2',
    itemGap: 'gap-3',
    metaGap: 'gap-2',
    stackSpacing: 'space-y-1',
    itemStackGap: 'gap-1',
    caretSize: 'h-7 w-7',
    spacerSize: 'h-6 w-6',
    projectIconContainer: 'h-7 w-7',
    projectIconText: 'text-sm',
    typeIconContainer: 'h-7 w-7',
    typeIconText: 'text-sm',
    itemIconContainer: 'h-7 w-7',
    itemIconText: 'text-[9px]',
    badgeSize: 'px-2 py-0.5 text-[11px]',
    secondaryText: 'text-[11px]',
    branchMargin: 'ml-6',
    branchPadding: 'pl-4'
  },
  compact: {
    indent: 10,
    nodePadding: 'px-2.5 py-1.5',
    nodeGap: 'gap-2',
    itemPadding: 'px-2 py-1.5',
    itemGap: 'gap-1.5',
    metaGap: 'gap-1.5',
    stackSpacing: 'space-y-0.5',
    itemStackGap: 'gap-0.5',
    caretSize: 'h-6 w-6',
    spacerSize: 'h-5 w-5',
    projectIconContainer: 'h-6 w-6',
    projectIconText: 'text-xs',
    typeIconContainer: 'h-6 w-6',
    typeIconText: 'text-xs',
    itemIconContainer: 'h-5 w-5',
    itemIconText: 'text-[8px]',
    badgeSize: 'px-1.5 py-0.5 text-[10px]',
    secondaryText: 'text-[10px]',
    branchMargin: 'ml-5',
    branchPadding: 'pl-3.5'
  }
};

const STATUS_LABELS: Record<TestProjectStatus, string> = {
  planned: '计划中',
  'in-progress': '进行中',
  completed: '已完成',
  blocked: '受阻'
};

const ITEM_STATUS_LABELS: Record<TestProjectStatus | 'scheduled', string> = {
  planned: '计划中',
  'in-progress': '进行中',
  completed: '已完成',
  blocked: '受阻',
  scheduled: '排程'
};

const CARET_BASE =
  'flex items-center justify-center rounded-md text-gray-400 transition hover:text-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500';
const NODE_CONTAINER_BASE =
  'group relative flex items-start rounded-xl border text-xs leading-5 transition-colors duration-150 w-full';
const ITEM_CONTAINER_BASE =
  'group relative flex items-start rounded-xl border text-[11px] leading-4 transition-colors duration-150 w-full';
const BADGE_BASE =
  'inline-flex items-center justify-center rounded-full border font-medium whitespace-nowrap';
const ICON_CONTAINER_BASE = 'flex items-center justify-center rounded-md';

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

export function TestingTreePanel({
  structure,
  projects,
  selectedNode,
  expandedNodeIds,
  onSelectNode,
  onToggleExpand,
  testTypes,
  density = 'compact'
}: TestingTreePanelProps) {
  const densityConfig = DENSITY_CONFIG[density];
  const caretClass = `${CARET_BASE} ${densityConfig.caretSize}`;
  const spacerClass = densityConfig.spacerSize;
  const projectIconClass = `${ICON_CONTAINER_BASE} ${densityConfig.projectIconContainer}`;
  const typeIconClass = `${ICON_CONTAINER_BASE} ${densityConfig.typeIconContainer}`;
  const itemIconClass = `${ICON_CONTAINER_BASE} ${densityConfig.itemIconContainer}`;
  const badgeSizeClass = densityConfig.badgeSize;
  const countSuffixClass = density === 'compact' ? 'text-[9px]' : 'text-[10px]';
  const typeMap = useMemo(() => new Map(testTypes.map(type => [type.id, type])), [testTypes]);

  const renderSpacer = () => <span className={spacerClass} aria-hidden="true" />;

  const renderCountBadge = (count: number, tone: 'neutral' | 'accent' = 'neutral') => {
    const toneClass =
      tone === 'accent'
        ? 'border-emerald-200 bg-emerald-50 text-emerald-600'
        : 'border-slate-200 bg-white text-slate-600';
    return (
      <span className={`${BADGE_BASE} ${badgeSizeClass} ${toneClass}`}>
        {count}
        <span className={`ml-1 ${countSuffixClass}`}>项</span>
      </span>
    );
  };

  const formatPercent = (value?: number) => (typeof value === 'number' ? `${Math.round(value)}%` : '—');

  const formatRange = (start?: string, end?: string) => {
    if (start && end) return `${start} → ${end}`;
    return start ?? end ?? '—';
  };

  const buildStructureTooltip = (description?: string, projectCount = 0) => (
    <div className="max-w-[220px] space-y-1 text-[11px] leading-relaxed text-slate-100">
      <p className="text-slate-200">{description ?? '暂无节点说明。'}</p>
      <div className="flex items-center justify-between">
        <span className="text-slate-300">相关项目</span>
        <span>{projectCount}</span>
      </div>
    </div>
  );

  const buildTypeTooltip = (descriptor?: TestTypeDescriptor, projectCount?: number) => {
    if (!descriptor) {
      return <div className="text-[11px] leading-relaxed text-slate-200">暂无类型说明。</div>;
    }

    return (
      <div className="max-w-[240px] space-y-1.5 text-[11px] leading-relaxed text-slate-100">
        <div className="flex items-center justify-between">
          <span className="text-slate-300">类型代码</span>
          <span className="font-mono">{descriptor.code}</span>
        </div>
        {descriptor.description ? <p className="text-slate-200">{descriptor.description}</p> : null}
        {projectCount !== undefined ? (
          <div className="flex items-center justify-between">
            <span className="text-slate-300">关联项目</span>
            <span>{projectCount}</span>
          </div>
        ) : null}
        {descriptor.defaultMethods?.length ? (
          <div>
            <div className="text-slate-300">常用方法</div>
            <ul className="mt-1 space-y-0.5 text-slate-100">
              {descriptor.defaultMethods.slice(0, 3).map(method => (
                <li key={method}>{method}</li>
              ))}
              {descriptor.defaultMethods.length > 3 && (
                <li className="text-slate-400">+{descriptor.defaultMethods.length - 3} 项</li>
              )}
            </ul>
          </div>
        ) : null}
        {descriptor.keyMetrics?.length ? (
          <div>
            <div className="text-slate-300">关键指标</div>
            <ul className="mt-1 space-y-0.5 text-slate-100">
              {descriptor.keyMetrics.slice(0, 3).map(metric => (
                <li key={metric}>{metric}</li>
              ))}
              {descriptor.keyMetrics.length > 3 && (
                <li className="text-slate-400">+{descriptor.keyMetrics.length - 3} 项</li>
              )}
            </ul>
          </div>
        ) : null}
      </div>
    );
  };

  const buildProjectTooltip = (project: TestProject) => (
    <div className="max-w-[240px] space-y-1.5 text-[11px] leading-relaxed text-slate-100">
      <div className="flex items-center justify-between">
        <span className="text-slate-300">项目编号</span>
        <span className="font-mono">{project.code}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-slate-300">状态</span>
        <span>{STATUS_LABELS[project.status]}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-slate-300">覆盖 / 就绪</span>
        <span>
          {formatPercent(project.coverage)} · {formatPercent(project.readiness)}
        </span>
      </div>
      {project.owner ? (
        <div className="flex items-center justify-between">
          <span className="text-slate-300">负责人</span>
          <span>{project.owner}</span>
        </div>
      ) : null}
      {project.team ? (
        <div className="flex items-center justify-between">
          <span className="text-slate-300">团队</span>
          <span>{project.team}</span>
        </div>
      ) : null}
      {project.lastUpdated ? (
        <div className="flex items-center justify-between">
          <span className="text-slate-300">更新时间</span>
          <span>{project.lastUpdated}</span>
        </div>
      ) : null}
      {project.summary ? <p className="text-slate-200">{project.summary}</p> : null}
    </div>
  );

  const buildItemTooltip = (item: TestItem) => (
    <div className="max-w-[220px] space-y-1 text-[11px] leading-relaxed text-slate-100">
      <div className="flex items-center justify-between">
        <span className="text-slate-300">状态</span>
        <span>{ITEM_STATUS_LABELS[item.status]}</span>
      </div>
      {item.method ? (
        <div>
          <div className="text-slate-300">方法</div>
          <p className="text-slate-100">{item.method}</p>
        </div>
      ) : null}
      {item.environment ? (
        <div>
          <div className="text-slate-300">环境</div>
          <p className="text-slate-100">{item.environment}</p>
        </div>
      ) : null}
      {item.fixture ? (
        <div>
          <div className="text-slate-300">工装</div>
          <p className="text-slate-100">{item.fixture}</p>
        </div>
      ) : null}
      {item.schedule?.plannedStart || item.schedule?.plannedEnd ? (
        <div className="flex items-center justify-between">
          <span className="text-slate-300">计划</span>
          <span>{formatRange(item.schedule?.plannedStart, item.schedule?.plannedEnd)}</span>
        </div>
      ) : null}
      {item.schedule?.actualStart || item.schedule?.actualEnd ? (
        <div className="flex items-center justify-between">
          <span className="text-slate-300">实际</span>
          <span>{formatRange(item.schedule?.actualStart, item.schedule?.actualEnd)}</span>
        </div>
      ) : null}
      {item.schedule?.chamber ? (
        <div className="flex items-center justify-between">
          <span className="text-slate-300">试验场所</span>
          <span>{item.schedule.chamber}</span>
        </div>
      ) : null}
      {item.instrumentation?.length ? (
        <div>
          <div className="text-slate-300">仪器</div>
          <ul className="mt-1 space-y-0.5 text-slate-100">
            {item.instrumentation.slice(0, 3).map(record => (
              <li key={record}>{record}</li>
            ))}
            {item.instrumentation.length > 3 && (
              <li className="text-slate-400">+{item.instrumentation.length - 3} 项</li>
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );

  const renderProjectNode = (project: TestProject, depth: number) => {
    const nodeId = `project:${project.id}`;
    const isSelected =
      (selectedNode?.type === 'project' && selectedNode.projectId === project.id) ||
      (selectedNode?.type === 'item' && selectedNode.projectId === project.id);
    const hasItems = project.items.length > 0;
    const isExpanded = expandedNodeIds.includes(nodeId);
    const indentPx = `${Math.min(depth, 6) * densityConfig.indent}px`;
    const projectTooltip = buildProjectTooltip(project);

    return (
      <div key={project.id}>
        <div
          className={`${NODE_CONTAINER_BASE} ${densityConfig.nodeGap} ${densityConfig.nodePadding} ${
            isSelected
              ? 'border-blue-200 bg-blue-50/80 shadow-sm'
              : 'border-transparent hover:border-slate-200 hover:bg-slate-50'
          }`}
          style={{ marginLeft: indentPx }}
          onClick={() => onSelectNode(makeProjectNodeReference(project))}
        >
          {isSelected && <span className="absolute inset-y-2 left-1 w-1 rounded-full bg-blue-500" />}
          <div className="flex h-full flex-col items-center justify-start pt-0.5">
            {hasItems ? (
              <button
                type="button"
                className={caretClass}
                onClick={(event) => {
                  event.stopPropagation();
                  onToggleExpand(nodeId);
                }}
                aria-label={isExpanded ? '收起试验项目' : '展开试验项目'}
              >
                <i className={`ri-${isExpanded ? 'arrow-down-s-line' : 'arrow-right-s-line'} ${densityConfig.typeIconText}`} />
              </button>
            ) : (
              renderSpacer()
            )}
          </div>
          <div className={`${projectIconClass} bg-orange-50 text-orange-500`}>
            <i className={`ri-test-tube-line ${densityConfig.projectIconText}`} />
          </div>
          <div className={`flex min-w-0 items-start ${densityConfig.nodeGap}`}>
            <div className={`min-w-0 flex-1 ${densityConfig.stackSpacing}`}>
              <div className={`flex min-w-0 items-center ${densityConfig.metaGap}`}>
                <span className="font-medium text-gray-900 whitespace-normal break-words" title={project.name}>
                  {project.name}
                </span>
                <Tooltip content={projectTooltip}>
                  <button
                    type="button"
                    onClick={(event) => event.stopPropagation()}
                    className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full text-slate-400 transition hover:text-blue-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-1"
                    aria-label={`查看${project.name}详情`}
                  >
                    <i className="ri-information-line text-xs" />
                    <span className="sr-only">查看{project.name}详情</span>
                  </button>
                </Tooltip>
              </div>
              {/* 编号已迁移到 Tooltip 中，避免占用主层级空间 */}
            </div>
            <div className="ml-auto flex-shrink-0">
              {renderCountBadge(project.items.length, project.riskLevel === 'high' ? 'accent' : 'neutral')}
            </div>
          </div>
        </div>
        {hasItems && isExpanded ? (
          <div className={`${densityConfig.branchMargin} border-l border-dashed border-gray-200 ${densityConfig.branchPadding}`}>
            {project.items.map((itemEntry) => {
              const isItemSelected = selectedNode?.type === 'item' && selectedNode.itemId === itemEntry.id;
              const itemTooltip = buildItemTooltip(itemEntry);
              return (
                <div key={itemEntry.id} className="mt-2">
                  <div
                    className={`${ITEM_CONTAINER_BASE} ${densityConfig.itemGap} ${densityConfig.itemPadding} cursor-pointer ${
                      isItemSelected
                        ? 'border-blue-200 bg-blue-50/70 shadow-sm'
                        : 'border-transparent hover:border-slate-200 hover:bg-slate-50'
                    }`}
                    onClick={() => onSelectNode(makeItemReference(project, itemEntry.id))}
                  >
                    {isItemSelected && <span className="absolute inset-y-2 left-1 w-1 rounded-full bg-blue-500" />}
                    <div className={`${itemIconClass} bg-white text-slate-400`}>
                      <i className={`ri-checkbox-blank-circle-fill ${densityConfig.itemIconText}`} />
                    </div>
                    <div className={`flex min-w-0 flex-1 flex-col ${densityConfig.itemStackGap}`}>
                      <div className={`flex min-w-0 items-center ${densityConfig.metaGap}`}>
                        <span className="text-gray-900 whitespace-normal break-words" title={itemEntry.name}>
                          {itemEntry.name}
                        </span>
                        <Tooltip content={itemTooltip}>
                          <button
                            type="button"
                            onClick={(event) => event.stopPropagation()}
                            className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full text-slate-400 transition hover:text-blue-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-1"
                            aria-label={`查看${itemEntry.name}详情`}
                          >
                            <i className="ri-information-line text-xs" />
                            <span className="sr-only">查看{itemEntry.name}详情</span>
                          </button>
                        </Tooltip>
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
      const indentPx = `${Math.min(depth, 6) * densityConfig.indent}px`;
      const typeTooltip = buildTypeTooltip(descriptor, bucket.length);
      return (
        <Fragment key={nodeId}>
          <div
            className={`${NODE_CONTAINER_BASE} ${densityConfig.nodeGap} ${densityConfig.nodePadding} ${
              isSelected
                ? 'border-blue-200 bg-blue-50/70 shadow-sm'
                : 'border-transparent hover:border-slate-200 hover:bg-slate-50'
            }`}
            style={{ marginLeft: indentPx }}
            onClick={() => onSelectNode(makeTypeNodeReference(structurePath, typeId))}
          >
            {isSelected && <span className="absolute inset-y-2 left-1 w-1 rounded-full bg-blue-500" />}
            <div className="flex h-full flex-col items-center justify-start pt-0.5">
              <button
                type="button"
                className={caretClass}
                onClick={event => {
                  event.stopPropagation();
                  onToggleExpand(nodeId);
                }}
                aria-label={isExpanded ? '收起试验类型' : '展开试验类型'}
              >
                <i className={`ri-${isExpanded ? 'arrow-down-s-line' : 'arrow-right-s-line'} ${densityConfig.typeIconText}`} />
              </button>
            </div>
            <div className={`${typeIconClass} ${getTypeToneClass(descriptor)}`}>
              <i className={`${descriptor?.icon ?? 'ri-dashboard-line'} ${densityConfig.typeIconText}`} />
            </div>
            <div className={`flex min-w-0 items-start ${densityConfig.nodeGap}`}>
              <div className={`min-w-0 flex-1 ${densityConfig.stackSpacing}`}>
                <div className={`flex min-w-0 items-center ${densityConfig.metaGap}`}>
                  <span className="font-medium text-gray-900 whitespace-normal break-words" title={label}>
                    {label}
                  </span>
                  <Tooltip content={typeTooltip}>
                    <button
                      type="button"
                      onClick={(event) => event.stopPropagation()}
                      className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full text-slate-400 transition hover:text-blue-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-1"
                      aria-label={`查看${label}详情`}
                    >
                      <i className="ri-information-line text-xs" />
                      <span className="sr-only">查看{label}详情</span>
                    </button>
                  </Tooltip>
                </div>
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
    const indentPx = `${Math.min(depth, 6) * densityConfig.indent}px`;
    const structureTooltip = buildStructureTooltip(structureInfo?.description, projectsInSubtree.length);

    return (
      <div key={node.id}>
        <div
          className={`${NODE_CONTAINER_BASE} ${densityConfig.nodeGap} ${densityConfig.nodePadding} ${
            isSelected
              ? 'border-blue-200 bg-blue-50/70 shadow-sm'
              : 'border-transparent hover:border-slate-200 hover:bg-slate-50'
          }`}
          style={{ marginLeft: indentPx }}
          onClick={() => onSelectNode(makeStructureNodeReference(path, node.id))}
        >
          {isSelected && <span className="absolute inset-y-2 left-1 w-1 rounded-full bg-blue-500" />}
          <div className="flex h-full flex-col items-center justify-start pt-0.5">
            {hasChildren ? (
              <button
                type="button"
                className={caretClass}
                onClick={event => {
                  event.stopPropagation();
                  onToggleExpand(nodeId);
                }}
                aria-label={isExpanded ? '收起结构节点' : '展开结构节点'}
              >
                <i className={`ri-${isExpanded ? 'arrow-down-s-line' : 'arrow-right-s-line'} ${densityConfig.typeIconText}`} />
              </button>
            ) : (
              renderSpacer()
            )}
          </div>
          <div
            className={`${typeIconClass} ${
              node.level <= 1 ? 'bg-slate-100 text-slate-600' : 'bg-white text-slate-400'
            }`}
          >
            <i className={`${structureIconByLevel(node.level)} ${densityConfig.typeIconText}`} />
          </div>
            <div className={`flex min-w-0 items-start ${densityConfig.nodeGap}`}>
              <div className={`min-w-0 flex-1 ${densityConfig.stackSpacing}`}>
                <div className={`flex min-w-0 items-center ${densityConfig.metaGap}`}>
                  <span className="font-medium text-gray-900 whitespace-normal break-words" title={node.name}>
                    {node.name}
                  </span>
                  <Tooltip content={structureTooltip}>
                    <button
                      type="button"
                      onClick={(event) => event.stopPropagation()}
                      className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full text-slate-400 transition hover:text-blue-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-1"
                      aria-label={`查看${node.name}说明`}
                    >
                      <i className="ri-information-line text-xs" />
                      <span className="sr-only">查看{node.name}说明</span>
                    </button>
                  </Tooltip>
                </div>
              </div>
            <div className="ml-auto flex-shrink-0">{renderCountBadge(projectsInSubtree.length)}</div>
          </div>
        </div>

        {hasChildren && isExpanded ? (
          <div className={`${densityConfig.branchMargin} border-l border-dashed border-gray-200 ${densityConfig.branchPadding}`}>
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
