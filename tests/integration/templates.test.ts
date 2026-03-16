import { describe, it } from 'vitest';
import { getClient, tracked, MISSING_ENV } from './setup';

describe.skipIf(MISSING_ENV)('Templates', () => {
  const client = getClient();

  it('GET /templates — list', async () => {
    const res = await tracked('GET', '/templates', () =>
      client.templates.list(),
    );
    if (!Array.isArray(res.templates)) throw new Error('templates is not array');
  });

  it('GET /templates/me — mine', async () => {
    const res = await tracked('GET', '/templates/me', () =>
      client.templates.mine(),
    );
    if (!Array.isArray(res.templates)) throw new Error('templates is not array');
  });

  it('GET /templates/creators/me — getCreator', async () => {
    try {
      await tracked('GET', '/templates/creators/me', () =>
        client.templates.getCreator(),
      );
    } catch (err: any) {
      // 404 is fine — user may not have a creator profile
      if (err.status === 404) return;
      throw err;
    }
  });

  it('GET /templates/{id} — get first template', async () => {
    const list = await client.templates.list();
    if (list.templates.length === 0) {
      const { skip } = await import('./setup');
      skip('GET', '/templates/{id}', 'No templates available');
      return;
    }
    const first = list.templates[0];
    const res = await tracked('GET', `/templates/${first.id}`, () =>
      client.templates.get(first.id),
    );
    if (res.id !== first.id) throw new Error('ID mismatch');
  });

  it('POST /templates/{id}/like — toggle like', async () => {
    const list = await client.templates.list();
    if (list.templates.length === 0) {
      const { skip } = await import('./setup');
      skip('POST', '/templates/{id}/like', 'No templates available');
      return;
    }
    const first = list.templates[0];
    const res = await tracked('POST', `/templates/${first.id}/like`, () =>
      client.templates.like(first.id),
    );
    if (typeof res.liked !== 'boolean') throw new Error('Missing liked field');
    // Toggle back to original state
    await client.templates.like(first.id);
  });
});
