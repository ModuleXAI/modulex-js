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

describe('Workflows Resource', () => {
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

  it('should list workflows with filters', async () => {
    const listData = { workflows: [{ id: 'wf-1', name: 'Test' }], total: 1, page: 1, page_size: 20, total_pages: 1 };
    mockFetch.mockResolvedValueOnce(jsonResponse(listData));

    const result = await client.workflows.list({ status: 'active', page: 1, pageSize: 20 });

    expect(result.workflows).toHaveLength(1);
    const url = new URL(mockFetch.mock.calls[0][0]);
    expect(url.searchParams.get('status')).toBe('active');
    expect(url.searchParams.get('page')).toBe('1');
    expect(url.searchParams.get('page_size')).toBe('20');
  });

  it('should get a workflow by ID', async () => {
    const wfData = { id: 'wf-1', name: 'Test', workflow_schema: {} };
    mockFetch.mockResolvedValueOnce(jsonResponse(wfData));

    const result = await client.workflows.get('wf-1');

    expect(result.id).toBe('wf-1');
    expect(mockFetch.mock.calls[0][0]).toContain('/workflows/wf-1');
  });

  it('should create a workflow', async () => {
    const wfData = { id: 'wf-new', name: 'New Workflow' };
    mockFetch.mockResolvedValueOnce(jsonResponse(wfData));

    const result = await client.workflows.create({
      workflowSchema: {
        metadata: { name: 'New Workflow' },
        config: {},
        state_schema: { fields: {} },
        nodes: [],
        edges: [],
        entry_point: 'start',
      },
      name: 'New Workflow',
    });

    expect(result.name).toBe('New Workflow');
    expect(mockFetch.mock.calls[0][1].method).toBe('POST');
  });

  it('should update a workflow', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ id: 'wf-1', name: 'Updated' }));

    const result = await client.workflows.update('wf-1', { name: 'Updated', status: 'active' });

    expect(result.name).toBe('Updated');
    expect(mockFetch.mock.calls[0][1].method).toBe('PUT');
  });

  it('should delete a workflow', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ status: 'deleted', workflow_id: 'wf-1' }));

    const result = await client.workflows.delete('wf-1');

    expect(result.status).toBe('deleted');
    expect(mockFetch.mock.calls[0][1].method).toBe('DELETE');
  });

  it('should auto-paginate with listAll', async () => {
    // Page 1
    mockFetch.mockResolvedValueOnce(jsonResponse({
      workflows: [{ id: 'wf-1', name: 'A' }, { id: 'wf-2', name: 'B' }],
      total: 3, page: 1, page_size: 2, total_pages: 2,
    }));
    // Page 2
    mockFetch.mockResolvedValueOnce(jsonResponse({
      workflows: [{ id: 'wf-3', name: 'C' }],
      total: 3, page: 2, page_size: 2, total_pages: 2,
    }));

    const all = [];
    for await (const wf of client.workflows.listAll({ status: 'active' })) {
      all.push(wf);
    }

    expect(all).toHaveLength(3);
    expect(all.map(w => w.name)).toEqual(['A', 'B', 'C']);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('should get builder details', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({
      node_types: {},
      categories: { tools: [], functions: [], transformers: [] },
      counts: { integrations: 0, functions: 0, transformers: 0, providers: 0 },
      features: { array_spread: true },
      cached: true,
    }));

    const result = await client.workflows.builderDetails({ nodeType: 'llm' });

    expect(result.cached).toBe(true);
    expect(result.categories.tools).toEqual([]);
    expect(result.features?.array_spread).toBe(true);
    const url = new URL(mockFetch.mock.calls[0][0]);
    expect(url.searchParams.get('node_type')).toBe('llm');
  });

  it('should stream workflow changes (data-only, discriminated on type)', async () => {
    mockFetch.mockResolvedValueOnce(sseResponse(
      'data: {"type":"connected","workflow_id":"wf-1","edit_version":3}\n\n' +
      'data: {"type":"user_joined","user_id":"u-2"}\n\n',
    ));

    const events: any[] = [];
    for await (const evt of client.workflows.listenChanges('wf-1')) {
      events.push(evt);
    }

    expect(events).toHaveLength(2);
    expect(events[0].type).toBe('connected');
    expect(events[0].edit_version).toBe(3);
    expect(events[1].type).toBe('user_joined');
    expect(mockFetch.mock.calls[0][0]).toContain('/workflows/wf-1/changes');
  });
});
