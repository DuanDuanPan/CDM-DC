import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import JSZip from 'jszip';
import { writeJsonDataset, readJsonDataset, serverError } from '../utils';
import type { TbomProject, TbomRun, TbomTest } from '@/components/tbom/types';

const MAX_TOTAL_FILES = 80;
const MAX_TOTAL_BYTES = 120 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set(['json', 'csv']);

type ImportLimits = { count: number; bytes: number; };

class ImportAbortError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
    this.name = 'ImportAbortError';
  }
}

export const dynamic = 'force-dynamic';

type ImportStrategy = 'incremental' | 'overwrite';

type Manifest = {
  strategy: ImportStrategy;
  counters: Record<
    string,
    {
      total: number;
      new: number;
      updated: number;
      conflicts: number;
      unchanged: number;
    }
  >;
  differences: Array<{
    id: string;
    entity: string;
    status: 'new' | 'updated' | 'conflict' | 'unchanged';
    label: string;
    detail?: string;
  }>;
};

const inferMime = (name: string): string => {
  const lower = name.toLowerCase();
  if (lower.endsWith('.json')) return 'application/json';
  if (lower.endsWith('.csv')) return 'text/csv';
  return 'application/octet-stream';
};

const guardLimits = (limits: ImportLimits) => {
  if (limits.count > MAX_TOTAL_FILES) {
    throw new ImportAbortError('IMPORT_FILE_LIMIT', `导入文件数量超过 ${MAX_TOTAL_FILES} 个上限，可尝试分批上传。`);
  }
  if (limits.bytes > MAX_TOTAL_BYTES) {
    throw new ImportAbortError('IMPORT_SIZE_LIMIT', `导入文件总体积超过 ${(MAX_TOTAL_BYTES / (1024 * 1024)).toFixed(0)}MB 上限，请压缩或拆分后再试。`);
  }
};

const sanitizeEntryName = (name: string): string => {
  const clean = name.replace(/^\.?\//, '');
  if (!clean || clean.includes('..') || clean.includes('\\') || clean.startsWith('/')) {
    throw new ImportAbortError('IMPORT_ZIP_PATH_INVALID', `ZIP 文件包含非法路径：${name}`);
  }
  if (/[:*?"<>|]/u.test(clean)) {
    throw new ImportAbortError('IMPORT_ZIP_PATH_INVALID', `ZIP 文件包含不支持的字符：${name}`);
  }
  return clean;
};

const ensureAllowedExtension = (name: string) => {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    throw new ImportAbortError('IMPORT_UNSUPPORTED_FILE', `不支持的文件类型：${name}，仅允许 JSON/CSV。`);
  }
};

const expandZip = async (file: File, limits: ImportLimits): Promise<File[]> => {
  const buffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(buffer);
  const fileEntries = Object.values(zip.files).filter((entry) => !entry.dir);
  if (limits.count + fileEntries.length > MAX_TOTAL_FILES) {
    throw new ImportAbortError('IMPORT_FILE_LIMIT', `ZIP 文件内包含 ${fileEntries.length} 个条目，超过总文件数量上限 ${MAX_TOTAL_FILES}。`);
  }
  const expanded: File[] = [];
  for (const entry of fileEntries) {
    const cleanName = sanitizeEntryName(entry.name);
    ensureAllowedExtension(cleanName);
    const blob = await entry.async('blob');
    limits.count += 1;
    limits.bytes += blob.size;
    guardLimits(limits);
    expanded.push(
      new File([blob], cleanName, {
        type: inferMime(cleanName),
        lastModified: file.lastModified,
      }),
    );
  }
  return expanded;
};

const expandFiles = async (files: File[], limits: ImportLimits): Promise<File[]> => {
  const expanded: File[] = [];
  for (const file of files) {
    const lowerName = file.name.toLowerCase();
    if (lowerName.endsWith('.zip')) {
      if (file.size > MAX_TOTAL_BYTES) {
        throw new ImportAbortError('IMPORT_SIZE_LIMIT', `ZIP 文件 ${file.name} 体积过大，请拆分后再试。`);
      }
      const entries = await expandZip(file, limits);
      expanded.push(...entries);
      continue;
    }
    ensureAllowedExtension(file.name);
    limits.count += 1;
    limits.bytes += file.size;
    guardLimits(limits);
    expanded.push(file);
  }
  return expanded;
};

const toCounters = (
  manifest: Manifest | null,
  entity: 'project' | 'test' | 'run' | 'attachment' | 'event' | 'timeseries',
  strategy: ImportStrategy,
) => {
  const defaults = {
    imported: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
  };
  if (!manifest) {
    return defaults;
  }
  const counter = manifest.counters[entity];
  if (!counter) {
    return defaults;
  }
  const skipUpdates = strategy === 'incremental';
  return {
    imported: counter.new,
    updated: skipUpdates ? 0 : counter.updated,
    skipped: counter.unchanged + (skipUpdates ? counter.updated : 0),
    failed: counter.conflicts,
  };
};

const toIssues = (manifest: Manifest | null, kind: 'conflict' | 'warning') => {
  if (!manifest) return [];
  return manifest.differences
    .filter((diff) => (kind === 'conflict' ? diff.status === 'conflict' : diff.status === 'updated'))
    .map((diff) => ({
      id: randomUUID(),
      severity: kind === 'conflict' ? 'error' : 'warning',
      code: kind === 'conflict' ? 'IMPORT_CONFLICT' : 'IMPORT_UPDATED',
      message: diff.detail ?? diff.label,
      fileName: undefined,
      entity: diff.entity,
    }));
};

const writeErrorCsv = (manifest: Manifest | null): string | undefined => {
  if (!manifest) return undefined;
  const conflicts = manifest.differences.filter((diff) => diff.status === 'conflict');
  if (!conflicts.length) {
    return undefined;
  }
  const rows = [['entity', 'id', 'detail']];
  conflicts.forEach((diff) => {
    rows.push([diff.entity, diff.id, diff.detail ?? diff.label]);
  });
  const csv = rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');
  const base64 = Buffer.from(csv, 'utf-8').toString('base64');
  return `data:text/csv;base64,${base64}`;
};

async function mergeDataset({
  projects,
  tests,
  runs,
  strategy,
  manifest,
}: {
  projects: TbomProject[] | null;
  tests: TbomTest[] | null;
  runs: TbomRun[] | null;
  strategy: ImportStrategy;
  manifest: Manifest | null;
}) {
  const existingProjects = await readJsonDataset<TbomProject[]>('tbom_project');
  const existingTests = await readJsonDataset<TbomTest[]>('tbom_test');
  const existingRuns = await readJsonDataset<TbomRun[]>('tbom_run');

  if (projects) {
    const next = new Map(existingProjects.map((item) => [item.project_id, item]));
    projects.forEach((project) => {
      if (strategy === 'incremental' && next.has(project.project_id)) {
        return;
      }
      next.set(project.project_id, project);
    });
    writeJsonDataset('tbom_project', Array.from(next.values()));
  }

  if (tests) {
    const next = new Map(existingTests.map((item) => [item.test_id, item]));
    tests.forEach((test) => {
      if (manifest?.differences.some((diff) => diff.id === test.test_id && diff.status === 'conflict')) {
        return;
      }
      if (strategy === 'incremental' && next.has(test.test_id)) {
        return;
      }
      next.set(test.test_id, test);
    });
    writeJsonDataset('tbom_test', Array.from(next.values()));
  }

  if (runs) {
    const next = new Map(existingRuns.map((item) => [item.run_id, item]));
    runs.forEach((run) => {
      if (manifest?.differences.some((diff) => diff.id === run.run_id && diff.status === 'conflict')) {
        return;
      }
      if (strategy === 'incremental' && next.has(run.run_id)) {
        return;
      }
      next.set(run.run_id, run);
    });
    writeJsonDataset('tbom_run', Array.from(next.values()));
  }
}

export async function POST(request: Request) {
  try {
    const startedAt = new Date();
    const form = await request.formData();
    const rawFiles = form.getAll('files').filter((value): value is File => value instanceof File);
    if (!rawFiles.length) {
      throw new ImportAbortError('IMPORT_NO_FILES', '未选择任何导入文件。');
    }
    const contractType = String(form.get('contractType') || 'minimum-package');
    const strategy = String(form.get('strategy') || 'incremental') === 'overwrite' ? 'overwrite' : 'incremental';
    const manifest = form.get('manifest') ? (JSON.parse(String(form.get('manifest'))) as Manifest) : null;

    const limits: ImportLimits = { count: 0, bytes: 0 };
    const expanded = await expandFiles(rawFiles, limits);
    let projects: TbomProject[] | null = null;
    let tests: TbomTest[] | null = null;
    let runs: TbomRun[] | null = null;

    for (const file of expanded) {
      const lower = file.name.toLowerCase();
      if (lower === 'tbom_project.json') {
        const text = await file.text();
        projects = JSON.parse(text) as TbomProject[];
        continue;
      }
      if (lower === 'tbom_test.json') {
        const text = await file.text();
        tests = JSON.parse(text) as TbomTest[];
        continue;
      }
      if (lower === 'tbom_run.json') {
        const text = await file.text();
        runs = JSON.parse(text) as TbomRun[];
      }
    }

    if (!projects || !tests || !runs) {
      throw new ImportAbortError('IMPORT_DATASET_INCOMPLETE', '缺少 tbom_project.json、tbom_test.json 或 tbom_run.json 文件，无法执行导入。');
    }

    await mergeDataset({
      projects,
      tests,
      runs,
      strategy,
      manifest,
    });

    const completedAt = new Date();
    const summary = {
      logId: randomUUID(),
      startedAt: startedAt.toISOString(),
      completedAt: completedAt.toISOString(),
      durationMs: completedAt.getTime() - startedAt.getTime(),
      strategy,
      contractType: contractType as 'minimum-package',
      counters: {
        project: toCounters(manifest, 'project', strategy),
        test: toCounters(manifest, 'test', strategy),
        run: toCounters(manifest, 'run', strategy),
        attachment: toCounters(manifest, 'attachment', strategy),
        event: toCounters(manifest, 'event', strategy),
        timeseries: toCounters(manifest, 'timeseries', strategy),
      },
      errors: toIssues(manifest, 'conflict'),
      warnings: toIssues(manifest, 'warning'),
      errorCsv: writeErrorCsv(manifest),
      logJson: undefined,
    };

    return NextResponse.json(summary);
  } catch (error) {
    if (error instanceof ImportAbortError) {
      return NextResponse.json({ error: error.code, message: error.message }, { status: 400 });
    }
    return serverError(error);
  }
}
