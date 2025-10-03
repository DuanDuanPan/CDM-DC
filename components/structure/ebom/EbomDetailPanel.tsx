"use client";

import { useMemo, useState, useRef, useEffect } from 'react';
import type { EbomBaseline, EbomDiffChange, EbomTreeNode } from './types';
import { EBOM_BASELINES } from './data';
import EbomModelViewer from './EbomModelViewer';
import EbomDocList from './EbomDocList';
import CockpitBar from './CockpitBar';
import KpiGrid from './KpiGrid';
import KpiTrendDrawer from './KpiTrendDrawer';
import KpiMultiView from './KpiMultiView';
import VersionStabilityGauge from './VersionStabilityGauge';
import BaselineHealthCard from './BaselineHealthCard';
import XbomSummaryCards from './XbomSummaryCards';
import XbomSummaryDrawer, { SummarySection } from './XbomSummaryDrawer';
import JumpLogPanel from './JumpLogPanel';
import ValidationMatrixDrawer from './ValidationMatrixDrawer';
import KnowledgeCatalogPanel from './KnowledgeCatalogPanel';
import KnowledgeRail from './KnowledgeRail';
import TimelinePanel from './TimelinePanel';
import MessageCenterDrawer from './MessageCenterDrawer';
import RefreshStrategyDrawer from './RefreshStrategyDrawer';
import PageAlerts from './PageAlerts';
import { exportDomToPng, exportDomToPdf } from './exportUtils';
import ThresholdPanel from './ThresholdPanel';
import PresetManager from './PresetManager';
import DynamicThresholdDrawer from './DynamicThresholdDrawer';
import EbomMiniTreePreview from './EbomMiniTreePreview';
import { computeHealth } from './healthUtils';
import type {
  CockpitKpi,
  BaselineHealth as BaselineHealthType,
  XbomSummary as XbomSummaryType,
  KnowledgeCard as KnowledgeCardType,
  KpiMultiViewData,
  XbomSummaryDrawerData,
  JumpLogData,
  ValidationMatrixData,
  RefreshStrategyData,
  MessageCenterData,
  KnowledgeCatalogData,
  TimelineData,
  PageAlert,
} from './cockpitTypes';
// FE-only mock imports
import {
  baselineHealth as baselineHealthMock,
  jumpLog as jumpLogMock,
  knowledgeCatalog as knowledgeCatalogMock,
  knowledgeRelated as knowledgeMock,
  kpiMultiView as kpiMultiViewMock,
  kpis as kpisMock,
  messages as messagesMock,
  refreshStrategy as refreshStrategyMock,
  summaryCombLiner as summaryCombLinerMock,
  summaryFanBlade as summaryFanBladeMock,
  summaryFanDisk as summaryFanDiskMock,
  summaryFuelPump as summaryFuelPumpMock,
  summaryHptBlade as summaryHptBladeMock,
  timelineEvents as timelineEventsMock,
  validationMatrix as validationMatrixMock,
  xbomSummaryDetail as xbomSummaryDetailMock,
} from '../../../docs/mocks';
import kpiConfig from '../../../docs/kpi-threshold-config.json';
import { useEbomCompareState } from './useEbomCompareState';
import { applyDynamicThresholds } from './dynamicThresholds';
import KnowledgeSearchDrawer from './KnowledgeSearchDrawer';

interface Props {
  selectedNodeId: string | null;
  onNavigateBomType?: (bomType: 'simulation' | 'test') => void;
  onSelectNode?: (nodeId: string) => void;
  activeView?: 'structure' | 'cockpit';
}

const badge = (cls: string, icon: string, text: string) => (
  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${cls}`}>
    <i className={`${icon}`}></i>
    {text}
  </span>
);

const valueOrDash = (v?: string | number | null) =>
  v === undefined || v === null || v === "" ? "—" : String(v);

const formatEffectivityText = (eff?: EbomTreeNode["effectivity"]) => {
  if (!eff) return "—";
  const parts: string[] = [];
  if (eff.serialRange) parts.push(`序列 ${eff.serialRange[0]}~${eff.serialRange[1]}`);
  if (eff.dateRange) parts.push(`日期 ${eff.dateRange[0]}~${eff.dateRange[1]}`);
  if (eff.blockPoint) parts.push(`Block ${eff.blockPoint}`);
  return parts.length ? parts.join("；") : "—";
};

const formatSubstitutesText = (
  subs?: EbomTreeNode["substitutes"]
): string => {
  if (!subs?.length) return "—";
  return subs
    .map((s) =>
      [s.partNumber, s.reason, s.priority !== undefined ? `优先级${s.priority}` : undefined]
        .filter(Boolean)
        .join("·")
    )
    .join("，");
};

const flatten = (root: EbomTreeNode): Array<{ id: string; node: EbomTreeNode; path: string[] }> => {
  const out: Array<{ id: string; node: EbomTreeNode; path: string[] }> = [];
  const walk = (n: EbomTreeNode, path: string[]) => {
    out.push({ id: n.id, node: n, path });
    n.children?.forEach((c) => walk(c, [...path, c.name]));
  };
  walk(root, [root.name]);
  return out;
};

const diffBaselines = (a: EbomBaseline, b: EbomBaseline): EbomDiffChange[] => {
  const A = flatten(a.root);
  const B = flatten(b.root);
  const aMap = new Map(A.map((x) => [x.node.id, x]));
  const bMap = new Map(B.map((x) => [x.node.id, x]));
  const changes: EbomDiffChange[] = [];

  // removals and modifications
  for (const [id, aEntry] of aMap) {
    const bEntry = bMap.get(id);
    if (!bEntry) {
      changes.push({ id, partNumber: aEntry.node.partNumber, name: aEntry.node.name, changeType: 'removed', path: aEntry.path });
    } else {
      const fields: EbomDiffChange['fields'] = [];
      if ((aEntry.node.qty ?? 1) !== (bEntry.node.qty ?? 1)) fields.push({ field: '数量', from: valueOrDash(aEntry.node.qty ?? 1), to: valueOrDash(bEntry.node.qty ?? 1) });
      if (aEntry.node.revision !== bEntry.node.revision) fields.push({ field: '版本', from: valueOrDash(aEntry.node.revision), to: valueOrDash(bEntry.node.revision) });
      if ((aEntry.node.uom ?? '') !== (bEntry.node.uom ?? '')) fields.push({ field: '单位', from: valueOrDash(aEntry.node.uom), to: valueOrDash(bEntry.node.uom) });
      if ((aEntry.node.findNo ?? '') !== (bEntry.node.findNo ?? '')) fields.push({ field: '位置号', from: valueOrDash(aEntry.node.findNo), to: valueOrDash(bEntry.node.findNo) });
      if ((aEntry.node.lifecycle ?? '') !== (bEntry.node.lifecycle ?? '')) fields.push({ field: '生命周期', from: valueOrDash(aEntry.node.lifecycle), to: valueOrDash(bEntry.node.lifecycle) });
      const effLeft = formatEffectivityText(aEntry.node.effectivity);
      const effRight = formatEffectivityText(bEntry.node.effectivity);
      if (effLeft !== effRight) fields.push({ field: '效期', from: effLeft, to: effRight });
      const subLeft = formatSubstitutesText(aEntry.node.substitutes);
      const subRight = formatSubstitutesText(bEntry.node.substitutes);
      if (subLeft !== subRight) fields.push({ field: '替代件', from: subLeft, to: subRight });
      if (fields.length) {
        changes.push({ id, partNumber: aEntry.node.partNumber, name: aEntry.node.name, changeType: 'modified', fields, path: aEntry.path });
      }
    }
  }
  // additions
  for (const [id, bEntry] of bMap) {
    if (!aMap.has(id)) {
      changes.push({ id, partNumber: bEntry.node.partNumber, name: bEntry.node.name, changeType: 'added', path: bEntry.path });
    }
  }
  return changes.sort((x, y) => (x.changeType === y.changeType ? x.name.localeCompare(y.name) : x.changeType.localeCompare(y.changeType)));
};

const findById = (root: EbomTreeNode, id: string): EbomTreeNode | null => {
  if (root.id === id) return root;
  for (const c of root.children ?? []) {
    const r = findById(c, id);
    if (r) return r;
  }
  return null;
};

export default function EbomDetailPanel({ selectedNodeId, onNavigateBomType, onSelectNode, activeView = 'structure' }: Props) {
  const [refreshAt, setRefreshAt] = useState<string | null>(null);
  const [windowLabel, setWindowLabel] = useState<'24h'|'7d'|'30d'>('24h');
  const [showReq, setShowReq] = useState(true);
  const [showSim, setShowSim] = useState(true);
  const [showTest, setShowTest] = useState(true);
  const exportRef = useRef<HTMLDivElement | null>(null);
  const [thresholdOpen, setThresholdOpen] = useState(false);
  const [presetOpen, setPresetOpen] = useState(false);
  const [dynamicOpen, setDynamicOpen] = useState(false);
  const [knowledgeSearchOpen, setKnowledgeSearchOpen] = useState(false);
  const [refreshStrategyOpen, setRefreshStrategyOpen] = useState(false);
  const [messageCenterOpen, setMessageCenterOpen] = useState(false);
  const [kpiViewMode, setKpiViewMode] = useState<'cards' | 'analysis'>('cards');
  const [trendKpi, setTrendKpi] = useState<CockpitKpi | null>(null);
  const [activeDynamicKpiId, setActiveDynamicKpiId] = useState<string | null>(null);
  const [knowledgeActiveTag, setKnowledgeActiveTag] = useState<string | null>(null);
  const [knowledgeActiveCollection, setKnowledgeActiveCollection] = useState<string | null>(null);
  const [thresholdOverrides, setThresholdOverrides] = useState<Record<string,{low?:number;high?:number}>>({});
  const [summaryDrawerOpen, setSummaryDrawerOpen] = useState(false);
  const [summarySection, setSummarySection] = useState<SummarySection | null>(null);
  const [jumpLogOpen, setJumpLogOpen] = useState(false);
  const [jumpLogVersion, setJumpLogVersion] = useState(0);
  const [validationOpen, setValidationOpen] = useState(false);
  const presetKeys = useMemo(()=> Object.keys((kpiConfig as any).presets ?? { default: {} }), []);
  const [compareState, setCompareState] = useEbomCompareState();
  const leftId = compareState.leftBaseline;
  const rightId = compareState.rightBaseline;
  const changeFilter = compareState.filter;
  const [thresholdPreset, setThresholdPreset] = useState<string>(()=>{
    try { return window.localStorage.getItem('kpiThresholdPreset') || 'default'; } catch { return 'default'; }
  });
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(`kpiThresholdOverrides:${thresholdPreset}`);
      if (raw) setThresholdOverrides(JSON.parse(raw));
    } catch {}
  }, [thresholdPreset]);
  const filteredKpis = useMemo(() => {
    const src = (kpisMock as any as { kpis: CockpitKpi[] }).kpis;
    const now = Date.now();
    const windowMs = windowLabel === '24h'
      ? 24 * 3600 * 1000
      : windowLabel === '7d'
      ? 7 * 24 * 3600 * 1000
      : 30 * 24 * 3600 * 1000;
    return src.map((k) => {
      const filteredSeries = k.series.filter((p) => new Date(p.t).getTime() >= now - windowMs);
      const series = filteredSeries.length ? filteredSeries : [k.series[k.series.length - 1]];
      return {
        ...k,
        series,
      };
    });
  }, [windowLabel]);
  const mergedKpiConfig: any = useMemo(() => {
    let conf: any = kpiConfig as any;
    try {
      const raw = window.localStorage.getItem('kpiConfigOverrides');
      if (raw) conf = JSON.parse(raw);
    } catch {}
    return conf;
  }, []);

  const defaultThresholdsMap: Record<string,{low?:number;high?:number;rule?:string}> = useMemo(() => {
    const conf: any = mergedKpiConfig;
    const map: Record<string,{low?:number;high?:number;rule?:string}> = {};
    const byId = conf.thresholds || {};
    Object.keys(byId).forEach(id => {
      const preset = byId[id][thresholdPreset] || byId[id]['default'];
      if (preset) map[id] = preset;
    });
    // 回退：从 kpisMock 补齐未配置项
    const src = (kpisMock as any as { kpis: CockpitKpi[] }).kpis;
    src.forEach(k => {
      if (!map[k.id]) map[k.id] = { low: k.threshold?.low, high: k.threshold?.high };
    });
    return map;
  }, [thresholdPreset, mergedKpiConfig]);

  const dynamicFallbacks = useMemo(() => {
    const map: Record<string, { low?: number; high?: number; red?: number }> = {};
    Object.entries(defaultThresholdsMap).forEach(([id, value]) => {
      map[id] = { low: value.low, high: value.high };
    });
    return map;
  }, [defaultThresholdsMap]);

  const kpisWithDynamic = useMemo(() => applyDynamicThresholds(filteredKpis, dynamicFallbacks), [filteredKpis, dynamicFallbacks]);

  const kpisWithOverrides = useMemo(() => kpisWithDynamic.map((k) => {
    const override = thresholdOverrides[k.id];
    if (!override) return k;
    return {
      ...k,
      threshold: {
        ...k.threshold,
        ...(override ?? {}),
      },
    };
  }), [kpisWithDynamic, thresholdOverrides]);

  const healthComputation = useMemo(() => {
    const weightsConf = (mergedKpiConfig as any).presets?.[thresholdPreset]?.weights;
    const factorConf = (mergedKpiConfig as any).healthFactors;
    const fallback = kpisWithOverrides.find((k) => k.id === 'HLT-001') ?? null;
    const result = computeHealth({
      kpis: kpisWithOverrides,
      weights: weightsConf,
      factorConfig: factorConf,
      fallback,
    });
    if (!result) return { kpis: kpisWithOverrides, detail: null };
    const others = kpisWithOverrides.filter((k) => k.id !== result.healthKpi.id);
    return { kpis: [result.healthKpi, ...others], detail: result.detail };
  }, [kpisWithOverrides, mergedKpiConfig, thresholdPreset]);

  const kpisForDisplay = healthComputation.kpis;
  const healthDetail = healthComputation.detail;
  const knowledgeItems = useMemo(() => (knowledgeMock as any as { items: KnowledgeCardType[] }).items ?? [], []);
  const left = useMemo(() => EBOM_BASELINES.find((x) => x.id === leftId)!, [leftId]);
  const right = useMemo(() => EBOM_BASELINES.find((x) => x.id === rightId)!, [rightId]);
  const changes = useMemo(() => diffBaselines(left, right), [left, right]);
  const filteredChanges = useMemo(() => changeFilter==='all' ? changes : changes.filter(c => c.changeType === changeFilter), [changes, changeFilter]);

  const active: EbomTreeNode | null = useMemo(() => {
    if (!selectedNodeId) return null;
    // 优先在右侧基线中寻找，找不到再在左侧
    return findById(right.root, selectedNodeId) || findById(left.root, selectedNodeId);
  }, [selectedNodeId, left, right]);

  const viewMode = activeView;

  const multiViewData = useMemo(() => kpiMultiViewMock as unknown as KpiMultiViewData, []);
  const summaryDetailData = useMemo(() => {
    const detail = xbomSummaryDetailMock as unknown as XbomSummaryDrawerData;
    if (!active?.partNumber) return null;
    if (detail?.summary?.nodeId === active.partNumber) {
      return detail;
    }
    return null;
  }, [active?.partNumber]);
  const baselineHealthData = useMemo(() => baselineHealthMock as unknown as BaselineHealthType, []);
  const summaryData = useMemo(() => {
    const mapping: Record<string, XbomSummaryType> = {
      'EBOM-ROOT/FAN/BLD-GRP/BLD-01': summaryFanBladeMock as unknown as XbomSummaryType,
      'EBOM-ROOT/FAN/DISC': summaryFanDiskMock as unknown as XbomSummaryType,
      'EBOM-ROOT/COMB/LINER': summaryCombLinerMock as unknown as XbomSummaryType,
      'EBOM-ROOT/ACC/PUMP': summaryFuelPumpMock as unknown as XbomSummaryType,
      'EBOM-ROOT/HPT/BLADE': summaryHptBladeMock as unknown as XbomSummaryType,
    };
    const key = active?.partNumber ?? active?.id ?? '';
    return mapping[key] ?? (summaryFanBladeMock as unknown as XbomSummaryType);
  }, [active?.partNumber, active?.id]);
  const kpiMap = useMemo(() => new Map(kpisForDisplay.map((item) => [item.id, item])), [kpisForDisplay]);
  const cockpitGroups = useMemo(() => {
    const pick = (...ids: string[]) => ids.map((id) => kpiMap.get(id)).filter(Boolean) as CockpitKpi[];
    return [
      {
        key: 'coverage',
        title: '完成度与覆盖率',
        description: '研发、仿真、试验的覆盖情况',
        items: pick('DEV-CPL-001', 'SIM-COV-001', 'TST-COV-001'),
      },
      {
        key: 'change',
        title: '变更趋势',
        description: '近 7 天的基线波动',
        items: pick('BL-CHG-001'),
      },
    ].filter((group) => group.items.length > 0);
  }, [kpiMap]);
  const jumpLogData = useMemo(() => jumpLogMock as unknown as JumpLogData, []);
  const validationMatrixData = useMemo(
    () => validationMatrixMock as unknown as ValidationMatrixData,
    []
  );
  const refreshStrategyData = useMemo(
    () => refreshStrategyMock as unknown as RefreshStrategyData,
    []
  );
  const messageCenterData = useMemo(
    () => messagesMock as unknown as MessageCenterData,
    []
  );
  const knowledgeCatalogData = useMemo(
    () => knowledgeCatalogMock as unknown as KnowledgeCatalogData,
    []
  );
  const timelineData = useMemo(() => timelineEventsMock as unknown as TimelineData, []);
  const pageAlerts = useMemo<PageAlert[]>(
    () =>
      (refreshStrategyData?.previewAlerts ?? []).map((alert) => ({
        ...alert,
        actionLabel: '查看策略',
        onAction: () => setRefreshStrategyOpen(true),
      })),
    [refreshStrategyData]
  );
  const unreadMessages = useMemo(
    () => (messageCenterData?.messages ?? []).filter((msg) => msg.status === 'unread').length,
    [messageCenterData]
  );
  const filteredKnowledgeItems = useMemo(() => {
    let items = knowledgeItems;
    if (knowledgeActiveTag) {
      items = items.filter((item) => item.tags.includes(knowledgeActiveTag));
    }
    if (knowledgeActiveCollection && knowledgeCatalogData?.collections?.length) {
      const target = knowledgeCatalogData.collections.find((collection) => collection.id === knowledgeActiveCollection);
      if (target) {
        const set = new Set(target.items);
        items = items.filter((item) => set.has(item.id));
      }
    }
    return items;
  }, [knowledgeItems, knowledgeActiveTag, knowledgeActiveCollection, knowledgeCatalogData]);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
              <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-1 text-purple-700">
                <i className="ri-pencil-ruler-2-line"></i>
                设计BOM（E‑BOM）
              </span>
              <span>左：{left.label}</span>
              <span>右：{right.label}</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">XBOM 面板 · 右侧详情</h3>
            <p className="text-sm text-gray-500">点击左侧 E‑BOM 树节点，查看关联对象的详细信息与基线差异。</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onNavigateBomType?.('simulation')}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:border-blue-300 hover:text-blue-600"
            >
              <i className="ri-computer-line mr-1"></i>跳转 仿真BOM
            </button>
            <button
              type="button"
              onClick={() => onNavigateBomType?.('test')}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:border-rose-300 hover:text-rose-600"
            >
              <i className="ri-test-tube-line mr-1"></i>跳转 试验BOM
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <i className="ri-database-2-line text-gray-500"></i>
            主数据源：本系统
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <i className="ri-shield-keyhole-line text-gray-500"></i>
            保密：仅涉密（不涉出口管制）
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <i className="ri-eye-line text-gray-500"></i>
            能力：浏览 / 对比
          </div>
        </div>
      </section>

      {viewMode === 'structure' && (
        <>
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2 text-sm">
            <i className="ri-git-commit-line text-purple-600"></i>
            <span className="text-gray-700">基线对比</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <select className="rounded-lg border border-gray-300 px-2 py-1.5 text-gray-700"
              value={leftId} onChange={(e) => setCompareState({ leftBaseline: e.target.value })} aria-label="左侧基线">
              {EBOM_BASELINES.map((b) => <option key={b.id} value={b.id}>{b.label}</option>)}
            </select>
            <span className="text-gray-400">对比</span>
            <select className="rounded-lg border border-gray-300 px-2 py-1.5 text-gray-700"
              value={rightId} onChange={(e) => setCompareState({ rightBaseline: e.target.value })} aria-label="右侧基线">
              {EBOM_BASELINES.map((b) => <option key={b.id} value={b.id}>{b.label}</option>)}
            </select>
          </div>
        </div>

        <div className="mt-2 flex items-center gap-2 text-xs text-gray-600">
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700"><i className="ri-add-line"/>新增 {changes.filter(c=>c.changeType==='added').length}</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-rose-700"><i className="ri-subtract-line"/>移除 {changes.filter(c=>c.changeType==='removed').length}</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-amber-700"><i className="ri-edit-line"/>修改 {changes.filter(c=>c.changeType==='modified').length}</span>
          <span className="ml-auto">筛选</span>
          <select value={changeFilter} onChange={(e)=>setCompareState({ filter: e.target.value as any })} className="rounded border border-gray-300 bg-white px-2 py-1 text-xs">
            <option value="all">全部</option>
            <option value="added">仅新增</option>
            <option value="removed">仅移除</option>
            <option value="modified">仅修改</option>
          </select>
          <button type="button" onClick={()=>{
            const rows = [["变更","部件号","名称","差异字段","路径"], ...filteredChanges.map(c => [c.changeType, c.partNumber, c.name, (c.fields?.map(f=>`${f.field}:${f.from}→${f.to}`).join('；')||''), (c as any).path?.join ? (c as any).path.join(' / ') : '' ])];
            const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download='EBOM-基线对比.csv'; a.click(); URL.revokeObjectURL(url);
          }} className="rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 hover:border-blue-300 hover:text-blue-600"><i className="ri-download-2-line"/> 导出CSV</button>
        </div>

        <div className="mt-2 overflow-hidden rounded-xl border border-gray-100">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-gray-600">变更</th>
                <th className="px-4 py-2 text-left font-medium text-gray-600">部件号</th>
                <th className="px-4 py-2 text-left font-medium text-gray-600">名称</th>
                <th className="px-4 py-2 text-left font-medium text-gray-600">差异字段</th>
                <th className="px-4 py-2 text-left font-medium text-gray-600">路径</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {filteredChanges.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-gray-500">无差异</td>
                </tr>
              )}
              {filteredChanges.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/60 cursor-pointer" onClick={()=> onSelectNode?.(c.id)} title="点击定位到左侧树节点">
                  <td className="px-4 py-2 whitespace-nowrap">
                    {c.changeType === 'added' && badge('bg-emerald-50 text-emerald-700', 'ri-add-line', '新增')}
                    {c.changeType === 'removed' && badge('bg-rose-50 text-rose-700', 'ri-subtract-line', '移除')}
                    {c.changeType === 'modified' && badge('bg-amber-50 text-amber-700', 'ri-edit-line', '修改')}
                  </td>
                  <td className="px-4 py-2 text-gray-900">{c.partNumber}</td>
                  <td className="px-4 py-2 text-gray-700">{c.name}</td>
                  <td className="px-4 py-2 text-gray-700">
                    {c.fields?.length ? (
                      <div className="flex flex-wrap gap-1">
                        {c.fields.map((f, i) => (
                          <span key={i} className="inline-flex items-center gap-1 rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs text-amber-700">
                            {f.field}: {f.from} → {f.to}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-xs text-gray-500">{(c as any).path?.join ? (c as any).path.join(' / ') : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <EbomMiniTreePreview
        leftRoot={left.root}
        rightRoot={right.root}
        depth={compareState.depth}
        onDepthChange={(next) => setCompareState({ depth: next })}
        filter={changeFilter}
        selectedId={selectedNodeId ?? null}
        onSelectId={(id) => onSelectNode?.(id)}
      />



      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        {!active && (
          <div className="text-center text-gray-500">
            <i className="ri-node-tree text-4xl"></i>
            <p className="mt-2">请在左侧树选择一个 E‑BOM 节点</p>
            <button
              type="button"
              onClick={() => onSelectNode?.('EBOM-ROOT')}
              className="mt-3 inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:border-blue-300 hover:text-blue-600"
            >
              <i className="ri-lightbulb-line" /> 查看示例节点
            </button>
          </div>
        )}
        {active && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h4 className="text-lg font-semibold text-gray-900">{active.name}</h4>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-600">
                  <span>部件号：{active.partNumber}</span>
                  <span>版本：{active.revision}</span>
                  <span>生命周期：{active.lifecycle}</span>
                  {badge('bg-slate-100 text-slate-700', 'ri-shield-keyhole-line', active.confidentiality)}
                  {active.safetyCritical && badge('bg-rose-100 text-rose-700', 'ri-alert-line', 'SC')}
                  {active.llp && badge('bg-indigo-100 text-indigo-700', 'ri-timer-line', 'LLP')}
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <span className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1">
                  <i className="ri-hashtag"></i> {active.findNo ?? '—'}
                </span>
                <span className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1">
                  <i className="ri-number-1"></i> 数量：{active.qty ?? 1} {active.uom ?? 'EA'}
                </span>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-gray-100 bg-slate-50/70 p-4">
                <div className="text-xs font-medium text-gray-500 mb-2">配置 / 效期</div>
                <div className="space-y-1 text-sm text-gray-700">
                  <div>序列号区间：{active.effectivity?.serialRange ? active.effectivity.serialRange.join(' ~ ') : '—'}</div>
                  <div>时间范围：{active.effectivity?.dateRange ? active.effectivity.dateRange.join(' ~ ') : '—'}</div>
                  <div>Block Point：{active.effectivity?.blockPoint ?? '—'}</div>
                </div>
              </div>
              <div className="rounded-xl border border-gray-100 bg-slate-50/70 p-4">
                <div className="text-xs font-medium text-gray-500 mb-2">替代 / 取代链</div>
                <div className="space-y-2 text-sm text-gray-700">
                  {active.substitutes?.length ? active.substitutes.map((s, i) => (
                    <div key={i} className="flex items-center justify-between gap-2">
                      <span>{s.partNumber}</span>
                      {s.reason && <span className="text-xs text-gray-500">{s.reason}</span>}
                    </div>
                  )) : <div className="text-gray-400">—</div>}
                </div>
              </div>
              <div className="rounded-xl border border-gray-100 bg-slate-50/70 p-4">
                <div className="text-xs font-medium text-gray-500 mb-2">关联链接</div>
                <div className="space-y-2 text-sm text-gray-700">
                  <div className="flex items-center gap-2 text-gray-600">
                    <i className="ri-draft-line"></i>
                    设计文档：{active.links?.designDocId ?? '—'}
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <i className="ri-cube-line"></i>
                    CAD：{active.links?.cadId ?? '—'}
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <i className="ri-computer-line"></i>
                    仿真：{active.links?.simBomRef?.label ?? '—'}
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <i className="ri-test-tube-line"></i>
                    试验：{active.links?.testBomRef?.label ?? '—'}
                  </div>
                </div>
              </div>
            </div>

            {/* 设计参数（按零部件类别可变） */}
            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <div className="mb-2 flex items-center gap-2 text-xs font-medium text-gray-500">
                <i className="ri-equalizer-line" /> 设计参数
                {active.class && <span className="ml-2 rounded bg-purple-50 px-2 py-0.5 text-purple-700">{active.class}</span>}
              </div>
              {active.designParams?.length ? (
                <div className="overflow-hidden rounded-lg border border-gray-100">
                  <table className="min-w-full divide-y divide-gray-100 text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium text-gray-600">参数</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-600">值</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-600">单位</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {active.designParams.map((p, i) => (
                        <tr key={i}>
                          <td className="px-3 py-2 text-gray-700">{p.name}</td>
                          <td className="px-3 py-2 text-gray-900">{p.value}</td>
                          <td className="px-3 py-2 text-gray-500">{p.unit ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-sm text-gray-400">无参数数据</div>
              )}
            </div>

            {/* 轻量化 3D 模型 */}
            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <div className="mb-2 flex items-center gap-2 text-xs font-medium text-gray-500">
                <i className="ri-cube-line" /> 3D 预览（glTF/GLB）
              </div>
              <EbomModelViewer src={active.links?.gltfUrl} poster={active.links?.posterUrl} />
            </div>

            {/* 设计文档清单 */}
            <EbomDocList node={active} />
          </div>
        )}
      </section>
        </>
      )}

      {/* 驾驶舱视图（FE-only Mock） */}
      {viewMode === 'cockpit' && active && (
        <>
          <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-700">
              <span className="inline-flex items-center gap-1 font-medium text-gray-900">
                <i className="ri-dashboard-2-line text-indigo-500" /> 驾驶舱控制
              </span>
              <div className="inline-flex items-center gap-1 text-xs text-gray-500">
                <span>预设</span>
                <select
                  value={thresholdPreset}
                  onChange={(event) => {
                    setThresholdPreset(event.target.value);
                    try {
                      window.localStorage.setItem('kpiThresholdPreset', event.target.value);
                    } catch {}
                  }}
                  className="rounded border border-gray-200 bg-white px-2 py-1 text-sm text-gray-700"
                >
                  {presetKeys.map((key) => (
                    <option key={key} value={key}>
                      {(kpiConfig as any).presets[key]?.label ?? key}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={() => setPresetOpen(true)}
                className="inline-flex items-center gap-1 rounded border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 hover:border-indigo-300 hover:text-indigo-600"
              >
                <i className="ri-database-2-line" /> 管理
              </button>
              <div className="inline-flex items-center gap-1 text-xs text-gray-500">
                <span>时间窗</span>
                <select
                  value={windowLabel}
                  onChange={(event) => setWindowLabel(event.target.value as ('24h' | '7d' | '30d'))}
                  className="rounded border border-gray-200 bg-white px-2 py-1 text-sm text-gray-700"
                >
                  <option value="24h">24 h</option>
                  <option value="7d">7 天</option>
                  <option value="30d">30 天</option>
                </select>
              </div>
              <button
                type="button"
                onClick={() => setRefreshAt(new Date().toISOString())}
                className="inline-flex items-center gap-1 rounded border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:border-blue-300 hover:text-blue-600"
              >
                <i className="ri-refresh-line" /> 刷新
              </button>
              <button
                type="button"
                onClick={() => setThresholdOpen(true)}
                className="inline-flex items-center gap-1 rounded border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:border-indigo-300 hover:text-indigo-600"
              >
                <i className="ri-sliders-line" /> 阈值
              </button>
              <button
                type="button"
                onClick={() => { setActiveDynamicKpiId(null); setDynamicOpen(true); }}
                className="inline-flex items-center gap-1 rounded border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:border-purple-300 hover:text-purple-600"
              >
                <i className="ri-function-line" /> 动态规则
              </button>
              <button
                type="button"
                onClick={() => setRefreshStrategyOpen(true)}
                className="inline-flex items-center gap-1 rounded border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:border-amber-300 hover:text-amber-600"
              >
                <i className="ri-time-line" /> 刷新策略
              </button>
              <button
                type="button"
                onClick={() => setMessageCenterOpen(true)}
                className="relative inline-flex items-center gap-1 rounded border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:border-rose-300 hover:text-rose-600"
              >
                <i className="ri-notification-3-line" /> 消息中心
                {unreadMessages > 0 && (
                  <span className="absolute -top-1 -right-1 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-medium text-white">
                    {unreadMessages}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => exportRef.current && exportDomToPng(exportRef.current, 'EBOM-Cockpit.png')}
                className="inline-flex items-center gap-1 rounded border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:border-emerald-300 hover:text-emerald-600"
              >
                <i className="ri-image-2-line" /> 导出快照
              </button>
              <button
                type="button"
                onClick={() => exportRef.current && exportDomToPdf(exportRef.current, 'EBOM-Cockpit')}
                className="inline-flex items-center gap-1 rounded border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:border-emerald-300 hover:text-emerald-600"
              >
                <i className="ri-file-pdf-2-line" /> 导出 PDF
              </button>
              <button
                type="button"
                onClick={() => setValidationOpen(true)}
                className="inline-flex items-center gap-1 rounded border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:border-indigo-300 hover:text-indigo-600"
              >
                <i className="ri-matrix-line" /> 验证矩阵
              </button>
              <button
                type="button"
                onClick={() => setJumpLogOpen(true)}
                className="inline-flex items-center gap-1 rounded border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:border-slate-300 hover:text-slate-700"
              >
                <i className="ri-history-line" /> 跳转日志
              </button>
            </div>
          </section>

          <div ref={exportRef} className="space-y-4">
            <CockpitBar
              kpis={kpisForDisplay}
              updatedAt={refreshAt ?? undefined}
              windowLabel={windowLabel}
              weights={(mergedKpiConfig as any).presets?.[thresholdPreset]?.weights}
              presetLabel={(mergedKpiConfig as any).presets?.[thresholdPreset]?.label ?? thresholdPreset}
              healthDetail={healthDetail ?? undefined}
            />

            <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="inline-flex items-center gap-1 text-sm font-semibold text-gray-900">
                  <i className="ri-bar-chart-2-line text-indigo-500" /> KPI 视图
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                  <span className="font-medium text-gray-600">视图</span>
                  <button
                    type="button"
                    onClick={() => setKpiViewMode('cards')}
                    className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-sm transition ${
                      kpiViewMode === 'cards'
                        ? 'border-indigo-200 bg-indigo-50 text-indigo-700 shadow-sm'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-indigo-200 hover:text-indigo-600'
                    }`}
                  >
                    <i className="ri-layout-grid-line" /> 指标卡片
                  </button>
                  <button
                    type="button"
                    onClick={() => setKpiViewMode('analysis')}
                    className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-sm transition ${
                      kpiViewMode === 'analysis'
                        ? 'border-indigo-200 bg-indigo-50 text-indigo-700 shadow-sm'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-indigo-200 hover:text-indigo-600'
                    }`}
                  >
                    <i className="ri-line-chart-line" /> 趋势分析
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveDynamicKpiId(null);
                      setDynamicOpen(true);
                    }}
                    className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-sm text-gray-600 transition hover:border-purple-200 hover:text-purple-600"
                  >
                    <i className="ri-sliders-line" /> 阈值总览
                  </button>
                </div>
              </div>

              <div className="mt-4 space-y-4">
                {kpiViewMode === 'cards' ? (
                  <div className="space-y-3">
                    {cockpitGroups.map((group) => (
                      <div key={group.key} className="rounded-xl border border-gray-200 bg-white/90 p-4 shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-gray-900">{group.title}</div>
                            {group.description && (
                              <p className="mt-1 text-xs text-gray-500">{group.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="mt-3">
                          <KpiGrid
                            kpis={group.items}
                            defaultThresholds={defaultThresholdsMap}
                            overrides={thresholdOverrides}
                            onInspect={(target) => setTrendKpi(target)}
                            onOpenThreshold={(target) => {
                              setActiveDynamicKpiId(target.id);
                              setDynamicOpen(true);
                            }}
                          />
                        </div>
                      </div>
                    ))}
                    {!cockpitGroups.length && (
                      <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/80 p-6 text-center text-sm text-gray-500">
                        暂无可显示的 KPI 分组
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="grid gap-3 lg:grid-cols-2">
                      <KpiMultiView data={multiViewData} />
                      <VersionStabilityGauge data={multiViewData} />
                    </div>
                    <div>
                      <BaselineHealthCard data={baselineHealthData} />
                    </div>
                    {healthDetail && (
                      <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4">
                        <div className="text-sm font-medium text-gray-900">健康度构成</div>
                        <ul className="mt-2 grid gap-2 text-xs text-gray-600 sm:grid-cols-2">
                          {healthDetail.factors.map((factor) => (
                            <li key={factor.key} className="flex items-center justify-between gap-2">
                              <span className="flex items-center gap-2">
                                <span className={`inline-flex h-2 w-2 rounded-full ${factor.missing ? 'bg-gray-300' : 'bg-indigo-400'}`}></span>
                                <span>{factor.label}</span>
                              </span>
                              <span className="text-gray-500">
                                {factor.missing ? '无数据' : `${factor.value.toFixed(1)}% · ${(factor.normalizedWeight * 100).toFixed(0)}%`}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                )}
              </div>
            </section>


            <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="inline-flex items-center gap-1 text-sm font-semibold text-gray-900">
                  <i className="ri-node-tree" /> XBOM 摘要
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                  <span className="font-medium text-gray-600">显示</span>
                  <label className="inline-flex items-center gap-1">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300"
                      checked={showReq}
                      onChange={(event) => setShowReq(event.target.checked)}
                    />
                    需求
                  </label>
                  <label className="inline-flex items-center gap-1">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300"
                      checked={showSim}
                      onChange={(event) => setShowSim(event.target.checked)}
                    />
                    仿真
                  </label>
                  <label className="inline-flex items-center gap-1">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300"
                      checked={showTest}
                      onChange={(event) => setShowTest(event.target.checked)}
                    />
                    试验
                  </label>
                </div>
              </div>
              <div className="mt-3">
                <XbomSummaryCards
                  summary={summaryData}
                  overrideUpdatedAt={refreshAt ?? undefined}
                  showReq={showReq}
                  showSim={showSim}
                  showTest={showTest}
                  onOpenDetail={(section) => {
                    setSummarySection(section);
                    setSummaryDrawerOpen(true);
                  }}
                  nodeId={active?.partNumber}
                  baseline={right.label}
                  onJumpLogged={() => {
                    setJumpLogVersion((v) => v + 1);
                    setJumpLogOpen(true);
                  }}
                />
              </div>
            </section>

            <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="inline-flex items-center gap-1 text-sm font-semibold text-gray-900">
                  <i className="ri-brain-line text-indigo-500" /> 知识沉淀
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-gray-600">
                    <i className="ri-archive-drawer-line" /> {filteredKnowledgeItems.length} 条记录
                  </span>
                  <button
                    type="button"
                    onClick={() => setKnowledgeSearchOpen(true)}
                    className="inline-flex items-center gap-1 rounded border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-sm text-indigo-700 hover:border-indigo-300 hover:text-indigo-800"
                  >
                    <i className="ri-search-eye-line" /> 智能检索
                  </button>
                </div>
              </div>
              {!!pageAlerts.length && (
                <div className="mt-3">
                  <PageAlerts alerts={pageAlerts} />
                </div>
              )}
              <div className="mt-4 grid gap-4 lg:grid-cols-5">
                <div className="lg:col-span-2">
                  <KnowledgeCatalogPanel
                    data={knowledgeCatalogData}
                    activeTag={knowledgeActiveTag}
                    onSelectTag={setKnowledgeActiveTag}
                    activeCollection={knowledgeActiveCollection}
                    onSelectCollection={setKnowledgeActiveCollection}
                  />
                </div>
                <div className="space-y-3 lg:col-span-3">
                  <KnowledgeRail items={filteredKnowledgeItems} />
                </div>
              </div>
            </section>

            {timelineData && (
              <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="inline-flex items-center gap-1 text-sm font-semibold text-gray-900">
                  <i className="ri-time-line text-indigo-500" /> 协同时间线
                </div>
                <div className="mt-3">
                  <TimelinePanel data={timelineData} />
                </div>
              </section>
            )}
          </div>
          <ThresholdPanel
            kpis={kpisForDisplay}
            open={thresholdOpen}
            onClose={()=>setThresholdOpen(false)}
            initialOverrides={thresholdOverrides}
            defaultThresholds={defaultThresholdsMap}
            presetLabel={(kpiConfig as any).presets?.[thresholdPreset]?.label ?? thresholdPreset}
            onApply={(ov)=>{ setThresholdOverrides(ov); try{ window.localStorage.setItem(`kpiThresholdOverrides:${thresholdPreset}`, JSON.stringify(ov)); }catch{}; setThresholdOpen(false); }}
          />
          <DynamicThresholdDrawer
            open={dynamicOpen}
            onClose={() => {
              setDynamicOpen(false);
              setActiveDynamicKpiId(null);
            }}
            kpis={kpisWithOverrides}
            initialKpiId={activeDynamicKpiId}
          />
          <KpiTrendDrawer
            open={!!trendKpi}
            kpi={trendKpi}
            onClose={() => setTrendKpi(null)}
            onOpenThreshold={(target) => {
              setTrendKpi(null);
              setActiveDynamicKpiId(target.id);
              setDynamicOpen(true);
            }}
          />
          <PresetManager
            open={presetOpen}
            onClose={()=>setPresetOpen(false)}
            currentPreset={thresholdPreset}
            baseConfig={mergedKpiConfig}
            onApply={(newPreset)=>{ if (newPreset) { setThresholdPreset(newPreset); try{ window.localStorage.setItem('kpiThresholdPreset', newPreset);}catch{} } setPresetOpen(false); }}
          />
          <KnowledgeSearchDrawer
            open={knowledgeSearchOpen}
            onClose={() => setKnowledgeSearchOpen(false)}
            defaultQuery={active?.name ?? selectedNodeId ?? ''}
            defaultTags={[
              active?.class,
              active?.partNumber,
              active?.links?.designDocId,
            ].filter(Boolean) as string[]}
          />
          <XbomSummaryDrawer
            open={summaryDrawerOpen}
            section={summarySection}
            data={summaryDetailData}
            onClose={() => {
              setSummaryDrawerOpen(false);
              setSummarySection(null);
            }}
          />
          <ValidationMatrixDrawer
            open={validationOpen}
            onClose={() => setValidationOpen(false)}
            data={validationMatrixData}
          />
          <JumpLogPanel
            open={jumpLogOpen}
            data={jumpLogData}
            version={jumpLogVersion}
            onClose={() => setJumpLogOpen(false)}
          />
          <RefreshStrategyDrawer
            open={refreshStrategyOpen}
            onClose={() => setRefreshStrategyOpen(false)}
            data={refreshStrategyData}
          />
          <MessageCenterDrawer
            open={messageCenterOpen}
            onClose={() => setMessageCenterOpen(false)}
            data={messageCenterData}
          />
        </>
      )}

    </div>
  );
}
