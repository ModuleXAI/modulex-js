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

describe('Executions Resource', () => {
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

  it('should run a workflow by ID', async () => {
    const runData = { status: 'running', run_id: 'r1', thread_id: 't1', stream: true };
    mockFetch.mockResolvedValueOnce(jsonResponse(runData));

    const result = await client.executions.run({
      workflowId: 'wf-1',
      input: { messages: [{ role: 'user', content: 'Hello' }] },
      stream: true,
    });

    expect(result.run_id).toBe('r1');
    expect(mockFetch.mock.calls[0][0]).toContain('/workflows/run');
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.workflow_id).toBe('wf-1');
    expect(body.stream).toBe(true);
  });

  it('should run a direct LLM call', async () => {
    const runData = { status: 'running', run_id: 'r2', thread_id: 't2' };
    mockFetch.mockResolvedValueOnce(jsonResponse(runData));

    await client.executions.run({
      llm: {
        integration_name: 'openai',
        provider_id: 'openai',
        model_id: 'gpt-4o-mini',
        temperature: 0.4,
      },
      input: { messages: [{ role: 'user', content: 'Hello' }] },
    });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.llm.integration_name).toBe('openai');
  });

  it('should get execution state', async () => {
    const stateData = { thread_id: 't1', state: {}, next: [] };
    mockFetch.mockResolvedValueOnce(jsonResponse(stateData));

    const result = await client.executions.getState('t1');

    expect(result.thread_id).toBe('t1');
    expect(mockFetch.mock.calls[0][0]).toContain('/workflows/state/t1');
  });

  it('should resume an execution', async () => {
    const resumeData = { status: 'resumed', run_id: 'r1', thread_id: 't1' };
    mockFetch.mockResolvedValueOnce(jsonResponse(resumeData));

    const result = await client.executions.resume({
      threadId: 't1',
      workflowId: 'wf-1',
      runId: 'r1',
      resumeValue: 'user input',
    });

    expect(result.status).toBe('resumed');
    expect(mockFetch.mock.calls[0][0]).toContain('/workflows/resume/t1');
  });

  it('should cancel an execution', async () => {
    const cancelData = { status: 'cancellation_requested', run_id: 'r1' };
    mockFetch.mockResolvedValueOnce(jsonResponse(cancelData));

    const result = await client.executions.cancel('r1', { reason: 'timeout' });

    expect(result.status).toBe('cancellation_requested');
    expect(mockFetch.mock.calls[0][0]).toContain('/workflows/cancel/r1');
  });

  it('should listen to SSE events', async () => {
    mockFetch.mockResolvedValueOnce(sseResponse(
      'event: metadata\ndata: {"run_id":"r1","workflow_name":"Test"}\n\n' +
      'event: node_update\ndata: {"node_id":"n1","status":"completed"}\n\n' +
      'event: done\ndata: {"steps_executed":2,"total_execution_time_ms":1000}\n\n',
    ));

    const events = [];
    for await (const event of client.executions.listen('r1')) {
      events.push(event);
    }

    expect(events).toHaveLength(3);
    expect(events[0].event).toBe('metadata');
    expect(events[1].event).toBe('node_update');
    expect(events[2].event).toBe('done');
    expect(events[2].data.steps_executed).toBe(2);
  });
});
