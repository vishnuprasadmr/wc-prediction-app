# Score sync (FIFA → Supabase)

Two ways to auto-update scores after matches:

| Method | Best for |
|--------|----------|
| **Supabase Edge Function + Cron** | Production (cloud, no local machine) |
| **Python script** | Local / manual runs |

DB trigger `match_score_changed` recalculates points → leaderboard updates automatically.

---

## A. Edge Function (recommended)

### 1. Deploy

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase functions deploy sync-scores
```

### 2. Test

```bash
# Sync one match (after it finishes)
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/sync-scores \
  -H "apikey: YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"matchNumber": 1}'

# Sync all matches that have kicked off but aren't finished
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/sync-scores \
  -H "apikey: YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"dueOnly": true}'
```

### 3. Schedule cron (per-match kickoff times)

```bash
npm run generate:match-cron
```

This writes `scripts/match-sync-schedule.sql` with **208 cron jobs**:
- Each match: sync at **kickoff + 2h 10m** (full-time) and **kickoff + 3h** (retry)
- Plus a **every 15 min** fallback for anything missed

In Supabase SQL Editor:

1. **Integrations → Cron** → Enable
2. Run vault setup from `scripts/setup-score-sync-cron.sql` (store `project_url` + anon key)
3. Run `scripts/match-sync-schedule.sql`

---

## B. Python script (local)

```bash
pip install -r scripts/score-sync/requirements.txt
```

Add to `scripts/score-sync/.env`:

```env
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

```bash
npm run sync:scores:dry
npm run sync:scores
npm run sync:scores -- --match-number 1   # via py directly
```

---

## Edge function request body

| Body | When to use |
|------|-------------|
| `{}` | Full sync (service role only) |
| `{"dueOnly": true}` | Matches kicked off, not finished (fallback cron) |
| `{"matchNumber": 42}` | Single match after full-time |

Admin **manual override** on a match blocks auto-sync for that row.
