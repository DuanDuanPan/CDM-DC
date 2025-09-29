"use client";

import type { KnowledgeCard } from "./cockpitTypes";

import { useEffect, useMemo, useState } from 'react';

export default function KnowledgeRail({ items, enableFilter = true }: { items: KnowledgeCard[]; enableFilter?: boolean }) {
  const allTags = useMemo(() => Array.from(new Set((items ?? []).flatMap(i => i.tags))), [items]);
  const [q, setQ] = useState('');
  const [tag, setTag] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<'all'|'experience'|'standard'|'review'|'material'>('all');
  const [onlyFav, setOnlyFav] = useState(false);
  const [fav, setFav] = useState<Record<string, boolean>>({});
  const [groups, setGroups] = useState<Record<string, { name: string; members: string[] }>>({});
  const [groupFilter, setGroupFilter] = useState<string>('all');
  const [manageMode, setManageMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});
  const [targetGroup, setTargetGroup] = useState<string>('');
  const [tagOverrides, setTagOverrides] = useState<Record<string, string[]>>({});
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem('kb_fav_ids');
      if (raw) {
        const arr: string[] = JSON.parse(raw);
        const map: Record<string, boolean> = {};
        arr.forEach(id => map[id] = true);
        setFav(map);
      }
    } catch {}
    try {
      const rawGroups = window.localStorage.getItem('kb_fav_groups');
      if (rawGroups) {
        const parsed = JSON.parse(rawGroups) as Record<string, { name: string; members: string[] }>;
        setGroups(parsed ?? {});
      }
    } catch {}
    try {
      const rawTags = window.localStorage.getItem('kb_tag_overrides');
      if (rawTags) {
        const parsed = JSON.parse(rawTags) as Record<string, string[]>;
        setTagOverrides(parsed ?? {});
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (!manageMode) {
      setSelectedIds({});
      setTargetGroup('');
    }
  }, [manageMode]);

  useEffect(() => {
    if (groupFilter !== 'all' && !groups[groupFilter]) {
      setGroupFilter('all');
    }
  }, [groupFilter, groups]);

  useEffect(() => {
    if (targetGroup && !groups[targetGroup]) {
      setTargetGroup('');
    }
  }, [targetGroup, groups]);

  const persistGroups = (next: Record<string, { name: string; members: string[] }>) => {
    try {
      window.localStorage.setItem('kb_fav_groups', JSON.stringify(next));
    } catch {}
    return next;
  };

  const persistTags = (next: Record<string, string[]>) => {
    try {
      window.localStorage.setItem('kb_tag_overrides', JSON.stringify(next));
    } catch {}
    return next;
  };

  const updateGroups = (updater: (prev: Record<string, { name: string; members: string[] }>) => Record<string, { name: string; members: string[] }>) => {
    setGroups(prev => persistGroups(updater(prev)));
  };

  const updateTagOverrides = (updater: (prev: Record<string, string[]>) => Record<string, string[]>) => {
    setTagOverrides(prev => persistTags(updater(prev)));
  };
  const toggleFav = (id: string) => {
    setFav(prev => {
      const nextValue = !prev[id];
      const next = { ...prev, [id]: nextValue };
      try {
        const ids = Object.keys(next).filter(k => next[k]);
        window.localStorage.setItem('kb_fav_ids', JSON.stringify(ids));
      } catch {}

      if (!nextValue) {
        updateGroups((prevGroups) => {
          const draft = { ...prevGroups };
          let changed = false;
          Object.keys(draft).forEach((gid) => {
            const members = draft[gid].members.filter((mid) => mid !== id);
            if (members.length !== draft[gid].members.length) {
              draft[gid] = { ...draft[gid], members };
              changed = true;
            }
            if (draft[gid].members.length === 0) {
              delete draft[gid];
              changed = true;
            }
          });
          return changed ? draft : prevGroups;
        });
        setSelectedIds((prevSel) => {
          if (!prevSel[id]) return prevSel;
          const nextSel = { ...prevSel };
          delete nextSel[id];
          return nextSel;
        });
      }
      return next;
    });
  };
  const filtered = (items ?? []).filter(i => {
    const tags = tagOverrides[i.id] ?? i.tags;
    const haystack = `${i.title} ${i.snippet} ${tags.join(' ')}`.toLowerCase();
    const okQ = !q || haystack.includes(q.toLowerCase());
    const okTag = !tag || tags.includes(tag);
    const okType = typeFilter === 'all' || i.type === typeFilter;
    const okFav = !onlyFav || !!fav[i.id];
    const cardGroupIds = Object.entries(groups)
      .filter(([, group]) => group.members.includes(i.id))
      .map(([gid]) => gid);
    const okGroup = groupFilter === 'all' || cardGroupIds.includes(groupFilter);
    return okQ && okTag && okType && okFav && okGroup;
  });

  const typeLabel: Record<KnowledgeCard['type'], string> = {
    experience: '经验',
    standard: '标准',
    review: '评审',
    material: '材料',
  };

  const renderDetail = (card: KnowledgeCard) => {
    switch (card.type) {
      case 'experience':
        return (
          <div className="space-y-1 text-xs text-gray-600">
            <div><span className="font-medium text-gray-700">问题：</span>{card.issue}</div>
            <div><span className="font-medium text-gray-700">影响：</span>{card.impact}</div>
            <div><span className="font-medium text-gray-700">措施：</span>{card.solution}</div>
            <div className="flex flex-wrap gap-3 text-[11px] text-gray-500">
              {card.stage && <span>阶段：{card.stage}</span>}
              {card.owner && <span>责任人：{card.owner}</span>}
            </div>
          </div>
        );
      case 'standard':
        return (
          <div className="space-y-1 text-xs text-gray-600">
            <div><span className="font-medium text-gray-700">编号：</span>{card.docId}</div>
            <div><span className="font-medium text-gray-700">版本：</span>{card.version}</div>
            <div><span className="font-medium text-gray-700">范围：</span>{card.scope}</div>
            <div className="flex flex-wrap gap-3 text-[11px] text-gray-500">
              <span>{card.status === 'mandatory' ? '强制执行' : '推荐遵循'}</span>
              {card.owner && <span>归口：{card.owner}</span>}
            </div>
          </div>
        );
      case 'review':
        return (
          <div className="space-y-1 text-xs text-gray-600">
            <div><span className="font-medium text-gray-700">会议：</span>{card.meeting}</div>
            <div><span className="font-medium text-gray-700">日期：</span>{card.date}</div>
            <div><span className="font-medium text-gray-700">结论：</span>{card.conclusion}</div>
            {card.actions?.length ? (
              <ul className="list-disc pl-4 text-[11px] text-gray-500 marker:text-gray-400">
                {card.actions.map((a, idx) => (
                  <li key={idx}>{a}</li>
                ))}
              </ul>
            ) : null}
          </div>
        );
      case 'material':
        return (
          <div className="space-y-1 text-xs text-gray-600">
            <div><span className="font-medium text-gray-700">材料：</span>{card.material}</div>
            <div><span className="font-medium text-gray-700">规格：</span>{card.spec}</div>
            <div><span className="font-medium text-gray-700">工艺：</span>{card.process}</div>
            <div className="flex flex-wrap gap-3 text-[11px] text-gray-500">
              {card.temperature && <span>温控：{card.temperature}</span>}
              {card.supplier && <span>供应：{card.supplier}</span>}
            </div>
          </div>
        );
    }
  };

  const favouriteItems = (items ?? []).filter(i => fav[i.id]);
  const selectedList = Object.keys(selectedIds).filter((id) => selectedIds[id]);
  const selectedCount = selectedList.filter((id) => fav[id]).length;

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = { ...prev, [id]: !prev[id] };
      if (!next[id]) delete next[id];
      return next;
    });
  };

  const handleCreateGroup = () => {
    const name = window.prompt('新分组名称', '我的收藏');
    if (!name) return;
    const id = `grp-${Date.now()}`;
    updateGroups(prev => ({ ...prev, [id]: { name, members: [] } }));
    setTargetGroup(id);
  };

  const handleAssignToGroup = () => {
    if (!targetGroup || !groups[targetGroup]) return;
    if (!selectedCount) return;
    const idsToAssign = selectedList.filter((id) => fav[id]);
    if (!idsToAssign.length) return;
    updateGroups(prev => {
      const next = { ...prev };
      const target = next[targetGroup];
      if (!target) return prev;
      const memberSet = new Set(target.members);
      idsToAssign.forEach(id => memberSet.add(id));
      next[targetGroup] = { ...target, members: Array.from(memberSet) };
      return next;
    });
    setSelectedIds({});
  };

  const handleRemoveFromGroup = () => {
    if (!targetGroup || !groups[targetGroup]) return;
    if (!selectedCount) return;
    updateGroups(prev => {
      const next = { ...prev };
      const target = next[targetGroup];
      if (!target) return prev;
      const members = target.members.filter(id => !selectedList.includes(id));
      if (!members.length) {
        delete next[targetGroup];
      } else {
        next[targetGroup] = { ...target, members };
      }
      return next;
    });
    setSelectedIds({});
  };

  const handleDeleteGroup = () => {
    if (!targetGroup || !groups[targetGroup]) return;
    if (!window.confirm(`删除分组“${groups[targetGroup].name}”？`)) return;
    updateGroups(prev => {
      const next = { ...prev };
      delete next[targetGroup];
      return next;
    });
    setTargetGroup('');
  };

  const handleEditTags = (id: string, existing: string[]) => {
    const input = window.prompt('编辑标签（以逗号分隔）', existing.join(','));
    if (input === null) return;
    const nextTags = input
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);
    updateTagOverrides(prev => {
      const next = { ...prev };
      if (nextTags.length) next[id] = nextTags;
      else delete next[id];
      return next;
    });
  };

  const handleExportMarkdown = () => {
    const base = selectedCount ? selectedList : favouriteItems.map(i => i.id);
    const collection = (items ?? []).filter(i => base.includes(i.id) && fav[i.id]);
    if (!collection.length) return;
    const now = new Date();
    const lines: string[] = [];
    lines.push('# 知识收藏清单');
    lines.push(`导出时间：${now.toLocaleString()}`);
    lines.push('');
    collection.forEach((card, idx) => {
      const cardTags = tagOverrides[card.id] ?? card.tags;
      const groupNames = Object.values(groups)
        .filter(g => g.members.includes(card.id))
        .map(g => g.name)
        .join('、');
      lines.push(`## ${idx + 1}. ${card.title}`);
      lines.push(`- 类型：${typeLabel[card.type]}`);
      lines.push(`- 摘要：${card.snippet}`);
      lines.push(`- 更新时间：${card.updatedAt}`);
      const formattedTags = cardTags.map(t => '`' + t + '`').join(' ');
      lines.push(`- 标签：${formattedTags || '无'}`);
      if (groupNames) {
        lines.push(`- 分组：${groupNames}`);
      }
      lines.push(`- 链接：${card.link}`);
      lines.push('');
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '知识收藏.md';
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between gap-2 text-sm">
        <div className="flex items-center gap-2 font-semibold text-gray-800">
          <i className="ri-book-open-line text-indigo-600" /> 知识沉淀（相关）
        </div>
        {enableFilter && (
          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
            <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="搜索标题/摘要/标签" className="rounded border border-gray-200 bg-white px-2 py-1"/>
            <select value={tag ?? ''} onChange={(e)=>setTag(e.target.value || null)} className="rounded border border-gray-200 bg-white px-2 py-1">
              <option value="">全部标签</option>
              {allTags.map(t => <option key={t} value={t}>#{t}</option>)}
            </select>
            <select value={typeFilter} onChange={(e)=>setTypeFilter(e.target.value as any)} className="rounded border border-gray-200 bg-white px-2 py-1">
              <option value="all">全部类型</option>
              <option value="experience">经验</option>
              <option value="standard">标准</option>
              <option value="review">评审</option>
              <option value="material">材料</option>
            </select>
            <select value={groupFilter} onChange={(e)=>setGroupFilter(e.target.value)} className="rounded border border-gray-200 bg-white px-2 py-1">
              <option value="all">全部分组</option>
              {Object.entries(groups).map(([gid, group]) => (
                <option key={gid} value={gid}>{group.name}</option>
              ))}
            </select>
            <label className="ml-1 inline-flex items-center gap-1 text-xs text-gray-600">
              <input type="checkbox" className="rounded border-gray-300" checked={onlyFav} onChange={(e)=>setOnlyFav(e.target.checked)} /> 仅看收藏
            </label>
            <button
              type="button"
              onClick={() => setManageMode((prev) => !prev)}
              className={`rounded border px-2 py-1 text-xs ${manageMode ? 'border-amber-300 bg-amber-50 text-amber-700' : 'border-gray-200 bg-white text-gray-700 hover:border-amber-300 hover:text-amber-700'}`}
            >
              <i className="ri-settings-3-line mr-1"/>{manageMode ? '退出管理' : '管理收藏'}
            </button>
            <button
              type="button"
              onClick={handleCreateGroup}
              className="rounded border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 hover:border-indigo-300 hover:text-indigo-600"
            >
              <i className="ri-folder-add-line mr-1"/>新建分组
            </button>
            <button
              type="button"
              onClick={handleExportMarkdown}
              disabled={!favouriteItems.length}
              className="rounded border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 hover:border-emerald-300 hover:text-emerald-600 disabled:opacity-40"
              title="导出 Markdown"
            >
              <i className="ri-markdown-line mr-1"/>Markdown
            </button>
            <button
              type="button"
              onClick={() => {
                const favItems = (items ?? []).filter(i => fav[i.id]);
                const rows = [["id","type","title","tags","updatedAt","link"], ...favItems.map(i => [i.id, i.type, i.title, (tagOverrides[i.id] ?? i.tags).join('|'), i.updatedAt, i.link])];
                const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = '知识收藏.csv'; a.click(); URL.revokeObjectURL(url);
              }}
              disabled={!favouriteItems.length}
              className="rounded border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 hover:border-blue-300 hover:text-blue-600 disabled:opacity-40"
              title="导出收藏（CSV）"
            >
              <i className="ri-download-2-line"/> CSV
            </button>
            <button
              type="button"
              onClick={() => {
                const favItems = (items ?? []).filter(i => fav[i.id]);
                const blob = new Blob([JSON.stringify(favItems, null, 2)], { type: 'application/json;charset=utf-8;' });
                const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = '知识收藏.json'; a.click(); URL.revokeObjectURL(url);
              }}
              disabled={!favouriteItems.length}
              className="rounded border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 hover:border-blue-300 hover:text-blue-600 disabled:opacity-40"
              title="导出收藏（JSON）"
            >
              <i className="ri-download-2-line"/> JSON
            </button>
            {manageMode && (
              <>
                <span className="text-xs text-gray-500 ml-1">已选 {selectedCount}</span>
                <select value={targetGroup} onChange={(e)=>setTargetGroup(e.target.value)} className="rounded border border-gray-200 bg-white px-2 py-1">
                  <option value="">目标分组</option>
                  {Object.entries(groups).map(([gid, group]) => (
                    <option key={gid} value={gid}>{group.name}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleAssignToGroup}
                  disabled={!selectedCount || !targetGroup}
                  className="rounded border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 hover:border-green-300 hover:text-green-600 disabled:opacity-40"
                >
                  加入
                </button>
                <button
                  type="button"
                  onClick={handleRemoveFromGroup}
                  disabled={!selectedCount || !targetGroup}
                  className="rounded border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 hover:border-rose-300 hover:text-rose-600 disabled:opacity-40"
                >
                  移出
                </button>
                <button
                  type="button"
                  onClick={handleDeleteGroup}
                  disabled={!targetGroup}
                  className="rounded border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 hover:border-rose-400 hover:text-rose-600 disabled:opacity-40"
                >
                  删除分组
                </button>
              </>
            )}
          </div>
        )}
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {filtered.map((k) => {
          const tags = tagOverrides[k.id] ?? k.tags;
          const isFav = !!fav[k.id];
          const isSelected = !!selectedIds[k.id];
          const cardGroupNames = Object.values(groups)
            .filter(group => group.members.includes(k.id))
            .map(group => group.name);
          return (
          <a
            key={k.id}
            href={k.link}
            target="_blank"
            className={`group rounded-xl border ${isSelected ? 'border-amber-300 bg-amber-50/70 hover:border-amber-400' : 'border-gray-100 bg-slate-50/70 hover:border-indigo-300'} p-3 transition-colors`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2 min-w-0">
                {manageMode && (
                  <input
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 rounded border-gray-300"
                    checked={isSelected}
                    disabled={!isFav}
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (isFav) toggleSelect(k.id); }}
                    onChange={(e) => { e.preventDefault(); e.stopPropagation(); if (isFav) toggleSelect(k.id); }}
                    aria-label="选择收藏"
                    title={isFav ? '加入批量操作' : '请先收藏后再分组'}
                  />
                )}
                <div className="min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate" title={k.title}>{k.title}</div>
                  <div className="mt-1 text-xs text-gray-600 line-clamp-2">{k.snippet}</div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 text-right">
                <div className="flex items-center gap-2">
                  <span className={`text-[11px] rounded border px-1.5 py-0.5 ${
                    k.type==='experience' ? 'text-amber-700 bg-amber-50 border-amber-200' :
                    k.type==='standard' ? 'text-blue-700 bg-blue-50 border-blue-200' :
                    k.type==='review' ? 'text-purple-700 bg-purple-50 border-purple-200' :
                    'text-emerald-700 bg-emerald-50 border-emerald-200'
                  }`}>
                    <i className={`${
                      k.type==='experience' ? 'ri-lightbulb-line' :
                      k.type==='standard' ? 'ri-book-2-line' :
                      k.type==='review' ? 'ri-discuss-line' : 'ri-flask-line'
                    } mr-1`}/>
                    {typeLabel[k.type]}
                  </span>
                  {k.type === 'standard' && (
                    <span className={`text-[10px] uppercase tracking-wide ${k.status === 'mandatory' ? 'text-red-600' : 'text-gray-500'}`}>
                      {k.status === 'mandatory' ? 'MANDATORY' : 'RECOMMENDED'}
                    </span>
                  )}
                  <button type="button" onClick={(e)=>{ e.preventDefault(); e.stopPropagation(); toggleFav(k.id); }} title={isFav ? '取消收藏' : '收藏'} className={`text-base ${isFav ? 'text-amber-500' : 'text-gray-300'} hover:text-amber-500`} aria-pressed={isFav} aria-label="收藏">
                    <i className="ri-star-fill" />
                  </button>
                </div>
                <span className="text-xs text-gray-400">{k.updatedAt}</span>
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-600">
              {renderDetail(k)}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-1">
              {tags.map((t) => (
                <span key={t} className="rounded bg-white px-1.5 py-0.5 text-[11px] text-gray-500 border border-gray-200">#{t}</span>
              ))}
              <button
                type="button"
                onClick={(e)=>{ e.preventDefault(); e.stopPropagation(); handleEditTags(k.id, tags); }}
                className="ml-auto inline-flex items-center gap-1 rounded border border-gray-200 bg-white px-2 py-0.5 text-[11px] text-gray-600 hover:border-indigo-300 hover:text-indigo-600"
                title="编辑标签"
              >
                <i className="ri-edit-2-line"/>编辑标签
              </button>
            </div>
            {cardGroupNames.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {cardGroupNames.map((name) => (
                  <span key={name} className="inline-flex items-center gap-1 rounded border border-indigo-200 bg-indigo-50 px-1.5 py-0.5 text-[11px] text-indigo-700">
                    <i className="ri-folder-2-line" />{name}
                  </span>
                ))}
              </div>
            )}
          </a>
          );
        })}
      </div>
    </section>
  );
}
