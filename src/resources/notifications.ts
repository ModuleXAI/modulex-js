/**
 * Notifications resource — organization notification management endpoints.
 * @module resources/notifications
 */

import { BaseResource } from '../base';
import type { RequestOptions } from '../types';
import type {
  NotificationListResponse,
  CreateNotificationParams,
  CreateNotificationResponse,
} from '../types';

/**
 * Provides methods for the `/notifications` API endpoints.
 */
export class Notifications extends BaseResource {
  /**
   * GET /notifications
   *
   * Returns notifications for the current organization.
   */
  async list(options?: RequestOptions): Promise<NotificationListResponse> {
    return this._get<NotificationListResponse>('/notifications', options);
  }

  /**
   * POST /notifications/organization
   *
   * Creates a new notification for the organization or a specific user.
   *
   * Requires an organization context: an `X-Organization-ID` header is sent
   * automatically from the client's configured `organizationId` or from
   * `options.organizationId`. If neither is set, no header is sent and the
   * backend responds with HTTP 400 ("X-Organization-ID header is required").
   *
   * @returns The created notification wrapped in a `{ success, notification }`
   *   envelope.
   */
  async create(
    params: CreateNotificationParams,
    options?: RequestOptions,
  ): Promise<CreateNotificationResponse> {
    return this._post<CreateNotificationResponse>(
      '/notifications/organization',
      params,
      options,
    );
  }
}
