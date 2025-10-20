import { z } from 'zod';

export const TbomRelationSchema = z.object({
  kind: z.string(),
  ref_id: z.string(),
});

const EnvironmentValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
]);

export const TbomEnvironmentSchema = z.record(EnvironmentValueSchema);

export const TbomProjectSchema = z.object({
  project_id: z.string(),
  type: z.string(),
  title: z.string(),
  objectives: z.string(),
  input_docs: z.array(z.string()),
  baseline_id: z.string(),
  relations: z.array(TbomRelationSchema).default([]),
});

export const TbomTestSchema = z.object({
  test_id: z.string(),
  project_id: z.string(),
  name: z.string(),
  purpose: z.string(),
  spec_refs: z.array(z.string()).default([]),
  ebom_node_id: z.string(),
  ebom_path: z.string().optional(),
});

export const TBOM_RUN_STATUSES = ['planned', 'executing', 'completed', 'aborted'] as const;

export const TbomRunSchema = z.object({
  run_id: z.string(),
  test_id: z.string(),
  run_index: z.number(),
  status: z.enum(TBOM_RUN_STATUSES),
  planned_at: z.string(),
  executed_at: z.string().optional(),
  operator: z.string().optional(),
  environment: TbomEnvironmentSchema.default({}),
  test_item_sn: z.string().optional(),
  assembly_bom_id: z.string().optional(),
  attachments: z.array(z.string()).default([]),
  ebom_node_id: z.string().optional(),
});

export const TbomAttachmentSchema = z.object({
  file_id: z.string(),
  type: z.enum(['image', 'video', 'file']).or(z.string()),
  path: z.string(),
  ts: z.string(),
  desc: z.string(),
  run_id: z.string(),
});

export const TbomRunEventSchema = z.object({
  event_id: z.string(),
  run_id: z.string(),
  category: z.string(),
  severity: z.string(),
  start_ts: z.string(),
  end_ts: z.string().optional(),
  desc: z.string().optional(),
  code: z.string().optional(),
});

export const TbomTestCardRowSchema = z.object({
  run_id: z.string(),
  param_name: z.string(),
  value: z.string(),
  unit: z.string().optional(),
  source: z.string().optional(),
});

export const TbomTimeseriesPointSchema = z
  .object({
    ts: z.string(),
  })
  .catchall(z.number());

export const TbomTimeseriesSampleSchema = z.object({
  ts: z.string(),
  value: z.number(),
});

export const TbomTimeseriesChannelSchema = z.object({
  channel: z.string(),
  unit: z.string().optional(),
  sampleRate: z.number().nullable().optional(),
  samples: z.array(TbomTimeseriesSampleSchema),
});

export type TbomRelation = z.infer<typeof TbomRelationSchema>;
export type TbomProject = z.infer<typeof TbomProjectSchema>;
export type TbomTest = z.infer<typeof TbomTestSchema>;
export type TbomRun = z.infer<typeof TbomRunSchema>;
export type TbomRunStatus = (typeof TBOM_RUN_STATUSES)[number];
export type TbomAttachment = z.infer<typeof TbomAttachmentSchema>;
export type TbomRunEvent = z.infer<typeof TbomRunEventSchema>;
export type TbomTestCardRow = z.infer<typeof TbomTestCardRowSchema>;
export type TbomTimeseriesPoint = z.infer<typeof TbomTimeseriesPointSchema>;
export type TbomTimeseriesSample = z.infer<typeof TbomTimeseriesSampleSchema>;
export type TbomTimeseriesChannel = z.infer<typeof TbomTimeseriesChannelSchema>;

export const TbomProjectListSchema = z.array(TbomProjectSchema);
export const TbomTestListSchema = z.array(TbomTestSchema);
export const TbomRunListSchema = z.array(TbomRunSchema);
export const TbomAttachmentListSchema = z.array(TbomAttachmentSchema);
export const TbomRunEventListSchema = z.array(TbomRunEventSchema);
