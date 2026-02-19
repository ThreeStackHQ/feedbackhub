export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { getStripe, STRIPE_PRICES } from '@/lib/stripe';
import { db, subscriptions, users, eq, and } from '@feedbackhub/db';

const checkoutSchema = z.object({
  tier: z.enum(['pro', 'business']),
});

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json() as unknown;
  const result = checkoutSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: 'Invalid tier', details: result.error.flatten() },
      { status: 400 }
    );
  }

  const { tier } = result.data;
  const priceId = STRIPE_PRICES[tier];

  if (!priceId) {
    return NextResponse.json(
      { error: `Stripe price ID not configured for tier: ${tier}` },
      { status: 500 }
    );
  }

  // Look up existing user
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, session.user.email))
    .limit(1);

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Check for existing subscription to reuse Stripe customer
  const [existingSubscription] = await db
    .select({ stripe_customer_id: subscriptions.stripe_customer_id })
    .from(subscriptions)
    .where(and(eq(subscriptions.user_id, user.id), eq(subscriptions.status, 'active')))
    .limit(1);

  const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';

  const checkoutSession = await getStripe().checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    customer: existingSubscription?.stripe_customer_id ?? undefined,
    customer_email: existingSubscription?.stripe_customer_id
      ? undefined
      : session.user.email,
    metadata: { userId: user.id, tier },
    success_url: `${baseUrl}/dashboard?upgraded=true`,
    cancel_url: `${baseUrl}/pricing`,
  });

  return NextResponse.json({ url: checkoutSession.url });
}
