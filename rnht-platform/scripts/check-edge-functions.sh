#!/usr/bin/env bash
# Edge functions are Deno and excluded from tsc/vitest, so a reference to an
# undefined identifier ships silently and 500s in production (this happened:
# a claim block written against `supabase` in a module whose client is `admin`
# broke the admin Send-Receipt button live). Catch that one cheap class here.
set -euo pipefail
fail=0
for f in supabase/functions/*/index.ts; do
  client=$(grep -oE "^const (admin|supabase) = createClient" "$f" | awk '{print $2}' || true)
  [ -z "$client" ] && continue
  other=$([ "$client" = "admin" ] && echo supabase || echo admin)
  if grep -qE "(await|= ) *${other}\b" "$f"; then
    echo "ERROR: $f declares '$client' but references '$other'"; fail=1
  fi
done
[ "$fail" -eq 0 ] && echo "edge-function client references OK"
exit $fail
