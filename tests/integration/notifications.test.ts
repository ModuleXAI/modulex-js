import { describe, it } from 'vitest';
import { getClient, tracked, MISSING_ENV } from './setup';

describe.skipIf(MISSING_ENV)('Notifications', () => {
  const client = getClient();

  it('GET /notifications — list', async () => {
    const res = await tracked('GET', '/notifications', () =>
      client.notifications.list(),
    );
    if (!Array.isArray(res.notifications)) throw new Error('notifications is not array');
  });

  it('POST /notifications/organization — create', async () => {
    await tracked('POST', '/notifications/organization', () =>
      client.notifications.create({
        notificationTopic: 'integration',
        message: `SDK Integration Test ${Date.now()}`,
      }),
    );
  });
});
