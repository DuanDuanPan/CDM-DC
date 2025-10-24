import type { TbomTimeseriesChannel } from '@/components/tbom/types';

export type TestSimChannelKind = 'ACC' | 'PSD' | 'FRF' | 'COH' | 'OTHER';

export type TestSimChannel = {
  kind: TestSimChannelKind;
  channel: string;
  unit?: string;
  sampleRate?: number | null;
  samples: Array<{ ts: number; value: number }>;
  originalUnit?: string;
  originalSampleRate?: number | null;
  runId?: string;
  runLabel?: string;
  key?: string;
};

export type TestSimRunStatus = 'ready' | 'pending';

export type TestSimRunSource = 'tbom' | 'manual' | 'simulation';

export type TestSimRun = {
  runId: string;
  projectId: string;
  testId: string;
  label: string;
  recordedAt?: string;
  source: TestSimRunSource;
  originLabel?: string;
  status?: TestSimRunStatus;
  channels: TestSimChannel[];
};

export type AlignmentStatus = 'aligned' | 'pending' | 'skipped';

export type ChannelAlignment = {
  channel: string;
  unitStatus: AlignmentStatus;
  sampleRateStatus: AlignmentStatus;
  notes?: string;
};

export type AlignmentLogEntry = {
  timestamp: string;
  channel: string;
  message: string;
  severity: 'info' | 'warning';
};

export type TestSimState = {
  runs: TestSimRun[];
  selectedRunIds: string[];
  selectedChannels: string[];
  quickFilters: TestSimChannelKind[];
  alignment: Record<string, ChannelAlignment>;
  alignmentLog: AlignmentLogEntry[];
  pending: boolean;
  error: string | null;
};

export type SampledChannel = {
  channel: string;
  unit?: string;
  sampleRate?: number | null;
  values: Array<{ ts: number; value: number }>;
};

export type ChannelFilterTag = {
  id: TestSimChannelKind;
  label: string;
  matcher: (name: string) => boolean;
};

export type PartialTimeseries = Pick<TbomTimeseriesChannel, 'channel' | 'unit' | 'sampleRate' | 'samples'>;
