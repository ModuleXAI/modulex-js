/**
 * ApiKeys resource — API key management endpoints.
 * @module resources/api-keys
 */

import { BaseResource } from '../base';
import type { RequestOptions } from '../types';
import type {
  CreateApiKeyParams,
  CreateApiKeyResponse,
  ApiKeyListResponse,
  ApiKeyResponse,
  RevokeApiKeyResponse,
} from '../types';

/**
 * Provides methods for the `/api-keys` API endpoints.
 */
export class ApiKeys extends BaseResource {
  /**
   * POST /api-keys
   *
   * Creates a new API key. The full key value is returned only once.
   */
  async create(
    params: CreateApiKeyParams,
    options?: RequestOptions,
  ): Promise<CreateApiKeyResponse> {
    return this._post<CreateApiKeyResponse>('/api-keys', params, options);
  }

  /**
   * GET /api-keys
   *
   * Lists all API keys for the authenticated user.
   */
  async list(
    params?: { includeRevoked?: boolean },
    options?: RequestOptions,
  ): Promise<ApiKeyListResponse> {
    return this._get<ApiKeyListResponse>('/api-keys', {
      ...options,
      params: {
        ...options?.params,
        include_revoked: params?.includeRevoked,
      },
    });
  }

  /**
   * GET /api-keys/{keyId}
   *
   * Returns details for a specific API key (masked — never the full key).
   */
  async get(keyId: string, options?: RequestOptions): Promise<ApiKeyResponse> {
    return this._get<ApiKeyResponse>(`/api-keys/${keyId}`, options);
  }

  /**
   * DELETE /api-keys/{keyId}
   *
   * Permanently revokes an API key.
   */
  async revoke(keyId: string, options?: RequestOptions): Promise<RevokeApiKeyResponse> {
    return this._delete<RevokeApiKeyResponse>(`/api-keys/${keyId}`, undefined, options);
  }
}
