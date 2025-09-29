"use client";

import { useEffect, useMemo, useState } from "react";
import knowledgeSearchMock from "../../../docs/mocks/knowledge-search.json";

type KnowledgeSearchHitType = "experience" | "standard" | "review" | "material" | string;

interface KnowledgeSearchHit {
  id: string;
  type: KnowledgeSearchHitType;
  title: string;
  snippet: string;
  tags: string[];
  score?: number;
  updatedAt?: string;
  owner?: string;
  meeting?: string;
  link?: string;
  highlights?: string[];
  recommendation?: string;
}

interface KnowledgeSearchPayload {
  queries: Record<string, KnowledgeSearchHit[]>;
}

const data = knowledgeSearchMock as KnowledgeSearchPayload;

const SCORE_PROFILES: Array<{ id: string; label: string; weight: [number, number]; description: string }> = [
  { id: "balanced", label: "平衡模式", weight: [0.5, 0.5], description: "得分与时效权重各 50%" },
  { id: "recall", label: "召回优先", weight: [0.7, 0.3], description: "扩大同义词与历史案例的覆盖" },
  { id: "precision", label: "精准优先", weight: [0.3, 0.7], description: "突出最新、权威来源" },
];

const typeLabel: Record<string, string> = {
  experience: "经验",
  standard: "标准",
  review: "评审",
  material: "材料",
};

const mockSearch = (query: string, synonyms: string[]): KnowledgeSearchHit[] => {
  if (!query) return [];
  const q = query.trim();
  const direct = data.queries[q] ?? [];
  const lower = q.toLowerCase();
  const synonymsLower = synonyms.map((s) => s.toLowerCase());
  const fallback: KnowledgeSearchHit[] = Object.values(data.queries)
    .flat()
    .filter((item) => {
      const hay = `${item.title} ${item.snippet} ${(item.tags ?? []).join(" ")}`.toLowerCase();
      return hay.includes(lower) || synonymsLower.some((syn) => syn && hay.includes(syn));
    });
  const merged = [...direct, ...fallback];
  const dedupMap = new Map<string, KnowledgeSearchHit>();
  merged.forEach((item) => {
    if (!dedupMap.has(item.id)) {
      dedupMap.set(item.id, item);
    }
  });
  return Array.from(dedupMap.values());
};

const highlightText = (text: string, highlights?: string[]) => {
  if (!highlights?.length) return text;
  const escaped = highlights.map((h) => h.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  if (!escaped.length) return text;
  const regex = new RegExp(`(${escaped.join("|")})`, "gi");
  return text.replace(regex, (match) => `<mark class="rounded bg-yellow-100 px-1">${match}</mark>`);
};

export default function KnowledgeSearchDrawer({
  open,
  onClose,
  defaultQuery,
  defaultTags,
}: {
  open: boolean;
  onClose: () => void;
  defaultQuery?: string;
  defaultTags?: string[];
}) {
  const [query, setQuery] = useState(defaultQuery ?? "");
  const [synonymsText, setSynonymsText] = useState("");
  const [profile, setProfile] = useState<string>(SCORE_PROFILES[0]?.id ?? "balanced");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<KnowledgeSearchHit[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setQuery(defaultQuery ?? "");
    setSynonymsText(defaultTags?.join(" ") ?? "");
    setResults([]);
    setError(null);
  }, [open, defaultQuery, defaultTags]);

  const synonyms = useMemo(
    () => synonymsText.split(/[\s,，]+/).map((s) => s.trim()).filter(Boolean),
    [synonymsText]
  );

  const runSearch = () => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    setError(null);
    window.setTimeout(() => {
      try {
        const hits = mockSearch(query, synonyms);
        setResults(hits);
      } catch (err) {
        setError(err instanceof Error ? err.message : "搜索失败，请稍后重试");
      } finally {
        setLoading(false);
      }
    }, 300);
  };

  useEffect(() => {
    if (!open) return;
    if (!query.trim()) return;
    runSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const profileMeta = SCORE_PROFILES.find((item) => item.id === profile);
  const filtered = results.filter((hit) => (typeFilter === "all" ? true : hit.type === typeFilter));

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex h-[80vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <div className="text-base font-semibold text-gray-900">知识检索（Mock）</div>
            <div className="text-xs text-gray-500">对接 `/api/knowledge/search` 预留位，当前使用 docs/mocks/knowledge-search.json。</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:border-gray-300"
          >
            <i className="ri-close-line" /> 关闭
          </button>
        </div>

        <div className="grid gap-4 border-b bg-slate-50/60 px-6 py-4 md:grid-cols-5">
          <div className="md:col-span-3">
            <label className="text-xs text-gray-500">检索关键词</label>
            <div className="mt-1 flex gap-2">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="例如：燃油泵 空化风险"
                className="flex-1 rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-blue-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={runSearch}
                className="inline-flex items-center gap-1 rounded bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700"
              >
                <i className="ri-search-line" /> 搜索
              </button>
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500">同义词 / 相关术语</label>
            <textarea
              value={synonymsText}
              onChange={(event) => setSynonymsText(event.target.value)}
              rows={2}
              placeholder="多个词用空格分隔"
              className="mt-1 w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-blue-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">排序策略</label>
            <select
              value={profile}
              onChange={(event) => setProfile(event.target.value)}
              className="mt-1 w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800"
            >
              {SCORE_PROFILES.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}（{Math.round(item.weight[0] * 100)}/{Math.round(item.weight[1] * 100)}）
                </option>
              ))}
            </select>
            {profileMeta && (
              <div className="mt-1 text-[11px] text-gray-500">{profileMeta.description}</div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 border-b px-6 py-3 text-xs text-gray-600">
          <label className="flex items-center gap-1">
            <span>类型</span>
            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
              className="rounded border border-gray-300 bg-white px-2 py-1 text-[11px]"
            >
              <option value="all">全部</option>
              <option value="experience">经验</option>
              <option value="standard">标准</option>
              <option value="review">评审</option>
              <option value="material">材料</option>
            </select>
          </label>
          <span className="flex items-center gap-1 text-[11px] text-gray-500">
            <i className="ri-lightbulb-flash-line text-amber-500" /> 同义词将优先扩展召回（仅前端模拟）。
          </span>
          {defaultTags?.length ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] text-emerald-700">
              <i className="ri-price-tag-3-line" /> 默认标签：{defaultTags.join("、")}
            </span>
          ) : null}
        </div>

        <div className="flex-1 overflow-y-auto bg-white px-6 py-4">
          {loading && (
            <div className="rounded-xl border border-dashed border-gray-200 bg-slate-50/80 p-6 text-center text-sm text-gray-500">
              <i className="ri-loader-4-line mr-1 animate-spin text-gray-400" /> 检索中，请稍候…
            </div>
          )}
          {!loading && error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-4 text-sm text-rose-700">
              <i className="ri-error-warning-line mr-1" /> {error}
            </div>
          )}
          {!loading && !error && filtered.length === 0 && query.trim() && (
            <div className="rounded-xl border border-dashed border-gray-200 bg-slate-50/80 p-6 text-center text-sm text-gray-500">
              未检索到结果，尝试调整关键词或同义词。
            </div>
          )}
          {!loading && !error && filtered.length > 0 && (
            <ul className="space-y-3">
              {filtered.map((hit) => (
                <li key={hit.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                      <span dangerouslySetInnerHTML={{ __html: highlightText(hit.title, hit.highlights) }} />
                      <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] text-indigo-700 border border-indigo-200">
                        <i className="ri-bookmark-2-line" /> {typeLabel[hit.type] ?? hit.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-gray-500">
                      {hit.score !== undefined && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-0.5 text-slate-600">
                          <i className="ri-sparkling-fill text-amber-500" /> 相关度 {(hit.score * 100).toFixed(0)}%
                        </span>
                      )}
                      {hit.updatedAt && <span>更新：{hit.updatedAt}</span>}
                      {hit.owner && <span>归口：{hit.owner}</span>}
                    </div>
                  </div>
                  <p
                    className="mt-2 text-sm text-gray-600"
                    dangerouslySetInnerHTML={{ __html: highlightText(hit.snippet, hit.highlights) }}
                  />
                  {hit.recommendation && (
                    <div className="mt-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                      <i className="ri-compass-3-line mr-1" /> {hit.recommendation}
                    </div>
                  )}
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
                    {hit.tags?.map((tag) => (
                      <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-gray-600">
                        <i className="ri-price-tag-3-line" /> {tag}
                      </span>
                    ))}
                    {hit.meeting && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2 py-0.5 text-purple-700">
                        <i className="ri-calendar-event-line" /> {hit.meeting}
                      </span>
                    )}
                    {hit.link && (
                      <a
                        href={hit.link}
                        target="_blank"
                        rel="noreferrer"
                        className="ml-auto inline-flex items-center gap-1 text-blue-600 hover:underline"
                      >
                        查看详情 <i className="ri-external-link-line" />
                      </a>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
