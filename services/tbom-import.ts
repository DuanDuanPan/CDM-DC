import { z } from 'zod';
import { api } from './http';
import type { TbomImportSummary } from '@/components/tbom/import/types';

const ImportIssueSchema = z.object({
  id: z.string(),
  severity: z.enum(['error', 'warning']),
  code: z.string(),
  message: z.string(),
  hint: z.string().optional(),
  fileName: z.string().optional(),
  entity: z.string().optional(),
  path: z.string().optional(),
  row: z.number().optional(),
  column: z.string().optional(),
});

const ImportCountersSchema = z.object({
  imported: z.number(),
  updated: z.number(),
  skipped: z.number(),
  failed: z.number(),
});

const ImportCountersMapSchema = z.object({
  project: ImportCountersSchema,
  test: ImportCountersSchema,
  run: ImportCountersSchema,
  attachment: ImportCountersSchema,
  event: ImportCountersSchema,
  timeseries: ImportCountersSchema,
});

const ImportSummarySchema = z.object({
  logId: z.string(),
  startedAt: z.string(),
  completedAt: z.string(),
  durationMs: z.number(),
  strategy: z.enum(['incremental', 'overwrite']),
  contractType: z.enum(['minimum-package']),
  counters: ImportCountersMapSchema,
  errors: z.array(ImportIssueSchema),
  warnings: z.array(ImportIssueSchema),
  errorCsv: z.string().optional(),
  logJson: z.string().optional(),
});

const toImportEntity = (value?: string | null): TbomImportSummary['errors'][number]['entity'] => {
  if (!value) return undefined;
  if (value === 'project' || value === 'test' || value === 'run' || value === 'attachment' || value === 'event' || value === 'timeseries') {
    return value;
  }
  return undefined;
};

export async function importTbomPackage(form: FormData): Promise<TbomImportSummary> {
  const summary = await api('/tbom/import', {
    init: {
      method: 'POST',
      body: form,
    },
    schema: ImportSummarySchema,
  });
  return {
    ...summary,
    errors: summary.errors.map((issue) => ({
      ...issue,
      entity: toImportEntity(issue.entity ?? undefined),
    })),
    warnings: summary.warnings.map((issue) => ({
      ...issue,
      entity: toImportEntity(issue.entity ?? undefined),
    })),
  };
}
