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
 *
 * Wire shape matches the backend `get_user_organizations` projection
 * (`{id, slug, name, domain, role, joined_at, is_default}`). Fields are
 * snake_case to mirror the API response exactly.
 */
export interface OrganizationInfo {
  id: string;
  name: string;
  slug: string;
  /** The organization's email domain, or `null` when unset. */
  domain: string | null;
  /** The calling user's role inside this organization. */
  role: string;
  /** ISO-8601 timestamp of when the user joined this organization. */
  joined_at: string;
  /** Whether this organization is the user's default organization. */
  is_default: boolean;
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
 * The organization an invitation grants membership to.
 */
export interface InvitationOrganization {
  id: string;
  name: string;
  slug: string | null;
  /** The organization's email domain, or `null` when unset. */
  domain: string | null;
}

/**
 * The user who issued an invitation.
 */
export interface InvitationInviter {
  id: string;
  email: string;
  username: string | null;
}

/**
 * A single organization invitation object.
 *
 * Wire shape matches the backend `get_user_all_pending_invitations_optimized`
 * projection. The organization and inviter are nested objects (not flat
 * `organization_id` / `invited_email` fields).
 */
export interface InvitationObject {
  id: string;
  /** The organization the invitation grants access to. */
  organization: InvitationOrganization;
  /** The user who sent the invitation. */
  invited_by: InvitationInviter;
  role: string;
  status: string;
  invitation_message?: string | null;
  created_at: string;
  expires_at?: string | null;
  /**
   * Whole days remaining until the invitation expires. Can be `0` for
   * invitations expiring in under 24 hours (derived from `timedelta.days`).
   */
  days_until_expiry: number;
}

/**
 * Response from listing pending invitations for the authenticated user.
 */
export interface InvitationsResponse {
  success: boolean;
  invitations: InvitationObject[];
  /** Total number of pending invitations returned. */
  total_count: number;
}

/**
 * The organization details returned when an invitation is accepted.
 */
export interface AcceptedInvitationOrganization {
  id: string;
  name: string;
  slug: string;
}

/**
 * Response from accepting an invitation.
 *
 * On success the backend returns the joined organization and the granted
 * role in addition to `success` / `message`.
 */
export interface InvitationResponse {
  success: boolean;
  message?: string;
  /** The organization the user joined. */
  organization?: AcceptedInvitationOrganization;
  /** The role the user was granted in the organization. */
  role?: string;
}

/**
 * Response returned when a user leaves an organization.
 */
export interface LeaveResponse {
  success: boolean;
  message: string;
  /** The organization that was left. */
  left_organization: { id: string; name: string; slug: string };
  /**
   * The organizations the user still belongs to, as full membership records.
   */
  remaining_organizations: OrganizationInfo[];
  total_remaining: number;
}
