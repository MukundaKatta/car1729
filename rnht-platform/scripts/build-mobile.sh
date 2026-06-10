#!/bin/bash
# Build the static-export web bundle for the native apps and sync to iOS/Android.
# - API routes are moved aside (they can't be statically exported; prod uses
#   Supabase Edge Functions instead).
# - Strips assets that shouldn't ship inside the app binaries (~22 MB):
#   the 2026 calendar PDF (opened from the web instead) and the unreferenced
#   slideshow images (slides load from Supabase).
# Required env: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY.
set -e
cd "$(dirname "$0")/.."
mv src/app/api /tmp/rnht-api-aside
trap 'mv /tmp/rnht-api-aside src/app/api' EXIT
rm -rf .next out
STATIC_EXPORT=1 NEXT_PUBLIC_APP_URL="${NEXT_PUBLIC_APP_URL:-https://rnht-platform.web.app}" ./node_modules/.bin/next build
rm -rf out/slideshow out/downloads/2026-rnht.pdf
npx cap sync
echo "Mobile web bundle ready (out/ -> ios/android). Bundle size: $(du -sh out | cut -f1)"
