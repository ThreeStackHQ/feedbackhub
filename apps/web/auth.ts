import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { db, users, eq } from '@feedbackhub/db';
import authConfig from './auth.config';

// Validation schema for credentials
const CredentialsSchema = z.object({
  email: z.string().email('Invalid email address').max(255),
  password: z.string().min(8, 'Password must be at least 8 characters').max(100),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    // Email/Password provider (requires database)
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        // Validate input
        const result = CredentialsSchema.safeParse(credentials);
        if (!result.success) {
          return null;
        }

        const { email, password } = result.data;

        // Find user by email
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, email.toLowerCase()))
          .limit(1);

        if (!user) {
          return null;
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
          return null;
        }

        // Return user object (without password hash)
        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      },
    }),
    ...authConfig.providers,
  ],
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account, profile }) {
      // Handle GitHub OAuth sign-in
      if (account?.provider === 'github' && profile?.email) {
        const email = profile.email.toLowerCase();

        // Check if user already exists
        const [existingUser] = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        if (!existingUser) {
          // Create new user for GitHub OAuth
          // Note: password_hash is required in schema, using a placeholder for OAuth users
          const [newUser] = await db.insert(users).values({
            email,
            name: (profile.name as string) ?? (profile.login as string) ?? 'GitHub User',
            password_hash: '', // OAuth users don't have passwords
          }).returning();

          // Update user object with new ID
          if (user) {
            user.id = newUser.id;
          }
        } else {
          // Update user object with existing ID
          if (user) {
            user.id = existingUser.id;
          }
        }
      }

      return true;
    },
  },
});
