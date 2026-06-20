# modulex-js

[![CI](https://github.com/ModuleXAI/modulex-js/actions/workflows/ci.yml/badge.svg)](https://github.com/ModuleXAI/modulex-js/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/modulex-js.svg)](https://www.npmjs.com/package/modulex-js)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/node/v/modulex-js.svg)](https://nodejs.org)

Official JavaScript/TypeScript SDK for the [ModuleX](https://modulex.dev) AI workflow orchestration platform.

- Zero runtime dependencies
- Full TypeScript support with exported types
- Dual ESM + CommonJS build
- SSE streaming for workflows, executions, composer, and assistant (incl. HITL)
- Automatic retries with exponential backoff
- 130 API endpoints across 17 resource groups

## Installation

```bash
npm install modulex-js
# or
pnpm add modulex-js
# or
yarn add modulex-js
```

## Quick Start

```typescript
import { Modulex } from 'modulex-js';

const client = new Modulex({
  apiKey: 'mx_live_...',
  organizationId: 'your-org-id',
});

// Get current user
const me = await client.auth.me();
console.log(me.email);

// List workflows
const { workflows } = await client.workflows.list({ status: 'active' });
```

### JavaScript (CommonJS)

```javascript
const { Modulex } = require('modulex-js');

const client = new Modulex({
  apiKey: process.env.MODULEX_API_KEY,
  organizationId: process.env.MODULEX_ORG_ID,
});
```

## Authentication

Create an API key from the [ModuleX dashboard](https://app.modulex.dev). API keys use the `mx_live_` prefix.

```typescript
const client = new Modulex({
  apiKey: process.env.MODULEX_API_KEY,
});
```

The `organizationId` can be set at the client level (applied to all requests) or overridden per-request:

```typescript
// Client-level default
const client = new Modulex({
  apiKey: 'mx_live_...',
  organizationId: 'default-org-id',
});

// Per-request override
const workflows = await client.workflows.list({}, {
  organizationId: 'other-org-id',
});
```

## Configuration

```typescript
const client = new Modulex({
  apiKey: 'mx_live_...',           // Required
  organizationId: 'org-uuid',      // Default org for all requests
  baseUrl: 'https://api.modulex.dev', // API base URL (default)
  timeout: 30_000,                  // Request timeout in ms (default: 30000)
  maxRetries: 3,                    // Retry count for transient errors (default: 3)
  fetch: customFetch,               // Custom fetch implementation
});
```

## Resources

### Workflows

```typescript
// List workflows
const result = await client.workflows.list({ status: 'active', page: 1, pageSize: 20 });

// Auto-paginate all workflows
for await (const workflow of client.workflows.listAll({ status: 'active' })) {
  console.log(workflow.name);
}

// Get a single workflow
const workflow = await client.workflows.get('workflow-uuid');

// Create a workflow
const created = await client.workflows.create({
  workflowSchema: { metadata: { name: 'My Workflow', version: '1.0' }, config: {}, state_schema: { fields: {} }, nodes: [], edges: [], entry_point: 'start' },
  name: 'My Workflow',
  status: 'draft',
});

// Update / Delete
await client.workflows.update('workflow-uuid', { name: 'New Name', status: 'active' });
await client.workflows.delete('workflow-uuid');
```

### Workflow Execution

```typescript
// Run a workflow
const run = await client.executions.run({
  workflowId: 'workflow-uuid',
  input: { messages: [{ role: 'user', content: 'Hello' }] },
  stream: true,
});

// Get execution state
const state = await client.executions.getState(run.thread_id);

// Resume after interrupt
await client.executions.resume({
  workflowId: 'workflow-uuid',
  runId: run.run_id,
  resumeValue: 'user input',
});

// Cancel execution
await client.executions.cancel(run.run_id, { reason: 'No longer needed' });
```

### Workflow Run History (durable)

```typescript
// List persisted runs (newest first; cursor-style has_more pagination)
const { runs, has_more } = await client.workflowRuns.list({ workflowId: 'workflow-uuid', limit: 20 });

// Full run detail — pass the run's table id (run.id), NOT the string run_id
const detail = await client.workflowRuns.get(runs[0].id);
```

### SSE Streaming

Workflow/composer/assistant streams are **data-only** — discriminate on `event.type`
(not `event.event`, which is always `"message"`). Some frames are flat
(`node_update`/`node_started`/`error`) and some are wrapped under `data`
(`metadata`/`done`/`interrupt`/`resumed`/`cancelled`).

```typescript
const run = await client.executions.run({
  workflowId: 'workflow-uuid',
  input: { messages: [{ role: 'user', content: 'Hello' }] },
  stream: true,
});

for await (const event of client.executions.listen(run.run_id)) {
  switch (event.type) {
    case 'node_update':
      console.log(`Node ${event.node} (${event.name})`, event.output); // flat
      break;
    case 'done':
      console.log(event.data.message); // wrapped
      break;
    case 'error':
      console.error(event.message); // flat
      break;
  }
}
```

### Credentials

```typescript
// List credentials
const creds = await client.credentials.list({ integrationName: 'openai' });

// Create a credential
await client.credentials.create({
  integrationName: 'openai',
  authData: { api_key: 'sk-...' },
  displayName: 'My OpenAI Key',
});

// Test a credential
const result = await client.credentials.test('credential-uuid');
console.log(result.is_valid);
```

### Knowledge Bases

```typescript
// Create a knowledge base
const kb = await client.knowledge.create({
  name: 'Docs',
  embeddingConfig: { provider: 'openai', model: 'text-embedding-3-small', dimension: 1536 },
});

// Upload a document
const doc = await client.knowledge.uploadDocument(kb.id, {
  file: new Blob([buffer], { type: 'application/pdf' }),
  filename: 'guide.pdf',
});

// Search
const results = await client.knowledge.search(kb.id, {
  query: 'How does X work?',
  topK: 5,
});
```

### Schedules

```typescript
// Create a schedule
const schedule = await client.schedules.create({
  workflowId: 'workflow-uuid',
  name: 'Daily Report',
  scheduleType: 'cron',
  cronExpression: '0 9 * * 1-5',
  timezone: 'America/New_York',
});

// Pause / Resume
await client.schedules.pause(schedule.id);
await client.schedules.resume(schedule.id);
```

### Deployments

```typescript
const deployment = await client.deployments.create('workflow-uuid', {
  deploymentNote: 'v2.0 release',
});
await client.deployments.activate('workflow-uuid', deployment.id);
```

### Composer

```typescript
const session = await client.composer.chat({
  workflowId: 'workflow-uuid',
  message: 'Add an LLM node that summarizes the input',
});

for await (const event of client.composer.listen(session.composer_chat_id, session.run_id)) {
  if (event.type === 'user_input_request') {
    // Human-in-the-loop: the agent is asking a structured question.
    const q = event.data; // UserInputRequest (discriminated on `kind`)
    await client.composer.resume(session.composer_chat_id, {
      requestId: q.request_id,
      response: { kind: 'yes_no', answer: true },
      llm: { integration_name: 'openai', provider_id: 'openai', model_id: 'gpt-4o-mini' },
    });
  }
}

// Save returns a workflow_sync payload for refreshing the canvas
const saved = await client.composer.save(session.composer_chat_id);
```

### Assistant (HITL chat agent)

```typescript
// A general chat agent with the same HITL flow as Composer, not bound to a workflow.
const chat = await client.assistant.chat({ message: 'Help me set up a GitHub integration' });

for await (const event of client.assistant.listen(chat.chat_id, chat.run_id)) {
  if (event.type === 'response_chunk') process.stdout.write(String(event.delta ?? ''));
  if (event.type === 'user_input_request') {
    await client.assistant.resume(chat.chat_id, {
      requestId: event.data.request_id,
      response: { kind: 'skipped' },
      llm: { integration_name: 'openai', provider_id: 'openai', model_id: 'gpt-4o-mini' },
    });
  }
}

const { items } = await client.assistant.list({ limit: 20 });
```

### Dashboard & Analytics

```typescript
const logs = await client.dashboard.logs({ limit: 50, category: 'CREDENTIALS' });
const overview = await client.dashboard.analyticsOverview();
const users = await client.dashboard.users({ search: 'john' });
```

### System

```typescript
// Timezone utilities (e.g. for building a schedule timezone picker)
const { popular, all_timezones } = await client.system.timezones();
const matches = await client.system.searchTimezones('Istanbul');
```

## Real-time collaboration (WebSocket)

ModuleX also runs a Socket.IO server (`modulex-ws`) for live multi-user workflow
collaboration — cursors, node locks, JSON-patch sync, and presence. **This is
intentionally out of scope for this SDK.** It uses a different transport
(Socket.IO, not REST/SSE), a different auth model (Clerk browser JWT, not the
`mx_live_` api key), and a camelCase wire format incompatible with this client's
snake_case conventions. If you need realtime collaboration, connect with a
`socket.io-client` directly; a dedicated `@modulex/realtime` package may be
provided in the future. This SDK covers the REST API and its SSE execution
streams (`executions.listen`, `workflows.listenChanges`, `composer.listen`,
`assistant.listen`).

## Error Handling

```typescript
import {
  Modulex,
  NotFoundError,
  RateLimitError,
  AuthenticationError,
  ValidationError,
} from 'modulex-js';

try {
  const workflow = await client.workflows.get('invalid-id');
} catch (error) {
  if (error instanceof NotFoundError) {
    console.log('Workflow not found');
  } else if (error instanceof RateLimitError) {
    // Rate-limit + billing errors expose structured fields parsed from the envelope
    console.log(`Rate limited (${error.code}): ${error.reason}. Retry after ${error.retryAfter}s`);
    console.log(`limit=${error.limit} remaining=${error.remaining} reset=${error.reset}`);
  } else if (error instanceof AuthenticationError) {
    console.log('Invalid API key');
  } else if (error instanceof ValidationError) {
    console.log('Validation error:', error.body);
  }
}
```

All `ModulexError` subclasses expose `.code`, `.reason`, and `.layer` when the API
returns a structured error envelope (e.g. billing/rate-limit denials), in addition
to `.status`, `.body`, and `.headers`.

The SDK automatically retries requests on transient errors (429, 500, 502, 503) with exponential backoff.

## Cancellation

Use `AbortController` to cancel any request or stream:

```typescript
const controller = new AbortController();

// Cancel after 10 seconds
setTimeout(() => controller.abort(), 10_000);

for await (const event of client.executions.listen(runId, {
  signal: controller.signal,
})) {
  console.log(event);
}
```

## TypeScript

The SDK is written in TypeScript and exports all types:

```typescript
import type {
  WorkflowDefinition,
  NodeDefinition,
  WorkflowRunParams,
  WorkflowSSEEvent,
  SSEEvent,
} from 'modulex-js';
```

## Browser Support

The SDK works in modern browsers that support `fetch`, `ReadableStream`, and `AbortController`. No Node.js-specific APIs are required for the core SDK.

## Requirements

- Node.js 18+ or modern browser
- TypeScript 5.0+ (for type definitions)

## Documentation

Full API documentation is available at [docs.modulex.dev](https://docs.modulex.dev).

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for development setup, coding guidelines, and the PR process.

## Security

To report security vulnerabilities, please see [SECURITY.md](SECURITY.md). Do **not** use public GitHub issues for security reports.

## License

[MIT](LICENSE) &copy; [ModuleX](https://modulex.dev)
