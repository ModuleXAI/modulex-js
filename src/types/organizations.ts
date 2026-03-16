/**
 * Types for organization management, LLM configuration, and member management.
 * @module types/organizations
 */

/**
 * Parameters for creating a new organization.
 */
export interface CreateOrganizationParams {
  /** Display name for the organization. */
  name: string;
  /** URL-safe slug. Auto-generated from `name` if omitted. */
  slug?: string;
}

/**
 * Minimal organization object embedded in creation responses.
 */
export interface OrganizationCreatedObject {
  id: string;
  name: string;
  slug: string;
}

/**
 * Response from the create-organization endpoint.
 */
export interface CreateOrganizationResponse {
  success: boolean;
  message: string;
  organization: OrganizationCreatedObject;
}

/**
 * A single LLM integration entry as returned by the organization LLM list.
 */
export interface LLMEntry {
  [key: string]: unknown;
}

/**
 * Response from listing LLM integrations for an organization.
 */
export interface LLMsResponse {
  success: boolean;
  total: number;
  active_llm_total: number;
  inactive_llm_total: number;
  /** Array of active LLM integration objects. */
  active_llms: LLMEntry[];
  /** Array of inactive LLM integration objects. */
  inactive_llms: LLMEntry[];
}

/**
 * Parameters for inviting a user to the organization.
 */
export interface InviteParams {
  /** Email address of the person being invited. */
  invitedEmail: string;
  /** Role to assign upon acceptance. Defaults to `'member'`. */
  role?: string;
  /** Optional personal message included in the invitation email. */
  invitationMessage?: string;
}

/**
 * Response returned after cancelling a pending invitation.
 */
export interface CancelInvitationResponse {
  success: boolean;
  message: string;
}

/**
 * Parameters for updating a member's role within an organization.
 */
export interface RoleUpdateParams {
  /** New role to assign. */
  role: 'member' | 'admin';
}

/**
 * Response returned after a successful role update.
 */
export interface RoleUpdateResponse {
  success: boolean;
  message: string;
  user_id: string;
  organization_id: string;
  new_role: string;
}
