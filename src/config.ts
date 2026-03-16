/**
 * Configuration options for the ModuleX client.
 */
export interface ModulexConfig {
  /** API key with `mx_live_` prefix. */
  apiKey: string;

  /** Default organization ID for all requests. Can be overridden per-request. */
  organizationId?: string;

  /** Base URL for the ModuleX API. */
  baseUrl?: string;

  /** Request timeout in milliseconds. */
  timeout?: number;

  /** Maximum number of retries for transient errors (429, 5xx). */
  maxRetries?: number;

  /** Custom fetch implementation. Defaults to globalThis.fetch. */
  fetch?: typeof globalThis.fetch;
}

/** @internal */
export interface ResolvedConfig {
  apiKey: string;
  organizationId?: string;
  baseUrl: string;
  timeout: number;
  maxRetries: number;
  fetch: typeof globalThis.fetch;
}

/** Default configuration values. */
export const DEFAULT_BASE_URL = 'https://api.modulex.dev';
export const DEFAULT_TIMEOUT = 30_000;
export const DEFAULT_MAX_RETRIES = 3;

/** @internal */
export function resolveConfig(config: ModulexConfig): ResolvedConfig {
  if (!config.apiKey) {
    throw new Error('ModuleX API key is required. Pass `apiKey` to the Modulex constructor.');
  }
  return {
    apiKey: config.apiKey,
    organizationId: config.organizationId,
    baseUrl: (config.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, ''),
    timeout: config.timeout ?? DEFAULT_TIMEOUT,
    maxRetries: config.maxRetries ?? DEFAULT_MAX_RETRIES,
    fetch: config.fetch ?? globalThis.fetch,
  };
}
