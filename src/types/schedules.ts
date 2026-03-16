/**
 * Types for workflow schedule management and scheduled run history.
 * @module types/schedules
 */

// ---------------------------------------------------------------------------
// Create / update params
// ---------------------------------------------------------------------------

/**
 * Parameters for creating a new workflow schedule.
 */
export interface CreateScheduleParams {
  /** ID of the workflow to run on this schedule. */
  workflowId: string;
  name: string;
  description?: string;
  /** How the schedule recurrence is defined. */
  scheduleType: 'interval' | 'cron';
  /** Recurrence interval in seconds. Required when `scheduleType` is `"interval"`. */
  intervalSeconds?: number;
  /** Cron expression string. Required when `scheduleType` is `"cron"`. */
  cronExpression?: string;
  /** IANA timezone name (e.g. `"America/New_York"`). Defaults to `"UTC"`. */
  timezone?: string;
  /** State input passed to the workflow on each scheduled run. */
  input?: Record<string, unknown>;
  /** Runtime config overrides applied to each scheduled run. */
  config?: Record<string, unknown>;
}

/**
 * Parameters for updating an existing schedule.
 * All fields are optional; only provided fields are updated.
 */
export interface UpdateScheduleParams {
  workflowId?: string;
  name?: string;
  description?: string;
  scheduleType?: 'interval' | 'cron';
  intervalSeconds?: number;
  cronExpression?: string;
  timezone?: string;
  isActive?: boolean;
  input?: Record<string, unknown>;
  config?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Schedule response
// ---------------------------------------------------------------------------

/**
 * A schedule record as returned by the API.
 */
export interface ScheduleResponse {
  id: string;
  workflow_id: string;
  name: string;
  description: string | null;
  schedule_type: 'interval' | 'cron';
  interval_seconds?: number | null;
  cron_expression?: string | null;
  /** IANA timezone name. */
  timezone: string;
  is_active: boolean;
  input?: Record<string, unknown> | null;
  config?: Record<string, unknown> | null;
  next_run_at?: string | null;
  last_run_at?: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
}

// ---------------------------------------------------------------------------
// Schedule list
// ---------------------------------------------------------------------------

/**
 * Query parameters for listing schedules.
 */
export interface ScheduleListParams {
  workflowId?: string;
  isActive?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * Paginated list of schedules.
 */
export interface ScheduleListResponse {
  schedules: ScheduleResponse[];
  total: number;
  limit: number;
  offset: number;
}

// ---------------------------------------------------------------------------
// Schedule run history
// ---------------------------------------------------------------------------

/**
 * A single scheduled run record.
 */
export interface ScheduleRunResponse {
  id: string;
  schedule_id: string;
  /** Run status (e.g. `"completed"`, `"failed"`, `"running"`). */
  status: string;
  started_at: string;
  completed_at?: string | null;
  error?: string | null;
  duration_ms?: number | null;
}

/**
 * Query parameters for listing runs belonging to a schedule.
 */
export interface ScheduleRunListParams {
  status?: string;
  limit?: number;
  offset?: number;
}

/**
 * Query parameters for fetching aggregate run statistics.
 */
export interface ScheduleRunStatsParams {
  /** Number of past days to include in the stats window. */
  days?: number;
}

/**
 * Aggregate run statistics for a schedule.
 */
export interface ScheduleRunStatsResponse {
  total_runs: number;
  successful_runs: number;
  failed_runs: number;
  average_duration_ms: number;
}
