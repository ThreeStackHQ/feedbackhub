import type { NextAuthConfig } from 'next-auth';
import GitHub from 'next-auth/providers/github';

// Edge Runtime compatible auth config (no database imports)
export default {
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      // Attach user ID to token on first sign-in
      if (user) {
        token.id = user.id;
      }
      return token;
    },

    async session({ session, token }) {
      // Attach user ID to session
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },

    authorized({ auth, request }) {
      const isLoggedIn = !!auth;
      const isAuthRoute = request.nextUrl.pathname.startsWith('/login') || 
                          request.nextUrl.pathname.startsWith('/signup');
      const isProtectedRoute = request.nextUrl.pathname.startsWith('/dashboard');

      // Allow access to auth routes
      if (isAuthRoute) {
        return true;
      }

      // Protect dashboard routes
      if (isProtectedRoute && !isLoggedIn) {
        return false;
      }

      return true;
    },
  },

  pages: {
    signIn: '/login',
    signOut: '/login',
    error: '/login',
  },

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  secret: process.env.NEXTAUTH_SECRET,
} satisfies NextAuthConfig;
