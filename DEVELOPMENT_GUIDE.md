# Paytracker — Development & Deployment Guide

## Overview

Paytracker is a React app for managing group expense collections. Each person signs in via email magic link (OTP). Users can be **organisers** (create collections, add participants by phone) or **participants** (see what they owe).

The app uses:
- **React 17** with React Router v6
- **Supabase** for auth, database (PostgreSQL), and REST API
- **GitHub Pages** for production hosting (subfolder `/Paytracker/`)
- Two Supabase projects: one for local development, one for production

---

## Project structure

```
Paytracker/
├── public/
│   ├── index.html          # SPA entry point
│   └── 404.html            # SPA fallback + hash preservation for magic links
├── src/
│   ├── index.js            # App entry
│   ├── App.js              # Route definitions, session handling, profile sync
│   ├── AppContext.js        # Global state (collections, profile, theme)
│   ├── supabaseClient.js   # Supabase client init (reads env vars)
│   ├── LoginScreen.js      # Email + phone input, sends magic link
│   ├── CodeVerificationScreen.js  # "Check your email" screen + resend
│   ├── RoleSelection.js    # Choose organiser or participant
│   ├── CreateCollection.js # Create a collection with participants
│   ├── OrganiserDashboard.js
│   ├── ParticipantDashboard.js
│   ├── AllCollections.js
│   ├── ReconcilePage.js
│   ├── SettingsPage.js
│   ├── lib/
│   │   └── supabaseHelpers.js   # All DB functions (create profile, collections, etc.)
│   └── pages.css
├── .env.local                 # Dev Supabase credentials (gitignored)
├── .env.production.local      # Prod Supabase credentials (gitignored)
├── package.json
├── SUPABASE_IMPLEMENTATION_PLAN.md  # Data model reference
└── DEVELOPMENT_GUIDE.md       # This file
```

---

## Prerequisites

- **Node.js 14–16** (the project uses `react-scripts@4.0.3` with OpenSSL legacy provider)
- **npm**
- A **Supabase account** (free tier works) — create one at https://supabase.com

---

## 1. Create two Supabase projects

You need **two separate Supabase projects**:

| Purpose | Example name |
|---------|-------------|
| Local development | `paytracker-dev` |
| Production | `paytracker-prod` |

1. Go to https://supabase.com and create both projects.
2. After each project is provisioned, go to **Project Settings → API** and note:
   - **Project URL** (e.g. `https://xxxxxxx.supabase.co`)
   - **`anon` public key** (for client-side use)

---

## 2. Run the database schema

Both projects start with an empty database (or the Supabase starter template). Run this SQL in the **SQL Editor** of each project to create the correct schema:

**Dev:** https://supabase.com/dashboard/project/<dev-ref>/sql/new
**Prod:** https://supabase.com/dashboard/project/<prod-ref>/sql/new

```sql
drop table if exists public.payments cascade;
drop table if exists public.collection_participants cascade;
drop table if exists public.collections cascade;
drop table if exists public.profiles cascade;

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique,
  full_name text,
  email text unique,
  phone text unique,
  role text not null default 'participant',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.collections (
  id uuid primary key default gen_random_uuid(),
  organiser_profile_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  category text not null,
  target_amount numeric not null default 0,
  collection_date date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.collection_participants (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references public.collections(id) on delete cascade,
  participant_profile_id uuid not null references public.profiles(id) on delete cascade,
  participant_phone text not null,
  amount_due numeric not null default 0,
  amount_paid numeric not null default 0,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(collection_id, participant_profile_id)
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  collection_participant_id uuid not null references public.collection_participants(id) on delete cascade,
  amount numeric not null default 0,
  payment_method text,
  notes text,
  paid_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_profiles_auth_user_id on public.profiles(auth_user_id);
create index if not exists idx_profiles_phone on public.profiles(phone);
create index if not exists idx_collections_organiser_profile_id on public.collections(organiser_profile_id);
create index if not exists idx_collection_participants_collection_id on public.collection_participants(collection_id);
create index if not exists idx_collection_participants_participant_profile_id on public.collection_participants(participant_profile_id);
create index if not exists idx_payments_collection_participant_id on public.payments(collection_participant_id);
```

After running, go to **Project Settings → API** and scroll to the bottom. Click **"Refresh schema cache"** so PostgREST picks up the new tables.

---

## 3. Configure Authentication (Supabase)

In each Supabase project dashboard:

1. Go to **Authentication → Settings** → under **Redirect URLs**.
2. Add these URLs (click "Save" after each):

   **Dev project:**
   - `http://localhost:3000/login`

   **Prod project:**
   - `https://<your-username>.github.io/Paytracker/login`

3. Go to **Authentication → Providers** → **Email**. Ensure it is **enabled**. Magic link / OTP will work out of the box — no SMTP configuration needed on the free tier (Supabase uses their own email service).

---

## 4. Clone and set up locally

```bash
git clone <your-repo-url>
cd Paytracker
npm install
```

---

## 5. Create environment files

Two `.env` files are needed. Both are listed in `.gitignore` so they **will not be committed**.

### `.env.local` — Development

```env
REACT_APP_SUPABASE_URL=https://<dev-project-ref>.supabase.co
REACT_APP_SUPABASE_ANON_KEY=<dev-anon-key>
REACT_APP_REDIRECT_URL=http://localhost:3000/login
```

### `.env.production.local` — Production

```env
REACT_APP_SUPABASE_URL=https://<prod-project-ref>.supabase.co
REACT_APP_SUPABASE_ANON_KEY=<prod-anon-key>
REACT_APP_REDIRECT_URL=https://<your-username>.github.io/Paytracker/login
PUBLIC_URL=/Paytracker
```

The `PUBLIC_URL=/Paytracker` tells React and React Router that the app lives under the `/Paytracker/` subfolder on GitHub Pages.

---

## 6. Run locally

```bash
npm start
```

Opens at `http://localhost:3000/`. The app loads `.env.local` automatically.

**Dev mode features:**
- A "Dev mode: skip to role" button appears on the login screen — it creates a quick test account using email + password and skips the magic link email flow.
- You can enter any email and phone; the app will sign up/sign in immediately.

---

## 7. Production deployment

### Option A: Manual deploy (simpler)

```bash
npm run deploy
```

This runs:
```
PUBLIC_URL=/Paytracker npm run build && gh-pages -d build
```

- `gh-pages` pushes the `build/` folder to the `gh-pages` branch.
- GitHub Pages serves the site from the `gh-pages` branch.

One-time setup: In your GitHub repo → **Settings → Pages** → Source: **Deploy from a branch** → Branch: `gh-pages` / `(root)`.

### Option B: GitHub Actions (automated)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 16
      - run: npm ci
      - run: npm run build
        env:
          REACT_APP_SUPABASE_URL: ${{ secrets.REACT_APP_SUPABASE_URL }}
          REACT_APP_SUPABASE_ANON_KEY: ${{ secrets.REACT_APP_SUPABASE_ANON_KEY }}
          REACT_APP_REDIRECT_URL: ${{ secrets.REACT_APP_REDIRECT_URL }}
          PUBLIC_URL: /Paytracker
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./build
```

Add these **repository secrets** (Settings → Secrets and variables → Actions):

| Secret | Value |
|--------|-------|
| `REACT_APP_SUPABASE_URL` | `https://<prod-ref>.supabase.co` |
| `REACT_APP_SUPABASE_ANON_KEY` | `<prod-anon-key>` |
| `REACT_APP_REDIRECT_URL` | `https://<username>.github.io/Paytracker/login` |

Then every push to `main` triggers a deploy.

---

## 8. How magic link auth works

1. User enters email + phone on the login screen.
2. App calls `supabase.auth.signInWithOtp({ email, options: { emailRedirectTo } })`.
3. Supabase sends a magic link email with the `emailRedirectTo` URL appended with `#access_token=...`.
4. User clicks the link → lands on `404.html` (GitHub Pages always serves `404.html` for sub-paths).
5. The `404.html` script stores the full URL (including the hash) into `sessionStorage.redirect`, then redirects to `/Paytracker/`.
6. React app loads → `supabase.auth.getSession()` reads the URL fragment → Supabase extracts the `access_token` → session is established.
7. `App.js` detects session → calls `createOrFetchProfile()` → profile is created/linked.
8. User is redirected to `/select-role` (or dashboard if returning).

**Critical:** `404.html` MUST include `location.hash` in the redirect URL:
```js
sessionStorage.redirect = location.protocol + '//' + location.host + location.pathname + location.search + location.hash;
```
Without `location.hash`, the `#access_token=...` is lost and auth never completes.

---

## 9. Database schema reference

### `profiles`
| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid PK` | Auto-generated |
| `auth_user_id` | `uuid unique` | Supabase auth user ID, set after login |
| `full_name` | `text` | Display name |
| `email` | `text unique` | From auth |
| `phone` | `text unique` | Phone for participant matching |
| `role` | `text` | `organiser` or `participant` (default: `participant`) |
| `created_at` | `timestamptz` | Auto |
| `updated_at` | `timestamptz` | Auto |

### `collections`
| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid PK` | Auto-generated |
| `organiser_profile_id` | `uuid FK → profiles.id` | Who created it |
| `title` | `text` | Collection name |
| `category` | `text` | e.g. `sports`, `travel`, `events` |
| `target_amount` | `numeric` | Total amount to collect |
| `collection_date` | `date` | Defaults to today |
| `created_at` / `updated_at` | `timestamptz` | Auto |

### `collection_participants`
| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid PK` | Auto-generated |
| `collection_id` | `uuid FK → collections.id` | Which collection |
| `participant_profile_id` | `uuid FK → profiles.id` | Which user |
| `participant_phone` | `text` | Phone used when added |
| `amount_due` | `numeric` | Their share |
| `amount_paid` | `numeric` | How much they've paid |
| `status` | `text` | `pending` or `paid` |
| `created_at` / `updated_at` | `timestamptz` | Auto |
| Unique constraint | `(collection_id, participant_profile_id)` | No duplicates |

### `payments`
| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid PK` | Auto-generated |
| `collection_participant_id` | `uuid FK → collection_participants.id` | Who paid |
| `amount` | `numeric` | Payment amount |
| `payment_method` | `text` | Optional |
| `notes` | `text` | Optional |
| `paid_at` | `timestamptz` | Auto |

---

## 10. Common issues & solutions

### CDN cache serves old build
Change `REACT_APP_BUILD_ID` in `src/index.js` to a new random value. This forces a new JS bundle hash. Then rebuild and redeploy.

### Magic link lands on blank page or loses auth token
The `404.html` must include `location.hash`. Verify the `sessionStorage.redirect` line includes `+ location.hash`.

### "Could not find the 'category' column of 'collections' in the schema cache"
Run the schema SQL in the Supabase SQL Editor, then click **Refresh schema cache** in Settings → API.

### Profile creation fails in production
Check that the `profiles` table has the correct columns (see schema above). The Supabase starter template creates a different `profiles` schema. Drop and recreate with the SQL in section 2.

### `emailRedirectTo` changes keep getting lost
The `emailRedirectTo` value must be set via `process.env.REACT_APP_REDIRECT_URL` in all three files:
- `src/LoginScreen.js`
- `src/CodeVerificationScreen.js`
- `src/Auth.js`

---

## 11. Key source files

| File | Purpose |
|------|---------|
| `src/supabaseClient.js` | Creates Supabase client with `detectSessionInUrl: true` |
| `src/lib/supabaseHelpers.js` | `createOrFetchProfile()`, `createCollectionWithParticipants()`, fetch helpers |
| `src/App.js` | Session listener, profile sync on auth, route definitions |
| `src/AppContext.js` | Global state: collections, profile, user, theme |
| `src/LoginScreen.js` | Email + phone input, sends magic link via `signInWithOtp` |
| `public/404.html` | SPA fallback on GitHub Pages, preserves `location.hash` for auth |
| `.env.local` | Dev credentials (gitignored) |
| `.env.production.local` | Prod credentials + `PUBLIC_URL=/Paytracker` (gitignored) |

---

## 12. NPM scripts

| Command | What it does |
|---------|-------------|
| `npm start` | Dev server on `localhost:3000` |
| `npm run build` | Build for production (`PUBLIC_URL` comes from env) |
| `npm run deploy` | `npm run build && gh-pages -d build` (deploys to `gh-pages` branch) |
| `npm test` | Run tests |

