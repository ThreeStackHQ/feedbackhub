# FeedbackHub Production Deployment Plan

## Status: READY FOR DEPLOYMENT ✅

All code complete. Sprint 1 (1.1-1.11) done. Stripe billing integrated and merged to main.

---

## Prerequisites Checklist

- [x] Code complete (Sprint 1.1-1.11)
- [x] Stripe billing integrated (feat/stripe-billing merged)
- [x] bcryptjs dependency fixed
- [ ] PostgreSQL database provisioned
- [ ] Environment variables configured
- [ ] Build passing with DATABASE_URL set
- [ ] DNS configured
- [ ] Monitoring set up

---

## Step 1: Database Setup

### Option A: Supabase (Recommended)
1. Create new Supabase project: `feedbackhub-prod`
2. Copy PostgreSQL connection string
3. Run migrations: `pnpm db:push`

### Option B: Self-Hosted PostgreSQL
1. Create database: `createdb feedbackhub_production`
2. Set DATABASE_URL: `postgresql://user:pass@host:5432/feedbackhub_production`
3. Run migrations: `pnpm db:push`

---

## Step 2: Environment Variables

Create `.env.production` in `apps/web/`:

```bash
# Database
DATABASE_URL="postgresql://..."

# NextAuth
NEXTAUTH_SECRET="<generate with: openssl rand -base64 32>"
NEXTAUTH_URL="https://feedbackhub.threestack.io"

# Stripe
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PRICE_PRO="price_..."
STRIPE_PRICE_BUSINESS="price_..."

# App
NODE_ENV="production"
PORT=3003
```

### Get Stripe Keys:
1. Stripe Dashboard → Developers → API keys
2. Create webhook endpoint: `https://feedbackhub.threestack.io/api/stripe/webhook`
3. Subscribe to events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
4. Copy webhook secret

---

## Step 3: Build

```bash
cd /home/quint/feedbackhub
export DATABASE_URL="postgresql://..."  # Set before build
pnpm install
pnpm build --filter web
```

**Expected Output:** Build completes successfully, no webpack errors.

---

## Step 4: Deploy to Server

### Using PM2:

```bash
cd /home/quint/feedbackhub/apps/web

# Start with PM2
pm2 start npm --name "feedbackhub" -- start
pm2 startup  # Enable auto-restart
pm2 save
```

### Using systemd:

Create `/etc/systemd/system/feedbackhub.service`:

```ini
[Unit]
Description=FeedbackHub Production
After=network.target

[Service]
Type=simple
User=quint
WorkingDirectory=/home/quint/feedbackhub/apps/web
Environment=NODE_ENV=production
ExecStart=/home/quint/.local/share/pnpm/pnpm start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable feedbackhub
sudo systemctl start feedbackhub
sudo systemctl status feedbackhub
```

---

## Step 5: Reverse Proxy (Coolify or Nginx)

### Nginx Config:

```nginx
server {
    listen 80;
    server_name feedbackhub.threestack.io;

    location / {
        proxy_pass http://localhost:3003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## Step 6: DNS Configuration

**Cloudflare DNS:**
- Type: A
- Name: feedbackhub
- IPv4: 46.62.246.46
- Proxy: ON (orange cloud)
- SSL/TLS: Full (strict)

**Propagation:** Wait 1-5 minutes, then test: `https://feedbackhub.threestack.io`

---

## Step 7: Test Production

### Manual Tests:
1. Visit `https://feedbackhub.threestack.io`
2. Sign up with new account
3. Create a board (should succeed on Free tier)
4. Create a 2nd board (should hit tier limit: 1 board max on Free)
5. Create request on board
6. Vote on request
7. Add comment
8. Visit `/pricing` → Click "Upgrade to Pro"
9. Complete Stripe checkout (use test card: `4242 4242 4242 4242`)
10. Verify subscription shows "Pro" in settings
11. Create 2nd board (should now succeed)

### Expected Results:
- ✅ Auth flow works (signup/login)
- ✅ Free tier enforced (1 board limit)
- ✅ Stripe checkout functional
- ✅ Pro tier unlocked after payment
- ✅ All CRUD operations work

---

## Step 8: Monitoring

### Add to UptimeRobot:
- URL: `https://feedbackhub.threestack.io`
- Type: HTTP(S)
- Check interval: 5 minutes
- Alert: Email/Discord on downtime

### Error Tracking (Optional):
```bash
pnpm add @sentry/nextjs
# Configure Sentry DSN in .env
```

---

## Step 9: Stripe Webhook Verification

After deployment, verify webhook is receiving events:
1. Stripe Dashboard → Webhooks
2. Click your endpoint
3. Send test event: `checkout.session.completed`
4. Verify: 200 OK response, no errors

---

## Step 10: Update Project Status

```bash
curl -X PATCH https://api.codevier.com/api/playground/projects/3a1179a2-5dc1-473d-9c4f-e579ce7b5ee4 \
  -H "Content-Type: application/json" \
  -d '{"status": "shipped", "demoUrl": "https://feedbackhub.threestack.io"}'
```

---

## Rollback Plan

If deployment fails:
1. `pm2 stop feedbackhub` or `sudo systemctl stop feedbackhub`
2. Check logs: `pm2 logs feedbackhub --lines 100` or `journalctl -u feedbackhub -n 100`
3. Revert DNS to preview URL
4. Debug locally with production env vars
5. Fix, rebuild, redeploy

---

## Estimated Time
- Database setup: 10 min
- Build + deploy: 15 min
- DNS propagation: 5 min
- Testing: 10 min
- **Total: ~40 minutes**

---

## Next Steps After Deployment
1. Update Playground Docs with deployment date
2. Announce launch on Twitter/Product Hunt
3. Monitor first 24h for errors
4. Gather early user feedback
5. Plan v1.1 features
