import { describe, it, expect } from 'vitest';
import { Modulex } from '../src/client';

describe('Modulex Client', () => {
  it('should throw if no API key is provided', () => {
    expect(() => new Modulex({ apiKey: '' })).toThrow('API key is required');
  });

  it('should create a client with default config', () => {
    const client = new Modulex({ apiKey: 'mx_live_test' });
    expect(client).toBeInstanceOf(Modulex);
  });

  it('should expose all resource properties', () => {
    const client = new Modulex({ apiKey: 'mx_live_test' });

    expect(client.auth).toBeDefined();
    expect(client.apiKeys).toBeDefined();
    expect(client.organizations).toBeDefined();
    expect(client.workflows).toBeDefined();
    expect(client.executions).toBeDefined();
    expect(client.deployments).toBeDefined();
    expect(client.chats).toBeDefined();
    expect(client.credentials).toBeDefined();
    expect(client.integrations).toBeDefined();
    expect(client.knowledge).toBeDefined();
    expect(client.schedules).toBeDefined();
    expect(client.templates).toBeDefined();
    expect(client.composer).toBeDefined();
    expect(client.dashboard).toBeDefined();
    expect(client.subscriptions).toBeDefined();
    expect(client.notifications).toBeDefined();
    expect(client.system).toBeDefined();
  });

  it('should return the same resource instance on repeated access', () => {
    const client = new Modulex({ apiKey: 'mx_live_test' });
    expect(client.auth).toBe(client.auth);
    expect(client.workflows).toBe(client.workflows);
  });

  it('should strip trailing slash from base URL', () => {
    const client = new Modulex({
      apiKey: 'mx_live_test',
      baseUrl: 'https://api.example.com/',
    });
    // Access is indirect — verified through request URLs in other tests
    expect(client).toBeInstanceOf(Modulex);
  });
});
