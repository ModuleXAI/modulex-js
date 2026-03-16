import { describe, it } from 'vitest';
import { getClient, tracked, MISSING_ENV } from './setup';

describe.skipIf(MISSING_ENV)('Chats', () => {
  const client = getClient();

  it('GET /chats — list', async () => {
    const res = await tracked('GET', '/chats', () =>
      client.chats.list(),
    );
    // ChatListResponse is Record<string, ChatResponse[]>
    if (typeof res !== 'object') throw new Error('Unexpected response type');
  });

  it('GET /chats/stream — SSE (brief connect)', async () => {
    const start = performance.now();
    try {
      const stream = client.chats.stream();
      const events: any[] = [];
      const ac = new AbortController();
      const timer = setTimeout(() => ac.abort(), 5_000);
      try {
        for await (const event of stream) {
          events.push(event);
          // Connected event or any event is enough
          break;
        }
      } catch (err: any) {
        if (err?.name !== 'AbortError') throw err;
      } finally {
        clearTimeout(timer);
      }
      const ms = Math.round(performance.now() - start);
      const { record } = await import('./setup');
      record({ status: 'pass', method: 'SSE', path: '/chats/stream', durationMs: ms });
    } catch (err: any) {
      const ms = Math.round(performance.now() - start);
      const { record } = await import('./setup');
      record({ status: 'fail', method: 'SSE', path: '/chats/stream', durationMs: ms, error: err.message });
    }
  });
});
