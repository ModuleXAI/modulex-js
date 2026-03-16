/**
 * Base error class for all ModuleX SDK errors.
 */
export class ModulexError extends Error {
  constructor(
    message: string,
    public readonly status: number | undefined,
    public readonly body: unknown,
    public readonly headers: Headers | undefined,
  ) {
    super(message);
    this.name = 'ModulexError';
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
  /** Seconds to wait before retrying (from Retry-After header). */
  public readonly retryAfter: number | undefined;

  constructor(message: string, body: unknown, headers: Headers | undefined) {
    super(message, 429, body, headers);
    this.name = 'RateLimitError';
    const retryHeader = headers?.get('retry-after');
    this.retryAfter = retryHeader ? Number(retryHeader) : undefined;
  }
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

function extractErrorMessage(body: unknown, status: number): string {
  if (body && typeof body === 'object' && 'detail' in body) {
    const detail = (body as Record<string, unknown>).detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) {
      return detail
        .map((d: Record<string, unknown>) => `${(d.loc as unknown[])?.join('.')}: ${d.msg}`)
        .join('; ');
    }
  }
  return `HTTP ${status} error`;
}
