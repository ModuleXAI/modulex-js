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
}
