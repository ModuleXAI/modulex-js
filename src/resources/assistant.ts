/**
 * Assistant resource — a chat agent with HITL support under `/assistant`.
 *
 * Structurally similar to {@link Composer} but NOT bound to any workflow
 * (no save/revert/focus). Shares the HITL union types in `types/hitl`.
 * @module resources/assistant
 */

import { BaseResource } from '../base';
import type { RequestOptions } from '../types';
import type {
  AssistantChatParams,
  AssistantChatResponse,
  AssistantChatDetailResponse,
  AssistantListParams,
  AssistantChatListResponse,
  AssistantStatusResponse,
  AssistantResumeParams,
  AssistantResumeResponse,
  AssistantDeleteParams,
  AssistantDeleteResponse,
  AssistantCancelResponse,
  AssistantSSEEvent,
} from '../types';

/**
 * Provides methods for the `/assistant` API endpoints.
 */
export class Assistant extends BaseResource {
  /**
   * POST /assistant/chat
   *
   * Starts a new Assistant chat or sends a message to an existing one. Returns
   * a run ID to listen on.
   *
   * Errors: 409 if the chat has a pending HITL question or a run is already in
   * progress (answer via `resume()` / `cancel()` first); 402/403/429 at the
   * billing gate.
   */
  async chat(
    params: AssistantChatParams,
    options?: RequestOptions,
  ): Promise<AssistantChatResponse> {
    return this._post<AssistantChatResponse>('/assistant/chat', params, options);
  }

  /**
   * GET /assistant/chats
   *
   * Lists the current user's Assistant chats, newest first, with cursor
   * pagination (`next_cursor` is an ISO `updated_at` timestamp).
   */
  async list(
    params?: AssistantListParams,
    options?: RequestOptions,
  ): Promise<AssistantChatListResponse> {
    return this._get<AssistantChatListResponse>('/assistant/chats', {
      ...options,
      params: {
        ...options?.params,
        limit: params?.limit,
        cursor: params?.cursor,
      },
    });
  }

  /**
   * GET /assistant/chat/{chatId}
   *
   * Returns an Assistant chat with its messages and any open HITL question
   * (`pending_user_input_request`).
   */
  async get(
    chatId: string,
    options?: RequestOptions,
  ): Promise<AssistantChatDetailResponse> {
    return this._get<AssistantChatDetailResponse>(`/assistant/chat/${chatId}`, options);
  }

  /**
   * GET /assistant/chat/{chatId}/listen/{runId} — SSE
   *
   * Opens a Server-Sent Events stream for real-time Assistant output. This is a
   * data-only stream: each yielded value is an {@link AssistantSSEEvent}
   * discriminated on `type`. A `user_input_request` frame signals a HITL pause —
   * answer it with `resume()`.
   *
   * A 404 on connect throws `NotFoundError` before any event is yielded — the
   * chat/run does not exist OR is not owned by your organization (ownership
   * failures return an identical 404, not 403). The stream does NOT
   * auto-reconnect on a 404.
   */
  async *listen(
    chatId: string,
    runId: string,
    options?: RequestOptions,
  ): AsyncGenerator<AssistantSSEEvent> {
    for await (const frame of this.streamSSE(
      `/assistant/chat/${chatId}/listen/${runId}`,
      options,
    )) {
      yield frame.data as unknown as AssistantSSEEvent;
    }
  }

  /**
   * POST /assistant/chat/{chatId}/resume
   *
   * Answers an open HITL question and resumes the paused run. Returns a NEW
   * `run_id` to listen on.
   *
   * Errors: 404 (a `NotFoundError`) when the chat is not found OR is not owned by
   * your organization (ownership failures return an identical 404, not 403); 410
   * if the question was already answered or cancelled; 403 if the caller is not
   * the user who triggered it. `llm` is required (400 if omitted).
   */
  async resume(
    chatId: string,
    params: AssistantResumeParams,
    options?: RequestOptions,
  ): Promise<AssistantResumeResponse> {
    return this._post<AssistantResumeResponse>(
      `/assistant/chat/${chatId}/resume`,
      params,
      options,
    );
  }

  /**
   * GET /assistant/chat/{chatId}/status
   *
   * Returns real-time status including HITL pause state (`awaiting_input` /
   * `pending_request_id`).
   */
  async status(
    chatId: string,
    options?: RequestOptions,
  ): Promise<AssistantStatusResponse> {
    return this._get<AssistantStatusResponse>(`/assistant/chat/${chatId}/status`, options);
  }

  /**
   * POST /assistant/chat/{chatId}/cancel
   *
   * Cancels the in-progress run and clears any pending HITL question. The
   * returned `run_id` is the run that was cancelled. Errors: 404 (a
   * `NotFoundError`) when the chat is not found OR is not owned by your
   * organization (ownership failures return an identical 404, not 403); 400 if
   * there is no active execution.
   */
  async cancel(
    chatId: string,
    options?: RequestOptions,
  ): Promise<AssistantCancelResponse> {
    return this._post<AssistantCancelResponse>(
      `/assistant/chat/${chatId}/cancel`,
      undefined,
      options,
    );
  }

  /**
   * DELETE /assistant/chat/{chatId}
   *
   * Deletes an Assistant chat. Pass `permanent: true` for a hard delete
   * (default is a soft delete).
   */
  async delete(
    chatId: string,
    params?: AssistantDeleteParams,
    options?: RequestOptions,
  ): Promise<AssistantDeleteResponse> {
    return this._delete<AssistantDeleteResponse>(`/assistant/chat/${chatId}`, undefined, {
      ...options,
      params: {
        ...options?.params,
        permanent: params?.permanent,
      },
    });
  }
}
