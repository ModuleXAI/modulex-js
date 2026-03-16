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

  it('should create a schedule', async () => {
    const schedule = { id: 's1', name: 'Daily', schedule_type: 'cron' };
    mockFetch.mockResolvedValueOnce(jsonResponse(schedule));

    const result = await client.schedules.create({
      workflowId: 'wf-1',
      name: 'Daily',
      scheduleType: 'cron',
      cronExpression: '0 9 * * 1-5',
    });

    expect(result.name).toBe('Daily');
  });

  it('should list schedules', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ schedules: [], total: 0 }));

    const result = await client.schedules.list({ isActive: true });
    expect(result.total).toBe(0);
  });

  it('should pause a schedule', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ success: true }));

    const result = await client.schedules.pause('s1');
    expect(result.success).toBe(true);
    expect(mockFetch.mock.calls[0][0]).toContain('/schedules/s1/pause');
  });

  it('should resume a schedule', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ success: true }));

    const result = await client.schedules.resume('s1');
    expect(result.success).toBe(true);
    expect(mockFetch.mock.calls[0][0]).toContain('/schedules/s1/resume');
  });

  it('should get run stats', async () => {
    const stats = { total_runs: 100, successful_runs: 95, failed_runs: 5 };
    mockFetch.mockResolvedValueOnce(jsonResponse(stats));

    const result = await client.schedules.runStats('s1', { days: 7 });
    expect(result.total_runs).toBe(100);
  });
});
