/**
 * System resource — timezone utilities.
 * @module resources/system
 */

import { BaseResource } from '../base';
import type { RequestOptions } from '../types';
import type { TimezoneListResponse, TimezoneOption } from '../types';

/**
 * Provides methods for the `/system` timezone endpoints.
 */
export class System extends BaseResource {
  /**
   * GET /system/timezones
   *
   * Returns popular timezone groups plus the full list of IANA identifiers.
   */
  async timezones(options?: RequestOptions): Promise<TimezoneListResponse> {
    return this._get<TimezoneListResponse>('/system/timezones', options);
  }

  /**
   * GET /system/timezones/search
   *
   * Searches supported IANA timezones by query string. `query` must be at least
   * 2 characters (the backend returns 422 otherwise). Returns at most 20 results.
   */
  async searchTimezones(
    query: string,
    options?: RequestOptions,
  ): Promise<TimezoneOption[]> {
    return this._get<TimezoneOption[]>('/system/timezones/search', {
      ...options,
      params: { ...options?.params, q: query },
    });
  }
}
