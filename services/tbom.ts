import { z } from 'zod';
import { parseCsvRecords } from '@/utils/csv';
import type {
  TbomAttachment,
  TbomProject,
  TbomRun,
  TbomRunEvent,
  TbomTest,
  TbomTestCardRow,
  TbomTimeseriesChannel,
  TbomTimeseriesSample,
} from '../components/tbom/types';
import {
  TbomAttachmentListSchema,
  TbomProjectListSchema,
  TbomRunEventListSchema,
  TbomRunListSchema,
  TbomTestCardRowSchema,
  TbomTestListSchema,
  TbomTimeseriesSampleSchema,
} from '../components/tbom/types';
import { createApiClient, dataEnvelope } from './http';

const tbomApi = createApiClient({ basePath: '/tbom' });

const projectsResponseSchema = dataEnvelope(TbomProjectListSchema);

const testsResponseSchema = dataEnvelope(TbomTestListSchema);

const runsResponseSchema = dataEnvelope(TbomRunListSchema);

const attachmentsResponseSchema = dataEnvelope(TbomAttachmentListSchema);

const testCardResponseSchema = dataEnvelope(z.array(TbomTestCardRowSchema));

export async function listProjects(): Promise<TbomProject[]> {
  const result = await tbomApi('projects', {
    schema: projectsResponseSchema,
  });
  return result.data.map((project) => ({
    ...project,
    relations: project.relations ?? [],
  }));
}

export async function listTests(): Promise<TbomTest[]> {
  const result = await tbomApi('tests', {
    schema: testsResponseSchema,
  });
  return result.data.map((test) => ({
    ...test,
    spec_refs: test.spec_refs ?? [],
  }));
}

export async function listRuns(): Promise<TbomRun[]> {
  const result = await tbomApi('runs', {
    schema: runsResponseSchema,
  });
  return result.data.map((run) => ({
    ...run,
    attachments: run.attachments ?? [],
    environment: run.environment ?? {},
  }));
}

export async function fetchTimeseries(runId: string): Promise<string> {
  return tbomApi(`timeseries/${encodeURIComponent(runId)}`, {
    parseAs: 'text',
  });
}

export async function fetchEvents(runId: string): Promise<string> {
  return tbomApi(`events/${encodeURIComponent(runId)}`, {
    parseAs: 'text',
  });
}

export async function listRunAttachments(runId: string): Promise<TbomAttachment[]> {
  const response = await tbomApi(`attachments/${encodeURIComponent(runId)}`, {
    schema: attachmentsResponseSchema,
  });
  return response.data;
}

export async function listRunTestCard(runId: string): Promise<TbomTestCardRow[]> {
  const response = await tbomApi(`test-card/${encodeURIComponent(runId)}`, {
    schema: testCardResponseSchema,
  });
  return response.data.map((item) => ({
    ...item,
    unit: item.unit?.trim() || undefined,
    source: item.source?.trim() || undefined,
  }));
}

export async function getRunEvents(runId: string): Promise<TbomRunEvent[]> {
  const csv = await fetchEvents(runId);
  const records = parseCsvRecords(csv);
  return TbomRunEventListSchema.parse(records);
}

export async function getRunTimeseries(runId: string): Promise<TbomTimeseriesChannel[]> {
  const csv = await fetchTimeseries(runId);
  const records = parseCsvRecords(csv);
  if (!records.length) {
    return [];
  }

  const channels = Object.keys(records[0]).filter((key) => key !== 'ts');
  const channelSamples = new Map<string, TbomTimeseriesSample[]>();

  records.forEach((record) => {
    const timestamp = record.ts;
    channels.forEach((channel) => {
      const rawValue = record[channel];
      const value = Number.parseFloat(rawValue);
      if (Number.isNaN(value)) {
        return;
      }
      const sample: TbomTimeseriesSample = TbomTimeseriesSampleSchema.parse({
        ts: timestamp,
        value,
      });
      const list = channelSamples.get(channel) ?? [];
      list.push(sample);
      channelSamples.set(channel, list);
    });
  });

  const firstTwo = records.slice(0, 2).map((item) => Date.parse(item.ts));
  const intervalMs =
    firstTwo.length === 2 && Number.isFinite(firstTwo[0]) && Number.isFinite(firstTwo[1])
      ? Math.abs(firstTwo[1] - firstTwo[0])
      : null;
  const sampleRate = intervalMs && intervalMs > 0 ? Number((1000 / intervalMs).toFixed(2)) : null;

  return channels.map((channel) => ({
    channel,
    unit: guessUnit(channel),
    sampleRate,
    samples: channelSamples.get(channel) ?? [],
  }));
}

function guessUnit(channel: string): string | undefined {
  const upper = channel.toUpperCase();
  if (upper.startsWith('ACC')) {
    return 'g';
  }
  if (upper.includes('FORCE')) {
    return 'kN';
  }
  if (upper.includes('TEMP') || upper.includes('THERM')) {
    return '°C';
  }
  if (upper.includes('PRESS')) {
    return 'MPa';
  }
  if (upper.includes('FLOW')) {
    return 'kg/s';
  }
  return undefined;
}

export type RunsByProject = {
  project: TbomProject;
  tests: TbomTest[];
  runs: TbomRun[];
};

export async function groupRunsByProject(): Promise<RunsByProject[]> {
  const [projects, tests, runs] = await Promise.all([
    listProjects(),
    listTests(),
    listRuns(),
  ]);

  const testsByProject = tests.reduce<Record<string, TbomTest[]>>(
    (acc, test) => {
      acc[test.project_id] = acc[test.project_id] || [];
      acc[test.project_id].push(test);
      return acc;
    },
    {},
  );

  const testById = new Map(tests.map((test) => [test.test_id, test]));

  const runsByProject = runs.reduce<Record<string, TbomRun[]>>(
    (acc, run) => {
      const test = testById.get(run.test_id);
      if (!test) {
        return acc;
      }
      acc[test.project_id] = acc[test.project_id] || [];
      acc[test.project_id].push(run);
      return acc;
    },
    {},
  );

  return projects.map((project) => ({
    project,
    tests: testsByProject[project.project_id] ?? [],
    runs: runsByProject[project.project_id] ?? [],
  }));
}

export async function listRunsByEbomNode(
  ebomNodeId: string,
): Promise<TbomRun[]> {
  const [tests, runs] = await Promise.all([listTests(), listRuns()]);
  const testById = new Map(tests.map((test) => [test.test_id, test]));

  return runs.filter((run) => {
    if (run.ebom_node_id && run.ebom_node_id === ebomNodeId) {
      return true;
    }
    const parentTest = testById.get(run.test_id);
    return parentTest?.ebom_node_id === ebomNodeId;
  });
}

export function filterRunsByStatus(
  runs: TbomRun[],
  statuses: TbomRun['status'][],
): TbomRun[] {
  if (!statuses.length) {
    return runs;
  }
  const set = new Set(statuses);
  return runs.filter((run) => set.has(run.status));
}
