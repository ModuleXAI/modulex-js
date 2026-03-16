import { describe, it } from 'vitest';
import { getClient, tracked, MISSING_ENV } from './setup';

describe.skipIf(MISSING_ENV)('Subscriptions', () => {
  const client = getClient();

  it('GET /subscriptions/organization-plans', async () => {
    const res = await tracked('GET', '/subscriptions/organization-plans', () =>
      client.subscriptions.organizationPlans(),
    );
    if (!Array.isArray(res.plans)) throw new Error('plans is not array');
  });

  it('GET /subscriptions/organization-billing', async () => {
    await tracked('GET', '/subscriptions/organization-billing', () =>
      client.subscriptions.billing(),
    );
  });

  // NOTE: checkoutLink and customerPortal are not tested here because they
  // create real Stripe sessions. These should be tested manually or in a
  // dedicated billing test environment.
  it('POST /subscriptions/checkout-link — skipped (creates Stripe session)', async () => {
    const { skip } = await import('./setup');
    skip('POST', '/subscriptions/checkout-link', 'Skipped — creates real Stripe session');
  });

  it('POST /subscriptions/customer-portal — skipped (creates Stripe session)', async () => {
    const { skip } = await import('./setup');
    skip('POST', '/subscriptions/customer-portal', 'Skipped — creates real Stripe session');
  });
});
