import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { parseCsvRecords } from '@/utils/csv';

const MOCK_ROOT = path.join(process.cwd(), 'docs', 'mocks', 'tbom');

type TbomDatasetKey = 'tbom_project' | 'tbom_test' | 'tbom_run';

const ensureOverrides = () => {
  const globalObject = globalThis as typeof globalThis & {
    __tbomDatasetOverrides?: Partial<Record<TbomDatasetKey, unknown>>;
  };
  if (!globalObject.__tbomDatasetOverrides) {
    globalObject.__tbomDatasetOverrides = {};
  }
  return globalObject.__tbomDatasetOverrides;
};

export async function readJsonFile<T>(fileName: string): Promise<T> {
  try {
    const filePath = path.join(MOCK_ROOT, fileName);
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content) as T;
  } catch (error) {
    throw new MockDataError(`无法读取 JSON Mock 文件: ${fileName}`, { cause: error });
  }
}

export async function readTextFile(fileName: string): Promise<string> {
  try {
    const filePath = path.join(MOCK_ROOT, fileName);
    return await fs.readFile(filePath, 'utf-8');
  } catch (error) {
    throw new MockDataError(`无法读取文本 Mock 文件: ${fileName}`, { cause: error });
  }
}

export async function readCsvRecords(fileName: string): Promise<Record<string, string>[]> {
  const content = await readTextFile(fileName);
  return parseCsvRecords(content);
}

export async function readJsonDataset<T>(key: TbomDatasetKey): Promise<T> {
  const overrides = ensureOverrides();
  const cached = overrides[key];
  if (cached) {
    return structuredClone(cached) as T;
  }
  const fileName = `${key}.json`;
  const data = await readJsonFile<T>(fileName);
  overrides[key] = data;
  return structuredClone(data);
}

export function writeJsonDataset<T>(key: TbomDatasetKey, data: T) {
  const overrides = ensureOverrides();
  overrides[key] = structuredClone(data);
}

export function notFound(message: string) {
  return NextResponse.json({ error: message }, { status: 404 });
}

export function serverError(error: unknown) {
  const reason =
    error instanceof Error ? `${error.message}` : 'Mock 服务内部错误';
  return NextResponse.json({ error: 'MOCK_INTERNAL_ERROR', reason }, { status: 500 });
}

export class MockDataError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message);
    this.name = 'MockDataError';
    if (options?.cause) {
      this.cause = options.cause;
    }
  }
}
