import { describe, it, afterAll } from 'vitest';
import { getClient, tracked, skip, MISSING_ENV } from './setup';

describe.skipIf(MISSING_ENV)('Knowledge Bases', () => {
  const client = getClient();
  let kbId = '';

  it('GET /knowledge-bases/info/supported-file-types', async () => {
    const res = await tracked('GET', '/knowledge-bases/info/supported-file-types', () =>
      client.knowledge.supportedFileTypes(),
    );
    if (!Array.isArray(res.supported_types)) throw new Error('supported_types is not array');
  });

  it('POST /knowledge-bases — create', async () => {
    try {
      const res = await tracked('POST', '/knowledge-bases', () =>
        client.knowledge.create({
          name: `sdk-integ-test-${Date.now()}`,
          description: 'Created by integration tests',
        }),
      );
      if (!res.id) throw new Error('Missing id');
      kbId = res.id;
    } catch (err: any) {
      // 403 = quota exceeded — skip dependent tests gracefully
      if (err.status === 403) {
        skip('POST', '/knowledge-bases', `Quota exceeded: ${err.message}`);
        return;
      }
      throw err;
    }
  });

  it('GET /knowledge-bases — list', async () => {
    const res = await tracked('GET', '/knowledge-bases', () =>
      client.knowledge.list(),
    );
    // Response is an object — just verify it returned
    if (!res || typeof res !== 'object') throw new Error('Unexpected response');
  });

  it('GET /knowledge-bases/stats', async () => {
    await tracked('GET', '/knowledge-bases/stats', () =>
      client.knowledge.stats(),
    );
  });

  it('GET /knowledge-bases/{id} — get', async () => {
    if (!kbId) {
      skip('GET', '/knowledge-bases/{id}', 'No KB created');
      return;
    }
    const res = await tracked('GET', `/knowledge-bases/${kbId}`, () =>
      client.knowledge.get(kbId),
    );
    if (res.id !== kbId) throw new Error('ID mismatch');
  });

  it('PUT /knowledge-bases/{id} — update', async () => {
    if (!kbId) {
      skip('PUT', '/knowledge-bases/{id}', 'No KB created');
      return;
    }
    await tracked('PUT', `/knowledge-bases/${kbId}`, () =>
      client.knowledge.update(kbId, { description: 'Updated by test' }),
    );
  });

  it('GET /knowledge-bases/{id}/documents — list docs', async () => {
    if (!kbId) {
      skip('GET', '/knowledge-bases/{id}/documents', 'No KB created');
      return;
    }
    await tracked('GET', `/knowledge-bases/${kbId}/documents`, () =>
      client.knowledge.documents(kbId),
    );
  });

  it('POST /knowledge-bases/{id}/search', async () => {
    if (!kbId) {
      skip('POST', '/knowledge-bases/{id}/search', 'No KB created');
      return;
    }
    await tracked('POST', `/knowledge-bases/${kbId}/search`, () =>
      client.knowledge.search(kbId, { query: 'test query', topK: 3 }),
    );
  });

  it('POST /knowledge-bases/{id}/retrieve-context', async () => {
    if (!kbId) {
      skip('POST', '/knowledge-bases/{id}/retrieve-context', 'No KB created');
      return;
    }
    await tracked('POST', `/knowledge-bases/${kbId}/retrieve-context`, () =>
      client.knowledge.retrieveContext(kbId, { query: 'test', maxTokens: 500 }),
    );
  });

  it('POST /knowledge-bases/{id}/archive', async () => {
    if (!kbId) {
      skip('POST', '/knowledge-bases/{id}/archive', 'No KB created');
      return;
    }
    await tracked('POST', `/knowledge-bases/${kbId}/archive`, () =>
      client.knowledge.archive(kbId),
    );
  });

  it('DELETE /knowledge-bases/{id} — delete', async () => {
    if (!kbId) {
      skip('DELETE', '/knowledge-bases/{id}', 'No KB created');
      return;
    }
    await tracked('DELETE', `/knowledge-bases/${kbId}`, () =>
      client.knowledge.delete(kbId),
    );
    kbId = '';
  });

  afterAll(async () => {
    if (kbId) {
      try { await client.knowledge.delete(kbId); } catch { /* ignore */ }
    }
  });
});
