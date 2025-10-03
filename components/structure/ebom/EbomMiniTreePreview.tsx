"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { EbomTreeNode } from "./types";
import type { EbomCompareDepth, EbomCompareFilter } from "./useEbomCompareState";
import { diffEbomTrees, type MiniTreeDiffType } from "./miniTreeDiff";

const DiffBadge = ({ type }: { type: MiniTreeDiffType }) => {
  if (type === "added") {
    return <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[11px] text-emerald-700">新增</span>;
  }
  if (type === "removed") {
    return <span className="rounded bg-rose-50 px-1.5 py-0.5 text-[11px] text-rose-700">移除</span>;
  }
  if (type === "modified") {
    return <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[11px] text-amber-700">修改</span>;
  }
  return <span className="rounded bg-gray-50 px-1.5 py-0.5 text-[11px] text-gray-500">一致</span>;
};

const DiffChip = ({ label, icon }: { label: string; icon: string }) => (
  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-700">
    <i className={icon} /> {label}
  </span>
);

export default function EbomMiniTreePreview({
  leftRoot,
  rightRoot,
  depth = "all",
  onDepthChange,
  filter = "all",
  selectedId,
  onSelectId,
  maxItems = 150,
}: {
  leftRoot: EbomTreeNode;
  rightRoot: EbomTreeNode;
  depth?: EbomCompareDepth;
  onDepthChange?: (next: EbomCompareDepth) => void;
  filter?: EbomCompareFilter;
  selectedId?: string | null;
  onSelectId?: (id: string) => void;
  maxItems?: number;
}) {
  const [onlyDiff, setOnlyDiff] = useState(true);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [localDepth, setLocalDepth] = useState<EbomCompareDepth>(depth ?? "all");
  const [visibleCount, setVisibleCount] = useState(maxItems);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (depth !== undefined) {
      setLocalDepth(depth);
    }
  }, [depth]);

  useEffect(() => {
    setVisibleCount(maxItems);
  }, [leftRoot, rightRoot, filter, onlyDiff, depth, maxItems]);

  const effectiveDepth = depth ?? localDepth;

  const updateDepth = (value: EbomCompareDepth) => {
    if (onDepthChange) {
      onDepthChange(value);
    } else {
      setLocalDepth(value);
    }
  };

  const rows = useMemo(() => diffEbomTrees(leftRoot, rightRoot), [leftRoot, rightRoot]);

  const totals = useMemo(() => {
    let added = 0;
    let removed = 0;
    let modified = 0;
    rows.forEach((row) => {
      if (row.type === "added") added += 1;
      else if (row.type === "removed") removed += 1;
      else if (row.type === "modified") modified += 1;
    });
    return { added, removed, modified, total: rows.length };
  }, [rows]);

  const filtered = rows.filter((row) => {
    if (onlyDiff && row.type === "same") return false;
    if (filter !== "all" && row.type !== filter) return false;
    if (effectiveDepth !== "all") {
      const depthValue = row.left?.depth ?? row.right?.depth ?? 0;
      if (depthValue > effectiveDepth) return false;
    }
    return true;
  });
  const visibleRows = filtered.slice(0, visibleCount);
  const highlightId = hoverId ?? selectedId ?? null;
  const remainingCount = Math.max(filtered.length - visibleRows.length, 0);

  useEffect(() => {
    const sentinel = loadMoreRef.current;
    const root = scrollRef.current;
    if (!sentinel || !root) return;
    if (visibleCount >= filtered.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          setVisibleCount((prev) => Math.min(filtered.length, prev + maxItems));
        }
      },
      { root, threshold: 1.0 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [filtered.length, visibleCount, maxItems]);

  useEffect(() => {
    if (!onSelectId) return;
    const handleKey = (event: KeyboardEvent) => {
      if (!event.altKey) return;
      if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
      const ids = filtered.map((row) => row.id);
      if (!ids.length) return;
      event.preventDefault();
      const currentId = selectedId ?? focusedId ?? ids[0];
      const currentIndex = ids.indexOf(currentId);
      const delta = event.key === "ArrowDown" ? 1 : -1;
      const nextIndex = currentIndex === -1 ? (delta > 0 ? 0 : ids.length - 1) : Math.min(Math.max(currentIndex + delta, 0), ids.length - 1);
      const nextId = ids[nextIndex];
      setFocusedId(nextId);
      onSelectId(nextId);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [filtered, focusedId, onSelectId, selectedId]);

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-gray-600">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-sm font-medium text-gray-800">
            <i className="ri-layout-column-line" /> 并排迷你树（预览）
          </span>
          <label className="inline-flex items-center gap-1">
            <input
              type="checkbox"
              className="rounded border-gray-300"
              checked={onlyDiff}
              onChange={(event) => setOnlyDiff(event.target.checked)}
            />
            仅显示差异
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] text-emerald-700">
            <i className="ri-add-line" /> 新增 {totals.added}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[11px] text-rose-700">
            <i className="ri-subtract-line" /> 移除 {totals.removed}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] text-amber-700">
            <i className="ri-edit-line" /> 修改 {totals.modified}
          </span>
          <span className="text-[11px] text-gray-500">显示 {visibleRows.length}/{filtered.length} · 全量 {totals.total}</span>
          {remainingCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">
              <i className="ri-time-line" /> 剩余 {remainingCount}
            </span>
          )}
          <span>深度</span>
          <select
            value={String(effectiveDepth)}
            onChange={(event) => {
              const next = event.target.value === "all" ? "all" : (Number(event.target.value) as EbomCompareDepth);
              updateDepth(next);
            }}
            className="rounded border border-gray-300 bg-white px-2 py-1 text-[11px]"
          >
            <option value="all">全部</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
          </select>
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] text-blue-600">
            <i className="ri-exchange-line" /> Alt + ↑/↓ 快速跳差异
          </span>
        </div>
      </div>

      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full bg-blue-500 transition-all"
          style={{ width: `${filtered.length ? Math.min((visibleRows.length / filtered.length) * 100, 100) : 0}%` }}
        />
      </div>

      <div ref={scrollRef} className="mt-3 grid max-h-[26rem] gap-2 overflow-y-auto pr-1">
        {visibleRows.map((row) => {
          const leftDepth = row.left?.depth ?? row.right?.depth ?? 0;
          const rightDepth = row.right?.depth ?? row.left?.depth ?? 0;
          const leftName = row.left?.name ?? "—";
          const rightName = row.right?.name ?? "—";
          const leftPn = row.left?.partNumber ?? "";
          const rightPn = row.right?.partNumber ?? "";
          const diffs = row.diffs ?? [];
          const isActive = highlightId === row.id;
          const accentBarClass = row.type === "added"
            ? "bg-emerald-500"
            : row.type === "removed"
            ? "bg-rose-500"
            : row.type === "modified"
            ? "bg-amber-500"
            : "bg-slate-300";
          const leftPath = row.left?.path?.join(" / ") ?? "";
          const rightPath = row.right?.path?.join(" / ") ?? "";

          return (
            <div
              key={row.id}
              className={`relative rounded-xl border border-gray-100 bg-slate-50/60 p-3 pl-4 transition ${
                isActive ? "border-blue-300 bg-blue-50/40" : "hover:border-blue-200"
              }`}
              onMouseEnter={() => setHoverId(row.id)}
              onMouseLeave={() => setHoverId(null)}
              title={[leftPath, rightPath].filter(Boolean).join("\n⇄ ")}
            >
              <span className={`pointer-events-none absolute left-0 top-0 h-full w-1 rounded-l-xl ${accentBarClass}`} />
              <div className="flex items-center gap-2">
                <DiffBadge type={row.type} />
                <button
                  type="button"
                  onClick={() => row.left?.id && onSelectId?.(row.left.id)}
                  className={`flex-1 rounded px-2 py-1 text-left text-sm ${
                    row.left ? "text-gray-900 hover:bg-white" : "text-gray-400 cursor-default"
                  }`}
                  style={{ paddingLeft: Math.max(leftDepth - 1, 0) * 12 + 8 }}
                  title={row.left ? `${leftName}${leftPn ? ` · ${leftPn}` : ""}` : "左基线无此节点"}
                >
                  <div className="truncate">{leftName}</div>
                  {leftPn && <div className="text-[11px] text-gray-500">{leftPn}</div>}
                </button>
                <span className="text-[11px] text-gray-400">⇄</span>
                <button
                  type="button"
                  onClick={() => row.right?.id && onSelectId?.(row.right.id)}
                  className={`flex-1 rounded px-2 py-1 text-left text-sm ${
                    row.right ? "text-gray-900 hover:bg-white" : "text-gray-400 cursor-default"
                  }`}
                  style={{ paddingLeft: Math.max(rightDepth - 1, 0) * 12 + 8 }}
                  title={row.right ? `${rightName}${rightPn ? ` · ${rightPn}` : ""}` : "右基线无此节点"}
                >
                  <div className="truncate">{rightName}</div>
                  {rightPn && <div className="text-[11px] text-gray-500">{rightPn}</div>}
                </button>
              </div>
              {diffs.length > 0 && (
                <div className="mt-2 flex flex-wrap items-center gap-1">
                  {diffs.map((diff) => (
                    <DiffChip key={diff.key} icon="ri-edit-line" label={`${diff.label}: ${diff.left} → ${diff.right}`} />
                  ))}
                </div>
              )}
              <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
                {row.ownerDiscipline && <DiffChip icon="ri-user-voice-line" label={row.ownerDiscipline} />}
                {row.safetyCritical && <DiffChip icon="ri-alert-line" label="SC" />}
                {row.llp && <DiffChip icon="ri-timer-line" label="LLP" />}
                {row.ecoId && <DiffChip icon="ri-git-commit-line" label={row.ecoId} />}
                {row.ccbStatus && <DiffChip icon="ri-shield-check-line" label={row.ccbStatus} />}
              </div>
            </div>
          );
        })}
        {visibleRows.length === 0 && (
          <div className="rounded-xl border border-dashed border-gray-200 bg-white py-10 text-center text-sm text-gray-500">
            当前筛选无差异，尝试放宽条件或关闭“仅差异”。
          </div>
        )}
        {visibleCount < filtered.length && (
          <div ref={loadMoreRef} className="flex items-center justify-center py-2 text-[12px] text-gray-500">
            正在加载更多差异…
          </div>
        )}
      </div>
    </section>
  );
}
