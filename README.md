# Simul Ahmed — Portfolio

Personal portfolio for Simul Ahmed (embedded systems and PCB design). Next.js App Router + Tailwind, content editable from `/admin` through Supabase.

## How content works
- The whole site is one JSON document (`SiteContent`, see `src/lib/types.ts`).
- Built-in content lives in `src/content/default.ts`, with images in `public/img`.
- When Supabase is configured, the site reads the saved copy from table `portfolio_content` (row `id = 'main'`), merged over the defaults, and refreshes within 5 minutes (instantly after saving in admin).
- Projects are **families**: each has a list of `versions`, each version with its own summary, highlights, specs and images.

## Admin panel (`/admin`)
1. Sign in with the admin email (first time: "Create account", confirm the email, then sign in).
2. Pick a section, edit text, upload images (resized to 2000 px WebP in the browser), reorder with the arrows, hide items with the Hidden switch.
3. Press **Save and publish**. "Download backup" exports the JSON.

## Setup
1. Run `supabase/schema.sql` in the Supabase SQL editor (creates the table, the `portfolio-media` bucket and admin-only write policies).
2. Copy `.env.example` to `.env.local` and fill the values; add the same variables in Vercel.
3. In Supabase Auth > URL configuration, add the site URL and `https://<site>/admin` as a redirect URL.
4. `npm install && npm run dev`.

## Deploy
Import the GitHub repo in Vercel (framework: Next.js), add the env variables, deploy.

## Keeping Supabase awake
Free Supabase projects pause after about a week with no activity. Two watchdogs prevent that:
- **Vercel Cron** (`vercel.json`) calls `/api/keepalive` every day at 03:00 UTC, which runs a real database query.
- **GitHub Actions** (`.github/workflows/supabase-keepalive.yml`) queries the database every 2 days, independent of Vercel.
  GitHub disables scheduled workflows after 60 days without repo activity; re-enable it from the Actions tab if that happens.
