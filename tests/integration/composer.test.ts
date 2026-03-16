import { describe, it, afterAll } from 'vitest';
import { getClient, tracked, skip, MISSING_ENV, ENV } from './setup';

describe.skipIf(MISSING_ENV)('Composer', () => {
  const client = getClient();
  let composerChatId = '';
  let runId = '';
  let helperWorkflowId = '';

  it('POST /composer/chat — start session', async () => {
    if (!ENV.testWorkflowId) {
      skip('POST', '/composer/chat', 'MODULEX_TEST_WORKFLOW_ID not set');
      return;
    }
    const res = await tracked('POST', '/composer/chat', () =>
      client.composer.chat({
        message: 'Add a simple text output node',
        workflowId: ENV.testWorkflowId,
        llm: {
          integration_name: 'openai',
          provider_id: 'openai',
          model_id: 'gpt-4o-mini',
        },
      }),
    );
    if (!res.run_id) throw new Error('Missing run_id');
    composerChatId = res.composer_chat_id ?? '';
    runId = res.run_id;
    helperWorkflowId = ENV.testWorkflowId;
  });

  it('GET /composer/chat/{id}/status', async () => {
    if (!composerChatId) {
      skip('GET', '/composer/chat/{id}/status', 'No composer session');
      return;
    }
    await tracked('GET', `/composer/chat/${composerChatId}/status`, () =>
      client.composer.status(composerChatId),
    );
  });

  it('GET /composer/chat/{id}/listen/{runId} — SSE', async () => {
    if (!composerChatId || !runId) {
      skip('GET', '/composer/chat/{id}/listen/{runId}', 'No composer session');
      return;
    }
    const { readSSE } = await import('./setup');
    const stream = client.composer.listen(composerChatId, runId);
    const events = await readSSE(stream, 8_000);
    if (events.length === 0) {
      skip('GET', '/composer/chat/{id}/listen/{runId}', 'No events (run may have completed)');
    }
  });

  it('GET /composer/chat/{id} — get session', async () => {
    if (!composerChatId) {
      skip('GET', '/composer/chat/{id}', 'No composer session');
      return;
    }
    const res = await tracked('GET', `/composer/chat/${composerChatId}`, () =>
      client.composer.get(composerChatId),
    );
    if (!res.id && !res.composer_chat_id) throw new Error('Missing id');
  });

  it('POST /composer/chat/{id}/revert', async () => {
    if (!composerChatId) {
      skip('POST', '/composer/chat/{id}/revert', 'No composer session');
      return;
    }
    await tracked('POST', `/composer/chat/${composerChatId}/revert`, () =>
      client.composer.revert(composerChatId),
    );
  });

  it('GET /composer/chat/workflow/{workflowId}/history', async () => {
    if (!helperWorkflowId) {
      skip('GET', '/composer/chat/workflow/{workflowId}/history', 'No workflow');
      return;
    }
    await tracked('GET', `/composer/chat/workflow/${helperWorkflowId}/history`, () =>
      client.composer.history(helperWorkflowId, { limit: 5 }),
    );
  });

  it('DELETE /composer/chat/{id}', async () => {
    if (!composerChatId) {
      skip('DELETE', '/composer/chat/{id}', 'No composer session');
      return;
    }
    await tracked('DELETE', `/composer/chat/${composerChatId}`, () =>
      client.composer.delete(composerChatId),
    );
    composerChatId = '';
  });

  afterAll(async () => {
    if (composerChatId) {
      try { await client.composer.delete(composerChatId); } catch { /* ignore */ }
    }
  });
});
