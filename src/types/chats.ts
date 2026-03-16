/**
 * Types for chat session management and messaging.
 * @module types/chats
 */

// ---------------------------------------------------------------------------
// Chat object
// ---------------------------------------------------------------------------

/**
 * A chat session record.
 */
export interface ChatResponse {
  id: string;
  title: string | null;
  creator_id: string;
  is_private: boolean;
  /** ID of the currently in-progress run attached to this chat, if any. */
  running_id: string | null;
  created_at: string;
  updated_at: string;
  organization_id?: string | null;
  /** Messages are included when fetching a single chat with messages embedded. */
  messages?: ChatMessageResponse[];
  deleted_at?: string | null;
}

// ---------------------------------------------------------------------------
// Chat messages
// ---------------------------------------------------------------------------

/**
 * The role of a participant in a chat message.
 */
export type ChatMessageRole = 'human' | 'ai' | 'system';

/**
 * A single message within a chat session.
 */
export interface ChatMessageResponse {
  id: string;
  chat_id: string;
  role: ChatMessageRole;
  /** Message content — can be a string, structured array, or object depending on message type. */
  content: string | unknown[] | Record<string, unknown>;
  /** Name or version of the workflow that produced an `ai` message. */
  workflow?: string | null;
  run_id?: string | null;
  /** Execution status of the run that produced this message (for `ai` messages). */
  running_status?: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Query parameters for paginating messages within a chat.
 */
export interface ChatMessagesParams {
  limit?: number;
  offset?: number;
}

/**
 * Paginated list of messages within a chat.
 */
export interface ChatMessagesResponse {
  messages: ChatMessageResponse[];
  total: number;
  limit: number;
  offset: number;
  has_next: boolean;
  /** The number of messages actually returned (may differ from `limit` on the last page). */
  actual_count: number;
}

// ---------------------------------------------------------------------------
// Chat update
// ---------------------------------------------------------------------------

/**
 * Parameters for updating a chat's metadata.
 */
export interface UpdateChatParams {
  title?: string;
  isPrivate?: boolean;
  /** Move the chat to a named folder (e.g. `"pinned"`, `"archived"`, or a custom name). */
  folder?: string;
}

// ---------------------------------------------------------------------------
// Chat list
// ---------------------------------------------------------------------------

/**
 * Grouped chat list response.
 *
 * Keys are dynamic folder names: at minimum `"chats"`, `"pinned"`, and
 * `"archived"` are present; user-created custom folders appear as additional keys.
 *
 * @example
 * ```ts
 * const list: ChatListResponse = await client.chats.list();
 * const pinned = list['pinned'] ?? [];
 * ```
 */
export type ChatListResponse = Record<string, ChatResponse[]>;

// ---------------------------------------------------------------------------
// Chat SSE events
// ---------------------------------------------------------------------------

/**
 * SSE event emitted over the chat list stream when the user's chat list changes.
 */
export interface ChatStreamEvent {
  /** Event type identifier (e.g. `"chat_created"`, `"chat_updated"`, `"chat_deleted"`). */
  event: string;
  data: ChatResponse | ChatListResponse | { chat_id: string };
}
