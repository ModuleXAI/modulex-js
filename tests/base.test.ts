import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BaseResource } from '../src/base';
import { resolveConfig } from '../src/config';
import {
  AuthenticationError,
  BadRequestError,
  NotFoundError,
  RateLimitError,
  TimeoutError,
} from '../src/errors';
import type { RequestOptions } from '../src/types/shared';

// Concrete subclass for testing
class TestResource extends BaseResource {
  async testGet<T>(path: string, options?: RequestOptions) {
    return this._get<T>(path, options);
  }
  async testPost<T>(path: string, body?: unknown, options?: RequestOptions) {
    return this._post<T>(path, body, options);
  }
  async testPut<T>(path: string, body?: unknown, options?: RequestOptions) {
    return this._put<T>(path, body, options);
  }
  async testPatch<T>(path: string, body?: unknown, options?: RequestOptions) {
    return this._patch<T>(path, body, options);
  }
  async testDelete<T>(path: string, options?: RequestOptions) {
    return this._delete<T>(path, undefined, options);
  }
  async testUpload<T>(path: string, formData: FormData, options?: RequestOptions) {
    return this.upload<T>(path, formData, options);
  }
}

function createResource(mockFetch: typeof globalThis.fetch, orgId?: string) {
  const config = resolveConfig({
    apiKey: 'mx_live_test',
    organizationId: orgId,
    baseUrl: 'https://api.test.com',
    timeout: 5000,
    maxRetries: 2,
    fetch: mockFetch,
  });
  return new TestResource(config);
}

function jsonResponse(data: unknown, status = 200, headers?: Record<string, string>) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

describe('BaseResource', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
  });

  describe('GET requests', () => {
    it('should make a GET request with correct headers', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({ id: 1 }));
      const resource = createResource(mockFetch, 'org-123');

      const result = await resource.testGet('/test');

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, init] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.test.com/test');
      expect(init.method).toBe('GET');
      expect(init.headers['Authorization']).toBe('Bearer mx_live_test');
      expect(init.headers['X-Organization-ID']).toBe('org-123');
      expect(result).toEqual({ id: 1 });
    });

    it('should build query parameters', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({}));
      const resource = createResource(mockFetch);

      await resource.testGet('/test', {
        params: { status: 'active', page: 1, undefined_param: undefined },
      });

      const url = new URL(mockFetch.mock.calls[0][0]);
      expect(url.searchParams.get('status')).toBe('active');
      expect(url.searchParams.get('page')).toBe('1');
      expect(url.searchParams.has('undefined_param')).toBe(false);
    });
  });

  describe('POST requests', () => {
    it('should send JSON body', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({ created: true }));
      const resource = createResource(mockFetch);

      const result = await resource.testPost('/test', { name: 'test' });

      const [, init] = mockFetch.mock.calls[0];
      expect(init.method).toBe('POST');
      expect(JSON.parse(init.body)).toEqual({ name: 'test' });
      expect(result).toEqual({ created: true });
    });

    it('should convert camelCase keys to snake_case in body', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({}));
      const resource = createResource(mockFetch);

      await resource.testPost('/test', {
        workflowId: 'wf-1',
        pageSize: 20,
        nestedObj: { innerKey: 'value' },
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body).toEqual({
        workflow_id: 'wf-1',
        page_size: 20,
        nested_obj: { inner_key: 'value' },
      });
    });

    it('should handle empty response body', async () => {
      mockFetch.mockResolvedValueOnce(new Response('', { status: 200 }));
      const resource = createResource(mockFetch);

      const result = await resource.testPost('/test');
      expect(result).toBeUndefined();
    });
  });

  describe('DELETE requests', () => {
    it('should handle 204 No Content', async () => {
      mockFetch.mockResolvedValueOnce(new Response(null, { status: 204 }));
      const resource = createResource(mockFetch);

      const result = await resource.testDelete('/test');
      expect(result).toBeUndefined();
    });
  });

  describe('Organization ID resolution', () => {
    it('should use client default org ID', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({}));
      const resource = createResource(mockFetch, 'default-org');

      await resource.testGet('/test');

      expect(mockFetch.mock.calls[0][1].headers['X-Organization-ID']).toBe('default-org');
    });

    it('should override org ID per request', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({}));
      const resource = createResource(mockFetch, 'default-org');

      await resource.testGet('/test', { organizationId: 'override-org' });

      expect(mockFetch.mock.calls[0][1].headers['X-Organization-ID']).toBe('override-org');
    });

    it('should not send org header when not set', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({}));
      const resource = createResource(mockFetch);

      await resource.testGet('/test');

      expect(mockFetch.mock.calls[0][1].headers['X-Organization-ID']).toBeUndefined();
    });
  });

  describe('Error handling', () => {
    it('should throw AuthenticationError for 401', async () => {
      mockFetch.mockResolvedValueOnce(
        jsonResponse({ detail: 'Invalid token' }, 401),
      );
      const resource = createResource(mockFetch);

      await expect(resource.testGet('/test')).rejects.toThrow(AuthenticationError);
    });

    it('should throw NotFoundError for 404', async () => {
      mockFetch.mockResolvedValueOnce(
        jsonResponse({ detail: 'Not found' }, 404),
      );
      const resource = createResource(mockFetch);

      await expect(resource.testGet('/test')).rejects.toThrow(NotFoundError);
    });

    it('should throw BadRequestError for 400', async () => {
      mockFetch.mockResolvedValueOnce(
        jsonResponse({ detail: 'Bad request' }, 400),
      );
      const resource = createResource(mockFetch);

      await expect(resource.testGet('/test')).rejects.toThrow(BadRequestError);
    });
  });

  describe('Retry logic', () => {
    it('should retry on 429 with backoff', async () => {
      mockFetch
        .mockResolvedValueOnce(jsonResponse({ detail: 'Rate limited' }, 429))
        .mockResolvedValueOnce(jsonResponse({ ok: true }));

      const resource = createResource(mockFetch);
      const result = await resource.testGet('/test');

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result).toEqual({ ok: true });
    });

    it('should retry on 500', async () => {
      mockFetch
        .mockResolvedValueOnce(jsonResponse({ detail: 'Server error' }, 500))
        .mockResolvedValueOnce(jsonResponse({ ok: true }));

      const resource = createResource(mockFetch);
      const result = await resource.testGet('/test');

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result).toEqual({ ok: true });
    });

    it('should NOT retry on 400', async () => {
      mockFetch.mockResolvedValueOnce(
        jsonResponse({ detail: 'Bad request' }, 400),
      );
      const resource = createResource(mockFetch);

      await expect(resource.testGet('/test')).rejects.toThrow(BadRequestError);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should NOT retry on 401', async () => {
      mockFetch.mockResolvedValueOnce(
        jsonResponse({ detail: 'Unauthorized' }, 401),
      );
      const resource = createResource(mockFetch);

      await expect(resource.testGet('/test')).rejects.toThrow(AuthenticationError);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should exhaust retries and throw', async () => {
      mockFetch
        .mockResolvedValue(jsonResponse({ detail: 'Server error' }, 500));

      const resource = createResource(mockFetch);

      await expect(resource.testGet('/test')).rejects.toThrow();
      // maxRetries=2 means 3 total attempts
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('should respect Retry-After header on 429', async () => {
      mockFetch
        .mockResolvedValueOnce(
          jsonResponse({ detail: 'Rate limited' }, 429, { 'Retry-After': '1' }),
        )
        .mockResolvedValueOnce(jsonResponse({ ok: true }));

      const resource = createResource(mockFetch);
      const start = Date.now();
      await resource.testGet('/test');
      const elapsed = Date.now() - start;

      // Should have waited ~1 second
      expect(elapsed).toBeGreaterThanOrEqual(900);
    });
  });

  describe('File upload', () => {
    it('should send FormData without Content-Type header', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({ uploaded: true }));
      const resource = createResource(mockFetch);

      const formData = new FormData();
      formData.append('file', new Blob(['test'], { type: 'text/plain' }), 'test.txt');

      await resource.testUpload('/upload', formData);

      const [, init] = mockFetch.mock.calls[0];
      expect(init.method).toBe('POST');
      expect(init.body).toBeInstanceOf(FormData);
      // Content-Type should NOT be set (let runtime set boundary)
      expect(init.headers['Content-Type']).toBeUndefined();
    });
  });
});
