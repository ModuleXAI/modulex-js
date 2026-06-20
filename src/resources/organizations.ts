/**
 * Organizations resource — organization management endpoints.
 * @module resources/organizations
 */

import { BaseResource } from '../base';
import type { RequestOptions } from '../types';
import type {
  CreateOrganizationParams,
  CreateOrganizationResponse,
  LLMsResponse,
  InviteParams,
  SuccessResponse,
  CancelInvitationResponse,
  RoleUpdateParams,
  RoleUpdateResponse,
  InvitePreviewResponse,
  SettingsResponse,
  SetModelVisibilityParams,
  SetModelVisibilityResponse,
  ComposerLLMParams,
  ComposerLLMResponse,
} from '../types';

/**
 * Provides methods for the `/organizations` API endpoints.
 */
export class Organizations extends BaseResource {
  /**
   * POST /organizations
   *
   * Creates a new organization. The authenticated user becomes the owner.
   */
  async create(
    params: CreateOrganizationParams,
    options?: RequestOptions,
  ): Promise<CreateOrganizationResponse> {
    return this._post<CreateOrganizationResponse>('/organizations', params, options);
  }

  /**
   * GET /organizations/llms
   *
   * Returns the LLM integrations configured for the current organization.
   */
  async llms(options?: RequestOptions): Promise<LLMsResponse> {
    return this._get<LLMsResponse>('/organizations/llms', options);
  }

  /**
   * POST /organizations/invite
   *
   * Sends an invitation email to add a user to the current organization.
   */
  async invite(params: InviteParams, options?: RequestOptions): Promise<SuccessResponse> {
    return this._post<SuccessResponse>('/organizations/invite', params, options);
  }

  /**
   * POST /organizations/invitations/{id}/cancel
   *
   * Cancels a pending organization invitation.
   */
  async cancelInvitation(
    invitationId: string,
    options?: RequestOptions,
  ): Promise<CancelInvitationResponse> {
    return this._post<CancelInvitationResponse>(
      `/organizations/invitations/${invitationId}/cancel`,
      undefined,
      options,
    );
  }

  /**
   * POST /organizations/invitations/{id}/reinvite
   *
   * Re-sends an invitation email for a pending invitation.
   */
  async reinvite(invitationId: string, options?: RequestOptions): Promise<SuccessResponse> {
    return this._post<SuccessResponse>(
      `/organizations/invitations/${invitationId}/reinvite`,
      undefined,
      options,
    );
  }

  /**
   * PUT /organizations/{orgId}/users/{userId}/role
   *
   * Updates a member's role within an organization.
   */
  async updateRole(
    organizationId: string,
    userId: string,
    params: RoleUpdateParams,
    options?: RequestOptions,
  ): Promise<RoleUpdateResponse> {
    return this._put<RoleUpdateResponse>(
      `/organizations/${organizationId}/users/${userId}/role`,
      params,
      options,
    );
  }

  /**
   * DELETE /organizations/{orgId}/users/{userId}
   *
   * Removes a user from an organization. Requires owner permission.
   */
  async removeUser(
    organizationId: string,
    userId: string,
    options?: RequestOptions,
  ): Promise<SuccessResponse> {
    return this._delete<SuccessResponse>(
      `/organizations/${organizationId}/users/${userId}`,
      undefined,
      options,
    );
  }

  /**
   * POST /organizations/invite/preview
   *
   * Previews the prorated cost of adding one seat to the current organization,
   * for displaying to the user before confirming an invite. The organization is
   * resolved from the `X-Organization-ID` header, so no request body is sent.
   *
   * Returns a discriminated union on `preview_available`: when `false`, the
   * organization has no active paid subscription (a `reason` is provided); when
   * `true`, full prorated pricing detail is returned.
   *
   * @remarks Admin-only: requires organization admin (or owner) permission.
   */
  async invitePreview(options?: RequestOptions): Promise<InvitePreviewResponse> {
    return this._post<InvitePreviewResponse>('/organizations/invite/preview', undefined, options);
  }

  /**
   * GET /organizations/settings
   *
   * Returns the per-organization preference settings (model visibility and the
   * default composer LLM) for the current organization. The organization is
   * resolved from the `X-Organization-ID` header.
   *
   * @remarks Available to any organization member.
   */
  async getSettings(options?: RequestOptions): Promise<SettingsResponse> {
    return this._get<SettingsResponse>('/organizations/settings', options);
  }

  /**
   * PUT /organizations/settings/llm-model-visibility
   *
   * Sets which models are visible in the dropdown for a single integration.
   * Send the FULL desired visible list; an empty `models` array resets that
   * integration's visibility to the catalog default. The organization is
   * resolved from the `X-Organization-ID` header.
   *
   * @remarks Admin-only: requires organization admin (or owner) permission.
   */
  async setModelVisibility(
    params: SetModelVisibilityParams,
    options?: RequestOptions,
  ): Promise<SetModelVisibilityResponse> {
    return this._put<SetModelVisibilityResponse>(
      '/organizations/settings/llm-model-visibility',
      params,
      options,
    );
  }

  /**
   * PUT /organizations/settings/composer-llm
   *
   * Persists the organization's default composer LLM. Composer requests that
   * omit an explicit LLM fall back to this value. The organization is resolved
   * from the `X-Organization-ID` header.
   *
   * @remarks Admin-only: requires organization admin (or owner) permission.
   */
  async setComposerLlm(
    params: ComposerLLMParams,
    options?: RequestOptions,
  ): Promise<ComposerLLMResponse> {
    return this._put<ComposerLLMResponse>(
      '/organizations/settings/composer-llm',
      params,
      options,
    );
  }
}
