/**
 * Credentials resource — credential management and MCP server endpoints.
 * @module resources/credentials
 */

import { BaseResource } from '../base';
import type { SSEEvent } from '../streaming';
import type { RequestOptions } from '../types';
import type {
  CredentialListParams,
  CredentialListGrouped,
  CredentialListFlat,
  CredentialResponse,
  CredentialDetailResponse,
  CreateCredentialParams,
  UpdateCredentialParams,
  TestTemporaryParams,
  TestTemporaryResponse,
  TestCredentialResponse,
  CredentialUsageParams,
  CredentialUsageResponse,
  CredentialAuditParams,
  AuditLogResponse,
  McpServerParams,
  MCPServerCredentialResponse,
  McpToolsResponse,
  RefreshDiscoveryResponse,
  InitiateOAuth2Params,
  OAuth2InitiateResponse,
} from '../types';

/**
 * Provides methods for the `/credentials` API endpoints.
 */
export class Credentials extends BaseResource {
  /**
   * GET /credentials
   *
   * Lists credentials for the current organization.
   * Returns a grouped response by default, or a flat list when
   * `integrationName` is specified.
   */
  async list(
    params?: CredentialListParams,
    options?: RequestOptions,
  ): Promise<CredentialListGrouped | CredentialListFlat> {
    return this._get<CredentialListGrouped | CredentialListFlat>('/credentials', {
      ...options,
      params: {
        ...options?.params,
        integration_name: params?.integrationName,
        auth_type: params?.authType,
        limit: params?.limit,
        offset: params?.offset,
      },
    });
  }

  /**
   * GET /credentials/{credentialId}
   *
   * Returns a single credential record, including ownership and (optionally
   * masked) auth detail fields not present on the list endpoint.
   */
  async get(
    credentialId: string,
    params?: { includeMasked?: boolean },
    options?: RequestOptions,
  ): Promise<CredentialDetailResponse> {
    return this._get<CredentialDetailResponse>(`/credentials/${credentialId}`, {
      ...options,
      params: {
        ...options?.params,
        include_masked: params?.includeMasked,
      },
    });
  }

  /**
   * POST /credentials
   *
   * Creates a new credential. The auth data is encrypted at rest.
   *
   * @remarks Requires admin/owner role on the organization.
   */
  async create(
    params: CreateCredentialParams,
    options?: RequestOptions,
  ): Promise<CredentialResponse> {
    return this._post<CredentialResponse>('/credentials', params, options);
  }

  /**
   * PUT /credentials/{credentialId}
   *
   * Updates a credential's display name or metadata.
   */
  async update(
    credentialId: string,
    params: UpdateCredentialParams,
    options?: RequestOptions,
  ): Promise<CredentialResponse> {
    return this._put<CredentialResponse>(`/credentials/${credentialId}`, params, options);
  }

  /**
   * DELETE /credentials/{credentialId}
   *
   * Permanently deletes a credential. Returns 204 No Content on success.
   */
  async delete(credentialId: string, options?: RequestOptions): Promise<void> {
    return this._delete<void>(`/credentials/${credentialId}`, undefined, options);
  }

  /**
   * POST /credentials/{credentialId}/set-default
   *
   * Sets the credential as the default for its integration.
   * Unsets any previously set default.
   */
  async setDefault(
    credentialId: string,
    options?: RequestOptions,
  ): Promise<CredentialResponse> {
    return this._post<CredentialResponse>(
      `/credentials/${credentialId}/set-default`,
      undefined,
      options,
    );
  }

  /**
   * POST /credentials/test-temporary
   *
   * Validates a credential's auth data without saving it.
   */
  async testTemporary(
    params: TestTemporaryParams,
    options?: RequestOptions,
  ): Promise<TestTemporaryResponse> {
    return this._post<TestTemporaryResponse>(
      '/credentials/test-temporary',
      params,
      options,
    );
  }

  /**
   * POST /credentials/{credentialId}/test
   *
   * Tests an existing saved credential by making a live API call.
   */
  async test(
    credentialId: string,
    options?: RequestOptions,
  ): Promise<TestCredentialResponse> {
    return this._post<TestCredentialResponse>(
      `/credentials/${credentialId}/test`,
      undefined,
      options,
    );
  }

  /**
   * GET /credentials/{credentialId}/usage
   *
   * Returns usage statistics for a credential.
   *
   * @remarks Requires admin/owner role on the organization.
   */
  async usage(
    credentialId: string,
    params?: CredentialUsageParams,
    options?: RequestOptions,
  ): Promise<CredentialUsageResponse> {
    return this._get<CredentialUsageResponse>(`/credentials/${credentialId}/usage`, {
      ...options,
      params: {
        ...options?.params,
        start_date: params?.startDate,
        end_date: params?.endDate,
      },
    });
  }

  /**
   * GET /credentials/{credentialId}/audit
   *
   * Returns the audit log for a credential as an array of entries.
   *
   * @remarks Requires admin/owner role on the organization.
   */
  async audit(
    credentialId: string,
    params?: CredentialAuditParams,
    options?: RequestOptions,
  ): Promise<AuditLogResponse[]> {
    return this._get<AuditLogResponse[]>(`/credentials/${credentialId}/audit`, {
      ...options,
      params: {
        ...options?.params,
        limit: params?.limit,
        offset: params?.offset,
      },
    });
  }

  /**
   * POST /credentials/bulk-modulex-keys/stream — SSE
   *
   * Streams bulk ModuleX managed key provisioning events. Each event's
   * `data` field can be parsed as a {@link ModulexKeyBulkEventData}.
   *
   * @remarks Requires admin/owner role on the organization.
   */
  bulkModulexKeys(options?: RequestOptions): AsyncGenerator<SSEEvent> {
    return this.streamSSEPost('/credentials/bulk-modulex-keys/stream', undefined, options);
  }

  /**
   * POST /credentials/mcp-server
   *
   * Creates a credential for a Model Context Protocol (MCP) server.
   */
  async mcpServer(
    params: McpServerParams,
    options?: RequestOptions,
  ): Promise<MCPServerCredentialResponse> {
    return this._post<MCPServerCredentialResponse>(
      '/credentials/mcp-server',
      params,
      options,
    );
  }

  /**
   * POST /credentials/{credentialId}/refresh-discovery
   *
   * Refreshes the tool discovery cache for an MCP server credential.
   */
  async refreshDiscovery(
    credentialId: string,
    options?: RequestOptions,
  ): Promise<RefreshDiscoveryResponse> {
    return this._post<RefreshDiscoveryResponse>(
      `/credentials/${credentialId}/refresh-discovery`,
      undefined,
      options,
    );
  }

  /**
   * GET /credentials/{credentialId}/mcp-tools
   *
   * Returns the tools discovered from an MCP server credential.
   */
  async mcpTools(
    credentialId: string,
    options?: RequestOptions,
  ): Promise<McpToolsResponse> {
    return this._get<McpToolsResponse>(
      `/credentials/${credentialId}/mcp-tools`,
      options,
    );
  }

  /**
   * POST /credentials/oauth2/initiate
   *
   * Initiates an OAuth2 authorization flow for an integration and returns the
   * authorization URL the user should be redirected to, along with a `state`
   * token correlating the flow.
   *
   * @remarks Requires admin/owner role on the organization.
   */
  async initiateOAuth2(
    params: InitiateOAuth2Params,
    options?: RequestOptions,
  ): Promise<OAuth2InitiateResponse> {
    return this._post<OAuth2InitiateResponse>(
      '/credentials/oauth2/initiate',
      params,
      options,
    );
  }

  /**
   * POST /credentials/{credentialId}/oauth2/refresh
   *
   * Manually refreshes the access token of an existing OAuth2 credential and
   * returns the updated credential record.
   *
   * @remarks Requires admin/owner role on the organization.
   */
  async refreshOAuth2(
    credentialId: string,
    options?: RequestOptions,
  ): Promise<CredentialResponse> {
    return this._post<CredentialResponse>(
      `/credentials/${credentialId}/oauth2/refresh`,
      undefined,
      options,
    );
  }
}
