"use client";

import { useMemo, useState } from "react";
import type { KnowledgeCatalogData, KnowledgeCatalogNode, KnowledgeCollection } from "./cockpitTypes";

interface Props {
  data: KnowledgeCatalogData | null;
  activeTag: string | null;
  onSelectTag: (tag: string | null) => void;
  activeCollection: string | null;
  onSelectCollection: (id: string | null) => void;
}

function TreeNode({
  node,
  expanded,
  toggle,
  select,
  activeTag,
}: {
  node: KnowledgeCatalogNode;
  expanded: Record<string, boolean>;
  toggle: (id: string) => void;
  select: (id: string | null) => void;
  activeTag: string | null;
}) {
  const isLeaf = !node.children?.length;
  const isExpanded = expanded[node.id] ?? true;

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 text-sm text-gray-700">
        {!isLeaf && (
          <button
            type="button"
            onClick={() => toggle(node.id)}
            className="rounded border border-gray-200 bg-white px-1 text-xs text-gray-500"
            aria-label="展开/折叠"
          >
            <i className={`ri-arrow-${isExpanded ? "down" : "right"}-s-line`}></i>
          </button>
        )}
        <span className="font-medium text-gray-800">{node.label}</span>
      </div>
      {isExpanded && (
        <div className="pl-4">
          {node.items?.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => select(item === activeTag ? null : item)}
              className={`mb-1 w-full rounded-lg border px-2 py-1 text-left text-xs ${
                activeTag === item
                  ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                  : "border-gray-200 bg-white text-gray-600"
              }`}
            >
              <i className="ri-bookmark-line mr-1" /> {item}
            </button>
          ))}
          {node.children?.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              expanded={expanded}
              toggle={toggle}
              select={select}
              activeTag={activeTag}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function KnowledgeCatalogPanel({ data, activeTag, onSelectTag, activeCollection, onSelectCollection }: Props) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggle = (id: string) => setExpanded((prev) => ({ ...prev, [id]: !(prev[id] ?? true) }));

  const tree = data?.tree ?? [];
  const collections = useMemo<KnowledgeCollection[]>(() => data?.collections ?? [], [data]);

  if (!data) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between text-sm font-medium text-gray-800">
        <div className="flex items-center gap-2">
          <i className="ri-archive-drawer-line text-purple-500" /> 知识目录
        </div>
        <span className="text-xs text-gray-500">更新于 {new Date(data.updatedAt).toLocaleDateString()}</span>
      </div>

      <div className="mt-3 grid gap-4 md:grid-cols-2">
        <div className="space-y-2 text-xs text-gray-600">
          {tree.map((node) => (
            <TreeNode
              key={node.id}
              node={node}
              expanded={expanded}
              toggle={toggle}
              select={onSelectTag}
              activeTag={activeTag}
            />
          ))}
        </div>
        <div className="space-y-2">
          <div className="text-xs font-medium text-gray-500">
            收藏集
          </div>
          {collections.length === 0 && (
            <div className="rounded-lg border border-dashed border-gray-300 bg-slate-50/60 px-3 py-4 text-center text-xs text-gray-500">
              暂无收藏集
            </div>
          )}
          {collections.map((collection) => (
            <button
              key={collection.id}
              type="button"
              onClick={() => onSelectCollection(activeCollection === collection.id ? null : collection.id)}
              className={`w-full rounded-xl border px-3 py-2 text-left text-xs ${
                activeCollection === collection.id
                  ? "border-purple-500 bg-purple-50 text-purple-700"
                  : "border-gray-200 bg-white text-gray-600"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm text-gray-900">{collection.label}</span>
                <span className="text-[11px] text-gray-500">共 {collection.items.length} 条</span>
              </div>
              {collection.description && (
                <div className="mt-1 text-[11px] text-gray-500">{collection.description}</div>
              )}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
