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
 * Organization object embedded in creation responses.
 *
 * Wire fields are snake_case to match the backend `org_payload`.
 */
export interface OrganizationCreatedObject {
  id: string;
  name: string;
  slug: string;
  /** Email domain associated with the organization, if any. */
  domain: string | null;
  /** Whether the organization is active. */
  is_active: boolean;
  /** ISO-8601 creation timestamp, or `null` if unavailable. */
  created_at: string | null;
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
  /**
   * Role to assign upon acceptance. Only `'admin'` is accepted — the org
   * `member` role was retired (organizations are owner/admin only). Omit to use
   * the server-side default (`admin`). The backend rejects `role: 'member'` with
   * HTTP 422.
   */
  role?: 'admin';
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
  /**
   * New role to assign. Only `'admin'` is accepted — the org `member` role was
   * retired (organizations are owner/admin only); the backend rejects
   * `role: 'member'` with HTTP 422.
   */
  role: 'admin';
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

/**
 * Response from previewing the prorated cost of adding one seat
 * (`POST /organizations/invite/preview`).
 *
 * A discriminated union on `preview_available`:
 * - `false` — preview is not available (e.g. no active subscription); includes a `reason`.
 * - `true` — a prorated cost preview is available with full pricing detail.
 *
 * Wire fields are snake_case to match the backend response.
 */
export type InvitePreviewResponse =
  | {
      preview_available: false;
      /** Machine-readable reason the preview is unavailable, e.g. `'no_active_subscription'`. */
      reason: string;
    }
  | {
      preview_available: true;
      /** Billing interval of the active subscription, e.g. `'month'` or `'year'`. */
      interval: string;
      /** The seat count that would result after adding one seat. */
      new_quantity: number;
      /** Total amount due, in major currency units (e.g. dollars). */
      amount_due: number;
      /** ISO-4217 currency code, e.g. `'usd'`. */
      currency: string;
      /** Prorated line amount for the added seat, in major currency units. */
      proration_line_amount: number;
      /** `true` if the charge is immediate (annual plans); `false` if billed on the next invoice (monthly). */
      immediate: boolean;
    };

/**
 * A single visible model in an integration's model-visibility dropdown.
 *
 * Wire fields are snake_case to match the backend `LLMModelEntry`.
 */
export interface LLMModelEntry {
  /** Model id / slug used at runtime. */
  id: string;
  /** Optional label shown in the dropdown. */
  display_name?: string;
}

/**
 * The org's persisted default composer LLM selection.
 *
 * Wire fields are snake_case to match the backend `composer_llm` object.
 */
export interface ComposerLLMSelection {
  integration_name: string;
  provider_id: string;
  model_id: string;
  credential_id?: string;
}

/**
 * Response from reading per-organization settings (`GET /organizations/settings`).
 *
 * Wire fields are snake_case to match the backend response.
 */
export interface SettingsResponse {
  /**
   * Per-integration map of visible models. Keys are integration names
   * (e.g. `'openrouter'`), values are the visible model entries.
   */
  llm_model_visibility: Record<string, LLMModelEntry[]>;
  /** The org's default composer LLM, or `null` if not configured. */
  composer_llm: ComposerLLMSelection | null;
}

/**
 * Parameters for setting which models are visible for one integration
 * (`PUT /organizations/settings/llm-model-visibility`).
 *
 * Send the FULL desired visible list. An empty `models` array resets the
 * integration's visibility to the catalog default.
 *
 * Field names are camelCase and converted to snake_case on the wire by the
 * base client.
 */
export interface SetModelVisibilityParams {
  /** Integration name, e.g. `'openrouter'` or `'openai'`. */
  integrationName: string;
  /** Full desired set of visible models. Empty resets to default. */
  models: LLMModelEntry[];
}

/**
 * Response from setting model visibility
 * (`PUT /organizations/settings/llm-model-visibility`).
 */
export interface SetModelVisibilityResponse {
  /** Updated per-integration map of visible models. */
  llm_model_visibility: Record<string, LLMModelEntry[]>;
}

/**
 * Parameters for setting the org's default composer LLM
 * (`PUT /organizations/settings/composer-llm`).
 *
 * Field names are camelCase and converted to snake_case on the wire by the
 * base client.
 */
export interface ComposerLLMParams {
  /** Integration name, e.g. `'openrouter'`. */
  integrationName: string;
  /** Provider id for the selected model. */
  providerId: string;
  /** Model id to use as the default composer LLM. */
  modelId: string;
  /** Optional credential id to associate with the selection. */
  credentialId?: string;
}

/**
 * Response from setting the org's default composer LLM
 * (`PUT /organizations/settings/composer-llm`).
 */
export interface ComposerLLMResponse {
  /** The org's updated default composer LLM, or `null` if cleared. */
  composer_llm: ComposerLLMSelection | null;
}
