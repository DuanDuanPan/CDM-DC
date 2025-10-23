'use client';

import { useMemo } from 'react';
import type { TbomSelection } from '@/components/tbom/TbomExplorerClient';
import TbomRelationChips from '@/components/tbom/relations/TbomRelationChips';
import type { TbomFilterSnapshot } from '@/components/tbom/relations/types';
import { TBOM_DOMAIN_DEFINITIONS, type TbomDomainKey } from '@/components/tbom/relations/constants';

type TbomRelationPanelProps = {
  selection: TbomSelection | null;
  filters?: TbomFilterSnapshot | null;
};

const formatRelationKind = (kind: string): { label: string; icon: string } => {
  const key = kind as TbomDomainKey;
  const definition = TBOM_DOMAIN_DEFINITIONS[key];
  if (definition) {
    return {
      label: definition.label,
      icon: definition.icon,
    };
  }
  return {
    label: kind.toUpperCase(),
    icon: 'ri-link',
  };
};

export default function TbomRelationPanel({ selection, filters = null }: TbomRelationPanelProps) {
  const projectRelations = useMemo(
    () => (selection ? selection.project.relations ?? [] : []),
    [selection],
  );

  const levelLabel = useMemo(() => {
    if (!selection) return '未选择节点';
    if (selection.level === 'project') return `项目 ${selection.project.project_id}`;
    if (selection.level === 'test') return `试验 ${selection.test.test_id}`;
    return `运行 ${selection.run.run_id}`;
  }, [selection]);

  const ebomNodeId = useMemo(() => {
    if (!selection) return null;
    if (selection.level === 'run') {
      return (
        selection.run.ebom_node_id ??
        selection.test.ebom_node_id ??
        selection.project.relations?.find((rel) => rel.kind === 'ebom')?.ref_id ??
        null
      );
    }
    if (selection.level === 'test') {
      return (
        selection.test.ebom_node_id ??
        selection.project.relations?.find((rel) => rel.kind === 'ebom')?.ref_id ??
        null
      );
    }
    return selection.project.relations?.find((rel) => rel.kind === 'ebom')?.ref_id ?? null;
  }, [selection]);

  const ebomPath = useMemo(() => {
    if (!selection) return null;
    if (selection.level === 'run') {
      return selection.test.ebom_path ?? null;
    }
    if (selection.level === 'test') {
      return selection.test.ebom_path ?? null;
    }
    return null;
  }, [selection]);

  const run = selection?.level === 'run' ? selection.run : null;
  const test = selection?.level !== 'project' ? selection?.test ?? null : null;

  if (!selection) {
    return (
      <div className="p-6 text-sm text-slate-500">
        选择 TBOM 项目、试验或运行节点后，可查看跨域关联与导航入口。
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 text-sm text-slate-700">
      <section className="space-y-3">
        <header className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">跨域关联导航</h3>
            <p className="text-xs text-slate-500">
              当前上下文：{levelLabel} — 点击下方 chips 可在保留筛选的情况下跳转至对应域。
            </p>
          </div>
        </header>
        <TbomRelationChips selection={selection} filters={filters} runOverride={run ?? undefined} />
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-900">关联摘要</h3>
        {projectRelations.length === 0 ? (
          <p className="text-xs text-slate-500">
            该项目暂未在契约中声明跨域关联，可于《tbom-contract.md》补充映射后刷新查看。
          </p>
        ) : (
          <ul className="space-y-2 text-xs">
            {projectRelations.map((relation, index) => {
              const meta = formatRelationKind(relation.kind);
              return (
                <li
                  key={`${relation.kind}-${relation.ref_id}-${index}`}
                  className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2"
                >
                  <div className="flex items-center gap-2 text-slate-600">
                    <i className={`${meta.icon} text-base text-slate-500`} aria-hidden />
                    <span className="font-medium text-slate-800">{meta.label}</span>
                  </div>
                  <span className="rounded bg-slate-50 px-2 py-0.5 font-mono text-xs text-slate-500">
                    {relation.ref_id || '未提供'}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-900">挂接结构节点</h3>
        {ebomNodeId ? (
          <div className="space-y-2 rounded-lg border border-blue-100 bg-blue-50/60 p-3 text-xs text-blue-800">
            <div className="flex items-center gap-2 text-blue-900">
              <i className="ri-node-tree" aria-hidden />
              <span className="font-medium">结构节点 ID</span>
            </div>
            <div className="font-mono text-sm">{ebomNodeId}</div>
            <div className="flex items-start gap-2 text-blue-700">
              <i className="ri-route-line mt-0.5 text-base" aria-hidden />
              <span>{ebomPath ?? '未提供完整结构路径，可在试验元数据中补充。'}</span>
            </div>
            <p className="text-[11px] text-blue-600/80">
              使用上方“设计/EBOM” chip 可带着筛选上下文返回产品结构视图。
            </p>
          </div>
        ) : (
          <p className="text-xs text-slate-500">
            当前节点未关联到 EBOM 结构，跳转时将提示完善映射。
          </p>
        )}
      </section>

      {run ? (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-900">运行上下文</h3>
          <div className="grid gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-xs text-slate-600">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">试验件序列号</span>
              <span className="font-medium text-slate-900">{run.test_item_sn ?? '未提供'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">组装件标识</span>
              <span className="font-medium text-slate-900">{run.assembly_bom_id ?? '未提供'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">运行状态</span>
              <span className="font-medium capitalize text-slate-900">{run.status}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-slate-500">关联试验</span>
              <span className="font-medium text-slate-900">{test?.name ?? '—'}</span>
              <span className="text-[11px] text-slate-500">
                执行 chips 前会保存运行上下文，可在 Compare、仿真视图恢复。
              </span>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
