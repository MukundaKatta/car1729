# RNHT Platform — Rudra Narayana Hindu Temple

**Live:** <https://mukundakatta.github.io/rnht/>

A full-stack web and mobile platform for the Rudra Narayana Hindu Temple. RNHT gives devotees a polished digital home for discovering temple services, booking poojas and homams, making donations, following the panchangam and event calendar, and watching livestreams — across web, iOS, and Android from a single Next.js codebase.

Live site: [https://mukundakatta.github.io/rnht](https://mukundakatta.github.io/rnht)

## Why RNHT

Temples often run on fragmented tools — a WordPress site for news, a PayPal button for donations, a spreadsheet for bookings, a WhatsApp group for announcements. RNHT consolidates that into one branded experience: marketing site, booking flow, donation processor, admin console, and native mobile wrappers, all driven by the same codebase and data model.

## Features

- Temple marketing site with a rich landing page and branded content
- Service catalog for poojas, homams, samskaras, weddings, and consultations
- Panchangam, event calendar, gallery, streaming, education, priest directory, and community pages
- Cart and checkout flows for service bookings
- Donation flow with recurring donations and multiple fund types
- OTP-based authentication backed by Supabase
- Devotee profile with bookings, donations, and family-member data
- Admin screens for bookings, events, services, priests, news, volunteers, and slideshow management
- Static-export deployment for GitHub Pages and Firebase Hosting
- Capacitor wrappers for iOS and Android distribution
- Vitest coverage across stores, pages, utilities, and components

## Tech Stack

**Frontend**
- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- Zustand (client state)
- lucide-react, date-fns, class-variance-authority

**Backend / Services**
- Supabase (auth, Postgres, storage)
- Stripe + PayPal (payments)
- Resend (transactional email)
- Firebase (hosting, optional services)

**Mobile**
- Capacitor 8 (iOS + Android wrappers)

**Tooling**
- Vitest + Testing Library + jsdom
- ESLint (eslint-config-next)
- PostCSS + autoprefixer

## How It Works

The repository root is a wrapper. The runnable application lives in [`rnht-platform/`](./rnht-platform).

- Pages live under `rnht-platform/src/app/` (Next.js App Router). Each top-level folder — `services`, `donate`, `calendar`, `panchangam`, `admin`, etc. — is a route segment.
- Server routes under `src/app/api/` handle checkout, donations, and payment webhooks when deployed to a server-capable target.
- Client state is managed with Zustand stores under `src/store/` (auth, cart, language, slideshow).
- Integration helpers live under `src/lib/`: `supabase.ts`, `stripe.ts` / `stripe-server.ts`, `paypal-server.ts`, `firebase.ts`, `panchangam.ts`, `donation-receipts.ts`, `i18n/`.
- Sample data under `src/lib/sample-data.ts` lets the site render even without backend credentials — the Supabase client is intentionally nullable so static builds do not crash when env vars are absent.
- CI workflows strip `src/app/api` before static export so the GitHub Pages and Firebase Hosting builds ship the front end only. Live checkout and donations need a server-capable deployment.
- Capacitor configs (`capacitor.config.ts`, `android/`, `ios/`) wrap the built web app as native binaries for the App Store and Play Store.

## Getting Started

### Prerequisites

- Node.js 20+
- npm
- Optional: Supabase project, Stripe account, PayPal developer account
- Optional: Xcode and/or Android Studio for native builds

### Install

```bash
cd rnht-platform
npm install
```

### Configure environment

```bash
cp .env.local.example .env.local
```

Supported variables:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# PayPal
PAYPAL_CLIENT_ID=
PAYPAL_SECRET=
PAYPAL_MODE=sandbox

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_BASE_PATH=
```

### Run

```bash
npm run dev        # start the dev server on :3000
npm run build      # production build
npm run start      # run the built app
npm run lint       # ESLint
npm run test       # Vitest watch
npm run test:run   # Vitest single run
npm run test:coverage
```

### Mobile builds

```bash
cd rnht-platform
npm run build
npx cap sync
```

See [`rnht-platform/APP_STORE_SUBMISSION.md`](./rnht-platform/APP_STORE_SUBMISSION.md) for iOS submission notes.

## Usage

Main routes already wired up:

```
/                 home
/about            about
/services         service catalog
/calendar         event calendar
/panchangam       daily panchangam
/donate           donation flow
/cart             booking cart
/checkout         checkout
/gallery          photo gallery
/streaming        livestreams
/education        education / resources
/priests          priest directory
/community        community pages
/news             temple news
/profile          devotee profile
/dashboard        devotee dashboard
/admin            admin console (bookings, events, services, etc.)
/login            OTP login
/contact          contact form
/privacy /terms /transparency   legal & transparency pages
```

Deployment happens automatically from `main` via GitHub Actions — one workflow publishes to Firebase Hosting, another to GitHub Pages with `NEXT_PUBLIC_BASE_PATH=/rnht`.

## Project Structure

```
.
├── index.html                      # root redirect to /rnht
├── Procfile                        # Heroku-style start hint
├── .github/workflows/              # Firebase + GitHub Pages deploys
└── rnht-platform/                  # the actual Next.js app
    ├── src/app/                    # App Router pages + api/
    ├── src/components/             # UI pieces (hero, calendar, services, effects, ...)
    ├── src/store/                  # Zustand client stores
    ├── src/lib/                    # Supabase, Stripe, PayPal, Firebase, panchangam helpers
    ├── src/__tests__/              # Vitest tests
    ├── public/                     # static assets
    ├── supabase/                   # SQL migrations
    ├── android/                    # Capacitor Android project
    ├── ios/                        # Capacitor iOS project
    ├── capacitor.config.ts
    ├── firebase.json
    ├── next.config.mjs
    └── tailwind.config.ts
```