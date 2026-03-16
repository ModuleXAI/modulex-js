import { describe, it, beforeAll } from 'vitest';
import { getClient, tracked, MISSING_ENV } from './setup';

describe.skipIf(MISSING_ENV)('System', () => {
  const client = getClient();

  it('GET /system/health', async () => {
    const res = await tracked('GET', '/system/health', () =>
      client.system.health(),
    );
    if (res.status !== 'healthy') throw new Error(`Unexpected status: ${res.status}`);
  });

  it('GET /system/metrics', async () => {
    const res = await tracked('GET', '/system/metrics', () =>
      client.system.metrics(),
    );
    if (typeof res !== 'string' || res.length === 0) throw new Error('Empty metrics');
  });

  it('GET /system/timezones', async () => {
    const res = await tracked('GET', '/system/timezones', () =>
      client.system.timezones(),
    );
    if (!res) throw new Error('No timezone data');
  });

  it('GET /system/timezones/search', async () => {
    const res = await tracked('GET', '/system/timezones/search', () =>
      client.system.searchTimezones('Istanbul'),
    );
    if (!res) throw new Error('No search results');
  });
});
