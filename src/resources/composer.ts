/**
 * Composer resource — AI-driven workflow builder chat endpoints.
 * @module resources/composer
 */

import { BaseResource } from '../base';
import type { RequestOptions } from '../types';
import type {
  ComposerChatParams,
  ComposerChatResponse,
  ComposerChatDetailResponse,
  ComposerListParams,
  ComposerChatListResponse,
  ComposerDeleteParams,
  ComposerStatusResponse,
  ComposerSaveParams,
  ComposerSaveResponse,
  ComposerRevertResponse,
  ComposerResumeParams,
  ComposerResumeResponse,
  ComposerFocusParams,
  ComposerFocusResponse,
  ComposerSSEEvent,
  ComposerDeleteResponse,
  ComposerCancelResponse,
} from '../types';

/**
 * Provides methods for the `/composer` API endpoints.
 */
export class Composer extends BaseResource {
  /**
   * POST /composer/chat
   *
   * Starts a new Composer chat or sends a message to an existing session.
   * Returns a run ID that can be used to listen to the SSE stream.
   *
   * Errors: 409 if the chat has a pending HITL question (answer it via
   * `resume()` first); 402/403/429 for billing/limit gates.
   */
  async chat(
    params: ComposerChatParams,
    options?: RequestOptions,
  ): Promise<ComposerChatResponse> {
    return this._post<ComposerChatResponse>('/composer/chat', params, options);
  }

  /**
   * GET /composer/chats
   *
   * Lists the current user's Composer chats, newest first, with cursor
   * pagination (`next_cursor` is an ISO `updated_at` timestamp).
   */
  async list(
    params?: ComposerListParams,
    options?: RequestOptions,
  ): Promise<ComposerChatListResponse> {
    return this._get<ComposerChatListResponse>('/composer/chats', {
      ...options,
      params: {
        ...options?.params,
        limit: params?.limit,
        cursor: params?.cursor,
      },
    });
  }

  /**
   * GET /composer/chat/{composerChatId}
   *
   * Returns a Composer chat session with its messages, touched workflows, and
   * any open HITL question (`pending_user_input_request`).
   */
  async get(
    composerChatId: string,
    options?: RequestOptions,
  ): Promise<ComposerChatDetailResponse> {
    return this._get<ComposerChatDetailResponse>(
      `/composer/chat/${composerChatId}`,
      options,
    );
  }

  /**
   * GET /composer/chat/{composerChatId}/listen/{runId} — SSE
   *
   * Opens a Server-Sent Events stream for real-time Composer output. This is a
   * data-only stream: each yielded value is a {@link ComposerSSEEvent}
   * discriminated on `type`. A `user_input_request` frame signals a HITL pause —
   * answer it with `resume()`.
   *
   * A 404 on connect throws `NotFoundError` before any event is yielded — the
   * chat/run does not exist OR is not owned by your organization (ownership
   * failures return an identical 404, not 403). The stream does NOT
   * auto-reconnect on a 404.
   */
  async *listen(
    composerChatId: string,
    runId: string,
    options?: RequestOptions,
  ): AsyncGenerator<ComposerSSEEvent> {
    for await (const frame of this.streamSSE(
      `/composer/chat/${composerChatId}/listen/${runId}`,
      options,
    )) {
      yield frame.data as unknown as ComposerSSEEvent;
    }
  }

  /**
   * POST /composer/chat/{composerChatId}/resume
   *
   * Answers an open HITL question and resumes the paused run. Returns a NEW
   * `run_id` to listen on.
   *
   * Errors: 404 (a `NotFoundError`) when the chat does not exist OR is not owned
   * by your organization (ownership failures return an identical 404, not 403);
   * 410 if the `requestId` is not pending or already consumed; 403 if the caller
   * is not the user who triggered the question. The `llm` config is required in
   * production (the backend returns 400 if omitted).
   */
  async resume(
    composerChatId: string,
    params: ComposerResumeParams,
    options?: RequestOptions,
  ): Promise<ComposerResumeResponse> {
    return this._post<ComposerResumeResponse>(
      `/composer/chat/${composerChatId}/resume`,
      params,
      options,
    );
  }

  /**
   * PATCH /composer/chat/{composerChatId}/focus
   *
   * Sets (or clears, with `workflowId: null`) the chat's focused workflow.
   */
  async focus(
    composerChatId: string,
    params: ComposerFocusParams,
    options?: RequestOptions,
  ): Promise<ComposerFocusResponse> {
    return this._patch<ComposerFocusResponse>(
      `/composer/chat/${composerChatId}/focus`,
      params,
      options,
    );
  }

  /**
   * POST /composer/chat/{composerChatId}/save
   *
   * Saves the Composer's pending workflow changes. Without `workflowId` it
   * targets the chat's focused workflow (400 if there is none). Returns a
   * `workflow_sync` payload for refreshing the canvas.
   */
  async save(
    composerChatId: string,
    params?: ComposerSaveParams,
    options?: RequestOptions,
  ): Promise<ComposerSaveResponse> {
    return this._post<ComposerSaveResponse>(
      `/composer/chat/${composerChatId}/save`,
      params,
      options,
    );
  }

  /**
   * POST /composer/chat/{composerChatId}/revert
   *
   * Reverts pending changes to the last snapshot. Without `workflowId` it
   * targets the focused workflow (400 if there is none, or if no snapshot
   * exists). Returns a `workflow_sync` payload.
   */
  async revert(
    composerChatId: string,
    params?: ComposerSaveParams,
    options?: RequestOptions,
  ): Promise<ComposerRevertResponse> {
    return this._post<ComposerRevertResponse>(
      `/composer/chat/${composerChatId}/revert`,
      params,
      options,
    );
  }

  /**
   * DELETE /composer/chat/{composerChatId}
   *
   * Deletes a Composer chat session. Pass `permanent: true` for a hard delete
   * (default is a soft delete). `permanent` is sent as a query parameter.
   */
  async delete(
    composerChatId: string,
    params?: ComposerDeleteParams,
    options?: RequestOptions,
  ): Promise<ComposerDeleteResponse> {
    return this._delete<ComposerDeleteResponse>(
      `/composer/chat/${composerChatId}`,
      undefined,
      {
        ...options,
        params: { ...options?.params, permanent: params?.permanent },
      },
    );
  }

  /**
   * GET /composer/chat/{composerChatId}/status
   *
   * Returns the real-time status of a Composer chat session, including HITL
   * pause state (`awaiting_input` / `pending_request_id`).
   */
  async status(
    composerChatId: string,
    options?: RequestOptions,
  ): Promise<ComposerStatusResponse> {
    return this._get<ComposerStatusResponse>(
      `/composer/chat/${composerChatId}/status`,
      options,
    );
  }

  /**
   * POST /composer/chat/{composerChatId}/cancel
   *
   * Cancels the in-progress run for a Composer chat session.
   *
   * Throws `NotFoundError` on HTTP 404 — the chat does not exist OR is not owned
   * by your organization (ownership failures return an identical 404, not 403,
   * so there is no existence leak).
   */
  async cancel(
    composerChatId: string,
    options?: RequestOptions,
  ): Promise<ComposerCancelResponse> {
    return this._post<ComposerCancelResponse>(
      `/composer/chat/${composerChatId}/cancel`,
      undefined,
      options,
    );
  }
}
