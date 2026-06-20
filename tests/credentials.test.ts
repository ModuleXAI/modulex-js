import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Modulex } from '../src/client';

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function sseResponse(events: string) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(events));
      controller.close();
    },
  });
  return new Response(stream, {
    status: 200,
    headers: { 'Content-Type': 'text/event-stream' },
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

  it('should list credentials grouped (GET /credentials)', async () => {
    const data = {
      integrations: {},
      total_credentials: 5,
      total_integrations: 2,
      filters: {},
    };
    mockFetch.mockResolvedValueOnce(jsonResponse(data));

    const result = await client.credentials.list();

    expect(result).toEqual(data);
    expect(mockFetch.mock.calls[0][0]).toContain('/credentials');
    expect(mockFetch.mock.calls[0][1].method).toBe('GET');
  });

  it('should list credentials filtered with camelCase -> snake_case query params', async () => {
    const data = {
      credentials: [],
      total_count: 0,
      integration_name: 'openai',
      filters: {},
    };
    mockFetch.mockResolvedValueOnce(jsonResponse(data));

    const result = await client.credentials.list({
      integrationName: 'openai',
      authType: 'api_key',
      limit: 10,
      offset: 5,
    });

    expect(result).toEqual(data);
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain('integration_name=openai');
    expect(url).toContain('auth_type=api_key');
    expect(url).toContain('limit=10');
    expect(url).toContain('offset=5');
  });

  it('should get a credential detail with include_masked query param', async () => {
    const cred = {
      credential_id: 'c1',
      integration_name: 'openai',
      organization_id: 'org-1',
      created_by: 'u1',
      auth_data_masked: 'sk-...xyz',
    };
    mockFetch.mockResolvedValueOnce(jsonResponse(cred));

    const result = await client.credentials.get('c1', { includeMasked: true });

    expect(result.credential_id).toBe('c1');
    expect(result.auth_data_masked).toBe('sk-...xyz');
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain('/credentials/c1');
    expect(url).toContain('include_masked=true');
    expect(mockFetch.mock.calls[0][1].method).toBe('GET');
  });

  it('should create a credential (camelCase body -> snake_case)', async () => {
    const cred = { credential_id: 'c1', integration_name: 'openai' };
    mockFetch.mockResolvedValueOnce(jsonResponse(cred));

    const result = await client.credentials.create({
      integrationName: 'openai',
      authData: { api_key: 'sk-test' },
      authType: 'api_key',
      displayName: 'Test Key',
      makeDefault: true,
    });

    expect(result.credential_id).toBe('c1');
    expect(mockFetch.mock.calls[0][0]).toContain('/credentials');
    expect(mockFetch.mock.calls[0][1].method).toBe('POST');
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.integration_name).toBe('openai');
    expect(body.auth_type).toBe('api_key');
    expect(body.display_name).toBe('Test Key');
    expect(body.make_default).toBe(true);
  });

  it('should update a credential (PUT, camelCase body -> snake_case)', async () => {
    const cred = { credential_id: 'c1', integration_name: 'openai', display_name: 'New Name' };
    mockFetch.mockResolvedValueOnce(jsonResponse(cred));

    const result = await client.credentials.update('c1', { displayName: 'New Name' });

    expect(result.credential_id).toBe('c1');
    expect(mockFetch.mock.calls[0][0]).toContain('/credentials/c1');
    expect(mockFetch.mock.calls[0][1].method).toBe('PUT');
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.display_name).toBe('New Name');
  });

  it('should delete a credential (DELETE, 204)', async () => {
    mockFetch.mockResolvedValueOnce(new Response(null, { status: 204 }));

    await client.credentials.delete('c1');

    expect(mockFetch.mock.calls[0][0]).toContain('/credentials/c1');
    expect(mockFetch.mock.calls[0][1].method).toBe('DELETE');
  });

  it('should set a credential as default (POST /credentials/{id}/set-default)', async () => {
    const cred = { credential_id: 'c1', integration_name: 'openai', is_default: true };
    mockFetch.mockResolvedValueOnce(jsonResponse(cred));

    const result = await client.credentials.setDefault('c1');

    expect(result.is_default).toBe(true);
    expect(mockFetch.mock.calls[0][0]).toContain('/credentials/c1/set-default');
    expect(mockFetch.mock.calls[0][1].method).toBe('POST');
  });

  it('should test temporary credentials (POST /credentials/test-temporary)', async () => {
    const testResult = {
      is_valid: true,
      message: 'Valid',
      tested_at: '2026-06-19T00:00:00Z',
      test_method: 'api_call',
      integration_name: 'openai',
      auth_type: 'api_key',
    };
    mockFetch.mockResolvedValueOnce(jsonResponse(testResult));

    const result = await client.credentials.testTemporary({
      integrationName: 'openai',
      authType: 'api_key',
      authData: { api_key: 'sk-test' },
    });

    expect(result.is_valid).toBe(true);
    expect(mockFetch.mock.calls[0][0]).toContain('/credentials/test-temporary');
    expect(mockFetch.mock.calls[0][1].method).toBe('POST');
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.integration_name).toBe('openai');
    expect(body.auth_type).toBe('api_key');
    expect(body.auth_data).toEqual({ api_key: 'sk-test' });
  });

  it('should test an existing credential (POST /credentials/{id}/test)', async () => {
    const testResult = {
      credential_id: 'c1',
      is_valid: true,
      message: 'OK',
      tested_at: '2026-06-19T00:00:00Z',
    };
    mockFetch.mockResolvedValueOnce(jsonResponse(testResult));

    const result = await client.credentials.test('c1');

    expect(result.is_valid).toBe(true);
    expect(result.credential_id).toBe('c1');
    expect(mockFetch.mock.calls[0][0]).toContain('/credentials/c1/test');
    expect(mockFetch.mock.calls[0][1].method).toBe('POST');
  });

  it('should fetch usage stats with camelCase -> snake_case query params', async () => {
    const usage = {
      credential_id: 'c1',
      total_calls: 100,
      successful_calls: 95,
      failed_calls: 5,
      success_rate: 0.95,
      action_breakdown: {},
      start_date: '2026-06-01',
      end_date: '2026-06-19',
    };
    mockFetch.mockResolvedValueOnce(jsonResponse(usage));

    const result = await client.credentials.usage('c1', {
      startDate: '2026-06-01',
      endDate: '2026-06-19',
    });

    expect(result.total_calls).toBe(100);
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain('/credentials/c1/usage');
    expect(url).toContain('start_date=2026-06-01');
    expect(url).toContain('end_date=2026-06-19');
    expect(mockFetch.mock.calls[0][1].method).toBe('GET');
  });

  it('should return the audit log as an array', async () => {
    const logs = [
      {
        id: 'a1',
        credential_id: 'c1',
        event_type: 'created',
        user_id: 'u1',
        changes: {},
        ip_address: null,
        user_agent: null,
        timestamp: '2026-06-19T00:00:00Z',
      },
    ];
    mockFetch.mockResolvedValueOnce(jsonResponse(logs));

    const result = await client.credentials.audit('c1', { limit: 20, offset: 0 });

    expect(Array.isArray(result)).toBe(true);
    expect(result[0].event_type).toBe('created');
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain('/credentials/c1/audit');
    expect(url).toContain('limit=20');
    expect(mockFetch.mock.calls[0][1].method).toBe('GET');
  });

  it('should stream bulk ModuleX-key events (SSE data-only frames, phase discriminant)', async () => {
    // Bulk stream emits data-only frames. The lifecycle stage is carried in
    // data.phase (initial_status -> creating -> completed).
    mockFetch.mockResolvedValueOnce(sseResponse(
      'data: {"phase":"initial_status","integrations":[{"integration_name":"openai","integration_type":"llm","display_name":"OpenAI","has_modulex_key_credential":false}]}\n\n' +
      'data: {"phase":"creating","just_created":["openai"]}\n\n' +
      'data: {"phase":"completed","completed":true,"summary":{"total":1,"created":1,"already_existed":0}}\n\n',
    ));

    const events: any[] = [];
    for await (const event of client.credentials.bulkModulexKeys()) {
      events.push(event);
    }

    expect(events).toHaveLength(3);
    expect(events[0].data.phase).toBe('initial_status');
    expect(events[0].data.integrations[0].integration_name).toBe('openai');
    expect(events[1].data.phase).toBe('creating');
    expect(events[1].data.just_created).toEqual(['openai']);
    expect(events[2].data.phase).toBe('completed');
    expect(events[2].data.summary.created).toBe(1);
    expect(mockFetch.mock.calls[0][0]).toContain('/credentials/bulk-modulex-keys/stream');
    expect(mockFetch.mock.calls[0][1].method).toBe('POST');
  });

  it('should create an MCP server credential (camelCase body -> snake_case)', async () => {
    const cred = {
      credential_id: 'c2',
      integration_name: 'mcp_server',
      display_name: 'Test MCP',
      auth_type: 'mcp',
      is_default: false,
      created_at: '2026-06-19T00:00:00Z',
    };
    mockFetch.mockResolvedValueOnce(jsonResponse(cred));

    const result = await client.credentials.mcpServer({
      serverUrl: 'https://mcp.example.com',
      displayName: 'Test MCP',
      makeDefault: false,
    });

    expect(result.credential_id).toBe('c2');
    expect(mockFetch.mock.calls[0][0]).toContain('/credentials/mcp-server');
    expect(mockFetch.mock.calls[0][1].method).toBe('POST');
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.server_url).toBe('https://mcp.example.com');
    expect(body.display_name).toBe('Test MCP');
    expect(body.make_default).toBe(false);
  });

  it('should refresh MCP tool discovery (POST /credentials/{id}/refresh-discovery)', async () => {
    const data = {
      credential_id: 'c2',
      refreshed_at: '2026-06-19T00:00:00Z',
      changes: {},
      total_tools: 3,
      success: true,
    };
    mockFetch.mockResolvedValueOnce(jsonResponse(data));

    const result = await client.credentials.refreshDiscovery('c2');

    expect(result.success).toBe(true);
    expect(result.total_tools).toBe(3);
    expect(mockFetch.mock.calls[0][0]).toContain('/credentials/c2/refresh-discovery');
    expect(mockFetch.mock.calls[0][1].method).toBe('POST');
  });

  it('should list MCP tools (GET /credentials/{id}/mcp-tools)', async () => {
    const data = {
      credential_id: 'c2',
      tools: [{ name: 'search' }],
      total_count: 1,
    };
    mockFetch.mockResolvedValueOnce(jsonResponse(data));

    const result = await client.credentials.mcpTools('c2');

    expect(result.total_count).toBe(1);
    expect(result.tools[0].name).toBe('search');
    expect(mockFetch.mock.calls[0][0]).toContain('/credentials/c2/mcp-tools');
    expect(mockFetch.mock.calls[0][1].method).toBe('GET');
  });

  it('should initiate an OAuth2 flow (camelCase body -> snake_case)', async () => {
    const data = { authorization_url: 'https://provider/auth', state: 'xyz' };
    mockFetch.mockResolvedValueOnce(jsonResponse(data));

    const result = await client.credentials.initiateOAuth2({
      integrationName: 'github',
      redirectUri: 'https://app.example.com/callback',
      useModulexOauth: true,
    });

    expect(result.authorization_url).toBe('https://provider/auth');
    expect(result.state).toBe('xyz');
    expect(mockFetch.mock.calls[0][0]).toContain('/credentials/oauth2/initiate');
    expect(mockFetch.mock.calls[0][1].method).toBe('POST');
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.integration_name).toBe('github');
    expect(body.redirect_uri).toBe('https://app.example.com/callback');
    expect(body.use_modulex_oauth).toBe(true);
  });

  it('should refresh an OAuth2 credential (POST /credentials/{id}/oauth2/refresh)', async () => {
    const cred = { credential_id: 'c1', integration_name: 'github', auth_type: 'oauth2' };
    mockFetch.mockResolvedValueOnce(jsonResponse(cred));

    const result = await client.credentials.refreshOAuth2('c1');

    expect(result.credential_id).toBe('c1');
    expect(mockFetch.mock.calls[0][0]).toContain('/credentials/c1/oauth2/refresh');
    expect(mockFetch.mock.calls[0][1].method).toBe('POST');
  });
});
