import { describe, it } from 'vitest';
import { getClient, tracked, MISSING_ENV } from './setup';

describe.skipIf(MISSING_ENV)('Integrations', () => {
  const client = getClient();

  it('GET /integrations/browse', async () => {
    const res = await tracked('GET', '/integrations/browse', () =>
      client.integrations.browse({ page: 1, pageSize: 5 }),
    );
    if (!Array.isArray(res.integrations)) throw new Error('integrations is not array');
  });

  it('GET /integrations/tools', async () => {
    await tracked('GET', '/integrations/tools', () =>
      client.integrations.tools(),
    );
  });

  it('GET /integrations/tools/{name}', async () => {
    await tracked('GET', '/integrations/tools/tavily', () =>
      client.integrations.tool('tavily'),
    );
  });

  it('GET /integrations/llm-providers', async () => {
    await tracked('GET', '/integrations/llm-providers', () =>
      client.integrations.llmProviders(),
    );
  });

  it('GET /integrations/llm-providers/{name}', async () => {
    await tracked('GET', '/integrations/llm-providers/openai', () =>
      client.integrations.llmProvider('openai'),
    );
  });

  it('GET /integrations/knowledge-providers', async () => {
    await tracked('GET', '/integrations/knowledge-providers', () =>
      client.integrations.knowledgeProviders(),
    );
  });

  it('GET /integrations/{name} — generic', async () => {
    await tracked('GET', '/integrations/openai', () =>
      client.integrations.get('openai'),
    );
  });
});
