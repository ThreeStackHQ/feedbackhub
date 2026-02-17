import { NextRequest, NextResponse } from "next/server";
import { db, votes, requests, eq, and } from "@feedbackhub/db";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";
import { AppError, handleError } from "@/lib/errors";

const VoteSchema = z.object({
  email: z.string().email().optional(), // For anonymous voting
});

/**
 * POST /api/requests/:id/vote
 * Upvote a feature request (or remove upvote if already voted)
 * Rate limited: 10 votes/hour per IP
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const requestId = params.id;

    // Rate limiting (10 votes/hour per IP)
    const clientIp = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    await checkRateLimit(`vote:${clientIp}`, 10, 3600); // 10 requests per hour

    // Parse body
    const body = await req.json();
    const { email } = VoteSchema.parse(body);

    // Check if request exists
    const [request] = await db.select().from(requests).where(eq(requests.id, requestId));
    if (!request) {
      throw new AppError("Request not found", 404);
    }

    // Check if user already voted
    const existingVote = await db
      .select()
      .from(votes)
      .where(
        and(
          eq(votes.request_id, requestId),
          email ? eq(votes.email, email) : eq(votes.ip_address, clientIp)
        )
      )
      .limit(1);

    if (existingVote.length > 0) {
      // Remove vote (toggle off)
      await db.delete(votes).where(eq(votes.id, existingVote[0].id));

      // Decrement votes_count
      await db
        .update(requests)
        .set({
          votes_count: request.votes_count - 1,
          updated_at: new Date(),
        })
        .where(eq(requests.id, requestId));

      return NextResponse.json(
        { success: true, voted: false, votes: request.votes_count - 1 },
        { status: 200 }
      );
    } else {
      // Add vote
      await db.insert(votes).values({
        request_id: requestId,
        email: email || `anonymous-${clientIp}@feedbackhub.local`, // Use IP-based email for anonymous votes
        ip_address: clientIp,
        created_at: new Date(),
      });

      // Increment votes_count
      await db
        .update(requests)
        .set({
          votes_count: request.votes_count + 1,
          updated_at: new Date(),
        })
        .where(eq(requests.id, requestId));

      return NextResponse.json(
        { success: true, voted: true, votes: request.votes_count + 1 },
        { status: 201 }
      );
    }
  } catch (error) {
    return handleError(error);
  }
}
