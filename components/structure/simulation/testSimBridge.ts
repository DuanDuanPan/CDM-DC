import type { TestSimChannel, TestSimRun } from '@/components/compare/testSim/types';
import { attachRunChannelMetadata, buildTestSimChannel } from '@/components/compare/testSim/utils';
import type { SimulationCondition, SimulationFile } from './types';

export const SIM_TEST_COMPARE_STORAGE_KEY = 'testSimSimulationRuns';
export const SIM_TEST_COMPARE_EVENT = 'test-sim-compare:runs-updated';

type CurvePoint = { x?: number; y: number };

const sanitizeSegment = (value?: string) => {
  if (!value) return 'SIM';
  const upper = value.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
  const trimmed = upper.replace(/_+/g, '_').replace(/^_|_$/g, '');
  return trimmed.length ? trimmed.slice(0, 18) : 'SIM';
};

const deriveChannelPrefix = (name: string): string => {
  const lower = name.toLowerCase();
  if (lower.includes('psd')) return 'PSD_';
  if (lower.includes('frf')) return 'FRF_';
  if (lower.includes('coh') || lower.includes('相干')) return 'COH_';
  return 'ACC_';
};

const deriveUnit = (name: string): string | undefined => {
  const lower = name.toLowerCase();
  if (lower.includes('位移')) return 'mm';
  if (lower.includes('应力') || lower.includes('stress')) return 'MPa';
  if (lower.includes('温度')) return '°C';
  if (lower.includes('力') || lower.includes('load')) return 'kN';
  if (lower.includes('psd')) return 'g²/Hz';
  if (lower.includes('frf')) return 'm/s²';
  return 'g';
};

const computeSampleRate = (curve: CurvePoint[]): number | null => {
  if (curve.length < 2) return null;
  const first = curve[0]?.x ?? 0;
  const second = curve[1]?.x ?? 1;
  const delta = second - first;
  if (!Number.isFinite(delta) || delta <= 0) return null;
  const rate = 1 / delta;
  return Number.isFinite(rate) ? Number(rate.toFixed(2)) : null;
};

const buildChannelsFromCurve = (
  file: SimulationFile,
  conditionLabel: string,
  curves: CurvePoint[][],
  baseTs: number,
): TestSimChannel[] => {
  const channels: TestSimChannel[] = [];
  curves.forEach((curve, index) => {
    if (!curve || curve.length === 0) return;
    const prefix = deriveChannelPrefix(file.name);
    const channelName = `${prefix}${sanitizeSegment(conditionLabel)}_${index + 1}`;
    const unit = deriveUnit(file.name);
    const samples = curve.map((point, sampleIndex) => ({
      ts: new Date(baseTs + (point.x ?? sampleIndex) * 1000).toISOString(),
      value: point.y,
    }));
    const channel = buildTestSimChannel(channelName, samples, unit, computeSampleRate(curve));
    channels.push(channel);
  });
  return channels;
};

export const buildSimulationRunsFromFiles = (
  files: SimulationFile[],
  conditions: SimulationCondition[],
  options?: { selectedConditionIds?: string[] },
): TestSimRun[] => {
  const resultFiles = files.filter((file) => file.type === 'result');
  if (resultFiles.length === 0) return [];

  const conditionMap = new Map<string, SimulationCondition>();
  conditions.forEach((condition) => conditionMap.set(condition.id, condition));

  const candidateConditionIds =
    options?.selectedConditionIds && options.selectedConditionIds.length
      ? options.selectedConditionIds
      : Array.from(conditionMap.keys());

  // 如果没有工况，仍然构建一个默认 run
  const normalizedCandidateIds = candidateConditionIds.length ? candidateConditionIds : ['__default__'];
  const runsMap = new Map<string, TestSimRun>();

  normalizedCandidateIds.forEach((conditionId) => {
    const condition = conditionMap.get(conditionId);
    const conditionLabel = condition?.name ?? (conditionId === '__default__' ? '默认工况' : conditionId);
    const metaSource = resultFiles.find((file) => file.compareMeta)?.compareMeta;
    let hasSupportingFile = false;
    const channels: TestSimChannel[] = [];

    resultFiles.forEach((file, fileIndex) => {
      const supportsCondition =
        conditionId === '__default__' ||
        file.activeConditionId === conditionId ||
        (file.conditions || []).some((item) => item.id === conditionId) ||
        Boolean(file.conditionVariants?.[conditionId]);
      if (!supportsCondition) return;
      hasSupportingFile = true;
      const variant = conditionId === '__default__' ? undefined : file.conditionVariants?.[conditionId];
      const curves = variant?.curveData ?? file.preview?.curveData;
      if (!curves) return;
      const baseTs = Date.now() + fileIndex * 120_000;
      channels.push(...buildChannelsFromCurve(file, conditionLabel, curves, baseTs));
    });

    if (!hasSupportingFile) {
      return;
    }

    const runIdBase = metaSource?.instanceId ?? 'simulation';
    const runId = conditionId === '__default__' ? `SIM-${runIdBase}` : `SIM-${runIdBase}-${conditionId}`;
    const run: TestSimRun = {
      runId,
      projectId: metaSource?.instanceId ?? 'simulation',
      testId: conditionId === '__default__' ? 'SIM-DEFAULT' : conditionId,
      label: `${metaSource?.instanceName ?? '仿真实例'} · ${conditionLabel}`,
      recordedAt: metaSource?.version ? `版本 ${metaSource.version}` : undefined,
      source: 'simulation',
      originLabel: metaSource?.categoryName ?? '仿真',
      status: channels.length ? 'ready' : 'pending',
      channels,
    };
    runsMap.set(run.runId, attachRunChannelMetadata(run));
  });

  return Array.from(runsMap.values());
};

export const loadSimulationRunsFromStorage = (): TestSimRun[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(SIM_TEST_COMPARE_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => {
        const channels = Array.isArray(item.channels)
          ? item.channels.map((channel: any) => ({
              ...channel,
              samples: Array.isArray(channel.samples)
                ? channel.samples.map((sample: any) => ({
                    ts:
                      typeof sample.ts === 'number'
                        ? sample.ts
                        : Number.parseInt(sample.ts, 10) || Date.parse(sample.ts),
                    value: Number(sample.value),
                  }))
                : [],
            }))
          : [];
        return {
          ...item,
          channels,
        } as TestSimRun;
      })
      .filter((run) => typeof run?.runId === 'string')
      .map(attachRunChannelMetadata);
  } catch (error) {
    console.warn('[simulation:testSimBridge] 无法读取仿真 Compare 持久化', error);
    return [];
  }
};

export const persistSimulationRuns = (runs: TestSimRun[]) => {
  if (typeof window === 'undefined' || !runs.length) return;
  try {
    const current = loadSimulationRunsFromStorage();
    const map = new Map<string, TestSimRun>();
    current.forEach((run) => map.set(run.runId, run));
    runs.map(attachRunChannelMetadata).forEach((run) => map.set(run.runId, run));
    window.localStorage.setItem(
      SIM_TEST_COMPARE_STORAGE_KEY,
      JSON.stringify(Array.from(map.values())),
    );
    window.dispatchEvent(new CustomEvent(SIM_TEST_COMPARE_EVENT));
  } catch (error) {
    console.warn('[simulation:testSimBridge] 无法写入仿真 Compare 持久化', error);
  }
};

export const clearSimulationRunsFromStorage = (runIds?: string[]) => {
  if (typeof window === 'undefined') return;
  try {
    if (!runIds || !runIds.length) {
      window.localStorage.removeItem(SIM_TEST_COMPARE_STORAGE_KEY);
    } else {
      const current = loadSimulationRunsFromStorage();
      const remaining = current.filter((run) => !runIds.includes(run.runId));
      window.localStorage.setItem(SIM_TEST_COMPARE_STORAGE_KEY, JSON.stringify(remaining));
    }
    window.dispatchEvent(new CustomEvent(SIM_TEST_COMPARE_EVENT));
  } catch (error) {
    console.warn('[simulation:testSimBridge] 无法清理仿真 Compare 持久化', error);
  }
};
