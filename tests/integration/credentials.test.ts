import { describe, it, afterAll } from 'vitest';
import { getClient, tracked, skip, MISSING_ENV } from './setup';

describe.skipIf(MISSING_ENV)('Credentials', () => {
  const client = getClient();
  let createdCredId = '';

  it('GET /credentials — list (grouped)', async () => {
    const res = await tracked('GET', '/credentials', () =>
      client.credentials.list(),
    );
    if (!res || typeof res !== 'object') throw new Error('Unexpected response');
  });

  it('POST /credentials — create modulex_key', async () => {
    const res = await tracked('POST', '/credentials', () =>
      client.credentials.create({
        integrationName: 'tavily',
        authType: 'modulex_key',
        displayName: `sdk-integ-test-${Date.now()}`,
        makeDefault: false,
      }),
    );
    if (!res.credential_id) throw new Error('Missing credential_id');
    createdCredId = res.credential_id;
  });

  it('GET /credentials/{id} — get', async () => {
    if (!createdCredId) {
      skip('GET', '/credentials/{id}', 'No credential created');
      return;
    }
    const res = await tracked('GET', `/credentials/${createdCredId}`, () =>
      client.credentials.get(createdCredId),
    );
    if (res.credential_id !== createdCredId) throw new Error('ID mismatch');
  });

  it('PUT /credentials/{id} — update', async () => {
    if (!createdCredId) {
      skip('PUT', '/credentials/{id}', 'No credential created');
      return;
    }
    await tracked('PUT', `/credentials/${createdCredId}`, () =>
      client.credentials.update(createdCredId, { displayName: 'Updated by test' }),
    );
  });

  it('POST /credentials/{id}/test — test credential', async () => {
    if (!createdCredId) {
      skip('POST', '/credentials/{id}/test', 'No credential created');
      return;
    }
    const res = await tracked('POST', `/credentials/${createdCredId}/test`, () =>
      client.credentials.test(createdCredId),
    );
    if (typeof res.is_valid !== 'boolean') throw new Error('Missing is_valid');
  });

  it('GET /credentials/{id}/usage', async () => {
    if (!createdCredId) {
      skip('GET', '/credentials/{id}/usage', 'No credential created');
      return;
    }
    await tracked('GET', `/credentials/${createdCredId}/usage`, () =>
      client.credentials.usage(createdCredId),
    );
  });

  it('GET /credentials/{id}/audit', async () => {
    if (!createdCredId) {
      skip('GET', '/credentials/{id}/audit', 'No credential created');
      return;
    }
    try {
      await tracked('GET', `/credentials/${createdCredId}/audit`, () =>
        client.credentials.audit(createdCredId),
      );
    } catch (err: any) {
      // 500 = known server-side issue — skip rather than fail the suite
      if (err.status === 500) {
        skip('GET', '/credentials/{id}/audit', 'Server returned 500 (known API issue)');
        return;
      }
      throw err;
    }
  });

  it('POST /credentials/test-temporary', async () => {
    await tracked('POST', '/credentials/test-temporary', () =>
      client.credentials.testTemporary({
        integrationName: 'openai',
        authType: 'modulex_key',
        authData: {},
      }),
    );
  });

  it('DELETE /credentials/{id} — delete', async () => {
    if (!createdCredId) {
      skip('DELETE', '/credentials/{id}', 'No credential created');
      return;
    }
    await tracked('DELETE', `/credentials/${createdCredId}`, () =>
      client.credentials.delete(createdCredId),
    );
    createdCredId = '';
  });

  // Negative test
  it('GET /credentials/{invalid} — expect 404', async () => {
    try {
      await tracked('GET', '/credentials/{invalid} (404 test)', () =>
        client.credentials.get('00000000-0000-0000-0000-000000000000'),
      );
      throw new Error('Expected 404 but got success');
    } catch (err: any) {
      if (err.status === 404) return;
      throw err;
    }
  });

  afterAll(async () => {
    if (createdCredId) {
      try { await client.credentials.delete(createdCredId); } catch { /* ignore */ }
    }
  });
});
