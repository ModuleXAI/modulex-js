/**
 * System resource — health, metrics, and timezone endpoints.
 * @module resources/system
 */

import { BaseResource } from '../base';
import type { RequestOptions } from '../types';

/**
 * Provides methods for the `/system` API endpoints.
 */
export class System extends BaseResource {
  /**
   * GET /system/health
   *
   * Returns the service health status, name, and version.
   */
  async health(
    options?: RequestOptions,
  ): Promise<{ status: string; service: string; version: string }> {
    return this._get<{ status: string; service: string; version: string }>(
      '/system/health',
      options,
    );
  }

  /**
   * GET /system/metrics
   *
   * Returns Prometheus-format metrics as plain text.
   * This endpoint bypasses the JSON-parsing logic of `BaseResource.get()` and
   * reads the raw response body as a string.
   */
  async metrics(options?: RequestOptions): Promise<string> {
    const orgId = options?.organizationId ?? this._config.organizationId;
    const url = `${this._config.baseUrl}/system/metrics`;

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this._config.apiKey}`,
    };
    if (orgId) {
      headers['X-Organization-ID'] = orgId;
    }

    const response = await this._config.fetch(url, {
      method: 'GET',
      headers,
      signal: options?.signal,
    });

    return response.text();
  }

  /**
   * GET /system/timezones
   *
   * Returns the list of supported IANA timezone identifiers.
   */
  async timezones(options?: RequestOptions): Promise<Record<string, unknown>> {
    return this._get<Record<string, unknown>>('/system/timezones', options);
  }

  /**
   * GET /system/timezones/search
   *
   * Searches supported IANA timezone identifiers by query string.
   */
  async searchTimezones(
    query: string,
    options?: RequestOptions,
  ): Promise<Record<string, unknown>> {
    return this._get<Record<string, unknown>>('/system/timezones/search', {
      ...options,
      params: { ...options?.params, q: query },
    });
  }
}
