import type { TestSimChannel, TestSimRun } from './types';
import { attachRunChannelMetadata, buildTestSimChannel } from './utils';

const createChannel = (
  name: string,
  samples: Array<{ ts: Date; value: number }>,
  unit?: string,
  sampleRate?: number,
): TestSimChannel => {
  const formatted = samples.map((sample) => ({
    ts: sample.ts.toISOString(),
    value: sample.value,
  }));
  return buildTestSimChannel(name, formatted, unit, sampleRate);
};

const buildWaveSamples = (start: Date, amplitude: number, frequency: number, length = 180): Array<{ ts: Date; value: number }> => {
  const samples: Array<{ ts: Date; value: number }> = [];
  for (let i = 0; i < length; i += 1) {
    const ts = new Date(start.getTime() + (i * 5 * 60 * 1000) / 12);
    const value = amplitude * Math.sin((frequency * i) / 12);
    samples.push({ ts, value: Number(value.toFixed(4)) });
  }
  return samples;
};

export const createMockSimulationRuns = (): TestSimRun[] => {
  const now = new Date();
  const runAChannels: TestSimChannel[] = [
    createChannel('ACC_SIM_MOCK_A1', buildWaveSamples(now, 9.8, 2.4), 'g', 120),
    createChannel('PSD_SIM_MOCK_A2', buildWaveSamples(now, 0.8, 1.2).map((item) => ({ ...item, value: Math.abs(item.value) })), 'g²/Hz', 60),
  ];

  const runBChannels: TestSimChannel[] = [
    createChannel('ACC_SIM_MOCK_B1', buildWaveSamples(now, 8.2, 1.8), 'g', 120),
    createChannel('FRF_SIM_MOCK_B2', buildWaveSamples(now, 1.2, 1.1).map((item, index) => ({ ...item, value: Number((item.value + index * 0.005).toFixed(4)) })), 'm/s²', 120),
  ];

  return [
    attachRunChannelMetadata({
      runId: 'SIM-MOCK-A',
      projectId: 'SIM-PROJ-001',
      testId: 'SIM-CASE-A',
      label: '仿真示例 A · 起飞工况',
      recordedAt: '版本 v3.2',
      source: 'simulation',
      originLabel: '结构仿真',
      status: 'ready',
      channels: runAChannels,
    }),
    attachRunChannelMetadata({
      runId: 'SIM-MOCK-B',
      projectId: 'SIM-PROJ-001',
      testId: 'SIM-CASE-B',
      label: '仿真示例 B · 巡航工况',
      recordedAt: '版本 v3.2',
      source: 'simulation',
      originLabel: '结构仿真',
      status: 'ready',
      channels: runBChannels,
    }),
  ];
};
