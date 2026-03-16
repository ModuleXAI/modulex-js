/**
 * Types for workflow execution — running, resuming, cancelling, and streaming.
 * @module types/executions
 */

import type { LLMConfig, WorkflowDefinition } from './workflows';

// ---------------------------------------------------------------------------
// Run params & response
// ---------------------------------------------------------------------------

/**
 * Parameters for triggering a workflow run.
 */
export interface WorkflowRunParams {
  /** ID of a previously saved workflow to run. Mutually exclusive with `workflow`. */
  workflowId?: string;
  /** An inline workflow definition to run without saving. */
  workflow?: WorkflowDefinition;
  /** Override the LLM used by the run. */
  llm?: LLMConfig;
  /** Name of a system-level workflow to run (e.g. `"workflow_name"`). */
  systemWorkflow?: string;
  /** State input values passed to the workflow's entry node. */
  input?: Record<string, unknown>;
  /** Runtime config overrides for this execution. */
  config?: Record<string, unknown>;
  /** Whether to open an SSE stream for real-time events. */
  stream?: boolean;
  /** If `true`, the run is not persisted and no thread is created. */
  ephemeral?: boolean;
  /** If `true`, the run and its messages are only visible to the creator. */
  isPrivate?: boolean;
  /** Knowledge base retrieval config for this run. */
  knowledgeConfig?: Record<string, unknown>;
  organizationId?: string;
}

/**
 * Response from initiating a workflow run.
 */
export interface WorkflowRunResponse {
  /** Terminal or intermediate status (e.g. `"completed"`, `"running"`, `"interrupted"`). */
  status: string;
  run_id: string;
  thread_id: string;
  chat_id: string | null;
  ephemeral: boolean;
  stream: boolean;
  workflow_name: string;
  workflow_version: string;
  /** `"saved"` | `"inline"` | `"deployment"` */
  workflow_source: string;
  /** Wall-clock duration of the synchronous portion in milliseconds. */
  elapsed_ms: number;
  human_message?: Record<string, unknown> | null;
  ai_message?: Record<string, unknown> | null;
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
  run_id: string;
  checkpoint_id: string;
  /** The full LangGraph state object. */
  state: Record<string, unknown>;
  /** Node IDs scheduled to execute next. */
  next: string[];
  /** LangGraph metadata blob. */
  metadata: Record<string, unknown>;
  /** Number of writes pending flush to the checkpoint store. */
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
  organizationId?: string;
}

/**
 * Response from resuming an interrupted workflow run.
 */
export interface WorkflowResumeResponse {
  status: string;
  run_id: string;
  thread_id: string;
  stream: boolean;
  workflow_source: string;
  message: string;
}

// ---------------------------------------------------------------------------
// Cancel response
// ---------------------------------------------------------------------------

/**
 * Response from cancelling an in-progress workflow run.
 */
export interface CancelResponse {
  status: string;
  run_id: string;
  reason: string;
  message: string;
}

// ---------------------------------------------------------------------------
// SSE event data shapes
// ---------------------------------------------------------------------------

/**
 * Data payload for the `metadata` SSE event — emitted at the start of a run.
 */
export interface MetadataEventData {
  run_id: string;
  thread_id: string;
  workflow_name: string;
  workflow_version: string;
  /** Ordered list of node IDs in the execution plan. */
  nodes: string[];
}

/**
 * Data payload for a `node_update` SSE event — emitted as each node changes state.
 */
export interface NodeUpdateEventData {
  node_id: string;
  node_type: string;
  status: 'started' | 'completed' | 'error';
  /** Node output value (present when `status` is `"completed"`). */
  output?: unknown;
  /** Error message (present when `status` is `"error"`). */
  error?: string;
  /** How long the node took to execute, in milliseconds. */
  execution_time_ms?: number;
}

/**
 * Data payload for an `interrupt` SSE event — execution is paused for human input.
 */
export interface InterruptEventData {
  message: string;
  /** Current workflow state at the point of interruption. */
  state: Record<string, unknown>;
  /** Instructions describing what the human should supply as a resume value. */
  resume_instructions?: string;
  /** ID of the node that triggered the interrupt. */
  node_id: string;
}

/**
 * Data payload for a `resumed` SSE event — a previously interrupted run has continued.
 */
export interface ResumedEventData {
  run_id: string;
  thread_id: string;
}

/**
 * Data payload for the `done` SSE event — the workflow has finished executing.
 */
export interface DoneEventData {
  final_state: Record<string, unknown>;
  steps_executed: number;
  total_execution_time_ms: number;
}

/**
 * Data payload for an `error` SSE event — an unrecoverable error occurred.
 */
export interface ErrorEventData {
  error_message: string;
  error_type?: string;
  /** ID of the node where the error originated, if applicable. */
  node_id?: string;
  stack_trace?: string;
}

// ---------------------------------------------------------------------------
// Discriminated union SSE event
// ---------------------------------------------------------------------------

/**
 * A type-safe discriminated union of all possible SSE events emitted during
 * a workflow run or resume stream.
 *
 * Discriminate on the `event` field to narrow the `data` type:
 * ```ts
 * for await (const evt of stream) {
 *   if (evt.event === 'done') {
 *     console.log(evt.data.final_state);
 *   }
 * }
 * ```
 */
export type WorkflowSSEEvent =
  | { event: 'metadata'; data: MetadataEventData }
  | { event: 'node_update'; data: NodeUpdateEventData }
  | { event: 'interrupt'; data: InterruptEventData }
  | { event: 'resumed'; data: ResumedEventData }
  | { event: 'done'; data: DoneEventData }
  | { event: 'error'; data: ErrorEventData };
