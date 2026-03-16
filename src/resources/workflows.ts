/**
 * Workflows resource — workflow CRUD and builder endpoints.
 * @module resources/workflows
 */

import { BaseResource } from '../base';
import type { RequestOptions } from '../types';
import type {
  CreateWorkflowParams,
  UpdateWorkflowParams,
  WorkflowListParams,
  WorkflowResponse,
  WorkflowListResponse,
  WorkflowSummary,
  DeleteWorkflowResponse,
  BuilderDetailsParams,
  BuilderDetailsResponse,
} from '../types';

/**
 * Provides methods for the `/workflows` API endpoints (CRUD and builder).
 */
export class Workflows extends BaseResource {
  /**
   * POST /workflows
   *
   * Creates a new workflow with the given schema.
   */
  async create(
    params: CreateWorkflowParams,
    options?: RequestOptions,
  ): Promise<WorkflowResponse> {
    return this._post<WorkflowResponse>('/workflows', params, options);
  }

  /**
   * GET /workflows
   *
   * Lists workflows in the current organization.
   */
  async list(
    params?: WorkflowListParams,
    options?: RequestOptions,
  ): Promise<WorkflowListResponse> {
    return this._get<WorkflowListResponse>('/workflows', {
      ...options,
      params: {
        ...options?.params,
        status: params?.status,
        category: params?.category,
        visibility: params?.visibility,
        search: params?.search,
        page: params?.page,
        page_size: params?.pageSize,
      },
    });
  }

  /**
   * Auto-pagination — yields all WorkflowSummary records across pages.
   *
   * Fetches page=1 with pageSize=100 and continues until all pages have been
   * exhausted or there are no more results.
   */
  async *listAll(
    params?: Omit<WorkflowListParams, 'page' | 'pageSize'>,
    options?: RequestOptions,
  ): AsyncGenerator<WorkflowSummary> {
    let page = 1;
    const pageSize = 100;

    while (true) {
      const response = await this.list({ ...params, page, pageSize }, options);

      for (const workflow of response.workflows) {
        yield workflow;
      }

      const totalPages = response.total_pages ?? Math.ceil(response.total / pageSize);
      if (page >= totalPages || response.workflows.length === 0) {
        break;
      }

      page++;
    }
  }

  /**
   * GET /workflows/{workflowId}
   *
   * Returns a full workflow object including the stored schema.
   */
  async get(workflowId: string, options?: RequestOptions): Promise<WorkflowResponse> {
    return this._get<WorkflowResponse>(`/workflows/${workflowId}`, options);
  }

  /**
   * PUT /workflows/{workflowId}
   *
   * Updates an existing workflow. Only provided fields are changed.
   */
  async update(
    workflowId: string,
    params: UpdateWorkflowParams,
    options?: RequestOptions,
  ): Promise<WorkflowResponse> {
    return this._put<WorkflowResponse>(`/workflows/${workflowId}`, params, options);
  }

  /**
   * DELETE /workflows/{workflowId}
   *
   * Soft-deletes a workflow.
   */
  async delete(
    workflowId: string,
    options?: RequestOptions,
  ): Promise<DeleteWorkflowResponse> {
    return this._delete<DeleteWorkflowResponse>(
      `/workflows/${workflowId}`,
      undefined,
      options,
    );
  }

  /**
   * GET /workflows/builder/details
   *
   * Returns available node types, integration categories, and counts for
   * the visual workflow builder. Results are cached for 60 minutes.
   */
  async builderDetails(
    params?: BuilderDetailsParams,
    options?: RequestOptions,
  ): Promise<BuilderDetailsResponse> {
    return this._get<BuilderDetailsResponse>('/workflows/builder/details', {
      ...options,
      params: {
        ...options?.params,
        node_type: params?.nodeType,
        category: params?.category,
        integration_name: params?.integrationName,
      },
    });
  }
}
