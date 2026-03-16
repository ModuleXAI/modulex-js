import { Modulex, AuthenticationError } from 'modulex';

async function main() {
  // Initialize client
  const client = new Modulex({
    apiKey: process.env.MODULEX_API_KEY ?? 'mx_live_...',
    organizationId: process.env.MODULEX_ORG_ID,
  });

  try {
    // Get current user
    const me = await client.auth.me();
    console.log(`Logged in as: ${me.email} (${me.role})`);

    // List organizations
    const orgs = await client.auth.organizations();
    console.log(`Organizations: ${orgs.total}`);
    for (const org of orgs.organizations) {
      console.log(`  - ${org.name} (${org.role})`);
    }

    // List workflows
    const workflows = await client.workflows.list({
      status: 'active',
      page: 1,
      pageSize: 10,
    });
    console.log(`\nActive workflows: ${workflows.total}`);
    for (const wf of workflows.workflows) {
      console.log(`  - ${wf.name} (v${wf.version})`);
    }

    // Check system health
    const health = await client.system.health();
    console.log(`\nSystem: ${health.status} (v${health.version})`);
  } catch (error) {
    if (error instanceof AuthenticationError) {
      console.error('Invalid API key. Please check your MODULEX_API_KEY.');
    } else {
      throw error;
    }
  }
}

main();
