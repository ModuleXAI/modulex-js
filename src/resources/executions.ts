/**
 * Executions resource — ephemeral workflow execution control under `/workflows`
 * (run, state, resume, cancel, listen).
 *
 * For durable run history (list/get persisted runs) see the {@link WorkflowRuns}
 * resource (`client.workflowRuns`).
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
 * Provides methods for workflow execution-control endpoints under `/workflows`.
 */
export class Executions extends BaseResource {
  /**
   * POST /workflows/run
   *
   * Initiates a workflow run. Supports two modes: a saved workflow (`workflowId`,
   * which requires an active deployment — the backend returns 400 otherwise) or
   * an inline ad-hoc definition (`workflow`). Returns immediately with run
   * metadata (`status` is `"running"` for streaming runs); stream events via
   * `listen()`.
   *
   * The legacy direct-LLM mode was removed; an `llm_config`-only request now
   * returns HTTP 410 — use `client.assistant.chat()` instead.
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
   *
   * Throws `NotFoundError` on HTTP 404 — the thread does not exist OR is not
   * owned by your organization. Ownership failures return an identical 404 (not
   * 403) by design, so there is no existence leak.
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
   *
   * Guard responses: 400 (missing `resumeValue` or `runId`); 404 — a
   * `NotFoundError` — when there is no checkpoint for the thread OR the
   * run/thread is not owned by your organization. Ownership failures return an
   * identical 404 (not 403) by design, so there is no existence leak.
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
   * Requests cancellation of an in-progress workflow run. On success the
   * response `status` is `"cancellation_requested"`.
   *
   * Guard responses: 404 — a `NotFoundError` — when the run is unknown OR is not
   * owned by your organization (ownership failures return an identical 404, not
   * 403, by design, so there is no existence leak); 400 (the run is not in a
   * `running`/`interrupted` state).
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
   * Opens a Server-Sent Events stream for real-time execution events of an
   * in-progress workflow run. This is a data-only stream: each yielded value is
   * a {@link WorkflowSSEEvent} discriminated on its `type` field (`metadata`,
   * `node_started`, `node_update`, `interrupt`, `resumed`, `done`, `cancelled`,
   * `error`). The stream ends after a `done` or `error` event.
   *
   * A 404 on connect throws `NotFoundError` before any event is yielded — the
   * run does not exist OR is not owned by your organization (ownership failures
   * return an identical 404, not 403). The stream does NOT auto-reconnect on a
   * 404.
   */
  async *listen(
    runId: string,
    options?: RequestOptions,
  ): AsyncGenerator<WorkflowSSEEvent> {
    for await (const frame of this.streamSSE(`/workflows/listen/${runId}`, options)) {
      yield frame.data as unknown as WorkflowSSEEvent;
    }
  }
}
