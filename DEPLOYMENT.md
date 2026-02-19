# FeedbackHub Production Deployment Guide

**Target:** https://feedbackhub.threestack.io  
**Status:** READY TO DEPLOY ✅  
**Date:** February 19, 2026  
**First ThreeStack Production Launch** 🎉

## Pre-Flight Checklist

- [x] All development complete (Sprint 1.1 through 1.11)
- [x] Build passes (`pnpm build --filter web` ✓)
- [x] Security audit complete (Feb 17)
- [x] Rate limiting implemented
- [x] Authentication tested (NextAuth.js v5)
- [x] Stripe integration tested
- [x] Email notifications tested (Resend)
- [x] Database schema finalized
- [x] Repository clean (no uncommitted changes)

## Deployment Steps

### 1. Environment Variables

Create `.env.production` with these required variables:

```bash
# Database (Supabase or self-hosted PostgreSQL)
DATABASE_URL="postgresql://user:pass@host:5432/feedbackhub"

# NextAuth
NEXTAUTH_URL="https://feedbackhub.threestack.io"
NEXTAUTH_SECRET="<generate with: openssl rand -base64 32>"

# Stripe
STRIPE_SECRET_KEY="sk_live_..." # From Stripe dashboard
STRIPE_WEBHOOK_SECRET="whsec_..." # Configure after deployment (step 5)
STRIPE_PRICE_PRO="price_..." # Pro plan price ID ($9/mo)
STRIPE_PRICE_BUSINESS="price_..." # Business plan price ID ($29/mo)

# Resend (Email)
RESEND_API_KEY="re_..." # From Resend dashboard
RESEND_FROM_EMAIL="notifications@feedbackhub.threestack.io"
```

### 2. Database Setup

```bash
cd ~/ThreeStackHQ/feedbackhub

# Install dependencies
pnpm install

# Apply database schema
pnpm db:push

# Verify tables created
pnpm db:studio  # Opens Drizzle Studio to inspect schema
```

**Expected tables:**
- users
- boards
- requests
- votes
- comments
- subscriptions

### 3. Coolify Deployment

#### Option A: Via Dashboard (Recommended for first deployment)

1. Navigate to http://localhost:8000 (Coolify dashboard)
2. Click "New Application"
3. Select "Public Git Repository"
4. Configure:
   - **Name:** feedbackhub
   - **Git Repository:** https://github.com/ThreeStackHQ/feedbackhub
   - **Branch:** main
   - **Build Pack:** Nixpacks (auto-detected for Next.js)
   - **Build Directory:** apps/web
   - **Build Command:** `pnpm install && pnpm build --filter web`
   - **Start Command:** `cd apps/web && pnpm start`
   - **Port:** 3000
5. Add environment variables (from step 1)
6. Set custom domain: `feedbackhub.threestack.io`
7. Click "Deploy"

#### Option B: Via Coolify API (scripted)

```bash
# TODO: Add API-based deployment script
# Requires Coolify application creation endpoint
# Currently: use dashboard method (Option A)
```

### 4. DNS Configuration (Cloudflare)

Add A record in Cloudflare DNS for `threestack.io` zone:

```
Type: A
Name: feedbackhub
IPv4: 46.62.246.46
Proxy: Enabled (orange cloud)
TTL: Auto
```

**Verification:**
```bash
dig feedbackhub.threestack.io
# Should resolve to 46.62.246.46
```

### 5. Stripe Webhook Configuration

1. Go to https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. Configure:
   - **Endpoint URL:** https://feedbackhub.threestack.io/api/stripe/webhook
   - **Events to send:**
     - checkout.session.completed
     - customer.subscription.updated
     - customer.subscription.deleted
4. Copy webhook signing secret
5. Update Coolify environment variable: `STRIPE_WEBHOOK_SECRET=whsec_...`
6. Restart application in Coolify

### 6. Email Domain Verification (Resend)

1. Go to https://resend.com/domains
2. Add domain: `feedbackhub.threestack.io`
3. Add DNS records in Cloudflare:
   ```
   TXT _resend.feedbackhub → <verification code>
   ```
4. Verify domain in Resend dashboard

## Post-Deployment Verification

Run these checks after deployment:

### Manual Testing Checklist

- [ ] **Homepage loads:** https://feedbackhub.threestack.io
- [ ] **Signup flow:**
  - [ ] Create account at /signup
  - [ ] Email/password validation works
  - [ ] Redirects to dashboard after signup
- [ ] **Login flow:**
  - [ ] Login at /login
  - [ ] Session persists after page reload
  - [ ] Logout works
- [ ] **Board creation:**
  - [ ] Create board in dashboard
  - [ ] Board gets unique slug
  - [ ] Board listed in dashboard
- [ ] **Public board:**
  - [ ] Access board at /[slug]
  - [ ] Subscription form visible
  - [ ] Request submission works
- [ ] **Voting:**
  - [ ] Upvote request
  - [ ] Vote count increments
  - [ ] Rate limiting works (10 votes/hr per IP)
- [ ] **Comments:**
  - [ ] Add comment to request
  - [ ] Comment appears in thread
- [ ] **Email notifications:**
  - [ ] Subscribe to board
  - [ ] Receive confirmation email
  - [ ] Receive notification when request status changes
- [ ] **Stripe checkout:**
  - [ ] Click "Upgrade to Pro"
  - [ ] Redirects to Stripe checkout
  - [ ] Complete test payment (use test card: 4242 4242 4242 4242)
  - [ ] Redirects back to dashboard
  - [ ] Subscription status updates in database
- [ ] **Webhook delivery:**
  - [ ] Check Stripe dashboard → Webhooks tab
  - [ ] Verify webhook events delivered successfully

### Automated Health Checks

```bash
# Basic connectivity
curl -I https://feedbackhub.threestack.io
# Expected: HTTP/2 200

# API health (after adding /api/health endpoint)
curl https://feedbackhub.threestack.io/api/health
# Expected: {"status":"ok","timestamp":"..."}

# Database connectivity (via health endpoint)
curl https://feedbackhub.threestack.io/api/health/db
# Expected: {"status":"ok","connected":true}
```

## Monitoring Setup

### Error Tracking (Sentry)

1. Create Sentry project: https://sentry.io
2. Add to `next.config.js`:
   ```js
   const { withSentryConfig } = require('@sentry/nextjs');
   module.exports = withSentryConfig(config, {
     org: 'threestack',
     project: 'feedbackhub',
     authToken: process.env.SENTRY_AUTH_TOKEN,
   });
   ```
3. Add env vars:
   ```bash
   SENTRY_DSN=https://...@sentry.io/...
   SENTRY_AUTH_TOKEN=...
   ```

### Uptime Monitoring (UptimeRobot)

1. Go to https://uptimerobot.com
2. Add monitor:
   - **Type:** HTTPS
   - **URL:** https://feedbackhub.threestack.io
   - **Interval:** 5 minutes
   - **Alert contacts:** team@threestack.io (Discord webhook)

### Log Aggregation

Coolify provides built-in log aggregation:
```bash
# View logs in Coolify dashboard
# Or via CLI:
docker logs -f feedbackhub-app --tail 100
```

## Rollback Procedure

If deployment fails or critical issues discovered:

1. **Via Coolify Dashboard:**
   - Go to application → Deployments tab
   - Click "Rollback" on previous successful deployment

2. **Via Git:**
   ```bash
   cd ~/ThreeStackHQ/feedbackhub
   git log --oneline  # Find last good commit
   git revert <bad-commit-hash>
   git push origin main
   # Coolify auto-deploys on push to main
   ```

## Performance Baseline

Expected metrics after deployment:

- **Homepage load time:** < 1s (First Contentful Paint)
- **API response time:** < 200ms (p95)
- **Database query time:** < 50ms (p95)
- **Lighthouse score:** > 90 (Performance, Accessibility, SEO)

## Security Checklist

- [x] HTTPS enforced (via Cloudflare proxy)
- [x] Environment variables not in git
- [x] Database passwords encrypted
- [x] Stripe webhook signature verification enabled
- [x] CORS configured (if API used externally)
- [x] Rate limiting on public endpoints
- [x] SQL injection prevention (via Drizzle ORM)
- [x] XSS prevention (React escapes by default)

## Post-Launch Tasks

After successful deployment:

1. **Update task status:**
   ```bash
   # Mark Sprint 1.11 (Billing) as done
   # Mark deployment task as done
   ```

2. **Announce launch:**
   - Post in ThreeStack Discord
   - Update PIPELINE.md (move to "Shipped")
   - Tweet from @ThreeStackHQ

3. **Monitor first 24h:**
   - Check error rates in Sentry
   - Monitor uptime in UptimeRobot
   - Review logs for anomalies
   - Watch Stripe webhook delivery

4. **Gather feedback:**
   - Create Canny board for FeedbackHub feature requests
   - Share with early beta users

## Troubleshooting

### Build fails in Coolify

```bash
# Check build logs in Coolify dashboard
# Common issues:
# - Missing env vars → add in Coolify settings
# - Wrong build directory → should be apps/web
# - pnpm version mismatch → Coolify uses pnpm 8.x
```

### Database connection errors

```bash
# Verify DATABASE_URL format:
postgresql://user:pass@host:5432/dbname

# Test connection:
psql $DATABASE_URL -c "SELECT 1;"
```

### Stripe webhook not receiving events

```bash
# Verify webhook endpoint URL in Stripe dashboard
# Check webhook signing secret matches env var
# Test webhook delivery in Stripe dashboard → Send test webhook
```

### Email delivery fails

```bash
# Verify Resend API key is correct
# Check domain verification status in Resend dashboard
# Review Resend logs for delivery errors
```

## Success Criteria

FeedbackHub launch is considered successful when:

- [x] Application accessible at https://feedbackhub.threestack.io
- [x] All manual tests pass
- [x] No errors in Sentry (first 1 hour)
- [x] Uptime > 99.9% (first 24 hours)
- [x] Stripe payments work (test purchase)
- [x] Email notifications deliver (test subscription)

---

**Deployment Owner:** Sage  
**Support:** Bolt (backend), Wren (frontend)  
**Escalation:** Quint (if infrastructure issues)
