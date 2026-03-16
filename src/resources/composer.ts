/**
 * Composer resource — AI-driven workflow builder chat endpoints.
 * @module resources/composer
 */

import { BaseResource } from '../base';
import type { SSEEvent } from '../streaming';
import type { RequestOptions } from '../types';
import type {
  ComposerChatParams,
  ComposerChatResponse,
  ComposerChatDetailResponse,
  ComposerHistoryParams,
  ComposerDeleteParams,
  ComposerStatusResponse,
  SuccessResponse,
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
   */
  async chat(
    params: ComposerChatParams,
    options?: RequestOptions,
  ): Promise<ComposerChatResponse> {
    return this._post<ComposerChatResponse>('/composer/chat', params, options);
  }

  /**
   * GET /composer/chat/{composerChatId}
   *
   * Returns a Composer chat session with its messages and workflow snapshot status.
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
   * Opens a Server-Sent Events stream for real-time Composer output during a run.
   */
  listen(
    composerChatId: string,
    runId: string,
    options?: RequestOptions,
  ): AsyncGenerator<SSEEvent> {
    return this.streamSSE(
      `/composer/chat/${composerChatId}/listen/${runId}`,
      options,
    );
  }

  /**
   * POST /composer/chat/{composerChatId}/save
   *
   * Saves the Composer's current workflow changes to the associated workflow.
   */
  async save(
    composerChatId: string,
    options?: RequestOptions,
  ): Promise<SuccessResponse> {
    return this._post<SuccessResponse>(
      `/composer/chat/${composerChatId}/save`,
      undefined,
      options,
    );
  }

  /**
   * POST /composer/chat/{composerChatId}/revert
   *
   * Reverts the Composer's pending changes, restoring the last saved state.
   */
  async revert(
    composerChatId: string,
    options?: RequestOptions,
  ): Promise<SuccessResponse> {
    return this._post<SuccessResponse>(
      `/composer/chat/${composerChatId}/revert`,
      undefined,
      options,
    );
  }

  /**
   * GET /composer/chat/workflow/{workflowId}/history
   *
   * Returns the Composer chat history associated with a workflow.
   */
  async history(
    workflowId: string,
    params?: ComposerHistoryParams,
    options?: RequestOptions,
  ): Promise<Record<string, unknown>> {
    return this._get<Record<string, unknown>>(
      `/composer/chat/workflow/${workflowId}/history`,
      {
        ...options,
        params: {
          ...options?.params,
          limit: params?.limit,
        },
      },
    );
  }

  /**
   * DELETE /composer/chat/{composerChatId}
   *
   * Deletes a Composer chat session. Pass `permanent: true` to also delete
   * the associated workflow.
   */
  async delete(
    composerChatId: string,
    params?: ComposerDeleteParams,
    options?: RequestOptions,
  ): Promise<SuccessResponse> {
    return this._delete<SuccessResponse>(
      `/composer/chat/${composerChatId}`,
      params,
      options,
    );
  }

  /**
   * GET /composer/chat/{composerChatId}/status
   *
   * Returns the real-time status of a Composer chat session.
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
   */
  async cancel(
    composerChatId: string,
    options?: RequestOptions,
  ): Promise<SuccessResponse> {
    return this._post<SuccessResponse>(
      `/composer/chat/${composerChatId}/cancel`,
      undefined,
      options,
    );
  }
}
