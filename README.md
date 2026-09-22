# NXTutors dashboards

The student and tutor dashboards, built to the v1.1 build brief. Next.js App
Router on the front, the existing Laravel site as the API behind it.

The URLs do not change. `/user/dashboard` and `/teacher/dashboard` are still
those URLs — nginx decides per path whether a request is answered by this app or
by PHP. Nothing redirects, so bookmarks, WhatsApp deep links and the login
hand-off keep working exactly as they did.

## How the login is shared

There is no second login, and no token for anyone to keep in sync.

```
browser ──(site session cookie)──▶ nginx ──▶ Next.js (server)
                                              │ forwards the same cookie
                                              ▼
                                   Laravel /api/dashboard/v1/*
                                   resolves session('userid') → the user
```

Because both apps answer on one host, the browser sends the site's own
`nxtutors_session` cookie to the dashboard too. Every fetch runs on the server
and forwards that cookie verbatim. The browser never holds an API credential, so
there is no client-side token to steal.

For the one case a cookie cannot cover — the dashboard served from a different
origin — `POST /api/dashboard/v1/auth/handoff` exchanges the session for a
short-lived signed bearer token, and the same middleware accepts it. Nothing
uses that path in the default deployment.

## Running it locally

Two processes. The Laravel site first:

```bash
cd ../NXtutors-Website
php artisan migrate --path=app/Nxt/Dashboard/Database/Migrations
php artisan nxt-dashboard:seed --demo     # backfills real leads + a working set
php artisan serve --port=8000
```

Then this app:

```bash
cp .env.local.example .env.local          # defaults point at 127.0.0.1:8000
npm install
npm run dev                               # http://localhost:3000
```

Sign in on the Laravel site as usual, then open `http://localhost:3000/user/dashboard`.
The session cookie is shared across ports on the same host, so the dashboard
picks up that login with nothing further to do. Anything this app has no route
for falls through to Laravel, so links into the rest of the site work in dev too.

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server on :3000 |
| `npm run build` | Production build |
| `npm run start` | Serve the build |
| `npm run typecheck` | `tsc --noEmit` |

`next lint` was removed in Next 16; `npm run typecheck` is the gate.

## Layout

Component-wise, no monolith. Every screen is thin: it fetches, then composes
components that each own one card.

```
src/
  app/
    user/          Home · Learn · Tutors · Ask AI · Account
    teacher/       Home · Leads · Students · Studio · Growth
  components/
    ui/            Card, primitives, Tabs, ActionButton — the catalogue
    layout/        AppShell, AppBar, TabBar, icons
    student/       Home cards, Learn panels, MatchCard, ConfirmSessionPanel
    tutor/         Home cards, LeadReplyForm, SessionSheet
  lib/
    api.ts         server-side client, forwards the session cookie
    actions.ts     every write, as server actions
    types.ts       the API response shapes
    format.ts      INR in Indian grouping, times in IST
```

Both apps share one shell. They differ only in their five tabs and what the
subtitle says, so a change to spacing or safe areas cannot land in one app and
be missed in the other.

## The API

`app/Nxt/Dashboard/` in the Laravel repo — a self-contained module with its own
routes, migrations and commands, in the same shape as the existing `NxtAi`
module. 58 routes under `/api/dashboard/v1`, all returning
`{data, meta, errors}`.

Its own tables are prefixed `nxt_` — `nxt_sessions` rather than `sessions`,
because Laravel's session store already owns that name in this database, and
`nxt_leads` rather than `leads` so nothing collides with the legacy schema.

The module lives on the `feat/nxt-dashboard-backend` branch of
`NXtutors-Website`. That branch is what production runs, but it is not merged
into `main` yet — until it is, uploading `main` to the server removes the API.

Five commands run on Laravel's scheduler, registered in `routes/console.php`,
so nothing extra goes in cron:

| Command | When | Why it matters |
| --- | --- | --- |
| `nxt-dashboard:relay-outbox` | every minute | Publishes money and session events. Transport is `log` until `NXT_OUTBOX_TRANSPORT` says otherwise |
| `nxt-dashboard:auto-confirm` | every 10 min | Releases a held class fee to the tutor. Most parents never tap Confirm, so without it most tutors are never paid |
| `nxt-dashboard:issue-check-in-codes` | every 10 min | Sends the parent's check-in code an hour before class |
| `nxt-dashboard:reliability` | 03:30 daily | The 30-day 0–100 tutor score used to rank leads |
| `nxt-dashboard:sweep-abandoned` | 04:00 daily | Refunds classes nobody ever closed |

One manual command:

```bash
php artisan nxt-dashboard:seed           # backfill nxt_leads from the legacy enquiry tables
php artisan nxt-dashboard:seed --demo    # ...plus a demo working set — never on production
```

The backfill has **not** been run on production. It turns every historical
enquiry into a fresh lead that expires in 30 days, and tutors pay credits to
open leads, so decide on a cut-off date before running it there.

## Deploying

Live on www.nxtutors.com since 22 September 2026, on the site's AWS server,
which is managed with CloudPanel and sits behind Cloudflare. The server hosts
about thirty other sites, so every change stays inside the `nxtutors` site.

### What runs where

| Piece | Where |
| --- | --- |
| Laravel site + dashboard API | `/home/nxtutors/htdocs/www.nxtutors.com`, PHP 8.4, FPM user `nxtutors` |
| This app | `/home/nxtutors/nxtutors-dashboard`, Node 22 installed with nvm for the `nxtutors` user only |
| Service | systemd `nxtutors-dashboard`, on `127.0.0.1:3020` |
| Routing | the vhost for `www.nxtutors.com`, in CloudPanel |
| Scheduler | `/etc/cron.d/nxtutors` runs `schedule:run` every minute (this was already in place) |

Port 3020, not 3000: 3000 already belongs to another site on the box.
`LARAVEL_ORIGIN` is `https://www.nxtutors.com` rather than loopback. Laravel's
internal `:8080` listener picks a site by `Host`, and with many sites on one
server a loopback call would land on the wrong one.

### Updating this app

```bash
~/deploy/update-dashboard.sh                  # run as ubuntu; defaults to feat/verified-reviews, the branch production runs
~/deploy/update-dashboard.sh some-branch
```

The script pulls, runs `npm ci` and `npm run build`, then restarts the service.
If the build fails it stops before the restart, so the running version keeps
serving.

### Routing

One `location` block in the site's vhost, above its general `location /`,
sends exactly these paths to port 3020:

```
/user/dashboard   /user/learn   /user/tutors   /user/ask   /user/account
/teacher/dashboard   /teacher/leads   /teacher/students   /teacher/studio   /teacher/growth
/_next/*   /api/profile-avatar
```

Everything else stays with PHP. That includes `/user/profile`,
`/user/checkout`, `/teacher/my-plan`, the public `/tutor/*` profiles and
`/api/dashboard/v1/*`. The block also sets `pagespeed off;`. The site runs
PageSpeed, and its HTML rewriting (whitespace, quotes, lazy images) breaks React
hydration.

To roll back, delete that block. `/user/dashboard` and `/teacher/dashboard` go
back to the old Blade screens, and nothing else changes.

### Things that have already caused outages

- **Rebuild Laravel's config cache as `nxtutorscom`, not `nxtutors`.** `.env`
  is owned by `nxtutorscom` with mode 600. Run as `nxtutors`, `config:cache`
  cannot read `.env`, falls back to SQLite, and every page returns 500. Build it
  as `nxtutorscom`, then give the file back to FPM:

  ```bash
  sudo -u nxtutorscom php8.4 artisan config:cache
  sudo chown nxtutors:nxtutors bootstrap/cache/config.php && sudo chmod 660 bootstrap/cache/config.php
  ```

- **Change the vhost in two places.** CloudPanel keeps its own copy of every
  vhost, in `/home/clp/htdocs/app/data/db.sq3` (`site.vhost_template`, with
  CRLF line endings and `{{placeholders}}`). If only the file in
  `/etc/nginx/sites-enabled/` changes, the next Save in the panel wipes the
  dashboard routes. The simplest way is to edit it in the panel under
  **Sites → www.nxtutors.com → Vhost**, which updates both.

- **Never write a vhost file in place.** An empty vhost still passes
  `nginx -t`, and reloading it takes the site off the internet (Cloudflare 525).
  Build a copy, test it, then swap it in.

### Backups

`/home/ubuntu/deploy/backup-20260922-091216/` holds the state from before the
first deploy: the Laravel code (`app`, `bootstrap`, `config`, `database`,
`routes`, `.env`), a full database dump, the original vhost and CloudPanel's
database. Take a fresh backup before each backend deploy.

### The example files

`deployment/` holds the original templates: nginx locations, a shared proxy
snippet and a systemd unit. They describe a server with one site, on port 3000.
Production differs as described above, so use them as a starting point for a
fresh server, not as a copy of what is live.

## What is built, and what is not

Built and running against real data: both Home screens, Learn (classes,
homework, study plan, progress), session detail with confirm and dispute,
matches and the in-app tutor profile, Account with plan, credits and wallet, the
Leads inbox with its four tabs, lead detail with the metered open and the reply
and quote form, the roster, the calendar, the check-in and check-out sheet,
Studio, and Growth with earnings, reliability, verification, reviews and plan.

Not built, and honest about it on screen rather than faked:

- **Ask AI** is the meter, the locked state and the hand-off. The doubt solver
  itself is the existing `App\NxtAi` module, which already owns the tool
  allowlist and the rate limits; it is linked rather than reimplemented.
- **Studio tools** show what each costs and whether the plan includes it. The
  generators arrive with the Studio agents.
- **Payments** are modelled end to end in the ledger — holds, release,
  commission, cancellation — but the purchase itself still goes through the
  existing Cashfree flow on the PHP side.
- **Practice tests, demo booking and tutor switching** have their tables and
  their API shape, and no screen yet.

## Parity with the Blade dashboard

Everything the old `/user/*` and `/teacher/*` Blade screens did, and where it
now lives:

| Blade screen | Now |
| --- | --- |
| Dashboard (3 hardcoded zeros) | Home, on real data |
| Profile (view + edit) | Account → Profile / Growth → Profile, editable in place |
| My Plan | Account → Plan / Growth → Plan, with the comparison grid |
| Change password | In the same Profile tab |
| Enquiry (tutor) | Leads — scoped per tutor and metered |
| Wishlist | Tutors → Saved |
| Cart, checkout, orders | Still Blade |

Two things were deliberately not carried across as they were:

- **Enquiry** listed `Student_Enquiry_Managment::all()` — every family's name,
  phone, email, address and budget, to every tutor. Leads replaces it with rows
  matched to that tutor only.
- **Cart, checkout and orders** are a product-order flow with zero rows in
  `cart_managment`, `order_managment` and `order_details`. They stay on Blade
  rather than being rebuilt against no usage.

The subject and class picker also stays on the main site: it writes to two
different course tables the public listings read, and that is worth moving on
its own rather than alongside this.

Every one of those renders the brief's own empty-state copy. "Blank white" is a
bug, and so is a screen that invents numbers it does not have.
