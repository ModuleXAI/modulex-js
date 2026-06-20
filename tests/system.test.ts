import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Modulex } from '../src/client';

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('System Resource', () => {
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

  it('should list timezones with snake_case response shape (GET /system/timezones)', async () => {
    const data = {
      popular: [
        {
          region: 'Europe',
          timezones: [{ value: 'Europe/Istanbul', label: 'Istanbul', offset: '+03:00' }],
        },
      ],
      all_timezones: ['Europe/Istanbul', 'UTC'],
    };
    mockFetch.mockResolvedValueOnce(jsonResponse(data));

    const result = await client.system.timezones();

    expect(result.popular[0].region).toBe('Europe');
    expect(result.popular[0].timezones[0].value).toBe('Europe/Istanbul');
    // Response keys remain raw snake_case (GET does not transform keys).
    expect(result.all_timezones).toEqual(['Europe/Istanbul', 'UTC']);

    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toContain('/system/timezones');
    expect(init.method).toBe('GET');
  });

  it('should search timezones and return an array (GET /system/timezones/search)', async () => {
    const data = [
      { value: 'Europe/Istanbul', label: 'Istanbul', offset: '+03:00' },
    ];
    mockFetch.mockResolvedValueOnce(jsonResponse(data));

    const result = await client.system.searchTimezones('Istanbul');

    expect(Array.isArray(result)).toBe(true);
    expect(result[0].value).toBe('Europe/Istanbul');
    expect(result[0].offset).toBe('+03:00');

    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toContain('/system/timezones/search');
    // query is passed as the `q` query param.
    expect(url).toContain('q=Istanbul');
    expect(init.method).toBe('GET');
  });
});
