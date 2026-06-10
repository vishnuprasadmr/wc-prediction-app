# Deploy Simelabs WC Prediction PWA

## Prerequisites

- Node.js 20+ (for local build)
- [Supabase](https://supabase.com) account
- [Vercel](https://vercel.com) account
- Optional: Python 3.10+ for local score sync (`pip install -r scripts/score-sync/requirements.txt`)

## 1. Supabase Setup

1. Create a new Supabase project.
2. Go to **SQL Editor** and run migrations in order:
   - `supabase/migrations/001_initial.sql`
   - `supabase/migrations/002_seed_fixtures.sql`
   - `supabase/migrations/003_grants_and_policies.sql`
3. Copy **Project URL** and **anon public key** from Settings → API.
4. Disable email confirmation (for faster onboarding): Authentication → Providers → Email → disable "Confirm email".
5. Promote yourself to admin after first signup:
   ```sql
   UPDATE profiles SET is_admin = true WHERE display_name = 'YourName';
   ```

## 2. Automatic score sync (no paid API)

Scores are pulled from FIFA's public calendar API and written to `matches`. The DB trigger recalculates points and the leaderboard updates automatically.

### Option A — Python script (local or cron)

```bash
pip install -r scripts/score-sync/requirements.txt
# Add SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY to .env
npm run sync:scores:dry   # preview
npm run sync:scores       # apply
```

See `scripts/score-sync/README.md` for Windows Task Scheduler and GitHub Actions setup.

### Option B — Supabase Edge Function + cron

```bash
npm install -g supabase
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase functions deploy sync-scores
```

Schedule in Supabase Dashboard → Edge Functions → sync-scores → Cron:
- `*/15 * * * *` (every 15 min on match days)

Or invoke manually:
```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/sync-scores \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

Admin can still override scores in the app; enable **manual override** to block auto-sync for a match.

## 3. Frontend Deploy (Vercel)

1. Push repo to GitHub.
2. Import project in Vercel.
3. Set environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_LEAGUE_INVITE_CODE=SIMELABS-WC26`
4. Deploy.

Or deploy via CLI:
```bash
npm run build
npx vercel --prod
```

## 4. Share with Simelabs Team

- App URL: your Vercel deployment
- Invite code: `SIMELABS-WC26`
- Install: open on phone → Add to Home Screen

## Local Development

```bash
cp .env.example .env
# Fill in Supabase credentials
npm install
npm run dev
```
