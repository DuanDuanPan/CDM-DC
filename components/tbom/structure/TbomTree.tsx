'use client';

import { Fragment } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import Tooltip from '@/components/common/Tooltip';
import type { TbomProject, TbomRun, TbomTest, TbomRunStatus } from '@/components/tbom/types';
import type { TbomSelection } from '@/components/tbom/TbomExplorerClient';

type TreeRun = TbomRun;

type TreeTest = {
  test: TbomTest;
  runs: TreeRun[];
  allRunsCount: number;
};

type TreeProject = {
  project: TbomProject;
  tests: TreeTest[];
  allRunsCount: number;
};

type TreeGroup = {
  type: string;
  projects: TreeProject[];
};

type TbomTreeProps = {
  data: TreeGroup[];
  expanded: Set<string>;
  selection: TbomSelection | null;
  onSelect: (selection: TbomSelection) => void;
  onToggle: (id: string) => void;
};

const STATUS_COLORS: Record<TbomRunStatus, string> = {
  planned: 'bg-slate-200 text-slate-600',
  executing: 'bg-blue-200 text-blue-700',
  completed: 'bg-emerald-200 text-emerald-700',
  aborted: 'bg-rose-200 text-rose-700',
};

const STATUS_LABELS: Record<TbomRunStatus, string> = {
  planned: '计划中',
  executing: '执行中',
  completed: '已完成',
  aborted: '已中止',
};

const renderNodeIcon = (iconClass: string, colorClass: string) => (
  <span
    className={`flex h-5 w-5 items-center justify-center rounded-md ${colorClass}`}
    aria-hidden="true"
  >
    <i className={`${iconClass} text-[12px]`} />
  </span>
);

const buildCountBadge = (value: number, label: string, tone: 'neutral' | 'accent' = 'neutral') => {
  const toneClass =
    tone === 'accent'
      ? 'bg-blue-50 text-blue-600'
      : 'bg-slate-100 text-slate-600';
  const labelClass = tone === 'accent' ? 'text-blue-400' : 'text-slate-400';

  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${toneClass}`}>
      <span>{value}</span>
      <span className={`ml-0.5 text-[10px] ${labelClass}`}>{label}</span>
    </span>
  );
};

function NodeButton({
  active,
  indent,
  label,
  badge,
  onClick,
  expandable,
  expanded,
  onToggle,
  role = 'treeitem',
  appearance = 'default',
  tooltip,
  icon,
}: {
  active: boolean;
  indent: number;
  label: string;
  badge?: ReactNode;
  onClick: () => void;
  expandable?: boolean;
  expanded?: boolean;
  onToggle?: () => void;
  role?: 'treeitem';
  appearance?: 'default' | 'run';
  tooltip?: ReactNode;
  icon?: ReactNode;
}) {
  const baseStyle =
    appearance === 'run'
      ? 'border border-transparent bg-white text-slate-600 hover:border-blue-100 hover:bg-blue-50'
      : 'border border-transparent bg-white text-slate-700 hover:border-slate-200 hover:bg-slate-50';
  const activeStyle = 'border border-blue-200 bg-blue-50 text-blue-700 shadow-sm';
  const indentPadding = Math.min(indent, 6) * 12;

  const containerStyle: CSSProperties = {
    paddingLeft: `${indentPadding}px`,
  };

  if (indent > 0) {
    const connectorOffset = Math.max(indentPadding - 10, 6);
    containerStyle.backgroundImage =
      'linear-gradient(to bottom, rgba(148, 163, 184, 0.28), rgba(148, 163, 184, 0.28))';
    containerStyle.backgroundRepeat = 'no-repeat';
    containerStyle.backgroundSize = '1px calc(100% - 8px)';
    containerStyle.backgroundPosition = `${connectorOffset}px 4px`;
    containerStyle.backgroundOrigin = 'padding-box';
  }

  const button = (
    <button
      type="button"
      onClick={onClick}
      className={`group flex w-full min-w-0 items-center justify-between gap-2 rounded-md px-2 py-1 text-left text-[13px] leading-tight transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-200 focus-visible:ring-offset-1 ${
        active ? activeStyle : baseStyle
      }`}
    >
      <span className="min-w-0 truncate font-medium">{label}</span>
      {badge ? <span className="ml-2 flex flex-shrink-0 items-center gap-1 text-[11px] text-slate-500">{badge}</span> : null}
    </button>
  );

  const buttonWithTooltip = tooltip ? (
    <Tooltip content={tooltip} align="left" className="flex-1 w-full">
      {button}
    </Tooltip>
  ) : (
    button
  );

  return (
    <div
      className="relative"
      role={role}
      aria-selected={active}
      aria-expanded={expandable ? expanded : undefined}
    >
      <div className="flex items-center gap-1" style={containerStyle}>
        {expandable ? (
          <button
            type="button"
            onClick={onToggle}
            className="flex h-5 w-5 flex-shrink-0 items-center justify-center text-slate-400 transition hover:text-slate-600"
            aria-label={expanded ? '折叠' : '展开'}
          >
            <i className={`ri-arrow-right-s-line text-xs transition-transform ${expanded ? 'rotate-90' : ''}`}></i>
          </button>
        ) : (
          <span className="h-5 w-5 flex-shrink-0" aria-hidden />
        )}
        {icon ? <span className="flex-shrink-0">{icon}</span> : null}
        <div className="flex min-w-0 flex-1">{buttonWithTooltip}</div>
      </div>
    </div>
  );
}

export default function TbomTree({
  data,
  expanded,
  selection,
  onSelect,
  onToggle,
}: TbomTreeProps) {
  if (data.length === 0) {
    return null;
  }

  return (
    <div role="tree" className="space-y-1.5">
      {data.map((group) => {
        const typeKey = `type:${group.type}`;
        const typeExpanded = expanded.has(typeKey);
        const typeProjectsCount = group.projects.length;
        const typeTestsCount = group.projects.reduce((sum, project) => sum + project.tests.length, 0);
        const typeRunsCount = group.projects.reduce((sum, project) => sum + project.allRunsCount, 0);
        const typeTooltip = (
          <div>
            <p className="font-semibold text-slate-100">{group.type}</p>
            <p className="mt-1 text-[11px] text-slate-300">
              项目 {typeProjectsCount} · 试验 {typeTestsCount} · 运行 {typeRunsCount}
            </p>
          </div>
        );
        return (
          <Fragment key={typeKey}>
            <NodeButton
              active={selection?.level === 'project' && selection.project.type === group.type}
              indent={0}
              label={group.type}
              badge={buildCountBadge(typeRunsCount, '运行', typeRunsCount > 0 ? 'accent' : 'neutral')}
              tooltip={typeTooltip}
              icon={renderNodeIcon('ri-node-tree', 'bg-slate-100 text-slate-500')}
              onClick={() => onToggle(typeKey)}
              expandable
              expanded={typeExpanded}
            />
            {typeExpanded &&
              group.projects.map((project) => {
                const projectKey = `project:${project.project.project_id}`;
                const projectExpanded = expanded.has(projectKey);
                const projectSelected =
                  selection?.level === 'project' && selection.project.project_id === project.project.project_id;
                const runsCount = project.tests.reduce((sum, item) => sum + item.allRunsCount, 0);
                const projectTooltip = project.project.objectives ? (
                  <div>
                    <p className="font-semibold text-slate-100">{project.project.title}</p>
                    <p className="mt-1 text-[11px] text-slate-300">{project.project.objectives}</p>
                  </div>
                ) : null;

                return (
                  <Fragment key={projectKey}>
                    <NodeButton
                      active={projectSelected}
                      indent={1}
                      label={project.project.title}
                      badge={buildCountBadge(runsCount, '运行', runsCount > 0 ? 'accent' : 'neutral')}
                      tooltip={projectTooltip ?? undefined}
                      icon={renderNodeIcon('ri-folder-open-line', 'bg-blue-50 text-blue-500')}
                      onClick={() =>
                        onSelect({
                          level: 'project',
                          project: project.project,
                        })
                      }
                      expandable
                      expanded={projectExpanded}
                      onToggle={() => onToggle(projectKey)}
                    />
                    {projectExpanded &&
                      project.tests.map((test) => {
                        const testKey = `test:${test.test.test_id}`;
                        const testExpanded = expanded.has(testKey);
                        const testSelected =
                          (selection?.level === 'test' || selection?.level === 'run') &&
                          selection.test?.test_id === test.test.test_id;
                        const testTooltip = test.test.purpose ? (
                          <div>
                            <p className="font-semibold text-slate-100">{test.test.name}</p>
                            <p className="mt-1 text-[11px] text-slate-300">{test.test.purpose}</p>
                          </div>
                        ) : null;

                        return (
                          <Fragment key={testKey}>
                            <NodeButton
                              active={testSelected && selection?.level !== 'run'}
                              indent={2}
                              label={test.test.name}
                              badge={buildCountBadge(test.runs.length, '运行', test.runs.length > 0 ? 'accent' : 'neutral')}
                              tooltip={testTooltip ?? undefined}
                              onClick={() =>
                                onSelect({
                                  level: 'test',
                                  project: project.project,
                                  test: test.test,
                                })
                              }
                              expandable
                              expanded={testExpanded}
                              onToggle={() => onToggle(testKey)}
                            />
                            {testExpanded &&
                              test.runs.map((run) => {
                                const runKey = `run:${run.run_id}`;
                                const runSelected =
                                  selection?.level === 'run' && selection.run?.run_id === run.run_id;
                                const runTooltip = (
                                  <div>
                                    <p className="font-semibold text-slate-100">{run.run_id}</p>
                                    <p className="mt-1 text-[11px] text-slate-300">
                                      状态：{STATUS_LABELS[run.status]}
                                    </p>
                                    {run.operator ? (
                                      <p className="text-[11px] text-slate-400">执行人：{run.operator}</p>
                                    ) : null}
                                  </div>
                                );
                                return (
                                  <NodeButton
                                    key={runKey}
                                    active={runSelected}
                                    indent={3}
                                    label={run.run_id}
                                    appearance="run"
                                    tooltip={runTooltip}
                                    badge={
                                      <span
                                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_COLORS[run.status]}`}
                                      >
                                        {STATUS_LABELS[run.status]}
                                      </span>
                                    }
                                    onClick={() =>
                                      onSelect({
                                        level: 'run',
                                        project: project.project,
                                        test: test.test,
                                        run,
                                      })
                                    }
                                  />
                                );
                              })}
                          </Fragment>
                        );
                      })}
                  </Fragment>
                );
              })}
          </Fragment>
        );
      })}
    </div>
  );
}
