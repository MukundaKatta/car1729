# Year-End Consolidated Tax Receipts — setup & operation

Automated once-a-year batch that emails every donor a single consolidated
**Year-End Charitable Donation Acknowledgment** PDF for the calendar year that
just closed. Built 2026-08-31.

> **STATUS 2026-09-02: setup COMPLETE and verified.** Migration 011 applied, all GitHub secrets set, rnht.org verified in Resend, dry-run green (run 33559899322). The client confirmed the rule: donors whose total for the whole tax year is $250 or more. First automatic run: January 5, 2027, for 2026 donations. Nothing below is still pending; keep it as the reference for re-setup.

## What it does

- Groups each calendar year's **completed** donations **by normalized email**, so
  a devotee's account gifts and any guest gifts under the same address
  consolidate into **one** statement.
- Sends only to donors whose annual total is **≥ $250** (the temple CPA's rule
  for a formal written acknowledgment; everyone else keeps their per-gift
  receipts).
- Attaches the branded PDF (see `RNHT_Year-End_Receipt_SAMPLE.pdf`) plus an HTML
  summary in the email body.
- **Idempotent:** records each send in `public.year_end_receipts`, so a re-run
  never double-mails a donor.
- Runs on a **GitHub Actions schedule** (`.github/workflows/year-end-receipts.yml`),
  Jan 5 each year, for the previous year. Reuses the app's own PDF generator —
  no Supabase edge function, no Supabase access token needed to deploy.

## One-time setup (required before it can run)

### 1. Apply the migration
Supabase Dashboard → SQL Editor → run the contents of
`rnht-platform/supabase/migrations/011_year_end_receipts.sql`
(creates the `year_end_receipts` idempotency ledger).

### 2. Add GitHub repo secrets
Repo → Settings → Secrets and variables → Actions → New repository secret:

| Secret | Value |
|--------|-------|
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API → `service_role` key |
| `RESEND_API_KEY` | your Resend API key |
| `RECEIPT_FROM` | `Rudra Narayana Hindu Temple <receipts@rnht.org>` |

`NEXT_PUBLIC_SUPABASE_URL` is already set (reused as the DB URL).

### 3. Verify the Resend sender domain  ⚠️ THE REAL BLOCKER
Until `rnht.org` is verified in Resend (see `RNHT_DNS_Cutover_Checklist.md`),
**every send reaches only the account owner** (sandbox). Real donor delivery is
impossible until those DNS records are live. Do this before the first January.

## How to test (do this once, safely)

The script is **dry-run by default** — it never emails unless `--send` is passed.

- GitHub → Actions → **Year-End Tax Receipts** → **Run workflow**:
  - leave *year* blank (or set e.g. `2026`), leave *send* **unchecked** → a
    **dry run** that logs exactly who would get a statement and their totals,
    emailing nobody.
  - Review the log. When satisfied (and after step 3), run again with *send*
    **checked** to actually deliver.

Locally (needs the env vars set):
```bash
cd rnht-platform
tsx scripts/send-year-end-receipts.ts --year=2026            # dry run
tsx scripts/send-year-end-receipts.ts --year=2026 --send     # real send
```

## Normal operation

- The schedule fires **Jan 5** and sends real statements for the year that just
  ended. Nothing to do.
- ⚠️ GitHub disables scheduled workflows after **60 days of repo inactivity** —
  confirm each December that the workflow is still enabled (Actions tab).
- To re-send after a fix, use `--force` (ignores the ledger) — testing only.

## Files

- `rnht-platform/scripts/send-year-end-receipts.ts` — the batch runner
- `rnht-platform/src/lib/year-end-batch.ts` — pure aggregation/eligibility (unit-tested)
- `rnht-platform/src/lib/tax-receipt-pdf.ts` — `buildYearEndReceiptArtifacts()` (the emailable PDF)
- `rnht-platform/supabase/migrations/011_year_end_receipts.sql` — idempotency ledger
- `.github/workflows/year-end-receipts.yml` — the schedule
- `rnht-platform/src/__tests__/lib/year-end-batch.test.ts` — tests
