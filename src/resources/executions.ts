/**
 * Executions resource — workflow run, resume, cancel, listen, and state endpoints.
 * @module resources/executions
 */

import { BaseResource } from '../base';
import type { RequestOptions } from '../types';
import type {
  WorkflowRunParams,
  WorkflowRunResponse,
  WorkflowStateResponse,
  WorkflowResumeParams,
  WorkflowResumeResponse,
  CancelResponse,
  WorkflowSSEEvent,
} from '../types';

/**
 * Provides methods for workflow execution endpoints under `/workflows`.
 */
export class Executions extends BaseResource {
  /**
   * POST /workflows/run
   *
   * Initiates a workflow run. Supports four modes: existing workflow, ad-hoc
   * workflow, direct LLM call, and system workflow. Returns immediately with
   * run metadata; stream events via `listen()`.
   */
  async run(
    params: WorkflowRunParams,
    options?: RequestOptions,
  ): Promise<WorkflowRunResponse> {
    return this._post<WorkflowRunResponse>('/workflows/run', params, options);
  }

  /**
   * GET /workflows/state/{threadId}
   *
   * Returns the persisted state snapshot of a workflow thread at its latest
   * checkpoint.
   */
  async getState(
    threadId: string,
    options?: RequestOptions,
  ): Promise<WorkflowStateResponse> {
    return this._get<WorkflowStateResponse>(`/workflows/state/${threadId}`, options);
  }

  /**
   * POST /workflows/resume/{threadId}
   *
   * Resumes a workflow that is waiting at an interrupt node.
   */
  async resume(
    params: WorkflowResumeParams,
    options?: RequestOptions,
  ): Promise<WorkflowResumeResponse> {
    const { threadId, ...rest } = params;
    return this._post<WorkflowResumeResponse>(
      `/workflows/resume/${threadId}`,
      rest,
      options,
    );
  }

  /**
   * POST /workflows/cancel/{runId}
   *
   * Requests cancellation of an in-progress workflow run.
   */
  async cancel(
    runId: string,
    params?: { reason?: string },
    options?: RequestOptions,
  ): Promise<CancelResponse> {
    return this._post<CancelResponse>(
      `/workflows/cancel/${runId}`,
      params ?? {},
      options,
    );
  }

  /**
   * GET /workflows/listen/{runId} — SSE stream
   *
   * Opens a Server-Sent Events stream for real-time execution events of
   * an in-progress workflow run. Yields typed `WorkflowSSEEvent` values.
   */
  listen(runId: string, options?: RequestOptions): AsyncGenerator<WorkflowSSEEvent> {
    return this.streamSSE(
      `/workflows/listen/${runId}`,
      options,
    ) as AsyncGenerator<WorkflowSSEEvent>;
  }
}
