# FeedbackHub

**Feature request & voting board for indie SaaS — Canny, but $9/mo**

A modern, affordable alternative to Canny for collecting and prioritizing user feedback.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript (strict mode)
- **Database:** PostgreSQL (Drizzle ORM)
- **Styling:** TailwindCSS + Radix UI
- **Auth:** NextAuth.js v5
- **Email:** Resend

## Project Structure

```
feedbackhub/
├── apps/
│   └── web/              # Next.js 14 web application
├── packages/
│   ├── db/               # Drizzle ORM + database schema
│   └── config/           # Shared TypeScript/ESLint/Tailwind configs
└── turbo.json            # Turborepo config
```

## Getting Started

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Fill in your values
   ```

3. **Run development server:**
   ```bash
   pnpm dev
   ```

4. **Build for production:**
   ```bash
   pnpm build
   ```

## Development

- `pnpm dev` - Start development server
- `pnpm build` - Build all apps and packages
- `pnpm lint` - Run ESLint
- `pnpm test` - Run tests
- `pnpm clean` - Clean build artifacts and node_modules

## License

MIT
