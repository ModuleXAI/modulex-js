/**
 * Types for authentication, user identity, and organization membership.
 * @module types/auth
 */

/**
 * The role a user can hold within the platform.
 */
export type UserRole = 'USER' | 'ADMIN' | 'SUPER_ADMIN';

/**
 * Full user object returned by identity endpoints.
 */
export interface UserResponse {
  id: string;
  email: string;
  username: string;
  role: UserRole;
  is_active: boolean;
  /** IDs of all organizations the user belongs to. */
  organization_ids: string[];
  /** The user's primary / default organization. */
  primary_organization_id: string | null;
}

/**
 * Lightweight organization membership record returned inside user-centric responses.
 */
export interface OrganizationInfo {
  id: string;
  name: string;
  slug: string;
  /** The calling user's role inside this organization. */
  role: string;
  created_at: string;
}

/**
 * Response from listing the organizations a user belongs to.
 */
export interface OrganizationsResponse {
  success: boolean;
  user_id: string;
  organizations: OrganizationInfo[];
  total: number;
}

/**
 * A single organization invitation object.
 */
export interface InvitationObject {
  id: string;
  organization_id: string;
  organization_name?: string;
  invited_email: string;
  role: string;
  status: string;
  invitation_message?: string;
  created_at: string;
  expires_at?: string;
}

/**
 * Response from listing pending invitations for the authenticated user.
 */
export interface InvitationsResponse {
  success: boolean;
  invitations: InvitationObject[];
  total: number;
}

/**
 * Response from accepting or rejecting a single invitation.
 */
export interface InvitationResponse {
  success: boolean;
  message?: string;
  invitation: InvitationObject;
}

/**
 * Response returned when a user leaves an organization.
 */
export interface LeaveResponse {
  success: boolean;
  message: string;
  /** The organization that was left. */
  left_organization: { id: string; name: string };
  /** The organizations the user still belongs to. */
  remaining_organizations: { id: string; name: string }[];
  total_remaining: number;
}
