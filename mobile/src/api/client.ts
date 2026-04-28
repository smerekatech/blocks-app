import Constants from 'expo-constants';
import { getSessionCookie, useSessionStore } from '~/state/session';

const COOKIE_NAME = 'nuxt-session';

function resolveBaseUrl(): string {
  const fromExtras = (Constants.expoConfig?.extra as { apiBaseUrl?: string } | undefined)?.apiBaseUrl;
  if (fromExtras) return fromExtras;
  const fromEnv = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (fromEnv) return fromEnv;
  return 'https://blocks.smerekalabs.com';
}

export const API_BASE_URL = resolveBaseUrl();

export class ApiError extends Error {
  constructor(public status: number, public body: string) {
    super(`API ${status}: ${body || '<empty>'}`);
  }
}

export class UnauthorizedError extends ApiError {
  constructor(body: string) {
    super(401, body);
  }
}

interface RequestInit {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const cookie = getSessionCookie();
  if (!cookie) throw new UnauthorizedError('no session');

  const url = new URL(path, API_BASE_URL);
  if (init.query) {
    for (const [k, v] of Object.entries(init.query)) {
      if (v !== undefined) url.searchParams.set(k, String(v));
    }
  }

  const headers: Record<string, string> = {
    Accept: 'application/json',
    Cookie: `${COOKIE_NAME}=${cookie}`,
  };
  let body: string | undefined;
  if (init.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(init.body);
  }

  const res = await fetch(url.toString(), {
    method: init.method ?? 'GET',
    headers,
    body,
  });

  if (res.status === 401) {
    const text = await res.text().catch(() => '');
    // Fire-and-forget; consumer treats this as a fatal error.
    void useSessionStore.getState().clear();
    throw new UnauthorizedError(text);
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new ApiError(res.status, text);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
