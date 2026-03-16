/**
 * Types for browsing the integration catalog and fetching provider details.
 * @module types/integrations
 */

// ---------------------------------------------------------------------------
// Browse params
// ---------------------------------------------------------------------------

/**
 * Query parameters for browsing the integration catalog.
 */
export interface BrowseParams {
  /** Filter by category (e.g. `"communication"`, `"storage"`, `"llm"`). */
  category?: string;
  /** Filter by integration type (e.g. `"tool"`, `"llm_provider"`, `"knowledge_provider"`). */
  type?: string;
  /** Filter by supported auth type (e.g. `"api_key"`, `"oauth2"`). */
  authType?: string;
  /** Full-text search query against name and description. */
  search?: string;
  /** Whether to include full action/schema details in the response. */
  includeDetails?: boolean;
  /** Whether to return a paginated response. */
  paginate?: boolean;
  page?: number;
  pageSize?: number;
}

// ---------------------------------------------------------------------------
// Browse response
// ---------------------------------------------------------------------------

/**
 * Response from the catalog browse endpoint.
 */
export interface BrowseResponse {
  integrations: IntegrationResponse[];
  total: number;
  page?: number;
  page_size?: number;
  total_pages?: number;
}

// ---------------------------------------------------------------------------
// Integration detail shapes
// ---------------------------------------------------------------------------

/**
 * Generic integration object as returned by catalog and detail endpoints.
 * Fields beyond the listed ones are provider-specific and accessed via the index signature.
 */
export interface IntegrationResponse {
  name: string;
  /** Integration category (e.g. `"tool"`, `"llm_provider"`, `"knowledge_provider"`). */
  type: string;
  display_name?: string;
  description?: string;
  /** Available action/service names. */
  actions?: string[];
  /** Authentication schema descriptors. */
  auth_schemas?: Record<string, unknown>[];
  icon_url?: string;
  [key: string]: unknown;
}

/**
 * Detailed tool integration response including action definitions.
 */
export interface ToolIntegrationResponse {
  integration_name: string;
  display_name?: string;
  description?: string;
  /** Map of action name to action descriptor. */
  actions?: Record<string, unknown>;
  auth_types?: string[];
  [key: string]: unknown;
}

/**
 * Detailed LLM provider response including available models.
 */
export interface LLMProviderResponse {
  provider_name: string;
  display_name?: string;
  models?: Record<string, unknown>[];
  auth_types?: string[];
  [key: string]: unknown;
}

/**
 * Detailed knowledge provider response including supported collection features.
 */
export interface KnowledgeProviderResponse {
  provider_name: string;
  display_name?: string;
  auth_types?: string[];
  [key: string]: unknown;
}
