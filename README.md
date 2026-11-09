# Simul Ahmed — Portfolio

Personal portfolio for Simul Ahmed (embedded systems and PCB design). Next.js App Router + Tailwind, with every word, photo, project and section editable from `/admin` through Supabase. No code changes are needed to add a project, a photo or a certificate.

## How content works
- The whole site is one JSON document (`SiteContent`, `src/lib/types.ts`).
- `src/lib/schema.ts` describes every field (kind, label, help, default). The admin forms are drawn from it, and `src/lib/normalize.ts` repairs any saved JSON against it, so a missing or malformed value can never break a public page. Add a field in both files.
- Built-in content lives in `src/content/default.ts` (images in `public/img`). It is used until the first save, and fills any field the saved copy lacks.
- Projects are **families**: each has `versions` (oldest first), each with its own summary, highlights, specs and photos. A project also has GitHub `repos`, other `links`, and `oldSlugs`: earlier web addresses that redirect to the current one, so links printed on a CV keep working after a rename.
- Supabase table `portfolio_content` holds these rows:
  - `main`: what visitors see, with hidden items removed. Public.
  - `admin`: the full content, including hidden items. Admin only.
  - `history-<time>`: a copy of each save (the last 30). Admin only.
- Pages are cached for 5 minutes and refreshed instantly after each save (`/api/revalidate`).

## Admin panel (`/admin`)
1. Sign in with the admin email (first time: "Create account", confirm the email, then sign in). "Forgot password?" sends a reset link.
2. **Overview** lists what is worth fixing (projects without photos, certificates without an image…) with quick actions.
3. **Projects**: tap a project to edit it.
   - *Photos*: add many at once (photos or PDFs; a PDF becomes an image of its first page), drag or use the arrows to reorder, caption and alt text, ★ sets the cover, ✕ removes (with Undo).
   - *Link & GitHub*: copy the project's link for a CV, change its address (the old one keeps redirecting), add GitHub repositories (pick from your public repositories or paste any address) and other links.
   - ● Live / ○ Hidden pauses a project without deleting it; ★ features it. New projects and duplicates start hidden.
   - "Copy all links for CV" copies every live project as `Title: link`, one per line.
4. **Certificates and awards**, **Experience**, **Skills**, **Leadership and education**, **Contact, CV and footer**, **Name, photo and SEO** (including the accent colour, favicon, logo and link preview image).
5. **Sections and menu** reorders, hides or renames the home page sections. **Words and labels** edits every small piece of interface text.
6. Press **Save and publish** (Ctrl/Cmd+S). Undo/Redo (Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z) work across the whole editor, unsaved work survives a reload on the same device, and **Backups and history** brings back any of the last 30 saves, downloads or loads a backup file, and finds uploaded files nothing uses any more.

Local testing without signing in: `npm run dev`, then open `/admin?demo` (development only; saves stay in the browser).

## Setup
1. Run `supabase/schema.sql` in the Supabase SQL editor. It creates the table, the `portfolio-media` bucket and the permissions, and is safe to run again after updates. The admin email is set in one place there (`portfolio_is_admin()`).
2. Copy `.env.example` to `.env.local` and fill the values; add the same variables in Vercel. `NEXT_PUBLIC_SITE_URL` is the public address used in copied links, the sitemap and link previews.
3. In Supabase Auth > URL configuration, set the site URL and add `https://<site>/admin` as a redirect URL.
4. `npm install && npm run dev`.

## Deploy
Import the GitHub repo in Vercel (framework: Next.js), add the env variables, deploy. Pushes to `main` deploy automatically.

## Keeping Supabase awake
Free Supabase projects pause after about a week with no activity. Two watchdogs prevent that:
- **Vercel Cron** (`vercel.json`) calls `/api/keepalive` every day at 03:00 UTC, which runs a real database query.
- **GitHub Actions** (`.github/workflows/supabase-keepalive.yml`) queries the database every 2 days, independent of Vercel.
  GitHub disables scheduled workflows after 60 days without repo activity; re-enable it from the Actions tab if that happens.
