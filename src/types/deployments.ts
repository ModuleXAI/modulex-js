/**
 * Types for workflow deployment management.
 * @module types/deployments
 */

import type { WorkflowDefinition } from './workflows';

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

/**
 * Parameters for creating a deployment snapshot of a workflow.
 */
export interface CreateDeploymentParams {
  /** Human-readable release note describing what changed in this deployment. */
  deploymentNote?: string;
  /** URL to a preview image of the workflow schema canvas. */
  schemaImageUrl?: string;
}

// ---------------------------------------------------------------------------
// Deployment response shapes
// ---------------------------------------------------------------------------

/**
 * A deployment record as returned by list and summary endpoints.
 */
export interface DeploymentResponse {
  id: string;
  workflow_id: string;
  name: string;
  version: string;
  deployment_note: string | null;
  schema_image_url: string | null;
  deployed_by: string;
  created_at: string;
  /** Whether this deployment is currently the live (active) version. */
  is_live: boolean;
}

/**
 * Query parameters for listing deployments.
 */
export interface DeploymentListParams {
  limit?: number;
  offset?: number;
}

/**
 * Paginated list of deployment records.
 */
export interface DeploymentListResponse {
  deployments: DeploymentResponse[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Full deployment record including the stored workflow schema and run config.
 * Returned by the get-single-deployment endpoint.
 */
export interface DeploymentDetailResponse extends DeploymentResponse {
  /** The full workflow graph definition at the time of this deployment. */
  workflow_schema: WorkflowDefinition;
  /** Default input values stored with the deployment. */
  input: Record<string, unknown> | null;
  /** Runtime configuration stored with the deployment. */
  config: Record<string, unknown> | null;
}

// ---------------------------------------------------------------------------
// Activate / deactivate / delete
// ---------------------------------------------------------------------------

/**
 * Response from activating a deployment (making it the live version).
 */
export interface ActivateDeploymentResponse {
  success: boolean;
  message: string;
  deployment_id: string;
  /** The deployment that was previously live, if any. */
  previous_live_deployment_id: string | null;
}

/**
 * Response from deactivating the current live deployment.
 */
export interface DeactivateDeploymentResponse {
  success: boolean;
  message: string;
  /** The deployment that was deactivated. */
  previous_live_deployment_id: string;
}

/**
 * Response from deleting a deployment.
 */
export interface DeleteDeploymentResponse {
  success: boolean;
  message: string;
  deleted_deployment_id: string;
  /** Whether the deleted deployment was the live version. */
  was_live: boolean;
  /**
   * The deployment automatically promoted to live status after deletion,
   * if any (only present when `was_live` is `true`).
   */
  new_live_deployment_id: string | null;
}
