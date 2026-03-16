/**
 * Notifications resource — organization notification management endpoints.
 * @module resources/notifications
 */

import { BaseResource } from '../base';
import type { RequestOptions } from '../types';
import type {
  NotificationListResponse,
  CreateNotificationParams,
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
   */
  async create(
    params: CreateNotificationParams,
    options?: RequestOptions,
  ): Promise<Record<string, unknown>> {
    return this._post<Record<string, unknown>>(
      '/notifications/organization',
      params,
      options,
    );
  }
}
