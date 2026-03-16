/**
 * Integrations resource — integration catalog and provider detail endpoints.
 * @module resources/integrations
 */

import { BaseResource } from '../base';
import type { RequestOptions } from '../types';
import type {
  BrowseParams,
  BrowseResponse,
  ToolIntegrationResponse,
  LLMProviderResponse,
  KnowledgeProviderResponse,
  IntegrationResponse,
} from '../types';

/**
 * Provides methods for the `/integrations` API endpoints.
 */
export class Integrations extends BaseResource {
  /**
   * GET /integrations/browse
   *
   * Returns the integration catalog, optionally filtered by category or type.
   */
  async browse(
    params?: BrowseParams,
    options?: RequestOptions,
  ): Promise<BrowseResponse> {
    return this._get<BrowseResponse>('/integrations/browse', {
      ...options,
      params: {
        ...options?.params,
        category: params?.category,
        type: params?.type,
        auth_type: params?.authType,
        search: params?.search,
        include_details: params?.includeDetails,
        paginate: params?.paginate,
        page: params?.page,
        page_size: params?.pageSize,
      },
    });
  }

  /**
   * GET /integrations/tools
   *
   * Returns all available tool integrations, optionally filtered by category.
   */
  async tools(
    params?: { category?: string },
    options?: RequestOptions,
  ): Promise<Record<string, unknown>> {
    return this._get<Record<string, unknown>>('/integrations/tools', {
      ...options,
      params: { ...options?.params, category: params?.category },
    });
  }

  /**
   * GET /integrations/tools/{integrationName}
   *
   * Returns the full detail for a specific tool integration including its actions.
   */
  async tool(
    integrationName: string,
    options?: RequestOptions,
  ): Promise<ToolIntegrationResponse> {
    return this._get<ToolIntegrationResponse>(
      `/integrations/tools/${integrationName}`,
      options,
    );
  }

  /**
   * GET /integrations/llm-providers
   *
   * Returns all available LLM provider integrations, optionally filtered by category.
   */
  async llmProviders(
    params?: { category?: string },
    options?: RequestOptions,
  ): Promise<Record<string, unknown>> {
    return this._get<Record<string, unknown>>('/integrations/llm-providers', {
      ...options,
      params: { ...options?.params, category: params?.category },
    });
  }

  /**
   * GET /integrations/llm-providers/{providerName}
   *
   * Returns the full detail for a specific LLM provider including available models.
   */
  async llmProvider(
    providerName: string,
    options?: RequestOptions,
  ): Promise<LLMProviderResponse> {
    return this._get<LLMProviderResponse>(
      `/integrations/llm-providers/${providerName}`,
      options,
    );
  }

  /**
   * GET /integrations/knowledge-providers
   *
   * Returns all available knowledge provider integrations.
   */
  async knowledgeProviders(
    params?: { category?: string },
    options?: RequestOptions,
  ): Promise<Record<string, unknown>> {
    return this._get<Record<string, unknown>>('/integrations/knowledge-providers', {
      ...options,
      params: { ...options?.params, category: params?.category },
    });
  }

  /**
   * GET /integrations/knowledge-providers/{providerName}
   *
   * Returns the full detail for a specific knowledge provider.
   */
  async knowledgeProvider(
    providerName: string,
    options?: RequestOptions,
  ): Promise<KnowledgeProviderResponse> {
    return this._get<KnowledgeProviderResponse>(
      `/integrations/knowledge-providers/${providerName}`,
      options,
    );
  }

  /**
   * GET /integrations/{integrationName}
   *
   * Returns the detail object for any integration by name.
   */
  async get(
    integrationName: string,
    options?: RequestOptions,
  ): Promise<IntegrationResponse> {
    return this._get<IntegrationResponse>(
      `/integrations/${integrationName}`,
      options,
    );
  }
}
