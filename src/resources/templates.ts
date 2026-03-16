/**
 * Templates resource — workflow template and creator profile endpoints.
 * @module resources/templates
 */

import { BaseResource } from '../base';
import type { RequestOptions } from '../types';
import type {
  TemplateListResponse,
  TemplateResponse,
  MyTemplatesResponse,
  CreateTemplateParams,
  TemplateLikeResponse,
  TemplateUseResponse,
  UpdateTemplateRequestParams,
  CreateCreatorParams,
  SuccessResponse,
} from '../types';

/**
 * Provides methods for the `/templates` API endpoints.
 */
export class Templates extends BaseResource {
  /**
   * GET /templates
   *
   * Returns the public template library.
   */
  async list(options?: RequestOptions): Promise<TemplateListResponse> {
    return this._get<TemplateListResponse>('/templates', options);
  }

  /**
   * GET /templates/{templateId}
   *
   * Returns a single template including its full workflow schema.
   */
  async get(templateId: string, options?: RequestOptions): Promise<TemplateResponse> {
    return this._get<TemplateResponse>(`/templates/${templateId}`, options);
  }

  /**
   * GET /templates/me
   *
   * Returns templates created by the authenticated user.
   */
  async mine(options?: RequestOptions): Promise<MyTemplatesResponse> {
    return this._get<MyTemplatesResponse>('/templates/me', options);
  }

  /**
   * POST /templates
   *
   * Publishes a workflow as a new template.
   */
  async create(
    params: CreateTemplateParams,
    options?: RequestOptions,
  ): Promise<TemplateResponse> {
    return this._post<TemplateResponse>('/templates', params, options);
  }

  /**
   * POST /templates/{templateId}/like
   *
   * Toggles the authenticated user's like on a template.
   */
  async like(
    templateId: string,
    options?: RequestOptions,
  ): Promise<TemplateLikeResponse> {
    return this._post<TemplateLikeResponse>(
      `/templates/${templateId}/like`,
      undefined,
      options,
    );
  }

  /**
   * POST /templates/{templateId}/use
   *
   * Imports a template as a new workflow in the current organization.
   */
  async use(
    templateId: string,
    options?: RequestOptions,
  ): Promise<TemplateUseResponse> {
    return this._post<TemplateUseResponse>(
      `/templates/${templateId}/use`,
      undefined,
      options,
    );
  }

  /**
   * POST /templates/{templateId}/update-request
   *
   * Submits an update request for a published template.
   */
  async updateRequest(
    templateId: string,
    params: UpdateTemplateRequestParams,
    options?: RequestOptions,
  ): Promise<SuccessResponse> {
    return this._post<SuccessResponse>(
      `/templates/${templateId}/update-request`,
      params,
      options,
    );
  }

  /**
   * POST /templates/creators
   *
   * Creates or updates the authenticated user's template creator profile.
   */
  async createCreator(
    params: CreateCreatorParams,
    options?: RequestOptions,
  ): Promise<Record<string, unknown>> {
    return this._post<Record<string, unknown>>('/templates/creators', params, options);
  }

  /**
   * GET /templates/creators/me
   *
   * Returns the authenticated user's template creator profile.
   */
  async getCreator(options?: RequestOptions): Promise<Record<string, unknown>> {
    return this._get<Record<string, unknown>>('/templates/creators/me', options);
  }
}
