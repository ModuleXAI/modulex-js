/**
 * Types for organization notifications.
 * @module types/notifications
 */

// ---------------------------------------------------------------------------
// Notification object
// ---------------------------------------------------------------------------

/**
 * A notification record as returned by the API.
 */
export interface NotificationResponse {
  id: string;
  organization_id: string;
  user_id: string | null;
  notification_topic: string;
  message: string;
  notification_url?: string | null;
  is_read: boolean;
  expires_at?: string | null;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// List response
// ---------------------------------------------------------------------------

/**
 * Response from listing notifications for an organization.
 */
export interface NotificationListResponse {
  success: boolean;
  notifications: NotificationResponse[];
  total: number;
  organization_id: string;
}

// ---------------------------------------------------------------------------
// Create params
// ---------------------------------------------------------------------------

/**
 * Parameters for creating an organization notification.
 */
export interface CreateNotificationParams {
  /** The category / channel for the notification. */
  notificationTopic: 'integration' | 'attention';
  message: string;
  /** User ID to direct the notification to. Omit to send to all org members. */
  notifiedTo?: string;
  /** Deep-link URL associated with the notification. */
  notificationUrl?: string;
  /** ISO-8601 datetime after which the notification should be hidden. */
  expiresAt?: string;
}
