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

describe('Chats Resource', () => {
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

  it('should list chats grouped by folder', async () => {
    const listData = {
      chats: [{ id: 'c1', title: 'First', creator_id: 'u1', is_private: false }],
      pinned: [],
      archived: [],
    };
    mockFetch.mockResolvedValueOnce(jsonResponse(listData));

    const result = await client.chats.list();

    // ChatListResponse is Record<string, ChatResponse[]>
    expect(result['chats'][0].id).toBe('c1');
    expect(result['pinned']).toEqual([]);
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain('/chats');
    expect(mockFetch.mock.calls[0][1].method).toBe('GET');
  });

  it('should get a single chat with embedded messages', async () => {
    const chatData = {
      id: 'c1',
      title: 'My Chat',
      creator_id: 'u1',
      is_private: true,
      running_id: null,
      organization_id: 'org-1',
      messages: [{ id: 'm1', chat_id: 'c1', role: 'human', content: 'Hi' }],
    };
    mockFetch.mockResolvedValueOnce(jsonResponse(chatData));

    const result = await client.chats.get('c1');

    expect(result.id).toBe('c1');
    expect(result.messages?.[0].id).toBe('m1');
    expect(mockFetch.mock.calls[0][0]).toContain('/chats/c1');
    expect(mockFetch.mock.calls[0][1].method).toBe('GET');
  });

  it('should get paginated messages with camelCase params -> snake_case query', async () => {
    const messagesData = {
      messages: [{ id: 'm1', chat_id: 'c1', role: 'ai', content: 'Hello' }],
      limit: 20,
      offset: 0,
    };
    mockFetch.mockResolvedValueOnce(jsonResponse(messagesData));

    const result = await client.chats.messages('c1', { limit: 20, offset: 0 });

    expect(result.messages[0].id).toBe('m1');
    expect(result.limit).toBe(20);
    expect(result.offset).toBe(0);
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain('/chats/c1/messages');
    expect(url).toContain('limit=20');
    expect(url).toContain('offset=0');
    expect(mockFetch.mock.calls[0][1].method).toBe('GET');
  });

  it('should accept a nullable limit in the messages response', async () => {
    const messagesData = {
      messages: [],
      limit: null,
      offset: 0,
    };
    mockFetch.mockResolvedValueOnce(jsonResponse(messagesData));

    const result = await client.chats.messages('c1');

    expect(result.limit).toBeNull();
    expect(result.offset).toBe(0);
  });

  it('should update a chat with camelCase params converted to snake_case body', async () => {
    const updated = {
      id: 'c1',
      title: 'Renamed',
      creator_id: 'u1',
      is_private: true,
      running_id: null,
      organization_id: 'org-1',
    };
    mockFetch.mockResolvedValueOnce(jsonResponse(updated));

    const result = await client.chats.update('c1', {
      title: 'Renamed',
      is_private: true,
      folder: 'pinned',
    });

    expect(result.title).toBe('Renamed');
    expect(mockFetch.mock.calls[0][0]).toContain('/chats/c1');
    expect(mockFetch.mock.calls[0][1].method).toBe('PATCH');
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.title).toBe('Renamed');
    // camelCase params are converted to snake_case on the wire
    expect(body.is_private).toBe(true);
    expect(body.folder).toBe('pinned');
  });

  it('should delete a chat', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ success: true, message: 'deleted' }));

    const result = await client.chats.delete('c1');

    expect(result.success).toBe(true);
    expect(mockFetch.mock.calls[0][0]).toContain('/chats/c1');
    expect(mockFetch.mock.calls[0][1].method).toBe('DELETE');
  });

  it('should stream chat list updates as data-only SSE frames', async () => {
    // The chat list stream emits `connected` and `chat_list_updated` payloads.
    // chat_list_updated carries a discriminant `type` of 'public' | 'private'.
    mockFetch.mockResolvedValueOnce(sseResponse(
      'data: {"status":"connected","timestamp":"2026-06-19T00:00:00Z"}\n\n' +
      'data: {"event":"chat_list_updated","type":"public","timestamp":"2026-06-19T00:00:01Z"}\n\n',
    ));

    const events: any[] = [];
    for await (const event of client.chats.stream()) {
      events.push(event);
    }

    expect(events).toHaveLength(2);
    expect(events[0].data.status).toBe('connected');
    expect(events[1].data.event).toBe('chat_list_updated');
    expect(events[1].data.type).toBe('public'); // discriminant
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain('/chats/stream');
  });
});
