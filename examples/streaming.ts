import { Modulex, StreamError } from 'modulex';

async function main() {
  const client = new Modulex({
    apiKey: process.env.MODULEX_API_KEY!,
    organizationId: process.env.MODULEX_ORG_ID!,
  });

  // --- Workflow execution streaming ---
  const run = await client.executions.run({
    workflowId: 'your-workflow-uuid',
    input: { messages: [{ role: 'user', content: 'Hello' }] },
    stream: true,
  });

  // With AbortController for cancellation
  const controller = new AbortController();

  // Auto-cancel after 60 seconds
  const timeout = setTimeout(() => controller.abort(), 60_000);

  try {
    for await (const event of client.executions.listen(run.run_id, {
      signal: controller.signal,
    })) {
      console.log(`[${event.event}]`, event.data);

      if (event.event === 'done' || event.event === 'error') {
        break;
      }
    }
  } catch (error) {
    if (error instanceof StreamError) {
      console.error('Stream error:', error.message);
    }
  } finally {
    clearTimeout(timeout);
  }

  // --- Composer streaming ---
  const composerRun = await client.composer.chat({
    workflowId: 'your-workflow-uuid',
    message: 'Add an LLM node that summarizes the input',
    llm: {
      integration_name: 'anthropic',
      provider_id: 'anthropic',
      model_id: 'claude-sonnet-4-20250514',
    },
  });

  for await (const event of client.composer.listen(
    composerRun.composer_chat_id,
    composerRun.run_id,
  )) {
    switch (event.event) {
      case 'response_chunk':
        process.stdout.write(String(event.data.content ?? ''));
        break;
      case 'workflow_change':
        console.log('\nWorkflow modified:', event.data);
        break;
      case 'done':
        console.log('\nComposer finished');
        break;
    }
  }

  // --- Chat list streaming ---
  for await (const event of client.chats.stream()) {
    if (event.event === 'chat_list_updated') {
      console.log('Chat list updated:', event.data);
    }
  }
}

main();
