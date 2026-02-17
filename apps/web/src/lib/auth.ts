import { auth } from '@/auth';
import { db, boards, users, eq } from '@feedbackhub/db';
import { UnauthorizedError, ForbiddenError } from './errors';

/**
 * Get the current authenticated user from session
 * Throws UnauthorizedError if not authenticated
 */
export async function requireAuth() {
  const session = await auth();
  
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
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  
  if (!user) {
    throw new UnauthorizedError('User not found');
  }
  
  return user.id;
}
