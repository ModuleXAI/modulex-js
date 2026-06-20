import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Modulex } from '../src/client';

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('ApiKeys Resource', () => {
  let mockFetch: ReturnType<typeof vi.fn>;
  let client: Modulex;

  beforeEach(() => {
    mockFetch = vi.fn();
    client = new Modulex({
      apiKey: 'mx_live_test',
      organizationId: 'org-1',
      fetch: mockFetch,
    });
  });

  it('should create an API key (POST /api-keys, camelCase -> snake_case body)', async () => {
    const created = {
      id: 'k1',
      name: 'CI key',
      key: 'mx_live_secret_full',
      key_hint: 'mx_live_',
      masked_key: 'mx_live_XXXX****',
      organization_id: 'org-1',
      expires_at: '2030-01-01T00:00:00Z',
      is_expired: false,
      is_active: true,
      rate_limit_per_minute: 120,
      last_used_at: null,
      created_at: '2026-06-19T00:00:00Z',
      revoked_at: null,
    };
    mockFetch.mockResolvedValueOnce(jsonResponse(created, 201));

    const result = await client.apiKeys.create({
      name: 'CI key',
      organizationId: 'org-1',
      expiresAt: '2030-01-01T00:00:00Z',
      rateLimitPerMinute: 120,
    });

    // method + path
    expect(mockFetch.mock.calls[0][1].method).toBe('POST');
    expect(mockFetch.mock.calls[0][0]).toContain('/api-keys');

    // camelCase params converted to snake_case on the wire
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.name).toBe('CI key');
    expect(body.organization_id).toBe('org-1');
    expect(body.expires_at).toBe('2030-01-01T00:00:00Z');
    expect(body.rate_limit_per_minute).toBe(120);

    // return type read correctly — full key only present on create
    expect(result.id).toBe('k1');
    expect(result.key).toBe('mx_live_secret_full');
    expect(result.masked_key).toBe('mx_live_XXXX****');
    expect(result.is_active).toBe(true);
    expect(result.is_expired).toBe(false);
    expect(result.rate_limit_per_minute).toBe(120);
  });

  it('should list API keys with includeRevoked converted to snake_case query', async () => {
    const listData = {
      keys: [
        {
          id: 'k1',
          name: 'CI key',
          key_hint: 'mx_live_',
          masked_key: 'mx_live_XXXX****',
          organization_id: 'org-1',
          expires_at: null,
          is_expired: false,
          is_active: true,
          rate_limit_per_minute: 60,
          last_used_at: null,
          created_at: '2026-06-19T00:00:00Z',
        },
      ],
      total: 1,
      max_keys: 25,
    };
    mockFetch.mockResolvedValueOnce(jsonResponse(listData));

    const result = await client.apiKeys.list({ includeRevoked: true });

    expect(mockFetch.mock.calls[0][1].method).toBe('GET');
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain('/api-keys');
    expect(url).toContain('include_revoked=true'); // camelCase -> snake_case query param

    expect(result.keys).toHaveLength(1);
    expect(result.keys[0].id).toBe('k1');
    expect(result.total).toBe(1);
    expect(result.max_keys).toBe(25);
  });

  it('should list API keys with no params', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ keys: [], total: 0, max_keys: 25 }));

    const result = await client.apiKeys.list();

    expect(mockFetch.mock.calls[0][1].method).toBe('GET');
    expect(mockFetch.mock.calls[0][0]).toContain('/api-keys');
    expect(result.total).toBe(0);
    expect(result.max_keys).toBe(25);
  });

  it('should get a single API key by id (GET /api-keys/{keyId}, masked)', async () => {
    const keyData = {
      id: 'k1',
      name: 'CI key',
      key_hint: 'mx_live_',
      masked_key: 'mx_live_XXXX****',
      organization_id: 'org-1',
      expires_at: null,
      is_expired: false,
      is_active: true,
      rate_limit_per_minute: 60,
      last_used_at: '2026-06-18T12:00:00Z',
      created_at: '2026-06-19T00:00:00Z',
    };
    mockFetch.mockResolvedValueOnce(jsonResponse(keyData));

    const result = await client.apiKeys.get('k1');

    expect(mockFetch.mock.calls[0][1].method).toBe('GET');
    expect(mockFetch.mock.calls[0][0]).toContain('/api-keys/k1');

    expect(result.id).toBe('k1');
    expect(result.masked_key).toBe('mx_live_XXXX****');
    expect(result.last_used_at).toBe('2026-06-18T12:00:00Z');
    expect(result.key).toBeUndefined(); // full key never returned on get
  });

  it('should revoke an API key (DELETE /api-keys/{keyId})', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ success: true, message: 'API key revoked' }),
    );

    const result = await client.apiKeys.revoke('k1');

    expect(mockFetch.mock.calls[0][1].method).toBe('DELETE');
    expect(mockFetch.mock.calls[0][0]).toContain('/api-keys/k1');

    expect(result.success).toBe(true);
    expect(result.message).toBe('API key revoked');
  });
});
