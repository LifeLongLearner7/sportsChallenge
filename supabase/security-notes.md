# Supabase Dashboard — Security & Setup Checklist

This document covers all manual steps required in the Supabase dashboard to fully
activate the self-registration flow with email confirmation.

---

## Step 1 — Bulk-Confirm Existing Users (Do This First!)

Before enabling email confirmation, run this SQL to ensure no existing
admin-created users are accidentally locked out.

Go to: **Supabase Dashboard → SQL Editor** and run:

```sql
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;
```

---

## Step 2 — Enable Email Confirmation

Go to: **Authentication → Settings → User Signups**

- ✅ Toggle ON: **"Enable email confirmations"**
- This blocks `signInWithPassword` until the user clicks their confirmation link.

---

## Step 3 — Set the Custom Email Template

Go to: **Authentication → Email Templates → Confirm signup**

- Paste the entire contents of `supabase/confirmation-email-template.html`
- Subject line suggestion: `⚡ Confirm Your Neural Link · CYBER-SPORTS`
- Click **Save**

> The template uses `{{ .ConfirmationURL }}` and `{{ .SiteURL }}` — Supabase
> replaces these automatically when sending.

---

## Step 4 — Configure Site URL & Redirect URLs

Go to: **Authentication → URL Configuration**

- **Site URL**: Set to your production URL (e.g. `https://your-domain.com`)
  or `http://localhost:3000` for local dev.

- **Redirect URLs** — Add all of these:
  ```
  http://localhost:3000/auth/confirmed
  http://localhost:3000/auth/callback
  https://your-domain.com/auth/confirmed
  https://your-domain.com/auth/callback
  ```

> `/auth/confirmed` is the new welcome interstitial for self-registered users.
> `/auth/callback` handles admin invite links and magic links.

---

## Step 5 — Set Environment Variables

Ensure `.env.local` (and your Vercel/deployment env) contains:

```env
NEXT_PUBLIC_SITE_URL=https://your-domain.com   # or http://localhost:3000
UPSTASH_REDIS_REST_URL=https://...upstash.io
UPSTASH_REDIS_REST_TOKEN=...
```

---

## Step 6 — Review Auth Rate Limits (Optional but Recommended)

Go to: **Authentication → Settings → Rate Limits**

Supabase built-in defaults (on top of your Upstash Redis layer):
- Email sends: 2 per hour per email address (prevents email bombing)
- Sign-up: Supabase enforces its own throttling

These complement your Upstash Redis rate limiting in `proxy.ts`.

---

## Security Layers Summary

| Layer | What | Where |
|---|---|---|
| 1 | Email confirmation gate | Supabase Auth Settings |
| 2 | Redis rate limit (5 sign-ups/hr/IP) | `proxy.ts` Layer 0 |
| 3 | Redis rate limit (10 sign-ins/15min/IP) | `proxy.ts` Layer 0 |
| 4 | Supabase built-in auth throttling | Supabase Auth Settings |
| 5 | Route protection (unauthenticated redirect) | `proxy.ts` Layer 2 |
| 6 | DB trigger locks is_admin / points / scoring | `schema.sql` triggers |
| 7 | Password complexity enforced client + server | `AuthPortal.tsx` + `auth-actions.ts` |
| 8 | Terms acceptance required | `AuthPortal.tsx` checkbox (required) |
