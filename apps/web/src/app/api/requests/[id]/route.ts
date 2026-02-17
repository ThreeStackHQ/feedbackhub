import { NextRequest, NextResponse } from 'next/server';
import { db, requests, eq } from '@feedbackhub/db';
import {
  UpdateRequestStatusSchema,
  type UpdateRequestStatusInput,
} from '@/lib/validation/requests';
import { requireAuth, getUserIdFromEmail, requireBoardOwnership } from '@/lib/auth';
import { AppError, NotFoundError } from '@/lib/errors';

/**
 * PATCH /api/requests/[id]
 * Update request status (admin only)
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    // Authenticate user
    const user = await requireAuth();
    const userId = await getUserIdFromEmail(user.email as string);

    // Parse and validate request body
    const body: unknown = await request.json();
    const data: UpdateRequestStatusInput = UpdateRequestStatusSchema.parse(body);

    // Find request and check if it exists
    const [existingRequest] = await db
      .select()
      .from(requests)
      .where(eq(requests.id, id))
      .limit(1);

    if (!existingRequest) {
      throw new NotFoundError('Request not found');
    }

    // Check if user owns the board (is admin)
    await requireBoardOwnership(existingRequest.board_id, userId);

    // Update request status
    const [updatedRequest] = await db
      .update(requests)
      .set({ 
        status: data.status,
        updated_at: new Date(),
      })
      .where(eq(requests.id, id))
      .returning();

    return NextResponse.json({
      status: 'success',
      data: { request: updatedRequest },
    });
  } catch (error) {
    return handleError(error);
  }
}

/**
 * DELETE /api/requests/[id]
 * Delete a request (admin only)
 */
export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    // Authenticate user
    const user = await requireAuth();
    const userId = await getUserIdFromEmail(user.email as string);

    // Find request and check if it exists
    const [existingRequest] = await db
      .select()
      .from(requests)
      .where(eq(requests.id, id))
      .limit(1);

    if (!existingRequest) {
      throw new NotFoundError('Request not found');
    }

    // Check if user owns the board (is admin)
    await requireBoardOwnership(existingRequest.board_id, userId);

    // Delete request (cascade will delete votes and comments)
    await db.delete(requests).where(eq(requests.id, id));

    return NextResponse.json(
      { status: 'success' },
      { status: 204 }
    );
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
