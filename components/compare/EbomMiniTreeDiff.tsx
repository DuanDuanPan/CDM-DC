"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { EbomTreeNode } from "../structure/ebom/types";
import type { EbomCompareDepth } from "../structure/ebom/useEbomCompareState";
import {
  collectMiniTreeDiffDetails,
  diffEbomTrees,
  type MiniTreeDiffDetail,
  type MiniTreeDiffType,
} from "../structure/ebom/miniTreeDiff";

const CHUNK_SIZE = 150;

const DiffPill = ({ detail }: { detail: MiniTreeDiffDetail }) => (
  <span
    className="inline-flex items-center overflow-hidden rounded-full border border-amber-200 text-[11px]"
    title={`${detail.label}: ${detail.left} → ${detail.right}`}
  >
    <span className="bg-amber-50 px-1.5 py-0.5 text-amber-700">{detail.label}</span>
    <span className="bg-white px-1.5 py-0.5 text-gray-700 max-w-[6.5rem] truncate">{detail.left}</span>
    <span className="bg-white px-1 text-amber-500">→</span>
    <span className="bg-white px-1.5 py-0.5 text-gray-700 max-w-[6.5rem] truncate">{detail.right}</span>
  </span>
);

export default function EbomMiniTreeDiff({
  leftRoot,
  rightRoot,
  depth,
  onDepthChange,
  activeId,
  onActiveIdChange,
}: {
  leftRoot: EbomTreeNode;
  rightRoot: EbomTreeNode;
  depth?: EbomCompareDepth;
  onDepthChange?: (depth: EbomCompareDepth) => void;
  activeId?: string | null;
  onActiveIdChange?: (id: string | null) => void;
}) {
  const [onlyChanges, setOnlyChanges] = useState(true);
  const [onlyFieldMod, setOnlyFieldMod] = useState(false);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [innerDepth, setInnerDepth] = useState<EbomCompareDepth>("all");
  const [focusId, setFocusId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(CHUNK_SIZE);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const loadMoreRef = useRef<HTMLLIElement | null>(null);

  useEffect(() => {
    if (depth !== undefined) {
      setInnerDepth(depth);
    }
  }, [depth]);

  useEffect(() => {
    setVisibleCount(CHUNK_SIZE);
  }, [leftRoot, rightRoot, onlyChanges, onlyFieldMod, depth, focusId]);

  const effectiveDepth: EbomCompareDepth = depth !== undefined ? depth : innerDepth;

  const updateDepth = (value: EbomCompareDepth) => {
    if (onDepthChange) onDepthChange(value);
    else setInnerDepth(value);
  };

  const rows = useMemo(() => diffEbomTrees(leftRoot, rightRoot).map((row) => ({
    id: row.id,
    type: row.type,
    L: row.left,
    R: row.right,
    diffs: row.diffs ?? (row.left && row.right ? collectMiniTreeDiffDetails(row.left, row.right) : []),
  })), [leftRoot, rightRoot]);

  const filtered = rows.filter((row) => {
    if (onlyChanges && row.type === "same") return false;
    if (onlyFieldMod && row.type !== "modified") return false;
    if (effectiveDepth !== "all") {
      const depthValue = row.L?.depth ?? row.R?.depth ?? 0;
      if (depthValue > effectiveDepth) return false;
    }
    if (focusId) {
      const focusRow = rows.find((r) => r.id === focusId);
      const focusPathL = focusRow?.L?.path?.join("/") ?? "";
      const focusPathR = focusRow?.R?.path?.join("/") ?? "";
      const matchLeft = row.L?.id === focusId || (row.L && focusPathL && row.L.path.join("/").startsWith(focusPathL));
      const matchRight = row.R?.id === focusId || (row.R && focusPathR && row.R.path.join("/").startsWith(focusPathR));
      if (!matchLeft && !matchRight) return false;
    }
    return true;
  });

  const Badge = ({ t }: { t: MiniTreeDiffType }) =>
    t === "added" ? (
      <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[11px] text-emerald-700">新增</span>
    ) : t === "removed" ? (
      <span className="rounded bg-rose-50 px-1.5 py-0.5 text-[11px] text-rose-700">移除</span>
    ) : t === "modified" ? (
      <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[11px] text-amber-700">修改</span>
    ) : (
      <span className="rounded bg-gray-50 px-1.5 py-0.5 text-[11px] text-gray-500">一致</span>
    );

  const highlightId = hoverId ?? activeId ?? null;

  useEffect(() => {
    const sentinel = loadMoreRef.current;
    const root = scrollRef.current;
    if (!sentinel || !root) return;
    if (visibleCount >= filtered.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          setVisibleCount((prev) => Math.min(filtered.length, prev + CHUNK_SIZE));
        }
      },
      {
        root,
        threshold: 1.0,
      }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [filtered.length, visibleCount]);

  const visibleRows = filtered.slice(0, visibleCount);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between text-xs text-gray-600">
        <div className="flex items-center gap-4">
          <span className="font-medium text-gray-800">
            <i className="ri-layout-column-line mr-1" />并排迷你树
          </span>
          <label className="inline-flex items-center gap-1">
            <input
              type="checkbox"
              className="rounded border-gray-300"
              checked={onlyChanges}
              onChange={(e) => setOnlyChanges(e.target.checked)}
            />
            仅显示差异
          </label>
          <span>深度</span>
          <select
            value={String(effectiveDepth)}
            onChange={(e) =>
              updateDepth(e.target.value === "all" ? "all" : Number(e.target.value))
            }
            className="rounded border border-gray-300 bg-white px-1.5 py-0.5 text-[11px]"
          >
            <option value="all">全部</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
          </select>
          <label className="inline-flex items-center gap-1">
            <input
              type="checkbox"
              className="rounded border-gray-300"
              checked={onlyFieldMod}
              onChange={(e) => setOnlyFieldMod(e.target.checked)}
            />
            仅字段变化
          </label>
          {focusId && (
            <button
              className="rounded border border-gray-200 bg-white px-1.5 py-0.5 text-[11px] text-gray-600"
              onClick={() => setFocusId(null)}
            >
              清除子树
            </button>
          )}
        </div>
      </div>
      <div ref={scrollRef} className="grid max-h-[28rem] grid-cols-12 gap-2 overflow-y-auto pr-1">
        <div className="col-span-5">
          <div className="mb-1 text-xs text-gray-500">左基线</div>
          <ul className="space-y-1">
            {visibleRows.map((row) => {
              const depth = row.L?.depth ?? row.R?.depth ?? 0;
              const diffs = row.diffs ?? [];
              const accentBarClass = row.type === "added"
                ? "bg-emerald-500"
                : row.type === "removed"
                ? "bg-rose-500"
                : row.type === "modified"
                ? "bg-amber-500"
                : "bg-slate-300";
              const leftPath = row.L?.path?.join(" / ") ?? "";
              return (
                <li
                  key={`L-${row.id}`}
                  className={`relative flex gap-2 rounded pl-3 ${highlightId === row.id ? "bg-blue-50/40" : "hover:bg-slate-50/60"}`}
                  title={leftPath}
                  onMouseEnter={() => {
                    setHoverId(row.id);
                    onActiveIdChange?.(row.id);
                  }}
                  onMouseLeave={() => setHoverId(null)}
                >
                  <span className={`pointer-events-none absolute left-0 top-0 h-full w-1 rounded-l ${accentBarClass}`} />
                  <Badge t={row.type} />
                  <div
                    className="flex flex-col gap-1 py-1"
                    style={{ marginLeft: depth * 12 }}
                  >
                    <span
                      onClick={() => row.L && setFocusId(row.id)}
                      title="仅看此子树"
                      className={`truncate text-sm ${
                        row.L ? "text-gray-800 cursor-pointer hover:underline" : "text-gray-400"
                      }`}
                    >
                      {row.L ? row.L.name : "—"}
                    </span>
                    {!!diffs.length && (
                      <div className="flex flex-wrap gap-1">
                        {diffs.map((detail) => (
                          <DiffPill
                            key={`${detail.key}-${detail.left}-${detail.right}`}
                            detail={detail}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
        <div className="col-span-2">
          <div className="mb-1 text-xs text-gray-500">对齐</div>
          <ul className="space-y-1">
            {visibleRows.map((row) => (
              <li
                key={`C-${row.id}`}
                className={`relative flex h-6 items-center ${highlightId === row.id ? "bg-blue-50/40" : ""}`}
                onMouseEnter={() => {
                  setHoverId(row.id);
                  onActiveIdChange?.(row.id);
                }}
                onMouseLeave={() => setHoverId(null)}
              >
                <div
                  className={`h-0.5 w-full ${
                    row.type === "added"
                      ? "bg-emerald-400"
                      : row.type === "removed"
                      ? "bg-rose-400"
                      : row.type === "modified"
                      ? "bg-amber-400"
                      : "bg-gray-200"
                  } ${row.type === "added" || row.type === "removed" ? "border-t border-dashed" : ""}`}
                ></div>
                {row.type !== "same" && (
                  <div className="absolute translate-x-1/2 text-[11px] text-gray-600">
                    {row.type === "modified" && (
                      <span className="rounded bg-amber-50 border border-amber-200 px-1 py-0.5 text-amber-700">
                        字段变更
                      </span>
                    )}
                    {row.type === "added" && (
                      <span className="rounded bg-emerald-50 border border-emerald-200 px-1 py-0.5 text-emerald-700">
                        新增
                      </span>
                    )}
                    {row.type === "removed" && (
                      <span className="rounded bg-rose-50 border border-rose-200 px-1 py-0.5 text-rose-700">
                        移除
                      </span>
                    )}
                  </div>
                )}
              </li>
            ))}
            <li ref={loadMoreRef} className="h-6" />
          </ul>
        </div>
        <div className="col-span-5">
          <div className="mb-1 text-xs text-gray-500">右基线</div>
          <ul className="space-y-1">
            {visibleRows.map((row) => {
              const depth = row.R?.depth ?? row.L?.depth ?? 0;
              const accentBarClass = row.type === "added"
                ? "bg-emerald-500"
                : row.type === "removed"
                ? "bg-rose-500"
                : row.type === "modified"
                ? "bg-amber-500"
                : "bg-slate-300";
              const rightPath = row.R?.path?.join(" / ") ?? "";
              return (
                <li
                  key={`R-${row.id}`}
                  className={`relative flex gap-2 rounded pl-3 ${highlightId === row.id ? "bg-blue-50/40" : "hover:bg-slate-50/60"}`}
                  title={rightPath}
                  onMouseEnter={() => {
                    setHoverId(row.id);
                    onActiveIdChange?.(row.id);
                  }}
                  onMouseLeave={() => setHoverId(null)}
                >
                  <span className={`pointer-events-none absolute left-0 top-0 h-full w-1 rounded-l ${accentBarClass}`} />
                  <Badge t={row.type} />
                  <span
                    onClick={() => row.R && setFocusId(row.id)}
                    title="仅看此子树"
                    style={{ marginLeft: depth * 12 }}
                    className={`truncate text-sm ${
                      row.R ? "text-gray-800 cursor-pointer hover:underline" : "text-gray-400"
                    }`}
                  >
                    {row.R ? row.R.name : "—"}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
      {filtered.length > visibleRows.length && (
        <div className="mt-2 text-center text-[11px] text-gray-500">
          已加载 {visibleRows.length} / {filtered.length} 条，继续下拉以加载更多。
        </div>
      )}
    </div>
  );
}
