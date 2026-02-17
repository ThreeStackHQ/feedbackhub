import { NextRequest, NextResponse } from 'next/server';
import { db, boards, requests } from '@feedbackhub/db';
import { eq, and, desc, asc, sql } from 'drizzle-orm';
import {
  CreateRequestSchema,
  ListRequestsQuerySchema,
  type CreateRequestInput,
  type ListRequestsQuery,
} from '@/lib/validation/requests';
import { AppError, NotFoundError, ValidationError } from '@/lib/errors';

/**
 * GET /api/boards/[slug]/requests
 * List all requests for a board with optional filters
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    
    // Parse and validate query parameters
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());
    const query: ListRequestsQuery = ListRequestsQuerySchema.parse(queryParams);

    // Find board by slug
    const [board] = await db
      .select({ id: boards.id })
      .from(boards)
      .where(eq(boards.slug, slug))
      .limit(1);

    if (!board) {
      throw new NotFoundError('Board not found');
    }

    // Build query with filters
    let whereConditions = [eq(requests.board_id, board.id)];

    if (query.status) {
      whereConditions.push(eq(requests.status, query.status));
    }

    if (query.category) {
      whereConditions.push(eq(requests.category, query.category));
    }

    // Determine sort order
    let orderBy;
    switch (query.sort) {
      case 'votes':
        orderBy = desc(requests.votes_count);
        break;
      case 'recent':
        orderBy = desc(requests.created_at);
        break;
      case 'oldest':
        orderBy = asc(requests.created_at);
        break;
      default:
        orderBy = desc(requests.votes_count);
    }

    // Fetch requests
    const requestsList = await db
      .select()
      .from(requests)
      .where(and(...whereConditions))
      .orderBy(orderBy)
      .limit(query.limit)
      .offset(query.offset);

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(requests)
      .where(and(...whereConditions));

    return NextResponse.json({
      status: 'success',
      data: {
        requests: requestsList,
        total: count,
        limit: query.limit,
        offset: query.offset,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}

/**
 * POST /api/boards/[slug]/requests
 * Create a new feature request on a board
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;

    // Parse and validate request body
    const body: unknown = await request.json();
    const data: CreateRequestInput = CreateRequestSchema.parse(body);

    // Find board by slug
    const [board] = await db
      .select({ id: boards.id })
      .from(boards)
      .where(eq(boards.slug, slug))
      .limit(1);

    if (!board) {
      throw new NotFoundError('Board not found');
    }

    // Create request
    const [newRequest] = await db
      .insert(requests)
      .values({
        board_id: board.id,
        title: data.title,
        description: data.description,
        category: data.category,
        status: 'open',
        votes_count: 0,
      })
      .returning();

    return NextResponse.json(
      {
        status: 'success',
        data: { request: newRequest },
      },
      { status: 201 }
    );
  } catch (error) {
    return handleError(error);
  }
}

/**
 * Centralized error handler for this route
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
