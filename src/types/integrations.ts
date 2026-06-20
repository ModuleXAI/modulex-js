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
// Integration catalog shapes
// ---------------------------------------------------------------------------

/**
 * Integration metadata as returned by list/browse endpoints
 * (`/integrations/browse`, `/integrations/tools`, `/integrations/llm-providers`,
 * `/integrations/knowledge-providers`).
 *
 * Mirrors the backend `IntegrationMetadata` model. Wire field names are
 * snake_case and are returned as-is by the client (no camelCase conversion).
 *
 * Note: when `include_details=false` on browse, the backend strips
 * `actions`, `models`, and `auth_schemas` from each element, hence those
 * fields are optional.
 */
export interface IntegrationMetadata {
  /** Canonical integration name / identifier. */
  name: string;
  /** Human-readable display name (always present). */
  display_name: string;
  /** Human-readable description (always present). */
  description: string;
  /** Logo URL, if any. */
  logo?: string | null;
  /** Marketing / app URL, if any. */
  app_url?: string | null;
  /** Documentation URL, if any. */
  docs_url?: string | null;
  /** Categories this integration belongs to. */
  categories?: string[];
  /** Integration type (e.g. `"tool"`, `"llm_provider"`, `"knowledge_provider"`). */
  integration_type: string;
  /** Integration version, if any. */
  version?: string | null;
  /** Lifecycle status (e.g. `"active"`). */
  status?: string;
  /** Whether this integration is recommended. */
  recommended?: boolean;
  /** Tool action descriptors (present only when details are included). */
  actions?: Record<string, unknown>[];
  /** LLM provider model descriptors (present only when details are included). */
  models?: Record<string, unknown>[];
  /** Auth requirement descriptors (present only when details are included). */
  auth_schemas?: AuthSchema[];
  [key: string]: unknown;
}

/**
 * Authentication schema descriptor as returned by detail endpoints.
 *
 * For `oauth2` schemas the backend enriches the descriptor with the
 * `supports_modulex_oauth` / `supports_custom_oauth` boolean flags.
 */
export interface AuthSchema {
  /** Auth type discriminator (e.g. `"api_key"`, `"oauth2"`). */
  auth_type?: string;
  /** Whether ModuleX-managed OAuth is available for this provider (oauth2 only). */
  supports_modulex_oauth?: boolean;
  /** Whether custom OAuth credentials are supported (oauth2 only). */
  supports_custom_oauth?: boolean;
  [key: string]: unknown;
}

/**
 * Detailed integration information as returned by the detail endpoints
 * (`/integrations/{integration_name}`, `/integrations/tools/{name}`,
 * `/integrations/llm-providers/{name}`, `/integrations/knowledge-providers/{name}`).
 *
 * Mirrors the backend `IntegrationDetail` model. Wire field names are
 * snake_case and are returned as-is by the client (no camelCase conversion).
 */
export interface IntegrationDetail {
  /** Canonical integration name / identifier. */
  name: string;
  /** Human-readable display name (always present). */
  display_name: string;
  /** Human-readable description (always present). */
  description: string;
  /** Logo URL, if any. */
  logo?: string | null;
  /** Marketing / app URL, if any. */
  app_url?: string | null;
  /** Documentation URL, if any. */
  docs_url?: string | null;
  /** Categories this integration belongs to. */
  categories?: string[];
  /** Integration type (e.g. `"tool"`, `"llm_provider"`, `"knowledge_provider"`). */
  integration_type: string;
  /** Integration version, if any. */
  version?: string | null;
  /** Auth requirement descriptors (OAuth-enriched where applicable). */
  auth_schemas?: AuthSchema[];
  /** Tool action descriptors (for tools). */
  actions?: Record<string, unknown>[];
  /** LLM provider model descriptors (for LLM providers). */
  models?: Record<string, unknown>[];
  /** Supported feature flags, if any. */
  features?: string[] | null;
  /** Arbitrary provider-specific metadata, if any. */
  metadata?: Record<string, unknown> | null;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Browse response
// ---------------------------------------------------------------------------

/**
 * Response from the catalog browse endpoint (`/integrations/browse`).
 *
 * Mirrors the backend `BrowseResponse` model. The `integrations` array
 * carries `IntegrationMetadata` elements (not full details).
 */
export interface BrowseResponse {
  /** Catalog entries for the current page. */
  integrations: IntegrationMetadata[];
  /** Total number of matching integrations across all pages. */
  total: number;
  /** Current page number (always present). */
  page: number;
  /** Page size (always present). */
  page_size: number;
  /** Whether more pages are available after the current one. */
  has_more: boolean;
}

// ---------------------------------------------------------------------------
// Integration detail shapes (per-endpoint aliases)
// ---------------------------------------------------------------------------

/**
 * Generic integration detail as returned by `/integrations/{integration_name}`.
 *
 * Backend `response_model=IntegrationDetail`.
 */
export type IntegrationResponse = IntegrationDetail;

/**
 * Detailed tool integration response, including action definitions, as
 * returned by `/integrations/tools/{integration_name}`.
 *
 * Backend `response_model=IntegrationDetail` (`actions` populated).
 */
export type ToolIntegrationResponse = IntegrationDetail;

/**
 * Detailed LLM provider response, including available models, as returned by
 * `/integrations/llm-providers/{provider_name}`.
 *
 * Backend `response_model=IntegrationDetail` (`models` populated).
 */
export type LLMProviderResponse = IntegrationDetail;

/**
 * Detailed knowledge provider response as returned by
 * `/integrations/knowledge-providers/{provider_name}`.
 *
 * Backend `response_model=IntegrationDetail`.
 */
export type KnowledgeProviderResponse = IntegrationDetail;
