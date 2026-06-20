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
  return new Response(stream, { status: 200, headers: { 'Content-Type': 'text/event-stream' } });
}

describe('Assistant Resource', () => {
  let mockFetch: ReturnType<typeof vi.fn>;
  let client: Modulex;

  beforeEach(() => {
    mockFetch = vi.fn();
    client = new Modulex({ apiKey: 'mx_live_test', organizationId: 'org-1', fetch: mockFetch });
  });

  it('should start a chat (chat_id response, no workflow_id)', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({
      status: 'running', chat_id: 'a1', run_id: 'r1', thread_id: 't1', stream_url: '/x',
    }));

    const result = await client.assistant.chat({ message: 'Hello' });

    expect(result.chat_id).toBe('a1');
    expect((result as Record<string, unknown>).workflow_id).toBeUndefined();
    expect(mockFetch.mock.calls[0][0]).toContain('/assistant/chat');
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.message).toBe('Hello');
  });

  it('should list user assistant chats with cursor', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ items: [], next_cursor: null }));

    await client.assistant.list({ limit: 20 });

    const url = new URL(mockFetch.mock.calls[0][0]);
    expect(url.pathname).toContain('/assistant/chats');
    expect(url.searchParams.get('limit')).toBe('20');
  });

  it('should resume with a HITL credential_added answer', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({
      status: 'resuming', chat_id: 'a1', run_id: 'r2', thread_id: 't1', stream_url: '/x',
    }));

    const result = await client.assistant.resume('a1', {
      requestId: 'req-1',
      response: { kind: 'credential_added', credential_id: 'c1', integration_name: 'github', auth_type: 'oauth2' },
      llm: { integration_name: 'openai', provider_id: 'openai', model_id: 'gpt-4o-mini' } as never,
    });

    expect(result.status).toBe('resuming');
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.request_id).toBe('req-1');
    expect(body.response.kind).toBe('credential_added'); // discriminant stays snake_case
    expect(body.response.credential_id).toBe('c1');
  });

  it('should pass permanent as a query param on delete', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ status: 'deleted', chat_id: 'a1', permanent: true }));

    await client.assistant.delete('a1', { permanent: true });

    const url = new URL(mockFetch.mock.calls[0][0]);
    expect(url.pathname).toContain('/assistant/chat/a1');
    expect(url.searchParams.get('permanent')).toBe('true');
    expect(mockFetch.mock.calls[0][1].method).toBe('DELETE');
  });

  it('should listen and surface user_input_request HITL frames', async () => {
    mockFetch.mockResolvedValueOnce(sseResponse(
      'data: {"type":"metadata","run_id":"r1"}\n\n' +
      'data: {"type":"user_input_request","data":{"kind":"single_choice","request_id":"req-1","message":"Pick","required":true,"allow_free_text":false,"options":[{"value":"a","label":"A"}]}}\n\n' +
      'data: {"type":"done"}\n\n',
    ));

    const events: any[] = [];
    for await (const evt of client.assistant.listen('a1', 'r1')) {
      events.push(evt);
    }

    expect(events.map(e => e.type)).toEqual(['metadata', 'user_input_request', 'done']);
    expect(events[1].data.kind).toBe('single_choice');
    expect(events[1].data.options[0].value).toBe('a');
  });
});
