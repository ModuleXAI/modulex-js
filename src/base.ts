import type { ResolvedConfig } from './config';
import type { SSEEvent } from './streaming';
import type { RequestOptions } from './types/shared';
import { createErrorFromStatus, TimeoutError } from './errors';
import { parseSSEStream } from './streaming';

/** Status codes that trigger automatic retry. */
const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503]);

/** Status codes that should never be retried. */
const NON_RETRYABLE_STATUS_CODES = new Set([400, 401, 403, 404, 409, 422]);

/**
 * Converts a camelCase string to snake_case.
 * @internal
 */
function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

/**
 * Recursively converts object keys from camelCase to snake_case.
 * @internal
 */
function convertKeysToSnakeCase(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(convertKeysToSnakeCase);
  if (typeof obj === 'object' && !(obj instanceof Date) && !(obj instanceof File) && !(obj instanceof Blob)) {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      result[toSnakeCase(key)] = convertKeysToSnakeCase(value);
    }
    return result;
  }
  return obj;
}

/**
 * Base class for all resource classes. Provides HTTP methods with
 * retry logic, error handling, and organization ID resolution.
 */
export abstract class BaseResource {
  /** @internal */
  protected readonly _config: ResolvedConfig;

  constructor(config: ResolvedConfig) {
    this._config = config;
  }

  /**
   * Resolve the organization ID from per-request options or client default.
   * @internal
   */
  private resolveOrgId(options?: RequestOptions): string | undefined {
    return options?.organizationId ?? this._config.organizationId;
  }

  /**
   * Build full URL with query parameters.
   * @internal
   */
  private buildUrl(path: string, params?: Record<string, string | number | boolean | undefined>): string {
    const url = new URL(`${this._config.baseUrl}${path}`);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) {
          url.searchParams.set(toSnakeCase(key), String(value));
        }
      }
    }
    return url.toString();
  }

  /**
   * Build headers for a request.
   * @internal
   */
  private buildHeaders(orgId?: string, contentType?: string): Record<string, string> {
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this._config.apiKey}`,
    };
    if (contentType) {
      headers['Content-Type'] = contentType;
    }
    if (orgId) {
      headers['X-Organization-ID'] = orgId;
    }
    return headers;
  }

  /**
   * Create an abort signal that combines timeout and user-provided signal.
   * @internal
   */
  private createSignal(options?: RequestOptions): AbortSignal {
    const timeout = options?.timeout ?? this._config.timeout;
    const signals: AbortSignal[] = [AbortSignal.timeout(timeout)];
    if (options?.signal) {
      signals.push(options.signal);
    }
    return AbortSignal.any(signals);
  }

  /**
   * Execute a fetch request with retry logic.
   * @internal
   */
  private async fetchWithRetry(
    url: string,
    init: RequestInit,
    maxRetries: number,
  ): Promise<Response> {
    let lastError: Error | undefined;
    const attempts = maxRetries + 1;

    for (let attempt = 0; attempt < attempts; attempt++) {
      try {
        const response = await this._config.fetch(url, init);

        if (response.ok) {
          return response;
        }

        // Parse error body
        let body: unknown;
        try {
          body = await response.json();
        } catch {
          body = { detail: response.statusText };
        }

        const error = createErrorFromStatus(response.status, body, response.headers);

        // Don't retry non-retryable status codes
        if (NON_RETRYABLE_STATUS_CODES.has(response.status)) {
          throw error;
        }

        // Retry retryable status codes if we have attempts left
        if (RETRYABLE_STATUS_CODES.has(response.status) && attempt < maxRetries) {
          lastError = error;
          const delay = this.calculateDelay(attempt, response.headers);
          await this.sleep(delay, init.signal ?? undefined);
          continue;
        }

        throw error;
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') {
          throw new TimeoutError();
        }
        if (e instanceof DOMException && e.name === 'TimeoutError') {
          throw new TimeoutError();
        }
        // Re-throw ModulexError subtypes immediately if non-retryable
        if (e && typeof e === 'object' && 'status' in e) {
          const status = (e as { status: number }).status;
          if (NON_RETRYABLE_STATUS_CODES.has(status)) throw e;
        }
        // Network errors are retryable
        if (attempt < maxRetries) {
          lastError = e instanceof Error ? e : new Error(String(e));
          const delay = this.calculateDelay(attempt);
          try {
            await this.sleep(delay, init.signal ?? undefined);
          } catch {
            throw lastError;
          }
          continue;
        }
        throw e;
      }
    }
    throw lastError ?? new Error('Request failed');
  }

  /**
   * Calculate delay for exponential backoff with jitter.
   * @internal
   */
  private calculateDelay(attempt: number, headers?: Headers): number {
    // Respect Retry-After header
    const retryAfter = headers?.get('retry-after');
    if (retryAfter) {
      const seconds = Number(retryAfter);
      if (!isNaN(seconds)) return seconds * 1000;
    }
    // Exponential backoff: base * 2^attempt + jitter
    const base = 500;
    const maxDelay = 30_000;
    const exponential = base * Math.pow(2, attempt);
    const jitter = Math.random() * base;
    return Math.min(exponential + jitter, maxDelay);
  }

  /**
   * Sleep for a given duration, respecting abort signals.
   * @internal
   */
  private sleep(ms: number, signal?: AbortSignal | null): Promise<void> {
    return new Promise((resolve, reject) => {
      if (signal?.aborted) {
        reject(new TimeoutError());
        return;
      }
      const timer = setTimeout(resolve, ms);
      signal?.addEventListener('abort', () => {
        clearTimeout(timer);
        reject(new TimeoutError());
      }, { once: true });
    });
  }

  /** Perform a GET request. */
  protected async _get<T>(path: string, options?: RequestOptions): Promise<T> {
    const orgId = this.resolveOrgId(options);
    const url = this.buildUrl(path, options?.params);
    const signal = this.createSignal(options);

    const response = await this.fetchWithRetry(url, {
      method: 'GET',
      headers: this.buildHeaders(orgId, 'application/json'),
      signal,
    }, this._config.maxRetries);

    return response.json() as Promise<T>;
  }

  /** Perform a POST request. */
  protected async _post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    const orgId = this.resolveOrgId(options);
    const url = this.buildUrl(path, options?.params);
    const signal = this.createSignal(options);

    const response = await this.fetchWithRetry(url, {
      method: 'POST',
      headers: this.buildHeaders(orgId, 'application/json'),
      body: body !== undefined ? JSON.stringify(convertKeysToSnakeCase(body)) : undefined,
      signal,
    }, this._config.maxRetries);

    const text = await response.text();
    if (!text) return undefined as T;
    return JSON.parse(text) as T;
  }

  /** Perform a PUT request. */
  protected async _put<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    const orgId = this.resolveOrgId(options);
    const url = this.buildUrl(path, options?.params);
    const signal = this.createSignal(options);

    const response = await this.fetchWithRetry(url, {
      method: 'PUT',
      headers: this.buildHeaders(orgId, 'application/json'),
      body: body !== undefined ? JSON.stringify(convertKeysToSnakeCase(body)) : undefined,
      signal,
    }, this._config.maxRetries);

    const text = await response.text();
    if (!text) return undefined as T;
    return JSON.parse(text) as T;
  }

  /** Perform a PATCH request. */
  protected async _patch<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    const orgId = this.resolveOrgId(options);
    const url = this.buildUrl(path, options?.params);
    const signal = this.createSignal(options);

    const response = await this.fetchWithRetry(url, {
      method: 'PATCH',
      headers: this.buildHeaders(orgId, 'application/json'),
      body: body !== undefined ? JSON.stringify(convertKeysToSnakeCase(body)) : undefined,
      signal,
    }, this._config.maxRetries);

    const text = await response.text();
    if (!text) return undefined as T;
    return JSON.parse(text) as T;
  }

  /** Perform a DELETE request. */
  protected async _delete<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    const orgId = this.resolveOrgId(options);
    const url = this.buildUrl(path, options?.params);
    const signal = this.createSignal(options);

    const response = await this.fetchWithRetry(url, {
      method: 'DELETE',
      headers: this.buildHeaders(orgId, 'application/json'),
      body: body !== undefined ? JSON.stringify(convertKeysToSnakeCase(body)) : undefined,
      signal,
    }, this._config.maxRetries);

    if (response.status === 204) return undefined as T;
    const text = await response.text();
    if (!text) return undefined as T;
    return JSON.parse(text) as T;
  }

  /** Open an SSE stream and return an async iterable of events. */
  protected async *streamSSE(path: string, options?: RequestOptions): AsyncGenerator<SSEEvent> {
    const orgId = this.resolveOrgId(options);
    const url = this.buildUrl(path, options?.params);

    const response = await this._config.fetch(url, {
      method: 'GET',
      headers: {
        ...this.buildHeaders(orgId),
        'Accept': 'text/event-stream',
        'Cache-Control': 'no-cache',
      },
      signal: options?.signal,
    });

    if (!response.ok) {
      let body: unknown;
      try { body = await response.json(); } catch { body = { detail: response.statusText }; }
      throw createErrorFromStatus(response.status, body, response.headers);
    }

    yield* parseSSEStream(response, options?.signal);
  }

  /** Perform a POST SSE stream request. */
  protected async *streamSSEPost(path: string, body?: unknown, options?: RequestOptions): AsyncGenerator<SSEEvent> {
    const orgId = this.resolveOrgId(options);
    const url = this.buildUrl(path, options?.params);

    const response = await this._config.fetch(url, {
      method: 'POST',
      headers: {
        ...this.buildHeaders(orgId, 'application/json'),
        'Accept': 'text/event-stream',
      },
      body: body !== undefined ? JSON.stringify(convertKeysToSnakeCase(body)) : undefined,
      signal: options?.signal,
    });

    if (!response.ok) {
      let errorBody: unknown;
      try { errorBody = await response.json(); } catch { errorBody = { detail: response.statusText }; }
      throw createErrorFromStatus(response.status, errorBody, response.headers);
    }

    yield* parseSSEStream(response, options?.signal);
  }

  /** Upload a file using multipart/form-data. */
  protected async upload<T>(path: string, formData: FormData, options?: RequestOptions): Promise<T> {
    const orgId = this.resolveOrgId(options);
    const url = this.buildUrl(path, options?.params);
    const signal = this.createSignal(options);

    // Don't set Content-Type — let the browser/runtime set it with the boundary
    const headers = this.buildHeaders(orgId);

    const response = await this.fetchWithRetry(url, {
      method: 'POST',
      headers,
      body: formData,
      signal,
    }, this._config.maxRetries);

    return response.json() as Promise<T>;
  }
}
