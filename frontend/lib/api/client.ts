/**
 * Low-level HTTP client: fetch wrapper, timeout handling, error parsing.
 */

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000/api";
export const REQUEST_TIMEOUT = 30000;
export const AUTH_TIMEOUT = 45000;
export const UPLOAD_TIMEOUT = 15000;

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

interface ApiErrorResponse {
  detail?: string | any[];
  message?: string;
  error?: string;
}

export type ApiError = {
  message: string;
  status: number;
  code?: string;
};

export const createApiError = (
  message: string,
  status: number,
  code?: string
): ApiError => ({ message, status, code });

export const parseApiError = async (response: Response): Promise<string> => {
  try {
    const error = (await response.json()) as ApiErrorResponse;
    const detail = error.detail;
    if (Array.isArray(detail)) {
      return detail
        .map((d: any) => d.msg?.replace(/^Value error, /, "") ?? String(d))
        .join(", ");
    }
    return (detail as string) || error.message || "API Error";
  } catch {
    return `HTTP ${response.status}: ${response.statusText}`;
  }
};

export const fetchWithTimeout = async (
  url: string,
  options: RequestInit = {},
  timeout = REQUEST_TIMEOUT
): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error(
        "Request timeout - server is taking too long to respond. Please try again."
      );
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
};

export const wrapNetworkError = (err: unknown, fallbackMessage: string): never => {
  if (err && typeof err === "object" && "code" in err) {
    throw err;
  }
  throw createApiError(
    err instanceof Error ? err.message : fallbackMessage,
    0,
    "NETWORK_ERROR"
  );
};

export interface RequestSpec {
  method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  path: string;
  // Bearer token; presence triggers Authorization header + 401-triggers-logout behavior.
  auth?: string;
  // JSON body, or FormData (sent as-is without Content-Type).
  body?: unknown;
  query?: Record<string, string | undefined>;
  timeout?: number;
  errorPrefix?: string;
  // Per-status error code overrides, e.g. { 404: "TRIP_NOT_FOUND" }.
  errorMap?: Record<number, string>;
  fallbackMessage?: string;
  // Some endpoints (e.g. /auth/refresh) handle 401 themselves; skip universal logout.
  skipUnauthorizedLogout?: boolean;
}

const buildQuery = (query?: Record<string, string | undefined>): string => {
  if (!query) return "";
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== null && v !== "") params.append(k, v);
  }
  const s = params.toString();
  return s ? `?${s}` : "";
};

/**
 * Universal request adapter. Every endpoint inherits:
 * - auth header injection
 * - timeout
 * - 401 → session.logout() (unless skipUnauthorizedLogout)
 * - error parsing and consistent ApiError shape
 * - network error wrapping
 */
export const request = async <T = unknown>(spec: RequestSpec): Promise<T> => {
  const url = `${API_BASE}${spec.path}${buildQuery(spec.query)}`;
  const headers: Record<string, string> = {};
  if (spec.auth) headers["Authorization"] = `Bearer ${spec.auth}`;

  let body: BodyInit | undefined;
  if (spec.body instanceof FormData) {
    body = spec.body;
  } else if (spec.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(spec.body);
  }

  const errorCode = (status: number): string => {
    if (spec.errorMap && spec.errorMap[status]) return spec.errorMap[status];
    return spec.errorPrefix ? `${spec.errorPrefix}_FAILED` : "REQUEST_FAILED";
  };

  try {
    const response = await fetchWithTimeout(
      url,
      { method: spec.method, headers, body },
      spec.timeout
    );

    if (!response.ok) {
      if (response.status === 401 && spec.auth && !spec.skipUnauthorizedLogout) {
        const { session } = await import("./session");
        session.logout();
      }
      const message = await parseApiError(response);
      throw createApiError(message, response.status, errorCode(response.status));
    }

    if (response.status === 204) return undefined as T;
    const text = await response.text();
    if (!text) return undefined as T;
    return JSON.parse(text) as T;
  } catch (err) {
    return wrapNetworkError(err, spec.fallbackMessage || "Request failed");
  }
};
