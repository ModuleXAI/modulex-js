/**
 * Types for API key management.
 * @module types/api-keys
 */

/**
 * Parameters for creating a new API key.
 * Field names are camelCase; the SDK converts them to snake_case before sending.
 */
export interface CreateApiKeyParams {
  /** Human-readable label for the key. Must be 1-255 characters. */
  name: string;
  /**
   * Scope the key to a specific organization.
   * If omitted, the key works for all of the user's organizations.
   */
  organizationId?: string;
  /** ISO-8601 datetime after which the key becomes invalid. */
  expiresAt?: string;
  /**
   * Maximum number of API calls allowed per minute for this key.
   * Must be between 1 and 1000 (backend default: 60).
   */
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
  /** Identifier hint: the first 8 characters of the key. */
  key_hint: string;
  /** Masked key for display, e.g. `mx_live_XXXX****`. */
  masked_key: string;
  organization_id: string | null;
  expires_at: string | null;
  /** Whether the key has passed its expiration datetime. */
  is_expired: boolean;
  /** Whether the key is active (i.e. not revoked). */
  is_active: boolean;
  rate_limit_per_minute: number;
  /** ISO-8601 datetime the key was last used, or null if never used. */
  last_used_at: string | null;
  created_at: string;
  /** ISO-8601 datetime the key was revoked, or null if still active. */
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
  /** Total number of keys returned. Always present. */
  total: number;
  /** Maximum number of keys allowed per user. */
  max_keys: number;
}

/**
 * Response returned after revoking an API key.
 */
export interface RevokeApiKeyResponse {
  success: boolean;
  message: string;
}
