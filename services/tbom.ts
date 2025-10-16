import { z } from 'zod';
import type { TbomProject, TbomRun, TbomTest } from '../components/tbom/types';
import { TbomProjectListSchema, TbomRunListSchema, TbomTestListSchema } from '../components/tbom/types';
import { api } from './http';

const projectsResponseSchema = z.object({
  data: TbomProjectListSchema,
});

const testsResponseSchema = z.object({
  data: TbomTestListSchema,
});

const runsResponseSchema = z.object({
  data: TbomRunListSchema,
});

const TBOM_BASE_PATH = '/tbom';

export async function listProjects(): Promise<TbomProject[]> {
  const result = await api(`${TBOM_BASE_PATH}/projects`, {
    schema: projectsResponseSchema,
  });
  return result.data.map((project) => ({
    ...project,
    relations: project.relations ?? [],
  }));
}

export async function listTests(): Promise<TbomTest[]> {
  const result = await api(`${TBOM_BASE_PATH}/tests`, {
    schema: testsResponseSchema,
  });
  return result.data.map((test) => ({
    ...test,
    spec_refs: test.spec_refs ?? [],
  }));
}

export async function listRuns(): Promise<TbomRun[]> {
  const result = await api(`${TBOM_BASE_PATH}/runs`, {
    schema: runsResponseSchema,
  });
  return result.data.map((run) => ({
    ...run,
    attachments: run.attachments ?? [],
    environment: run.environment ?? {},
  }));
}

export async function fetchTimeseries(runId: string): Promise<string> {
  return api(`${TBOM_BASE_PATH}/timeseries/${encodeURIComponent(runId)}`, {
    parseAs: 'text',
  });
}

export async function fetchEvents(runId: string): Promise<string> {
  return api(`${TBOM_BASE_PATH}/events/${encodeURIComponent(runId)}`, {
    parseAs: 'text',
  });
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
