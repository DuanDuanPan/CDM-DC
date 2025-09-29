import type { CockpitKpi, Trust } from "./cockpitTypes";

export interface HealthFactorConfigEntry {
  kpiId: string;
  label?: string;
}

export interface HealthFactorDetail {
  key: string;
  label: string;
  weight: number;
  normalizedWeight: number;
  value: number;
  rawValue?: number;
  unit?: string;
  latestAt?: string;
  contribution: number;
  missing: boolean;
  trust?: Trust;
}

export interface HealthDetail {
  total: number;
  factors: HealthFactorDetail[];
  trust: Trust;
  freshnessSec?: number;
  updatedAt?: string;
}

const TRUST_ORDER: Record<Trust, number> = { low: 1, mid: 2, high: 3 };

const DEFAULT_HEALTH_FACTORS: Record<string, HealthFactorConfigEntry> = {
  dev: { kpiId: "DEV-CPL-001", label: "研发完成度" },
  sim: { kpiId: "SIM-COV-001", label: "仿真覆盖率" },
  test: { kpiId: "TST-COV-001", label: "试验覆盖率" },
  risk: { kpiId: "RSK-CLS-001", label: "风险关闭率" },
};

const clampPercent = (value: number): number => {
  if (!Number.isFinite(value)) return 0;
  const normalized = value <= 1 && value >= 0 ? value * 100 : value;
  return Math.max(0, Math.min(100, normalized));
};

const resolveTrust = (values: Trust[]): Trust => {
  if (!values.length) return "low";
  const minScore = Math.min(...values.map((t) => TRUST_ORDER[t] ?? 1));
  return (Object.entries(TRUST_ORDER).find(([, score]) => score === minScore)?.[0] as Trust) ?? "low";
};

export function computeHealth({
  kpis,
  weights,
  factorConfig,
  fallback,
}: {
  kpis: CockpitKpi[];
  weights?: Record<string, number>;
  factorConfig?: Record<string, HealthFactorConfigEntry>;
  fallback?: CockpitKpi | null;
}): { healthKpi: CockpitKpi; detail: HealthDetail } | null {
  const entries = Object.entries(factorConfig ?? DEFAULT_HEALTH_FACTORS);
  const sourceMap = new Map(kpis.map((k) => [k.id, k]));
  const factors: HealthFactorDetail[] = entries.map(([key, cfg]) => {
    const src = sourceMap.get(cfg.kpiId);
    if (!src || !src.series?.length) {
      return {
        key,
        label: cfg.label ?? key,
        weight: weights?.[key] ?? 0,
        normalizedWeight: 0,
        value: 0,
        contribution: 0,
        missing: true,
      };
    }
    const latestPoint = src.series[src.series.length - 1];
    const value = clampPercent(latestPoint?.v ?? 0);
    return {
      key,
      label: cfg.label ?? src.label ?? key,
      weight: weights?.[key] ?? 0,
      normalizedWeight: 0,
      value,
      rawValue: latestPoint?.v,
      unit: src.unit,
      latestAt: latestPoint?.t,
      contribution: 0,
      missing: false,
      trust: src.trust,
    };
  });

  const available = factors.filter((f) => !f.missing);
  if (!available.length) {
    if (!fallback) return null;
    return {
      healthKpi: fallback,
      detail: {
        total: fallback.series?.[fallback.series.length - 1]?.v ?? 0,
        factors,
        trust: fallback.trust,
        freshnessSec: fallback.freshnessSec,
        updatedAt: fallback.series?.[fallback.series.length - 1]?.t,
      },
    };
  }

  const totalWeight = available.reduce((sum, f) => sum + (Number.isFinite(f.weight) && f.weight > 0 ? f.weight : 1), 0);
  const detailFactors = factors.map((f) => {
    if (f.missing) return f;
    const baseWeight = Number.isFinite(f.weight) && f.weight > 0 ? f.weight : 1;
    const normalizedWeight = totalWeight > 0 ? baseWeight / totalWeight : 0;
    const contribution = normalizedWeight * f.value;
    return { ...f, normalizedWeight, contribution };
  });

  const score = detailFactors.reduce((sum, f) => sum + (f.missing ? 0 : f.contribution), 0);
  const updatedAt = detailFactors
    .filter((f) => !f.missing && f.latestAt)
    .map((f) => new Date(f.latestAt as string).getTime())
    .reduce<number | undefined>((latest, ts) => (latest === undefined ? ts : Math.max(latest, ts)), undefined);

  const freshnessSec = detailFactors
    .filter((f) => !f.missing)
    .map((f) => {
      const src = sourceMap.get((factorConfig ?? DEFAULT_HEALTH_FACTORS)[f.key]?.kpiId ?? "");
      return src?.freshnessSec ?? fallback?.freshnessSec ?? 3600;
    })
    .reduce<number | undefined>((max, cur) => (max === undefined ? cur : Math.max(max, cur)), fallback?.freshnessSec);

  const trust = resolveTrust(detailFactors.filter((f) => !f.missing && f.trust).map((f) => f.trust as Trust));

  const fallbackSeries = fallback?.series ?? [];
  let series: CockpitKpi["series"];
  if (fallbackSeries.length) {
    series = fallbackSeries.map((p, idx) =>
      idx === fallbackSeries.length - 1 ? { ...p, v: Number(score.toFixed(1)) } : p
    );
  } else {
    const ts = updatedAt ? new Date(updatedAt).toISOString() : new Date().toISOString();
    series = [{ t: ts, v: Number(score.toFixed(1)) }];
  }

  const healthKpi: CockpitKpi = {
    id: fallback?.id ?? "HLT-001",
    label: fallback?.label ?? "研制健康度",
    unit: fallback?.unit ?? "分",
    threshold: fallback?.threshold,
    series,
    freshnessSec: freshnessSec ?? fallback?.freshnessSec ?? 3600,
    trust: trust ?? fallback?.trust ?? "mid",
  };

  const detail: HealthDetail = {
    total: Number(score.toFixed(1)),
    factors: detailFactors,
    trust: healthKpi.trust,
    freshnessSec: healthKpi.freshnessSec,
    updatedAt: updatedAt ? new Date(updatedAt).toISOString() : fallback?.series?.[fallback.series.length - 1]?.t,
  };

  return { healthKpi, detail };
}
