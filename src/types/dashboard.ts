/**
 * Types for the organization dashboard — activity logs, analytics, and user management.
 * @module types/dashboard
 */

// ---------------------------------------------------------------------------
// Shared
// ---------------------------------------------------------------------------

/**
 * Error envelope returned by dashboard endpoints. All five dashboard routes
 * return HTTP 200 even on failure, with `success: false` and this `error`
 * object (instead of the success-shaped `data`/`users`/`filters` keys).
 */
export interface DashboardErrorEnvelope {
  success: false;
  /** Machine-readable error code (e.g. `"AUDIT_LOGS_ERROR"`, `"ANALYTICS_ERROR"`, `"USER_ERROR"`). */
  error: {
    code: string;
    message: string;
    /** Stringified underlying exception detail. */
    details: string;
  };
}

/**
 * Per-organization monthly credit usage, embedded in several analytics payloads.
 */
export interface CurrentMonthCreditUsage {
  used_credit: number;
  max_credit: number;
  /** ISO-8601 timestamp of the next credit reset, or `null`. */
  next_reset_date: string | null;
}

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
 * A single activity (audit) log entry, as emitted by `GET /dashboard/logs`.
 */
export interface ActivityLogEntry {
  id: string;
  /** ISO-8601 timestamp of the audited event; `null` when unset. */
  audit_time?: string | null;
  category: string;
  operation: string;
  /** Email of the acting user; `null` when the actor row is missing (outer join). */
  actor_email?: string | null;
  /** Human-readable description of the audited event. */
  message: string;
  metadata?: Record<string, unknown>;
}

/**
 * Pagination payload embedded in the logs response (offset-based).
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
 * Concrete shape of the `filters` echo returned by the logs endpoint.
 */
export interface DashboardLogsFilters {
  category: string | null;
  operation: string | null;
  /** ISO-8601 start date echoed back, or `null`. */
  start_date: string | null;
  /** ISO-8601 end date echoed back, or `null`. */
  end_date: string | null;
}

/**
 * Success response from the dashboard logs endpoint.
 */
export interface DashboardLogsSuccess {
  success: true;
  organization_id: string;
  data: LogsPaginationData;
  filters: DashboardLogsFilters;
  meta: Record<string, unknown>;
}

/**
 * Response from the dashboard logs endpoint — success or error envelope.
 */
export type DashboardLogsResponse = DashboardLogsSuccess | DashboardErrorEnvelope;

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
 * Billing subscription window for the organization.
 */
export interface AnalyticsSubscription {
  /** ISO-8601 start of the current billing period (always present). */
  current_period_start: string;
  /** ISO-8601 end of the current billing period (always present). */
  current_period_end: string;
}

/**
 * A single credential-usage log row in the overview payload.
 *
 * Unlike the tools/LLM usage rows, overview rows include `auth_type`.
 */
export interface OverviewCredentialUsageLog {
  integration_name: string;
  service_name: string;
  /** Raw auth type of the credential (e.g. `"modulex_key"`, `"oauth2"`). */
  auth_type: string;
  credential_display_name: string | null;
  success: boolean;
  /** ISO-8601 execution timestamp; `null` when unset. */
  executed_at: string | null;
  /** Email of the executing user; `null` when the user row is missing (outer join). */
  user_email: string | null;
}

/**
 * Structured analytics overview payload.
 */
export interface AnalyticsOverview {
  active_member_count: number;
  configured_integrations_count: number;
  total_integrations_count: number;
  total_credentials_count: number;
  current_month_credit_usage: CurrentMonthCreditUsage;
  subscription: AnalyticsSubscription;
  credential_usage_logs: OverviewCredentialUsageLog[];
}

/**
 * Success response from the analytics overview endpoint.
 */
export interface AnalyticsOverviewSuccess {
  success: true;
  organization_id: string;
  data: {
    overview: AnalyticsOverview;
  };
  meta: Record<string, unknown>;
}

/**
 * Response from the analytics overview endpoint — success or error envelope.
 */
export type AnalyticsOverviewResponse =
  | AnalyticsOverviewSuccess
  | DashboardErrorEnvelope;

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
 * Most-used action within the requested period.
 */
export interface MostUsedAction {
  action_name: string;
  integration_name: string;
}

/**
 * A single tool-usage log row.
 */
export interface ToolUsage {
  /** Email of the executing user; `null` when the user row is missing (outer join). */
  user_email: string | null;
  integration_name: string;
  action_name: string;
  /** ISO-8601 execution timestamp; `null` when unset. */
  executed_at: string | null;
  execution_duration_ms: number | null;
  /** Derived status from the underlying `success` boolean. */
  status: 'success' | 'error';
  /** Display name (`"Modulex Key"` for managed-key credentials), or `null`. */
  credential_display_name: string | null;
}

/**
 * Structured tools analytics payload.
 */
export interface AnalyticsToolsData {
  total_tool_executions: number;
  current_month_total_tool_executions: number;
  current_month_credit_usage: CurrentMonthCreditUsage;
  success_rate: number;
  /** Most used action in the period, or `null` when there is none. */
  most_used_action: MostUsedAction | null;
  configured_integrations_count: number;
  total_integrations_count: number;
  tool_usages: ToolUsage[];
}

/**
 * Success response from the tools analytics endpoint.
 */
export interface AnalyticsToolsSuccess {
  success: true;
  organization_id: string;
  data: AnalyticsToolsData;
  meta: Record<string, unknown>;
}

/**
 * Response from the tools analytics endpoint — success or error envelope.
 */
export type AnalyticsToolsResponse =
  | AnalyticsToolsSuccess
  | DashboardErrorEnvelope;

// ---------------------------------------------------------------------------
// Analytics — LLM usage
// ---------------------------------------------------------------------------

/**
 * Query parameters for the LLM usage analytics endpoint.
 *
 * Mirrors {@link AnalyticsToolsParams}; declared separately for clarity.
 */
export interface AnalyticsLLMUsageParams {
  /** Aggregation period (e.g. `"24h"`, `"7d"`, `"30d"`, `"90d"`). */
  period?: string;
  limit?: number;
  offset?: number;
}

/**
 * A single LLM-usage log row.
 *
 * Note the renamed keys relative to tool usage: `provider` (integration),
 * `model` (service), `request_time` (executed_at), `request_duration`
 * (execution_duration_ms).
 */
export interface LLMUsage {
  /** Email of the requesting user; `null` when the user row is missing (outer join). */
  user_email: string | null;
  provider: string;
  model: string;
  prompt_tokens: number;
  completion_tokens: number;
  /** ISO-8601 request timestamp; `null` when unset. */
  request_time: string | null;
  request_duration: number | null;
  /** Derived status from the underlying `success` boolean. */
  status: 'success' | 'error';
  /** Display name (`"Modulex Key"` for managed-key credentials), or `null`. */
  credential_display_name: string | null;
}

/**
 * Structured LLM usage analytics payload.
 */
export interface AnalyticsLLMUsageData {
  total_llm_call: number;
  current_month_total_llm_call: number;
  current_month_credit_usage: CurrentMonthCreditUsage;
  request_success_rate: number;
  total_completion_tokens: number;
  total_prompt_tokens: number;
  llm_usages: LLMUsage[];
}

/**
 * Success response from the LLM usage analytics endpoint.
 */
export interface AnalyticsLLMUsageSuccess {
  success: true;
  organization_id: string;
  data: AnalyticsLLMUsageData;
  meta: Record<string, unknown>;
}

/**
 * Response from the LLM usage analytics endpoint — success or error envelope.
 */
export type AnalyticsLLMUsageResponse =
  | AnalyticsLLMUsageSuccess
  | DashboardErrorEnvelope;

// ---------------------------------------------------------------------------
// Dashboard users
// ---------------------------------------------------------------------------

/**
 * Query parameters for listing organization members from the dashboard.
 */
export interface DashboardUsersParams {
  search?: string;
  /** Filter by member status. Only `"active"` and `"inactive"` are honored by the backend. */
  status?: 'active' | 'inactive';
  /** Field to sort by (e.g. `"created_at"`, `"email"`). */
  sortBy?: string;
  /** Sort direction — `"asc"` or `"desc"`. */
  order?: string;
  page?: number;
  limit?: number;
}

/**
 * A dashboard user row representing an active organization member.
 */
export interface DashboardMemberUser {
  id: string;
  email: string;
  username: string | null;
  avatar: string | null;
  role: string;
  is_active: boolean;
  /** ISO-8601 creation timestamp; `null` when unset. */
  created_at: string | null;
  /** ISO-8601 last-update timestamp; `null` when unset. */
  updated_at: string | null;
  /** ISO-8601 last-active timestamp; `null` when unset. */
  last_active_at: string | null;
  current_month_credit_usage: number;
}

/**
 * A dashboard user row representing a pending invitation (prepended to the list).
 */
export interface DashboardInvitationUser {
  id: string;
  email: string;
  username: null;
  avatar: null;
  role: string;
  is_active: false;
  /** ISO-8601 creation timestamp; `null` when unset. */
  created_at: string | null;
  updated_at: null;
  last_active_at: null;
  current_month_credit_usage: number;
  /** Discriminant flag marking this row as an invitation. */
  is_invitation: true;
  /** Invitation status (e.g. `"pending"`, `"rejected"`, `"expired"`, `"canceled"`). */
  invitation_status: string;
  /** ISO-8601 expiry timestamp; `null` when unset. */
  invitation_expires_at: string | null;
  /** ID of the invited user if already registered, else `null`. */
  invited_user_id: string | null;
  /** ISO-8601 invitation timestamp; `null` when unset. */
  invited_at: string | null;
}

/**
 * A dashboard user row — either an active member or a pending invitation.
 * Discriminate on the optional `is_invitation` flag.
 */
export type DashboardUser = DashboardMemberUser | DashboardInvitationUser;

/**
 * Success response from the dashboard users endpoint (page-based pagination).
 */
export interface DashboardUsersSuccess {
  success: true;
  organization_id: string;
  users: DashboardUser[];
  invitation_count: number;
  max_seats: number;
  total: number;
  total_pages: number;
  current_page: number;
  limit: number;
  has_next: boolean;
  has_previous: boolean;
}

/**
 * Response from the dashboard users endpoint — success or error envelope.
 */
export type DashboardUsersResponse =
  | DashboardUsersSuccess
  | DashboardErrorEnvelope;
