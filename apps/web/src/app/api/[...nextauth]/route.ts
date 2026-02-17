import { handlers } from '@/auth';

// Force dynamic rendering (don't prerender at build time)
export const dynamic = 'force-dynamic';

export const { GET, POST } = handlers;
