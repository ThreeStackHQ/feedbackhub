import Stripe from 'stripe';

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error('Missing STRIPE_SECRET_KEY environment variable');
    }
    _stripe = new Stripe(key, {
      apiVersion: '2026-01-28.clover',
      typescript: true,
    });
  }
  return _stripe;
}

export const STRIPE_PRICES = {
  pro: process.env.STRIPE_PRICE_PRO ?? '',
  business: process.env.STRIPE_PRICE_BUSINESS ?? '',
} as const;

export type PlanTier = 'free' | 'pro' | 'business';

export const PLAN_LIMITS = {
  free: { maxBoards: 1, maxRequestsPerBoard: 100 },
  pro: { maxBoards: Infinity, maxRequestsPerBoard: Infinity },
  business: { maxBoards: Infinity, maxRequestsPerBoard: Infinity },
} satisfies Record<PlanTier, { maxBoards: number; maxRequestsPerBoard: number }>;
