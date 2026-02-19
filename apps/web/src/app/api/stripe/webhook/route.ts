import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getStripe } from '@/lib/stripe';
import { db, subscriptions, eq } from '@feedbackhub/db';

export const dynamic = 'force-dynamic';

type SubscriptionTier = 'free' | 'pro' | 'business';
type SubscriptionStatus = 'active' | 'inactive' | 'canceled';

function parseTierFromPriceId(sub: Stripe.Subscription): SubscriptionTier {
  const priceId = sub.items.data[0]?.price.id;
  if (priceId === process.env.STRIPE_PRICE_PRO) return 'pro';
  if (priceId === process.env.STRIPE_PRICE_BUSINESS) return 'business';
  return 'free';
}

async function upsertSubscription(
  userId: string,
  stripeCustomerId: string,
  tier: SubscriptionTier,
  status: SubscriptionStatus
) {
  const [existing] = await db
    .select({ id: subscriptions.id })
    .from(subscriptions)
    .where(eq(subscriptions.user_id, userId))
    .limit(1);

  if (existing) {
    await db
      .update(subscriptions)
      .set({ tier, status, stripe_customer_id: stripeCustomerId, updated_at: new Date() })
      .where(eq(subscriptions.user_id, userId));
  } else {
    await db.insert(subscriptions).values({
      user_id: userId,
      tier,
      status,
      stripe_customer_id: stripeCustomerId,
    });
  }
}

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET not configured');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const rawBody = await request.text();
    event = getStripe().webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Webhook signature verification failed:', message);
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;
        const userId = sub.metadata.userId;

        if (!userId) {
          console.warn('No userId in subscription metadata:', sub.id);
          break;
        }

        const isActive = sub.status === 'active' || sub.status === 'trialing';
        const tier = parseTierFromPriceId(sub);
        const status: SubscriptionStatus = isActive ? 'active' : 'inactive';

        await upsertSubscription(userId, customerId, tier, status);
        console.log(`Subscription ${event.type}: user=${userId}, tier=${tier}, status=${status}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata.userId;
        const customerId = sub.customer as string;

        if (!userId) {
          console.warn('No userId in deleted subscription metadata:', sub.id);
          break;
        }

        await upsertSubscription(userId, customerId, 'free', 'canceled');
        console.log(`Subscription canceled: user=${userId}, reset to free`);
        break;
      }

      default:
        break;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Error processing webhook event:', message);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
