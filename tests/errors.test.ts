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
