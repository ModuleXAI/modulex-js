/**
 * Types for subscription plans, billing, and payment portal management.
 * @module types/subscriptions
 */

// ---------------------------------------------------------------------------
// Plans
// ---------------------------------------------------------------------------

/**
 * A single price option for a plan (monthly or yearly).
 */
export interface PlanPrice {
  price: number;
  /** Billing interval (e.g. `"month"`, `"year"`). */
  interval: string;
  /** ISO-4217 currency code (e.g. `"usd"`). */
  currency: string;
}

/**
 * A subscription plan available to organizations.
 */
export interface Plan {
  id: string;
  name: string;
  /** Display sort order on the pricing page. */
  sort_order: number;
  is_enterprise: boolean;
  /** Discount percentage (0–100). */
  discount: number;
  prices: PlanPrice[];
  /** List of feature descriptions included in this plan. */
  features: string[];
  /** Whether the plan can be self-selected (vs. sales-only). */
  is_selectable?: boolean;
}

/**
 * Response from listing available organization plans.
 */
export interface OrganizationPlansResponse {
  plans: Plan[];
  total: number;
}

// ---------------------------------------------------------------------------
// Subscription & billing
// ---------------------------------------------------------------------------

/**
 * An active subscription record.
 */
export interface Subscription {
  id: string;
  /** Stripe/payment-provider subscription status (e.g. `"active"`, `"past_due"`). */
  status: string;
  current_period_start: string;
  current_period_end: string;
  /** Current billing interval (`"month"` or `"year"`). */
  billing_interval: string;
  current_price: number;
  created_at: string;
}

/**
 * Billing information for an organization.
 */
export interface BillingResponse {
  has_subscription: boolean;
  subscription?: Subscription;
  plan?: Plan;
}

// ---------------------------------------------------------------------------
// Checkout & portal
// ---------------------------------------------------------------------------

/**
 * Parameters for creating a Stripe Checkout session.
 */
export interface CheckoutParams {
  planId: string;
  interval: 'month' | 'year';
}

/**
 * Response from creating a Checkout session.
 */
export interface CheckoutResponse {
  /** Stripe Checkout URL — redirect the user here to complete payment. */
  url: string;
}

/**
 * Response from creating a Stripe Customer Portal session.
 */
export interface PortalResponse {
  /** Stripe Portal URL — redirect the user here to manage billing. */
  url: string;
}
