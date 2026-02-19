import { db, subscriptions, boards, eq, and } from '@feedbackhub/db';
import { PLAN_LIMITS, type PlanTier } from './stripe';

/**
 * Get the current subscription tier for a user
 */
export async function getUserTier(userId: string): Promise<PlanTier> {
  const [subscription] = await db
    .select({ tier: subscriptions.tier })
    .from(subscriptions)
    .where(and(eq(subscriptions.user_id, userId), eq(subscriptions.status, 'active')))
    .limit(1);

  return (subscription?.tier ?? 'free') as PlanTier;
}

/**
 * Check if a user can create another board based on their tier
 */
export async function canCreateBoard(userId: string): Promise<boolean> {
  const tier = await getUserTier(userId);
  const limits = PLAN_LIMITS[tier];

  if (limits.maxBoards === Infinity) return true;

  const userBoards = await db
    .select({ id: boards.id })
    .from(boards)
    .where(eq(boards.user_id, userId));

  return userBoards.length < limits.maxBoards;
}

/**
 * Get user subscription details
 */
export async function getUserSubscription(userId: string) {
  const [subscription] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.user_id, userId))
    .limit(1);

  return subscription ?? null;
}
