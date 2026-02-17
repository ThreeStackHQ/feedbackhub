import { NextRequest, NextResponse } from 'next/server';
import { db, requests, votes, comments } from '@feedbackhub/db';
import { eq, sql } from 'drizzle-orm';
import {
  MergeRequestsSchema,
  type MergeRequestsInput,
} from '@/lib/validation/requests';
import { requireAuth, getUserIdFromEmail, requireBoardOwnership } from '@/lib/auth';
import { AppError, NotFoundError, ValidationError } from '@/lib/errors';

/**
 * POST /api/requests/[id]/merge
 * Merge a duplicate request into a target request (admin only)
 * 
 * This will:
 * 1. Transfer all votes from source to target
 * 2. Transfer all comments from source to target
 * 3. Update target's votes_count
 * 4. Delete the source request
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sourceId } = await context.params;

    // Authenticate user
    const user = await requireAuth();
    const userId = await getUserIdFromEmail(user.email as string);

    // Parse and validate request body
    const body: unknown = await request.json();
    const data: MergeRequestsInput = MergeRequestsSchema.parse(body);
    const { targetRequestId } = data;

    // Validate: can't merge a request into itself
    if (sourceId === targetRequestId) {
      throw new ValidationError('Cannot merge a request into itself');
    }

    // Fetch both requests
    const [sourceRequest] = await db
      .select()
      .from(requests)
      .where(eq(requests.id, sourceId))
      .limit(1);

    const [targetRequest] = await db
      .select()
      .from(requests)
      .where(eq(requests.id, targetRequestId))
      .limit(1);

    if (!sourceRequest) {
      throw new NotFoundError('Source request not found');
    }

    if (!targetRequest) {
      throw new NotFoundError('Target request not found');
    }

    // Validate: both requests must be on the same board
    if (sourceRequest.board_id !== targetRequest.board_id) {
      throw new ValidationError('Cannot merge requests from different boards');
    }

    // Check if user owns the board
    await requireBoardOwnership(sourceRequest.board_id, userId);

    // Perform merge in a transaction
    await db.transaction(async (tx) => {
      // 1. Transfer votes from source to target
      await tx
        .update(votes)
        .set({ request_id: targetRequestId })
        .where(eq(votes.request_id, sourceId));

      // 2. Transfer comments from source to target
      await tx
        .update(comments)
        .set({ request_id: targetRequestId })
        .where(eq(comments.request_id, sourceId));

      // 3. Recalculate votes_count for target request
      const [{ count }] = await tx
        .select({ count: sql<number>`count(*)::int` })
        .from(votes)
        .where(eq(votes.request_id, targetRequestId));

      await tx
        .update(requests)
        .set({ 
          votes_count: count,
          updated_at: new Date(),
        })
        .where(eq(requests.id, targetRequestId));

      // 4. Delete source request (orphaned votes/comments already moved)
      await tx.delete(requests).where(eq(requests.id, sourceId));
    });

    // Fetch updated target request
    const [updatedTarget] = await db
      .select()
      .from(requests)
      .where(eq(requests.id, targetRequestId))
      .limit(1);

    return NextResponse.json({
      status: 'success',
      message: 'Requests merged successfully',
      data: { request: updatedTarget },
    });
  } catch (error) {
    return handleError(error);
  }
}

/**
 * Centralized error handler
 */
function handleError(error: unknown): NextResponse {
  console.error('API Error:', error);

  if (error instanceof AppError) {
    return NextResponse.json(
      {
        status: 'fail',
        message: error.message,
      },
      { status: error.statusCode }
    );
  }

  if (error instanceof Error && error.name === 'ZodError') {
    return NextResponse.json(
      {
        status: 'fail',
        message: 'Validation failed',
        errors: (error as any).errors,
      },
      { status: 400 }
    );
  }

  return NextResponse.json(
    {
      status: 'error',
      message: 'Internal server error',
    },
    { status: 500 }
  );
}
