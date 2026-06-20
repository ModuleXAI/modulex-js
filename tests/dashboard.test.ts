import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Modulex } from '../src/client';

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('Dashboard Resource', () => {
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

  it('should fetch activity logs with camelCase params converted to snake_case query', async () => {
    const data = {
      success: true,
      organization_id: 'org-1',
      data: {
        logs: [
          {
            id: 'log-1',
            audit_time: '2026-01-01T00:00:00Z',
            category: 'workflow',
            operation: 'run',
            actor_email: 'a@b.com',
            message: 'Ran workflow',
            metadata: {},
          },
        ],
        total_count: 1,
        limit: 10,
        offset: 0,
        has_next: false,
        has_previous: false,
      },
      filters: { category: null, operation: null, start_date: null, end_date: null },
      meta: {},
    };
    mockFetch.mockResolvedValueOnce(jsonResponse(data));

    const result = await client.dashboard.logs({
      limit: 10,
      offset: 0,
      category: 'workflow',
      operation: 'run',
      startDate: '2026-01-01',
      endDate: '2026-01-31',
    });

    const url = mockFetch.mock.calls[0][0] as string;
    const method = mockFetch.mock.calls[0][1]?.method ?? 'GET';
    expect(method).toBe('GET');
    expect(url).toContain('/dashboard/logs');
    expect(url).toContain('limit=10');
    expect(url).toContain('category=workflow');
    expect(url).toContain('operation=run');
    // camelCase -> snake_case query params
    expect(url).toContain('start_date=2026-01-01');
    expect(url).toContain('end_date=2026-01-31');

    if (!result.success) throw new Error('expected success');
    expect(result.data.logs[0].audit_time).toBe('2026-01-01T00:00:00Z');
    expect(result.data.logs[0].actor_email).toBe('a@b.com');
    expect(result.data.total_count).toBe(1);
  });

  it('should fetch analytics overview', async () => {
    const data = {
      success: true,
      organization_id: 'org-1',
      data: {
        overview: {
          active_member_count: 3,
          configured_integrations_count: 2,
          total_integrations_count: 5,
          total_credentials_count: 4,
          current_month_credit_usage: {
            used_credit: 10,
            max_credit: 100,
            next_reset_date: null,
          },
          subscription: {
            current_period_start: '2026-06-01T00:00:00Z',
            current_period_end: '2026-06-30T00:00:00Z',
          },
          credential_usage_logs: [],
        },
      },
      meta: {},
    };
    mockFetch.mockResolvedValueOnce(jsonResponse(data));

    const result = await client.dashboard.analyticsOverview({ limit: 5, offset: 0 });

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain('/dashboard/analytics/overview');
    expect(url).toContain('limit=5');
    expect(url).toContain('offset=0');

    if (!result.success) throw new Error('expected success');
    expect(result.data.overview.active_member_count).toBe(3);
    expect(result.data.overview.subscription.current_period_start).toBe(
      '2026-06-01T00:00:00Z',
    );
  });

  it('should fetch tools analytics with period param', async () => {
    const data = {
      success: true,
      organization_id: 'org-1',
      data: {
        total_tool_executions: 100,
        current_month_total_tool_executions: 20,
        current_month_credit_usage: {
          used_credit: 5,
          max_credit: 50,
          next_reset_date: null,
        },
        success_rate: 0.95,
        most_used_action: { action_name: 'send', integration_name: 'slack' },
        configured_integrations_count: 2,
        total_integrations_count: 5,
        tool_usages: [
          {
            user_email: 'a@b.com',
            integration_name: 'slack',
            action_name: 'send',
            executed_at: '2026-06-01T00:00:00Z',
            execution_duration_ms: 120,
            status: 'success',
            credential_display_name: 'Modulex Key',
          },
        ],
      },
      meta: {},
    };
    mockFetch.mockResolvedValueOnce(jsonResponse(data));

    const result = await client.dashboard.analyticsTools({
      period: '30d',
      limit: 5,
      offset: 0,
    });

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain('/dashboard/analytics/tools');
    expect(url).toContain('period=30d');
    expect(url).toContain('limit=5');

    if (!result.success) throw new Error('expected success');
    expect(result.data.total_tool_executions).toBe(100);
    expect(result.data.most_used_action?.action_name).toBe('send');
    expect(result.data.tool_usages[0].status).toBe('success');
  });

  it('should fetch LLM usage analytics with renamed keys', async () => {
    const data = {
      success: true,
      organization_id: 'org-1',
      data: {
        total_llm_call: 42,
        current_month_total_llm_call: 10,
        current_month_credit_usage: {
          used_credit: 5,
          max_credit: 50,
          next_reset_date: null,
        },
        request_success_rate: 0.9,
        total_completion_tokens: 1000,
        total_prompt_tokens: 2000,
        llm_usages: [
          {
            user_email: null,
            provider: 'openai',
            model: 'gpt-4',
            prompt_tokens: 100,
            completion_tokens: 50,
            request_time: '2026-06-01T00:00:00Z',
            request_duration: 800,
            status: 'success',
            credential_display_name: null,
          },
        ],
      },
      meta: {},
    };
    mockFetch.mockResolvedValueOnce(jsonResponse(data));

    const result = await client.dashboard.analyticsLlmUsage({
      period: '7d',
      limit: 5,
      offset: 0,
    });

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain('/dashboard/analytics/llm-usage');
    expect(url).toContain('period=7d');

    if (!result.success) throw new Error('expected success');
    expect(result.data.total_llm_call).toBe(42);
    expect(result.data.llm_usages[0].provider).toBe('openai');
    expect(result.data.llm_usages[0].model).toBe('gpt-4');
    expect(result.data.llm_usages[0].request_time).toBe('2026-06-01T00:00:00Z');
  });

  it('should list dashboard users with camelCase params converted to snake_case query', async () => {
    const data = {
      success: true,
      organization_id: 'org-1',
      users: [
        {
          id: 'u-1',
          email: 'a@b.com',
          username: 'alice',
          avatar: null,
          role: 'admin',
          is_active: true,
          created_at: '2026-01-01T00:00:00Z',
          updated_at: null,
          last_active_at: null,
          current_month_credit_usage: 5,
        },
      ],
      invitation_count: 0,
      max_seats: 10,
      total: 1,
      total_pages: 1,
      current_page: 1,
      limit: 5,
      has_next: false,
      has_previous: false,
    };
    mockFetch.mockResolvedValueOnce(jsonResponse(data));

    const result = await client.dashboard.users({
      search: 'alice',
      status: 'active',
      sortBy: 'created_at',
      order: 'desc',
      page: 1,
      limit: 5,
    });

    const url = mockFetch.mock.calls[0][0] as string;
    const method = mockFetch.mock.calls[0][1]?.method ?? 'GET';
    expect(method).toBe('GET');
    expect(url).toContain('/dashboard/users');
    expect(url).toContain('search=alice');
    expect(url).toContain('status=active');
    // camelCase -> snake_case query param
    expect(url).toContain('sort_by=created_at');
    expect(url).toContain('order=desc');
    expect(url).toContain('page=1');

    if (!result.success) throw new Error('expected success');
    expect(result.users[0].email).toBe('a@b.com');
    expect(result.total).toBe(1);
  });

  it('should read the error envelope (success:false) discriminant', async () => {
    const data = {
      success: false,
      error: {
        code: 'AUDIT_LOGS_ERROR',
        message: 'boom',
        details: 'stack',
      },
    };
    mockFetch.mockResolvedValueOnce(jsonResponse(data));

    const result = await client.dashboard.logs();

    expect(result.success).toBe(false);
    if (result.success) throw new Error('expected error envelope');
    expect(result.error.code).toBe('AUDIT_LOGS_ERROR');
    expect(result.error.message).toBe('boom');
  });
});
