/**
 * Common types shared across all ModuleX SDK resources.
 * @module types/shared
 */

/**
 * Per-request options that can be passed to any SDK method.
 * organizationId overrides the client-level default for a single call.
 */
export interface RequestOptions {
  /** Override the organization context for this request. */
  organizationId?: string;
  /** Additional query parameters appended to the URL (camelCase keys are converted to snake_case). */
  params?: Record<string, string | number | boolean | undefined>;
  /** An AbortSignal to cancel the in-flight request. */
  signal?: AbortSignal;
  /** Request-level timeout in milliseconds, overrides the client default. */
  timeout?: number;
}

/**
 * Standard success acknowledgement returned by mutation endpoints.
 */
export interface SuccessResponse {
  success: boolean;
  message?: string;
}

/**
 * Generic paginated list envelope.
 * The API uses different pagination styles across resources; all optional
 * fields that a particular endpoint may or may not include are represented here.
 *
 * @template T - The type of each item in the collection.
 */
export interface PaginatedList<T> {
  total: number;
  page?: number;
  page_size?: number;
  total_pages?: number;
  limit?: number;
  offset?: number;
  has_next?: boolean;
  has_previous?: boolean;
}
