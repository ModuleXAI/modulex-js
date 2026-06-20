import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Modulex } from '../src/client';

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('Schedules Resource', () => {
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

  it('should create a schedule (POST /schedules, camelCase -> snake_case body)', async () => {
    const schedule = {
      id: 's1',
      workflow_id: 'wf-1',
      organization_id: 'org-1',
      name: 'Daily',
      description: null,
      schedule_type: 'cron',
      cron_expression: '0 9 * * 1-5',
      timezone: 'UTC',
      input: {},
      config: {},
      is_active: true,
      total_runs: 0,
      successful_runs: 0,
      failed_runs: 0,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    };
    mockFetch.mockResolvedValueOnce(jsonResponse(schedule));

    const result = await client.schedules.create({
      workflowId: 'wf-1',
      name: 'Daily',
      scheduleType: 'cron',
      cronExpression: '0 9 * * 1-5',
      intervalSeconds: 3600,
      timezone: 'UTC',
      input: { foo: 'bar' },
      config: { retries: 2 },
    });

    expect(result.name).toBe('Daily');
    expect(result.workflow_id).toBe('wf-1');
    expect(result.organization_id).toBe('org-1');

    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toContain('/schedules');
    expect(init.method).toBe('POST');
    const body = JSON.parse(init.body);
    // camelCase params are converted to snake_case on the wire
    expect(body.workflow_id).toBe('wf-1');
    expect(body.schedule_type).toBe('cron');
    expect(body.cron_expression).toBe('0 9 * * 1-5');
    expect(body.interval_seconds).toBe(3600);
    expect(body.timezone).toBe('UTC');
  });

  it('should list schedules (GET /schedules, camelCase -> snake_case query)', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ schedules: [], total: 0, limit: 50, offset: 0 }),
    );

    const result = await client.schedules.list({
      workflowId: 'wf-1',
      isActive: true,
      limit: 10,
      offset: 5,
    });

    expect(result.total).toBe(0);
    expect(Array.isArray(result.schedules)).toBe(true);

    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toContain('/schedules');
    expect(init.method).toBe('GET');
    expect(url).toContain('workflow_id=wf-1');
    expect(url).toContain('is_active=true');
    expect(url).toContain('limit=10');
    expect(url).toContain('offset=5');
  });

  it('should get a schedule (GET /schedules/{id})', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ id: 's1', name: 'Daily', schedule_type: 'cron' }),
    );

    const result = await client.schedules.get('s1');

    expect(result.id).toBe('s1');
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toContain('/schedules/s1');
    expect(init.method).toBe('GET');
  });

  it('should update a schedule (PUT /schedules/{id}, camelCase -> snake_case body)', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ id: 's1', name: 'Renamed', schedule_type: 'interval' }),
    );

    const result = await client.schedules.update('s1', {
      name: 'Renamed',
      scheduleType: 'interval',
      intervalSeconds: 7200,
    });

    expect(result.name).toBe('Renamed');
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toContain('/schedules/s1');
    expect(init.method).toBe('PUT');
    const body = JSON.parse(init.body);
    expect(body.schedule_type).toBe('interval');
    expect(body.interval_seconds).toBe(7200);
  });

  it('should delete a schedule (DELETE /schedules/{id}) returning {message}', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ message: 'Schedule deleted successfully' }),
    );

    const result = await client.schedules.delete('s1');

    expect(result.message).toBe('Schedule deleted successfully');
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toContain('/schedules/s1');
    expect(init.method).toBe('DELETE');
  });

  it('should pause a schedule (POST /schedules/{id}/pause) returning ScheduleResponse', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ id: 's1', is_active: false }),
    );

    const result = await client.schedules.pause('s1');

    expect(result.id).toBe('s1');
    expect(result.is_active).toBe(false);
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toContain('/schedules/s1/pause');
    expect(init.method).toBe('POST');
  });

  it('should resume a schedule (POST /schedules/{id}/resume) returning ScheduleResponse', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ id: 's1', is_active: true }),
    );

    const result = await client.schedules.resume('s1');

    expect(result.id).toBe('s1');
    expect(result.is_active).toBe(true);
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toContain('/schedules/s1/resume');
    expect(init.method).toBe('POST');
  });

  it('should list runs (GET /schedules/{id}/runs, camelCase -> snake_case query)', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ runs: [], total: 0, limit: 50, offset: 0 }),
    );

    const result = await client.schedules.runs('s1', {
      status: 'failed',
      limit: 20,
      offset: 0,
    });

    expect(Array.isArray(result.runs)).toBe(true);
    expect(result.total).toBe(0);
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toContain('/schedules/s1/runs');
    expect(init.method).toBe('GET');
    expect(url).toContain('status=failed');
    expect(url).toContain('limit=20');
  });

  it('should get run stats (GET /schedules/{id}/runs/stats) with avg_duration_seconds', async () => {
    const stats = {
      period_days: 7,
      total_runs: 100,
      successful_runs: 95,
      failed_runs: 5,
      success_rate: 0.95,
      avg_duration_seconds: 12.5,
      min_duration_seconds: 1.0,
      max_duration_seconds: 60.0,
    };
    mockFetch.mockResolvedValueOnce(jsonResponse(stats));

    const result = await client.schedules.runStats('s1', { days: 7 });

    expect(result.total_runs).toBe(100);
    expect(result.success_rate).toBe(0.95);
    expect(result.avg_duration_seconds).toBe(12.5);
    expect(result.period_days).toBe(7);
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toContain('/schedules/s1/runs/stats');
    expect(init.method).toBe('GET');
    expect(url).toContain('days=7');
  });

  it('should get a single run (GET /schedules/{id}/runs/{runId})', async () => {
    const run = {
      id: 'run-1',
      schedule_id: 's1',
      scheduled_at: '2026-01-01T00:00:00Z',
      status: 'completed',
      triggered_by: 'scheduler',
      created_at: '2026-01-01T00:00:00Z',
      duration_seconds: 3.2,
      error_message: null,
    };
    mockFetch.mockResolvedValueOnce(jsonResponse(run));

    const result = await client.schedules.getRun('s1', 'run-1');

    expect(result.id).toBe('run-1');
    expect(result.schedule_id).toBe('s1');
    expect(result.status).toBe('completed');
    expect(result.duration_seconds).toBe(3.2);
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toContain('/schedules/s1/runs/run-1');
    expect(init.method).toBe('GET');
  });

  it('should retry a run (POST /schedules/{id}/runs/{runId}/retry) returning RetryRunResponse', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ message: 'Run retry queued', original_run_id: 'run-1' }),
    );

    const result = await client.schedules.retryRun('s1', 'run-1');

    expect(result.message).toBe('Run retry queued');
    expect(result.original_run_id).toBe('run-1');
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toContain('/schedules/s1/runs/run-1/retry');
    expect(init.method).toBe('POST');
  });
});
