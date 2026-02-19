export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { db, comments, requests, eq, desc } from "@feedbackhub/db";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";
import { AppError, handleError } from "@/lib/errors";

const CreateCommentSchema = z.object({
  content: z.string().min(1).max(2000),
  authorName: z.string().min(1).max(100),
  authorEmail: z.string().email(),
});

/**
 * POST /api/requests/:id/comments
 * Add a comment to a feature request
 * Rate limited: 5 comments/hour per email
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const requestId = params.id;

    // Parse body
    const body = await req.json();
    const { content, authorName, authorEmail } = CreateCommentSchema.parse(body);

    // Rate limiting (5 comments/hour per email)
    await checkRateLimit(`comment:${authorEmail}`, 5, 3600);

    // Check if request exists
    const [request] = await db.select().from(requests).where(eq(requests.id, requestId));
    if (!request) {
      throw new AppError("Request not found", 404);
    }

    // Insert comment
    const [newComment] = await db
      .insert(comments)
      .values({
        request_id: requestId,
        content,
        author_name: authorName,
        author_email: authorEmail,
        created_at: new Date(),
      })
      .returning();

    return NextResponse.json(newComment, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}

/**
 * GET /api/requests/:id/comments
 * List all comments for a feature request
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const requestId = params.id;

    // Check if request exists
    const [request] = await db.select().from(requests).where(eq(requests.id, requestId));
    if (!request) {
      throw new AppError("Request not found", 404);
    }

    // Fetch comments (newest first)
    const commentList = await db
      .select()
      .from(comments)
      .where(eq(comments.request_id, requestId))
      .orderBy(desc(comments.created_at));

    return NextResponse.json(commentList, { status: 200 });
  } catch (error) {
    return handleError(error);
  }
}
