import { describe, it, afterAll } from 'vitest';
import { getClient, tracked, skip, MISSING_ENV } from './setup';

describe.skipIf(MISSING_ENV)('Deployments', () => {
  const client = getClient();

  let workflowId = '';
  let deploymentId = '';

  const minimalSchema = {
    metadata: { name: 'Deploy Test WF', version: '0.0.1' },
    config: {},
    state_schema: { fields: { messages: { type: 'messages', reducer: 'add', required: true, default: null } } },
    nodes: [{
      id: 'n1', type: 'llm' as const, name: 'Node', x: 0, y: 0,
      llm_config: { llm: { integration_name: 'openai', provider_id: 'openai', model_id: 'gpt-4o-mini' } },
    }],
    edges: [],
    entry_point: 'n1',
  };

  it('setup — create workflow for deployment tests', async () => {
    const wf = await tracked('POST', '/workflows (setup)', () =>
      client.workflows.create({ workflowSchema: minimalSchema, name: `deploy-test-${Date.now()}`, status: 'draft', visibility: 'private' }),
    );
    workflowId = wf.id;
  });

  it('POST /workflows/{id}/deploy — create deployment', async () => {
    if (!workflowId) {
      skip('POST', '/workflows/{id}/deploy', 'No workflow');
      return;
    }
    const res = await tracked('POST', `/workflows/${workflowId}/deploy`, () =>
      client.deployments.create(workflowId, { deploymentNote: 'integration test' }),
    );
    if (!res.id) throw new Error('Missing deployment id');
    deploymentId = res.id;
  });

  it('GET /workflows/{id}/deployments — list', async () => {
    if (!workflowId) {
      skip('GET', '/workflows/{id}/deployments', 'No workflow');
      return;
    }
    const res = await tracked('GET', `/workflows/${workflowId}/deployments`, () =>
      client.deployments.list(workflowId),
    );
    if (!Array.isArray(res.deployments)) throw new Error('deployments is not array');
  });

  it('GET /workflows/{id}/deployments/{depId} — get', async () => {
    if (!workflowId || !deploymentId) {
      skip('GET', '/workflows/{id}/deployments/{depId}', 'Missing IDs');
      return;
    }
    const res = await tracked('GET', `/workflows/${workflowId}/deployments/${deploymentId}`, () =>
      client.deployments.get(workflowId, deploymentId),
    );
    if (res.id !== deploymentId) throw new Error('ID mismatch');
  });

  it('PUT /workflows/{id}/deployments/{depId}/activate', async () => {
    if (!workflowId || !deploymentId) {
      skip('PUT', '/workflows/{id}/deployments/{depId}/activate', 'Missing IDs');
      return;
    }
    const res = await tracked('PUT', `/.../deployments/${deploymentId}/activate`, () =>
      client.deployments.activate(workflowId, deploymentId),
    );
    if (!res.success) throw new Error('Activate failed');
  });

  it('DELETE /workflows/{id}/deployments/live — deactivate', async () => {
    if (!workflowId) {
      skip('DELETE', '/workflows/{id}/deployments/live', 'No workflow');
      return;
    }
    const res = await tracked('DELETE', `/.../deployments/live`, () =>
      client.deployments.deactivate(workflowId),
    );
    if (!res.success) throw new Error('Deactivate failed');
  });

  it('DELETE /workflows/{id}/deployments/{depId} — delete', async () => {
    if (!workflowId || !deploymentId) {
      skip('DELETE', '/workflows/{id}/deployments/{depId}', 'Missing IDs');
      return;
    }
    const res = await tracked('DELETE', `/.../deployments/${deploymentId}`, () =>
      client.deployments.delete(workflowId, deploymentId),
    );
    if (!res.success) throw new Error('Delete failed');
    deploymentId = '';
  });

  afterAll(async () => {
    if (workflowId) {
      try { await client.workflows.delete(workflowId); } catch { /* ignore */ }
    }
  });
});
