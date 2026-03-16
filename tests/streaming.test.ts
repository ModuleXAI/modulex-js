import { describe, it, expect } from 'vitest';
import { parseSSEStream } from '../src/streaming';

function createMockResponse(chunks: string[]): Response {
  const encoder = new TextEncoder();
  let index = 0;

  const stream = new ReadableStream({
    pull(controller) {
      if (index < chunks.length) {
        controller.enqueue(encoder.encode(chunks[index]));
        index++;
      } else {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream' },
  });
}

describe('SSE Parser', () => {
  it('should parse a simple event', async () => {
    const response = createMockResponse([
      'event: node_update\ndata: {"node_id":"llm_1","status":"completed"}\n\n',
    ]);

    const events = [];
    for await (const event of parseSSEStream(response)) {
      events.push(event);
    }

    expect(events).toHaveLength(1);
    expect(events[0].event).toBe('node_update');
    expect(events[0].data).toEqual({ node_id: 'llm_1', status: 'completed' });
  });

  it('should parse multiple events', async () => {
    const response = createMockResponse([
      'event: metadata\ndata: {"run_id":"r1"}\n\n',
      'event: done\ndata: {"steps_executed":5}\n\n',
    ]);

    const events = [];
    for await (const event of parseSSEStream(response)) {
      events.push(event);
    }

    expect(events).toHaveLength(2);
    expect(events[0].event).toBe('metadata');
    expect(events[1].event).toBe('done');
  });

  it('should handle multi-line data', async () => {
    const response = createMockResponse([
      'event: test\ndata: {"line1":\ndata: "value"}\n\n',
    ]);

    const events = [];
    for await (const event of parseSSEStream(response)) {
      events.push(event);
    }

    expect(events).toHaveLength(1);
    // Multi-line data joined with newline, then parsed as JSON
    expect(events[0].data).toEqual({ line1: 'value' });
  });

  it('should skip comments', async () => {
    const response = createMockResponse([
      ': this is a comment\nevent: test\ndata: {"ok":true}\n\n',
    ]);

    const events = [];
    for await (const event of parseSSEStream(response)) {
      events.push(event);
    }

    expect(events).toHaveLength(1);
    expect(events[0].event).toBe('test');
  });

  it('should handle events split across chunks', async () => {
    const response = createMockResponse([
      'event: te',
      'st\ndata: {"split":tr',
      'ue}\n\n',
    ]);

    const events = [];
    for await (const event of parseSSEStream(response)) {
      events.push(event);
    }

    expect(events).toHaveLength(1);
    expect(events[0].event).toBe('test');
    expect(events[0].data).toEqual({ split: true });
  });

  it('should default to "message" event type', async () => {
    const response = createMockResponse([
      'data: {"default":true}\n\n',
    ]);

    const events = [];
    for await (const event of parseSSEStream(response)) {
      events.push(event);
    }

    expect(events).toHaveLength(1);
    expect(events[0].event).toBe('message');
  });

  it('should parse id and retry fields', async () => {
    const response = createMockResponse([
      'id: 42\nretry: 5000\nevent: test\ndata: {"ok":true}\n\n',
    ]);

    const events = [];
    for await (const event of parseSSEStream(response)) {
      events.push(event);
    }

    expect(events).toHaveLength(1);
    expect(events[0].id).toBe('42');
    expect(events[0].retry).toBe(5000);
  });

  it('should handle non-JSON data gracefully', async () => {
    const response = createMockResponse([
      'event: test\ndata: not json\n\n',
    ]);

    const events = [];
    for await (const event of parseSSEStream(response)) {
      events.push(event);
    }

    expect(events).toHaveLength(1);
    expect(events[0].data).toEqual({ raw: 'not json' });
  });

  it('should handle empty stream', async () => {
    const response = createMockResponse([]);

    const events = [];
    for await (const event of parseSSEStream(response)) {
      events.push(event);
    }

    expect(events).toHaveLength(0);
  });

  it('should respect abort signal', async () => {
    const controller = new AbortController();
    const response = createMockResponse([
      'event: first\ndata: {"n":1}\n\n',
      'event: second\ndata: {"n":2}\n\n',
    ]);

    const events = [];
    for await (const event of parseSSEStream(response, controller.signal)) {
      events.push(event);
      controller.abort();
    }

    expect(events).toHaveLength(1);
  });

  it('should throw on null response body', async () => {
    const response = new Response(null);
    // Manually override body to null
    const mockResponse = {
      ...response,
      body: null,
    } as Response;

    const events = [];
    await expect(async () => {
      for await (const event of parseSSEStream(mockResponse)) {
        events.push(event);
      }
    }).rejects.toThrow('Response body is null');
  });

  it('should strip leading space from data values per SSE spec', async () => {
    const response = createMockResponse([
      'event: test\ndata: {"spaced": true}\n\n',
    ]);

    const events = [];
    for await (const event of parseSSEStream(response)) {
      events.push(event);
    }

    expect(events[0].data).toEqual({ spaced: true });
  });
});
