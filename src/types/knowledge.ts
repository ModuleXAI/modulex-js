/**
 * Types for knowledge base management, document ingestion, and semantic search.
 * @module types/knowledge
 */

// ---------------------------------------------------------------------------
// Embedding & chunking configuration
// ---------------------------------------------------------------------------

/**
 * Configuration for the embedding model used to vectorize documents and queries.
 */
export interface EmbeddingConfig {
  /** Credential ID for the embedding provider. */
  provider_credential_id?: string;
  /** Provider name (e.g. `"openai"`, `"cohere"`). */
  provider?: string;
  /** Model identifier (e.g. `"text-embedding-3-small"`). */
  model?: string;
  /** Expected vector dimension for the model. */
  dimension?: number;
}

/**
 * Configuration for how documents are split into chunks before indexing.
 */
export interface ChunkingConfig {
  /** Chunking strategy (e.g. `"recursive"`, `"sentence"`, `"fixed"`). */
  strategy?: string;
  /** Target token/character count per chunk. */
  chunk_size?: number;
  /** Overlap in tokens/characters between consecutive chunks. */
  overlap?: number;
  /** Custom separator strings used by recursive/sentence strategies. */
  separators?: string[];
}

// ---------------------------------------------------------------------------
// Knowledge base CRUD
// ---------------------------------------------------------------------------

/**
 * Parameters for creating a new knowledge base.
 */
export interface CreateKnowledgeBaseParams {
  name: string;
  description?: string;
  /** Embedding model configuration for this knowledge base. */
  embeddingConfig?: EmbeddingConfig;
  /** Chunking strategy configuration for ingested documents. */
  chunkingConfig?: ChunkingConfig;
}

/**
 * Parameters for updating an existing knowledge base.
 * All fields are optional; only provided fields are updated.
 */
export interface UpdateKnowledgeBaseParams {
  name?: string;
  description?: string;
  embeddingConfig?: EmbeddingConfig;
  chunkingConfig?: ChunkingConfig;
  /** Lifecycle status (e.g. `"active"`, `"paused"`). */
  status?: string;
}

/**
 * A knowledge base record as returned by the API.
 */
export interface KnowledgeBaseResponse {
  id: string;
  name: string;
  description: string | null;
  organization_id: string;
  embedding_config: EmbeddingConfig;
  chunking_config: ChunkingConfig;
  /** Lifecycle status (e.g. `"active"`, `"building"`, `"error"`). */
  status: string;
  document_count?: number;
  total_chunks?: number;
  created_at: string;
  updated_at: string;
}

/**
 * Query parameters for listing knowledge bases.
 */
export interface KnowledgeBaseListParams {
  status?: string;
  limit?: number;
  offset?: number;
}

/**
 * Paginated list of knowledge bases.
 */
export interface KnowledgeBaseListResponse {
  knowledge_bases: KnowledgeBaseResponse[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Aggregated statistics across all knowledge bases in an organization.
 * The shape is extensible; provider-specific fields may be present.
 */
export interface KnowledgeBaseStatsResponse {
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Documents
// ---------------------------------------------------------------------------

/**
 * A document record as returned by the API.
 */
export interface DocumentResponse {
  id: string;
  knowledge_base_id: string;
  filename: string;
  file_type: string;
  file_size: number;
  /** Processing status (e.g. `"pending"`, `"processing"`, `"ready"`, `"error"`). */
  status: string;
  metadata?: Record<string, unknown>;
  chunk_count?: number;
  created_at: string;
  updated_at: string;
}

/**
 * Query parameters for listing documents within a knowledge base.
 */
export interface DocumentListParams {
  status?: string;
  limit?: number;
  offset?: number;
}

/**
 * Parameters for uploading a document to a knowledge base.
 */
export interface UploadDocumentParams {
  /** File content as a Blob or File object. */
  file: Blob | File;
  /** Override the filename stored with the document. */
  filename?: string;
  /** Arbitrary metadata to associate with the document. */
  metadata?: Record<string, unknown>;
}

/**
 * Status and progress of a document being processed.
 */
export interface DocumentStatusResponse {
  status: string;
  /** Processing progress as a fraction (0–1). */
  progress?: number;
  error?: string;
}

// ---------------------------------------------------------------------------
// Chunks
// ---------------------------------------------------------------------------

/**
 * A single document chunk as returned by the chunks endpoint or a search result.
 */
export interface ChunkResponse {
  id: string;
  content: string;
  metadata?: Record<string, unknown>;
  /** Similarity score (0–1). Present only in search results. */
  score?: number;
}

/**
 * Query parameters for listing chunks within a document.
 */
export interface DocumentChunksParams {
  limit?: number;
  offset?: number;
}

/**
 * Response from the document chunks endpoint.
 */
export interface DocumentChunksResponse {
  chunks: ChunkResponse[];
  count: number;
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

/**
 * Parameters for semantic search within a single knowledge base.
 */
export interface SearchParams {
  query: string;
  topK?: number;
  minScore?: number;
  filters?: Record<string, unknown>;
  includeContent?: boolean;
  includeMetadata?: boolean;
}

/**
 * A single search result entry.
 */
export interface SearchResult {
  chunk_id: string;
  content: string;
  score: number;
  metadata: Record<string, unknown>;
  document_id: string;
}

/**
 * Response from a knowledge base search.
 */
export interface SearchResponse {
  results: SearchResult[];
  query: string;
  total: number;
}

/**
 * Parameters for searching across multiple knowledge bases simultaneously.
 */
export interface MultiSearchParams {
  knowledgeBaseIds: string[];
  query: string;
  topK?: number;
  minScore?: number;
}

/**
 * Parameters for hybrid (semantic + keyword) search within a knowledge base.
 */
export interface HybridSearchParams {
  query: string;
  topK?: number;
  /** Relative weight given to keyword matching (0–1). */
  keywordWeight?: number;
  /** Relative weight given to semantic similarity (0–1). */
  semanticWeight?: number;
  minScore?: number;
  filters?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Context retrieval
// ---------------------------------------------------------------------------

/**
 * Parameters for retrieving a pre-formatted context string from a knowledge base.
 */
export interface RetrieveContextParams {
  query: string;
  /** Maximum token budget for the returned context string. */
  maxTokens?: number;
  topK?: number;
  minScore?: number;
}

/**
 * Response from the context retrieval endpoint.
 */
export interface RetrieveContextResponse {
  /** Pre-formatted context string suitable for injection into a prompt. */
  context: string;
  query: string;
}

// ---------------------------------------------------------------------------
// Supported file types
// ---------------------------------------------------------------------------

/**
 * Response listing the file types accepted by the document ingestion pipeline.
 */
export interface SupportedFileTypesResponse {
  supported_types: string[];
  max_file_size_bytes: number;
  max_file_size_mb: number;
}
