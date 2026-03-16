import { describe, it, afterAll } from 'vitest';
import { getClient, tracked, skip, MISSING_ENV, ENV } from './setup';

describe.skipIf(MISSING_ENV)('Schedules', () => {
  const client = getClient();
  let scheduleId = '';

  it('POST /schedules — create', async () => {
    if (!ENV.testWorkflowId) {
      skip('POST', '/schedules', 'MODULEX_TEST_WORKFLOW_ID not set');
      return;
    }
    try {
      const res = await tracked('POST', '/schedules', () =>
        client.schedules.create({
          workflowId: ENV.testWorkflowId,
          name: `sdk-integ-test-${Date.now()}`,
          scheduleType: 'interval',
          intervalSeconds: 3600,
          timezone: 'UTC',
        }),
      );
      if (!res.id) throw new Error('Missing id');
      scheduleId = res.id;
    } catch (err: any) {
      // 400 = workflow has no live deployment
      if (err.status === 400) {
        skip('POST', '/schedules', `Cannot create: ${err.message}`);
        return;
      }
      throw err;
    }
  });

  it('GET /schedules — list', async () => {
    const res = await tracked('GET', '/schedules', () =>
      client.schedules.list(),
    );
    if (!Array.isArray(res.schedules)) throw new Error('schedules is not array');
  });

  it('GET /schedules/{id} — get', async () => {
    if (!scheduleId) {
      skip('GET', '/schedules/{id}', 'No schedule created');
      return;
    }
    const res = await tracked('GET', `/schedules/${scheduleId}`, () =>
      client.schedules.get(scheduleId),
    );
    if (res.id !== scheduleId) throw new Error('ID mismatch');
  });

  it('PUT /schedules/{id} — update', async () => {
    if (!scheduleId) {
      skip('PUT', '/schedules/{id}', 'No schedule created');
      return;
    }
    await tracked('PUT', `/schedules/${scheduleId}`, () =>
      client.schedules.update(scheduleId, { description: 'Updated by test' }),
    );
  });

  it('POST /schedules/{id}/pause', async () => {
    if (!scheduleId) {
      skip('POST', '/schedules/{id}/pause', 'No schedule created');
      return;
    }
    await tracked('POST', `/schedules/${scheduleId}/pause`, () =>
      client.schedules.pause(scheduleId),
    );
  });

  it('POST /schedules/{id}/resume', async () => {
    if (!scheduleId) {
      skip('POST', '/schedules/{id}/resume', 'No schedule created');
      return;
    }
    await tracked('POST', `/schedules/${scheduleId}/resume`, () =>
      client.schedules.resume(scheduleId),
    );
  });

  it('GET /schedules/{id}/runs', async () => {
    if (!scheduleId) {
      skip('GET', '/schedules/{id}/runs', 'No schedule created');
      return;
    }
    await tracked('GET', `/schedules/${scheduleId}/runs`, () =>
      client.schedules.runs(scheduleId),
    );
  });

  it('GET /schedules/{id}/runs/stats', async () => {
    if (!scheduleId) {
      skip('GET', '/schedules/{id}/runs/stats', 'No schedule created');
      return;
    }
    await tracked('GET', `/schedules/${scheduleId}/runs/stats`, () =>
      client.schedules.runStats(scheduleId),
    );
  });

  it('DELETE /schedules/{id} — delete', async () => {
    if (!scheduleId) {
      skip('DELETE', '/schedules/{id}', 'No schedule created');
      return;
    }
    await tracked('DELETE', `/schedules/${scheduleId}`, () =>
      client.schedules.delete(scheduleId),
    );
    scheduleId = '';
  });

  afterAll(async () => {
    if (scheduleId) {
      try { await client.schedules.delete(scheduleId); } catch { /* ignore */ }
    }
  });
});
