import { describe, it } from 'vitest';
import { getClient, tracked, MISSING_ENV } from './setup';

describe.skipIf(MISSING_ENV)('Dashboard', () => {
  const client = getClient();

  it('GET /dashboard/logs', async () => {
    const res = await tracked('GET', '/dashboard/logs', () =>
      client.dashboard.logs({ limit: 5 }),
    );
    // Discriminated union: success-shaped responses wrap logs under res.data.logs.
    if (res.success) {
      if (!res.data) throw new Error('Missing data field');
      if (!Array.isArray(res.data.logs)) throw new Error('logs is not array');
    }
  });

  it('GET /dashboard/analytics/overview', async () => {
    const res = await tracked('GET', '/dashboard/analytics/overview', () =>
      client.dashboard.analyticsOverview({ limit: 5 }),
    );
    if (res.success && !res.data.overview) {
      throw new Error('Missing overview field');
    }
  });

  it('GET /dashboard/analytics/tools', async () => {
    const res = await tracked('GET', '/dashboard/analytics/tools', () =>
      client.dashboard.analyticsTools({ period: '30d', limit: 5 }),
    );
    if (res.success && !Array.isArray(res.data.tool_usages)) {
      throw new Error('tool_usages is not array');
    }
  });

  it('GET /dashboard/analytics/llm-usage', async () => {
    const res = await tracked('GET', '/dashboard/analytics/llm-usage', () =>
      client.dashboard.analyticsLlmUsage({ period: '30d', limit: 5 }),
    );
    if (res.success && !Array.isArray(res.data.llm_usages)) {
      throw new Error('llm_usages is not array');
    }
  });

  it('GET /dashboard/users', async () => {
    const res = await tracked('GET', '/dashboard/users', () =>
      client.dashboard.users({ limit: 5 }),
    );
    if (res.success && !Array.isArray(res.users)) {
      throw new Error('users is not array');
    }
  });
});
