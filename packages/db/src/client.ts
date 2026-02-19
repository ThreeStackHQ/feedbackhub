import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

let cachedDb: PostgresJsDatabase | null = null;

function getDb(): PostgresJsDatabase {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  
  if (!cachedDb) {
    const queryClient = postgres(process.env.DATABASE_URL);
    cachedDb = drizzle(queryClient);
  }
  
  return cachedDb;
}

export const db = new Proxy({} as PostgresJsDatabase, {
  get(_, prop) {
    return getDb()[prop as keyof PostgresJsDatabase];
  }
});
