import { describe, it } from 'vitest';
import { getClient, tracked, MISSING_ENV } from './setup';

describe.skipIf(MISSING_ENV)('Dashboard', () => {
  const client = getClient();

  it('GET /dashboard/logs', async () => {
    const res = await tracked('GET', '/dashboard/logs', () =>
      client.dashboard.logs({ limit: 5 }),
    );
    // Response wraps logs under res.data.logs
    if (!res.data) throw new Error('Missing data field');
  });

  it('GET /dashboard/analytics/overview', async () => {
    await tracked('GET', '/dashboard/analytics/overview', () =>
      client.dashboard.analyticsOverview({ limit: 5 }),
    );
  });

  it('GET /dashboard/analytics/tools', async () => {
    await tracked('GET', '/dashboard/analytics/tools', () =>
      client.dashboard.analyticsTools({ period: '30d', limit: 5 }),
    );
  });

  it('GET /dashboard/analytics/llm-usage', async () => {
    await tracked('GET', '/dashboard/analytics/llm-usage', () =>
      client.dashboard.analyticsLlmUsage({ period: '30d', limit: 5 }),
    );
  });

  it('GET /dashboard/users', async () => {
    const res = await tracked('GET', '/dashboard/users', () =>
      client.dashboard.users({ limit: 5 }),
    );
    if (!Array.isArray(res.users)) throw new Error('users is not array');
  });
});
