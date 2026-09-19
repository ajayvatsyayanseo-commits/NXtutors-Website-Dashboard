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
module. 47 endpoints under `/api/dashboard/v1`, all returning
`{data, meta, errors}`.

Its own tables are prefixed `nxt_` — `nxt_sessions` rather than `sessions`,
because Laravel's session store already owns that name in this database, and
`nxt_leads` rather than `leads` so nothing collides with the legacy schema.

Three commands:

```bash
php artisan nxt-dashboard:seed --demo   # backfill + demo working set
php artisan nxt-dashboard:reliability   # nightly 0-100 tutor score
php artisan nxt-dashboard:auto-confirm  # release holds after 24h
```

The last two belong on the scheduler. Without `auto-confirm` the money never
moves for the classes parents do not manually confirm, which is most of them.

## Deploying

`deployment/` holds three example files: the nginx locations, the proxy snippet
they share, and a systemd unit. The short version:

1. `npm ci && npm run build` on the server.
2. `systemctl enable --now nxtutors-dashboard` (port 3000, loopback only).
3. Add the nginx blocks above the site's general `location /`.
4. Reload nginx.

Paths the dashboard owns are listed explicitly, so `/user/profile`,
`/user/checkout`, `/teacher/my-plan` and the public `/tutor/*` profiles all stay
with PHP.

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
