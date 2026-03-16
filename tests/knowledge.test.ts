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

  it('should create a knowledge base', async () => {
    const kb = { id: 'kb-1', name: 'Docs', status: 'active' };
    mockFetch.mockResolvedValueOnce(jsonResponse(kb));

    const result = await client.knowledge.create({
      name: 'Docs',
      embeddingConfig: { provider: 'openai', model: 'text-embedding-3-small', dimension: 1536 },
    });

    expect(result.name).toBe('Docs');
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.name).toBe('Docs');
  });

  it('should search a knowledge base', async () => {
    const searchData = { results: [{ chunk_id: 'c1', content: 'test', score: 0.9 }], query: 'test', total: 1 };
    mockFetch.mockResolvedValueOnce(jsonResponse(searchData));

    const result = await client.knowledge.search('kb-1', {
      query: 'How does X work?',
      topK: 5,
    });

    expect(result.results).toHaveLength(1);
    expect(result.results[0].score).toBe(0.9);
  });

  it('should upload a document', async () => {
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
    expect(init.body).toBeInstanceOf(FormData);
  });

  it('should hybrid search', async () => {
    const searchData = { results: [], total: 0 };
    mockFetch.mockResolvedValueOnce(jsonResponse(searchData));

    await client.knowledge.hybridSearch('kb-1', {
      query: 'test',
      keywordWeight: 0.3,
      semanticWeight: 0.7,
    });

    expect(mockFetch.mock.calls[0][0]).toContain('/knowledge-bases/kb-1/hybrid-search');
  });

  it('should retrieve context for RAG', async () => {
    const contextData = { context: 'Relevant context here', query: 'test' };
    mockFetch.mockResolvedValueOnce(jsonResponse(contextData));

    const result = await client.knowledge.retrieveContext('kb-1', {
      query: 'test',
      maxTokens: 2000,
    });

    expect(result.context).toBe('Relevant context here');
  });

  it('should get supported file types', async () => {
    const types = { supported_types: ['pdf', 'docx'], max_file_size_mb: 50 };
    mockFetch.mockResolvedValueOnce(jsonResponse(types));

    const result = await client.knowledge.supportedFileTypes();
    expect(result.supported_types).toContain('pdf');
  });
});
