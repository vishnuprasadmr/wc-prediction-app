# Fix Google OAuth redirecting to localhost on live

If Google sign-in sends users to `http://localhost:3000` (or another local URL) on production, **Supabase Auth URL settings** are wrong.

## 1. Supabase Dashboard (required)

**Authentication → URL Configuration**

| Setting | Value |
|---------|--------|
| **Site URL** | `https://YOUR-LIVE-DOMAIN.netlify.app` (your real app URL, **not** localhost) |
| **Redirect URLs** | Add **all** of these (one per line): |

```
https://YOUR-LIVE-DOMAIN.netlify.app/**
http://localhost:5173/**
http://localhost:3000/**
```

Replace `YOUR-LIVE-DOMAIN` with your Netlify site name.

Click **Save**.

## 2. Netlify environment variables

Site settings → Environment variables → **Production**:

| Variable | Example |
|----------|---------|
| `VITE_APP_URL` | `https://YOUR-LIVE-DOMAIN.netlify.app` |
| `VITE_SUPABASE_URL` | `https://xxxxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | your anon key |
| `VITE_LEAGUE_INVITE_CODE` | `SIMELABS-WC26` |

**No trailing slash** on `VITE_APP_URL`.

Then: **Deploys → Trigger deploy → Clear cache and deploy site**.

## 3. Google Cloud Console

**APIs & Services → Credentials → OAuth client**

Authorized redirect URI (only Supabase callback, not your app):

```
https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback
```

## 4. Verify

1. Open live app in incognito (not installed PWA from old localhost build).
2. Register → Continue with Google.
3. After Google consent, URL should be `https://YOUR-LIVE-DOMAIN.netlify.app/register`, **not** localhost.
