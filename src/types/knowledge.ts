/**
 * Types for knowledge base management, document ingestion, and semantic search.
 * @module types/knowledge
 */

// ---------------------------------------------------------------------------
// Embedding & chunking configuration
// ---------------------------------------------------------------------------

/**
 * Configuration for the embedding model used to vectorize documents and queries.
 *
 * The backend stores `embedding_config` as a free-form object, but the keys it
 * actually reads are `credential_id` and `model_id`. Field names here are kept
 * in snake_case to match the wire shape the embedding pipeline consumes.
 */
export interface EmbeddingConfig {
  /**
   * Credential ID for the embedding provider. This is the key the backend
   * reads (`embedding_config.credential_id`); the embedding pipeline uses it
   * to resolve provider authentication.
   */
  credential_id?: string;
  /** Provider name (e.g. `"openai"`, `"cohere"`). */
  provider?: string;
  /** Model identifier (e.g. `"text-embedding-3-small"`). */
  model_id?: string;
  /** Expected vector dimension for the model. */
  dimension?: number;
  /** Allow additional provider-specific configuration keys. */
  [key: string]: unknown;
}

/**
 * Configuration for how documents are split into chunks before indexing.
 */
export interface ChunkingConfig {
  /** Chunking strategy (e.g. `"recursive"`, `"sentence"`, `"fixed"`). */
  strategy?: string;
  /** Target token/character count per chunk. */
  chunk_size?: number;
  /**
   * Overlap in tokens/characters between consecutive chunks.
   *
   * Wire field name is `chunk_overlap` — the embedding pipeline reads this key.
   * (Previously named `overlap`, which the backend silently dropped.)
   */
  chunk_overlap?: number;
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
  /** User ID of the member who created the knowledge base. */
  created_by_user_id: string;
  /** Credential ID associated with the knowledge base, if any. */
  credential_id: string | null;
  embedding_config: EmbeddingConfig;
  chunking_config: ChunkingConfig;
  /** Number of documents in the knowledge base. Always present. */
  document_count: number;
  /** Total number of indexed chunks. Always present. */
  total_chunks: number;
  /** Total number of tokens across all chunks. Always present. */
  total_tokens: number;
  /** Lifecycle status (e.g. `"active"`, `"building"`, `"error"`). */
  status: string;
  created_at: string | null;
  updated_at: string | null;
  /** Optional aggregated statistics for the knowledge base. */
  stats?: Record<string, unknown> | null;
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
 * Aggregated statistics across all knowledge bases in an organization.
 *
 * Mirrors the backend `OrganizationStatsResponse` shape.
 */
export interface KnowledgeBaseStatsResponse {
  /** Number of knowledge bases in the organization. */
  knowledge_base_count: number;
  /** Total number of documents across all knowledge bases. */
  total_documents: number;
  /** Total number of indexed chunks across all knowledge bases. */
  total_chunks: number;
  /** Total number of tokens across all knowledge bases. */
  total_tokens: number;
  /** Combined byte size of all stored files. */
  total_file_size_bytes: number;
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
  /** Size of the source file in bytes. */
  file_size_bytes: number | null;
  /** Processing status: `"pending"`, `"processing"`, `"completed"`, or `"failed"`. */
  status: string;
  /** Number of chunks produced from this document. */
  chunk_count: number;
  /** Number of tokens across this document's chunks. */
  token_count: number;
  /** Error message if processing failed; `null` otherwise. */
  error_message: string | null;
  created_at: string | null;
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
 * Processing status of a document.
 *
 * This endpoint has no `response_model`; it returns the raw service dict.
 * `document_id`, `status`, `filename`, and `file_type` are always present.
 * The remaining fields are conditional on `status`.
 */
export interface DocumentStatusResponse {
  document_id: string;
  /** Processing status: `"pending"`, `"processing"`, `"completed"`, or `"failed"`. */
  status: string;
  filename: string;
  file_type: string;
  /** Human-readable status message. */
  message?: string;
  /** Present only when `status` is `"processing"`. */
  processing_started_at?: string | null;
  /** Present only when `status` is `"completed"`. */
  processing_completed_at?: string | null;
  /** Present only when `status` is `"completed"`. */
  chunk_count?: number;
  /** Present only when `status` is `"completed"`. */
  token_count?: number;
  /** Present only when `status` is `"failed"`. */
  error?: string | null;
}

// ---------------------------------------------------------------------------
// Chunks
// ---------------------------------------------------------------------------

/**
 * A single document chunk as returned by the chunks endpoint or a search result.
 */
export interface ChunkResponse {
  id: string;
  /** ID of the document this chunk belongs to. */
  document_id?: string;
  /** Position of this chunk within its document. */
  chunk_index?: number;
  content: string;
  /** Number of tokens in this chunk. */
  token_count?: number;
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
 * A single search match entry.
 *
 * `content` and `metadata` are present only when the request enabled
 * `includeContent` / `includeMetadata` (both default to `true`).
 */
export interface SearchMatch {
  chunk_id: string;
  document_id: string;
  /** Filename of the document the matching chunk belongs to. */
  document_filename: string;
  /** Position of the matching chunk within its document. */
  chunk_index: number;
  score: number;
  /** Chunk content; omitted when `includeContent` is `false`. */
  content?: string;
  /** Chunk metadata; omitted when `includeMetadata` is `false`. */
  metadata?: Record<string, unknown>;
}

/**
 * Response from a knowledge base search.
 *
 * Returned by `search`, `searchMultiple`, and `hybridSearch`.
 */
export interface SearchResponse {
  query: string;
  knowledge_base_id: string;
  top_k: number;
  total_matches: number;
  matches: SearchMatch[];
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
