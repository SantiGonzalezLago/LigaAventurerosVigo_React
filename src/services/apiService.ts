import { environment } from '../config/environment';
import { storageService, USERS_STATE_STORAGE_KEY } from './storageService';

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(status: number, message: string, data: unknown) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

const baseUrl = `${environment.api.replace(/\/+$/, '')}/v1`;

function isInternalApiUrl(url: string) {
  return url.startsWith(baseUrl);
}

function getActiveUserJwt(): string | null {
  const parsed = storageService.getJson<{
    users?: Array<{ uid?: unknown; jwt?: unknown }>;
    activeUid?: unknown;
  }>(USERS_STATE_STORAGE_KEY);

  if (!parsed) return null;

  const users = Array.isArray(parsed.users) ? parsed.users : [];
  if (users.length === 0) return null;

  const activeUid = typeof parsed.activeUid === 'string' ? parsed.activeUid : null;
  const activeUser = activeUid
    ? users.find((user) => typeof user.uid === 'string' && user.uid === activeUid)
    : users[0];

  const jwt = activeUser?.jwt;
  return typeof jwt === 'string' && jwt.trim() ? jwt : null;
}

function buildUrl(endpoint: string, params?: Record<string, string | number | boolean | null | undefined>) {
  const url = /^https?:\/\//i.test(endpoint) ? endpoint : `${baseUrl}/${endpoint.replace(/^\/+/, '')}`;
  const searchParams = new URLSearchParams();

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) continue;
      searchParams.set(key, String(value));
    }
  }

  const query = searchParams.toString();
  return query ? `${url}?${query}` : url;
}

function resolveHeaders(url: string, headers?: Record<string, string>): Record<string, string> {
  const resolved: Record<string, string> = { ...(headers ?? {}) };
  const hasAuth = Object.keys(resolved).some((key) => key.toLowerCase() === 'authorization');

  if (isInternalApiUrl(url) && !hasAuth) {
    const jwt = getActiveUserJwt();
    if (jwt) {
      resolved.Authorization = `Bearer ${jwt}`;
    }
  }

  return resolved;
}

async function handleResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type') ?? '';
  const isJson = contentType.includes('application/json');
  const data = isJson ? await response.json().catch(() => null) : await response.text();

  if (!response.ok) {
    const message =
      (isJson && data && typeof data === 'object' && 'message' in data && typeof (data as { message?: unknown }).message === 'string')
        ? (data as { message: string }).message
        : `Error ${response.status}`;

    throw new ApiError(response.status, message, data);
  }

  return data as T;
}

export const apiService = {
  async get<T>(
    endpoint: string,
    params?: Record<string, string | number | boolean | null | undefined>,
    headers?: Record<string, string>
  ): Promise<T> {
    const url = buildUrl(endpoint, params);
    const response = await fetch(url, { headers: resolveHeaders(url, headers) });
    return handleResponse<T>(response);
  },

  async post<T>(
    endpoint: string,
    body: unknown,
    params?: Record<string, string | number | boolean | null | undefined>,
    headers?: Record<string, string>
  ): Promise<T> {
    const url = buildUrl(endpoint, params);
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...resolveHeaders(url, headers) },
      body: JSON.stringify(body ?? {}),
    });
    return handleResponse<T>(response);
  },

  async postWithFiles<T>(
    endpoint: string,
    body: Record<string, unknown>,
    files: Record<string, File | Blob | Array<File | Blob>>,
    params?: Record<string, string | number | boolean | null | undefined>,
    headers?: Record<string, string>
  ): Promise<T> {
    const formData = new FormData();

    for (const [key, value] of Object.entries(body)) {
      if (value === undefined || value === null) continue;
      formData.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
    }

    for (const [fieldName, fieldValue] of Object.entries(files)) {
      if (Array.isArray(fieldValue)) {
        fieldValue.forEach((file) => formData.append(fieldName, file));
      } else {
        formData.append(fieldName, fieldValue);
      }
    }

    const url = buildUrl(endpoint, params);
    const response = await fetch(url, {
      method: 'POST',
      headers: resolveHeaders(url, headers),
      body: formData,
    });
    return handleResponse<T>(response);
  },

  async delete<T>(
    endpoint: string,
    params?: Record<string, string | number | boolean | null | undefined>,
    headers?: Record<string, string>
  ): Promise<T> {
    const url = buildUrl(endpoint, params);
    const response = await fetch(url, { method: 'DELETE', headers: resolveHeaders(url, headers) });
    return handleResponse<T>(response);
  },
};
