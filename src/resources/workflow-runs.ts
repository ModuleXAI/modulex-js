/**
 * WorkflowRuns resource — durable run-history read endpoints under `/workflow-runs`.
 *
 * These are distinct from the ephemeral execution-control endpoints in the
 * {@link Executions} resource: this resource reads the persisted `workflow_runs`
 * table (history, input/output snapshots, attribution).
 * @module resources/workflow-runs
 */

import { BaseResource } from '../base';
import type { RequestOptions } from '../types';
import type {
  WorkflowRunListParams,
  WorkflowRunListResponse,
  WorkflowRunDetail,
} from '../types';

/**
 * Provides read access to durable workflow run history under `/workflow-runs`.
 */
export class WorkflowRuns extends BaseResource {
  /**
   * GET /workflow-runs
   *
   * Lists workflow runs for the organization, newest first. Pass `workflowId`
   * for per-workflow history. Pagination is via `has_more` (no total count).
   */
  async list(
    params?: WorkflowRunListParams,
    options?: RequestOptions,
  ): Promise<WorkflowRunListResponse> {
    return this._get<WorkflowRunListResponse>('/workflow-runs', {
      ...options,
      params: {
        ...(params as Record<string, string | number | boolean | undefined> | undefined),
        ...options?.params,
      },
    });
  }

  /**
   * GET /workflow-runs/{runPk}
   *
   * Returns the full durable run record (including input/output snapshots).
   *
   * NOTE: `runPk` is the run table primary key (the `id` field of a
   * {@link WorkflowRunListItem} / {@link WorkflowRunDetail}), NOT the string
   * `run_id` used by `executions.listen()` / `executions.cancel()`. Passing a
   * `run_id` here returns 404.
   */
  async get(
    runPk: string,
    options?: RequestOptions,
  ): Promise<WorkflowRunDetail> {
    return this._get<WorkflowRunDetail>(`/workflow-runs/${runPk}`, options);
  }
}
