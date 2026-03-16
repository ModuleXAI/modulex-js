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

  it('should create a deployment', async () => {
    const dep = { id: 'd1', workflow_id: 'wf-1', is_live: true };
    mockFetch.mockResolvedValueOnce(jsonResponse(dep));

    const result = await client.deployments.create('wf-1', { deploymentNote: 'v1.0' });

    expect(result.is_live).toBe(true);
    expect(mockFetch.mock.calls[0][0]).toContain('/workflows/wf-1/deploy');
  });

  it('should list deployments', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ deployments: [], total: 0 }));

    const result = await client.deployments.list('wf-1');
    expect(result.total).toBe(0);
  });

  it('should activate a deployment', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ success: true, deployment_id: 'd1' }));

    const result = await client.deployments.activate('wf-1', 'd1');
    expect(result.success).toBe(true);
    expect(mockFetch.mock.calls[0][0]).toContain('/workflows/wf-1/deployments/d1/activate');
  });

  it('should deactivate live deployment', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ success: true }));

    const result = await client.deployments.deactivate('wf-1');
    expect(result.success).toBe(true);
    expect(mockFetch.mock.calls[0][0]).toContain('/workflows/wf-1/deployments/live');
  });

  it('should delete a deployment', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ success: true, deleted_deployment_id: 'd1' }));

    const result = await client.deployments.delete('wf-1', 'd1');
    expect(result.success).toBe(true);
  });
});
