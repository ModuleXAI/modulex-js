import { describe, it } from 'vitest';
import { getClient, tracked, skip, readSSE, MISSING_ENV, ENV } from './setup';

describe.skipIf(MISSING_ENV)('Executions', () => {
  const client = getClient();
  let runId = '';
  let threadId = '';

  it('POST /workflows/run — by workflow ID', async () => {
    if (!ENV.testWorkflowId) {
      skip('POST', '/workflows/run', 'MODULEX_TEST_WORKFLOW_ID not set');
      return;
    }
    try {
      const res = await tracked('POST', '/workflows/run', () =>
        client.executions.run({
          workflowId: ENV.testWorkflowId,
          input: { messages: [{ role: 'user', content: 'Hello from SDK integration test' }] },
          stream: true,
          ephemeral: true,
        }),
      );
      if (!res.run_id) throw new Error('Missing run_id');
      runId = res.run_id;
      threadId = res.thread_id;
    } catch (err: any) {
      // 400 = no deployment — skip dependent tests gracefully
      if (err.status === 400) {
        skip('POST', '/workflows/run', `Workflow not deployed: ${err.message}`);
        return;
      }
      throw err;
    }
  });

  it('POST /workflows/run — direct LLM call', async () => {
    const res = await tracked('POST', '/workflows/run (direct LLM)', () =>
      client.executions.run({
        llm: {
          integration_name: 'openai',
          provider_id: 'openai',
          model_id: 'gpt-4o-mini',
          temperature: 0.1,
        },
        input: { messages: [{ role: 'user', content: 'Say "SDK test OK" and nothing else.' }] },
        stream: false,
        ephemeral: true,
      }),
    );
    if (!res.run_id) throw new Error('Missing run_id');
  });

  it('GET /workflows/state/{threadId}', async () => {
    if (!threadId) {
      skip('GET', '/workflows/state/{threadId}', 'No threadId from run');
      return;
    }
    try {
      const res = await tracked('GET', `/workflows/state/${threadId}`, () =>
        client.executions.getState(threadId),
      );
      if (res.thread_id !== threadId) throw new Error('Thread ID mismatch');
    } catch (err: any) {
      // 500 = known server-side bug (pending_sends attribute)
      if (err.status === 500) {
        skip('GET', '/workflows/state/{threadId}', 'Server returned 500 (known API issue)');
        return;
      }
      throw err;
    }
  });

  it('GET /workflows/listen/{runId} — SSE', async () => {
    if (!runId) {
      skip('SSE', '/workflows/listen/{runId}', 'No runId from run');
      return;
    }
    const start = performance.now();
    try {
      const stream = client.executions.listen(runId);
      const events = await readSSE(stream, 10_000);
      const ms = Math.round(performance.now() - start);
      console.log(`    SSE collected ${events.length} events`);
      const { record } = await import('./setup');
      record({ status: 'pass', method: 'SSE', path: `/workflows/listen/${runId}`, durationMs: ms });
    } catch (err: any) {
      const ms = Math.round(performance.now() - start);
      const { record } = await import('./setup');
      record({ status: 'fail', method: 'SSE', path: `/workflows/listen/${runId}`, durationMs: ms, error: err.message });
    }
  });

  it('POST /workflows/cancel/{runId}', async () => {
    if (!runId) {
      skip('POST', '/workflows/cancel/{runId}', 'No runId from run');
      return;
    }
    try {
      await tracked('POST', `/workflows/cancel/${runId}`, () =>
        client.executions.cancel(runId, { reason: 'integration test cleanup' }),
      );
    } catch (err: any) {
      // 400/409/404 expected if run already completed
      if (err.status === 400 || err.status === 409 || err.status === 404) return;
      throw err;
    }
  });
});
