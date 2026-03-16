import { Modulex } from 'modulex';

async function main() {
  const client = new Modulex({
    apiKey: process.env.MODULEX_API_KEY!,
    organizationId: process.env.MODULEX_ORG_ID!,
  });

  // Run an existing workflow by ID
  const run = await client.executions.run({
    workflowId: 'your-workflow-uuid',
    input: {
      messages: [{ role: 'user', content: 'Hello, summarize the latest news about AI' }],
    },
    stream: true,
  });

  console.log(`Run started: ${run.run_id}`);
  console.log(`Thread: ${run.thread_id}`);
  console.log(`Source: ${run.workflow_source}`);

  // Listen to SSE events
  for await (const event of client.executions.listen(run.run_id)) {
    switch (event.event) {
      case 'metadata':
        console.log(`Workflow: ${event.data.workflow_name} v${event.data.workflow_version}`);
        break;

      case 'node_update':
        console.log(`Node [${event.data.node_id}] ${event.data.status} (${event.data.node_type})`);
        if (event.data.status === 'completed' && event.data.execution_time_ms) {
          console.log(`  Took: ${event.data.execution_time_ms}ms`);
        }
        break;

      case 'interrupt':
        console.log(`Interrupt at node ${event.data.node_id}: ${event.data.message}`);
        // Resume with user input
        await client.executions.resume({
          workflowId: 'your-workflow-uuid',
          runId: run.run_id,
          resumeValue: 'user provided value',
        });
        break;

      case 'done':
        console.log(`\nCompleted! Steps: ${event.data.steps_executed}, Time: ${event.data.total_execution_time_ms}ms`);
        break;

      case 'error':
        console.error(`Error: ${event.data.error_message}`);
        break;
    }
  }
}

main();
