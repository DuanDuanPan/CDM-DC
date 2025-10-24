import type { ChannelFilterTag, TestSimChannel, TestSimChannelKind, TestSimRun } from './types';

const G_TO_MS2 = 9.80665;

export const CHANNEL_TAGS: ChannelFilterTag[] = [
  {
    id: 'ACC',
    label: 'ACC_*',
    matcher: (name) => /^ACC[_\-]/i.test(name),
  },
  {
    id: 'PSD',
    label: 'PSD_*',
    matcher: (name) => /^PSD[_\-]/i.test(name),
  },
  {
    id: 'FRF',
    label: 'FRF_*',
    matcher: (name) => /^FRF[_\-]/i.test(name),
  },
  {
    id: 'COH',
    label: 'COH_*',
    matcher: (name) => /^COH[_\-]/i.test(name),
  },
  {
    id: 'OTHER',
    label: '其它',
    matcher: () => true,
  },
];

export const classifyChannelKind = (name: string): TestSimChannelKind => {
  const upper = name.toUpperCase();
  if (upper.startsWith('ACC_')) return 'ACC';
  if (upper.startsWith('PSD_')) return 'PSD';
  if (upper.startsWith('FRF_')) return 'FRF';
  if (upper.startsWith('COH_')) return 'COH';
  return 'OTHER';
};

type UnitConversion = {
  canonical: string;
  toCanonical: (value: number) => number;
  fromCanonical: (value: number) => number;
};

const UNIT_MAP: Record<string, UnitConversion> = {
  g: {
    canonical: 'm/s²',
    toCanonical: (value: number) => value * G_TO_MS2,
    fromCanonical: (value: number) => value / G_TO_MS2,
  },
  'm/s²': {
    canonical: 'm/s²',
    toCanonical: (value: number) => value,
    fromCanonical: (value: number) => value,
  },
  kn: {
    canonical: 'N',
    toCanonical: (value: number) => value * 1000,
    fromCanonical: (value: number) => value / 1000,
  },
  n: {
    canonical: 'N',
    toCanonical: (value: number) => value,
    fromCanonical: (value: number) => value,
  },
};

export const getCanonicalUnit = (unit?: string): string | undefined => {
  if (!unit) return undefined;
  const key = unit.toLowerCase();
  return UNIT_MAP[key]?.canonical ?? unit;
};

export const convertToCanonical = (value: number, unit?: string): number => {
  if (!unit) return value;
  const key = unit.toLowerCase();
  const mapping = UNIT_MAP[key];
  if (!mapping) return value;
  return mapping.toCanonical(value);
};

export const convertFromCanonical = (value: number, targetUnit?: string): number => {
  if (!targetUnit) return value;
  const key = targetUnit.toLowerCase();
  const mapping = UNIT_MAP[key];
  if (!mapping) return value;
  return mapping.fromCanonical(value);
};

export const decimateSeries = <T extends { ts: number; value: number }>(
  samples: T[],
  maxPoints = 4000,
): T[] => {
  if (samples.length <= maxPoints) {
    return samples;
  }
  const step = Math.ceil(samples.length / maxPoints);
  const result: T[] = [];
  for (let i = 0; i < samples.length; i += step) {
    result.push(samples[i]);
  }
  if (samples[samples.length - 1] !== result[result.length - 1]) {
    result.push(samples[samples.length - 1]);
  }
  return result;
};

export const normalizeChannel = (
  channel: string,
  unit?: string,
  sampleRate?: number | null,
) => {
  const canonicalUnit = getCanonicalUnit(unit) ?? unit;
  return {
    channel,
    canonicalUnit,
    normalizedSampleRate: sampleRate ?? null,
  };
};

export const buildTestSimChannel = (
  name: string,
  samples: Array<{ ts: string; value: number }>,
  unit?: string,
  sampleRate?: number | null,
): TestSimChannel => {
  const kind = classifyChannelKind(name);
  const canonicalUnit = getCanonicalUnit(unit);
  const converted = samples.map((item) => ({
    ts: Date.parse(item.ts),
    value: convertToCanonical(item.value, unit),
  }));
  return {
    kind,
    channel: name,
    unit: canonicalUnit,
    sampleRate: sampleRate ?? null,
    samples: converted,
    originalUnit: unit,
    originalSampleRate: sampleRate ?? null,
  };
};

export const makeChannelKey = (runId: string, channel: string) => `${runId}::${channel}`;

export const attachRunChannelMetadata = (run: TestSimRun): TestSimRun => {
  const decoratedChannels = run.channels.map((channel) => ({
    ...channel,
    runId: run.runId,
    runLabel: run.label,
    key: makeChannelKey(run.runId, channel.channel),
  }));
  return {
    ...run,
    channels: decoratedChannels,
  };
};
