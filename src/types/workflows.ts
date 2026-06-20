/**
 * Types for workflow definitions, nodes, edges, and builder metadata.
 * This is the largest type module — it covers the full workflow DSL used
 * across the create, update, run, and builder endpoints.
 * @module types/workflows
 */

// ---------------------------------------------------------------------------
// Metadata & config
// ---------------------------------------------------------------------------

/**
 * Human-readable metadata attached to a workflow.
 */
export interface WorkflowMetadata {
  name: string;
  description?: string;
  version?: string;
  author?: string;
  tags?: string[];
}

/**
 * Runtime configuration defaults for a workflow.
 */
export interface WorkflowConfig {
  /** Default LLM configuration used when a node does not specify one. */
  default_llm?: LLMConfig;
  /** Default list of tool definitions available to agent nodes. */
  default_tools?: ToolDefinition[];
  /** Maximum number of recursive node invocations before aborting. */
  recursion_limit?: number;
  /** Checkpointing backend identifier (e.g. `"postgres"`). */
  checkpointing?: string;
}

// ---------------------------------------------------------------------------
// State schema
// ---------------------------------------------------------------------------

/**
 * Definition of a single field in the workflow state schema.
 */
export interface StateSchemaField {
  /** JSON Schema type string (e.g. `"string"`, `"number"`, `"array"`). */
  type: string;
  description?: string;
  /** LangGraph reducer function name or expression applied to updates. */
  reducer?: string;
  required?: boolean;
  default?: unknown;
}

/**
 * The complete state schema for a workflow, keyed by field name.
 */
export interface StateSchema {
  fields: Record<string, StateSchemaField>;
}

// ---------------------------------------------------------------------------
// Node types
// ---------------------------------------------------------------------------

/**
 * All valid node type identifiers in the workflow graph.
 */
export type NodeType =
  | 'llm'
  | 'tool'
  | 'agent'
  | 'function'
  | 'conditional'
  | 'interrupt'
  | 'transformer'
  | 'guardrails'
  | 'knowledge';

// ---------------------------------------------------------------------------
// LLM & tool configuration primitives
// ---------------------------------------------------------------------------

/**
 * Identifies a specific LLM model from a provider integration.
 */
export interface LLMConfig {
  /** The name of the LLM integration (e.g. `"openai"`). */
  integration_name: string;
  /** Provider ID within the integration (e.g. `"openai"`). */
  provider_id: string;
  /** Model identifier (e.g. `"gpt-4o"`). */
  model_id: string;
  /** Sampling temperature (0–2). */
  temperature?: number;
  /** Credential ID to use when calling this model. */
  credential_id?: string;
}

/**
 * Selects a specific action from a tool integration.
 */
export interface ToolDefinition {
  /** The name of the tool integration (e.g. `"github"`). */
  integration_name: string;
  /** Action / service name within the integration. */
  service_name: string;
  /** Credential ID to use for authenticated tool calls. */
  credential_id?: string;
  /** Static defaults to merge into the tool's input parameters. */
  parameter_defaults?: Record<string, unknown>;
  /** Values that override user-supplied parameters at runtime. */
  parameter_overrides?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Retry configuration
// ---------------------------------------------------------------------------

/**
 * Retry policy applied to a node on transient failures.
 */
export interface RetryConfig {
  /** Maximum number of retry attempts. */
  max_attempts?: number;
  /** Initial wait interval in milliseconds before the first retry. */
  initial_interval?: number;
  /** Multiplier applied to the interval on each subsequent retry. */
  backoff_factor?: number;
}

// ---------------------------------------------------------------------------
// Per-node configuration shapes
// ---------------------------------------------------------------------------

/**
 * Configuration for an `llm` node — calls an LLM and stores the response.
 */
export interface LLMNodeConfig {
  llm: LLMConfig;
  /** System prompt template (supports state interpolation via `{{field}}`). */
  system_prompt?: string;
  /** User prompt template. */
  user_prompt?: string;
  /** @deprecated Use `user_prompt`. Kept as a backward-compatible alias; the backend copies it into `user_prompt`. */
  prompt_template?: string;
  /** JSON Schema describing the expected structured output format. */
  structured_output_schema?: Record<string, unknown>;
  /** When `true`, enforce strict structured-output schema validation. */
  structured_output_strict?: boolean;
}

/**
 * Configuration for a `tool` node — executes a single tool action.
 */
export interface ToolNodeConfig {
  tool: ToolDefinition;
  /** Maps state fields to tool input parameters. */
  input_mapping?: Record<string, string>;
}

/**
 * Configuration for an `agent` node — an LLM with tool-use capabilities.
 */
export interface AgentNodeConfig {
  llm: LLMConfig;
  /** Tools available to this agent. */
  tools?: ToolDefinition[];
  /** Required by the backend — an agent node without a system prompt is rejected (422). */
  system_prompt: string;
  user_prompt?: string;
  /** Maximum tool-call iterations before the agent yields. */
  max_iterations?: number;
  input_mapping?: Record<string, string>;
}

/**
 * Configuration for a `function` node — executes a registered function.
 * The backend requires `function_name`; `input_mapping` and `parameters` are
 * optional. Additional integration-specific keys pass through untransformed.
 */
export interface FunctionNodeConfig {
  /** Name of the registered function to invoke (required by the backend). */
  function_name?: string;
  /** Maps state fields to function input parameters. */
  input_mapping?: Record<string, string>;
  /** Static parameters passed to the function. */
  parameters?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * A single branch in a conditional node evaluated against runtime state.
 */
export interface ConditionalBranch {
  name: string;
  /** Boolean expression evaluated against the workflow state. */
  condition: string;
  /** Node ID to route to when the condition is truthy. */
  target: string;
}

/**
 * Loop execution configuration for a `conditional` node used as a loop.
 */
export interface LoopConfig {
  loop_id: string;
  /** `"for"` | `"foreach"` | `"while"` — how to determine iterations. */
  mode: string;
  /** Fixed iteration count for `"for"` mode. */
  iterations?: number;
  /** State field holding a dynamic iteration count for `"for"` mode. */
  iterations_ref?: string;
  /** State field containing the collection to iterate over for `"foreach"` mode. */
  collection?: string;
  /** Boolean expression used for `"while"` mode. */
  condition?: string;
  /** First node inside the loop body. */
  body_target?: string;
  /** Last node inside the loop body. */
  body_end?: string;
  /** Node to route to when the loop exits. */
  exit_target?: string;
  /** Hard upper bound on iterations to prevent infinite loops. */
  max_iterations?: number;
  /** Run `"foreach"` iterations in parallel rather than sequentially. */
  parallel?: boolean;
  /** Accumulate iteration results instead of overwriting. */
  accumulate?: boolean;
  /** State field to accumulate iteration results from/into. */
  accumulate_from?: string;
}

/**
 * Configuration for a `conditional` node — branches or loops based on state.
 */
export interface ConditionalNodeConfig {
  /** `"expression"` | `"llm"` | `"loop"` */
  condition_type: string;
  /** Named routes mapping route names to target node IDs. */
  routes?: Record<string, string>;
  /** Ordered list of conditional branches evaluated top-to-bottom. */
  expression_branches?: ConditionalBranch[];
  loop_config?: LoopConfig;
}

/**
 * Configuration for an `interrupt` node — pauses execution for human input.
 */
export interface InterruptNodeConfig {
  /** Message shown to the human reviewer. */
  message?: string;
  /** JSON Schema describing the shape of the resume value. */
  resume_schema?: Record<string, unknown>;
  /** Example resume values shown in the UI. */
  examples?: unknown[];
}

/**
 * A single data-transformation operation applied by a `transformer` node.
 */
export interface TransformerOperation {
  /** Operation type (e.g. `"set"`, `"delete"`, `"map"`, `"filter"`, `"template"`). */
  type: string;
  /** JSON Pointer or dot-notation path to the target field. */
  path?: string;
  /** Boolean expression used for conditional operations. */
  condition?: string;
  /** Jinja-style template string for `"template"` operations. */
  template?: string;
}

/**
 * Configuration for a `transformer` node — reshapes state between nodes.
 */
export interface TransformerNodeConfig {
  /** Source state field to read from. */
  source?: string;
  /** Ordered list of transformation operations. */
  operations?: TransformerOperation[];
}

/**
 * Configuration for a `guardrails` node — validates or filters content.
 * Shape is provider-specific and passed through without transformation.
 */
export interface GuardrailsNodeConfig {
  [key: string]: unknown;
}

/**
 * Configuration for a `knowledge` node — retrieves context from a knowledge base.
 */
export interface KnowledgeNodeConfig {
  credential_id?: string;
  /** Provider type identifier (e.g. `"pinecone"`, `"weaviate"`). */
  provider_type?: string;
  /** Query string or state field reference to search with. */
  query?: string;
  collection_name?: string;
  /** Number of top results to return. */
  top_k?: number;
  /** Minimum similarity score threshold (0–1). */
  min_score?: number;
  /** Provider-specific metadata filters. */
  filters?: Record<string, unknown>;
  /** Embedding model configuration used for the similarity search. */
  embedding_config?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Node & edge definitions
// ---------------------------------------------------------------------------

/**
 * A single node in the workflow graph.
 */
export interface NodeDefinition {
  /** Unique identifier for this node within the workflow. */
  id: string;
  type: NodeType;
  name: string;
  description?: string;
  /** Whether the node participates in execution. Defaults to `true`. */
  enabled?: boolean;
  /** Canvas X position. Required by the backend (create/update return 422 without it). */
  x: number;
  /** Canvas Y position. Required by the backend (create/update return 422 without it). */
  y: number;
  retry_config?: RetryConfig;
  llm_config?: LLMNodeConfig;
  tool_config?: ToolNodeConfig;
  agent_config?: AgentNodeConfig;
  function_config?: FunctionNodeConfig;
  conditional_config?: ConditionalNodeConfig;
  interrupt_config?: InterruptNodeConfig;
  transformer_config?: TransformerNodeConfig;
  guardrails_config?: GuardrailsNodeConfig;
  knowledge_config?: KnowledgeNodeConfig;
}

/**
 * A directed edge connecting two nodes in the workflow graph.
 */
export interface EdgeDefinition {
  /** ID of the source node. */
  source: string;
  /** ID of the target node. */
  target: string;
}

// ---------------------------------------------------------------------------
// Workflow definition (full schema)
// ---------------------------------------------------------------------------

/**
 * The complete, serializable definition of a workflow.
 * This is what is stored, versioned, and executed.
 */
export interface WorkflowDefinition {
  metadata: WorkflowMetadata;
  config: WorkflowConfig;
  state_schema: StateSchema;
  nodes: NodeDefinition[];
  edges: EdgeDefinition[];
  /** ID of the first node to execute. */
  entry_point: string;
}

// ---------------------------------------------------------------------------
// Workflow CRUD params
// ---------------------------------------------------------------------------

/**
 * Parameters for creating a new workflow.
 */
export interface CreateWorkflowParams {
  /** The full workflow graph definition. */
  workflowSchema: WorkflowDefinition;
  name?: string;
  description?: string;
  version?: string;
  tags?: string[];
  category?: string;
  /** Lifecycle status (e.g. `"draft"`, `"published"`). */
  status?: string;
  /** Sharing visibility (e.g. `"private"`, `"organization"`, `"public"`). */
  visibility?: string;
  /** Default input values shown in the run panel. */
  input?: Record<string, unknown>;
  /** Override config values for this workflow. */
  config?: Partial<WorkflowConfig>;
}

/**
 * Parameters for updating an existing workflow.
 * All fields are optional; only provided fields are updated.
 */
export interface UpdateWorkflowParams {
  name?: string;
  description?: string;
  version?: string;
  tags?: string[];
  category?: string;
  status?: string;
  visibility?: string;
  workflowSchema?: WorkflowDefinition;
  input?: Record<string, unknown>;
  config?: Partial<WorkflowConfig>;
}

// ---------------------------------------------------------------------------
// Workflow response shapes
// ---------------------------------------------------------------------------

/**
 * Lightweight workflow record returned in list responses.
 */
export interface WorkflowSummary {
  id: string;
  name: string;
  description: string | null;
  version: string;
  status: string;
  visibility: string;
  category: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
  /** Null for workflows with no recorded creator (e.g. system/seed workflows). */
  creator_id: string | null;
  /** Default state input payload returned on each list row. */
  input?: Record<string, unknown>;
}

/**
 * Full workflow record including the stored schema.
 */
export interface WorkflowResponse extends WorkflowSummary {
  workflow_schema: WorkflowDefinition;
  /** Execution config defaults returned by create/get/update. */
  config?: Partial<WorkflowConfig>;
  edit_version?: number;
  last_edited_by?: string | null;
  last_edited_at?: string | null;
  organization_id: string;
}

// ---------------------------------------------------------------------------
// Workflow list
// ---------------------------------------------------------------------------

/**
 * Query parameters for listing workflows.
 */
export interface WorkflowListParams {
  status?: string;
  category?: string;
  visibility?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

/**
 * Paginated list of workflow summaries.
 */
export interface WorkflowListResponse {
  workflows: WorkflowSummary[];
  total: number;
  page?: number;
  page_size?: number;
  total_pages?: number;
}

// ---------------------------------------------------------------------------
// Workflow delete
// ---------------------------------------------------------------------------

/**
 * Response from deleting a workflow.
 */
export interface DeleteWorkflowResponse {
  /** HTTP-style status string (e.g. `"deleted"`). */
  status: string;
  workflow_id: string;
  message: string;
}

// ---------------------------------------------------------------------------
// Builder / node details
// ---------------------------------------------------------------------------

/**
 * Query parameters for fetching node type and integration details from the builder.
 */
export interface BuilderDetailsParams {
  /** Filter to a specific node type. */
  nodeType?: string;
  /** Filter to a specific category. */
  category?: string;
  /** Filter to a specific integration name. */
  integrationName?: string;
}

/**
 * A rich descriptor for a single builder node type.
 */
export interface BuilderNodeTypeDescriptor {
  label?: string;
  description?: string;
  default_schema?: Record<string, unknown>;
  output_schema?: Record<string, unknown>;
  providers?: unknown[];
  integrations?: unknown[];
  [key: string]: unknown;
}

/**
 * Response from the builder details endpoint, providing the palette of
 * available node types, integration categories, and their counts.
 */
export interface BuilderDetailsResponse {
  /** Map of node type identifier to its rich descriptor. */
  node_types: Record<string, BuilderNodeTypeDescriptor>;
  /** Available integration items grouped by category. */
  categories: {
    tools: string[];
    functions: string[];
    transformers: string[];
  };
  /** Count breakdown. Known keys: integrations, functions, transformers, providers. */
  counts: {
    integrations?: number;
    functions?: number;
    transformers?: number;
    providers?: number;
    [key: string]: number | undefined;
  };
  /** Builder feature flags (e.g. array-spread support). */
  features?: {
    array_spread: boolean;
  };
  /** Whether the response was served from cache. */
  cached: boolean;
}

// ---------------------------------------------------------------------------
// Workflow changes (collaboration SSE)
// ---------------------------------------------------------------------------

/**
 * A real-time collaboration event from the `GET /workflows/{id}/changes`
 * SSE stream. This is a data-only stream; discriminate on `type`.
 */
export type WorkflowChangeEvent =
  | { type: 'connected'; workflow_id: string; edit_version: number }
  | ({ type: 'workflow_updated' } & Record<string, unknown>)
  | ({ type: 'user_joined' } & Record<string, unknown>)
  | ({ type: 'user_left' } & Record<string, unknown>);
