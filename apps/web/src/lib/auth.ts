import { getServerSession } from 'next-auth';
import { db, boards } from '@feedbackhub/db';
import { eq } from 'drizzle-orm';
import { UnauthorizedError, ForbiddenError } from './errors';

// Auth options would be imported from app/api/auth/[...nextauth]/route.ts
// For now, we'll use default getServerSession()

/**
 * Get the current authenticated user from session
 * Throws UnauthorizedError if not authenticated
 */
export async function requireAuth() {
  const session = await getServerSession();
  
  if (!session?.user?.email) {
    throw new UnauthorizedError('Authentication required');
  }
  
  return session.user;
}

/**
 * Check if the current user owns the specified board (is admin)
 * Throws ForbiddenError if user is not the board owner
 */
export async function requireBoardOwnership(boardId: string, userId: string) {
  const [board] = await db
    .select({ userId: boards.user_id })
    .from(boards)
    .where(eq(boards.id, boardId))
    .limit(1);
  
  if (!board) {
    throw new ForbiddenError('Board not found');
  }
  
  if (board.userId !== userId) {
    throw new ForbiddenError('Only board owners can perform this action');
  }
  
  return true;
}

/**
 * Get user ID from email (helper for session-based lookups)
 */
export async function getUserIdFromEmail(email: string): Promise<string> {
  const user = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.email, email),
    columns: { id: true },
  });
  
  if (!user) {
    throw new UnauthorizedError('User not found');
  }
  
  return user.id;
}
