import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Modulex } from '../src/client';

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('Deployments Resource', () => {
  let mockFetch: ReturnType<typeof vi.fn>;
  let client: Modulex;

  beforeEach(() => {
    mockFetch = vi.fn();
    client = new Modulex({
      apiKey: 'mx_live_test',
      organizationId: 'org-1',
      fetch: mockFetch,
    });
  });

  it('should create a deployment (POST, camelCase -> snake_case body)', async () => {
    const dep = {
      id: 'd1',
      workflow_id: 'wf-1',
      name: 'My WF',
      version: '0.0.1',
      deployment_note: 'v1.0',
      schema_image_url: 'https://img/x.png',
      deployed_by: null,
      created_at: '2026-06-19T00:00:00Z',
      is_live: true,
    };
    mockFetch.mockResolvedValueOnce(jsonResponse(dep));

    const result = await client.deployments.create('wf-1', {
      deploymentNote: 'v1.0',
      schemaImageUrl: 'https://img/x.png',
    });

    expect(result.id).toBe('d1');
    expect(result.is_live).toBe(true);
    // deployed_by is nullable
    expect(result.deployed_by).toBeNull();

    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toContain('/workflows/wf-1/deploy');
    expect(init.method).toBe('POST');
    const body = JSON.parse(init.body);
    // camelCase params are converted to snake_case on the wire
    expect(body.deployment_note).toBe('v1.0');
    expect(body.schema_image_url).toBe('https://img/x.png');
  });

  it('should create a deployment with no params (empty body)', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({
        id: 'd2',
        name: 'WF',
        version: '0.0.1',
        deployment_note: null,
        schema_image_url: null,
        deployed_by: 'user-1',
        created_at: '2026-06-19T00:00:00Z',
        is_live: false,
      }),
    );

    const result = await client.deployments.create('wf-1');

    expect(result.id).toBe('d2');
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toContain('/workflows/wf-1/deploy');
    expect(init.method).toBe('POST');
  });

  it('should list deployments (GET, camelCase -> snake_case query)', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({
        deployments: [
          {
            id: 'd1',
            name: 'WF',
            version: '0.0.1',
            deployment_note: null,
            schema_image_url: null,
            deployed_by: null,
            created_at: '2026-06-19T00:00:00Z',
            is_live: true,
          },
        ],
        total: 1,
        limit: 10,
        offset: 5,
      }),
    );

    const result = await client.deployments.list('wf-1', { limit: 10, offset: 5 });

    expect(result.total).toBe(1);
    expect(result.deployments).toHaveLength(1);
    // list rows omit workflow_id (optional)
    expect(result.deployments[0].workflow_id).toBeUndefined();

    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toContain('/workflows/wf-1/deployments');
    expect(url).toContain('limit=10');
    expect(url).toContain('offset=5');
    expect(init.method).toBe('GET');
  });

  it('should list deployments without params', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ deployments: [], total: 0, limit: 20, offset: 0 }),
    );

    const result = await client.deployments.list('wf-1');
    expect(result.total).toBe(0);
    expect(mockFetch.mock.calls[0][0]).toContain('/workflows/wf-1/deployments');
  });

  it('should get a deployment detail (GET, includes schema/description)', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({
        id: 'd1',
        workflow_id: 'wf-1',
        name: 'WF',
        version: '0.0.1',
        deployment_note: null,
        schema_image_url: null,
        deployed_by: null,
        created_at: '2026-06-19T00:00:00Z',
        is_live: true,
        description: 'A deployed workflow',
        workflow_schema: { metadata: { name: 'WF' } },
        input: null,
        config: null,
      }),
    );

    const result = await client.deployments.get('wf-1', 'd1');

    expect(result.id).toBe('d1');
    expect(result.workflow_id).toBe('wf-1');
    expect(result.description).toBe('A deployed workflow');
    expect(result.workflow_schema).toBeDefined();

    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toContain('/workflows/wf-1/deployments/d1');
    expect(init.method).toBe('GET');
  });

  it('should activate a deployment (PUT, full response shape)', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({
        success: true,
        message: 'Activated',
        deployment_id: 'd1',
        previous_live_deployment_id: 'd0',
      }),
    );

    const result = await client.deployments.activate('wf-1', 'd1');

    expect(result.success).toBe(true);
    expect(result.deployment_id).toBe('d1');
    expect(result.previous_live_deployment_id).toBe('d0');

    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toContain('/workflows/wf-1/deployments/d1/activate');
    expect(init.method).toBe('PUT');
  });

  it('should activate a deployment (already-live early-return omits previous_live_deployment_id)', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ success: true, message: 'Already live', deployment_id: 'd1' }),
    );

    const result = await client.deployments.activate('wf-1', 'd1');

    expect(result.success).toBe(true);
    expect(result.deployment_id).toBe('d1');
    // previous_live_deployment_id is optional / omitted on early-return
    expect(result.previous_live_deployment_id).toBeUndefined();
  });

  it('should deactivate live deployment (DELETE /deployments/live)', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({
        success: true,
        message: 'Deactivated',
        previous_live_deployment_id: 'd1',
      }),
    );

    const result = await client.deployments.deactivate('wf-1');

    expect(result.success).toBe(true);
    expect(result.previous_live_deployment_id).toBe('d1');

    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toContain('/workflows/wf-1/deployments/live');
    expect(init.method).toBe('DELETE');
  });

  it('should deactivate (no-live early-return omits previous_live_deployment_id)', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ success: true, message: 'No live deployment' }),
    );

    const result = await client.deployments.deactivate('wf-1');

    expect(result.success).toBe(true);
    expect(result.previous_live_deployment_id).toBeUndefined();
  });

  it('should delete a deployment (DELETE, full response shape)', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({
        success: true,
        message: 'Deleted',
        deleted_deployment_id: 'd1',
        was_live: true,
        new_live_deployment_id: 'd2',
      }),
    );

    const result = await client.deployments.delete('wf-1', 'd1');

    expect(result.success).toBe(true);
    expect(result.deleted_deployment_id).toBe('d1');
    expect(result.was_live).toBe(true);
    expect(result.new_live_deployment_id).toBe('d2');

    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toContain('/workflows/wf-1/deployments/d1');
    expect(init.method).toBe('DELETE');
  });
});
