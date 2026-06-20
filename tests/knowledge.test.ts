import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Modulex } from '../src/client';

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('Knowledge Resource', () => {
  let mockFetch: ReturnType<typeof vi.fn>;
  let client: Modulex;

  beforeEach(() => {
    mockFetch = vi.fn();
    client = new Modulex({
      apiKey: 'mx_live_test',
      organizationId: 'org-1',
      fetch: mockFetch,
    });
  });

  // -------------------------------------------------------------------------
  // Knowledge base CRUD
  // -------------------------------------------------------------------------

  it('should list knowledge bases (bare array) with snake_case query params', async () => {
    const kbs = [{ id: 'kb-1', name: 'Docs', status: 'active' }];
    mockFetch.mockResolvedValueOnce(jsonResponse(kbs));

    const result = await client.knowledge.list({ status: 'active', limit: 10, offset: 5 });

    expect(Array.isArray(result)).toBe(true);
    expect(result[0].id).toBe('kb-1');
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toContain('/knowledge-bases');
    expect(url).toContain('status=active');
    expect(url).toContain('limit=10');
    expect(url).toContain('offset=5');
    expect(init.method).toBe('GET');
  });

  it('should create a knowledge base', async () => {
    const kb = { id: 'kb-1', name: 'Docs', status: 'active' };
    mockFetch.mockResolvedValueOnce(jsonResponse(kb));

    const result = await client.knowledge.create({
      name: 'Docs',
      embeddingConfig: { provider: 'openai', model_id: 'text-embedding-3-small', dimension: 1536 },
    });

    expect(result.name).toBe('Docs');
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toContain('/knowledge-bases');
    expect(init.method).toBe('POST');
    const body = JSON.parse(init.body);
    expect(body.name).toBe('Docs');
    // camelCase param -> snake_case on the wire
    expect(body.embedding_config).toBeDefined();
    expect(body.embedding_config.model_id).toBe('text-embedding-3-small');
  });

  it('should get aggregated stats', async () => {
    const stats = {
      knowledge_base_count: 2,
      total_documents: 10,
      total_chunks: 100,
      total_tokens: 5000,
      total_file_size_bytes: 12345,
    };
    mockFetch.mockResolvedValueOnce(jsonResponse(stats));

    const result = await client.knowledge.stats();

    expect(result.knowledge_base_count).toBe(2);
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toContain('/knowledge-bases/stats');
    expect(init.method).toBe('GET');
  });

  it('should get a single knowledge base', async () => {
    const kb = { id: 'kb-1', name: 'Docs', status: 'active' };
    mockFetch.mockResolvedValueOnce(jsonResponse(kb));

    const result = await client.knowledge.get('kb-1');

    expect(result.id).toBe('kb-1');
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toContain('/knowledge-bases/kb-1');
    expect(init.method).toBe('GET');
  });

  it('should update a knowledge base', async () => {
    const kb = { id: 'kb-1', name: 'Docs', description: 'Updated', status: 'active' };
    mockFetch.mockResolvedValueOnce(jsonResponse(kb));

    const result = await client.knowledge.update('kb-1', {
      description: 'Updated',
      chunkingConfig: { strategy: 'recursive', chunk_size: 512, chunk_overlap: 50 },
    });

    expect(result.description).toBe('Updated');
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toContain('/knowledge-bases/kb-1');
    expect(init.method).toBe('PUT');
    const body = JSON.parse(init.body);
    expect(body.description).toBe('Updated');
    expect(body.chunking_config.chunk_overlap).toBe(50);
  });

  it('should delete a knowledge base with delete_files query param', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ success: true }));

    await client.knowledge.delete('kb-1', { deleteFiles: true });

    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toContain('/knowledge-bases/kb-1');
    // camelCase param -> snake_case query param
    expect(url).toContain('delete_files=true');
    expect(init.method).toBe('DELETE');
  });

  it('should archive a knowledge base and return the KB record', async () => {
    const kb = { id: 'kb-1', name: 'Docs', status: 'archived' };
    mockFetch.mockResolvedValueOnce(jsonResponse(kb));

    const result = await client.knowledge.archive('kb-1');

    expect(result.status).toBe('archived');
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toContain('/knowledge-bases/kb-1/archive');
    expect(init.method).toBe('POST');
  });

  // -------------------------------------------------------------------------
  // Documents
  // -------------------------------------------------------------------------

  it('should list documents (bare array) with snake_case query params', async () => {
    const docs = [{ id: 'doc-1', filename: 'test.pdf', status: 'completed' }];
    mockFetch.mockResolvedValueOnce(jsonResponse(docs));

    const result = await client.knowledge.documents('kb-1', { status: 'completed', limit: 20, offset: 0 });

    expect(Array.isArray(result)).toBe(true);
    expect(result[0].id).toBe('doc-1');
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toContain('/knowledge-bases/kb-1/documents');
    expect(url).toContain('status=completed');
    expect(url).toContain('limit=20');
    expect(init.method).toBe('GET');
  });

  it('should upload a document as multipart FormData', async () => {
    const doc = { id: 'doc-1', filename: 'test.pdf', status: 'processing' };
    mockFetch.mockResolvedValueOnce(jsonResponse(doc));

    const blob = new Blob(['test content'], { type: 'application/pdf' });
    const result = await client.knowledge.uploadDocument('kb-1', {
      file: blob,
      filename: 'test.pdf',
      metadata: { department: 'engineering' },
    });

    expect(result.filename).toBe('test.pdf');
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toContain('/knowledge-bases/kb-1/documents');
    expect(init.method).toBe('POST');
    expect(init.body).toBeInstanceOf(FormData);
    expect(init.body.get('file')).toBeInstanceOf(Blob);
    expect(JSON.parse(init.body.get('metadata') as string)).toEqual({ department: 'engineering' });
  });

  it('should get a single document', async () => {
    const doc = { id: 'doc-1', knowledge_base_id: 'kb-1', filename: 'test.pdf', status: 'completed' };
    mockFetch.mockResolvedValueOnce(jsonResponse(doc));

    const result = await client.knowledge.getDocument('kb-1', 'doc-1');

    expect(result.id).toBe('doc-1');
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toContain('/knowledge-bases/kb-1/documents/doc-1');
    expect(init.method).toBe('GET');
  });

  it('should get document status', async () => {
    const status = {
      document_id: 'doc-1',
      status: 'completed',
      filename: 'test.pdf',
      file_type: 'pdf',
      chunk_count: 12,
      token_count: 3400,
    };
    mockFetch.mockResolvedValueOnce(jsonResponse(status));

    const result = await client.knowledge.documentStatus('kb-1', 'doc-1');

    expect(result.document_id).toBe('doc-1');
    expect(result.status).toBe('completed');
    expect(result.chunk_count).toBe(12);
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toContain('/knowledge-bases/kb-1/documents/doc-1/status');
    expect(init.method).toBe('GET');
  });

  it('should delete a document with delete_file query param', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ success: true }));

    await client.knowledge.deleteDocument('kb-1', 'doc-1', { deleteFile: true });

    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toContain('/knowledge-bases/kb-1/documents/doc-1');
    // camelCase param -> snake_case query param
    expect(url).toContain('delete_file=true');
    expect(init.method).toBe('DELETE');
  });

  it('should retry a document and return the document record', async () => {
    const doc = { id: 'doc-1', filename: 'test.pdf', status: 'processing' };
    mockFetch.mockResolvedValueOnce(jsonResponse(doc));

    const result = await client.knowledge.retryDocument('kb-1', 'doc-1');

    expect(result.id).toBe('doc-1');
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toContain('/knowledge-bases/kb-1/documents/doc-1/retry');
    expect(init.method).toBe('POST');
  });

  it('should list document chunks with snake_case query params', async () => {
    const chunksData = {
      chunks: [{ id: 'c1', content: 'chunk text', chunk_index: 0 }],
      count: 1,
    };
    mockFetch.mockResolvedValueOnce(jsonResponse(chunksData));

    const result = await client.knowledge.documentChunks('kb-1', 'doc-1', { limit: 50, offset: 0 });

    expect(result.count).toBe(1);
    expect(result.chunks[0].id).toBe('c1');
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toContain('/knowledge-bases/kb-1/documents/doc-1/chunks');
    expect(url).toContain('limit=50');
    expect(init.method).toBe('GET');
  });

  // -------------------------------------------------------------------------
  // Search
  // -------------------------------------------------------------------------

  it('should search a knowledge base (matches / total_matches shape)', async () => {
    const searchData = {
      query: 'test',
      knowledge_base_id: 'kb-1',
      top_k: 5,
      total_matches: 1,
      matches: [
        {
          chunk_id: 'c1',
          document_id: 'doc-1',
          document_filename: 'test.pdf',
          chunk_index: 0,
          score: 0.9,
          content: 'test',
        },
      ],
    };
    mockFetch.mockResolvedValueOnce(jsonResponse(searchData));

    const result = await client.knowledge.search('kb-1', {
      query: 'How does X work?',
      topK: 5,
      minScore: 0.5,
      includeContent: true,
    });

    expect(result.matches).toHaveLength(1);
    expect(result.matches[0].score).toBe(0.9);
    expect(result.matches[0].document_filename).toBe('test.pdf');
    expect(result.total_matches).toBe(1);
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toContain('/knowledge-bases/kb-1/search');
    expect(init.method).toBe('POST');
    const body = JSON.parse(init.body);
    // camelCase params -> snake_case on the wire
    expect(body.top_k).toBe(5);
    expect(body.min_score).toBe(0.5);
    expect(body.include_content).toBe(true);
  });

  it('should search across multiple knowledge bases', async () => {
    const searchData = {
      query: 'test',
      knowledge_base_id: '',
      top_k: 3,
      total_matches: 0,
      matches: [],
    };
    mockFetch.mockResolvedValueOnce(jsonResponse(searchData));

    const result = await client.knowledge.searchMultiple({
      knowledgeBaseIds: ['kb-1', 'kb-2'],
      query: 'test',
      topK: 3,
    });

    expect(result.total_matches).toBe(0);
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toContain('/knowledge-bases/search');
    expect(init.method).toBe('POST');
    const body = JSON.parse(init.body);
    expect(body.knowledge_base_ids).toEqual(['kb-1', 'kb-2']);
    expect(body.top_k).toBe(3);
  });

  it('should hybrid search with snake_case weight params', async () => {
    const searchData = {
      query: 'test',
      knowledge_base_id: 'kb-1',
      top_k: 5,
      total_matches: 0,
      matches: [],
    };
    mockFetch.mockResolvedValueOnce(jsonResponse(searchData));

    await client.knowledge.hybridSearch('kb-1', {
      query: 'test',
      keywordWeight: 0.3,
      semanticWeight: 0.7,
    });

    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toContain('/knowledge-bases/kb-1/hybrid-search');
    expect(init.method).toBe('POST');
    const body = JSON.parse(init.body);
    expect(body.keyword_weight).toBe(0.3);
    expect(body.semantic_weight).toBe(0.7);
  });

  // -------------------------------------------------------------------------
  // Context retrieval & metadata
  // -------------------------------------------------------------------------

  it('should retrieve context for RAG with snake_case max_tokens', async () => {
    const contextData = { context: 'Relevant context here', query: 'test' };
    mockFetch.mockResolvedValueOnce(jsonResponse(contextData));

    const result = await client.knowledge.retrieveContext('kb-1', {
      query: 'test',
      maxTokens: 2000,
    });

    expect(result.context).toBe('Relevant context here');
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toContain('/knowledge-bases/kb-1/retrieve-context');
    expect(init.method).toBe('POST');
    const body = JSON.parse(init.body);
    expect(body.max_tokens).toBe(2000);
  });

  it('should get supported file types', async () => {
    const types = {
      supported_types: ['pdf', 'docx'],
      max_file_size_bytes: 52428800,
      max_file_size_mb: 50,
    };
    mockFetch.mockResolvedValueOnce(jsonResponse(types));

    const result = await client.knowledge.supportedFileTypes();

    expect(result.supported_types).toContain('pdf');
    expect(result.max_file_size_mb).toBe(50);
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toContain('/knowledge-bases/info/supported-file-types');
    expect(init.method).toBe('GET');
  });
});
