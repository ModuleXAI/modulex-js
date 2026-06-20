/**
 * Types for the durable workflow run-history read endpoints (`/workflow-runs`).
 * @module types/workflow-runs
 */

/**
 * Query parameters for listing workflow runs.
 */
export interface WorkflowRunListParams {
  /** Filter to a single workflow's run history. */
  workflowId?: string;
  /** Filter by run status. */
  status?: string;
  /** Filter by trigger type. */
  triggerType?: string;
  /** Page size, 1–100 (default 50). */
  limit?: number;
  /** Number of rows to skip (default 0). */
  offset?: number;
}

/**
 * A preview-optimized run-history list row (no heavy snapshot columns).
 */
export interface WorkflowRunListItem {
  /** The run table primary key (UUID) — pass this to `get()`, NOT `run_id`. */
  id: string;
  /** The execution run ID (string) used by listen/cancel. */
  run_id: string;
  workflow_id: string | null;
  trigger_type: string;
  is_ad_hoc: boolean;
  status: string;
  started_at: string | null;
  completed_at: string | null;
  duration_seconds: number | null;
  error_message: string | null;
  created_at: string;
  has_output: boolean;
}

/**
 * Response from `GET /workflow-runs`. Pagination uses `has_more` (there is no
 * total count).
 */
export interface WorkflowRunListResponse {
  runs: WorkflowRunListItem[];
  has_more: boolean;
  limit: number;
  offset: number;
}

/**
 * A full durable run record, including input/output snapshots and attribution.
 */
export interface WorkflowRunDetail {
  /** The run table primary key (UUID). */
  id: string;
  run_id: string;
  organization_id: string;
  workflow_id: string | null;
  trigger_type: string;
  is_ad_hoc: boolean;
  status: string;
  user_id: string | null;
  api_key_id: string | null;
  schedule_id: string | null;
  composer_chat_id: string | null;
  thread_id: string | null;
  chat_id: string | null;
  deployment_id: string | null;
  started_at: string | null;
  completed_at: string | null;
  duration_seconds: number | null;
  error_message: string | null;
  input_snapshot: unknown | null;
  output_summary: unknown | null;
  created_at: string;
  updated_at: string;
}
