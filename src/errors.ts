/**
 * Base error class for all ModuleX SDK errors.
 *
 * When the API returns a structured error envelope — either a dict-shaped
 * `detail` (e.g. rate-limit) or a flat top-level `{code, reason, ...}` body
 * (e.g. BillingDenied, which has no `detail` wrapper) — the `code`, `reason`
 * and `layer` fields are surfaced here for programmatic handling.
 */
export class ModulexError extends Error {
  /** Machine-readable error code from the API envelope, if present. */
  public readonly code?: string;
  /** Human-readable reason from the API envelope, if present. */
  public readonly reason?: string;
  /** The layer/subsystem that produced the error (e.g. "billing", "auth"), if present. */
  public readonly layer?: string;

  constructor(
    message: string,
    public readonly status: number | undefined,
    public readonly body: unknown,
    public readonly headers: Headers | undefined,
  ) {
    super(message);
    this.name = 'ModulexError';
    const env = extractErrorEnvelope(body);
    if (env) {
      if (typeof env.code === 'string') this.code = env.code;
      if (typeof env.reason === 'string') this.reason = env.reason;
      if (typeof env.layer === 'string') this.layer = env.layer;
    }
  }
}

/** Thrown when the API returns 400 Bad Request. */
export class BadRequestError extends ModulexError {
  constructor(message: string, body: unknown, headers: Headers | undefined) {
    super(message, 400, body, headers);
    this.name = 'BadRequestError';
  }
}

/** Thrown when the API returns 401 Unauthorized. */
export class AuthenticationError extends ModulexError {
  constructor(message: string, body: unknown, headers: Headers | undefined) {
    super(message, 401, body, headers);
    this.name = 'AuthenticationError';
  }
}

/** Thrown when the API returns 403 Forbidden. */
export class PermissionError extends ModulexError {
  constructor(message: string, body: unknown, headers: Headers | undefined) {
    super(message, 403, body, headers);
    this.name = 'PermissionError';
  }
}

/** Thrown when the API returns 404 Not Found. */
export class NotFoundError extends ModulexError {
  constructor(message: string, body: unknown, headers: Headers | undefined) {
    super(message, 404, body, headers);
    this.name = 'NotFoundError';
  }
}

/** Thrown when the API returns 409 Conflict. */
export class ConflictError extends ModulexError {
  constructor(message: string, body: unknown, headers: Headers | undefined) {
    super(message, 409, body, headers);
    this.name = 'ConflictError';
  }
}

/** Thrown when the API returns 422 Validation Error. */
export class ValidationError extends ModulexError {
  constructor(message: string, body: unknown, headers: Headers | undefined) {
    super(message, 422, body, headers);
    this.name = 'ValidationError';
  }
}

/** Thrown when the API returns 429 Too Many Requests. */
export class RateLimitError extends ModulexError {
  /** Seconds to wait before retrying (from the Retry-After header). */
  public readonly retryAfter: number | undefined;
  /** The rate limit ceiling, from the X-RateLimit-Limit header. */
  public readonly limit: number | undefined;
  /** Remaining requests in the window, from the X-RateLimit-Remaining header. */
  public readonly remaining: number | undefined;
  /** Unix epoch (seconds) when the window resets, from the X-RateLimit-Reset header. */
  public readonly reset: number | undefined;

  constructor(message: string, body: unknown, headers: Headers | undefined) {
    super(message, 429, body, headers);
    this.name = 'RateLimitError';
    this.retryAfter = parseNumericHeader(headers, 'retry-after');
    this.limit = parseNumericHeader(headers, 'x-ratelimit-limit');
    this.remaining = parseNumericHeader(headers, 'x-ratelimit-remaining');
    this.reset = parseNumericHeader(headers, 'x-ratelimit-reset');
  }
}

/** Parse a numeric HTTP header, returning undefined when absent or non-numeric. @internal */
function parseNumericHeader(headers: Headers | undefined, name: string): number | undefined {
  const raw = headers?.get(name);
  if (raw == null) return undefined;
  const n = Number(raw);
  return Number.isNaN(n) ? undefined : n;
}

/** Thrown when the API returns 500 Internal Server Error. */
export class InternalError extends ModulexError {
  constructor(message: string, body: unknown, headers: Headers | undefined) {
    super(message, 500, body, headers);
    this.name = 'InternalError';
  }
}

/** Thrown when the API returns 502 Bad Gateway. */
export class ExternalServiceError extends ModulexError {
  constructor(message: string, body: unknown, headers: Headers | undefined) {
    super(message, 502, body, headers);
    this.name = 'ExternalServiceError';
  }
}

/** Thrown when the API returns 503 Service Unavailable. */
export class ServiceUnavailableError extends ModulexError {
  constructor(message: string, body: unknown, headers: Headers | undefined) {
    super(message, 503, body, headers);
    this.name = 'ServiceUnavailableError';
  }
}

/** Thrown on SSE stream errors. */
export class StreamError extends ModulexError {
  constructor(message: string) {
    super(message, undefined, undefined, undefined);
    this.name = 'StreamError';
  }
}

/** Thrown when a request times out. */
export class TimeoutError extends ModulexError {
  constructor(message: string = 'Request timed out') {
    super(message, undefined, undefined, undefined);
    this.name = 'TimeoutError';
  }
}

/**
 * Creates a typed error from an HTTP status code.
 * @internal
 */
export function createErrorFromStatus(
  status: number,
  body: unknown,
  headers: Headers,
): ModulexError {
  const message = extractErrorMessage(body, status);
  switch (status) {
    case 400: return new BadRequestError(message, body, headers);
    case 401: return new AuthenticationError(message, body, headers);
    case 403: return new PermissionError(message, body, headers);
    case 404: return new NotFoundError(message, body, headers);
    case 409: return new ConflictError(message, body, headers);
    case 422: return new ValidationError(message, body, headers);
    case 429: return new RateLimitError(message, body, headers);
    case 500: return new InternalError(message, body, headers);
    case 502: return new ExternalServiceError(message, body, headers);
    case 503: return new ServiceUnavailableError(message, body, headers);
    default:  return new ModulexError(message, status, body, headers);
  }
}

/**
 * Extract a structured error envelope from a response body, handling both the
 * dict-shaped `detail` form (e.g. rate-limit: `{ detail: { code, reason, ... } }`)
 * and the flat top-level form (e.g. BillingDenied: `{ code, reason, ... }` with no
 * `detail` wrapper). Returns undefined when the body is not a structured envelope.
 * @internal
 */
function extractErrorEnvelope(body: unknown): Record<string, unknown> | undefined {
  if (!body || typeof body !== 'object') return undefined;
  const b = body as Record<string, unknown>;
  const detail = b.detail;
  if (detail && typeof detail === 'object' && !Array.isArray(detail)) {
    return detail as Record<string, unknown>;
  }
  // Top-level envelope (no `detail` wrapper) — recognised by code/reason keys.
  if (typeof b.code === 'string' || typeof b.reason === 'string') {
    return b;
  }
  return undefined;
}

function extractErrorMessage(body: unknown, status: number): string {
  if (body && typeof body === 'object') {
    const b = body as Record<string, unknown>;
    const detail = b.detail;
    // 1. Plain string detail.
    if (typeof detail === 'string') return detail;
    // 2. FastAPI validation error array.
    if (Array.isArray(detail)) {
      return detail
        .map((d: Record<string, unknown>) => `${(d.loc as unknown[])?.join('.')}: ${d.msg}`)
        .join('; ');
    }
    // 3. Structured envelope: dict-shaped detail OR flat top-level {code, reason}.
    const env = extractErrorEnvelope(body);
    if (env) {
      const reason = env.reason ?? env.message;
      const code = env.code;
      if (typeof reason === 'string' && typeof code === 'string') return `${reason} (${code})`;
      if (typeof reason === 'string') return reason;
      if (typeof code === 'string') return code;
    }
    // 4. Some handlers return a bare {message}.
    if (typeof b.message === 'string') return b.message;
  }
  return `HTTP ${status} error`;
}
