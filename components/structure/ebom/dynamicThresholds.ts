import type { CockpitKpi, CockpitKpiPoint, DynamicThresholdRule } from './cockpitTypes';
import data from '../../../docs/mocks/kpi-dynamic-thresholds.json';

const rules: DynamicThresholdRule[] = (data as { rules: DynamicThresholdRule[] }).rules ?? [];

const isFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);

const pickValues = (points?: CockpitKpiPoint[]): number[] =>
  (points ?? [])
    .map((point) => point?.v)
    .filter(isFiniteNumber);

const round = (value: number, fractionDigits = 1): number =>
  Number.isFinite(value) ? Number(value.toFixed(fractionDigits)) : value;

const computeMean = (values: number[]): number | undefined => {
  if (!values.length) return undefined;
  const sum = values.reduce((acc, cur) => acc + cur, 0);
  return sum / values.length;
};

const computeSigma = (values: number[], mean: number): number | undefined => {
  if (values.length < 2) return 0;
  const variance = values.reduce((acc, cur) => acc + (cur - mean) * (cur - mean), 0) / (values.length - 1);
  return Math.sqrt(Math.max(variance, 0));
};

const percentileValue = (values: number[], percentile: number): number | undefined => {
  if (!values.length) return undefined;
  const p = Math.min(Math.max(percentile, 0), 1);
  const sorted = [...values].sort((a, b) => a - b);
  const position = (sorted.length - 1) * p;
  const lowerIndex = Math.floor(position);
  const upperIndex = Math.ceil(position);
  const lower = sorted[lowerIndex];
  const upper = sorted[upperIndex];
  if (lowerIndex === upperIndex) return lower;
  const weight = position - lowerIndex;
  return lower + (upper - lower) * weight;
};

export interface DynamicThresholdEvaluation {
  low?: number;
  high?: number;
  red?: number;
  computed: boolean;
  method: DynamicThresholdRule['type'];
  note?: string;
}

export interface EvaluateOptions {
  series?: CockpitKpiPoint[];
  fallback?: { low?: number; high?: number; red?: number };
}

function evaluateMuSigma(rule: DynamicThresholdRule, options: EvaluateOptions): DynamicThresholdEvaluation {
  const fallbackLow = rule.bounds.low ?? options.fallback?.low;
  const fallbackHigh = rule.bounds.high ?? options.fallback?.high;
  const fallbackRed = rule.bounds.red ?? options.fallback?.red;

  const providedMean = rule.parameters && isFiniteNumber((rule.parameters as Record<string, unknown>).mean)
    ? Number((rule.parameters as Record<string, unknown>).mean)
    : undefined;
  const providedSigma = rule.parameters && isFiniteNumber((rule.parameters as Record<string, unknown>).sigma)
    ? Number((rule.parameters as Record<string, unknown>).sigma)
    : undefined;

  const values = pickValues(rule.samples ?? options.series);
  const mean = providedMean ?? computeMean(values);
  const sigma = providedSigma ?? (mean !== undefined ? computeSigma(values, mean) : undefined);

  if (mean === undefined || sigma === undefined) {
    return {
      low: fallbackLow,
      high: fallbackHigh,
      red: fallbackRed,
      computed: false,
      method: 'mu_sigma',
      note: '缺少足够样本，回退至静态阈值',
    };
  }

  const redMultiplier = rule.parameters && isFiniteNumber((rule.parameters as Record<string, unknown>).redSigmaMultiplier)
    ? Number((rule.parameters as Record<string, unknown>).redSigmaMultiplier)
    : 2;

  return {
    low: round(mean - sigma),
    high: round(mean + sigma),
    red: round(mean + sigma * redMultiplier),
    computed: true,
    method: 'mu_sigma',
    note: `均值 ${round(mean)}，σ ${round(sigma)}，红线 ${redMultiplier}σ`,
  };
}

function evaluatePercentile(rule: DynamicThresholdRule, options: EvaluateOptions): DynamicThresholdEvaluation {
  const fallbackLow = rule.bounds.low ?? options.fallback?.low;
  const fallbackHigh = rule.bounds.high ?? options.fallback?.high;
  const fallbackRed = rule.bounds.red ?? options.fallback?.red;

  const params = rule.parameters as Record<string, unknown> | undefined;
  const lowPercent = params && isFiniteNumber(params.percentileLow) ? Number(params.percentileLow) : 0.2;
  const highPercent = params && isFiniteNumber(params.percentileHigh) ? Number(params.percentileHigh) : 0.8;
  const redPercent = params && isFiniteNumber(params.percentileRed) ? Number(params.percentileRed) : 0.95;

  const values = pickValues(rule.samples ?? options.series);
  if (!values.length) {
    return {
      low: fallbackLow,
      high: fallbackHigh,
      red: fallbackRed,
      computed: false,
      method: 'percentile',
      note: '缺少样本，使用预置阈值',
    };
  }

  return {
    low: round(percentileValue(values, lowPercent) ?? fallbackLow ?? 0),
    high: round(percentileValue(values, highPercent) ?? fallbackHigh ?? 0),
    red: round(percentileValue(values, redPercent) ?? fallbackRed ?? 0),
    computed: true,
    method: 'percentile',
    note: `分位线 P${Math.round(lowPercent * 100)}/${Math.round(highPercent * 100)}/${Math.round(redPercent * 100)}`,
  };
}

function evaluateStage(rule: DynamicThresholdRule, options: EvaluateOptions): DynamicThresholdEvaluation {
  const fallbackLow = rule.bounds.low ?? options.fallback?.low;
  const fallbackHigh = rule.bounds.high ?? options.fallback?.high;
  const fallbackRed = rule.bounds.red ?? options.fallback?.red;

  const stage = rule.stage ?? (rule.parameters as Record<string, unknown> | undefined)?.stage;
  return {
    low: fallbackLow,
    high: fallbackHigh,
    red: fallbackRed,
    computed: true,
    method: 'stage',
    note: stage ? `阶段 ${stage}` : '阶段阈值',
  };
}

export function evaluateDynamicThreshold(
  rule: DynamicThresholdRule,
  options: EvaluateOptions = {}
): DynamicThresholdEvaluation {
  switch (rule.type) {
    case 'mu_sigma':
      return evaluateMuSigma(rule, options);
    case 'percentile':
      return evaluatePercentile(rule, options);
    case 'stage':
      return evaluateStage(rule, options);
    default:
      return {
        low: rule.bounds.low ?? options.fallback?.low,
        high: rule.bounds.high ?? options.fallback?.high,
        red: rule.bounds.red ?? options.fallback?.red,
        computed: false,
        method: rule.type,
        note: '未识别的动态规则类型',
      };
  }
}

export function mergeDynamicThreshold(
  kpi: CockpitKpi,
  rule?: DynamicThresholdRule,
  options: EvaluateOptions = {}
): CockpitKpi {
  if (!rule) return kpi;
  const evaluation = evaluateDynamicThreshold(rule, { ...options, series: options.series ?? kpi.series });
  return {
    ...kpi,
    threshold: {
      ...kpi.threshold,
      low: evaluation.low ?? kpi.threshold?.low,
      high: evaluation.high ?? kpi.threshold?.high,
      rule: rule.type,
    },
    dynamicRule: {
      ...rule,
      bounds: {
        ...rule.bounds,
        low: evaluation.low,
        high: evaluation.high,
        red: evaluation.red,
      },
      explanation: evaluation.note ?? rule.explanation,
    },
  };
}

export function listDynamicThresholdRules(): DynamicThresholdRule[] {
  return rules;
}

export function groupRulesByKpi(): Record<string, DynamicThresholdRule[]> {
  return rules.reduce<Record<string, DynamicThresholdRule[]>>((acc, rule) => {
    if (!acc[rule.kpiId]) acc[rule.kpiId] = [];
    acc[rule.kpiId].push(rule);
    return acc;
  }, {});
}

export function pickPrimaryRule(kpiId: string): DynamicThresholdRule | undefined {
  const grouped = groupRulesByKpi();
  return grouped[kpiId]?.[0];
}

export function formatRuleType(type: DynamicThresholdRule['type']): string {
  switch (type) {
    case 'mu_sigma':
      return 'µ±σ 动态阈值';
    case 'percentile':
      return '滚动分位阈值';
    case 'stage':
      return '阶段驱动阈值';
    default:
      return type;
  }
}

export function applyDynamicThresholds(
  kpis: CockpitKpi[],
  overrides?: { [kpiId: string]: EvaluateOptions['fallback'] }
): CockpitKpi[] {
  const byKpi = groupRulesByKpi();
  return kpis.map((kpi) => {
    const rule = byKpi[kpi.id]?.[0];
    if (!rule) return kpi;
    return mergeDynamicThreshold(kpi, rule, { fallback: overrides?.[kpi.id] });
  });
}
