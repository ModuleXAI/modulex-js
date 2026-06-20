/**
 * Human-in-the-Loop (HITL) wire contract — discriminated unions for structured
 * questions the agent asks (`UserInputRequest`) and the answers the client sends
 * back on resume (`UserInputResponse`).
 *
 * Shared by the Composer and Assistant resources. Mirrors the backend
 * `app/models/composer_events.py`. Discriminate on the `kind` field.
 * @module types/hitl
 */

// ---------------------------------------------------------------------------
// Shared option shapes
// ---------------------------------------------------------------------------

/** A selectable option in a single/multi choice question. */
export interface ChoiceOption {
  value: string;
  label: string;
  description?: string;
  icon?: string;
  badge?: string;
}

/** One way to authenticate when answering a credential request. */
export interface CredentialAuthOption {
  auth_type: 'oauth2' | 'api_key' | 'bearer_token' | 'modulex_key' | 'custom';
  display_name: string;
  fields?: Record<string, unknown>[];
  oauth_initiate_endpoint?: string;
  setup_instructions?: string[];
  test_supported: boolean;
}

// ---------------------------------------------------------------------------
// UserInputRequest (server -> client) — discriminated on `kind`
// ---------------------------------------------------------------------------

/** Fields common to every user-input request. */
export interface UserInputRequestBase {
  request_id: string;
  /** Markdown-supported prompt shown to the user. */
  message: string;
  /** Whether the user is allowed to skip. */
  required: boolean;
  /** Escape hatch: allow a "write your own" answer. */
  allow_free_text: boolean;
  context?: Record<string, unknown> | null;
  timeout_hint_seconds?: number | null;
}

export interface SingleChoiceRequest extends UserInputRequestBase {
  kind: 'single_choice';
  options: ChoiceOption[];
}

export interface MultiChoiceRequest extends UserInputRequestBase {
  kind: 'multi_choice';
  options: ChoiceOption[];
  min_selections: number;
  max_selections?: number | null;
}

export interface YesNoRequest extends UserInputRequestBase {
  kind: 'yes_no';
  yes_label: string;
  no_label: string;
}

export interface FreeTextRequest extends UserInputRequestBase {
  kind: 'free_text';
  placeholder?: string | null;
  multiline: boolean;
  min_length: number;
  max_length?: number | null;
}

export interface CredentialRequest extends UserInputRequestBase {
  kind: 'credential_request';
  integration_name: string;
  integration_display_name: string;
  integration_logo?: string | null;
  auth_options: CredentialAuthOption[];
  pending_node_name?: string | null;
}

/** A structured question the agent asks while paused. Discriminate on `kind`. */
export type UserInputRequest =
  | SingleChoiceRequest
  | MultiChoiceRequest
  | YesNoRequest
  | FreeTextRequest
  | CredentialRequest;

// ---------------------------------------------------------------------------
// UserInputResponse (client -> server) — discriminated on `kind`
// ---------------------------------------------------------------------------

export interface SingleChoiceResponse {
  kind: 'single_choice';
  selected_value?: string;
  free_text?: string;
}

export interface MultiChoiceResponse {
  kind: 'multi_choice';
  selected_values: string[];
}

export interface YesNoResponse {
  kind: 'yes_no';
  answer: boolean;
}

export interface FreeTextResponse {
  kind: 'free_text';
  text: string;
}

export interface CredentialAddedResponse {
  kind: 'credential_added';
  credential_id: string;
  integration_name: string;
  auth_type: string;
}

/** Reason codes for a failed credential attempt. */
export type CredentialFailureCode =
  | 'oauth_denied'
  | 'oauth_provider_error'
  | 'invalid_credentials'
  | 'network_error'
  | 'popup_closed'
  | 'timeout'
  | 'unknown';

export interface CredentialFailedResponse {
  kind: 'credential_failed';
  integration_name: string;
  auth_type: string;
  error_code: CredentialFailureCode;
  error_message: string;
  retryable?: boolean;
  provider_details?: Record<string, unknown> | null;
}

export interface SkippedResponse {
  kind: 'skipped';
  reason?: string;
}

/** The answer the client sends back to resume a paused run. Discriminate on `kind`. */
export type UserInputResponse =
  | SingleChoiceResponse
  | MultiChoiceResponse
  | YesNoResponse
  | FreeTextResponse
  | CredentialAddedResponse
  | CredentialFailedResponse
  | SkippedResponse;
