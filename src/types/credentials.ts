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
  /** Integration category (e.g. `"tool"`, `"llm"`, `"knowledge"`). */
  integration_type: string;
  /** Human-readable label for the credential. */
  display_name: string;
  /** Auth mechanism used (e.g. `"api_key"`, `"oauth2"`, `"basic"`). */
  auth_type: string;
  /** Whether this is the default credential for its integration. */
  is_default: boolean;
  created_at: string;
  updated_at: string;
  last_used_at?: string | null;
  expires_at?: string | null;
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
  start_date: string;
  end_date: string;
}

/**
 * Query parameters for paginating a credential's audit log.
 */
export interface CredentialAuditParams {
  limit?: number;
  offset?: number;
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
