// Supabase Edge Function: stripe-webhook
//
// Stripe -> temple reconciliation. Deployed with --no-verify-jwt (Stripe cannot
// send a Supabase JWT); the request is authenticated by verifying Stripe's
// signature over the RAW body with STRIPE_WEBHOOK_SECRET instead, and an event
// whose livemode does not match the mode of STRIPE_SECRET_KEY is dropped (a
// test-mode endpoint secret must never let test events touch live rows).
//
//   POST /functions/v1/stripe-webhook
//
// Handles (subscribe the endpoint to exactly these in the Stripe dashboard):
//   checkout.session.completed / checkout.session.async_payment_succeeded
//       Completes a donation the same way donate GET ?session_id= does (guarded
//       flip + single-winner receipt claim + guest back-link + receipt email),
//       so a donor who closes the tab before the success page still gets
//       recorded and receipted. Idempotent against replays and against the
//       donor's own verify: the DB row guards decide, nothing else. The
//       session's amount_total / currency must match the row (see
//       _shared/complete-donation.ts) — a mismatch is logged and acknowledged,
//       never completed.
//   charge.refunded / charge.dispute.created / charge.dispute.funds_withdrawn
//       Flips the matching donation to 'refunded' and records the event under
//       custom_fields.refund. A partial refund still marks the row 'refunded'
//       (conservative for tax: a partially-returned gift is not receipted as a
//       full one) with amount_refunded recorded. A row that is still 'pending'
//       (the checkout event has not been delivered yet, or was missed) is
//       flipped straight to 'refunded' too: Stripe is authoritative that the
//       money came and went, and a later checkout event then finds no
//       'pending' row to complete and no 'completed' row to receipt. Every
//       reader keys on payment_status = 'completed', so a refunded gift drops
//       out of totals, dashboards and receipt batches automatically.
//   charge.dispute.closed (status won) / charge.dispute.funds_reinstated
//       The temple won a chargeback: flips 'refunded' -> 'completed' again,
//       ONLY when the refund on record came from a charge.dispute.* event for
//       the same amount (a genuine charge.refunded is never reverted), and
//       records custom_fields.refund.reinstated. The receipt claim then runs:
//       if a receipt already went out it loses and nothing is sent; if the
//       gift was never receipted (disputed before the checkout event landed)
//       the donor gets the one receipt they are owed.
//
// Responses: 200 for handled, ignored, mismatched and not-found events (Stripe
// would otherwise retry for days); 400 ONLY for a missing/invalid signature;
// 500 for a missing STRIPE_WEBHOOK_SECRET or a DB/Stripe failure while
// applying an event (Stripe retries those, which is what we want: every write
// is guarded, so a redelivery after a half-applied attempt is safe).
//
// Required secrets:
//   STRIPE_SECRET_KEY        (already set for donate)
//   STRIPE_WEBHOOK_SECRET    whsec_… from the endpoint in the Stripe dashboard
// Supabase auto-provides SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
// Requires migration 014 (adds 'refunded' to the payment_status CHECK).

// deno-lint-ignore-file no-explicit-any
import Stripe from "https://esm.sh/stripe@14.21.0?target=denonext";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import {
  routeStripeEvent,
  type RefundAction,
  type ReinstateAction,
} from "../_shared/stripe-webhook-events.ts";
import {
  asRecord,
  claimAndSendReceipt,
  completeStripeDonation,
} from "../_shared/complete-donation.ts";

const TAG = "[stripe-webhook]";

const STRIPE_KEY = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
const WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

// Live secret keys are sk_live_… (or rk_live_… for restricted keys); every
// other prefix is test mode. Compared against event.livemode below.
const LIVE_KEY = /^[sr]k_live_/.test(STRIPE_KEY);

const stripe = new Stripe(STRIPE_KEY, {
  apiVersion: "2024-06-20",
  httpClient: Stripe.createFetchHttpClient(),
});
// Deno has no Node `crypto`; the SDK's Web-platform build verifies signatures
// with SubtleCrypto, which is async-only — hence constructEventAsync below.
const cryptoProvider = Stripe.createSubtleCryptoProvider();

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
});

// Server-to-server endpoint: no CORS headers on purpose (browsers never call it).
const jsonHeaders = { "Content-Type": "application/json" };

function reply(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), { status, headers: jsonHeaders });
}

const DONATION_COLS =
  "id, amount, fund_type, donor_email, donor_name, user_id, payment_status, payment_method, payment_intent_id, custom_fields";

type DonationRow = {
  id: string;
  amount: unknown;
  fund_type: string;
  donor_email: string | null;
  donor_name: string | null;
  user_id: string | null;
  payment_status: string;
  payment_method: string;
  payment_intent_id: string | null;
  custom_fields: unknown;
};

/** Exactly-one match by a filter, else null (ambiguity is logged, never guessed). */
async function findOne(
  label: string,
  build: (q: any) => any,
): Promise<DonationRow | null> {
  const { data, error } = await build(
    supabase.from("donations").select(DONATION_COLS),
  ).limit(2);
  if (error) {
    // Let the outer catch turn this into a 500 so Stripe retries a DB blip.
    throw new Error(`donation lookup (${label}) failed: ${error.message}`);
  }
  const rows = (data ?? []) as DonationRow[];
  if (rows.length === 1) return rows[0];
  if (rows.length > 1) {
    console.error(`${TAG} ambiguous donation lookup (${label})`, rows.map((r) => r.id));
  }
  return null;
}

/**
 * Locates the donation a refund/dispute belongs to.
 *   1. custom_fields.stripe_payment_intent = pi (stored by the checkout handler)
 *   2. Stripe: the Checkout Session that owns the PaymentIntent → its
 *      metadata.donation_id (authoritative), else payment_intent_id = cs_… id
 *      (what donate GET verify stores).
 */
async function locateDonation(
  paymentIntent: string,
): Promise<{ row: DonationRow; via: string } | null> {
  const direct = await findOne("custom_fields.stripe_payment_intent", (q) =>
    q.eq("custom_fields->>stripe_payment_intent", paymentIntent),
  );
  if (direct) return { row: direct, via: "custom_fields.stripe_payment_intent" };

  const list = await stripe.checkout.sessions.list({
    payment_intent: paymentIntent,
    limit: 1,
  });
  const session = list.data[0];
  if (!session) return null;

  const metaId =
    session.metadata?.type === "donation" ? session.metadata?.donation_id : undefined;
  if (metaId) {
    const byId = await findOne("session.metadata.donation_id", (q) => q.eq("id", metaId));
    if (byId) return { row: byId, via: "session.metadata.donation_id" };
  }
  const bySession = await findOne("payment_intent_id = session.id", (q) =>
    q.eq("payment_intent_id", session.id).eq("payment_method", "stripe"),
  );
  if (bySession) return { row: bySession, via: "payment_intent_id" };
  return null;
}

/** Dollar amounts compared to the half-cent (amount is numeric(…,2), Stripe sends cents). */
function sameAmount(a: unknown, b: unknown): boolean {
  const x = Number(a);
  const y = Number(b);
  return Number.isFinite(x) && Number.isFinite(y) && Math.abs(x - y) <= 0.005;
}

async function applyRefund(
  action: RefundAction,
  eventId: string,
): Promise<Record<string, unknown>> {
  if (!action.paymentIntent) {
    // A charge with no PaymentIntent cannot be one of ours (Checkout always
    // creates one). Acknowledge so Stripe stops retrying.
    console.error(`${TAG} ${action.source} without payment_intent — cannot map`, {
      eventId,
      chargeId: action.chargeId,
    });
    return { received: true, found: false };
  }

  const located = await locateDonation(action.paymentIntent);
  if (!located) {
    console.error(`${TAG} ${action.source}: no matching donation`, {
      eventId,
      paymentIntent: action.paymentIntent,
      chargeId: action.chargeId,
      amountRefunded: action.amountRefunded,
    });
    return { received: true, found: false };
  }
  const { row, via } = located;

  // Same cross-check as the checkout path, where the event lets us: a charge
  // for a different amount than the row cannot be the payment of this row,
  // however it was mapped. Disputes usually arrive without the charge
  // expanded (amountCharged null) and are trusted on the mapping alone.
  if (
    row.payment_method !== "stripe" ||
    (action.amountCharged !== null && !sameAmount(action.amountCharged, row.amount))
  ) {
    console.error(`${TAG} ${action.source}: charge does not match donation — left unchanged`, {
      donationId: row.id,
      via,
      eventId,
      rowMethod: row.payment_method,
      rowAmount: row.amount,
      amountCharged: action.amountCharged,
    });
    return { received: true, found: true, donationId: row.id, mismatch: true };
  }

  const refundRecord = {
    event_id: eventId,
    source: action.source,
    amount_refunded: action.amountRefunded,
    amount_charged: action.amountCharged,
    partial: action.partial,
    reason: action.reason,
    charge_id: action.chargeId,
    at: action.occurredAt ?? new Date().toISOString(),
  };
  const cf = asRecord(row.custom_fields);
  const merged = {
    ...cf,
    stripe_payment_intent: action.paymentIntent,
    refund: refundRecord,
  };

  // Guarded flip: a COMPLETED gift becomes refunded. A replayed event, or
  // a second refund after a partial one, matches 0 rows here and is handled
  // below without ever flipping twice.
  const { data: flipped, error: flipError } = await supabase
    .from("donations")
    .update({ payment_status: "refunded", custom_fields: merged })
    .eq("id", row.id)
    .eq("payment_status", "completed")
    .select("id")
    .maybeSingle();
  if (flipError) {
    // 23514 here means migration 014 has not been applied yet. Throw so the
    // response is a 500 and Stripe retries once it is.
    throw new Error(`refund flip failed for ${row.id}: ${flipError.message}`);
  }
  if (flipped) {
    console.log(`${TAG} donation marked refunded`, {
      donationId: row.id,
      via,
      eventId,
      source: action.source,
      amountRefunded: action.amountRefunded,
      partial: action.partial,
    });
    return { received: true, found: true, donationId: row.id, refunded: true };
  }

  if (row.payment_status === "refunded") {
    // Already refunded: a replay (same or smaller amount → no-op) or a follow-up
    // refund topping up a partial one → keep amount_refunded accurate.
    const prior = asRecord(cf.refund);
    const priorAmount = typeof prior.amount_refunded === "number" ? prior.amount_refunded : 0;
    if (action.amountRefunded > priorAmount) {
      const { error: topUpError } = await supabase
        .from("donations")
        .update({ custom_fields: merged })
        .eq("id", row.id)
        .eq("payment_status", "refunded");
      if (topUpError) {
        throw new Error(`refund top-up failed for ${row.id}: ${topUpError.message}`);
      }
      console.log(`${TAG} refund amount updated on already-refunded donation`, {
        donationId: row.id,
        from: priorAmount,
        to: action.amountRefunded,
        eventId,
      });
      return { received: true, found: true, donationId: row.id, refunded: true, updated: true };
    }
    console.log(`${TAG} replayed refund event, no change`, { donationId: row.id, eventId });
    return { received: true, found: true, donationId: row.id, refunded: true, replay: true };
  }

  // 'pending' (or a legacy 'failed'): the money moved on Stripe for a row never
  // marked completed — the checkout event is still queued (Stripe does not
  // order deliveries; a 500 from us delays it further) or was missed, and the
  // donor never came back. Stripe is authoritative that the gift was paid AND
  // returned, so flip straight to 'refunded' with the evidence attached. If we
  // only logged this, the later checkout event would find a 'pending' row,
  // complete it and email a receipt for money that went back. Guarded on the
  // status we read so a concurrent completion is not silently overwritten.
  const { data: fromPending, error: pendingError } = await supabase
    .from("donations")
    .update({ payment_status: "refunded", custom_fields: merged })
    .eq("id", row.id)
    .eq("payment_status", row.payment_status)
    .select("id")
    .maybeSingle();
  if (pendingError) {
    throw new Error(`refund flip (from ${row.payment_status}) failed for ${row.id}: ${pendingError.message}`);
  }
  if (fromPending) {
    console.error(`${TAG} refund for a donation that was never completed — marked refunded`, {
      donationId: row.id,
      statusBefore: row.payment_status,
      via,
      eventId,
      source: action.source,
      amountRefunded: action.amountRefunded,
    });
    return {
      received: true,
      found: true,
      donationId: row.id,
      refunded: true,
      statusBefore: row.payment_status,
    };
  }

  // The row moved under us between the read and the write: the checkout event
  // (or the donor's verify) completed it just now. One more guarded attempt
  // from 'completed'; if that also misses, throw so Stripe redelivers and the
  // next attempt reads the settled state.
  const { data: lateFlip, error: lateError } = await supabase
    .from("donations")
    .update({ payment_status: "refunded", custom_fields: merged })
    .eq("id", row.id)
    .eq("payment_status", "completed")
    .select("id")
    .maybeSingle();
  if (lateError) {
    throw new Error(`refund flip (late) failed for ${row.id}: ${lateError.message}`);
  }
  if (lateFlip) {
    console.log(`${TAG} donation marked refunded (completed concurrently)`, {
      donationId: row.id,
      via,
      eventId,
      source: action.source,
    });
    return { received: true, found: true, donationId: row.id, refunded: true };
  }
  throw new Error(
    `refund for ${row.id}: status changed from ${row.payment_status} during handling; retry`,
  );
}

async function applyReinstate(
  action: ReinstateAction,
  eventId: string,
): Promise<Record<string, unknown>> {
  if (!action.paymentIntent) {
    console.error(`${TAG} ${action.source} without payment_intent — cannot map`, {
      eventId,
      chargeId: action.chargeId,
    });
    return { received: true, found: false };
  }
  const located = await locateDonation(action.paymentIntent);
  if (!located) {
    console.error(`${TAG} ${action.source}: no matching donation`, {
      eventId,
      paymentIntent: action.paymentIntent,
      chargeId: action.chargeId,
      amount: action.amount,
    });
    return { received: true, found: false };
  }
  const { row, via } = located;
  const cf = asRecord(row.custom_fields);
  const refund = asRecord(cf.refund);

  if (refund.reinstated) {
    // Replay (closed + funds_reinstated both fire for a won dispute).
    console.log(`${TAG} ${action.source}: already reinstated, no change`, {
      donationId: row.id,
      eventId,
    });
    return { received: true, found: true, donationId: row.id, reinstated: true, replay: true };
  }
  if (row.payment_status !== "refunded") {
    console.error(`${TAG} ${action.source}: donation is not refunded — left unchanged`, {
      donationId: row.id,
      status: row.payment_status,
      via,
      eventId,
    });
    return { received: true, found: true, donationId: row.id, reinstated: false, status: row.payment_status };
  }
  // Only ever undo a refund that a dispute CAUSED, and only in full. A genuine
  // charge.refunded (the temple sent the money back on purpose) stays
  // refunded even if an unrelated dispute on the same charge is later won.
  const source = typeof refund.source === "string" ? refund.source : "";
  if (!source.startsWith("charge.dispute.")) {
    console.error(`${TAG} ${action.source}: refund on record is ${JSON.stringify(source || null)}, not a dispute — left refunded`, {
      donationId: row.id,
      eventId,
    });
    return { received: true, found: true, donationId: row.id, reinstated: false, reason: "not_a_dispute" };
  }
  if (!sameAmount(refund.amount_refunded, action.amount)) {
    console.error(`${TAG} ${action.source}: reinstated amount differs from the dispute on record — left refunded`, {
      donationId: row.id,
      eventId,
      recorded: refund.amount_refunded,
      reinstated: action.amount,
    });
    return { received: true, found: true, donationId: row.id, reinstated: false, reason: "amount_mismatch" };
  }

  const merged = {
    ...cf,
    refund: {
      ...refund,
      reinstated: {
        event_id: eventId,
        source: action.source,
        amount: action.amount,
        at: action.occurredAt ?? new Date().toISOString(),
      },
    },
  };
  // Guarded refunded -> completed. tax_receipt_sent is left as it is: the
  // claim below sends a receipt only if none ever went out.
  const { data: restored, error: restoreError } = await supabase
    .from("donations")
    .update({ payment_status: "completed", custom_fields: merged })
    .eq("id", row.id)
    .eq("payment_status", "refunded")
    .select("id")
    .maybeSingle();
  if (restoreError) {
    throw new Error(`reinstate flip failed for ${row.id}: ${restoreError.message}`);
  }
  if (!restored) {
    throw new Error(`reinstate for ${row.id}: status changed during handling; retry`);
  }
  const receipt = await claimAndSendReceipt(supabase, row.id, row, TAG);
  if (!receipt.ok) {
    // The flip committed; a redelivery re-attempts only the claim.
    throw new Error(`receipt claim after reinstatement failed for ${row.id}`);
  }
  console.log(`${TAG} dispute won — donation restored to completed`, {
    donationId: row.id,
    via,
    eventId,
    source: action.source,
    amount: action.amount,
    receiptSent: receipt.receiptSent,
  });
  return {
    received: true,
    found: true,
    donationId: row.id,
    reinstated: true,
    receiptSent: receipt.receiptSent,
  };
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return reply(405, { error: "Method not allowed" });
  }
  if (!WEBHOOK_SECRET) {
    console.error(
      `${TAG} STRIPE_WEBHOOK_SECRET is not set — refusing to process events. ` +
        "Set it with: npx supabase@latest secrets set STRIPE_WEBHOOK_SECRET=whsec_... --project-ref <ref>",
    );
    return reply(500, { error: "Webhook not configured" });
  }
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return reply(400, { error: "Missing stripe-signature header" });
  }
  // Stripe events are a few KB; refuse anything absurd BEFORE buffering and
  // HMAC'ing it (this is a public, JWT-less URL). 413 is not retried by Stripe.
  const declaredLength = Number(req.headers.get("content-length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > 1_000_000) {
    return reply(413, { error: "Payload too large" });
  }

  // The signature covers the exact bytes Stripe sent: read the raw text, never
  // a re-serialised JSON parse.
  const rawBody = await req.text();
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      rawBody,
      signature,
      WEBHOOK_SECRET,
      undefined,
      cryptoProvider,
    );
  } catch (e) {
    console.error(`${TAG} signature verification failed:`, (e as Error)?.message);
    return reply(400, { error: "Invalid signature" });
  }

  // A valid signature proves the event came from the Stripe ACCOUNT the
  // endpoint secret belongs to, not that it came from the same MODE as our
  // API key: the dashboard registers endpoints per mode, and a test-mode
  // whsec_ set here would let anyone with the (far less guarded) test secret
  // key run a 4242 checkout naming a real pending donation_id. Drop it.
  if (event.livemode !== LIVE_KEY) {
    console.error(`${TAG} livemode mismatch — event dropped`, {
      eventId: event.id,
      type: event.type,
      eventLivemode: event.livemode,
      keyLivemode: LIVE_KEY,
      hint: "STRIPE_WEBHOOK_SECRET must come from an endpoint registered in the same mode as STRIPE_SECRET_KEY",
    });
    return reply(200, { received: true, ignored: true, reason: "livemode mismatch" });
  }

  const action = routeStripeEvent(event);
  try {
    switch (action.kind) {
      case "checkout_completed": {
        const result = await completeStripeDonation(supabase, {
          donationId: action.donationId,
          sessionId: action.sessionId,
          paymentIntent: action.paymentIntent,
          amountTotal: action.amountTotal,
          currency: action.currency,
          tag: TAG,
        });
        if (!result.ok) {
          if (result.reason === "db_error") {
            // Transient DB failure on the read, the flip or the receipt claim:
            // 500 so Stripe redelivers. Every write is guarded, so a retry
            // after a half-applied attempt cannot double-flip or double-send.
            return reply(500, { error: "Donation update failed" });
          }
          if (result.reason === "mismatch") {
            // Not transient and already logged loudly: acknowledge so Stripe
            // does not retry, and never complete the row.
            return reply(200, {
              received: true,
              found: true,
              donationId: action.donationId,
              mismatch: true,
            });
          }
          // Unknown donation_id: ours by metadata shape but not in this DB.
          // Acknowledge; already logged.
          return reply(200, { received: true, found: false });
        }
        console.log(`${TAG} ${event.type} handled`, {
          eventId: event.id,
          donationId: action.donationId,
          flipped: result.flipped,
          receiptSent: result.receiptSent,
          statusBefore: result.statusBefore,
        });
        return reply(200, {
          received: true,
          found: true,
          donationId: action.donationId,
          flipped: result.flipped,
          receiptSent: result.receiptSent,
        });
      }
      case "refund": {
        const result = await applyRefund(action, event.id);
        return reply(200, result);
      }
      case "reinstate": {
        const result = await applyReinstate(action, event.id);
        return reply(200, result);
      }
      default: {
        console.log(`${TAG} ignoring ${event.type} (${event.id}): ${action.reason}`);
        return reply(200, { received: true, ignored: true });
      }
    }
  } catch (err) {
    console.error(`${TAG} handler error for ${event.type} (${event.id}):`, err);
    return reply(500, { error: "Webhook handler failed" });
  }
});
