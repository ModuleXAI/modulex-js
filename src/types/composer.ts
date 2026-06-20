/**
 * Types for the AI Composer — a chat-driven workflow builder.
 * @module types/composer
 */

import type { LLMConfig } from './workflows';
import type { UserInputRequest, UserInputResponse } from './hitl';

// ---------------------------------------------------------------------------
// Chat params & responses
// ---------------------------------------------------------------------------

/**
 * Parameters for starting a new Composer chat or sending a message to an existing one.
 */
export interface ComposerChatParams {
  /** ID of an existing saved workflow to attach to this Composer session. */
  workflowId?: string;
  /** ID of an existing Composer chat to continue. Omit to start a new session. */
  composerChatId?: string;
  /** The user's message to the Composer AI (required). */
  message: string;
  /** Override the LLM. Defaults to the organization's configured composer LLM. */
  llm?: LLMConfig;
}

/**
 * Response from starting or continuing a Composer chat session.
 *
 * Note: `POST /composer/chat` returns 409 if the chat has a pending HITL
 * question — answer it via `resume()` before sending a new message.
 */
export interface ComposerChatResponse {
  status: string;
  composer_chat_id: string;
  workflow_id: string | null;
  run_id: string;
  thread_id: string;
  /** URL to an SSE stream for real-time Composer output. */
  stream_url: string;
}

/**
 * A single message within a Composer chat conversation.
 */
export interface ComposerMessageResponse {
  id: string;
  /** Persisted roles are `human`/`ai`; `system` may appear for system entries. */
  role: 'human' | 'ai' | 'system';
  content: string;
  /** The agent's reasoning trace, when present. */
  thinking?: string | null;
  /** Workflow changes produced by this message, when present. */
  workflow_changes?: Record<string, unknown> | null;
  /** The run that produced this message, when applicable. */
  run_id?: string | null;
  /** Running status of this message, when applicable. */
  running_status?: string | null;
  created_at: string;
}

/**
 * Full Composer chat detail including messages and live HITL state.
 */
export interface ComposerChatDetailResponse {
  id: string;
  workflow_id: string | null;
  title: string;
  messages: ComposerMessageResponse[];
  /** The currently-running run ID, or null when idle. */
  running_id: string | null;
  /** IDs of every workflow this chat has touched. */
  touched_workflow_ids: string[];
  /** The open HITL question awaiting an answer, rehydrated, or null. */
  pending_user_input_request: UserInputRequest | null;
  /** Whether the AI has produced changes not yet saved to the workflow. */
  has_pending_changes: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Real-time status of a Composer chat session.
 */
export interface ComposerStatusResponse {
  composer_chat_id: string;
  workflow_id: string | null;
  is_running: boolean;
  running_id: string | null;
  has_pending_changes: boolean;
  /** True when the run is paused on a HITL question (do NOT re-attach SSE). */
  awaiting_input: boolean;
  /** The pending HITL request id when `awaiting_input`, else null. */
  pending_request_id: string | null;
  /** The Redis status payload for the latest run, or null. */
  run_status: Record<string, unknown> | null;
}

// ---------------------------------------------------------------------------
// Save / revert
// ---------------------------------------------------------------------------

/** Canvas-sync payload returned by save/revert so the client can refresh state. */
export interface ComposerWorkflowSync {
  workflow_id: string;
  edit_version: number;
  workflow: {
    nodes: unknown[];
    edges: unknown[];
    metadata: Record<string, unknown>;
    state_schema: Record<string, unknown>;
  };
  input: Record<string, unknown> | null;
}

/** Optional targeting body for save/revert (defaults to the chat's focused workflow). */
export interface ComposerSaveParams {
  /** Target a specific touched workflow instead of the focused one. */
  workflowId?: string;
}

/** Response from saving Composer changes. */
export interface ComposerSaveResponse {
  status: 'saved';
  workflow_id: string;
  workflow_name: string;
  message: string;
  workflow_sync: ComposerWorkflowSync | null;
}

/** Response from reverting Composer changes. */
export interface ComposerRevertResponse {
  status: 'reverted';
  workflow_id: string;
  workflow_name: string;
  message: string;
  workflow_sync: ComposerWorkflowSync | null;
}

// ---------------------------------------------------------------------------
// Resume (HITL)
// ---------------------------------------------------------------------------

/**
 * Body for `POST /composer/chat/{id}/resume` — answers an open HITL question.
 */
export interface ComposerResumeParams {
  /** The `request_id` of the open question (from the `user_input_request` event). */
  requestId: string;
  /** The structured answer (discriminated on `kind`). */
  response: UserInputResponse;
  /**
   * LLM config used to rebuild the chat model on resume. Optional in the wire
   * schema, but required in production — the backend returns 400 if omitted.
   */
  llm?: LLMConfig;
}

/** Response from resuming a paused Composer run. */
export interface ComposerResumeResponse {
  status: 'resuming';
  composer_chat_id: string;
  /** A NEW run_id for the resumed execution. */
  run_id: string;
  thread_id: string;
  stream_url: string;
}

// ---------------------------------------------------------------------------
// Focus (Track B)
// ---------------------------------------------------------------------------

/** Body for `PATCH /composer/chat/{id}/focus`. `null` clears the focus. */
export interface ComposerFocusParams {
  /** The workflow to focus, or `null` to clear. The key must be present. */
  workflowId: string | null;
}

/** Response from changing a chat's focused workflow. */
export interface ComposerFocusResponse {
  composer_chat_id: string;
  workflow_id: string | null;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// List (user-scoped, cursor-paginated)
// ---------------------------------------------------------------------------

/** Query parameters for listing the user's Composer chats. */
export interface ComposerListParams {
  /** Page size, 1–100 (default 20). */
  limit?: number;
  /** ISO `updated_at` timestamp cursor for the next page. */
  cursor?: string;
}

/** A row in the user's Composer chat list. */
export interface ComposerChatListItem {
  id: string;
  workflow_id: string | null;
  title: string;
  created_at: string;
  updated_at: string;
  is_running: boolean;
}

/** Cursor-paginated list of the user's Composer chats. */
export interface ComposerChatListResponse {
  items: ComposerChatListItem[];
  next_cursor: string | null;
}

// ---------------------------------------------------------------------------
// Delete params
// ---------------------------------------------------------------------------

/**
 * Parameters for deleting a Composer chat session.
 */
export interface ComposerDeleteParams {
  /** If `true`, also permanently delete the associated workflow. */
  permanent?: boolean;
}

/** Response from deleting a Composer chat session. */
export interface ComposerDeleteResponse {
  status: 'deleted';
  composer_chat_id: string;
  permanent: boolean;
}

/** Response from cancelling a Composer chat's in-progress run. */
export interface ComposerCancelResponse {
  status: 'cancelled';
  composer_chat_id: string;
  run_id: string;
}

// ---------------------------------------------------------------------------
// Listen (SSE) events
// ---------------------------------------------------------------------------

/**
 * A Composer SSE frame. This is a data-only stream; discriminate on `type`.
 * The `user_input_request` frame carries the open HITL question — answer it
 * with `composer.resume()`.
 */
export type ComposerSSEEvent =
  | ({ type: 'metadata' } & Record<string, unknown>)
  | ({ type: 'tool_call' } & Record<string, unknown>)
  | ({ type: 'tool_result' } & Record<string, unknown>)
  | ({ type: 'workflow_change' } & Record<string, unknown>)
  | ({ type: 'response_chunk' } & Record<string, unknown>)
  | ({ type: 'subagent_start' } & Record<string, unknown>)
  | { type: 'user_input_request'; data: UserInputRequest }
  | ({ type: 'workflow_sync' } & Record<string, unknown>)
  | ({ type: 'cancelled' } & Record<string, unknown>)
  | ({ type: 'done' } & Record<string, unknown>)
  | ({ type: 'error' } & Record<string, unknown>);
