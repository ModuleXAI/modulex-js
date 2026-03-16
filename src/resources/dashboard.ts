/**
 * Dashboard resource — activity logs, analytics, and user management endpoints.
 * @module resources/dashboard
 */

import { BaseResource } from '../base';
import type { RequestOptions } from '../types';
import type {
  DashboardLogsParams,
  DashboardLogsResponse,
  AnalyticsOverviewParams,
  AnalyticsOverviewResponse,
  AnalyticsToolsParams,
  AnalyticsToolsResponse,
  AnalyticsLLMUsageResponse,
  DashboardUsersParams,
  DashboardUsersResponse,
} from '../types';

/**
 * Provides methods for the `/dashboard` API endpoints.
 */
export class Dashboard extends BaseResource {
  /**
   * GET /dashboard/logs
   *
   * Returns paginated activity logs for the current organization.
   */
  async logs(
    params?: DashboardLogsParams,
    options?: RequestOptions,
  ): Promise<DashboardLogsResponse> {
    return this._get<DashboardLogsResponse>('/dashboard/logs', {
      ...options,
      params: {
        ...options?.params,
        limit: params?.limit,
        offset: params?.offset,
        category: params?.category,
        operation: params?.operation,
        start_date: params?.startDate,
        end_date: params?.endDate,
      },
    });
  }

  /**
   * GET /dashboard/analytics/overview
   *
   * Returns high-level execution and usage analytics for the organization.
   */
  async analyticsOverview(
    params?: AnalyticsOverviewParams,
    options?: RequestOptions,
  ): Promise<AnalyticsOverviewResponse> {
    return this._get<AnalyticsOverviewResponse>('/dashboard/analytics/overview', {
      ...options,
      params: {
        ...options?.params,
        limit: params?.limit,
        offset: params?.offset,
      },
    });
  }

  /**
   * GET /dashboard/analytics/tools
   *
   * Returns tool-usage analytics broken down by integration.
   */
  async analyticsTools(
    params?: AnalyticsToolsParams,
    options?: RequestOptions,
  ): Promise<AnalyticsToolsResponse> {
    return this._get<AnalyticsToolsResponse>('/dashboard/analytics/tools', {
      ...options,
      params: {
        ...options?.params,
        period: params?.period,
        limit: params?.limit,
        offset: params?.offset,
      },
    });
  }

  /**
   * GET /dashboard/analytics/llm-usage
   *
   * Returns LLM token-usage analytics broken down by model and provider.
   */
  async analyticsLlmUsage(
    params?: AnalyticsToolsParams,
    options?: RequestOptions,
  ): Promise<AnalyticsLLMUsageResponse> {
    return this._get<AnalyticsLLMUsageResponse>('/dashboard/analytics/llm-usage', {
      ...options,
      params: {
        ...options?.params,
        period: params?.period,
        limit: params?.limit,
        offset: params?.offset,
      },
    });
  }

  /**
   * GET /dashboard/users
   *
   * Returns organization members with pagination and search support.
   */
  async users(
    params?: DashboardUsersParams,
    options?: RequestOptions,
  ): Promise<DashboardUsersResponse> {
    return this._get<DashboardUsersResponse>('/dashboard/users', {
      ...options,
      params: {
        ...options?.params,
        search: params?.search,
        status: params?.status,
        sort_by: params?.sortBy,
        order: params?.order,
        page: params?.page,
        limit: params?.limit,
      },
    });
  }
}
