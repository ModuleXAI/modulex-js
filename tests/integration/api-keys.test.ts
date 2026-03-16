import { describe, it } from 'vitest';
import { getClient, tracked, MISSING_ENV, ENV } from './setup';

describe.skipIf(MISSING_ENV)('API Keys', () => {
  const client = getClient();
  let createdKeyId = '';

  it('POST /api-keys — create', async () => {
    const res = await tracked('POST', '/api-keys', () =>
      client.apiKeys.create({
        name: `integration-test-${Date.now()}`,
        organizationId: ENV.orgId,
        rateLimitPerMinute: 10,
      }),
    );
    if (!res.id || !res.key) throw new Error('Missing key fields');
    createdKeyId = res.id;
  });

  it('GET /api-keys — list', async () => {
    const res = await tracked('GET', '/api-keys', () =>
      client.apiKeys.list(),
    );
    if (!Array.isArray(res.keys)) throw new Error('keys is not array');
  });

  it('GET /api-keys/{id} — get', async () => {
    if (!createdKeyId) throw new Error('No key to get (create failed)');
    const res = await tracked('GET', `/api-keys/${createdKeyId}`, () =>
      client.apiKeys.get(createdKeyId),
    );
    if (res.id !== createdKeyId) throw new Error('ID mismatch');
  });

  it('DELETE /api-keys/{id} — revoke', async () => {
    if (!createdKeyId) throw new Error('No key to revoke (create failed)');
    await tracked('DELETE', `/api-keys/${createdKeyId}`, () =>
      client.apiKeys.revoke(createdKeyId),
    );
  });
});
