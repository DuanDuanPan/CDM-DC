import { z } from 'zod';
import { api } from './http';

const relationSchema = z.object({
  kind: z.enum(['requirement', 'ebom', 'simulation']).or(z.string()),
  ref_id: z.string(),
});

const projectSchema = z.object({
  project_id: z.string(),
  type: z.string(),
  title: z.string(),
  objectives: z.string(),
  input_docs: z.array(z.string()),
  baseline_id: z.string(),
  relations: z.array(relationSchema).default([]),
});

const testSchema = z.object({
  test_id: z.string(),
  project_id: z.string(),
  name: z.string(),
  purpose: z.string(),
  spec_refs: z.array(z.string()).default([]),
  ebom_node_id: z.string(),
  ebom_path: z.string().optional(),
});

const environmentValue = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
]);

const runSchema = z.object({
  run_id: z.string(),
  test_id: z.string(),
  run_index: z.number(),
  planned_at: z.string(),
  executed_at: z.string().optional(),
  operator: z.string().optional(),
  environment: z.record(environmentValue).default({}),
  test_item_sn: z.string().optional(),
  assembly_bom_id: z.string().optional(),
  ebom_node_id: z.string().optional(),
  attachments: z.array(z.string()).default([]),
});

const projectsResponseSchema = z.object({
  data: z.array(projectSchema),
});

const testsResponseSchema = z.object({
  data: z.array(testSchema),
});

const runsResponseSchema = z.object({
  data: z.array(runSchema),
});

export type TbomProject = z.infer<typeof projectSchema>;
export type TbomTest = z.infer<typeof testSchema>;
export type TbomRun = z.infer<typeof runSchema>;

const TBOM_BASE_PATH = '/tbom';

export async function listProjects(): Promise<TbomProject[]> {
  const result = await api(`${TBOM_BASE_PATH}/projects`, {
    schema: projectsResponseSchema,
  });
  return result.data.map((project) => ({
    ...project,
    relations: project.relations ?? [],
  })) as TbomProject[];
}

export async function listTests(): Promise<TbomTest[]> {
  const result = await api(`${TBOM_BASE_PATH}/tests`, {
    schema: testsResponseSchema,
  });
  return result.data.map((test) => ({
    ...test,
    spec_refs: test.spec_refs ?? [],
  })) as TbomTest[];
}

export async function listRuns(): Promise<TbomRun[]> {
  const result = await api(`${TBOM_BASE_PATH}/runs`, {
    schema: runsResponseSchema,
  });
  return result.data.map((run) => ({
    ...run,
    attachments: run.attachments ?? [],
    environment: run.environment ?? {},
  })) as TbomRun[];
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
