# Paratha Portal

A small portal where anyone can submit a record (**Date, Paratha Qty, Emp Name,
Meal Type**) and an admin can view all submitted records behind a password.

- **Framework:** Next.js (App Router, TypeScript)
- **Database:** Supabase (PostgreSQL)
- **Hosting:** Vercel

All database access goes through server-side API routes. The Supabase
service key and the admin password stay on the server and never reach the
browser.

## Pages

| Page     | What it does                                                        |
| -------- | ------------------------------------------------------------------- |
| `/`      | Public form, laid out vertically. Users fill the fields and submit. |
| `/admin` | Password-protected: lists all records (filter + count) **and** lets the admin reorder the form fields. |

### Fields

`Emp Name`, `Date`, `Paratha Qty`, `Meal Type` are user-entered. `Item Name`
(**Aloo Pyaz Paratha**) and `Rate` (**12 per Piece**) are prefilled and
read-only. The admin can drag the sequence of all fields with the up/down
controls on `/admin`; the form renders them in the saved order.

---

## 1. Set up Supabase

1. Create a project at <https://supabase.com> (free tier is fine).
2. In the dashboard, open **SQL Editor → New query**, paste the contents of
   [`supabase-schema.sql`](./supabase-schema.sql), and click **Run**. This
   creates the `paratha_records` and `form_settings` tables and enables Row
   Level Security. The script is **idempotent** — if you created the database
   with an earlier version, just run the whole file again; it adds the new
   `item_name` / `rate` columns and the `form_settings` table without touching
   existing data.
3. Open **Project Settings → API** and copy two things:
   - **Project URL** → this is your `SUPABASE_URL`
   - **Project API keys → `service_role` (secret)** → this is your
     `SUPABASE_SERVICE_ROLE_KEY`

> The `service_role` key bypasses Row Level Security. Keep it secret — only
> ever use it as a server environment variable, never in client code.

## 2. Run locally (optional)

```bash
cd D:\Paratha
npm install
copy .env.local.example .env.local   # Windows (use `cp` on macOS/Linux)
```

Edit `.env.local` and fill in:

```
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ADMIN_PASSWORD=choose-a-strong-password
```

Then:

```bash
npm run dev
```

Open <http://localhost:3000> for the form and
<http://localhost:3000/admin> for the admin view.

## 3. Deploy to Vercel

1. Push this folder to a Git repo (GitHub/GitLab/Bitbucket), **or** use the
   Vercel CLI (`npm i -g vercel` then `vercel`).
2. In Vercel, **New Project → Import** the repo. Vercel auto-detects Next.js;
   no build settings changes are needed.
3. Under **Settings → Environment Variables**, add all three (for Production,
   Preview, and Development):
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ADMIN_PASSWORD`
4. Click **Deploy**. Your form is at `https://<project>.vercel.app/` and the
   admin view at `https://<project>.vercel.app/admin`.

> After changing env vars in Vercel, redeploy so the new values take effect.

## Environment variables

| Name                        | Where it's used | Purpose                                   |
| --------------------------- | --------------- | ----------------------------------------- |
| `SUPABASE_URL`              | Server only     | Your Supabase project URL.                |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only     | Secret key for server-side DB access.     |
| `ADMIN_PASSWORD`            | Server only     | Password the `/admin` page checks.        |

## Notes

- To change the admin password, update `ADMIN_PASSWORD` and redeploy.
- `Meal Type` and `Emp Name` are free text by design.
- Records are returned newest-first (by date, then submission time).
