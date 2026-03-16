/**
 * Deployments resource — workflow deployment management endpoints.
 * @module resources/deployments
 */

import { BaseResource } from '../base';
import type { RequestOptions } from '../types';
import type {
  CreateDeploymentParams,
  DeploymentListParams,
  DeploymentResponse,
  DeploymentListResponse,
  DeploymentDetailResponse,
  ActivateDeploymentResponse,
  DeactivateDeploymentResponse,
  DeleteDeploymentResponse,
} from '../types';

/**
 * Provides methods for the `/workflows/{workflowId}/deployments` API endpoints.
 */
export class Deployments extends BaseResource {
  /**
   * POST /workflows/{workflowId}/deploy
   *
   * Creates a new deployment snapshot of a workflow.
   */
  async create(
    workflowId: string,
    params?: CreateDeploymentParams,
    options?: RequestOptions,
  ): Promise<DeploymentResponse> {
    return this._post<DeploymentResponse>(
      `/workflows/${workflowId}/deploy`,
      params ?? {},
      options,
    );
  }

  /**
   * GET /workflows/{workflowId}/deployments
   *
   * Lists deployment snapshots for a workflow.
   */
  async list(
    workflowId: string,
    params?: DeploymentListParams,
    options?: RequestOptions,
  ): Promise<DeploymentListResponse> {
    return this._get<DeploymentListResponse>(
      `/workflows/${workflowId}/deployments`,
      {
        ...options,
        params: {
          ...options?.params,
          limit: params?.limit,
          offset: params?.offset,
        },
      },
    );
  }

  /**
   * GET /workflows/{workflowId}/deployments/{deploymentId}
   *
   * Returns the full deployment record including the stored workflow schema.
   */
  async get(
    workflowId: string,
    deploymentId: string,
    options?: RequestOptions,
  ): Promise<DeploymentDetailResponse> {
    return this._get<DeploymentDetailResponse>(
      `/workflows/${workflowId}/deployments/${deploymentId}`,
      options,
    );
  }

  /**
   * PUT /workflows/{workflowId}/deployments/{deploymentId}/activate
   *
   * Sets the given deployment as the live (active) version for the workflow.
   */
  async activate(
    workflowId: string,
    deploymentId: string,
    options?: RequestOptions,
  ): Promise<ActivateDeploymentResponse> {
    return this._put<ActivateDeploymentResponse>(
      `/workflows/${workflowId}/deployments/${deploymentId}/activate`,
      undefined,
      options,
    );
  }

  /**
   * DELETE /workflows/{workflowId}/deployments/live
   *
   * Deactivates the currently live deployment so no version is active.
   */
  async deactivate(
    workflowId: string,
    options?: RequestOptions,
  ): Promise<DeactivateDeploymentResponse> {
    return this._delete<DeactivateDeploymentResponse>(
      `/workflows/${workflowId}/deployments/live`,
      undefined,
      options,
    );
  }

  /**
   * DELETE /workflows/{workflowId}/deployments/{deploymentId}
   *
   * Permanently deletes a deployment snapshot.
   */
  async delete(
    workflowId: string,
    deploymentId: string,
    options?: RequestOptions,
  ): Promise<DeleteDeploymentResponse> {
    return this._delete<DeleteDeploymentResponse>(
      `/workflows/${workflowId}/deployments/${deploymentId}`,
      undefined,
      options,
    );
  }
}
