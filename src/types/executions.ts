/**
 * Types for workflow execution — running, resuming, cancelling, and streaming.
 * @module types/executions
 */

import type { WorkflowDefinition } from './workflows';

// ---------------------------------------------------------------------------
// Run params & response
// ---------------------------------------------------------------------------

/**
 * Parameters for triggering a workflow run.
 *
 * Two run modes are supported:
 * - `workflowId` — run a previously saved workflow (requires an active deployment;
 *   the backend returns 400 if the workflow has not been deployed).
 * - `workflow` — run an inline, ad-hoc definition without saving it.
 *
 * The legacy `llm`-only and `systemWorkflow` modes were removed from the backend
 * (the run endpoint now returns HTTP 410 for an `llm_config`-only request — use
 * `client.assistant.chat()` instead).
 */
export interface WorkflowRunParams {
  /** ID of a previously saved workflow to run. Mutually exclusive with `workflow`. Requires an active deployment. */
  workflowId?: string;
  /** An inline workflow definition to run without saving. Mutually exclusive with `workflowId`. */
  workflow?: WorkflowDefinition;
  /** For ad-hoc (inline) runs, the saved workflow to attribute this run to in run history. */
  attributionWorkflowId?: string;
  /** State input values passed to the workflow's entry node. */
  input?: Record<string, unknown>;
  /**
   * Runtime config overrides for this execution. Recognised keys include
   * `thread_id`, `recursion_limit`, and `batch_interval_ms`.
   */
  config?: Record<string, unknown>;
  /** Whether to open an SSE stream for real-time events. */
  stream?: boolean;
  /** If `true`, the run is not persisted and no thread is created. */
  ephemeral?: boolean;
  /** If `true`, the run and its messages are only visible to the creator. */
  isPrivate?: boolean;
}

/**
 * A persisted workflow message envelope (human or AI message) returned inline
 * by a synchronous run.
 */
export interface WorkflowMessageEnvelope {
  id: string;
  chat_id: string | null;
  role: string;
  content: unknown;
  workflow: Record<string, unknown> | null;
  run_id: string;
  running_status: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

/**
 * Response from initiating a workflow run.
 */
export interface WorkflowRunResponse {
  /**
   * The status of the synchronous portion. For a streaming/async run this is
   * always `"running"`; terminal statuses are observed via `listen()` or the
   * run-history endpoints, not here.
   */
  status: string;
  run_id: string;
  thread_id: string;
  chat_id: string | null;
  ephemeral: boolean;
  stream: boolean;
  workflow_name: string;
  workflow_version: string;
  /** Origin of the executed definition: `"database"`, `"request"`, or `"system:<name>"`. */
  workflow_source: 'database' | 'request' | `system:${string}`;
  /** Wall-clock duration of the synchronous portion in milliseconds. */
  elapsed_ms: number;
  human_message?: WorkflowMessageEnvelope | null;
  ai_message?: WorkflowMessageEnvelope | null;
  message: string;
}

// ---------------------------------------------------------------------------
// Workflow state
// ---------------------------------------------------------------------------

/**
 * The persisted state snapshot of a workflow thread at a given checkpoint.
 */
export interface WorkflowStateResponse {
  thread_id: string;
  /** The originating run ID, read from checkpoint metadata — may be null. */
  run_id: string | null;
  checkpoint_id: string;
  /** The full LangGraph state object. */
  state: Record<string, unknown>;
  /** Node IDs scheduled to execute next. */
  next: string[];
  /** LangGraph metadata blob. */
  metadata: Record<string, unknown>;
  /** Count of pending writes not yet flushed to the checkpoint store. */
  pending_writes: number;
}

// ---------------------------------------------------------------------------
// Resume params & response
// ---------------------------------------------------------------------------

/**
 * Parameters for resuming a workflow that is waiting at an interrupt node.
 */
export interface WorkflowResumeParams {
  /** The thread ID to resume (required — used as path parameter). */
  threadId: string;
  /** ID of the saved workflow. Required unless `workflow` is provided. */
  workflowId?: string;
  /** Inline workflow definition to resume. */
  workflow?: WorkflowDefinition;
  /** The value to inject at the interrupt point (required). */
  resumeValue: unknown;
  /** The run ID to resume (required). */
  runId: string;
  /** Whether to open an SSE stream for the resumed execution. */
  stream?: boolean;
}

/**
 * Response from resuming an interrupted workflow run.
 */
export interface WorkflowResumeResponse {
  status: string;
  run_id: string;
  thread_id: string;
  stream: boolean;
  workflow_source: 'database' | 'request' | `system:${string}`;
  message: string;
}

// ---------------------------------------------------------------------------
// Cancel response
// ---------------------------------------------------------------------------

/**
 * Response from cancelling an in-progress workflow run.
 */
export interface CancelResponse {
  /** The backend returns the literal `"cancellation_requested"` on success. */
  status: 'cancellation_requested' | string;
  run_id: string;
  reason: string;
  message: string;
}

// ---------------------------------------------------------------------------
// SSE event data shapes
//
// IMPORTANT: workflow execution streams are data-only (no `event:` line); the
// discriminant lives in `data.type`. The backend is also inconsistent about
// envelopes: metadata/interrupt/resumed/done/cancelled are WRAPPED
// (`{ type, data: {...} }`), while node_started/node_update/error are FLAT
// (`{ type, ...fields }`). The union below models both shapes exactly.
// ---------------------------------------------------------------------------

/** Payload of a `metadata` event (wrapped under `data`). */
export interface MetadataEventData {
  run_id: string;
  thread_id: string;
  workflow_name: string;
  workflow_version: string;
  /** `"llm"` (token-streaming) or `"workflow"`. */
  workflow_type: string;
  timestamp: string;
}

/** Payload of a `node_started` event (flat — fields sit alongside `type`). */
export interface NodeStartedEventData {
  /** The node ID. */
  node: string;
  /** The node display name. */
  name: string;
  timestamp: string;
  /** Node-specific start metadata (shape varies by node type). */
  metadata?: Record<string, unknown>;
}

/** Payload of a `node_update` event (flat — fields sit alongside `type`). */
export interface NodeUpdateEventData {
  /** The node ID. */
  node: string;
  /** The node display name. */
  name: string;
  timestamp: string;
  /** Node output (shape varies by node type). */
  output?: Record<string, unknown>;
}

/** Payload of an `interrupt` event (wrapped under `data`). */
export interface InterruptEventData {
  message: string;
  /** Structured interrupt payload, if any. */
  data: Record<string, unknown>;
  /** JSON Schema describing the expected resume value, when provided. */
  resume_schema?: Record<string, unknown>;
  /** Example resume values, when provided. */
  examples?: unknown;
}

/** Payload of a `resumed` event (wrapped under `data`). */
export interface ResumedEventData {
  run_id: string;
  thread_id: string;
  resume_value: unknown;
  timestamp: string;
}

/** Payload of a `done` event (wrapped under `data`). */
export interface DoneEventData {
  message: string;
}

/** Payload of an `error` event (flat — fields sit alongside `type`). */
export interface ErrorEventData {
  message: string;
  error_type?: string;
}

// ---------------------------------------------------------------------------
// Discriminated union SSE event
// ---------------------------------------------------------------------------

/**
 * A type-safe discriminated union of every SSE frame emitted during a workflow
 * run or resume stream. Discriminate on the `type` field (NOT `event`, which is
 * always `"message"` for these data-only streams):
 *
 * ```ts
 * for await (const evt of client.executions.listen(runId)) {
 *   switch (evt.type) {
 *     case 'node_update': console.log(evt.node, evt.output); break; // flat
 *     case 'done':        console.log(evt.data.message);           break; // wrapped
 *     case 'error':       console.error(evt.message);              break; // flat
 *   }
 * }
 * ```
 */
export type WorkflowSSEEvent =
  | ({ type: 'metadata' } & { data: MetadataEventData })
  | ({ type: 'node_started' } & NodeStartedEventData)
  | ({ type: 'node_update' } & NodeUpdateEventData)
  | ({ type: 'interrupt' } & { data: InterruptEventData })
  | ({ type: 'resumed' } & { data: ResumedEventData })
  | ({ type: 'done' } & { data: DoneEventData })
  | ({ type: 'cancelled' } & { data: Record<string, unknown> | null })
  | ({ type: 'error' } & ErrorEventData);
