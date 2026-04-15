# RNHT Platform

**Rudra Narayana Hindu Temple — full-stack web + mobile platform.**

**Live:** <https://mukundakatta.github.io/rnht/>

A polished digital home for devotees: discover and book poojas / homams,
make donations, follow the panchangam and event calendar, watch
livestreams, and hold a community presence — all from one Next.js
codebase that ships to **web, iOS, and Android**.

```
        ┌──────────────────────────────────────┐
        │  Next.js 14 (App Router) + Tailwind  │
        │             ─── one app ───          │
        ├──────────────┬───────────────────────┤
        │  Web (PWA)   │  iOS / Android        │
        │              │  via Capacitor 6      │
        ├──────────────┴───────────────────────┤
        │   Supabase + Firebase + Stripe       │
        └──────────────────────────────────────┘
```

## Features

| Section | What devotees can do |
|---------|----------------------|
| **Services** | Browse and request poojas, homams, abhishekams; pay deposit |
| **Calendar** | Filterable temple event calendar (festivals, satsangs) |
| **Panchangam** | Daily tithi / nakshatram / yogam / rahu kalam |
| **Donate** | One-time + recurring donations via Stripe; itemised receipt |
| **Cart / Checkout** | Stripe-backed checkout for service bookings + offerings |
| **Education** | Curated reading + watching list for new devotees |
| **News & Gallery** | Festival recaps, photo / video galleries |
| **Community** | Discussion threads, classifieds, satsang RSVPs |
| **Auth & Dashboard** | Email magic-link auth; per-user booking + donation history |
| **Admin** | Service catalog editor, role-based admin dashboard |

## Tech

- **Web:** Next.js 14 (App Router), TypeScript, Tailwind, lucide-react,
  Vitest for tests.
- **Auth + DB:** Supabase (Postgres + auth + storage).
- **Payments:** Stripe (one-time + subscription donations).
- **Push / Analytics:** Firebase.
- **Mobile:** Capacitor 6 — same React app wrapped natively for iOS
  (Xcode project under `ios/`) and Android (`android/`). One codebase,
  three stores.
- **Deployment:** GitHub Pages for the marketing entry; the app itself
  deploys to Vercel/Heroku (`Procfile` included).

## Run it

```bash
cd rnht-platform
npm install
cp .env.example .env.local       # fill in Supabase / Stripe / Firebase keys
npm run dev                       # → http://localhost:3000
npm run test:run                  # vitest
```

### Mobile

```bash
# Build the Next.js export, then sync to native shells:
npm run build && npx cap sync

npx cap open ios       # opens Xcode
npx cap open android   # opens Android Studio
```

## Repo layout

```
rnht-platform/
├── src/
│   ├── app/              # one folder per route (about, calendar, donate, …)
│   ├── components/       # hero, panchangam, slideshow, etc.
│   ├── lib/              # supabase / stripe / firebase clients
│   ├── store/            # zustand stores
│   ├── types/            # shared TS types
│   └── __tests__/        # vitest specs
├── ios/                  # Capacitor iOS project
├── android/              # Capacitor Android project
├── public/               # icons, images, manifest
├── firebase.json         # FCM + analytics config
└── capacitor.config.ts   # Capacitor app id, web dir, plugins
```

## Operational notes

- **Multi-platform from one codebase.** Skills/plugins that work in
  the browser also work inside the native shells via Capacitor, so the
  team ships one feature set everywhere.
- **Donations are PCI-out-of-scope.** All card data hits Stripe Elements
  directly; the server only sees Stripe payment intents.
- **Auth is passwordless by default.** Magic-link via Supabase; phone
  OTP available as a Capacitor plugin if the temple wants it.

## Roadmap

- **Live ārati streaming** with low-latency embed + multi-camera
  switching.
- **Multilingual content** (Telugu / Kannada / Tamil / Hindi).
- **Festival-time scaling** — pre-warm Vercel for known peaks
  (Maha Shivaratri, Kumbh, etc.).

## License

MIT.
