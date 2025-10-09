"use client";

import { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import type {
  EbomBaseline,
  EbomDiffChange,
  EbomTreeNode,
  EbomParameterDeck,
  EbomParameterGroup,
  EbomParameterDetail,
  EbomParameterStatus,
  EbomParameterDimension,
  EbomApprovalStatus,
} from './types';
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
  ReviewKnowledgeCard,
  KpiMultiViewData,
  XbomSummaryDrawerData,
  JumpLogData,
  ValidationMatrixData,
  RefreshStrategyData,
  MessageCenterData,
  TimelineData,
  PageAlert,
} from './cockpitTypes';
// FE-only mock imports
import {
  baselineHealth as baselineHealthMock,
  jumpLog as jumpLogMock,
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
  parameterGroups as parameterGroupsMock,
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
  onNavigateRequirement?: (payload: { requirementIds: string[]; sourceNodeId?: string | null; sourceNodeName?: string | null }) => void;
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

const dimensionLabels: Record<EbomParameterDimension, string> = {
  '0D': '标量',
  '1D': '曲线',
  '2D': '二维',
  matrix: '矩阵',
};

const parameterStatusBadge = (status?: EbomParameterStatus) => {
  if (!status) return null;
  const token = PARAMETER_STATUS_TOKENS[status];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] ${token.className}`}>
      <i className={token.icon}></i> {token.label}
    </span>
  );
};

const parameterTrendBadge = (trend?: 'up' | 'down' | 'flat') => {
  if (!trend) return null;
  if (trend === 'up') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[11px] text-rose-700">
        <i className="ri-arrow-up-line" /> 上升
      </span>
    );
  }
  if (trend === 'down') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] text-emerald-700">
        <i className="ri-arrow-down-line" /> 下降
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">
      <i className="ri-arrow-right-line" /> 持平
    </span>
  );
};

const approvalStatusTokens: Record<EbomApprovalStatus, { label: string; className: string; icon: string }> = {
  pending: {
    label: '待审批',
    className: 'border-amber-200 bg-amber-50 text-amber-700',
    icon: 'ri-time-line',
  },
  approved: {
    label: '已通过',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    icon: 'ri-checkbox-circle-line',
  },
  rejected: {
    label: '驳回',
    className: 'border-rose-200 bg-rose-50 text-rose-700',
    icon: 'ri-close-circle-line',
  },
  delegated: {
    label: '转签',
    className: 'border-indigo-200 bg-indigo-50 text-indigo-700',
    icon: 'ri-repeat-line',
  },
};

type StatusToken = {
  label: string;
  icon: string;
  className: string;
  description?: string;
};

const PARAMETER_STATUS_TOKENS: Record<EbomParameterStatus, StatusToken> = {
  ok: { label: '达标', icon: 'ri-checkbox-circle-line', className: 'bg-emerald-50 text-emerald-700' },
  watch: { label: '关注', icon: 'ri-error-warning-line', className: 'bg-amber-50 text-amber-700' },
  risk: { label: '预警', icon: 'ri-alarm-warning-line', className: 'bg-rose-50 text-rose-700' },
};

const DOCUMENT_STATUS_TOKENS: Record<'approved' | 'in-review' | 'pending' | 'missing', StatusToken> = {
  approved: {
    label: '已批准',
    icon: 'ri-checkbox-circle-line',
    className: 'bg-emerald-50 text-emerald-700',
    description: '审批完成并归档',
  },
  'in-review': {
    label: '评审中',
    icon: 'ri-timer-line',
    className: 'bg-amber-50 text-amber-700',
    description: '等待评审或签批',
  },
  pending: {
    label: '待上传',
    icon: 'ri-time-line',
    className: 'bg-slate-100 text-slate-600',
    description: '尚未补齐或需整理',
  },
  missing: {
    label: '缺失',
    icon: 'ri-alert-line',
    className: 'bg-rose-50 text-rose-700',
    description: '流程阻塞或未提交',
  },
};

const sourceTypeIcon: Record<string, string> = {
  仿真: 'ri-computer-line',
  试验: 'ri-test-tube-line',
  文档: 'ri-book-2-line',
  推导: 'ri-function-line',
  供应商: 'ri-building-4-line',
  运行数据: 'ri-bar-chart-line',
};

const sourceTypeToBom: Record<string, 'simulation' | 'test' | null> = {
  仿真: 'simulation',
  试验: 'test',
  文档: null,
  推导: null,
  供应商: null,
  运行数据: null,
};

type ParameterWithGroup = {
  groupId: string;
  groupTitle: string;
  detail: EbomParameterDetail;
};

type ParameterAlertEntry = ParameterWithGroup & { severity: 'risk' | 'watch' };

const inlineAccent: Record<string, string> = {
  indigo: 'border-indigo-200 bg-indigo-50 text-indigo-700 hover:border-indigo-300',
  purple: 'border-purple-200 bg-purple-50 text-purple-700 hover:border-purple-300',
  amber: 'border-amber-200 bg-amber-50 text-amber-700 hover:border-amber-300',
  rose: 'border-rose-200 bg-rose-50 text-rose-700 hover:border-rose-300',
  slate: 'border-gray-200 bg-white text-gray-600 hover:border-slate-300 hover:text-slate-700',
};

const floatingAccent: Record<string, string> = {
  indigo: 'bg-indigo-600 text-white hover:bg-indigo-500',
  purple: 'bg-purple-600 text-white hover:bg-purple-500',
  amber: 'bg-amber-500 text-white hover:bg-amber-400',
  rose: 'bg-rose-500 text-white hover:bg-rose-400',
  slate: 'bg-slate-600 text-white hover:bg-slate-500',
};

const accentText: Record<string, string> = {
  indigo: 'text-indigo-600',
  purple: 'text-purple-600',
  amber: 'text-amber-500',
  rose: 'text-rose-500',
  slate: 'text-slate-600',
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

export default function EbomDetailPanel({ selectedNodeId, onNavigateBomType, onSelectNode, activeView = 'structure', onNavigateRequirement }: Props) {
  const [refreshAt, setRefreshAt] = useState<string | null>(null);
  const [windowLabel, setWindowLabel] = useState<'24h'|'7d'|'30d'>('24h');
  const [showReq, setShowReq] = useState(true);
  const [showSim, setShowSim] = useState(true);
  const [showTest, setShowTest] = useState(true);
  const exportRef = useRef<HTMLDivElement | null>(null);
  const sourcesListRef = useRef<HTMLDivElement | null>(null);
  const [thresholdOpen, setThresholdOpen] = useState(false);
  const [presetOpen, setPresetOpen] = useState(false);
  const [dynamicOpen, setDynamicOpen] = useState(false);
  const [knowledgeSearchOpen, setKnowledgeSearchOpen] = useState(false);
  const [refreshStrategyOpen, setRefreshStrategyOpen] = useState(false);
  const [messageCenterOpen, setMessageCenterOpen] = useState(false);
  const [kpiViewMode, setKpiViewMode] = useState<'cards' | 'analysis'>('cards');
  const [trendKpi, setTrendKpi] = useState<CockpitKpi | null>(null);
  const [activeDynamicKpiId, setActiveDynamicKpiId] = useState<string | null>(null);
  const [thresholdOverrides, setThresholdOverrides] = useState<Record<string,{low?:number;high?:number}>>({});
  const [summaryDrawerOpen, setSummaryDrawerOpen] = useState(false);
  const [summarySection, setSummarySection] = useState<SummarySection | null>(null);
  const [jumpLogOpen, setJumpLogOpen] = useState(false);
  const [jumpLogVersion, setJumpLogVersion] = useState(0);
  const [validationOpen, setValidationOpen] = useState(false);
  const [selectedParameterGroupId, setSelectedParameterGroupId] = useState<string | null>(null);
  const [selectedParameterId, setSelectedParameterId] = useState<string | null>(null);
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

  const parameterDeck = useMemo<EbomParameterDeck | null>(() => {
    if (!active) return null;
    const key = active.parameterDeckId ?? active.id;
    const mockDeck = (parameterGroupsMock as Record<string, EbomParameterDeck>)[key];
    if (mockDeck) {
      return mockDeck;
    }
    if (active.parameterGroups?.length) {
      return {
        summary: active.parameterGroups.length > 1 ? '节点自带参数分组' : undefined,
        groups: active.parameterGroups,
      };
    }
    if (active.designParams?.length) {
      return {
        summary: '节点内置设计参数（基础 Mock）',
        groups: [
          {
            id: `${active.id}-legacy`,
            title: '设计参数',
            caption: '缺少分组配置时的默认视图',
            parameters: active.designParams.map((item, index) => ({
              id: `${active.id}-legacy-${index}`,
              name: item.name,
              value: item.value,
              unit: item.unit,
              status: item.status,
              dimension: '0D' as EbomParameterDimension,
            })),
          } satisfies EbomParameterGroup,
        ],
      } satisfies EbomParameterDeck;
    }
    return null;
  }, [active]);

  useEffect(() => {
    if (!parameterDeck || parameterDeck.groups.length === 0) {
      setSelectedParameterGroupId((prev) => (prev === null ? prev : null));
      setSelectedParameterId((prev) => (prev === null ? prev : null));
      return;
    }
    setSelectedParameterGroupId((prev) => {
      if (prev && parameterDeck.groups.some((group) => group.id === prev)) {
        return prev;
      }
      return parameterDeck.groups[0].id;
    });
  }, [parameterDeck]);

  useEffect(() => {
    if (!parameterDeck || parameterDeck.groups.length === 0) {
      setSelectedParameterId((prev) => (prev === null ? prev : null));
      return;
    }
    const fallbackGroup = (selectedParameterGroupId
      ? parameterDeck.groups.find((group) => group.id === selectedParameterGroupId)
      : null) ?? parameterDeck.groups[0];
    if (!fallbackGroup) {
      setSelectedParameterId((prev) => (prev === null ? prev : null));
      return;
    }
    setSelectedParameterId((prev) => {
      if (prev && fallbackGroup.parameters.some((param) => param.id === prev)) {
        return prev;
      }
      return fallbackGroup.parameters[0]?.id ?? null;
    });
  }, [parameterDeck, selectedParameterGroupId]);

  const selectedParameterGroup = useMemo<EbomParameterGroup | null>(() => {
    if (!parameterDeck || parameterDeck.groups.length === 0) return null;
    if (selectedParameterGroupId) {
      const found = parameterDeck.groups.find((group) => group.id === selectedParameterGroupId);
      if (found) return found;
    }
    return parameterDeck.groups[0] ?? null;
  }, [parameterDeck, selectedParameterGroupId]);

  const selectedParameter = useMemo<EbomParameterDetail | null>(() => {
    if (!selectedParameterGroup || selectedParameterGroup.parameters.length === 0) return null;
    if (selectedParameterId) {
      const found = selectedParameterGroup.parameters.find((param) => param.id === selectedParameterId);
      if (found) return found;
    }
    return selectedParameterGroup.parameters[0] ?? null;
  }, [selectedParameterGroup, selectedParameterId]);

  const totalParameterCount = useMemo(() => {
    if (!parameterDeck) return 0;
    return parameterDeck.groups.reduce((acc, group) => acc + group.parameters.length, 0);
  }, [parameterDeck]);

  const parameterFlatList = useMemo<ParameterWithGroup[]>(() => {
    if (!parameterDeck) return [];
    return parameterDeck.groups.flatMap((group) =>
      group.parameters.map((detail) => ({ groupId: group.id, groupTitle: group.title, detail }))
    );
  }, [parameterDeck]);

  const parameterStatusSummary = useMemo(() => {
    const summary = {
      total: parameterFlatList.length,
      risk: 0,
      watch: 0,
      ok: 0,
      neutral: 0,
      alerts: [] as ParameterAlertEntry[],
    };
    parameterFlatList.forEach((entry) => {
      const status = entry.detail.status;
      if (status === 'risk') {
        summary.risk += 1;
        summary.alerts.push({ ...entry, severity: 'risk' });
      } else if (status === 'watch') {
        summary.watch += 1;
        summary.alerts.push({ ...entry, severity: 'watch' });
      } else if (status === 'ok') {
        summary.ok += 1;
      } else {
        summary.neutral += 1;
      }
    });
    summary.alerts.sort((a, b) => {
      if (a.severity !== b.severity) {
        return a.severity === 'risk' ? -1 : 1;
      }
      const aTime = a.detail.lastUpdated ? new Date(a.detail.lastUpdated).getTime() : 0;
      const bTime = b.detail.lastUpdated ? new Date(b.detail.lastUpdated).getTime() : 0;
      return bTime - aTime;
    });
    return summary;
  }, [parameterFlatList]);

  const reviewMemoItems = useMemo(() =>
    (knowledgeItems.filter((item) => item.type === 'review').slice(0, 3) as ReviewKnowledgeCard[]),
  [knowledgeItems]);

  const riskExperience = useMemo(() => knowledgeItems.find((item) => item.type === 'experience'), [knowledgeItems]);

  const scrollToSources = useCallback(() => {
    if (!sourcesListRef.current) return;
    sourcesListRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [sourcesListRef]);

  const handleNavigateFromSource = useCallback(
    (target: 'simulation' | 'test') => {
      onNavigateBomType?.(target);
    },
    [onNavigateBomType]
  );

  const handleFocusParameter = useCallback(
    (entry: ParameterAlertEntry) => {
      setSelectedParameterGroupId(entry.groupId);
      setSelectedParameterId(entry.detail.id);
      if (typeof window !== 'undefined') {
        window.requestAnimationFrame(() => {
          const el = document.getElementById(`param-card-${entry.detail.id}`);
          if (el instanceof HTMLElement) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.focus({ preventScroll: true });
          }
        });
      }
    },
    [setSelectedParameterGroupId, setSelectedParameterId]
  );

  const parameterSourceStats = useMemo(() => {
    if (!selectedParameter?.sources?.length) return null;
    const byType: Record<string, number> = {};
    selectedParameter.sources.forEach((source) => {
      byType[source.type] = (byType[source.type] ?? 0) + 1;
    });
    const total = selectedParameter.sources.length;
    return { total, byType };
  }, [selectedParameter]);

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
  const memoAlerts = useMemo(() => pageAlerts.slice(0, 2), [pageAlerts]);
  const unreadMessages = useMemo(
    () => (messageCenterData?.messages ?? []).filter((msg) => msg.status === 'unread').length,
    [messageCenterData]
  );

  const quickActions = useMemo(() => [
    {
      id: 'threshold',
      label: '阈值面板',
      short: '阈值',
      icon: 'ri-equalizer-line',
      accent: 'indigo',
      onClick: () => setThresholdOpen(true),
    },
    {
      id: 'dynamic',
      label: '动态规则',
      short: '规则',
      icon: 'ri-function-line',
      accent: 'purple',
      onClick: () => { setActiveDynamicKpiId(null); setDynamicOpen(true); },
    },
    {
      id: 'strategy',
      label: '刷新策略',
      short: '刷新',
      icon: 'ri-time-line',
      accent: 'amber',
      onClick: () => setRefreshStrategyOpen(true),
    },
    {
      id: 'messages',
      label: '消息中心',
      short: '消息',
      icon: 'ri-notification-3-line',
      accent: 'rose',
      onClick: () => setMessageCenterOpen(true),
      badge: unreadMessages,
    },
    {
      id: 'matrix',
      label: '验证矩阵',
      short: '矩阵',
      icon: 'ri-layout-grid-line',
      accent: 'slate',
      onClick: () => setValidationOpen(true),
    },
  ], [unreadMessages, setThresholdOpen, setMessageCenterOpen]);
  const filteredKnowledgeItems = useMemo(() => knowledgeItems, [knowledgeItems]);

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
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-600">
              <span className="font-medium text-gray-500">常用操作</span>
              {quickActions.map((action) => (
                <button
                  key={`intro-action-${action.id}`}
                  type="button"
                  onClick={action.onClick}
                  className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium ${inlineAccent[action.accent]}`}
                >
                  <i className={action.icon}></i> {action.label}
                  {action.badge ? (
                    <span className="ml-1 inline-flex min-w-[1.125rem] justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
                      {action.badge}
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setValidationOpen(true)}
                className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-600 hover:border-indigo-200 hover:text-indigo-600 sm:hidden"
              >
                <i className="ri-layout-grid-line"></i> 验证矩阵
              </button>
            </div>
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
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6">
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

            {active.responsibility && (
              <div className="rounded-xl border border-gray-100 bg-slate-50/70 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-gray-700">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 font-medium text-gray-800">
                      <i className="ri-team-line text-indigo-500"></i> {active.responsibility.team}
                    </span>
                    {active.responsibility.owner && (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 text-gray-700">
                        <i className="ri-user-star-line text-indigo-500"></i> 责任人 {active.responsibility.owner}
                      </span>
                    )}
                    {active.responsibility.contact && (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 text-gray-700">
                        <i className="ri-mail-line text-indigo-500"></i> {active.responsibility.contact}
                      </span>
                    )}
                  </div>
                  {active.responsibility.decision && (
                    <div className="max-w-md text-xs text-gray-500">
                      <div className="font-medium text-gray-700">
                        <i className="ri-chat-4-line text-indigo-500"></i> 最新决策：{active.responsibility.decision.summary}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
                        <span><i className="ri-user-line"></i> {active.responsibility.decision.by}</span>
                        <span><i className="ri-time-line"></i> {active.responsibility.decision.updatedAt}</span>
                        {active.responsibility.decision.nextStep && (
                          <span><i className="ri-compass-3-line"></i> 下一步：{active.responsibility.decision.nextStep}</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                  {active.responsibility.chain.map((step) => (
                    <span
                      key={step.id}
                      className={`inline-flex items-center gap-1 rounded-xl border px-2.5 py-1 font-medium ${approvalStatusTokens[step.status].className}`}
                    >
                      <i className={approvalStatusTokens[step.status].icon}></i>
                      {step.name} · {step.role}
                      {step.updatedAt && <span className="ml-1 text-[11px] text-gray-600/80">{step.updatedAt}</span>}
                    </span>
                  ))}
                </div>
              </div>
            )}

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
              {activeView !== 'structure' && (
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
              )}
            </div>

            {parameterDeck ? (
              <section className="rounded-2xl border border-gray-200 bg-white p-4">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
                    <i className="ri-equalizer-line" /> 设计参数脊梁
                    {active.class && (
                      <span className="inline-flex items-center gap-1 rounded bg-purple-50 px-2 py-0.5 text-[11px] text-purple-700">
                        <i className="ri-stackshare-line" /> {active.class}
                      </span>
                    )}
                    {totalParameterCount > 0 && (
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">共 {totalParameterCount} 项</span>
                    )}
                  </div>
                  {parameterDeck.summary && <p className="text-sm text-gray-600">{parameterDeck.summary}</p>}
                </div>
                {parameterDeck.groups.length > 1 && (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {parameterDeck.groups.map((group) => {
                      const isActiveGroup = selectedParameterGroup?.id === group.id;
                      return (
                        <button
                          key={group.id}
                          type="button"
                          onClick={() => setSelectedParameterGroupId(group.id)}
                          className={`inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-sm transition ${
                            isActiveGroup
                              ? 'border-indigo-300 bg-indigo-50 text-indigo-700 shadow-sm'
                              : 'border-gray-200 bg-white text-gray-600 hover:border-indigo-200 hover:text-indigo-600'
                          }`}
                          aria-pressed={isActiveGroup}
                        >
                          <span className="font-medium">{group.title}</span>
                          <span className="text-[11px] text-gray-500">{group.parameters.length}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
                {parameterStatusSummary.total > 0 && (
                  <div className="mt-4 overflow-hidden rounded-2xl border border-rose-100 bg-white shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                      <div className="inline-flex items-center gap-2 text-sm font-semibold text-gray-900">
                        <i className="ri-alarm-warning-line text-rose-500" /> 参数告警总览
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-rose-700">
                          <i className="ri-error-warning-line" /> 红灯 {parameterStatusSummary.risk}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-amber-700">
                          <i className="ri-alert-line" /> 黄灯 {parameterStatusSummary.watch}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700">
                          <i className="ri-shield-check-line" /> 稳定 {Math.max(parameterStatusSummary.total - parameterStatusSummary.risk - parameterStatusSummary.watch, 0)}
                        </span>
                        {parameterStatusSummary.alerts.length > 0 && (
                          <button
                            type="button"
                            onClick={() => handleFocusParameter(parameterStatusSummary.alerts[0])}
                            className="inline-flex items-center gap-1 rounded border border-rose-200 bg-rose-50 px-2 py-0.5 text-[11px] text-rose-700 hover:border-rose-300"
                          >
                            <i className="ri-focus-2-line" /> 定位首个风险
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="flex h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      {parameterStatusSummary.risk > 0 && (
                        <div
                          className="bg-rose-500/80"
                          style={{ width: `${Math.min((parameterStatusSummary.risk / parameterStatusSummary.total) * 100, 100)}%` }}
                        />
                      )}
                      {parameterStatusSummary.watch > 0 && (
                        <div
                          className="bg-amber-400/80"
                          style={{ width: `${Math.min((parameterStatusSummary.watch / parameterStatusSummary.total) * 100, 100)}%` }}
                        />
                      )}
                      <div className="flex-1 bg-emerald-400/60" style={{ minWidth: '5%' }} />
                    </div>
                    {parameterStatusSummary.alerts.length > 0 && (
                      <div className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-rose-700">
                          {parameterStatusSummary.alerts.slice(0, 3).map((entry) => (
                            <button
                              key={entry.detail.id}
                              type="button"
                              onClick={() => handleFocusParameter(entry)}
                              className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 transition hover:border-rose-300"
                            >
                              <i className="ri-alert-line" /> {entry.detail.name}
                            </button>
                          ))}
                          {parameterStatusSummary.alerts.length > 3 && (
                            <span className="text-rose-600/70">+{parameterStatusSummary.alerts.length - 3}</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {selectedParameterGroup ? (
                  <>
                    {selectedParameterGroup.caption && (
                      <p className="mt-3 text-sm text-gray-600">{selectedParameterGroup.caption}</p>
                    )}
                    {selectedParameterGroup.focus && (
                      <p className="mt-1 text-xs text-indigo-600">
                        <i className="ri-focus-2-line" /> {selectedParameterGroup.focus}
                      </p>
                    )}
                    <div className="mt-4 flex items-center gap-2 text-xs font-medium text-gray-500">
                      <i className="ri-list-check"></i> 参数清单
                    </div>
                    {selectedParameterGroup.parameters.length > 0 ? (
                      <div className="mt-2 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {selectedParameterGroup.parameters.map((param) => {
                          const isActiveParameter = selectedParameter?.id === param.id;
                          return (
                            <button
                              key={param.id}
                              id={`param-card-${param.id}`}
                              type="button"
                              onClick={() => setSelectedParameterId(param.id)}
                              className={`flex h-full flex-col rounded-xl border p-3 text-left transition focus:outline-none focus:ring-2 focus:ring-indigo-200 ${
                                isActiveParameter
                                  ? 'border-indigo-300 bg-indigo-50/70 shadow-sm'
                                  : 'border-gray-100 bg-slate-50/70 hover:border-indigo-200 hover:bg-white'
                              }`}
                              aria-pressed={isActiveParameter}
                              data-status={param.status ?? 'none'}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="flex-1 text-sm font-semibold text-gray-800">{param.name}</span>
                                {parameterStatusBadge(param.status)}
                              </div>
                              <div className="mt-1 text-lg font-semibold text-gray-900">
                                {param.value}
                                {param.unit && <span className="ml-1 text-sm text-gray-500">{param.unit}</span>}
                              </div>
                              <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
                                <span className="inline-flex items-center gap-1 rounded bg-white px-2 py-0.5 shadow-sm">
                                  <i className="ri-shape-line" /> {dimensionLabels[param.dimension] ?? param.dimension}
                                </span>
                                {parameterTrendBadge(param.trend)}
                                {param.owner && (
                                  <span className="inline-flex items-center gap-1">
                                    <i className="ri-user-line" /> {param.owner}
                                  </span>
                                )}
                                {param.tags?.slice(0, 2).map((tag) => (
                                  <span key={tag} className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5">
                                    <i className="ri-price-tag-3-line" /> {tag}
                                  </span>
                                ))}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="mt-4 rounded-xl border border-dashed border-gray-200 py-10 text-center text-sm text-gray-500">
                        此分组暂无参数数据。
                      </div>
                    )}
                    {selectedParameter && (
                      <div className="mt-5 rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4 shadow-sm">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2 text-sm font-semibold text-indigo-700">
                              <i className="ri-information-line" /> 参数详情
                            </div>
                            <h5 className="mt-1 text-lg font-semibold text-gray-900">{selectedParameter.name}</h5>
                            {selectedParameter.description && (
                              <p className="mt-2 text-sm text-gray-700">{selectedParameter.description}</p>
                            )}
                            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                              {selectedParameter.target && (
                                <span className="inline-flex items-center gap-1 rounded bg-white px-2 py-0.5">
                                  <i className="ri-flag-line" /> 目标 {selectedParameter.target}
                                </span>
                              )}
                              {selectedParameter.limit && (
                                <span className="inline-flex items-center gap-1 rounded bg-white px-2 py-0.5">
                                  <i className="ri-error-warning-line" /> 限值 {selectedParameter.limit}
                                </span>
                              )}
                              {selectedParameter.baselineContribution && (
                                <span className="inline-flex items-center gap-1 rounded bg-white px-2 py-0.5">
                                  <i className="ri-line-chart-line" /> {selectedParameter.baselineContribution}
                                </span>
                              )}
                              {selectedParameter.lastUpdated && (
                                <span className="inline-flex items-center gap-1">
                                  <i className="ri-time-line" /> 更新 {selectedParameter.lastUpdated}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2 text-right text-sm text-gray-600">
                            <div className="text-2xl font-semibold text-gray-900">
                              {selectedParameter.value}
                              {selectedParameter.unit && <span className="ml-1 text-base text-gray-500">{selectedParameter.unit}</span>}
                            </div>
                            <div className="flex flex-wrap justify-end gap-2 text-xs text-gray-500">
                              <span className="inline-flex items-center gap-1 rounded bg-white px-2 py-0.5 shadow-sm">
                                <i className="ri-shape-line" /> {dimensionLabels[selectedParameter.dimension] ?? selectedParameter.dimension}
                              </span>
                              {parameterStatusBadge(selectedParameter.status)}
                              {parameterTrendBadge(selectedParameter.trend)}
                            </div>
                          </div>
                        </div>
                        {parameterSourceStats && (
                          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-600">
                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 font-medium text-gray-700">
                              <i className="ri-database-2-line" /> 来源 {parameterSourceStats.total}
                            </span>
                            {Object.entries(parameterSourceStats.byType).map(([type, count]) => {
                              const target = sourceTypeToBom[type];
                              const icon = sourceTypeIcon[type] ?? 'ri-file-list-2-line';
                              if (!target) {
                                return (
                                  <span key={type} className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2 py-0.5 shadow-sm">
                                    <i className={icon}></i> {type} {count}
                                  </span>
                                );
                              }
                              return (
                                <button
                                  key={type}
                                  type="button"
                                  onClick={() => handleNavigateFromSource(target)}
                                  className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-indigo-700 hover:border-indigo-300"
                                >
                                  <i className={icon}></i> {type} {count}
                                  <i className="ri-arrow-right-line"></i>
                                </button>
                              );
                            })}
                            <button
                              type="button"
                              onClick={scrollToSources}
                              className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2 py-0.5 text-gray-600 hover:border-indigo-200 hover:text-indigo-600"
                            >
                              <i className="ri-arrow-down-line" /> 查看来源列表
                            </button>
                          </div>
                        )}
                        {selectedParameter.tags && selectedParameter.tags.length > 0 && (
                          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-600">
                            {selectedParameter.tags.map((tag) => (
                              <span key={tag} className="inline-flex items-center gap-1 rounded bg-white px-2 py-0.5 shadow-sm">
                                <i className="ri-price-tag-3-line" /> {tag}
                              </span>
                            ))}
                          </div>
                        )}
                        {selectedParameter.assumption && (
                          <div className="mt-3 rounded-lg border border-indigo-200 bg-white/70 p-3 text-sm text-gray-700">
                            <div className="mb-1 text-xs font-medium text-indigo-600">
                              <i className="ri-mind-map"></i> 设计假设
                            </div>
                            {selectedParameter.assumption}
                          </div>
                        )}
                        {selectedParameter.verification && selectedParameter.verification.length > 0 && (
                          <div className="mt-3 rounded-lg border border-indigo-200 bg-white/70 p-3 text-sm text-gray-700">
                            <div className="mb-1 text-xs font-medium text-indigo-600">
                              <i className="ri-shield-check-line"></i> 验证与行动
                            </div>
                            <ul className="list-disc pl-5">
                              {selectedParameter.verification.map((item) => (
                                <li key={item} className="text-sm text-gray-700">{item}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {selectedParameter.sparkline && selectedParameter.sparkline.length > 0 && (
                          <div className="mt-3">
                            <div className="text-xs font-medium text-gray-500">样点（Mock）</div>
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-gray-600">
                              {selectedParameter.sparkline.map((point) => (
                                <span key={point.label} className="inline-flex items-center gap-1 rounded bg-white px-2 py-0.5 shadow-sm">
                                  {point.label}: {point.value}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="mt-4" ref={sourcesListRef}>
                          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-gray-500">
                            <i className="ri-database-2-line" /> 参数来源
                          </div>
                          {selectedParameter.sources && selectedParameter.sources.length > 0 ? (
                            <ul className="space-y-2">
                              {selectedParameter.sources.map((source) => (
                                <li key={source.id} className="rounded-xl border border-gray-200 bg-white p-3 text-sm text-gray-700">
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-gray-800">
                                      <i className="ri-folder-chart-line" /> {source.type}
                                    </span>
                                    <span className="flex items-center gap-2 text-xs text-gray-500">
                                      {source.updatedAt && (
                                        <span className="inline-flex items-center gap-1">
                                          <i className="ri-time-line" /> {source.updatedAt}
                                        </span>
                                      )}
                                      {source.confidence !== undefined && (
                                        <span className="inline-flex items-center gap-1">
                                          <i className="ri-shield-keyhole-line" /> 可信度 {Math.round(source.confidence * 100)}%
                                        </span>
                                      )}
                                    </span>
                                  </div>
                                  <div className="mt-1 text-sm text-gray-700">{source.reference}</div>
                                  {source.summary && <div className="mt-1 text-xs text-gray-500">{source.summary}</div>}
                                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                                    {source.owner && (
                                      <span className="inline-flex items-center gap-1">
                                        <i className="ri-user-line" /> {source.owner}
                                      </span>
                                    )}
                                    {source.reviewer && (
                                      <span className="inline-flex items-center gap-1">
                                        <i className="ri-user-star-line" /> 审核 {source.reviewer}
                                      </span>
                                    )}
                                  </div>
                                  {source.link && (
                                    <a
                                      href={source.link}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="mt-2 inline-flex items-center gap-1 rounded border border-indigo-200 bg-indigo-50 px-2 py-1 text-xs text-indigo-700 hover:border-indigo-300"
                                    >
                                      <i className="ri-external-link-line" /> 查看来源
                                    </a>
                                  )}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <div className="rounded-xl border border-dashed border-gray-200 bg-white py-6 text-center text-sm text-gray-500">
                              暂无来源记录。
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="mt-4 rounded-xl border border-dashed border-gray-200 py-10 text-center text-sm text-gray-500">
                    暂无参数数据。
                  </div>
                )}
              </section>
            ) : (
              <section className="rounded-2xl border border-dashed border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
                <i className="ri-equalizer-fill text-3xl text-gray-300"></i>
                <p className="mt-2">此节点暂无设计参数配置。</p>
              </section>
            )}

            {/* 轻量化 3D 模型 */}
            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <div className="mb-2 flex items-center gap-2 text-xs font-medium text-gray-500">
                <i className="ri-cube-line" /> 3D 预览（glTF/GLB）
              </div>
              <EbomModelViewer src={active.links?.gltfUrl} poster={active.links?.posterUrl} />
            </div>

            {/* 设计文档清单 */}
            <EbomDocList node={active} statusTokens={DOCUMENT_STATUS_TOKENS} />
          </div>
        )}
      </section>
          </div>
          <aside className="space-y-4 lg:sticky lg:top-6 lg:h-fit">
            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <i className="ri-auction-line text-indigo-500" /> 审批事项
              </div>
              <ul className="mt-3 space-y-2 text-xs text-gray-600">
                {reviewMemoItems.length ? (
                  reviewMemoItems.map((item) => (
                    <li key={item.id} className="rounded-lg border border-gray-100 bg-slate-50/70 p-3">
                      <div className="text-sm font-medium text-gray-800">{item.meeting}</div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
                        <span><i className="ri-time-line" /> {item.date}</span>
                        {item.owner && <span><i className="ri-user-line" /> {item.owner}</span>}
                      </div>
                      <p className="mt-1 text-xs text-gray-600">{item.conclusion}</p>
                    </li>
                  ))
                ) : (
                  <li className="rounded-lg border border-dashed border-gray-200 px-3 py-6 text-center text-xs text-gray-400">
                    暂无审批纪要
                  </li>
                )}
              </ul>
            </div>

            <div className="rounded-2xl border border-rose-100 bg-rose-50/40 p-4 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-semibold text-rose-700">
                <i className="ri-alert-line" /> 风险缓冲期
              </div>
              {parameterStatusSummary.total ? (
                <div className="mt-3 space-y-3">
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-rose-700">
                    <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 font-medium">
                      <i className="ri-alarm-warning-line" /> 红灯 {parameterStatusSummary.risk}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 font-medium text-amber-600 border border-amber-200">
                      <i className="ri-alert-line" /> 黄灯 {parameterStatusSummary.watch}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 font-medium text-emerald-700">
                      <i className="ri-shield-check-line" /> 稳定 {Math.max(parameterStatusSummary.total - parameterStatusSummary.risk - parameterStatusSummary.watch, 0)}
                    </span>
                    <span className="ml-auto text-rose-600/80">合计 {parameterStatusSummary.total}</span>
                  </div>
                  <div className="flex h-2 w-full overflow-hidden rounded-full bg-white/70 shadow-inner">
                    {parameterStatusSummary.risk > 0 && (
                      <div
                        className="bg-rose-500/80"
                        style={{ width: `${Math.min((parameterStatusSummary.risk / parameterStatusSummary.total) * 100, 100)}%` }}
                      />
                    )}
                    {parameterStatusSummary.watch > 0 && (
                      <div
                        className="bg-amber-400/80"
                        style={{ width: `${Math.min((parameterStatusSummary.watch / parameterStatusSummary.total) * 100, 100)}%` }}
                      />
                    )}
                    <div
                      className="flex-1 bg-emerald-400/60"
                      style={{ minWidth: '4%' }}
                    />
                  </div>
                  <ul className="space-y-2 text-xs text-rose-700">
                    {parameterStatusSummary.alerts.slice(0, 4).map((entry) => (
                      <li key={entry.detail.id}>
                        <button
                          type="button"
                          onClick={() => handleFocusParameter(entry)}
                          className={`w-full rounded-lg border px-3 py-2 text-left transition focus:outline-none focus:ring-2 ${
                            entry.severity === 'risk'
                              ? 'border-rose-100 hover:border-rose-200 hover:bg-rose-50 focus:ring-rose-200 bg-white'
                              : 'border-amber-100 hover:border-amber-200 bg-white focus:ring-amber-200 hover:bg-amber-50/70'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 text-sm font-medium">
                            <span>{entry.detail.name}</span>
                            <span className={`inline-flex items-center gap-1 text-[11px] ${entry.severity === 'risk' ? 'text-rose-600' : 'text-amber-600'}`}>
                              <i className="ri-timer-line" /> {entry.detail.lastUpdated ?? '—'}
                            </span>
                          </div>
                          <div className={`mt-1 flex flex-wrap items-center gap-2 text-[11px] ${entry.severity === 'risk' ? 'text-rose-600' : 'text-amber-600'}`}>
                            <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 ${entry.severity === 'risk' ? 'bg-rose-100' : 'bg-amber-100 border border-amber-200'}`}>
                              <i className="ri-error-warning-line" /> {entry.severity === 'risk' ? '红灯' : '黄灯'}
                            </span>
                            <span>{entry.groupTitle}</span>
                            {entry.detail.value && (
                              <span>
                                {entry.detail.value}
                                {entry.detail.unit ? ` ${entry.detail.unit}` : ''}
                              </span>
                            )}
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                  {riskExperience && (
                    <div className="rounded-lg border border-rose-100 bg-white/90 p-3 text-[11px] text-rose-700">
                      <div className="inline-flex items-center gap-1 font-semibold text-rose-700">
                        <i className="ri-lightbulb-line" /> 经验提示
                      </div>
                      <div className="mt-1 font-medium text-rose-700/90">{riskExperience.title}</div>
                      <p className="mt-1 text-rose-600/80">{riskExperience.snippet}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="mt-3 text-xs text-rose-600/70">暂未收集到需要关注的参数风险。</p>
              )}
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-4 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-semibold text-amber-700">
                <i className="ri-calendar-todo-line" /> 近期提醒
              </div>
              {memoAlerts.length ? (
                <ul className="mt-3 space-y-2 text-xs text-amber-700">
                  {memoAlerts.map((alert) => (
                    <li key={alert.id} className="rounded-lg border border-amber-200 bg-white px-3 py-2">
                      <div className="font-medium text-amber-800">{alert.title}</div>
                      <p className="mt-1 text-amber-700/80">{alert.message}</p>
                      {alert.actionLabel && alert.onAction && (
                        <button
                          type="button"
                          onClick={alert.onAction}
                          className="mt-2 inline-flex items-center gap-1 rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] text-amber-700 hover:border-amber-300"
                        >
                          <i className="ri-external-link-line" /> {alert.actionLabel}
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-xs text-amber-700/70">暂无刷新策略提醒。</p>
              )}
            </div>
          </aside>
        </div>
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
                  <i className="ri-equalizer-line" /> 阈值总览
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
                  nodeId={selectedNodeId ?? active?.id ?? active?.partNumber}
                  baseline={right.label}
                  onJumpLogged={() => {
                    setJumpLogVersion((v) => v + 1);
                    setJumpLogOpen(true);
                  }}
                  onViewRequirement={({ requirementIds, sourceNodeId, sourceNodeName }) => {
                    onNavigateRequirement?.({
                      requirementIds,
                      sourceNodeId: sourceNodeId ?? selectedNodeId ?? active?.id ?? null,
                      sourceNodeName: sourceNodeName ?? active?.name ?? null,
                    });
                  }}
                  sourceNodeId={selectedNodeId}
                  sourceNodeName={active?.name}
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
              <div className="mt-4">
                <KnowledgeRail items={filteredKnowledgeItems} />
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
        </>
      )}

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

      <div className="fixed bottom-8 right-6 z-40 hidden flex-col gap-2 md:flex">
        {quickActions.map((action) => (
          <button
            key={`dock-${action.id}`}
            type="button"
            onClick={action.onClick}
            className={`relative flex h-11 w-11 items-center justify-center rounded-full shadow-lg transition ${floatingAccent[action.accent]}`}
            title={action.label}
            aria-label={action.label}
          >
            <i className={`${action.icon} text-lg`}></i>
            {action.badge ? (
              <span className="absolute -top-1 -right-1 inline-flex min-w-[1.1rem] justify-center rounded-full bg-white px-1 text-[10px] font-semibold text-rose-500">
                {action.badge}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      <div className="fixed bottom-4 left-0 right-0 z-40 flex justify-center px-4 md:hidden">
        <div className="flex max-w-full items-center gap-2 overflow-x-auto rounded-3xl border border-gray-200 bg-white/95 px-3 py-2 shadow-lg backdrop-blur">
          {quickActions.map((action) => (
            <button
              key={`dock-mobile-${action.id}`}
              type="button"
              onClick={action.onClick}
              className="flex flex-col items-center justify-center gap-1 whitespace-nowrap px-2 text-[11px] text-gray-600"
              aria-label={action.label}
            >
              <span className={`relative flex h-9 w-9 items-center justify-center rounded-full border border-gray-100 bg-white shadow-sm ${accentText[action.accent]}`}>
                <i className={`${action.icon} text-base`}></i>
                {action.badge ? (
                  <span className="absolute -top-1 -right-1 inline-flex min-w-[0.9rem] justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
                    {action.badge}
                  </span>
                ) : null}
              </span>
              <span>{action.short}</span>
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}
