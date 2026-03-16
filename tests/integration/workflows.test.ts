import { describe, it, afterAll } from 'vitest';
import { getClient, tracked, skip, MISSING_ENV } from './setup';

describe.skipIf(MISSING_ENV)('Workflows', () => {
  const client = getClient();
  let createdId = '';

  const minimalSchema = {
    metadata: { name: 'Integration Test Workflow', version: '0.0.1' },
    config: {},
    state_schema: {
      fields: {
        messages: { type: 'messages', reducer: 'add', required: true, default: null },
      },
    },
    nodes: [
      {
        id: 'start',
        type: 'llm' as const,
        name: 'Start',
        x: 0,
        y: 0,
        llm_config: {
          llm: {
            integration_name: 'openai',
            provider_id: 'openai',
            model_id: 'gpt-4o-mini',
          },
          system_prompt: 'Say hello.',
        },
      },
    ],
    edges: [],
    entry_point: 'start',
  };

  it('POST /workflows — create', async () => {
    const res = await tracked('POST', '/workflows', () =>
      client.workflows.create({
        workflowSchema: minimalSchema,
        name: `sdk-integ-test-${Date.now()}`,
        status: 'draft',
        visibility: 'private',
      }),
    );
    if (!res.id) throw new Error('Missing workflow id');
    createdId = res.id;
  });

  it('GET /workflows — list', async () => {
    const res = await tracked('GET', '/workflows', () =>
      client.workflows.list({ page: 1, pageSize: 5 }),
    );
    if (!Array.isArray(res.workflows)) throw new Error('workflows is not array');
  });

  it('GET /workflows/{id} — get', async () => {
    if (!createdId) {
      skip('GET', '/workflows/{id}', 'No workflow created');
      return;
    }
    const res = await tracked('GET', `/workflows/${createdId}`, () =>
      client.workflows.get(createdId),
    );
    if (res.id !== createdId) throw new Error('ID mismatch');
    if (!res.workflow_schema) throw new Error('Missing schema in detail response');
  });

  it('PUT /workflows/{id} — update', async () => {
    if (!createdId) {
      skip('PUT', '/workflows/{id}', 'No workflow created');
      return;
    }
    const res = await tracked('PUT', `/workflows/${createdId}`, () =>
      client.workflows.update(createdId, { description: 'Updated by integration test' }),
    );
    if (!res.id) throw new Error('Update returned no id');
  });

  it('GET /workflows/builder/details', async () => {
    const res = await tracked('GET', '/workflows/builder/details', () =>
      client.workflows.builderDetails(),
    );
    if (!res.node_types) throw new Error('Missing node_types');
  });

  it('DELETE /workflows/{id} — delete', async () => {
    if (!createdId) {
      skip('DELETE', '/workflows/{id}', 'No workflow created');
      return;
    }
    const res = await tracked('DELETE', `/workflows/${createdId}`, () =>
      client.workflows.delete(createdId),
    );
    if (res.status !== 'deleted') throw new Error(`Unexpected status: ${res.status}`);
    createdId = '';
  });

  // Negative test
  it('GET /workflows/{invalid} — expect 404', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    try {
      await tracked('GET', `/workflows/${fakeId} (404 test)`, () =>
        client.workflows.get(fakeId),
      );
      throw new Error('Expected 404 but got success');
    } catch (err: any) {
      if (err.status === 404) return;
      throw err;
    }
  });

  afterAll(async () => {
    if (createdId) {
      try { await client.workflows.delete(createdId); } catch { /* ignore */ }
    }
  });
});
