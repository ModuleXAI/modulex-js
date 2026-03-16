/**
 * Types for workflow templates and creator profiles.
 * @module types/templates
 */

import type { WorkflowDefinition, WorkflowResponse } from './workflows';

// ---------------------------------------------------------------------------
// Creator
// ---------------------------------------------------------------------------

/**
 * Public profile information for a template creator.
 */
export interface CreatorInfo {
  name: string;
  display_photo?: string | null;
  about?: string | null;
  /** Map of social platform name to profile URL. */
  socials?: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Template response
// ---------------------------------------------------------------------------

/**
 * A template record as returned by the API.
 */
export interface TemplateResponse {
  id: string;
  creator_id: string;
  creator?: CreatorInfo | null;
  name: string;
  description: string | null;
  tags: string[];
  workflow_schema: WorkflowDefinition;
  input?: Record<string, unknown> | null;
  config?: Record<string, unknown> | null;
  schema_image_url?: string | null;
  /** Sharing visibility (e.g. `"private"`, `"public"`). */
  visibility: string;
  /** Lifecycle status (e.g. `"draft"`, `"published"`). */
  status: string;
  like_count: number;
  used_count: number;
  /** Whether the authenticated user has liked this template. */
  is_liked?: boolean;
  edit_version?: number | null;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// List responses
// ---------------------------------------------------------------------------

/**
 * Response from the public template browse endpoint.
 */
export interface TemplateListResponse {
  templates: TemplateResponse[];
  /** Whether the response was served from cache. */
  cached?: boolean;
}

/**
 * Response from listing templates created by the authenticated user.
 */
export interface MyTemplatesResponse {
  templates: TemplateResponse[];
  total: number;
}

// ---------------------------------------------------------------------------
// Create / update params
// ---------------------------------------------------------------------------

/**
 * Parameters for publishing a workflow as a template.
 */
export interface CreateTemplateParams {
  /** ID of the saved workflow to publish as a template. */
  workflowId: string;
  name?: string;
  description?: string;
  tags?: string[];
  /** URL to a preview image of the workflow canvas. */
  schemaImageUrl?: string;
}

/**
 * Response from using (importing) a template into the user's workspace.
 */
export interface TemplateUseResponse {
  success: boolean;
  message: string;
  /** The newly created workflow in the user's workspace. */
  workflow: WorkflowResponse;
  used_count: number;
}

/**
 * Response from liking or un-liking a template.
 */
export interface TemplateLikeResponse {
  success: boolean;
  /** `true` if the template is now liked, `false` if the like was removed. */
  liked: boolean;
  like_count: number;
}

/**
 * Parameters for requesting an update to a published template.
 */
export interface UpdateTemplateRequestParams {
  /** ID of the updated workflow to sync into the template. */
  workflowId: string;
  name?: string;
  description?: string;
  tags?: string[];
  schemaImageUrl?: string;
}

// ---------------------------------------------------------------------------
// Creator profile
// ---------------------------------------------------------------------------

/**
 * Parameters for creating or updating a template creator profile.
 */
export interface CreateCreatorParams {
  name: string;
  about?: string;
  displayPhoto?: string;
  /** Map of social platform name to profile URL. */
  socials?: Record<string, string>;
}
