/**
 * Types for API key management.
 * @module types/api-keys
 */

/**
 * Parameters for creating a new API key.
 * Field names are camelCase; the SDK converts them to snake_case before sending.
 */
export interface CreateApiKeyParams {
  /** Human-readable label for the key. */
  name: string;
  /** Scope the key to a specific organization. Defaults to the client-level org. */
  organizationId?: string;
  /** ISO-8601 datetime after which the key becomes invalid. */
  expiresAt?: string;
  /** Maximum number of API calls allowed per minute for this key. */
  rateLimitPerMinute?: number;
}

/**
 * An API key object as returned by the API.
 * The `key` field is only present immediately after creation.
 */
export interface ApiKeyResponse {
  id: string;
  name: string;
  /**
   * The full secret key value.
   * Only returned once, immediately after creation — store it securely.
   */
  key?: string;
  /** Masked hint showing the first / last characters of the key. */
  key_hint: string;
  organization_id: string | null;
  expires_at: string | null;
  rate_limit_per_minute: number | null;
  created_at: string;
  is_revoked?: boolean;
  revoked_at?: string | null;
}

/**
 * Response returned when a new API key is created.
 * Extends {@link ApiKeyResponse} and always includes the full `key`.
 */
export interface CreateApiKeyResponse extends ApiKeyResponse {
  /** The full secret key — only exposed on creation. */
  key: string;
}

/**
 * Response from listing API keys for an organization.
 */
export interface ApiKeyListResponse {
  keys: ApiKeyResponse[];
  total?: number;
}

/**
 * Response returned after revoking an API key.
 */
export interface RevokeApiKeyResponse {
  success: boolean;
  message: string;
}
