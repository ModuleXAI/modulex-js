/**
 * Types for organization notifications.
 * @module types/notifications
 */

// ---------------------------------------------------------------------------
// Notification object (discriminated union on `notification_type`)
// ---------------------------------------------------------------------------

/**
 * Topic of an organization notification.
 *
 * Mirrors the backend `notification_topic` enum for organization
 * notifications (`integration` | `attention`).
 */
export type OrganizationNotificationTopic = 'integration' | 'attention';

/**
 * Topic of a system notification.
 *
 * Mirrors the backend `notification_topic` enum for system
 * notifications (`notice` | `incident` | `changelog`).
 */
export type SystemNotificationTopic = 'notice' | 'incident' | 'changelog';

/**
 * Fields shared by every notification variant returned from
 * `GET /notifications`.
 */
export interface NotificationBase {
  /** Unique identifier of the notification (or invitation) record. */
  id: string;
  /** Human-readable notification message. */
  message: string;
  /** ISO-8601 creation timestamp. May be null for some system/organization rows. */
  created_at: string | null;
  /** ISO-8601 expiration timestamp, or `null` when it never expires. */
  expires_at?: string | null;
}

/**
 * An invitation surfaced through the notifications feed.
 *
 * Produced by the invitation branch of the backend notification service.
 * Note: invitation rows do **not** carry `notification_topic`,
 * `notification_url` or `notified_at`. `organization_id` may be `null`
 * because it is derived from the invitation's organization payload.
 */
export interface InvitationNotification extends NotificationBase {
  notification_type: 'invitation';
  /** Inviting organization id; may be `null` if unavailable. */
  organization_id?: string | null;
  /** Display name of the inviting organization. */
  organization_name: string;
  /** Role the user is invited to assume. */
  role: string;
  /** Email of the user who issued the invitation, when known. */
  invited_by_email?: string | null;
  /** Optional custom message attached to the invitation. */
  invitation_message?: string | null;
}

/**
 * A system-wide notification.
 *
 * System notifications are not scoped to an organization, so they carry
 * **no** `organization_id` field.
 */
export interface SystemNotification extends NotificationBase {
  notification_type: 'system';
  /** System notification topic. */
  notification_topic: SystemNotificationTopic;
  /** Optional deep-link URL associated with the notification. */
  notification_url?: string | null;
  /** ISO-8601 timestamp of when the notification was emitted. */
  notified_at?: string | null;
}

/**
 * An organization-scoped notification.
 */
export interface OrganizationNotification extends NotificationBase {
  notification_type: 'organization';
  /** Owning organization id (always present for this variant). */
  organization_id: string;
  /** Organization notification topic. */
  notification_topic: OrganizationNotificationTopic;
  /** Optional deep-link URL associated with the notification. */
  notification_url?: string | null;
  /** ISO-8601 timestamp of when the notification was emitted. */
  notified_at?: string | null;
  /**
   * `true` when the notification was broadcast to all org members
   * (i.e. `notified_to` was null), `false` when targeted at a user.
   */
  is_broadcast: boolean;
}

/**
 * A notification record as returned by `GET /notifications`.
 *
 * This is a discriminated union keyed on `notification_type`. The backend
 * merges invitations, system notifications and organization notifications
 * into a single feed, so consumers should switch on `notification_type`
 * before accessing variant-specific fields.
 */
export type NotificationResponse =
  | InvitationNotification
  | SystemNotification
  | OrganizationNotification;

// ---------------------------------------------------------------------------
// List response
// ---------------------------------------------------------------------------

/**
 * Response from listing notifications for the current user / organization.
 *
 * `organization_id` reflects the resolved `X-Organization-ID` header and is
 * `null` when no (valid) organization context was supplied.
 */
export interface NotificationListResponse {
  success: boolean;
  notifications: NotificationResponse[];
  total: number;
  organization_id: string | null;
}

// ---------------------------------------------------------------------------
// Create params & response
// ---------------------------------------------------------------------------

/**
 * Parameters for creating an organization notification.
 *
 * Backend validation constraints (not enforced client-side):
 * - `message`: 1-5000 characters.
 * - `notificationUrl`: at most 500 characters.
 * - `expiresAt`: must be a valid ISO-8601 datetime.
 */
export interface CreateNotificationParams {
  /** The category / channel for the notification. */
  notificationTopic: OrganizationNotificationTopic;
  /** Notification message (1-5000 characters). */
  message: string;
  /** User ID to direct the notification to. Omit to send to all org members. */
  notifiedTo?: string;
  /** Deep-link URL associated with the notification (max 500 characters). */
  notificationUrl?: string;
  /** ISO-8601 datetime after which the notification should be hidden. */
  expiresAt?: string;
}

/**
 * The notification object echoed back by
 * `POST /notifications/organization` after creation.
 */
export interface CreatedNotification {
  id: string;
  organization_id: string;
  notification_topic: OrganizationNotificationTopic;
  message: string;
  notification_url?: string | null;
  created_at: string;
  notified_at: string;
  expires_at?: string | null;
  /** `true` when broadcast to all members, `false` when targeted. */
  is_broadcast: boolean;
  /** Target user id, or `null` for a broadcast notification. */
  notified_to?: string | null;
}

/**
 * Response envelope from `POST /notifications/organization`.
 */
export interface CreateNotificationResponse {
  success: boolean;
  notification: CreatedNotification;
}
