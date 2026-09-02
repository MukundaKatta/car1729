#!/bin/bash
# Build the static-export web bundle for the native apps and sync to iOS/Android.
# - API routes are moved aside (they can't be statically exported; prod uses
#   Supabase Edge Functions instead).
# - Strips assets that shouldn't ship inside the app binaries (~22 MB):
#   the 2026 calendar PDF (opened from the web instead) and the unreferenced
#   slideshow images (slides load from Supabase).
# Required env: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY.
# These come from .env.local (public anon values) or the real environment (CI).
set -e
cd "$(dirname "$0")/.."

# Load local public env if present so the values are inlined into the static bundle.
if [ -f .env.local ]; then set -a; . ./.env.local; set +a; fi
# Fail fast — a silently-empty NEXT_PUBLIC_* var produces a bundle with no Supabase
# config (dead auth/donations on device). set -e cannot catch that, so guard here.
: "${NEXT_PUBLIC_SUPABASE_URL:?must be set (add it to .env.local — see .env.local.example — or export it). Refusing to build an env-less native bundle.}"
: "${NEXT_PUBLIC_SUPABASE_ANON_KEY:?must be set (add it to .env.local or export it). Refusing to build an env-less native bundle.}"

# src/app/api was removed (the site is a static export; server logic lives in
# Supabase edge functions). Keep the move-aside only if it ever reappears.
if [ -d src/app/api ]; then
  mv src/app/api /tmp/rnht-api-aside
  trap 'mv /tmp/rnht-api-aside src/app/api' EXIT
fi
rm -rf .next out
STATIC_EXPORT=1 NEXT_PUBLIC_APP_URL="${NEXT_PUBLIC_APP_URL:-https://rnht-platform.web.app}" ./node_modules/.bin/next build
rm -rf out/slideshow out/downloads/2026-rnht.pdf
npx cap sync
echo "Mobile web bundle ready (out/ -> ios/android). Bundle size: $(du -sh out | cut -f1)"
