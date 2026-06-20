/**
 * Types for the Assistant — a chat agent with HITL, NOT bound to any workflow.
 *
 * Mirrors `/assistant` (app/api/assistant.py). Structurally similar to Composer
 * but with NO workflow fields (`workflow_id`/`snapshot_status`/`has_pending_changes`).
 * @module types/assistant
 */

import type { LLMConfig } from './workflows';
import type { UserInputRequest, UserInputResponse } from './hitl';

// ---------------------------------------------------------------------------
// Chat params & responses
// ---------------------------------------------------------------------------

/**
 * Parameters for starting a new Assistant chat or sending a message.
 */
export interface AssistantChatParams {
  /** The user's message (required; v1 is text-only). */
  message: string;
  /** ID of an existing Assistant chat to continue. Omit to start a new session. */
  chatId?: string;
  /** Override the LLM. Defaults to the organization's configured composer LLM. */
  llm?: LLMConfig;
}

/**
 * Response from starting or continuing an Assistant chat.
 *
 * Errors: 409 if the chat has a pending HITL question or a run is already in
 * progress; 402/403/429 at the billing gate.
 */
export interface AssistantChatResponse {
  status: string;
  chat_id: string;
  run_id: string;
  thread_id: string;
  /** `/assistant/chat/{chat_id}/listen/{run_id}` */
  stream_url: string;
}

/**
 * A single message within an Assistant chat.
 */
export interface AssistantMessageResponse {
  id: string;
  role: 'human' | 'ai' | 'system';
  content: string;
  /** The agent's reasoning trace, when present. */
  thinking?: string | null;
  run_id?: string | null;
  running_status?: string | null;
  created_at: string;
}

/**
 * Full Assistant chat detail including messages and any open HITL question.
 */
export interface AssistantChatDetailResponse {
  id: string;
  title: string | null;
  running_id: string | null;
  /** The open HITL question awaiting an answer, or null. */
  pending_user_input_request: UserInputRequest | null;
  messages: AssistantMessageResponse[];
  created_at: string;
  updated_at: string;
}

/**
 * Real-time status of an Assistant chat.
 */
export interface AssistantStatusResponse {
  chat_id: string;
  is_running: boolean;
  /** True when paused on a HITL question (do NOT re-attach SSE). */
  awaiting_input: boolean;
  pending_request_id: string | null;
  running_id: string | null;
  /** The Redis status payload for the latest run, or null. */
  run_status: Record<string, unknown> | null;
}

// ---------------------------------------------------------------------------
// Resume (HITL)
// ---------------------------------------------------------------------------

/**
 * Body for `POST /assistant/chat/{id}/resume` — answers an open HITL question.
 */
export interface AssistantResumeParams {
  /** The `request_id` of the open question (from the `user_input_request` event). */
  requestId: string;
  /** The structured answer (discriminated on `kind`). */
  response: UserInputResponse;
  /** LLM config to rebuild the chat model. Required by this endpoint (400 if omitted). */
  llm: LLMConfig;
}

/** Response from resuming a paused Assistant run. */
export interface AssistantResumeResponse {
  status: 'resuming';
  chat_id: string;
  /** A NEW run_id for the resumed execution. */
  run_id: string;
  thread_id: string;
  stream_url: string;
}

// ---------------------------------------------------------------------------
// List (user-scoped, cursor-paginated)
// ---------------------------------------------------------------------------

/** Query parameters for listing the user's Assistant chats. */
export interface AssistantListParams {
  /** Page size, 1–100 (default 20). */
  limit?: number;
  /** ISO `updated_at` timestamp cursor for the next page. */
  cursor?: string;
}

/** A row in the user's Assistant chat list. */
export interface AssistantChatSummary {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  is_running: boolean;
}

/** Cursor-paginated list of the user's Assistant chats. */
export interface AssistantChatListResponse {
  items: AssistantChatSummary[];
  next_cursor: string | null;
}

// ---------------------------------------------------------------------------
// Delete / cancel
// ---------------------------------------------------------------------------

/** Parameters for deleting an Assistant chat. */
export interface AssistantDeleteParams {
  /** `false` (default) soft-deletes; `true` hard-deletes the chat. */
  permanent?: boolean;
}

/** Response from deleting an Assistant chat. */
export interface AssistantDeleteResponse {
  status: 'deleted';
  chat_id: string;
  permanent: boolean;
}

/** Response from cancelling an Assistant run. `run_id` is the cancelled run. */
export interface AssistantCancelResponse {
  status: 'cancelled';
  chat_id: string;
  run_id: string;
}

// ---------------------------------------------------------------------------
// Listen (SSE) events
// ---------------------------------------------------------------------------

/**
 * An Assistant SSE frame. Data-only stream; discriminate on `type`. The
 * `user_input_request` frame carries the open HITL question — answer it with
 * `assistant.resume()`. (No `workflow_change`/`workflow_sync` — Assistant has
 * no workflow.)
 */
export type AssistantSSEEvent =
  | ({ type: 'metadata' } & Record<string, unknown>)
  | ({ type: 'response_chunk' } & Record<string, unknown>)
  | ({ type: 'tool_call' } & Record<string, unknown>)
  | ({ type: 'tool_result' } & Record<string, unknown>)
  | { type: 'user_input_request'; data: UserInputRequest }
  | ({ type: 'run_resumed' } & Record<string, unknown>)
  | ({ type: 'guidance' } & Record<string, unknown>)
  | ({ type: 'done' } & Record<string, unknown>)
  | ({ type: 'error' } & Record<string, unknown>)
  | ({ type: 'cancelled' } & Record<string, unknown>)
  | ({ type: 'heartbeat' } & Record<string, unknown>);
