'use client';

import { useRouter } from 'next/navigation';
import type { TbomSelection } from '@/components/tbom/TbomExplorerClient';

type TbomRelationPanelProps = {
  selection: TbomSelection | null;
};

const KIND_TO_LABEL: Record<string, { label: string; icon: string; href: string }> = {
  requirement: { label: '需求', icon: 'ri-list-check-2', href: '/?module=explorer' },
  ebom: { label: '设计/EBOM', icon: 'ri-node-tree', href: '/?module=structure' },
  simulation: { label: '仿真', icon: 'ri-cpu-line', href: '/?module=compare' },
  physical: { label: '实物', icon: 'ri-cube-line', href: '/?module=dashboard' },
};

export default function TbomRelationPanel({ selection }: TbomRelationPanelProps) {
  const router = useRouter();

  const relations = selection?.level === 'project'
    ? selection.project.relations ?? []
    : selection?.level === 'test'
    ? selection.project.relations ?? []
    : selection?.project.relations ?? [];

  const ebomNodeId =
    selection?.level === 'run'
      ? selection.run.ebom_node_id ?? selection.test.ebom_node_id ?? selection.project.relations?.find((rel) => rel.kind === 'ebom')?.ref_id
      : selection?.level === 'test'
      ? selection.test.ebom_node_id ?? selection.project.relations?.find((rel) => rel.kind === 'ebom')?.ref_id
      : selection?.project.relations?.find((rel) => rel.kind === 'ebom')?.ref_id;

  const ebomPath =
    selection?.level === 'run'
      ? selection.test.ebom_path
      : selection?.level === 'test'
      ? selection.test.ebom_path
      : undefined;

  if (!selection) {
    return (
      <div className="p-6 text-sm text-slate-500">
        选择节点后可查看跨域关联与跳转入口。
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 text-sm text-slate-700">
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-900">跨域关联</h3>
        {relations.length === 0 ? (
          <p className="text-xs text-slate-500">当前节点尚未关联其他域，可在后续故事中补充。</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {relations.map((relation, index) => {
              const mapping = KIND_TO_LABEL[relation.kind] ?? {
                label: relation.kind,
                icon: 'ri-link',
                href: '/?module=explorer',
              };
              return (
                <button
                  key={`${relation.kind}-${relation.ref_id}-${index}`}
                  type="button"
                  onClick={() => router.push(mapping.href)}
                  className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-blue-100 hover:text-blue-700 transition"
                >
                  <i className={`${mapping.icon} text-sm`}></i>
                  <span>{mapping.label}</span>
                  <span className="text-slate-400">{relation.ref_id}</span>
                </button>
              );
            })}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-900">产品结构回返</h3>
        {ebomNodeId ? (
          <div className="space-y-2">
            <div className="text-xs text-slate-500">结构节点：{ebomNodeId}</div>
            <div className="text-xs text-slate-500 break-words">
              {ebomPath ?? '未提供路径，可在后续故事补充'}
            </div>
            <button
              type="button"
              onClick={() =>
                router.push(
                  `/?from=tbom&node=${encodeURIComponent(ebomNodeId)}${ebomPath ? `&path=${encodeURIComponent(ebomPath)}` : ''}`,
                )
              }
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700"
            >
              <i className="ri-share-forward-line" /> 返回产品结构 (XBOM)
            </button>
          </div>
        ) : (
          <p className="text-xs text-slate-500">未关联 EBOM 节点，后续可在契约中补充。</p>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-900">后续占位功能</h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          运行趋势、Compare 入口与运行详情将在 Story 1.6 及后续故事中实现。当前页面主要提供导航与聚合视图。
        </p>
      </section>
    </div>
  );
}
