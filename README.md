# Punch In — multi-store loyalty tracker

Each store owner signs in with Google, gets their own private customer list. Keyport Deli never sees Krauzers' data, and vice versa — enforced at the database level, not just in the app code.

Total cost to run this at small scale: **$0/month.** (Apple Sign In is the only piece that costs money — $99/year — and it's not included here; add it later if you want it.)

---

## 1. Create a free Supabase project

1. Go to https://supabase.com → sign up (free) → **New project**
2. Once it's created, go to **SQL Editor** → **New query**
3. Paste the entire contents of `supabase/schema.sql` from this project → **Run**
   - This creates the `stores` and `customers` tables and locks them down so each store owner can only ever see their own data.
4. Go to **Settings → API**. Copy:
   - **Project URL**
   - **anon public** key

## 2. Set up Google login

1. In your Supabase project: **Authentication → Providers → Google** → toggle it on
2. You'll need a Google OAuth Client ID/Secret. Get one free at https://console.cloud.google.com/apis/credentials:
   - Create a project (any name)
   - **Create Credentials → OAuth client ID → Web application**
   - Under **Authorized redirect URIs**, add the callback URL Supabase shows you on that same Providers page (looks like `https://your-project.supabase.co/auth/v1/callback`)
   - Copy the generated **Client ID** and **Client Secret** into the Supabase Google provider screen → **Save**

## 3. Run it locally (optional, to test before deploying)

```bash
npm install
cp .env.local.example .env.local
# paste your Supabase URL + anon key into .env.local
npm run dev
```

Visit http://localhost:3000

## 4. Deploy to Vercel (free)

1. Push this project to a GitHub repo
2. Go to https://vercel.com → **New Project** → import that repo
3. When it asks for environment variables, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   (same values from `.env.local`)
4. Deploy

Once deployed, go back to your Google Cloud OAuth client and Supabase's redirect settings and add your live Vercel URL (e.g. `https://your-app.vercel.app`) as an authorized domain/redirect — otherwise login will fail in production even though it worked locally.

---

## How the store separation works

- When someone signs in for the first time, they're prompted to name their store (one-time, ~10 seconds)
- Every customer row is tagged with a `store_id`
- Row Level Security policies in `schema.sql` mean the database itself refuses to return or modify rows belonging to a different store — even if there were a bug in the app code, one owner's data can't leak into another's

## Changing the punches-needed-for-a-reward

Each store sets this once when they create their store profile (default 8). It's stored per-store in the `stores` table, so different owners can run different deals.

## What's not included yet

- Apple Sign In (needs a paid $99/year Apple Developer account — add later if wanted)
- Editing store settings after creation (currently set once at signup — ask and I can add a settings page)
- SMS/email birthday reminders (would need a service like Twilio/Resend, which has its own cost)
