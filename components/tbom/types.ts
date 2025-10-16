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

export const TbomRunSchema = z.object({
  run_id: z.string(),
  test_id: z.string(),
  run_index: z.number(),
  status: z.enum(['planned', 'executing', 'completed', 'aborted']),
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

export type TbomRelation = z.infer<typeof TbomRelationSchema>;
export type TbomProject = z.infer<typeof TbomProjectSchema>;
export type TbomTest = z.infer<typeof TbomTestSchema>;
export type TbomRun = z.infer<typeof TbomRunSchema>;
export type TbomAttachment = z.infer<typeof TbomAttachmentSchema>;
export type TbomTestCardRow = z.infer<typeof TbomTestCardRowSchema>;
export type TbomTimeseriesPoint = z.infer<typeof TbomTimeseriesPointSchema>;

export const TbomProjectListSchema = z.array(TbomProjectSchema);
export const TbomTestListSchema = z.array(TbomTestSchema);
export const TbomRunListSchema = z.array(TbomRunSchema);
