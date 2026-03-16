/**
 * Knowledge resource — knowledge base management, document ingestion, and search.
 * @module resources/knowledge
 */

import { BaseResource } from '../base';
import type { RequestOptions } from '../types';
import type {
  KnowledgeBaseListParams,
  KnowledgeBaseListResponse,
  CreateKnowledgeBaseParams,
  UpdateKnowledgeBaseParams,
  KnowledgeBaseResponse,
  KnowledgeBaseStatsResponse,
  SuccessResponse,
  DocumentListParams,
  UploadDocumentParams,
  DocumentResponse,
  DocumentStatusResponse,
  DocumentChunksParams,
  DocumentChunksResponse,
  SearchParams,
  MultiSearchParams,
  HybridSearchParams,
  SearchResponse,
  RetrieveContextParams,
  RetrieveContextResponse,
  SupportedFileTypesResponse,
} from '../types';

/**
 * Provides methods for the `/knowledge-bases` API endpoints.
 */
export class Knowledge extends BaseResource {
  /**
   * GET /knowledge-bases
   *
   * Lists knowledge bases for the current organization.
   */
  async list(
    params?: KnowledgeBaseListParams,
    options?: RequestOptions,
  ): Promise<KnowledgeBaseListResponse> {
    return this._get<KnowledgeBaseListResponse>('/knowledge-bases', {
      ...options,
      params: {
        ...options?.params,
        status: params?.status,
        limit: params?.limit,
        offset: params?.offset,
      },
    });
  }

  /**
   * POST /knowledge-bases
   *
   * Creates a new knowledge base.
   */
  async create(
    params: CreateKnowledgeBaseParams,
    options?: RequestOptions,
  ): Promise<KnowledgeBaseResponse> {
    return this._post<KnowledgeBaseResponse>('/knowledge-bases', params, options);
  }

  /**
   * GET /knowledge-bases/stats
   *
   * Returns aggregated statistics across all knowledge bases in the organization.
   */
  async stats(options?: RequestOptions): Promise<KnowledgeBaseStatsResponse> {
    return this._get<KnowledgeBaseStatsResponse>('/knowledge-bases/stats', options);
  }

  /**
   * GET /knowledge-bases/{kbId}
   *
   * Returns a single knowledge base record.
   */
  async get(
    knowledgeBaseId: string,
    options?: RequestOptions,
  ): Promise<KnowledgeBaseResponse> {
    return this._get<KnowledgeBaseResponse>(
      `/knowledge-bases/${knowledgeBaseId}`,
      options,
    );
  }

  /**
   * PUT /knowledge-bases/{kbId}
   *
   * Updates a knowledge base's name, description, or configuration.
   */
  async update(
    knowledgeBaseId: string,
    params: UpdateKnowledgeBaseParams,
    options?: RequestOptions,
  ): Promise<KnowledgeBaseResponse> {
    return this._put<KnowledgeBaseResponse>(
      `/knowledge-bases/${knowledgeBaseId}`,
      params,
      options,
    );
  }

  /**
   * DELETE /knowledge-bases/{kbId}
   *
   * Deletes a knowledge base. Pass `deleteFiles: true` to also remove
   * the underlying stored files.
   */
  async delete(
    knowledgeBaseId: string,
    params?: { deleteFiles?: boolean },
    options?: RequestOptions,
  ): Promise<void> {
    return this._delete<void>(
      `/knowledge-bases/${knowledgeBaseId}`,
      undefined,
      {
        ...options,
        params: {
          ...options?.params,
          delete_files: params?.deleteFiles,
        },
      },
    );
  }

  /**
   * POST /knowledge-bases/{kbId}/archive
   *
   * Archives a knowledge base, pausing ingestion without deleting data.
   */
  async archive(
    knowledgeBaseId: string,
    options?: RequestOptions,
  ): Promise<SuccessResponse> {
    return this._post<SuccessResponse>(
      `/knowledge-bases/${knowledgeBaseId}/archive`,
      undefined,
      options,
    );
  }

  /**
   * GET /knowledge-bases/{kbId}/documents
   *
   * Returns documents within a knowledge base.
   */
  async documents(
    knowledgeBaseId: string,
    params?: DocumentListParams,
    options?: RequestOptions,
  ): Promise<Record<string, unknown>> {
    return this._get<Record<string, unknown>>(
      `/knowledge-bases/${knowledgeBaseId}/documents`,
      {
        ...options,
        params: {
          ...options?.params,
          status: params?.status,
          limit: params?.limit,
          offset: params?.offset,
        },
      },
    );
  }

  /**
   * POST /knowledge-bases/{kbId}/documents — multipart upload
   *
   * Uploads a document file to a knowledge base for ingestion.
   * Builds a `FormData` with the file and optional metadata JSON.
   */
  async uploadDocument(
    knowledgeBaseId: string,
    params: UploadDocumentParams,
    options?: RequestOptions,
  ): Promise<DocumentResponse> {
    const formData = new FormData();
    formData.append('file', params.file, params.filename);
    if (params.metadata) {
      formData.append('metadata', JSON.stringify(params.metadata));
    }
    return this.upload<DocumentResponse>(
      `/knowledge-bases/${knowledgeBaseId}/documents`,
      formData,
      options,
    );
  }

  /**
   * GET /knowledge-bases/{kbId}/documents/{docId}
   *
   * Returns a single document record.
   */
  async getDocument(
    knowledgeBaseId: string,
    documentId: string,
    options?: RequestOptions,
  ): Promise<DocumentResponse> {
    return this._get<DocumentResponse>(
      `/knowledge-bases/${knowledgeBaseId}/documents/${documentId}`,
      options,
    );
  }

  /**
   * GET /knowledge-bases/{kbId}/documents/{docId}/status
   *
   * Returns the processing status and progress of a document.
   */
  async documentStatus(
    knowledgeBaseId: string,
    documentId: string,
    options?: RequestOptions,
  ): Promise<DocumentStatusResponse> {
    return this._get<DocumentStatusResponse>(
      `/knowledge-bases/${knowledgeBaseId}/documents/${documentId}/status`,
      options,
    );
  }

  /**
   * DELETE /knowledge-bases/{kbId}/documents/{docId}
   *
   * Deletes a document and its chunks from the knowledge base.
   * Pass `deleteFile: true` to also remove the source file from storage.
   */
  async deleteDocument(
    knowledgeBaseId: string,
    documentId: string,
    params?: { deleteFile?: boolean },
    options?: RequestOptions,
  ): Promise<void> {
    return this._delete<void>(
      `/knowledge-bases/${knowledgeBaseId}/documents/${documentId}`,
      undefined,
      {
        ...options,
        params: {
          ...options?.params,
          delete_file: params?.deleteFile,
        },
      },
    );
  }

  /**
   * POST /knowledge-bases/{kbId}/documents/{docId}/retry
   *
   * Retries ingestion of a failed document.
   */
  async retryDocument(
    knowledgeBaseId: string,
    documentId: string,
    options?: RequestOptions,
  ): Promise<Record<string, unknown>> {
    return this._post<Record<string, unknown>>(
      `/knowledge-bases/${knowledgeBaseId}/documents/${documentId}/retry`,
      undefined,
      options,
    );
  }

  /**
   * GET /knowledge-bases/{kbId}/documents/{docId}/chunks
   *
   * Returns the processed chunks for a document.
   */
  async documentChunks(
    knowledgeBaseId: string,
    documentId: string,
    params?: DocumentChunksParams,
    options?: RequestOptions,
  ): Promise<DocumentChunksResponse> {
    return this._get<DocumentChunksResponse>(
      `/knowledge-bases/${knowledgeBaseId}/documents/${documentId}/chunks`,
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
   * POST /knowledge-bases/{kbId}/search
   *
   * Performs a semantic search within a single knowledge base.
   */
  async search(
    knowledgeBaseId: string,
    params: SearchParams,
    options?: RequestOptions,
  ): Promise<SearchResponse> {
    return this._post<SearchResponse>(
      `/knowledge-bases/${knowledgeBaseId}/search`,
      params,
      options,
    );
  }

  /**
   * POST /knowledge-bases/search
   *
   * Searches across multiple knowledge bases simultaneously.
   */
  async searchMultiple(
    params: MultiSearchParams,
    options?: RequestOptions,
  ): Promise<SearchResponse> {
    return this._post<SearchResponse>('/knowledge-bases/search', params, options);
  }

  /**
   * POST /knowledge-bases/{kbId}/hybrid-search
   *
   * Performs a hybrid (semantic + keyword) search within a knowledge base.
   */
  async hybridSearch(
    knowledgeBaseId: string,
    params: HybridSearchParams,
    options?: RequestOptions,
  ): Promise<SearchResponse> {
    return this._post<SearchResponse>(
      `/knowledge-bases/${knowledgeBaseId}/hybrid-search`,
      params,
      options,
    );
  }

  /**
   * POST /knowledge-bases/{kbId}/retrieve-context
   *
   * Retrieves a pre-formatted context string from a knowledge base for
   * prompt injection.
   */
  async retrieveContext(
    knowledgeBaseId: string,
    params: RetrieveContextParams,
    options?: RequestOptions,
  ): Promise<RetrieveContextResponse> {
    return this._post<RetrieveContextResponse>(
      `/knowledge-bases/${knowledgeBaseId}/retrieve-context`,
      params,
      options,
    );
  }

  /**
   * GET /knowledge-bases/info/supported-file-types
   *
   * Returns the list of file types accepted by the document ingestion pipeline.
   */
  async supportedFileTypes(
    options?: RequestOptions,
  ): Promise<SupportedFileTypesResponse> {
    return this._get<SupportedFileTypesResponse>(
      '/knowledge-bases/info/supported-file-types',
      options,
    );
  }
}
