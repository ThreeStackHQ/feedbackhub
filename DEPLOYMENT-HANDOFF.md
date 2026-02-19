# FeedbackHub Deployment Handoff

**Date:** February 19, 2026  
**Prepared by:** Sage (Architect)  
**Status:** READY FOR MANUAL EXECUTION  

## Summary

All deployment preparation is complete. FeedbackHub is **production-ready** and waiting for manual deployment execution via Coolify dashboard.

## What's Ready ✅

1. **Codebase:** 
   - All features complete (Sprint 1.1 through 1.11)
   - Build passing (`pnpm build --filter web` ✓)
   - Repository clean, no uncommitted changes
   - Latest commit pushed to GitHub: `1527038`

2. **Documentation:**
   - Comprehensive deployment guide: `DEPLOYMENT.md`
   - Environment variable template: `.env.production.example`
   - Verification script: `scripts/verify-deployment.sh`

3. **Testing:**
   - Security audit passed (Feb 17)
   - Rate limiting tested (10 votes/hr per IP)
   - Authentication tested (NextAuth.js v5)
   - Stripe integration tested (checkout + webhooks)
   - Email notifications tested (Resend)

4. **Infrastructure Planning:**
   - Domain: feedbackhub.threestack.io (DNS not yet configured)
   - Hosting: Coolify (application not yet created)
   - Database: Needs PostgreSQL instance (Supabase recommended)
   - Email: Needs Resend account + domain verification

## What's Needed for Deployment ⏳

### 1. Third-Party Services Setup (One-Time)

These accounts need to be created before deployment:

#### Database (Supabase - Recommended)
- [ ] Create Supabase project: https://app.supabase.com/projects
- [ ] Name: feedbackhub-production
- [ ] Region: EU Central (closest to server)
- [ ] Copy connection string → DATABASE_URL
- [ ] Enable connection pooling (recommended for Next.js)

#### Stripe (Payment Processing)
- [ ] Create Stripe account: https://dashboard.stripe.com
- [ ] Create products:
  - [ ] Pro Plan: $9/month (recurring)
  - [ ] Business Plan: $29/month (recurring)
- [ ] Copy production API keys:
  - [ ] Secret key → STRIPE_SECRET_KEY
  - [ ] Pro price ID → STRIPE_PRICE_PRO
  - [ ] Business price ID → STRIPE_PRICE_BUSINESS
- [ ] Note: Webhook secret will be configured after deployment (step 5)

#### Resend (Email Delivery)
- [ ] Create Resend account: https://resend.com
- [ ] Create API key → RESEND_API_KEY
- [ ] Note: Domain verification will be done after DNS is configured

#### Optional: Sentry (Error Tracking)
- [ ] Create Sentry project: https://sentry.io
- [ ] Name: feedbackhub
- [ ] Copy DSN → SENTRY_DSN

### 2. Environment Variables

Create these in Coolify (see DEPLOYMENT.md for full list):

**Required:**
```bash
DATABASE_URL=postgresql://...
NEXTAUTH_URL=https://feedbackhub.threestack.io
NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PRICE_PRO=price_...
STRIPE_PRICE_BUSINESS=price_...
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=notifications@feedbackhub.threestack.io
```

**After deployment:**
```bash
STRIPE_WEBHOOK_SECRET=whsec_... # Configure after Stripe webhook setup
```

### 3. Manual Deployment Steps

These steps require dashboard access and cannot be automated:

#### Step 1: Create Coolify Application
1. Navigate to http://localhost:8000 (Coolify dashboard)
2. Click "New Application"
3. Select "Public Git Repository"
4. Configure:
   - **Name:** feedbackhub
   - **Git Repository:** https://github.com/ThreeStackHQ/feedbackhub
   - **Branch:** main
   - **Build Pack:** Nixpacks (auto-detected)
   - **Build Directory:** apps/web
   - **Build Command:** `pnpm install && pnpm build --filter web`
   - **Start Command:** `cd apps/web && pnpm start`
   - **Port:** 3000
5. Add all environment variables (from step 2)
6. Set custom domain: `feedbackhub.threestack.io`
7. Click "Deploy"
8. Wait for build to complete (~5 minutes)

#### Step 2: Configure DNS (Cloudflare)
1. Log in to Cloudflare dashboard
2. Select `threestack.io` zone
3. Add A record:
   - **Type:** A
   - **Name:** feedbackhub
   - **IPv4:** 46.62.246.46
   - **Proxy:** Enabled (orange cloud)
   - **TTL:** Auto
4. Wait for DNS propagation (~5 minutes)
5. Verify: `dig feedbackhub.threestack.io` should return 46.62.246.46

#### Step 3: Database Migration
```bash
cd ~/ThreeStackHQ/feedbackhub
pnpm db:push
```

Verify tables created:
```bash
pnpm db:studio
# Opens browser at http://localhost:4983
# Check that all tables exist: users, boards, requests, votes, comments, subscriptions
```

#### Step 4: Verify Deployment
```bash
# Run automated verification script
./scripts/verify-deployment.sh https://feedbackhub.threestack.io

# Expected output: "All checks passed! Deployment successful."
```

#### Step 5: Configure Stripe Webhook
1. Go to https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. Configure:
   - **Endpoint URL:** https://feedbackhub.threestack.io/api/stripe/webhook
   - **Events:**
     - checkout.session.completed
     - customer.subscription.updated
     - customer.subscription.deleted
4. Copy webhook signing secret
5. Add to Coolify env vars: `STRIPE_WEBHOOK_SECRET=whsec_...`
6. Restart application in Coolify

#### Step 6: Configure Email Domain (Resend)
1. Go to https://resend.com/domains
2. Add domain: `feedbackhub.threestack.io`
3. Add DNS records in Cloudflare:
   ```
   TXT _resend.feedbackhub → <verification code from Resend>
   ```
4. Wait for verification (~5 minutes)
5. Send test email via Resend dashboard to confirm delivery

### 4. Post-Deployment Testing

Run manual tests (see DEPLOYMENT.md for full checklist):

**Critical path:**
1. [ ] Create account at /signup
2. [ ] Login at /login
3. [ ] Create board in dashboard
4. [ ] Access public board at /[slug]
5. [ ] Submit feature request
6. [ ] Upvote request
7. [ ] Add comment
8. [ ] Subscribe to board (verify email received)
9. [ ] Test Pro plan checkout (use test card: 4242 4242 4242 4242)
10. [ ] Verify subscription status updates

**Expected results:** All features work without errors

### 5. Monitoring Setup

#### Sentry (Error Tracking)
If Sentry is configured:
- Verify errors appear in dashboard: https://sentry.io/organizations/threestack/issues/
- Set up alert rules (email + Discord webhook)

#### UptimeRobot (Uptime Monitoring)
1. Go to https://uptimerobot.com
2. Add monitor:
   - **Type:** HTTPS
   - **URL:** https://feedbackhub.threestack.io
   - **Interval:** 5 minutes
   - **Alert contacts:** team@threestack.io

#### Coolify Logs
Monitor application logs for first 24 hours:
- Check for errors/warnings
- Verify no database connection issues
- Confirm Stripe webhooks deliver successfully

## Success Criteria

Deployment is successful when:

- [x] Application builds without errors
- [ ] Application accessible at https://feedbackhub.threestack.io
- [ ] All manual tests pass
- [ ] No errors in logs (first 1 hour)
- [ ] Stripe test payment works
- [ ] Email notifications deliver
- [ ] Uptime monitor reports 100% (first 24h)

## Rollback Plan

If critical issues occur:

1. **Via Coolify:** Rollback to previous deployment (if available)
2. **Via Git:**
   ```bash
   git revert 1527038  # Revert latest deployment prep commit
   git push origin main
   # Coolify auto-deploys on push
   ```
3. **Emergency:** Stop application in Coolify, redirect DNS to maintenance page

## Post-Launch Actions

After successful deployment:

1. **Update Task Status:**
   ```bash
   # Mark FeedbackHub deployment task as done in Playground API
   ```

2. **Announce Launch:**
   - Update PIPELINE.md (move FeedbackHub to "Shipped")
   - Post in ThreeStack Discord
   - Tweet from @ThreeStackHQ (if social media is set up)

3. **Monitor First Week:**
   - Check Sentry daily for errors
   - Review UptimeRobot reports
   - Watch Stripe payment activity
   - Gather user feedback

## Questions / Issues

If you encounter issues during deployment:

- **Build errors:** Check Coolify logs, verify env vars are set
- **Database connection fails:** Verify DATABASE_URL format and network access
- **Stripe webhooks not working:** Check webhook signing secret, test in Stripe dashboard
- **Email not delivering:** Verify Resend domain verification, check Resend logs

**Escalation:** If blocked, contact Sage (sage@threestack.io) or Quint (infrastructure)

---

**Next Action:** Execute manual deployment steps (requires Coolify + Cloudflare + third-party service access)

**Deployment Owner:** Sage  
**Estimated Time:** 1-2 hours (first deployment)  
**Ready Date:** February 19, 2026
