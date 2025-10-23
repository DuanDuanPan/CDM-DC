'use client';

import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import { z, ZodError } from 'zod';
import { parseCsvRecords } from '@/utils/csv';
import { ApiError } from '@/services/http';
import type { TbomProject, TbomRun, TbomTest } from '@/components/tbom/types';
import {
  TbomProjectListSchema,
  TbomRunListSchema,
  TbomTestListSchema,
} from '@/components/tbom/types';
import {
  TBOM_IMPORT_CONTRACTS,
  type TbomImportContractType,
  type TbomImportDifference,
  type TbomImportIssue,
  type TbomImportLogEntry,
  type TbomImportMappingState,
  type TbomImportStrategy,
  type TbomImportSummary,
  type TbomImportValidationReport,
  type TbomImportWizardState,
} from '../import/types';
import { importTbomPackage } from '@/services/tbom-import';

const MAX_TOTAL_FILES = 80;
const MAX_TOTAL_BYTES = 120 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set(['json', 'csv']);
const YIELD_INTERVAL = 5;

class ImportLimitError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
    this.name = 'ImportLimitError';
  }
}

const guardLimits = (limits: ImportLimits) => {
  if (limits.count > MAX_TOTAL_FILES) {
    throw new ImportLimitError('IMPORT_FILE_LIMIT', `导入文件数量已超过 ${MAX_TOTAL_FILES} 个上限，可尝试分批上传。`);
  }
  if (limits.bytes > MAX_TOTAL_BYTES) {
    throw new ImportLimitError('IMPORT_SIZE_LIMIT', `导入文件总体积已超过 ${(MAX_TOTAL_BYTES / (1024 * 1024)).toFixed(0)}MB 上限，请压缩或拆分后再试。`);
  }
};

const sanitizeEntryName = (name: string): string => {
  const clean = name.replace(/^\.?\//, '');
  if (!clean || clean.includes('..') || clean.includes('\\') || clean.startsWith('/')) {
    throw new ImportLimitError('IMPORT_ZIP_PATH_INVALID', `ZIP 文件包含非法路径：${name}`);
  }
  if (/[:*?"<>|]/u.test(clean)) {
    throw new ImportLimitError('IMPORT_ZIP_PATH_INVALID', `ZIP 文件包含不支持的字符：${name}`);
  }
  return clean;
};

const ensureAllowedExtension = (name: string) => {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    throw new ImportLimitError('IMPORT_UNSUPPORTED_FILE', `不支持的文件类型：${name}，仅允许 JSON/CSV。`);
  }
};

const yieldToBrowser = async () => {
  await new Promise((resolve) => setTimeout(resolve, 0));
};

type ParsedTbomPayload = {
  projects: TbomProject[];
  tests: TbomTest[];
  runs: TbomRun[];
  attachments: Array<Record<string, string>>;
  events: Record<string, Record<string, string>[]>;
  timeseries: Record<string, Record<string, string>[]>;
};

type UseTbomImportStateOptions = {
  loadExistingData: () => Promise<{ projects: TbomProject[]; tests: TbomTest[]; runs: TbomRun[] }>;
  onDataMutated?: (data: { projects: TbomProject[]; tests: TbomTest[]; runs: TbomRun[] }) => void;
};

type ImportLimits = {
  count: number;
  bytes: number;
};

type Action =
  | { type: 'open'; logs: TbomImportLogEntry[] }
  | { type: 'close' }
  | { type: 'set-contract'; contract: TbomImportContractType }
  | { type: 'set-files'; files: File[] }
  | { type: 'set-validation'; report: TbomImportValidationReport | null }
  | { type: 'set-mapping'; mapping: TbomImportMappingState | null }
  | { type: 'set-summary'; summary: TbomImportSummary | null }
  | { type: 'set-step'; step: TbomImportWizardState['step'] }
  | { type: 'set-processing'; value: boolean }
  | { type: 'set-error'; error: string | null }
  | { type: 'set-logs'; logs: TbomImportLogEntry[] }
  | { type: 'set-progress'; message: string | null }
  | { type: 'reset-intermediate' };

const INITIAL_STATE: TbomImportWizardState = {
  isOpen: false,
  step: 'contract',
  isProcessing: false,
  progressMessage: null,
  contractType: null,
  selectedFiles: [],
  validationReport: null,
  mappingState: null,
  summary: null,
  error: null,
  logs: [],
};

const LOG_STORAGE_KEY = 'tbom.import.logs';
const LOG_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const FILE_RULES = [
  { pattern: /^tbom_project\.json$/i, entity: 'project', required: true },
  { pattern: /^tbom_test\.json$/i, entity: 'test', required: true },
  { pattern: /^tbom_run\.json$/i, entity: 'run', required: true },
  { pattern: /^attachments\.csv$/i, entity: 'attachment', required: true },
  { pattern: /^test_card\.csv$/i, entity: 'attachment', required: false },
  { pattern: /^process_event.*\.csv$/i, entity: 'event', required: true },
  { pattern: /^result_timeseries.*\.csv$/i, entity: 'timeseries', required: false },
];

function reducer(state: TbomImportWizardState, action: Action): TbomImportWizardState {
  switch (action.type) {
    case 'open':
      return {
        ...INITIAL_STATE,
        isOpen: true,
        logs: action.logs,
      };
    case 'close':
      return {
        ...state,
        isOpen: false,
        step: 'contract',
        isProcessing: false,
        error: null,
        progressMessage: null,
      };
    case 'set-contract':
      return {
        ...state,
        contractType: action.contract,
      };
    case 'set-files':
      return {
        ...state,
        selectedFiles: action.files,
      };
    case 'set-validation':
      return {
        ...state,
        validationReport: action.report,
      };
    case 'set-mapping':
      return {
        ...state,
        mappingState: action.mapping,
      };
    case 'set-summary':
      return {
        ...state,
        summary: action.summary,
      };
    case 'set-step':
      return {
        ...state,
        step: action.step,
      };
    case 'set-processing':
      return {
        ...state,
        isProcessing: action.value,
      };
    case 'set-error':
      return {
        ...state,
        error: action.error,
      };
    case 'set-progress':
      return {
        ...state,
        progressMessage: action.message,
      };
    case 'set-logs':
      return {
        ...state,
        logs: action.logs,
      };
    case 'reset-intermediate':
      return {
        ...state,
        validationReport: null,
        mappingState: null,
        summary: null,
      };
    default:
      return state;
  }
}

const toRecordCounts = () => ({
  total: 0,
  new: 0,
  updated: 0,
  conflicts: 0,
  unchanged: 0,
});

const ISSUE_SEVERITY_ORDER: Record<TbomImportIssue['severity'], number> = {
  error: 0,
  warning: 1,
};

const sortIssues = (issues: TbomImportIssue[]) =>
  [...issues].sort((a, b) => {
    if (ISSUE_SEVERITY_ORDER[a.severity] !== ISSUE_SEVERITY_ORDER[b.severity]) {
      return ISSUE_SEVERITY_ORDER[a.severity] - ISSUE_SEVERITY_ORDER[b.severity];
    }
    return a.message.localeCompare(b.message, 'zh-CN');
  });

const safeRandomId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
};

const readStoredLogs = (): TbomImportLogEntry[] => {
  if (typeof window === 'undefined') {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(LOG_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as TbomImportLogEntry[];
    const now = Date.now();
    return parsed.filter((entry) => now - Date.parse(entry.createdAt) <= LOG_TTL_MS);
  } catch {
    return [];
  }
};

const persistLogs = (logs: TbomImportLogEntry[]) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(logs));
  } catch {
    // ignore storage quota errors
  }
};

const inferMime = (name: string): string => {
  const lower = name.toLowerCase();
  if (lower.endsWith('.json')) return 'application/json';
  if (lower.endsWith('.csv')) return 'text/csv';
  return 'application/octet-stream';
};

const expandZip = async (
  file: File,
  limits: ImportLimits,
  onEntry?: (info: { name: string; index: number; total: number }) => void,
): Promise<File[]> => {
  const JSZip = (await import('jszip')).default;
  const buffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(buffer);
  const entriesMeta = Object.values(zip.files).filter((entry) => !entry.dir);
  if (!entriesMeta.length) {
    return [];
  }
  if (limits.count + entriesMeta.length > MAX_TOTAL_FILES) {
    throw new ImportLimitError('IMPORT_FILE_LIMIT', `ZIP 文件内包含 ${entriesMeta.length} 个条目，超过总文件数量上限 ${MAX_TOTAL_FILES}。`);
  }

  const expanded: File[] = [];
  for (let index = 0; index < entriesMeta.length; index += 1) {
    const entry = entriesMeta[index];
    const cleanName = sanitizeEntryName(entry.name);
    ensureAllowedExtension(cleanName);
    onEntry?.({ name: cleanName, index, total: entriesMeta.length });
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
    if ((index + 1) % YIELD_INTERVAL === 0) {
      await yieldToBrowser();
    }
  }
  return expanded;
};

const expandFiles = async (
  files: File[],
  limits: ImportLimits,
  onProgress?: (message: string) => void,
): Promise<File[]> => {
  const expanded: File[] = [];
  for (let index = 0; index < files.length; index += 1) {
    const file = files[index];
    const lowerName = file.name.toLowerCase();
    if (lowerName.endsWith('.zip')) {
      if (file.size > MAX_TOTAL_BYTES) {
        throw new ImportLimitError('IMPORT_SIZE_LIMIT', `ZIP 文件 ${file.name} 体积过大，请拆分后再试。`);
      }
      onProgress?.(`正在解压 ${file.name} (${index + 1}/${files.length})`);
      const entries = await expandZip(
        file,
        limits,
        ({ name, index: entryIndex, total }) => {
          onProgress?.(`正在解压 ${file.name} · ${name} (${entryIndex + 1}/${total})`);
        },
      );
      expanded.push(...entries);
    } else {
      ensureAllowedExtension(file.name);
      limits.count += 1;
      limits.bytes += file.size;
      guardLimits(limits);
      expanded.push(file);
    }
    if ((index + 1) % YIELD_INTERVAL === 0) {
      await yieldToBrowser();
    }
  }
  return expanded;
};

type FileReaderTask = {
  resolve: (text: string) => void;
  reject: (error: Error) => void;
  onProgress?: (loaded: number, total: number) => void;
};

const parseJson = async <T>(
  file: File,
  schema: z.ZodSchema<T>,
  readText: (file: File, label: string) => Promise<string>,
): Promise<{ data: T | null; issues: TbomImportIssue[] }> => {
  try {
    const text = await readText(file, `正在读取 ${file.name}`);
    const raw = JSON.parse(text);
    const parsed = schema.parse(raw);
    return { data: parsed, issues: [] };
  } catch (error) {
    if (error instanceof ZodError) {
      const issues = error.issues.map<TbomImportIssue>((issue) => ({
        id: safeRandomId(),
        severity: 'error',
        code: 'ZOD_VALIDATION_ERROR',
        message: issue.message,
        hint: issue.path.join('.'),
        fileName: file.name,
      }));
      return { data: null, issues };
    }
    return {
      data: null,
      issues: [
        {
          id: safeRandomId(),
          severity: 'error',
          code: 'JSON_PARSE_ERROR',
          message: `文件 ${file.name} 不是合法的 JSON：${error instanceof Error ? error.message : String(error)}`,
          fileName: file.name,
        },
      ],
    };
  }
};

const parseCsv = async (
  file: File,
  readText: (file: File, label: string) => Promise<string>,
): Promise<{ records: Record<string, string>[]; issues: TbomImportIssue[] }> => {
  try {
    const text = await readText(file, `正在读取 ${file.name}`);
    const records = parseCsvRecords(text);
    return { records, issues: [] };
  } catch (error) {
    return {
      records: [],
      issues: [
        {
          id: safeRandomId(),
          severity: 'error',
          code: 'CSV_PARSE_ERROR',
          message: `文件 ${file.name} 解析失败：${error instanceof Error ? error.message : String(error)}`,
          fileName: file.name,
        },
      ],
    };
  }
};

const ensureColumns = (records: Record<string, string>[], columns: string[], fileName: string): TbomImportIssue[] => {
  const first = records[0];
  if (!first) {
    return [
      {
        id: safeRandomId(),
        severity: 'warning',
        code: 'CSV_EMPTY',
        message: `文件 ${fileName} 为空，未检测到记录。`,
        fileName,
      },
    ];
  }
  return columns
    .filter((column) => !(column in first))
    .map<TbomImportIssue>((column) => ({
      id: safeRandomId(),
      severity: 'error',
      code: 'CSV_COLUMN_MISSING',
      message: `缺少必填列 ${column}`,
      fileName,
    }));
};

const buildCounters = () => ({
  project: toRecordCounts(),
  test: toRecordCounts(),
  run: toRecordCounts(),
  attachment: toRecordCounts(),
  event: toRecordCounts(),
  timeseries: toRecordCounts(),
});

export const useTbomImportState = ({ loadExistingData, onDataMutated }: UseTbomImportStateOptions) => {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const rawFilesRef = useRef<File[]>([]);
  const parsedPayloadRef = useRef<ParsedTbomPayload | null>(null);
  const expandedFilesRef = useRef<File[]>([]);
  const fileReaderWorkerRef = useRef<Worker | null>(null);
  const workerTasksRef = useRef<Map<string, FileReaderTask>>(new Map());

  const open = useCallback(() => {
    const logs = readStoredLogs();
    dispatch({ type: 'open', logs });
  }, []);

  const close = useCallback(() => {
    dispatch({ type: 'close' });
    rawFilesRef.current = [];
    expandedFilesRef.current = [];
    parsedPayloadRef.current = null;
  }, []);

  const selectContract = useCallback((contract: TbomImportContractType) => {
    dispatch({ type: 'set-contract', contract });
  }, []);

  const selectFiles = useCallback((files: File[]) => {
    rawFilesRef.current = files;
    dispatch({ type: 'reset-intermediate' });
    dispatch({ type: 'set-files', files });
  }, []);

  const refreshLogs = useCallback(() => {
    const logs = readStoredLogs();
    dispatch({ type: 'set-logs', logs });
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const worker = new Worker(new URL('../import/workers/fileReader.worker.ts', import.meta.url), {
      type: 'module',
    });
    const tasks = workerTasksRef.current;
    worker.onmessage = (event) => {
      const data = event.data as
        | { type: 'progress'; id: string; loaded: number; total: number }
        | { type: 'result'; id: string; text: string }
        | { type: 'error'; id: string; message: string };
      const task = tasks.get(data.id);
      if (!task) {
        return;
      }
      if (data.type === 'progress') {
        task.onProgress?.(data.loaded, data.total);
        return;
      }
      tasks.delete(data.id);
      if (data.type === 'result') {
        task.resolve(data.text);
      } else if (data.type === 'error') {
        task.reject(new ImportLimitError('IMPORT_READ_ERROR', data.message));
      }
    };
    fileReaderWorkerRef.current = worker;
    return () => {
      worker.terminate();
      workerTasksRef.current.forEach((task) => task.reject(new Error('文件解析已取消')));
      workerTasksRef.current.clear();
      fileReaderWorkerRef.current = null;
    };
  }, []);

  const readFileText = useCallback(
    (file: File, label: string) =>
      new Promise<string>((resolve, reject) => {
        const worker = fileReaderWorkerRef.current;
        if (!worker) {
          reject(new Error('文件解析线程尚未就绪，请稍后再试。'));
          return;
        }
        const id = safeRandomId();
        workerTasksRef.current.set(id, {
          resolve: (text) => {
            resolve(text);
          },
          reject: (error) => {
            reject(error);
          },
          onProgress: (loaded, total) => {
            const percent = total ? Math.min(100, Math.round((loaded / total) * 100)) : 100;
            dispatch({ type: 'set-progress', message: `${label} (${percent}%)` });
          },
        });
        try {
          worker.postMessage({ id, file });
        } catch (error) {
          workerTasksRef.current.delete(id);
          reject(error as Error);
        }
      }),
    [],
  );

  const normalizeFiles = useCallback(async () => {
    const limits: ImportLimits = { count: 0, bytes: 0 };
    const expanded = await expandFiles(
      rawFilesRef.current,
      limits,
      (message) => dispatch({ type: 'set-progress', message }),
    );
    expandedFilesRef.current = expanded;
    dispatch({ type: 'set-files', files: expanded });
    return expanded;
  }, []);

  const validate = useCallback(async (): Promise<TbomImportValidationReport> => {
    dispatch({ type: 'set-processing', value: true });
    dispatch({ type: 'set-error', error: null });
    dispatch({ type: 'set-progress', message: '正在解析导入文件…' });
    try {
      const files = await normalizeFiles();
      dispatch({ type: 'set-progress', message: '正在校验文件结构…' });

      const issues: TbomImportIssue[] = [];
      const inspected: TbomImportValidationReport['inspectedFiles'] = [];

      const missingRequired: string[] = [];
      FILE_RULES.forEach((rule) => {
        const hasMatch = files.some((file) => rule.pattern.test(file.name));
        if (rule.required && !hasMatch) {
          missingRequired.push(rule.pattern.source.replace(/\\|\^|\$/g, '').replace('.*', '*'));
        }
      });

      let projects: TbomProject[] = [];
      let tests: TbomTest[] = [];
      let runs: TbomRun[] = [];
      let attachments: Array<Record<string, string>> = [];
      const events: ParsedTbomPayload['events'] = {};
      const timeseries: ParsedTbomPayload['timeseries'] = {};

    for (let index = 0; index < files.length; index += 1) {
      const file = files[index];
      const lower = file.name.toLowerCase();

      if (lower === 'tbom_project.json') {
        const { data, issues: parseIssues } = await parseJson(file, TbomProjectListSchema, readFileText);
        issues.push(...parseIssues);
        if (data) {
          projects = data.map((project) => ({
            ...project,
            relations: project.relations ?? [],
          }));
          inspected.push({
            name: file.name,
              kind: 'project',
              recordCount: data.length,
              byteSize: file.size,
            });
        }
      } else if (lower === 'tbom_test.json') {
        const { data, issues: parseIssues } = await parseJson(file, TbomTestListSchema, readFileText);
        issues.push(...parseIssues);
        if (data) {
          tests = data.map((test) => ({
            ...test,
            spec_refs: test.spec_refs ?? [],
          }));
          inspected.push({
            name: file.name,
              kind: 'test',
              recordCount: data.length,
              byteSize: file.size,
            });
        }
      } else if (lower === 'tbom_run.json') {
        const { data, issues: parseIssues } = await parseJson(file, TbomRunListSchema, readFileText);
        issues.push(...parseIssues);
        if (data) {
          runs = data.map((run) => ({
            ...run,
            attachments: run.attachments ?? [],
            environment: run.environment ?? {},
          }));
          inspected.push({
            name: file.name,
              kind: 'run',
              recordCount: data.length,
              byteSize: file.size,
          });
        }
      } else if (lower === 'attachments.csv') {
        const { records, issues: csvIssues } = await parseCsv(file, readFileText);
        issues.push(...csvIssues);
        if (!csvIssues.some((item) => item.severity === 'error')) {
          const columnIssues = ensureColumns(records, ['file_id', 'run_id', 'path'], file.name);
          issues.push(...columnIssues);
          attachments = records;
            inspected.push({
              name: file.name,
              kind: 'attachment',
              recordCount: records.length,
              byteSize: file.size,
            });
        }
      } else if (/^process_event.*\.csv$/i.test(file.name)) {
        const { records, issues: csvIssues } = await parseCsv(file, readFileText);
        issues.push(...csvIssues);
        if (!csvIssues.some((item) => item.severity === 'error')) {
          const columnIssues = ensureColumns(records, ['run_id', 'event_id', 'category', 'severity', 'start_ts'], file.name);
          issues.push(...columnIssues);
          events[file.name] = records;
            inspected.push({
              name: file.name,
              kind: 'event',
              recordCount: records.length,
              byteSize: file.size,
            });
        }
      } else if (/^result_timeseries.*\.csv$/i.test(file.name)) {
        const { records, issues: csvIssues } = await parseCsv(file, readFileText);
        issues.push(...csvIssues);
        if (!csvIssues.some((item) => item.severity === 'error')) {
          if (!records.length || !('ts' in records[0])) {
            issues.push({
              id: safeRandomId(),
                severity: 'error',
                code: 'CSV_COLUMN_MISSING',
                message: `文件 ${file.name} 缺少列 ts`,
                fileName: file.name,
              });
            }
            timeseries[file.name] = records;
            inspected.push({
              name: file.name,
              kind: 'timeseries',
              recordCount: records.length,
              byteSize: file.size,
            });
          }
        } else if (lower === 'test_card.csv') {
          const { records, issues: csvIssues } = await parseCsv(file, readFileText);
          issues.push(...csvIssues);
          inspected.push({
            name: file.name,
            kind: 'attachment',
            recordCount: records.length,
            byteSize: file.size,
          });
        }

        if ((index + 1) % YIELD_INTERVAL === 0) {
          await yieldToBrowser();
        }
        dispatch({ type: 'set-progress', message: '正在校验文件结构…' });
      }

      if (!projects.length || !tests.length || !runs.length) {
        issues.push({
          id: safeRandomId(),
          severity: 'error',
          code: 'DATASET_INCOMPLETE',
          message: '请确保 JSON 主档文件均已提供（项目、试验、运行）。',
        });
      } else {
        const projectIds = new Set(projects.map((item) => item.project_id));
        const testIds = new Set(tests.map((item) => item.test_id));

        tests.forEach((test) => {
          if (!projectIds.has(test.project_id)) {
            issues.push({
              id: safeRandomId(),
              severity: 'error',
              code: 'REFERENCE_MISSING_PROJECT',
              message: `试验 ${test.test_id} 引用不存在的项目 ${test.project_id}`,
              fileName: 'tbom_test.json',
              entity: 'test',
            });
          }
        });

        runs.forEach((run) => {
          if (!testIds.has(run.test_id)) {
            issues.push({
              id: safeRandomId(),
              severity: 'error',
              code: 'REFERENCE_MISSING_TEST',
              message: `运行 ${run.run_id} 引用不存在的试验 ${run.test_id}`,
              fileName: 'tbom_run.json',
              entity: 'run',
            });
          }
        });

        attachments.forEach((attachment) => {
          const runId = attachment.run_id;
          if (runId && !runs.some((run) => run.run_id === runId)) {
            issues.push({
              id: safeRandomId(),
              severity: 'warning',
              code: 'ATTACHMENT_ORPHAN',
              message: `附件 ${attachment.file_id ?? '（未提供 file_id）'} 引用不存在的运行 ${runId}`,
              fileName: 'attachments.csv',
              entity: 'attachment',
            });
          }
        });
      }

      parsedPayloadRef.current = {
        projects,
        tests,
        runs,
        attachments,
        events,
        timeseries,
      };

      const report: TbomImportValidationReport = {
        issues: sortIssues(issues),
        missingFiles: missingRequired,
        inspectedFiles: inspected,
      };
      dispatch({ type: 'set-validation', report });
      dispatch({ type: 'set-step', step: 'validation' });
      return report;
    } catch (error) {
      const message = error instanceof ImportLimitError
        ? error.message
        : error instanceof Error
        ? error.message
        : '导入校验失败，请稍后再试。';
      dispatch({ type: 'set-validation', report: null });
      dispatch({ type: 'set-error', error: message });
      throw error;
    } finally {
      dispatch({ type: 'set-progress', message: null });
      dispatch({ type: 'set-processing', value: false });
    }
  }, [normalizeFiles, dispatch]);

  const toDifference = (
    id: string,
    entity: TbomImportDifference['entity'],
    status: TbomImportDifference['status'],
    label: string,
    detail?: string,
  ): TbomImportDifference => ({
    id,
    entity,
    status,
    label,
    detail,
  });

  const prepareMapping = useCallback(async (): Promise<TbomImportMappingState> => {
    if (!parsedPayloadRef.current) {
      throw new Error('尚未完成文件校验，无法进入映射确认');
    }
    dispatch({ type: 'set-processing', value: true });
    dispatch({ type: 'set-progress', message: '正在分析导入差异…' });
    try {
      const existing = await loadExistingData();
      const differences: TbomImportDifference[] = [];
      const counters = buildCounters();

      const { projects, tests, runs } = parsedPayloadRef.current;

      const existingProjects = new Map(existing.projects.map((item) => [item.project_id, item]));
      const existingTests = new Map(existing.tests.map((item) => [item.test_id, item]));
      const existingRuns = new Map(existing.runs.map((item) => [item.run_id, item]));

      let processed = 0;
      for (const project of projects) {
        const prev = existingProjects.get(project.project_id);
        counters.project.total += 1;
        if (!prev) {
          counters.project.new += 1;
          differences.push(
            toDifference(
              project.project_id,
              'project',
              'new',
              `${project.project_id} · ${project.title}`,
            ),
          );
        } else {
          const shallow = JSON.stringify(prev);
          const next = JSON.stringify(project);
          if (shallow === next) {
            counters.project.unchanged += 1;
          } else {
            counters.project.updated += 1;
            differences.push(
              toDifference(
                project.project_id,
                'project',
                'updated',
                `${project.project_id} · ${project.title}`,
                '属性内容将被刷新（保持追溯键不变）',
              ),
            );
          }
        }
        processed += 1;
        if (processed % YIELD_INTERVAL === 0) {
          await yieldToBrowser();
        }
      }

      processed = 0;
      for (const test of tests) {
        const prev = existingTests.get(test.test_id);
        counters.test.total += 1;
        if (!prev) {
          counters.test.new += 1;
          differences.push(
            toDifference(
              test.test_id,
              'test',
              'new',
              `${test.test_id} · ${test.name}`,
              `挂接项目 ${test.project_id}`,
            ),
          );
        } else if (prev.project_id !== test.project_id) {
          counters.test.conflicts += 1;
          differences.push(
            toDifference(
              test.test_id,
              'test',
              'conflict',
              `${test.test_id} · ${test.name}`,
              `导入请求挂接项目 ${test.project_id}，现有数据挂接 ${prev.project_id}`,
            ),
          );
        } else {
          const shallow = JSON.stringify(prev);
          const next = JSON.stringify(test);
          if (shallow === next) {
            counters.test.unchanged += 1;
          } else {
            counters.test.updated += 1;
            differences.push(
              toDifference(
                test.test_id,
                'test',
                'updated',
                `${test.test_id} · ${test.name}`,
                '试验元数据将被覆盖',
              ),
            );
          }
        }
        processed += 1;
        if (processed % YIELD_INTERVAL === 0) {
          await yieldToBrowser();
        }
      }

      processed = 0;
      for (const run of runs) {
        const prev = existingRuns.get(run.run_id);
        counters.run.total += 1;
        if (!prev) {
          counters.run.new += 1;
          differences.push(
            toDifference(
              run.run_id,
              'run',
              'new',
              `${run.run_id} · 试验 ${run.test_id}`,
            ),
          );
        } else if (prev.test_id !== run.test_id) {
          counters.run.conflicts += 1;
          differences.push(
            toDifference(
              run.run_id,
              'run',
              'conflict',
              `${run.run_id}`,
              `导入请求指向试验 ${run.test_id}，现有数据指向 ${prev.test_id}`,
            ),
          );
        } else {
          const shallow = JSON.stringify(prev);
          const next = JSON.stringify(run);
          if (shallow === next) {
            counters.run.unchanged += 1;
          } else {
            counters.run.updated += 1;
            differences.push(
              toDifference(
                run.run_id,
                'run',
                'updated',
                `${run.run_id}`,
                '运行元数据将同步更新',
              ),
            );
          }
        }
        processed += 1;
        if (processed % YIELD_INTERVAL === 0) {
          await yieldToBrowser();
        }
      }

      const mapping: TbomImportMappingState = {
        strategy: 'incremental',
        differences,
        counters,
      };
      dispatch({ type: 'set-mapping', mapping });
      dispatch({ type: 'set-step', step: 'mapping' });
      return mapping;
    } finally {
      dispatch({ type: 'set-progress', message: null });
      dispatch({ type: 'set-processing', value: false });
    }
  }, [loadExistingData]);

  const setStrategy = useCallback((strategy: TbomImportStrategy) => {
    if (!state.mappingState) return;
    dispatch({
      type: 'set-mapping',
      mapping: {
        ...state.mappingState,
        strategy,
      },
    });
  }, [state.mappingState]);

  const execute = useCallback(async (): Promise<TbomImportSummary> => {
    if (!state.contractType) {
      throw new Error('请先选择契约类型');
    }
    if (!state.mappingState) {
      throw new Error('请先完成映射确认');
    }
    dispatch({ type: 'set-processing', value: true });
    dispatch({ type: 'set-error', error: null });
    dispatch({ type: 'set-progress', message: '正在上传并合并数据…' });
    try {
      const formData = new FormData();
      rawFilesRef.current.forEach((file) => {
        formData.append('files', file, file.name);
      });
      formData.append('contractType', state.contractType);
      formData.append('strategy', state.mappingState.strategy);
      formData.append('manifest', JSON.stringify(state.mappingState));

      const summary = await importTbomPackage(formData);
      dispatch({ type: 'set-summary', summary });
      dispatch({ type: 'set-step', step: 'summary' });

      const logEntry: TbomImportLogEntry = {
        ...summary,
        title: `${new Date(summary.completedAt).toLocaleString()} · ${TBOM_IMPORT_CONTRACTS.find((item) => item.id === summary.contractType)?.label ?? summary.contractType}`,
        createdAt: new Date(summary.completedAt).toISOString(),
      };
      const logs = [logEntry, ...readStoredLogs()].slice(0, 20);
      persistLogs(logs);
      dispatch({ type: 'set-logs', logs });

      const data = await loadExistingData();
      onDataMutated?.(data);
      return summary;
    } catch (error) {
      let message = '导入执行失败';
      if (error instanceof ImportLimitError) {
        message = error.message;
      } else if (error instanceof ApiError) {
        const payload = error.payload as { message?: string } | null | undefined;
        if (payload && typeof payload === 'object' && typeof payload.message === 'string') {
          message = payload.message;
        } else {
          message = error.message;
        }
      } else if (error instanceof Error) {
        message = error.message;
      }
      dispatch({ type: 'set-error', error: message });
      throw error;
    } finally {
      dispatch({ type: 'set-progress', message: null });
      dispatch({ type: 'set-processing', value: false });
    }
  }, [state.contractType, state.mappingState, loadExistingData, onDataMutated]);

  const showLog = useCallback((logId: string) => {
    const log = state.logs.find((entry) => entry.logId === logId);
    if (!log) return;
    dispatch({ type: 'set-summary', summary: log });
    dispatch({ type: 'set-step', step: 'logs' });
  }, [state.logs]);

  const resetToStart = useCallback(() => {
    dispatch({ type: 'reset-intermediate' });
    dispatch({ type: 'set-step', step: 'contract' });
    parsedPayloadRef.current = null;
    expandedFilesRef.current = [];
    rawFilesRef.current = [];
  }, []);

  const dismissError = useCallback(() => {
    dispatch({ type: 'set-error', error: null });
  }, []);

  const goToStep = useCallback((step: TbomImportWizardState['step']) => {
    dispatch({ type: 'set-step', step });
  }, []);

  const actions = useMemo(
    () => ({
      open,
      close,
      selectContract,
      selectFiles,
      validate,
      prepareMapping,
      setStrategy,
      execute,
      showLog,
      refreshLogs,
      resetToStart,
      dismissError,
      goToStep,
    }),
    [
      open,
      close,
      selectContract,
      selectFiles,
      validate,
      prepareMapping,
      setStrategy,
      execute,
      showLog,
      refreshLogs,
      resetToStart,
      dismissError,
      goToStep,
    ],
  );

  useEffect(() => {
    dispatch({ type: 'set-logs', logs: readStoredLogs() });
  }, []);

  return { state, actions };
};

export type TbomImportActions = ReturnType<typeof useTbomImportState>['actions'];
