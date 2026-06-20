import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Modulex } from '../src/client';

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('Integrations Resource', () => {
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

  it('should browse the catalog and map camelCase params to snake_case query', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({
        integrations: [
          {
            name: 'tavily',
            display_name: 'Tavily',
            description: 'Search',
            integration_type: 'tool',
          },
        ],
        total: 1,
        page: 1,
        page_size: 5,
        has_more: false,
      }),
    );

    const result = await client.integrations.browse({
      category: 'communication',
      type: 'tool',
      authType: 'oauth2',
      search: 'slack',
      includeDetails: true,
      paginate: true,
      page: 1,
      pageSize: 5,
    });

    // return shape read correctly
    expect(result.integrations[0].name).toBe('tavily');
    expect(result.total).toBe(1);
    expect(result.has_more).toBe(false);

    const url = mockFetch.mock.calls[0][0] as string;
    expect(mockFetch.mock.calls[0][1].method).toBe('GET');
    expect(url).toContain('/integrations/browse');
    // camelCase -> snake_case query params
    expect(url).toContain('category=communication');
    expect(url).toContain('type=tool');
    expect(url).toContain('auth_type=oauth2');
    expect(url).toContain('search=slack');
    expect(url).toContain('include_details=true');
    expect(url).toContain('paginate=true');
    expect(url).toContain('page=1');
    expect(url).toContain('page_size=5');
  });

  it('should list tool integrations as an array with a category filter', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse([
        {
          name: 'tavily',
          display_name: 'Tavily',
          description: 'Search',
          integration_type: 'tool',
        },
      ]),
    );

    const result = await client.integrations.tools({ category: 'search' });

    expect(Array.isArray(result)).toBe(true);
    expect(result[0].name).toBe('tavily');
    const url = mockFetch.mock.calls[0][0] as string;
    expect(mockFetch.mock.calls[0][1].method).toBe('GET');
    expect(url).toContain('/integrations/tools');
    expect(url).toContain('category=search');
  });

  it('should get a single tool integration detail', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({
        name: 'tavily',
        display_name: 'Tavily',
        description: 'Search',
        integration_type: 'tool',
        actions: [{ name: 'search' }],
        auth_schemas: [{ auth_type: 'api_key' }],
      }),
    );

    const result = await client.integrations.tool('tavily');

    expect(result.name).toBe('tavily');
    expect(result.actions?.[0]).toEqual({ name: 'search' });
    expect(mockFetch.mock.calls[0][1].method).toBe('GET');
    expect(mockFetch.mock.calls[0][0]).toContain('/integrations/tools/tavily');
  });

  it('should URL-encode the tool integration name', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({
        name: 'a/b',
        display_name: 'A/B',
        description: '',
        integration_type: 'tool',
      }),
    );

    await client.integrations.tool('a/b');

    expect(mockFetch.mock.calls[0][0]).toContain('/integrations/tools/a%2Fb');
  });

  it('should list LLM providers as an array', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse([
        {
          name: 'openai',
          display_name: 'OpenAI',
          description: 'LLM',
          integration_type: 'llm_provider',
        },
      ]),
    );

    const result = await client.integrations.llmProviders({ category: 'llm' });

    expect(Array.isArray(result)).toBe(true);
    expect(result[0].name).toBe('openai');
    const url = mockFetch.mock.calls[0][0] as string;
    expect(mockFetch.mock.calls[0][1].method).toBe('GET');
    expect(url).toContain('/integrations/llm-providers');
    expect(url).toContain('category=llm');
  });

  it('should get a single LLM provider detail with models', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({
        name: 'openai',
        display_name: 'OpenAI',
        description: 'LLM',
        integration_type: 'llm_provider',
        models: [{ name: 'gpt-4o' }],
        auth_schemas: [{ auth_type: 'api_key' }],
      }),
    );

    const result = await client.integrations.llmProvider('openai');

    expect(result.name).toBe('openai');
    expect(result.models?.[0]).toEqual({ name: 'gpt-4o' });
    expect(mockFetch.mock.calls[0][1].method).toBe('GET');
    expect(mockFetch.mock.calls[0][0]).toContain('/integrations/llm-providers/openai');
  });

  it('should list knowledge providers as an array', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse([
        {
          name: 'pinecone',
          display_name: 'Pinecone',
          description: 'Vector DB',
          integration_type: 'knowledge_provider',
        },
      ]),
    );

    const result = await client.integrations.knowledgeProviders();

    expect(Array.isArray(result)).toBe(true);
    expect(result[0].name).toBe('pinecone');
    expect(mockFetch.mock.calls[0][1].method).toBe('GET');
    expect(mockFetch.mock.calls[0][0]).toContain('/integrations/knowledge-providers');
  });

  it('should get a single knowledge provider detail', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({
        name: 'pinecone',
        display_name: 'Pinecone',
        description: 'Vector DB',
        integration_type: 'knowledge_provider',
        auth_schemas: [{ auth_type: 'api_key' }],
      }),
    );

    const result = await client.integrations.knowledgeProvider('pinecone');

    expect(result.name).toBe('pinecone');
    expect(mockFetch.mock.calls[0][1].method).toBe('GET');
    expect(mockFetch.mock.calls[0][0]).toContain(
      '/integrations/knowledge-providers/pinecone',
    );
  });

  it('should get a generic integration by name', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({
        name: 'openai',
        display_name: 'OpenAI',
        description: 'LLM',
        integration_type: 'llm_provider',
      }),
    );

    const result = await client.integrations.get('openai');

    expect(result.name).toBe('openai');
    expect(result.integration_type).toBe('llm_provider');
    expect(mockFetch.mock.calls[0][1].method).toBe('GET');
    expect(mockFetch.mock.calls[0][0]).toContain('/integrations/openai');
  });
});
