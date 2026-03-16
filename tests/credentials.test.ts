import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Modulex } from '../src/client';

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('Credentials Resource', () => {
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

  it('should list credentials grouped', async () => {
    const data = { integrations: {}, total_credentials: 5, total_integrations: 2 };
    mockFetch.mockResolvedValueOnce(jsonResponse(data));

    const result = await client.credentials.list();
    expect(result).toEqual(data);
  });

  it('should list credentials filtered by integration', async () => {
    const data = { credentials: [], total_count: 0, integration_name: 'openai' };
    mockFetch.mockResolvedValueOnce(jsonResponse(data));

    const result = await client.credentials.list({ integrationName: 'openai' });
    expect(result).toEqual(data);
  });

  it('should create a credential', async () => {
    const cred = { credential_id: 'c1', integration_name: 'openai' };
    mockFetch.mockResolvedValueOnce(jsonResponse(cred));

    const result = await client.credentials.create({
      integrationName: 'openai',
      authData: { api_key: 'sk-test' },
      displayName: 'Test Key',
    });

    expect(result.credential_id).toBe('c1');
  });

  it('should test a credential', async () => {
    const testResult = { credential_id: 'c1', is_valid: true, message: 'OK' };
    mockFetch.mockResolvedValueOnce(jsonResponse(testResult));

    const result = await client.credentials.test('c1');
    expect(result.is_valid).toBe(true);
  });

  it('should test temporary credentials', async () => {
    const testResult = { is_valid: true, message: 'Valid' };
    mockFetch.mockResolvedValueOnce(jsonResponse(testResult));

    const result = await client.credentials.testTemporary({
      integrationName: 'openai',
      authType: 'api_key',
      authData: { api_key: 'sk-test' },
    });

    expect(result.is_valid).toBe(true);
  });

  it('should delete a credential', async () => {
    mockFetch.mockResolvedValueOnce(new Response(null, { status: 204 }));

    await client.credentials.delete('c1');
    expect(mockFetch.mock.calls[0][1].method).toBe('DELETE');
  });

  it('should create MCP server credential', async () => {
    const cred = { credential_id: 'c2', integration_name: 'mcp_server' };
    mockFetch.mockResolvedValueOnce(jsonResponse(cred));

    const result = await client.credentials.mcpServer({
      serverUrl: 'https://mcp.example.com',
      displayName: 'Test MCP',
    });

    expect(result.credential_id).toBe('c2');
  });
});
