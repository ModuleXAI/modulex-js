/**
 * Auth resource — identity and organization membership endpoints.
 * @module resources/auth
 */

import { BaseResource } from '../base';
import type { RequestOptions } from '../types';
import type {
  UserResponse,
  OrganizationsResponse,
  InvitationsResponse,
  SuccessResponse,
  LeaveResponse,
} from '../types';

/**
 * Provides methods for the `/auth` API endpoints.
 */
export class Auth extends BaseResource {
  /**
   * GET /auth/me
   *
   * Returns the authenticated user's profile.
   */
  async me(options?: RequestOptions): Promise<UserResponse> {
    return this._get<UserResponse>('/auth/me', options);
  }

  /**
   * GET /auth/me/organizations
   *
   * Returns the organizations the authenticated user belongs to.
   */
  async organizations(
    params?: { role?: string },
    options?: RequestOptions,
  ): Promise<OrganizationsResponse> {
    return this._get<OrganizationsResponse>('/auth/me/organizations', {
      ...options,
      params: { ...options?.params, role: params?.role },
    });
  }

  /**
   * GET /auth/invitations/my
   *
   * Returns pending invitations for the authenticated user.
   */
  async invitations(options?: RequestOptions): Promise<InvitationsResponse> {
    return this._get<InvitationsResponse>('/auth/invitations/my', options);
  }

  /**
   * POST /auth/invitations/{id}/accept
   *
   * Accepts a pending organization invitation.
   */
  async acceptInvitation(
    invitationId: string,
    options?: RequestOptions,
  ): Promise<SuccessResponse> {
    return this._post<SuccessResponse>(
      `/auth/invitations/${invitationId}/accept`,
      undefined,
      options,
    );
  }

  /**
   * POST /auth/invitations/{id}/reject
   *
   * Rejects a pending organization invitation.
   */
  async rejectInvitation(
    invitationId: string,
    options?: RequestOptions,
  ): Promise<SuccessResponse> {
    return this._post<SuccessResponse>(
      `/auth/invitations/${invitationId}/reject`,
      undefined,
      options,
    );
  }

  /**
   * POST /auth/organizations/leave
   *
   * Leaves the current organization (requires organization context).
   */
  async leaveOrganization(options?: RequestOptions): Promise<LeaveResponse> {
    return this._post<LeaveResponse>('/auth/organizations/leave', undefined, options);
  }
}
