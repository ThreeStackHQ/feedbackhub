import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { z } from 'zod';
import { db, boards, users, subscriptions, eq, and } from '@feedbackhub/db';
import { requireAuth } from '@/lib/auth';
import { AppError } from '@/lib/errors';
import { PLAN_LIMITS, type PlanTier } from '@/lib/stripe';

const CreateBoardSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  slug: z
    .string()
    .min(2, 'Slug must be at least 2 characters')
    .max(50, 'Slug too long')
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  description: z.string().max(500, 'Description too long').optional(),
});

async function checkBoardLimit(userId: string): Promise<boolean> {
  // Get user subscription
  const [sub] = await db
    .select({ tier: subscriptions.tier })
    .from(subscriptions)
    .where(and(eq(subscriptions.user_id, userId), eq(subscriptions.status, 'active')))
    .limit(1);

  const tier = (sub?.tier ?? 'free') as PlanTier;
  const limits = PLAN_LIMITS[tier];

  if (limits.maxBoards === Infinity) return true;

  // Count user boards
  const userBoards = await db
    .select({ id: boards.id })
    .from(boards)
    .where(eq(boards.user_id, userId));

  return userBoards.length < limits.maxBoards;
}

export async function GET() {
  try {
    const sessionUser = await requireAuth();

    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, sessionUser.email ?? ''))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userBoards = await db
      .select()
      .from(boards)
      .where(eq(boards.user_id, user.id));

    return NextResponse.json({ boards: userBoards });
  } catch (err) {
    if (err instanceof AppError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionUser = await requireAuth();

    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, sessionUser.email ?? ''))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Tier check: free users limited to 1 board
    const allowed = await checkBoardLimit(user.id);
    if (!allowed) {
      return NextResponse.json(
        {
          error: 'Board limit reached',
          message: 'Free plan is limited to 1 board. Upgrade to Pro for unlimited boards.',
          upgradeUrl: '/pricing',
        },
        { status: 403 }
      );
    }

    const body = await request.json() as unknown;
    const result = CreateBoardSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { name, slug, description } = result.data;

    // Check slug uniqueness
    const [existingBoard] = await db
      .select({ id: boards.id })
      .from(boards)
      .where(eq(boards.slug, slug))
      .limit(1);

    if (existingBoard) {
      return NextResponse.json(
        { error: 'Slug already taken', field: 'slug' },
        { status: 409 }
      );
    }

    const [newBoard] = await db
      .insert(boards)
      .values({ name, slug, description, user_id: user.id })
      .returning();

    return NextResponse.json({ board: newBoard }, { status: 201 });
  } catch (err) {
    if (err instanceof AppError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
