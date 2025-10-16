import { z } from 'zod';

export type ApiOptions<T> = {
  baseUrl?: string;
  init?: RequestInit;
  timeoutMs?: number;
  schema?: z.ZodSchema<T>;
  parseAs?: 'json' | 'text';
};

export class ApiError<T = unknown> extends Error {
  public readonly status: number;
  public readonly payload?: T;

  constructor(status: number, message: string, payload?: T) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

const DEFAULT_TIMEOUT = 10_000;

export async function api<T = unknown>(
  path: string,
  options: ApiOptions<T> = {},
): Promise<T> {
  const {
    baseUrl = process.env.NEXT_PUBLIC_API_BASE || '/api/mock',
    init,
    timeoutMs = DEFAULT_TIMEOUT,
    schema,
    parseAs = 'json',
  } = options;

  const url = toAbsoluteUrl(path, baseUrl);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        Accept: parseAs === 'json' ? 'application/json' : 'text/plain',
        ...init?.headers,
      },
    });

    const payload = await parsePayload(response, parseAs);

    if (!response.ok) {
      throw new ApiError(response.status, '请求失败', payload);
    }

    if (schema) {
      return schema.parse(payload);
    }

    return payload as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError(408, '请求超时');
    }
    throw new ApiError(500, '网络请求错误', { cause: serializeError(error) });
  } finally {
    clearTimeout(timeout);
  }
}

function toAbsoluteUrl(path: string, baseUrl: string): string {
  if (/^https?:\/\//.test(path)) {
    return path;
  }
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl.replace(/\/$/, '')}${normalizedPath}`;
}

async function parsePayload(
  response: Response,
  parseAs: 'json' | 'text',
): Promise<unknown> {
  if (parseAs === 'text') {
    return await response.text();
  }

  const contentLength = response.headers.get('content-length');
  if (response.status === 204 || contentLength === '0') {
    return null;
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  return await response.text();
}

function serializeError(error: unknown) {
  if (error instanceof Error) {
    return { message: error.message, stack: error.stack };
  }
  return { message: String(error) };
}
