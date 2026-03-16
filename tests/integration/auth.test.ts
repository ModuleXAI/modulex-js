import { describe, it } from 'vitest';
import { getClient, tracked, MISSING_ENV } from './setup';

describe.skipIf(MISSING_ENV)('Auth', () => {
  const client = getClient();

  it('GET /auth/me', async () => {
    const me = await tracked('GET', '/auth/me', () =>
      client.auth.me(),
    );
    if (!me.id || !me.email) throw new Error('Missing user fields');
  });

  it('GET /auth/me/organizations', async () => {
    const res = await tracked('GET', '/auth/me/organizations', () =>
      client.auth.organizations(),
    );
    if (!Array.isArray(res.organizations)) throw new Error('organizations is not array');
  });

  it('GET /auth/invitations/my', async () => {
    const res = await tracked('GET', '/auth/invitations/my', () =>
      client.auth.invitations(),
    );
    if (!Array.isArray(res.invitations)) throw new Error('invitations is not array');
  });
});
