// Database client and schema exports
export * from './schema';
export { db } from './client';

// Re-export drizzle-orm utilities to ensure version consistency
export { eq, and, or, sql, desc, asc } from 'drizzle-orm';
