import { describe, it, expect } from 'vitest';
import {
  ModulexError,
  BadRequestError,
  AuthenticationError,
  PermissionError,
  NotFoundError,
  ConflictError,
  ValidationError,
  RateLimitError,
  InternalError,
  ExternalServiceError,
  ServiceUnavailableError,
  StreamError,
  TimeoutError,
  createErrorFromStatus,
} from '../src/errors';

describe('Error Classes', () => {
  it('should create ModulexError with all properties', () => {
    const error = new ModulexError('test', 500, { detail: 'fail' }, undefined);
    expect(error.message).toBe('test');
    expect(error.status).toBe(500);
    expect(error.body).toEqual({ detail: 'fail' });
    expect(error.name).toBe('ModulexError');
    expect(error).toBeInstanceOf(Error);
  });

  it('should create RateLimitError with retryAfter', () => {
    const headers = new Headers({ 'retry-after': '30' });
    const error = new RateLimitError('rate limited', {}, headers);
    expect(error.status).toBe(429);
    expect(error.retryAfter).toBe(30);
    expect(error.name).toBe('RateLimitError');
  });

  it('should create RateLimitError without retryAfter', () => {
    const error = new RateLimitError('rate limited', {}, new Headers());
    expect(error.retryAfter).toBeUndefined();
  });

  it('should create StreamError without status', () => {
    const error = new StreamError('stream failed');
    expect(error.status).toBeUndefined();
    expect(error.name).toBe('StreamError');
  });

  it('should create TimeoutError', () => {
    const error = new TimeoutError();
    expect(error.message).toBe('Request timed out');
    expect(error.name).toBe('TimeoutError');
  });
});

describe('createErrorFromStatus', () => {
  const headers = new Headers();

  const cases: [number, string][] = [
    [400, 'BadRequestError'],
    [401, 'AuthenticationError'],
    [403, 'PermissionError'],
    [404, 'NotFoundError'],
    [409, 'ConflictError'],
    [422, 'ValidationError'],
    [429, 'RateLimitError'],
    [500, 'InternalError'],
    [502, 'ExternalServiceError'],
    [503, 'ServiceUnavailableError'],
  ];

  for (const [status, name] of cases) {
    it(`should create ${name} for status ${status}`, () => {
      const error = createErrorFromStatus(status, { detail: 'test' }, headers);
      expect(error.name).toBe(name);
      expect(error.status).toBe(status);
      expect(error.message).toBe('test');
    });
  }

  it('should create generic ModulexError for unknown status', () => {
    const error = createErrorFromStatus(418, { detail: 'teapot' }, headers);
    expect(error.name).toBe('ModulexError');
    expect(error.status).toBe(418);
  });

  it('should extract message from validation error array', () => {
    const body = {
      detail: [
        { loc: ['body', 'name'], msg: 'field required', type: 'value_error.missing' },
      ],
    };
    const error = createErrorFromStatus(422, body, headers);
    expect(error.message).toContain('body.name');
    expect(error.message).toContain('field required');
  });

  it('should fallback to HTTP status message', () => {
    const error = createErrorFromStatus(500, {}, headers);
    expect(error.message).toBe('HTTP 500 error');
  });
});

describe('structured error envelopes', () => {
  const headers = new Headers();

  it('parses dict-shaped detail (rate-limit) into message + code/reason', () => {
    const body = { detail: { code: 'RATE_LIMITED', reason: 'Too many requests', layer: 'auth', limit: 100, current: 101 } };
    const error = createErrorFromStatus(429, body, headers);
    expect(error.message).toBe('Too many requests (RATE_LIMITED)');
    expect(error.code).toBe('RATE_LIMITED');
    expect(error.reason).toBe('Too many requests');
    expect(error.layer).toBe('auth');
  });

  it('parses a flat top-level envelope without a detail wrapper (BillingDenied)', () => {
    const body = { code: 'BILLING_DENIED', reason: 'Insufficient credits', layer: 'billing' };
    const error = createErrorFromStatus(402, body, headers);
    expect(error.message).toBe('Insufficient credits (BILLING_DENIED)');
    expect(error.code).toBe('BILLING_DENIED');
    expect(error.reason).toBe('Insufficient credits');
    expect(error.layer).toBe('billing');
  });

  it('derives message from code alone when reason is absent', () => {
    const error = createErrorFromStatus(403, { code: 'FORBIDDEN' }, headers);
    expect(error.message).toBe('FORBIDDEN');
    expect(error.code).toBe('FORBIDDEN');
  });

  it('falls back to a bare {message} body', () => {
    const error = createErrorFromStatus(400, { message: 'bad input' }, headers);
    expect(error.message).toBe('bad input');
  });

  it('leaves code/reason undefined for plain string detail', () => {
    const error = createErrorFromStatus(404, { detail: 'not found' }, headers);
    expect(error.message).toBe('not found');
    expect(error.code).toBeUndefined();
    expect(error.reason).toBeUndefined();
  });
});

describe('RateLimitError header parsing', () => {
  it('parses X-RateLimit-* and Retry-After headers', () => {
    const headers = new Headers({
      'retry-after': '12',
      'x-ratelimit-limit': '100',
      'x-ratelimit-remaining': '0',
      'x-ratelimit-reset': '1718800000',
    });
    const error = new RateLimitError('rate limited', { detail: { code: 'RL', reason: 'slow down' } }, headers);
    expect(error.retryAfter).toBe(12);
    expect(error.limit).toBe(100);
    expect(error.remaining).toBe(0);
    expect(error.reset).toBe(1718800000);
    expect(error.code).toBe('RL');
    expect(error.reason).toBe('slow down');
  });

  it('leaves rate-limit fields undefined when headers are absent', () => {
    const error = new RateLimitError('rate limited', {}, new Headers());
    expect(error.limit).toBeUndefined();
    expect(error.remaining).toBeUndefined();
    expect(error.reset).toBeUndefined();
  });
});
