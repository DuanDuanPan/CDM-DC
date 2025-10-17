import { Fragment, useMemo } from 'react';
import type { TestItem, TestProject, TestTypeDescriptor, TestingNodeReference, TestingStats } from './types';
import {
  TEST_STRUCTURE_INDEX,
  collectProjectsByTypeAtStructure,
  collectProjectsInSubtree,
  getTestType
} from './data';

interface TestingContentPanelProps {
  projects: TestProject[];
  stats: TestingStats;
  selectedNode: TestingNodeReference | null;
  selectedProject: TestProject | null;
  selectedItem: TestItem | null;
  onSelectProject: (projectId: string) => void;
  onSelectItem: (projectId: string, itemId: string) => void;
}

const statusLabel: Record<TestProject['status'], string> = {
  planned: '计划',
  'in-progress': '进行中',
  completed: '已完成',
  blocked: '受阻'
};

const statusTone: Record<TestProject['status'], string> = {
  planned: 'bg-slate-100 text-slate-700',
  'in-progress': 'bg-blue-100 text-blue-700',
  completed: 'bg-emerald-100 text-emerald-700',
  blocked: 'bg-amber-100 text-amber-700'
};

const riskTone: Record<TestProject['riskLevel'], string> = {
  low: 'bg-emerald-50 text-emerald-600',
  medium: 'bg-amber-50 text-amber-600',
  high: 'bg-red-50 text-red-600'
};

const buildBreadcrumbs = (structurePath: string[]) => {
  return structurePath
    .map(id => TEST_STRUCTURE_INDEX.get(id))
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
    .map(entry => ({ id: entry.id, name: entry.name }));
};

const renderProgressBar = (value: number, tone: 'blue' | 'emerald' | 'slate') => {
  const base = 'h-2 rounded-full transition-all duration-300';
  const toneClass =
    tone === 'emerald'
      ? 'bg-emerald-500'
      : tone === 'slate'
      ? 'bg-slate-400'
      : 'bg-blue-500';
  return (
    <div className="w-full rounded-full bg-slate-100">
      <div className={`${base} ${toneClass}`} style={{ width: `${Math.min(100, Math.max(0, Math.round(value)))}%` }} />
    </div>
  );
};

const renderMetricTag = (label: string, value: string) => (
  <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm">
    <span className="text-gray-500">{label}</span>
    <span className="font-medium text-gray-900">{value}</span>
  </div>
);

const renderProjectList = (projects: TestProject[], onSelectProject: (projectId: string) => void) => {
  if (!projects.length) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white py-10 text-sm text-gray-500">
        <i className="ri-database-2-line text-3xl text-gray-300" />
        <p className="mt-2">当前结构暂无关联试验项目</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50 text-gray-600">
          <tr>
            <th className="px-4 py-2 text-left font-medium">试验项目</th>
            <th className="px-4 py-2 text-left font-medium">类型</th>
            <th className="px-4 py-2 text-left font-medium">状态</th>
            <th className="px-4 py-2 text-left font-medium">覆盖度</th>
            <th className="px-4 py-2 text-left font-medium">负责人</th>
            <th className="px-4 py-2 text-left font-medium">计划周期</th>
            <th className="px-4 py-2" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {projects.map(project => {
            const type = getTestType(project.typeId);
            return (
              <tr key={project.id}>
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{project.name}</div>
                  <div className="text-xs text-gray-500">{project.code}</div>
                </td>
                <td className="px-4 py-3 text-gray-700">{type?.name ?? '—'}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusTone[project.status]}`}>
                    {statusLabel[project.status]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-24">{renderProgressBar(project.coverage, 'blue')}</div>
                    <span className="text-sm font-medium text-gray-900">{Math.round(project.coverage)}%</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-700">{project.owner}</td>
                <td className="px-4 py-3 text-gray-700">
                  {project.startDate} → {project.endDate}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 rounded-md border border-blue-200 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50"
                    onClick={() => onSelectProject(project.id)}
                  >
                    查看详情
                    <i className="ri-arrow-right-line text-sm" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

const renderAttachments = (items: TestProject['documents']) => {
  if (!items.length) return null;
  return (
    <div className="space-y-2">
      {items.map(doc => (
        <div key={doc.id} className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm">
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-100 text-slate-500">
              <i className="ri-file-list-2-line text-base" />
            </span>
            <div className="min-w-0">
              <div className="truncate font-medium text-gray-900">{doc.name}</div>
              <div className="text-xs text-gray-500">
                {doc.type.toUpperCase()} · {doc.size} · {doc.updatedAt}
              </div>
            </div>
          </div>
          <button type="button" className="text-xs font-medium text-blue-600 hover:text-blue-800">
            预览
          </button>
        </div>
      ))}
    </div>
  );
};

const renderInsights = (items: TestProject['insights']) => {
  if (!items.length) return null;
  return (
    <div className="space-y-2">
      {items.map(insight => (
        <div key={insight.id} className="rounded-lg border border-amber-200 bg-amber-50/60 px-3 py-2 text-sm text-amber-800">
          <div className="flex items-center justify-between">
            <span className="font-medium">{insight.title}</span>
            {insight.dueDate ? <span className="text-xs">截止 {insight.dueDate}</span> : null}
          </div>
          <p className="mt-1 text-xs leading-relaxed text-amber-700">{insight.description}</p>
          <div className="mt-1 text-xs text-amber-700">责任: {insight.owners.join('、')}</div>
        </div>
      ))}
    </div>
  );
};

export function TestingContentPanel({
  projects,
  stats,
  selectedNode,
  selectedProject,
  selectedItem,
  onSelectProject,
  onSelectItem
}: TestingContentPanelProps) {
  const breadcrumbs = useMemo(() => {
    const path = selectedNode?.structurePath ?? [];
    return buildBreadcrumbs(path);
  }, [selectedNode]);

  const viewProjects = useMemo(() => {
    if (!selectedNode) return projects;
    switch (selectedNode.type) {
      case 'structure':
        return collectProjectsInSubtree(projects, selectedNode.structurePath);
      case 'type':
        return collectProjectsByTypeAtStructure(projects, selectedNode.structurePath, selectedNode.typeId ?? '');
      case 'project':
      case 'item':
        return selectedProject ? [selectedProject] : [];
      default:
        return projects;
    }
  }, [projects, selectedNode, selectedProject]);

  const activeType: TestTypeDescriptor | undefined = selectedNode?.type === 'type' || selectedNode?.type === 'project' || selectedNode?.type === 'item'
    ? getTestType(selectedNode.typeId ?? '')
    : undefined;

  const renderBreadcrumb = () =>
    breadcrumbs.length ? (
      <div className="text-xs text-gray-500">
        {breadcrumbs.map((crumb, index) => (
          <Fragment key={crumb.id}>
            {index > 0 ? <span className="mx-1 text-gray-400">/</span> : null}
            {crumb.name}
          </Fragment>
        ))}
      </div>
    ) : null;

  const renderStats = () => (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">项目总量</div>
        <div className="mt-1 text-2xl font-semibold text-gray-900">{stats.totalProjects}</div>
        <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500">
          {Object.entries(stats.statusCounts).map(([key, count]) => (
            <span key={key} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5">
              <i className="ri-checkbox-circle-line text-slate-400" />
              {statusLabel[key as TestProject['status']]} {count}
            </span>
          ))}
        </div>
      </div>
      <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">平均覆盖度</div>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-2xl font-semibold text-blue-600">{stats.averageCoverage}%</span>
          <div className="flex-1">{renderProgressBar(stats.averageCoverage, 'blue')}</div>
        </div>
        <p className="mt-2 text-xs text-gray-500">覆盖度基于试验范围与需求匹配程度统计。</p>
      </div>
      <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">平均就绪度</div>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-2xl font-semibold text-emerald-600">{stats.averageReadiness}%</span>
          <div className="flex-1">{renderProgressBar(stats.averageReadiness, 'emerald')}</div>
        </div>
        <p className="mt-2 text-xs text-gray-500">就绪度结合资源、工装、数据等准备情况。</p>
      </div>
      <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">高风险项目</div>
        <div className="mt-1 text-2xl font-semibold text-amber-600">{stats.highRiskProjects}</div>
        <p className="mt-2 text-xs text-gray-500">包含风险级别为 High 的试验项目数量。</p>
      </div>
    </div>
  );

  const renderStructureOverview = () => (
    <div className="space-y-4">
      <div className="rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3">
        <div className="text-sm font-semibold text-blue-700">结构视角</div>
        <p className="mt-1 text-xs text-blue-700">
          当前结构及下级共 {viewProjects.length} 个试验项目，覆盖 {new Set(viewProjects.map(project => project.typeId)).size} 类试验类型。
        </p>
      </div>
      {renderProjectList(viewProjects, onSelectProject)}
    </div>
  );

  const renderTypeOverview = () => (
    <div className="space-y-4">
      <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
          <i className={`${activeType?.icon ?? 'ri-flask-line'} text-base`} />
          {activeType?.name ?? '试验类型'}
        </div>
        <p className="mt-1 text-xs text-emerald-700">
          默认方法：{activeType?.defaultMethods.join('、') ?? '—'}
        </p>
        <p className="text-xs text-emerald-700">
          关键指标：{activeType?.keyMetrics.join('、') ?? '—'}
        </p>
      </div>
      {renderProjectList(viewProjects, onSelectProject)}
    </div>
  );

  const renderProjectDetail = () => {
    if (!selectedProject) return renderProjectList(viewProjects, onSelectProject);
    return (
      <div className="space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-gray-500">{renderBreadcrumb()}</div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold text-gray-900">{selectedProject.name}</h2>
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${statusTone[selectedProject.status]}`}>
                {statusLabel[selectedProject.status]}
              </span>
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${riskTone[selectedProject.riskLevel]}`}>
                风险 {selectedProject.riskLevel === 'high' ? '高' : selectedProject.riskLevel === 'medium' ? '中' : '低'}
              </span>
            </div>
            <p className="text-sm text-gray-600">{selectedProject.objective}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-500">
            <div>计划周期：{selectedProject.startDate} → {selectedProject.endDate}</div>
            <div className="mt-1 text-gray-500">最后更新：{selectedProject.lastUpdated}</div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-4 lg:col-span-2">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-slate-500">覆盖度</div>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-lg font-semibold text-blue-600">{Math.round(selectedProject.coverage)}%</span>
                  <div className="flex-1">{renderProgressBar(selectedProject.coverage, 'blue')}</div>
                </div>
              </div>
              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-slate-500">就绪度</div>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-lg font-semibold text-emerald-600">{Math.round(selectedProject.readiness)}%</span>
                  <div className="flex-1">{renderProgressBar(selectedProject.readiness, 'emerald')}</div>
                </div>
              </div>
            </div>
            <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
              <div className="font-medium text-slate-700">试验范围</div>
              <p className="mt-1 leading-relaxed">{selectedProject.scope}</p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {renderMetricTag('负责人', selectedProject.owner)}
              {renderMetricTag('试验团队', selectedProject.team)}
            </div>
          </div>
          <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">关键资源</div>
            <ul className="mt-2 space-y-1 text-sm text-gray-700">
              {selectedProject.instrumentation.map(entry => (
                <li key={entry} className="flex items-start gap-2">
                  <i className="ri-corner-right-down-line text-gray-400" />
                  <span className="leading-relaxed">{entry}</span>
                </li>
              ))}
            </ul>
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">依赖条件</div>
            <ul className="mt-2 space-y-1 text-sm text-gray-700">
              {selectedProject.dependencies.map(dep => (
                <li key={dep} className="flex items-start gap-2">
                  <i className="ri-checkbox-line text-emerald-500" />
                  <span className="leading-relaxed">{dep}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-4 lg:col-span-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">试验任务 ({selectedProject.items.length})</h3>
              <button
                type="button"
                className="text-xs text-blue-600 hover:text-blue-800"
                onClick={() => {
                  if (selectedProject.items[0]) {
                    onSelectItem(selectedProject.id, selectedProject.items[0].id);
                  }
                }}
              >
                快速定位第一条
              </button>
            </div>
            <div className="grid gap-3">
              {selectedProject.items.map(task => {
                const isActive = selectedItem?.id === task.id;
                return (
                  <div
                    key={task.id}
                    className={`cursor-pointer rounded-lg border px-4 py-3 transition hover:shadow-sm ${
                      isActive ? 'border-blue-300 bg-blue-50/60' : 'border-gray-200 bg-white'
                    }`}
                    onClick={() => onSelectItem(selectedProject.id, task.id)}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">{task.name}</span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{task.method}</span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{task.environment}</span>
                    </div>
                    <div className="mt-2 grid gap-2 text-xs text-gray-600 md:grid-cols-2">
                      <span>样件：{task.sampleBatch}</span>
                      <span>
                        计划：{task.schedule.plannedStart} → {task.schedule.plannedEnd ?? '—'}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500">
                      {task.metrics.slice(0, 3).map(metric => (
                        <span key={metric.id} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5">
                          <i className="ri-bar-chart-line text-slate-400" />
                          {metric.name} {metric.value}
                        </span>
                      ))}
                    </div>
                    {task.remarks ? <p className="mt-2 text-xs text-amber-600">{task.remarks}</p> : null}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="space-y-4">
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <h3 className="text-sm font-semibold text-gray-900">资料归档</h3>
              <div className="mt-3 space-y-2">{renderAttachments(selectedProject.documents)}</div>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4">
              <h3 className="text-sm font-semibold text-amber-800">风险与动作</h3>
              <div className="mt-3 space-y-2">{renderInsights(selectedProject.insights)}</div>
            </div>
          </div>
        </div>

        {selectedItem ? (
          <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-blue-700">
                <i className="ri-flask-line text-base" />
                {selectedItem.name}
              </div>
              <span className="text-xs text-blue-700">
                状态：{selectedItem.status === 'scheduled' ? '排程' : statusLabel[selectedItem.status as TestProject['status']] ?? selectedItem.status}
              </span>
            </div>
            <div className="mt-2 grid gap-2 text-xs text-blue-900 md:grid-cols-2">
              <span>试验方法：{selectedItem.method}</span>
              <span>夹具：{selectedItem.fixture}</span>
              <span>样件：{selectedItem.sampleBatch}</span>
              <span>环境：{selectedItem.environment}</span>
              <span>判据：{selectedItem.criteria}</span>
              <span>
                时间：{selectedItem.schedule.plannedStart} → {selectedItem.schedule.plannedEnd ?? '—'}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-blue-800">
              {selectedItem.instrumentation.map(inst => (
                <span key={inst} className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-white px-2 py-0.5">
                  <i className="ri-slideshow-2-line" />
                  {inst}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    );
  };

  const renderFallback = () => (
    <div className="flex h-full min-h-[360px] flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white text-sm text-gray-500">
      <i className="ri-test-tube-line text-5xl text-gray-300" />
      <p className="mt-3">选择左侧树中的结构或试验项目以查看详情</p>
    </div>
  );

  let body: JSX.Element = renderFallback();
  if (!selectedNode) {
    body = renderProjectList(projects, onSelectProject);
  } else if (selectedNode.type === 'structure') {
    body = renderStructureOverview();
  } else if (selectedNode.type === 'type') {
    body = renderTypeOverview();
  } else {
    body = renderProjectDetail();
  }

  return (
    <div className="min-h-[520px] rounded-2xl border border-slate-200 bg-white/80 p-6">
      <div className="space-y-6">
        {renderStats()}
        {body}
      </div>
    </div>
  );
}
