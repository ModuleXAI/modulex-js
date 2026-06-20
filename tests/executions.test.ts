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

  it('should run an inline ad-hoc workflow with attribution', async () => {
    const runData = { status: 'running', run_id: 'r2', thread_id: 't2' };
    mockFetch.mockResolvedValueOnce(jsonResponse(runData));

    await client.executions.run({
      workflow: { metadata: { name: 'adhoc' } } as never,
      attributionWorkflowId: 'wf-99',
      input: { messages: [{ role: 'user', content: 'Hello' }] },
    });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    // camelCase params are converted to snake_case on the wire
    expect(body.attribution_workflow_id).toBe('wf-99');
    expect(body.workflow).toBeDefined();
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

  it('should listen to SSE events (data-only frames discriminated on type)', async () => {
    // The backend listen stream is data-only: the discriminant is data.type,
    // with mixed wrapped (metadata/done) and flat (node_update) envelopes.
    mockFetch.mockResolvedValueOnce(sseResponse(
      'data: {"type":"metadata","data":{"run_id":"r1","workflow_name":"Test"}}\n\n' +
      'data: {"type":"node_update","node":"n1","name":"Node 1","output":{"ok":true}}\n\n' +
      'data: {"type":"done","data":{"message":"Workflow completed successfully"}}\n\n',
    ));

    const events: any[] = [];
    for await (const event of client.executions.listen('r1')) {
      events.push(event);
    }

    expect(events).toHaveLength(3);
    expect(events[0].type).toBe('metadata');
    expect(events[0].data.run_id).toBe('r1'); // wrapped
    expect(events[1].type).toBe('node_update');
    expect(events[1].node).toBe('n1'); // flat
    expect(events[2].type).toBe('done');
    expect(events[2].data.message).toBe('Workflow completed successfully'); // wrapped
  });
});

describe('WorkflowRuns Resource', () => {
  let mockFetch: ReturnType<typeof vi.fn>;
  let client: Modulex;

  beforeEach(() => {
    mockFetch = vi.fn();
    client = new Modulex({ apiKey: 'mx_live_test', organizationId: 'org-1', fetch: mockFetch });
  });

  it('should list workflow runs with filters', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ runs: [], has_more: false, limit: 50, offset: 0 }));

    const result = await client.workflowRuns.list({ workflowId: 'wf-1', limit: 10 });

    expect(result.has_more).toBe(false);
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain('/workflow-runs');
    expect(url).toContain('workflow_id=wf-1'); // camelCase -> snake_case query param
    expect(url).toContain('limit=10');
  });

  it('should get a workflow run detail by run_pk', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ id: 'pk-1', run_id: 'r1', status: 'completed' }));

    const result = await client.workflowRuns.get('pk-1');

    expect(result.id).toBe('pk-1');
    expect(mockFetch.mock.calls[0][0]).toContain('/workflow-runs/pk-1');
  });
});
