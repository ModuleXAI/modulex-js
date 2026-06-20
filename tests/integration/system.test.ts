import { describe, it, beforeAll } from 'vitest';
import { getClient, tracked, MISSING_ENV } from './setup';

describe.skipIf(MISSING_ENV)('System', () => {
  const client = getClient();

  it('GET /system/health', async () => {
    const res = await tracked('GET', '/system/health', () =>
      client.system.health(),
    );
    if (!res.status) throw new Error(`Unexpected status: ${res.status}`);
    if (!res.service) throw new Error('Missing service name');
    if (!res.version) throw new Error('Missing version');
  });

  it('GET /system/timezones', async () => {
    const res = await tracked('GET', '/system/timezones', () =>
      client.system.timezones(),
    );
    if (!res || !Array.isArray(res.all_timezones)) throw new Error('No timezone data');
    if (!Array.isArray(res.popular)) throw new Error('No popular timezone groups');
  });

  it('GET /system/timezones/search', async () => {
    const res = await tracked('GET', '/system/timezones/search', () =>
      client.system.searchTimezones('Istanbul'),
    );
    if (!Array.isArray(res)) throw new Error('Search results must be an array');
  });
});
