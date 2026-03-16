/**
 * Schedules resource — workflow schedule management and run history endpoints.
 * @module resources/schedules
 */

import { BaseResource } from '../base';
import type { RequestOptions } from '../types';
import type {
  CreateScheduleParams,
  UpdateScheduleParams,
  ScheduleListParams,
  ScheduleResponse,
  ScheduleListResponse,
  SuccessResponse,
  ScheduleRunListParams,
  ScheduleRunStatsParams,
  ScheduleRunStatsResponse,
  ScheduleRunResponse,
} from '../types';

/**
 * Provides methods for the `/schedules` API endpoints.
 */
export class Schedules extends BaseResource {
  /**
   * POST /schedules
   *
   * Creates a new workflow schedule.
   */
  async create(
    params: CreateScheduleParams,
    options?: RequestOptions,
  ): Promise<ScheduleResponse> {
    return this._post<ScheduleResponse>('/schedules', params, options);
  }

  /**
   * GET /schedules
   *
   * Lists schedules for the current organization.
   */
  async list(
    params?: ScheduleListParams,
    options?: RequestOptions,
  ): Promise<ScheduleListResponse> {
    return this._get<ScheduleListResponse>('/schedules', {
      ...options,
      params: {
        ...options?.params,
        workflow_id: params?.workflowId,
        is_active: params?.isActive,
        limit: params?.limit,
        offset: params?.offset,
      },
    });
  }

  /**
   * GET /schedules/{scheduleId}
   *
   * Returns a single schedule record.
   */
  async get(scheduleId: string, options?: RequestOptions): Promise<ScheduleResponse> {
    return this._get<ScheduleResponse>(`/schedules/${scheduleId}`, options);
  }

  /**
   * PUT /schedules/{scheduleId}
   *
   * Updates an existing schedule. Only provided fields are changed.
   */
  async update(
    scheduleId: string,
    params: UpdateScheduleParams,
    options?: RequestOptions,
  ): Promise<ScheduleResponse> {
    return this._put<ScheduleResponse>(`/schedules/${scheduleId}`, params, options);
  }

  /**
   * DELETE /schedules/{scheduleId}
   *
   * Deletes a schedule and cancels all pending executions.
   */
  async delete(scheduleId: string, options?: RequestOptions): Promise<SuccessResponse> {
    return this._delete<SuccessResponse>(
      `/schedules/${scheduleId}`,
      undefined,
      options,
    );
  }

  /**
   * POST /schedules/{scheduleId}/pause
   *
   * Pauses a schedule, preventing future runs until resumed.
   */
  async pause(scheduleId: string, options?: RequestOptions): Promise<SuccessResponse> {
    return this._post<SuccessResponse>(
      `/schedules/${scheduleId}/pause`,
      undefined,
      options,
    );
  }

  /**
   * POST /schedules/{scheduleId}/resume
   *
   * Resumes a paused schedule.
   */
  async resume(scheduleId: string, options?: RequestOptions): Promise<SuccessResponse> {
    return this._post<SuccessResponse>(
      `/schedules/${scheduleId}/resume`,
      undefined,
      options,
    );
  }

  /**
   * GET /schedules/{scheduleId}/runs
   *
   * Returns the run history for a schedule.
   */
  async runs(
    scheduleId: string,
    params?: ScheduleRunListParams,
    options?: RequestOptions,
  ): Promise<Record<string, unknown>> {
    return this._get<Record<string, unknown>>(`/schedules/${scheduleId}/runs`, {
      ...options,
      params: {
        ...options?.params,
        status: params?.status,
        limit: params?.limit,
        offset: params?.offset,
      },
    });
  }

  /**
   * GET /schedules/{scheduleId}/runs/stats
   *
   * Returns aggregate run statistics for a schedule.
   */
  async runStats(
    scheduleId: string,
    params?: ScheduleRunStatsParams,
    options?: RequestOptions,
  ): Promise<ScheduleRunStatsResponse> {
    return this._get<ScheduleRunStatsResponse>(
      `/schedules/${scheduleId}/runs/stats`,
      {
        ...options,
        params: {
          ...options?.params,
          days: params?.days,
        },
      },
    );
  }

  /**
   * GET /schedules/{scheduleId}/runs/{runId}
   *
   * Returns details for a single scheduled run.
   */
  async getRun(
    scheduleId: string,
    runId: string,
    options?: RequestOptions,
  ): Promise<ScheduleRunResponse> {
    return this._get<ScheduleRunResponse>(
      `/schedules/${scheduleId}/runs/${runId}`,
      options,
    );
  }

  /**
   * POST /schedules/{scheduleId}/runs/{runId}/retry
   *
   * Retries a failed scheduled run.
   */
  async retryRun(
    scheduleId: string,
    runId: string,
    options?: RequestOptions,
  ): Promise<Record<string, unknown>> {
    return this._post<Record<string, unknown>>(
      `/schedules/${scheduleId}/runs/${runId}/retry`,
      undefined,
      options,
    );
  }
}
