/**
 * Types for the AI Composer — a chat-driven workflow builder.
 * @module types/composer
 */

import type { LLMConfig } from './workflows';

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
  /** The user's message to the Composer AI. */
  message: string;
  /** Override the LLM used by the Composer AI. */
  llm?: LLMConfig;
}

/**
 * Response from starting or continuing a Composer chat session.
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
  role: 'human' | 'ai' | 'system';
  content: string;
  created_at: string;
}

/**
 * Full Composer chat detail including messages and workflow snapshot status.
 */
export interface ComposerChatDetailResponse {
  id: string;
  workflow_id: string | null;
  messages: ComposerMessageResponse[];
  /** Whether there is a saved workflow snapshot associated with this chat. */
  snapshot_status: string | null;
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
  /** Status of the most recent run attached to this Composer session. */
  run_status: string | null;
}

// ---------------------------------------------------------------------------
// List / delete params
// ---------------------------------------------------------------------------

/**
 * Query parameters for listing Composer chat history.
 */
export interface ComposerHistoryParams {
  limit?: number;
}

/**
 * Parameters for deleting a Composer chat session.
 */
export interface ComposerDeleteParams {
  /** If `true`, also permanently delete the associated workflow. */
  permanent?: boolean;
}
