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

describe('Composer Resource', () => {
  let mockFetch: ReturnType<typeof vi.fn>;
  let client: Modulex;

  beforeEach(() => {
    mockFetch = vi.fn();
    client = new Modulex({ apiKey: 'mx_live_test', organizationId: 'org-1', fetch: mockFetch });
  });

  it('should start/continue a chat and return a run id (camelCase -> snake_case)', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({
      status: 'started', composer_chat_id: 'c1', workflow_id: 'wf-1',
      run_id: 'r1', thread_id: 't1', stream_url: '/composer/chat/c1/listen/r1',
    }));

    const result = await client.composer.chat({
      message: 'Add a text node',
      workflowId: 'wf-1',
      composerChatId: 'c1',
    });

    expect(result.run_id).toBe('r1');
    expect(result.composer_chat_id).toBe('c1');
    expect(result.stream_url).toBe('/composer/chat/c1/listen/r1');
    expect(mockFetch.mock.calls[0][0]).toContain('/composer/chat');
    expect(mockFetch.mock.calls[0][1].method).toBe('POST');
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.message).toBe('Add a text node');
    expect(body.workflow_id).toBe('wf-1'); // camelCase -> snake_case
    expect(body.composer_chat_id).toBe('c1');
  });

  it('should list user composer chats with cursor pagination', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ items: [], next_cursor: null }));

    const result = await client.composer.list({ limit: 10, cursor: '2026-06-19T00:00:00Z' });

    expect(result.next_cursor).toBeNull();
    const url = new URL(mockFetch.mock.calls[0][0]);
    expect(url.pathname).toContain('/composer/chats');
    expect(url.searchParams.get('limit')).toBe('10');
    expect(url.searchParams.get('cursor')).toBe('2026-06-19T00:00:00Z');
  });

  it('should get a chat detail with messages and pending HITL state', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({
      id: 'c1', workflow_id: 'wf-1', title: 'My chat',
      messages: [{ id: 'm1', role: 'human', content: 'hi', created_at: 'now' }],
      running_id: null, touched_workflow_ids: ['wf-1'],
      pending_user_input_request: null, has_pending_changes: true,
      created_at: 'now', updated_at: 'now',
    }));

    const result = await client.composer.get('c1');

    expect(result.id).toBe('c1');
    expect(result.title).toBe('My chat');
    expect(result.messages[0].role).toBe('human');
    expect(result.touched_workflow_ids).toEqual(['wf-1']);
    expect(result.has_pending_changes).toBe(true);
    expect(mockFetch.mock.calls[0][0]).toContain('/composer/chat/c1');
    expect(mockFetch.mock.calls[0][1].method).toBe('GET');
  });

  it('should get real-time status including HITL pause state', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({
      composer_chat_id: 'c1', workflow_id: 'wf-1', is_running: true,
      running_id: 'r1', has_pending_changes: false,
      awaiting_input: true, pending_request_id: 'req-1',
      run_status: { phase: 'paused' },
    }));

    const result = await client.composer.status('c1');

    expect(result.awaiting_input).toBe(true);
    expect(result.pending_request_id).toBe('req-1');
    expect(result.run_status).toEqual({ phase: 'paused' });
    expect(mockFetch.mock.calls[0][0]).toContain('/composer/chat/c1/status');
    expect(mockFetch.mock.calls[0][1].method).toBe('GET');
  });

  it('should resume a paused chat with a HITL answer', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({
      status: 'resuming', composer_chat_id: 'c1', run_id: 'r2', thread_id: 't1', stream_url: '/x',
    }));

    const result = await client.composer.resume('c1', {
      requestId: 'req-1',
      response: { kind: 'yes_no', answer: true },
      llm: { integration_name: 'openai', provider_id: 'openai', model_id: 'gpt-4o-mini' } as never,
    });

    expect(result.status).toBe('resuming');
    expect(result.run_id).toBe('r2');
    expect(mockFetch.mock.calls[0][0]).toContain('/composer/chat/c1/resume');
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.request_id).toBe('req-1'); // camelCase -> snake_case
    expect(body.response.kind).toBe('yes_no'); // inner discriminant preserved
    expect(body.response.answer).toBe(true);
  });

  it('should set a focused workflow via PATCH (null clears focus)', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ composer_chat_id: 'c1', workflow_id: null, updated_at: 'now' }));

    await client.composer.focus('c1', { workflowId: null });

    expect(mockFetch.mock.calls[0][1].method).toBe('PATCH');
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect('workflow_id' in body).toBe(true); // key present even when null
    expect(body.workflow_id).toBeNull();
  });

  it('should save with a workflow_sync payload', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({
      status: 'saved', workflow_id: 'wf-1', workflow_name: 'X', message: 'ok', workflow_sync: null,
    }));

    const result = await client.composer.save('c1', { workflowId: 'wf-1' });

    expect(result.status).toBe('saved');
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.workflow_id).toBe('wf-1');
  });

  it('should revert with a workflow_sync payload', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({
      status: 'reverted', workflow_id: 'wf-1', workflow_name: 'X', message: 'ok',
      workflow_sync: {
        workflow_id: 'wf-1', edit_version: 2,
        workflow: { nodes: [], edges: [], metadata: {}, state_schema: {} }, input: null,
      },
    }));

    const result = await client.composer.revert('c1', { workflowId: 'wf-1' });

    expect(result.status).toBe('reverted');
    expect(result.workflow_sync?.edit_version).toBe(2);
    expect(mockFetch.mock.calls[0][0]).toContain('/composer/chat/c1/revert');
    expect(mockFetch.mock.calls[0][1].method).toBe('POST');
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.workflow_id).toBe('wf-1'); // camelCase -> snake_case
  });

  it('should cancel the in-progress run via POST', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ status: 'cancelled', composer_chat_id: 'c1', run_id: 'r1' }));

    const result = await client.composer.cancel('c1');

    expect(result.status).toBe('cancelled');
    expect(result.run_id).toBe('r1');
    expect(mockFetch.mock.calls[0][0]).toContain('/composer/chat/c1/cancel');
    expect(mockFetch.mock.calls[0][1].method).toBe('POST');
  });

  it('should delete a chat, passing permanent as a QUERY param (not body)', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ status: 'deleted', composer_chat_id: 'c1', permanent: true }));

    const result = await client.composer.delete('c1', { permanent: true });

    expect(result.status).toBe('deleted');
    expect(mockFetch.mock.calls[0][1].method).toBe('DELETE');
    const url = new URL(mockFetch.mock.calls[0][0]);
    expect(url.pathname).toContain('/composer/chat/c1');
    expect(url.searchParams.get('permanent')).toBe('true'); // query, not body (regression: was sent as body)
    expect(mockFetch.mock.calls[0][1].body).toBeUndefined();
  });

  it('should listen and surface the user_input_request HITL frame', async () => {
    mockFetch.mockResolvedValueOnce(sseResponse(
      'data: {"type":"response_chunk","delta":"hi"}\n\n' +
      'data: {"type":"user_input_request","data":{"kind":"yes_no","request_id":"req-1","message":"OK?","required":true,"allow_free_text":false,"yes_label":"Yes","no_label":"No"}}\n\n' +
      'data: {"type":"done"}\n\n',
    ));

    const events: any[] = [];
    for await (const evt of client.composer.listen('c1', 'r1')) {
      events.push(evt);
    }

    expect(events).toHaveLength(3);
    expect(events[0].type).toBe('response_chunk');
    expect(events[1].type).toBe('user_input_request');
    expect(events[1].data.kind).toBe('yes_no');
    expect(events[1].data.request_id).toBe('req-1');
    expect(events[2].type).toBe('done');
  });

  it('should no longer expose the removed history() method', () => {
    expect((client.composer as unknown as Record<string, unknown>).history).toBeUndefined();
  });
});
