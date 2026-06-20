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
  /** Chat title — always present (backend `str`, non-nullable). */
  title: string;
  /** Creator user ID — nullable for system/org-owned chats. */
  creator_id: string | null;
  is_private: boolean;
  /** ID of the currently in-progress run attached to this chat, if any. */
  running_id: string | null;
  created_at: string;
  updated_at: string;
  /** Owning organization ID — always present. */
  organization_id: string;
  /** Messages are included when fetching a single chat with messages embedded. */
  messages?: ChatMessageResponse[];
  deleted_at?: string | null;
}

// ---------------------------------------------------------------------------
// Chat messages
// ---------------------------------------------------------------------------

/**
 * The role of a participant in a chat message.
 *
 * Common values are `'human'`, `'ai'`, and `'system'`, but the backend stores
 * the role as a free-form string (e.g. `'assistant'` may also appear), so any
 * string is accepted while preserving autocomplete for the common values.
 */
export type ChatMessageRole = 'human' | 'ai' | 'system' | (string & {});

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
  /** Soft-deletion timestamp, if the message has been deleted. */
  deleted_at?: string | null;
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
 *
 * Mirrors the backend `MessageListResponse`, which returns only the page of
 * messages plus the echoed `limit`/`offset`. The `limit` is nullable because
 * the backend leaves it unset when no limit was applied.
 */
export interface ChatMessagesResponse {
  messages: ChatMessageResponse[];
  limit: number | null;
  offset: number;
}

// ---------------------------------------------------------------------------
// Chat update
// ---------------------------------------------------------------------------

/**
 * Parameters for updating a chat's metadata.
 */
export interface UpdateChatParams {
  title?: string;
  is_private?: boolean;
  /** Move the chat to a named folder (e.g. `"pinned"`, `"archived"`, or a custom name). */
  folder?: string;
}

// ---------------------------------------------------------------------------
// Chat list
// ---------------------------------------------------------------------------

/**
 * A lightweight chat row as returned by the grouped list endpoint. Unlike
 * {@link ChatResponse}, list rows do NOT include `organization_id`, `messages`,
 * or `deleted_at`.
 */
export interface ChatListItem {
  id: string;
  title: string;
  /** Creator user ID — nullable for system/org-owned chats. */
  creator_id: string | null;
  is_private: boolean;
  running_id: string | null;
  created_at: string;
  updated_at: string;
}

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
export type ChatListResponse = Record<string, ChatListItem[]>;

// ---------------------------------------------------------------------------
// Chat SSE events
// ---------------------------------------------------------------------------

/**
 * Payload of the initial `connected` SSE event sent when the stream opens.
 */
export interface ChatConnectedEvent {
  status: 'connected';
  /** ISO-8601 timestamp of when the connection was established. */
  timestamp: string;
}

/**
 * Payload of a `chat_list_updated` SSE event, emitted when the user's chat list
 * changes and should be re-fetched via `GET /chats`.
 */
export interface ChatListUpdatedEvent {
  event: 'chat_list_updated';
  /**
   * Scope of the change: `"public"` affects all org users, `"private"` affects
   * only the current user.
   */
  type: 'public' | 'private';
  /** ISO-8601 timestamp of when the change occurred. */
  timestamp: string;
}

/**
 * Union of the JSON payloads carried by the chat list SSE stream
 * (`GET /chats/stream`). `: keepalive` comment lines carry no JSON payload and
 * are not represented here.
 */
export type ChatStreamEvent = ChatConnectedEvent | ChatListUpdatedEvent;
