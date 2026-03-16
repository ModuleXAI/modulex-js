/**
 * Chats resource — chat session management endpoints.
 * @module resources/chats
 */

import { BaseResource } from '../base';
import type { SSEEvent } from '../streaming';
import type { RequestOptions } from '../types';
import type {
  ChatListResponse,
  ChatResponse,
  ChatMessagesParams,
  ChatMessagesResponse,
  UpdateChatParams,
  SuccessResponse,
} from '../types';

/**
 * Provides methods for the `/chats` API endpoints.
 */
export class Chats extends BaseResource {
  /**
   * GET /chats
   *
   * Returns all chats for the current organization, grouped by folder.
   * Keys include at minimum `"chats"`, `"pinned"`, and `"archived"`.
   */
  async list(options?: RequestOptions): Promise<ChatListResponse> {
    return this._get<ChatListResponse>('/chats', options);
  }

  /**
   * GET /chats/stream — SSE
   *
   * Opens a Server-Sent Events stream for real-time chat list updates.
   * Emits `connected`, `chat_list_updated`, and `keepalive` events.
   */
  stream(options?: RequestOptions): AsyncGenerator<SSEEvent> {
    return this.streamSSE('/chats/stream', options);
  }

  /**
   * GET /chats/{chatId}
   *
   * Returns a single chat session with its embedded messages.
   */
  async get(chatId: string, options?: RequestOptions): Promise<ChatResponse> {
    return this._get<ChatResponse>(`/chats/${chatId}`, options);
  }

  /**
   * GET /chats/{chatId}/messages
   *
   * Returns paginated messages for a chat session.
   */
  async messages(
    chatId: string,
    params?: ChatMessagesParams,
    options?: RequestOptions,
  ): Promise<ChatMessagesResponse> {
    return this._get<ChatMessagesResponse>(`/chats/${chatId}/messages`, {
      ...options,
      params: {
        ...options?.params,
        limit: params?.limit,
        offset: params?.offset,
      },
    });
  }

  /**
   * PATCH /chats/{chatId}
   *
   * Updates a chat's title, privacy, or folder assignment.
   */
  async update(
    chatId: string,
    params: UpdateChatParams,
    options?: RequestOptions,
  ): Promise<ChatResponse> {
    return this._patch<ChatResponse>(`/chats/${chatId}`, params, options);
  }

  /**
   * DELETE /chats/{chatId}
   *
   * Soft-deletes a chat. Private chats can only be deleted by the creator.
   */
  async delete(chatId: string, options?: RequestOptions): Promise<SuccessResponse> {
    return this._delete<SuccessResponse>(`/chats/${chatId}`, undefined, options);
  }
}
