/**
 * Types for the organization dashboard — activity logs, analytics, and user management.
 * @module types/dashboard
 */

// ---------------------------------------------------------------------------
// Activity logs
// ---------------------------------------------------------------------------

/**
 * Query parameters for fetching organization activity logs.
 */
export interface DashboardLogsParams {
  limit?: number;
  offset?: number;
  /** Filter by log category (e.g. `"workflow"`, `"credential"`, `"auth"`). */
  category?: string;
  /** Filter by operation type (e.g. `"run"`, `"create"`, `"delete"`). */
  operation?: string;
  /** ISO-8601 start date for the log window. */
  startDate?: string;
  /** ISO-8601 end date for the log window. */
  endDate?: string;
}

/**
 * A single activity log entry.
 */
export interface ActivityLogEntry {
  id: string;
  category: string;
  operation: string;
  user_id: string;
  resource_id?: string | null;
  resource_type?: string | null;
  metadata?: Record<string, unknown>;
  created_at: string;
}

/**
 * Pagination metadata embedded in log responses.
 */
export interface LogsPaginationData {
  logs: ActivityLogEntry[];
  total_count: number;
  limit: number;
  offset: number;
  has_next: boolean;
  has_previous: boolean;
}

/**
 * Response from the dashboard logs endpoint.
 */
export interface DashboardLogsResponse {
  success: boolean;
  organization_id: string;
  data: LogsPaginationData;
  filters: Record<string, unknown>;
  meta: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Analytics — overview
// ---------------------------------------------------------------------------

/**
 * Query parameters for the analytics overview endpoint.
 */
export interface AnalyticsOverviewParams {
  limit?: number;
  offset?: number;
}

/**
 * Response from the analytics overview endpoint.
 */
export interface AnalyticsOverviewResponse {
  success: boolean;
  organization_id: string;
  data: {
    overview: Record<string, unknown>;
  };
  meta: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Analytics — tools
// ---------------------------------------------------------------------------

/**
 * Query parameters for the tools analytics endpoint.
 */
export interface AnalyticsToolsParams {
  /** Aggregation period (e.g. `"24h"`, `"7d"`, `"30d"`, `"90d"`). */
  period?: string;
  limit?: number;
  offset?: number;
}

/**
 * Response from the tools analytics endpoint.
 */
export interface AnalyticsToolsResponse {
  success: boolean;
  organization_id: string;
  data: Record<string, unknown>;
  meta: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Analytics — LLM usage
// ---------------------------------------------------------------------------

/**
 * Response from the LLM usage analytics endpoint.
 */
export interface AnalyticsLLMUsageResponse {
  success: boolean;
  organization_id: string;
  data: Record<string, unknown>;
  meta: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Dashboard users
// ---------------------------------------------------------------------------

/**
 * Query parameters for listing organization members from the dashboard.
 */
export interface DashboardUsersParams {
  search?: string;
  /** Filter by member status (e.g. `"active"`, `"invited"`, `"suspended"`). */
  status?: string;
  /** Field to sort by (e.g. `"created_at"`, `"email"`). */
  sortBy?: string;
  /** Sort direction — `"asc"` or `"desc"`. */
  order?: string;
  page?: number;
  limit?: number;
}

/**
 * Response from the dashboard users endpoint.
 */
export interface DashboardUsersResponse {
  success: boolean;
  organization_id: string;
  users: Record<string, unknown>[];
  invitation_count: number;
  max_seats: number;
  total: number;
  total_pages: number;
  current_page: number;
  limit: number;
  has_next: boolean;
  has_previous: boolean;
}
