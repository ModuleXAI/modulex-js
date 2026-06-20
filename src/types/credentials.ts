/**
 * Types for credential management and MCP server connections.
 * @module types/credentials
 */

// ---------------------------------------------------------------------------
// Core credential response
// ---------------------------------------------------------------------------

/**
 * A stored credential record as returned by the API.
 */
export interface CredentialResponse {
  credential_id: string;
  integration_name: string;
  /** Integration category (e.g. `"tool"`, `"llm"`, `"knowledge"`). May be `null`. */
  integration_type: string | null;
  /** Human-readable label for the credential. */
  display_name: string;
  /** Auth mechanism used (e.g. `"api_key"`, `"oauth2"`, `"basic"`). */
  auth_type: string;
  /** Whether this is the default credential for its integration. */
  is_default: boolean;
  created_at: string | null;
  updated_at: string | null;
  last_used_at?: string | null;
  expires_at?: string | null;
  /** Arbitrary metadata associated with the credential. */
  credentials_metadata?: Record<string, unknown> | null;
}

/**
 * Detailed credential record returned by `GET /credentials/{id}`.
 * Extends {@link CredentialResponse} with ownership and masked-auth fields
 * that are only present on the single-credential detail endpoint.
 */
export interface CredentialDetailResponse extends CredentialResponse {
  /** Organization that owns the credential. */
  organization_id: string;
  /** User ID that created the credential, if known. */
  created_by: string | null;
  /** Email of the user that created the credential, if known. */
  created_by_email?: string | null;
  /**
   * Masked representation of the auth data when `include_masked=true`
   * (e.g. `"OAuth2"`, `"sk-proj12...xyz"`). `null` when not requested.
   */
  auth_data_masked?: string | null;
}

// ---------------------------------------------------------------------------
// Create / update params
// ---------------------------------------------------------------------------

/**
 * Parameters for creating a new credential.
 */
export interface CreateCredentialParams {
  /** Integration name to create the credential for (e.g. `"openai"`). */
  integrationName: string;
  /** Auth data object — shape depends on `authType` and the integration. */
  authData?: Record<string, unknown>;
  /** Auth mechanism (e.g. `"api_key"`, `"oauth2"`). */
  authType?: string;
  /** Human-readable label. Defaults to the integration display name. */
  displayName?: string;
  /** Arbitrary metadata to associate with the credential. */
  metadata?: Record<string, unknown>;
  /** Whether to set this credential as the default for its integration. */
  makeDefault?: boolean;
  /** OAuth2-specific configuration when creating via OAuth. */
  oauthConfig?: Record<string, unknown>;
  /** ISO-8601 datetime after which the credential should be considered expired. */
  expiresAt?: string;
}

/**
 * Parameters for updating an existing credential.
 */
export interface UpdateCredentialParams {
  displayName?: string;
  metadata?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// List responses
// ---------------------------------------------------------------------------

/**
 * A single integration group entry within the grouped credential list.
 */
export interface CredentialIntegrationGroup {
  integration_name: string;
  integration_type: string;
  total_count: number;
  auth_types: string[];
  credentials: CredentialResponse[];
}

/**
 * Credential list response in grouped-by-integration format.
 * Returned when no `integrationName` filter is applied.
 */
export interface CredentialListGrouped {
  integrations: Record<string, CredentialIntegrationGroup>;
  total_credentials: number;
  total_integrations: number;
  filters: Record<string, unknown>;
}

/**
 * Credential list response in flat format.
 * Returned when an `integrationName` filter is applied.
 */
export interface CredentialListFlat {
  credentials: CredentialResponse[];
  total_count: number;
  integration_name: string | null;
  filters: Record<string, unknown>;
}

/**
 * Query parameters for listing credentials.
 */
export interface CredentialListParams {
  integrationName?: string;
  authType?: string;
  limit?: number;
  offset?: number;
}

// ---------------------------------------------------------------------------
// Test endpoints
// ---------------------------------------------------------------------------

/**
 * Parameters for testing a temporary (unsaved) credential.
 */
export interface TestTemporaryParams {
  integrationName: string;
  authType: string;
  authData: Record<string, unknown>;
}

/**
 * Response from testing a temporary credential before saving it.
 */
export interface TestTemporaryResponse {
  is_valid: boolean;
  message: string;
  tested_at: string;
  test_method: string;
  integration_name: string;
  auth_type: string;
  /** Endpoint that was contacted during the test, if applicable. */
  test_endpoint?: string | null;
  /** HTTP status code returned by the test endpoint, if applicable. */
  status_code?: number | null;
  /** Relative API cost of the test call (e.g. `"free"`, `"low"`, `"medium"`). */
  cost_level?: string | null;
}

/**
 * Response from testing an existing saved credential.
 */
export interface TestCredentialResponse {
  credential_id: string;
  is_valid: boolean;
  message: string;
  tested_at: string;
}

// ---------------------------------------------------------------------------
// Usage & audit
// ---------------------------------------------------------------------------

/**
 * Query parameters for fetching credential usage statistics.
 */
export interface CredentialUsageParams {
  startDate?: string;
  endDate?: string;
}

/**
 * Usage statistics for a credential over a date range.
 */
export interface CredentialUsageResponse {
  credential_id: string;
  total_calls: number;
  successful_calls: number;
  failed_calls: number;
  /** Success rate as a fraction (0–1). */
  success_rate: number;
  /** Call counts broken down by action / operation name. */
  action_breakdown: Record<string, number>;
  start_date: string | null;
  end_date: string | null;
}

/**
 * Query parameters for paginating a credential's audit log.
 */
export interface CredentialAuditParams {
  limit?: number;
  offset?: number;
}

/**
 * A single audit log entry for a credential, as returned by
 * `GET /credentials/{id}/audit`.
 */
export interface AuditLogResponse {
  id: string;
  /** ID of the credential this entry belongs to. */
  credential_id: string;
  /** Type of event recorded (e.g. `"created"`, `"updated"`, `"used"`). */
  event_type: string;
  /** User ID that triggered the event, if known. */
  user_id: string | null;
  /** Structured details of what changed during the event. */
  changes: Record<string, unknown>;
  /** Source IP address of the request, if recorded. */
  ip_address: string | null;
  /** User-agent of the request, if recorded. */
  user_agent: string | null;
  /** ISO-8601 timestamp of when the event occurred. */
  timestamp: string;
}

// ---------------------------------------------------------------------------
// MCP server
// ---------------------------------------------------------------------------

/**
 * Parameters for connecting a Model Context Protocol (MCP) server as a credential.
 */
export interface McpServerParams {
  /** URL of the MCP server. */
  serverUrl: string;
  /** Additional HTTP headers sent to the MCP server on each request. */
  headers?: Record<string, string>;
  /** Human-readable label for this MCP server credential. */
  displayName?: string;
  /** Whether to set this as the default MCP credential. */
  makeDefault?: boolean;
}

/**
 * Response from creating a Model Context Protocol (MCP) server credential
 * via `POST /credentials/mcp-server`.
 *
 * Note: this is a narrower shape than {@link CredentialResponse} — the
 * backend `MCPServerCredentialResponse` omits `updated_at`, `integration_type`,
 * `last_used_at`, and `expires_at`.
 */
export interface MCPServerCredentialResponse {
  credential_id: string;
  integration_name: string;
  display_name: string;
  auth_type: string;
  is_default: boolean;
  created_at: string | null;
  /** Arbitrary metadata associated with the credential. */
  credentials_metadata?: Record<string, unknown> | null;
}

/**
 * Response listing tools discovered from an MCP server credential.
 */
export interface McpToolsResponse {
  credential_id: string;
  /** Array of tool descriptors in MCP schema format. */
  tools: Record<string, unknown>[];
  total_count: number;
}

/**
 * Response from refreshing the tool discovery cache for an MCP server credential.
 */
export interface RefreshDiscoveryResponse {
  credential_id: string;
  refreshed_at: string;
  /** Summary of what changed (added / removed tools). */
  changes: Record<string, unknown>;
  total_tools: number;
  success: boolean;
}

// ---------------------------------------------------------------------------
// OAuth2 flow
// ---------------------------------------------------------------------------

/**
 * Parameters for initiating an OAuth2 authorization flow via
 * `POST /credentials/oauth2/initiate`.
 *
 * Requires admin/owner role on the target organization.
 */
export interface InitiateOAuth2Params {
  /** Integration name to start the OAuth2 flow for (e.g. `"github"`). */
  integrationName: string;
  /** Whether to use ModuleX's managed OAuth app. Defaults to `true` server-side. */
  useModulexOauth?: boolean;
  /** Custom OAuth app config; required when `useModulexOauth` is `false`. */
  customOauthConfig?: Record<string, unknown>;
  /** Callback URL the provider should redirect back to after authorization. */
  redirectUri: string;
  /** Space-separated OAuth scopes to request. Defaults to the integration's scopes. */
  scope?: string;
  /** Human-readable label for the credential that will be created. */
  displayName?: string;
  /** Whether to set the resulting credential as the default for its integration. */
  makeDefault?: boolean;
  /**
   * Per-user setup environment variables to inject into the persisted
   * `auth_data`, keyed by raw env-var name.
   */
  envVarValues?: Record<string, string>;
  /** Composer chat ID to atomically resume after the callback completes. */
  composerChatId?: string;
  /** Composer interrupt request ID, validated on callback. */
  composerRequestId?: string;
  /** LLM provider config used to rebuild the chat model on composer resume. */
  composerLlmConfig?: Record<string, unknown>;
}

/**
 * Response from initiating an OAuth2 flow. The caller should redirect the
 * user's browser to `authorization_url` to complete authorization.
 */
export interface OAuth2InitiateResponse {
  /** Provider authorization URL the user must visit to grant access. */
  authorization_url: string;
  /** Opaque CSRF/state token correlated with this flow. */
  state: string;
}

// ---------------------------------------------------------------------------
// Bulk ModuleX keys — SSE event payloads
// ---------------------------------------------------------------------------

/**
 * Per-integration status entry emitted in bulk ModuleX-key SSE events.
 */
export interface ModulexKeyIntegrationStatus {
  integration_name: string;
  integration_type: string;
  display_name: string;
  /** Whether a ModuleX-managed key credential already exists for this integration. */
  has_modulex_key_credential: boolean;
}

/**
 * Summary counts emitted in the terminal (`completed`) bulk ModuleX-key event.
 */
export interface ModulexKeyBulkSummary {
  total: number;
  created: number;
  already_existed: number;
}

/**
 * Typed `data` payload of a bulk ModuleX-key provisioning SSE event.
 *
 * Emitted by `POST /credentials/bulk-modulex-keys/stream`. The `phase`
 * field discriminates the lifecycle stage; phase-specific extras are
 * optional and only present on the relevant phases.
 */
export interface ModulexKeyBulkEventData {
  /** Lifecycle phase of the bulk provisioning stream. */
  phase: 'initial_status' | 'creating' | 'retrying' | 'completed';
  /** Current per-integration statuses. */
  integrations?: ModulexKeyIntegrationStatus[];
  /** Whether the overall operation has completed. */
  completed?: boolean;
  /** Integrations created during this phase. */
  just_created?: string[];
  /** Number of integrations being retried. */
  retrying_count?: number;
  /** Final summary counts, present on the `completed` phase. */
  summary?: ModulexKeyBulkSummary;
  /** Human-readable status message. */
  message?: string;
  /** Error message when a phase fails. */
  error?: string;
}
