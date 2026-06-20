import { StreamError } from './errors';

/** A parsed SSE event. */
export interface SSEEvent {
  /**
   * The raw SSE `event:` field, or "message" when the frame has no `event:` line.
   * NOTE: most ModuleX streams (workflows, composer, assistant, credentials) emit
   * data-only frames, so `event` is "message" for them — prefer {@link SSEEvent.type}
   * for discriminating. The chats stream is the exception and uses real `event:` lines.
   */
  event: string;
  /**
   * The semantic event type to discriminate on. Resolves to `data.type` when the
   * JSON payload carries a `type` field (data-only streams), otherwise falls back to
   * the `event:` field (chats stream). This is the value to switch on in consumers.
   */
  type: string;
  /** Parsed JSON data payload. */
  data: Record<string, unknown>;
  /** Optional event ID. */
  id?: string;
  /** Optional reconnection interval in ms. */
  retry?: number;
}

/** Resolve the semantic event type: `data.type` if present, else the `event:` field. */
function resolveEventType(event: string, data: Record<string, unknown>): string {
  return typeof data.type === 'string' && data.type ? data.type : event;
}

/**
 * Parses an SSE stream from a fetch Response into an async iterable of events.
 * @internal
 */
export async function* parseSSEStream(
  response: Response,
  signal?: AbortSignal,
): AsyncGenerator<SSEEvent> {
  const body = response.body;
  if (!body) {
    throw new StreamError('Response body is null — cannot read SSE stream');
  }

  const reader = body.getReader();
  const decoder = new TextDecoder();

  let buffer = '';
  let currentEvent = '';
  let currentData: string[] = [];
  let currentId: string | undefined;
  let currentRetry: number | undefined;

  try {
    while (true) {
      if (signal?.aborted) {
        break;
      }

      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      // Keep the last incomplete line in the buffer
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        // Empty line = end of event
        if (line === '' || line === '\r') {
          if (currentData.length > 0) {
            const dataStr = currentData.join('\n');
            let parsedData: Record<string, unknown>;
            try {
              parsedData = JSON.parse(dataStr);
            } catch {
              parsedData = { raw: dataStr };
            }

            const ev = currentEvent || 'message';
            yield {
              event: ev,
              type: resolveEventType(ev, parsedData),
              data: parsedData,
              id: currentId,
              retry: currentRetry,
            };
          }
          // Reset for next event
          currentEvent = '';
          currentData = [];
          currentId = undefined;
          currentRetry = undefined;
          continue;
        }

        // Skip comments
        if (line.startsWith(':')) continue;

        const colonIdx = line.indexOf(':');
        let field: string;
        let value_str: string;

        if (colonIdx === -1) {
          field = line;
          value_str = '';
        } else {
          field = line.slice(0, colonIdx);
          // Strip single leading space after colon per SSE spec
          value_str = line.slice(colonIdx + 1);
          if (value_str.startsWith(' ')) {
            value_str = value_str.slice(1);
          }
        }

        switch (field) {
          case 'event':
            currentEvent = value_str;
            break;
          case 'data':
            currentData.push(value_str);
            break;
          case 'id':
            currentId = value_str;
            break;
          case 'retry': {
            const n = parseInt(value_str, 10);
            if (!isNaN(n)) currentRetry = n;
            break;
          }
        }
      }
    }

    // Flush remaining event if buffer ended without trailing newline
    if (currentData.length > 0) {
      const dataStr = currentData.join('\n');
      let parsedData: Record<string, unknown>;
      try {
        parsedData = JSON.parse(dataStr);
      } catch {
        parsedData = { raw: dataStr };
      }
      const ev = currentEvent || 'message';
      yield {
        event: ev,
        type: resolveEventType(ev, parsedData),
        data: parsedData,
        id: currentId,
        retry: currentRetry,
      };
    }
  } finally {
    reader.releaseLock();
  }
}
