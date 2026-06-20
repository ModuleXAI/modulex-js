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
  name?: string;
  description?: string;
  scheduleType?: 'interval' | 'cron';
  intervalSeconds?: number;
  cronExpression?: string;
  timezone?: string;
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
  /** Organization that owns this schedule. */
  organization_id: string;
  name: string;
  description: string | null;
  schedule_type: 'interval' | 'cron';
  interval_seconds?: number | null;
  cron_expression?: string | null;
  /** IANA timezone name. */
  timezone: string;
  /** State input passed to the workflow on each scheduled run. Always present (defaults to `{}`). */
  input: Record<string, unknown>;
  /** Runtime config overrides applied to each scheduled run. Always present (defaults to `{}`). */
  config: Record<string, unknown>;
  is_active: boolean;
  next_run_at?: string | null;
  last_run_at?: string | null;
  /** Status of the most recent run, or `null` if the schedule has never run. */
  last_run_status?: string | null;
  /** Total number of runs recorded for this schedule. */
  total_runs: number;
  /** Number of runs that completed successfully. */
  successful_runs: number;
  /** Number of runs that failed. */
  failed_runs: number;
  created_at: string;
  updated_at: string;
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
  /** Workflow executed by this run, or `null` if not associated. */
  workflow_id?: string | null;
  /** Underlying execution run identifier, or `null`. */
  run_id?: string | null;
  /** Thread identifier for the run, or `null`. */
  thread_id?: string | null;
  /** Time the run was scheduled to execute. */
  scheduled_at: string;
  /** Time the run actually started, or `null` if it has not started. */
  started_at?: string | null;
  completed_at?: string | null;
  /** Run duration in seconds, or `null` if unavailable. */
  duration_seconds?: number | null;
  /** Run status (e.g. `"completed"`, `"failed"`, `"running"`). */
  status: string;
  /** Failure message when the run failed, or `null`. */
  error_message?: string | null;
  /** How the run was triggered (e.g. `"scheduler"`, `"manual"`). */
  triggered_by: string;
  /** Deployment used for the run, or `null`. */
  deployment_id?: string | null;
  created_at: string;
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
 * Paginated list of scheduled runs.
 */
export interface ScheduleRunListResponse {
  runs: ScheduleRunResponse[];
  total: number;
  limit: number;
  offset: number;
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
  /** Number of past days covered by this stats window. */
  period_days: number;
  total_runs: number;
  successful_runs: number;
  failed_runs: number;
  /** Fraction of runs that succeeded (0.0–1.0). */
  success_rate: number;
  /** Average run duration in seconds, or `null` if no runs. */
  avg_duration_seconds?: number | null;
  /** Minimum run duration in seconds, or `null` if no runs. */
  min_duration_seconds?: number | null;
  /** Maximum run duration in seconds, or `null` if no runs. */
  max_duration_seconds?: number | null;
}

/**
 * Response returned when retrying a scheduled run.
 */
export interface RetryRunResponse {
  message: string;
  /** Identifier of the original run that was retried. */
  original_run_id: string;
}

/**
 * Response returned when deleting a schedule.
 */
export interface DeleteScheduleResponse {
  message: string;
}
