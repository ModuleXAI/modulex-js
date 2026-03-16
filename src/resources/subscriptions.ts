/**
 * Subscriptions resource — billing and subscription plan management endpoints.
 * @module resources/subscriptions
 */

import { BaseResource } from '../base';
import type { RequestOptions } from '../types';
import type {
  OrganizationPlansResponse,
  BillingResponse,
  CheckoutParams,
  CheckoutResponse,
  PortalResponse,
} from '../types';

/**
 * Provides methods for the `/subscriptions` API endpoints.
 */
export class Subscriptions extends BaseResource {
  /**
   * GET /subscriptions/organization-plans
   *
   * Returns the list of available organization subscription plans.
   */
  async organizationPlans(
    options?: RequestOptions,
  ): Promise<OrganizationPlansResponse> {
    return this._get<OrganizationPlansResponse>(
      '/subscriptions/organization-plans',
      options,
    );
  }

  /**
   * GET /subscriptions/organization-billing
   *
   * Returns the current organization's billing status and active subscription.
   */
  async billing(options?: RequestOptions): Promise<BillingResponse> {
    return this._get<BillingResponse>('/subscriptions/organization-billing', options);
  }

  /**
   * POST /subscriptions/checkout-link
   *
   * Creates a Stripe Checkout session and returns the redirect URL.
   */
  async checkoutLink(
    params: CheckoutParams,
    options?: RequestOptions,
  ): Promise<CheckoutResponse> {
    return this._post<CheckoutResponse>(
      '/subscriptions/checkout-link',
      params,
      options,
    );
  }

  /**
   * POST /subscriptions/customer-portal
   *
   * Creates a Stripe Customer Portal session and returns the redirect URL
   * for the user to manage their billing.
   */
  async customerPortal(options?: RequestOptions): Promise<PortalResponse> {
    return this._post<PortalResponse>(
      '/subscriptions/customer-portal',
      undefined,
      options,
    );
  }
}
