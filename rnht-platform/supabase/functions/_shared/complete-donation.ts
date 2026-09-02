// Completes a Stripe Checkout donation: the guarded pending -> completed flip,
// the single-winner receipt claim, the guest back-link and the receipt email.
//
// This is a port of the post-retrieve half of donate/index.ts handleVerify
// (left untouched there: it is deployed and verified) so the stripe-webhook
// function completes a donation EXACTLY the same way. The donor's GET verify
// and the webhook may both run for one session — in any order, concurrently,
// or replayed — and the two DB guards below are the ONLY source of truth for
// "who flips" and "who emails":
//   flip:    update donations set payment_status='completed', payment_intent_id=<cs_…>
//            where id = ? and payment_status = 'pending'
//   receipt: update donations set tax_receipt_sent = true
//            where id = ? and payment_status = 'completed' and tax_receipt_sent = false
// Whoever loses either race updates 0 rows and stays silent. Do not add a
// second marker (an in-memory set, an event-id table, …) — it would only
// disagree with the row.
//
// Two deliberate differences from the verify path (both additive):
//   1. A DB error on the flip or the receipt claim is RETURNED (reason
//      "db_error") instead of only logged, so the caller can answer 500 and
//      Stripe redelivers. Retrying is safe: a flip that already committed
//      matches 0 rows on redelivery and only the claim is re-attempted, so
//      there is still exactly one email. The verify path can afford to
//      swallow because the donor can refresh; nobody retries a webhook that
//      answered 200.
//   2. What Stripe actually collected (session.amount_total / currency) is
//      cross-checked against the row before the flip, and the row must be a
//      Stripe donation. metadata.donation_id alone is not proof: anything able
//      to create Checkout Sessions on the account could otherwise pay $0.50
//      into a session that merely NAMES a $100,000 pending row and have it
//      completed and receipted for the row's amount. (paypal-capture already
//      rejects on amount mismatch; this mirrors it.)
//
// Also merges custom_fields.stripe_payment_intent = <pi_…> (never clobbering
// other keys) so refund and dispute events, which only carry the
// PaymentIntent id, can find the row directly. payment_intent_id keeps
// storing the Checkout Session id (cs_…), as the verify path always has, so
// existing lookups keep working.

// deno-lint-ignore-file no-explicit-any
import { fundLabels } from "./fund-labels.ts";
import { sendDonationReceipt, receiptNumberFor } from "./receipt.ts";
import { checkoutMismatch } from "./stripe-webhook-events.ts";

export interface CompleteStripeDonationArgs {
  donationId: string;
  /** Checkout Session id (cs_…). */
  sessionId: string;
  /** PaymentIntent id (pi_…) from the session, if Stripe provided one. */
  paymentIntent: string | null;
  /**
   * session.amount_total in CENTS. Omit (undefined) to skip the check;
   * pass null when the session carried none — that is treated as a mismatch,
   * because a caller who expected to verify and could not must not complete.
   */
  amountTotal?: number | null;
  /** session.currency, lowercase. Same undefined/null semantics as amountTotal. */
  currency?: string | null;
  /** Log prefix, e.g. "[stripe-webhook]". */
  tag: string;
}

export type CompleteStripeDonationResult =
  | { ok: false; reason: "not_found" | "db_error" }
  | {
      ok: false;
      reason: "mismatch";
      /** What did not line up, for the log / response. */
      detail: string;
    }
  | {
      ok: true;
      /** true only for the call that actually moved pending -> completed. */
      flipped: boolean;
      /** true only for the call that won the receipt claim (and emailed). */
      receiptSent: boolean;
      statusBefore: string;
    };

export function asRecord(v: unknown): Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : {};
}

/**
 * Resolves the receipt label for a fund slug: the admin-managed
 * donation_types name first, then the legacy fundLabels map, then a generic
 * label — the same precedence as donate handleVerify.
 */
export async function resolveFundLabel(supabase: any, fundType: string): Promise<string> {
  const { data: fundRow } = await supabase
    .from("donation_types")
    .select("name")
    .eq("slug", fundType)
    .maybeSingle();
  return fundRow?.name ?? fundLabels[fundType] ?? "Temple Fund";
}

/**
 * Merges custom_fields.stripe_payment_intent into an existing row without
 * touching its other keys. Re-reads the row first so a concurrent writer
 * (e.g. a refund record) is not clobbered. Best-effort: logs and returns.
 */
export async function mergeStripePaymentIntent(
  supabase: any,
  donationId: string,
  paymentIntent: string,
  tag: string,
): Promise<void> {
  const { data: fresh, error } = await supabase
    .from("donations")
    .select("custom_fields")
    .eq("id", donationId)
    .maybeSingle();
  if (error || !fresh) {
    console.error(`${tag} could not re-read custom_fields for pi merge`, {
      donationId,
      error: error?.message,
    });
    return;
  }
  const cf = asRecord(fresh.custom_fields);
  if (cf.stripe_payment_intent === paymentIntent) return;
  const { error: mergeError } = await supabase
    .from("donations")
    .update({ custom_fields: { ...cf, stripe_payment_intent: paymentIntent } })
    .eq("id", donationId);
  if (mergeError) {
    console.error(`${tag} stripe_payment_intent merge failed`, {
      donationId,
      error: mergeError.message,
    });
  }
}

/** The donation columns the receipt path needs. */
export interface ReceiptRowFields {
  amount: unknown;
  fund_type: string;
  donor_email: string | null;
  donor_name: string | null;
  user_id: string | null;
}

export type ClaimReceiptResult =
  | { ok: false; reason: "db_error" }
  | { ok: true; receiptSent: boolean };

/**
 * Claims the receipt on the dedicated tax_receipt_sent flag and, on winning,
 * back-links a guest gift and emails the receipt. A single flag every sender
 * (verify, webhook, admin mark-received, dispute reinstatement) competes for,
 * so exactly one receipt goes out per donation no matter which path completes
 * it. See donate/index.ts handleVerify for why neither the flip nor
 * payment_intent_id can serve as the marker. Only a 'completed' row can be
 * claimed, so a caller that lost its flip (or flipped elsewhere) is silent.
 */
export async function claimAndSendReceipt(
  supabase: any,
  donationId: string,
  row: ReceiptRowFields,
  tag: string,
): Promise<ClaimReceiptResult> {
  const { data: claimed, error: claimError } = await supabase
    .from("donations")
    .update({ tax_receipt_sent: true })
    .eq("id", donationId)
    .eq("payment_status", "completed")
    .eq("tax_receipt_sent", false)
    .select("id")
    .maybeSingle();
  if (claimError) {
    // Not swallowed: the caller answers 500 and Stripe redelivers; the claim
    // guard makes the retry send at most one email.
    console.error(`${tag} receipt claim failed`, { donationId, error: claimError.message });
    return { ok: false, reason: "db_error" };
  }
  if (!claimed) return { ok: true, receiptSent: false };

  // Back-link guest gifts to a matching devotee account by exact normalized
  // email (never ilike: "_"/"%" in an address are SQL wildcards), so the gift
  // shows in their dashboard and year-end acknowledgment.
  if (!row.user_id && row.donor_email) {
    const { data: prof, error: lookupError } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", String(row.donor_email).trim().toLowerCase())
      .maybeSingle();
    if (lookupError) {
      console.error(`${tag} profile lookup failed`, { donationId, error: lookupError.message });
    }
    if (prof?.id) {
      const { error: linkError } = await supabase
        .from("donations")
        .update({ user_id: prof.id })
        .eq("id", donationId)
        .is("user_id", null);
      if (linkError) {
        console.error(`${tag} back-link failed`, { donationId, error: linkError.message });
      }
    }
  }

  const fundLabel = await resolveFundLabel(supabase, row.fund_type);
  await sendDonationReceipt({
    to: row.donor_email,
    donorName: row.donor_name,
    amount: Number(row.amount),
    fundLabel,
    receiptNumber: receiptNumberFor(donationId),
  });
  return { ok: true, receiptSent: true };
}

export async function completeStripeDonation(
  supabase: any,
  args: CompleteStripeDonationArgs,
): Promise<CompleteStripeDonationResult> {
  const { donationId, sessionId, paymentIntent, amountTotal, currency, tag } = args;

  const { data, error } = await supabase
    .from("donations")
    .select(
      "amount, fund_type, donor_email, donor_name, payment_status, payment_method, user_id, custom_fields",
    )
    .eq("id", donationId)
    .maybeSingle();

  if (error) {
    console.error(`${tag} donation fetch failed`, { donationId, error: error.message });
    return { ok: false, reason: "db_error" };
  }
  if (!data) {
    console.error(`${tag} donation not found`, { donationId, sessionId });
    return { ok: false, reason: "not_found" };
  }

  // Refuse before touching the row: the session must be a Stripe payment of
  // exactly this row's amount in USD. A mismatch is not transient, so the
  // caller acknowledges it (200) rather than having Stripe retry; the log is
  // the alarm.
  const mismatch = checkoutMismatch(data, amountTotal, currency);
  if (mismatch) {
    console.error(`${tag} checkout session does not match donation — NOT completed`, {
      donationId,
      sessionId,
      paymentIntent,
      detail: mismatch,
      rowStatus: data.payment_status,
    });
    return { ok: false, reason: "mismatch", detail: mismatch };
  }

  // Carry the PaymentIntent id along with the flip so the common case (this
  // call wins) needs no second write. Merge, never replace: custom_fields
  // holds donor-entered fields (phone, gotram, …) from checkout.
  const cf = asRecord(data.custom_fields);
  const needsPiMerge = !!paymentIntent && cf.stripe_payment_intent !== paymentIntent;
  const flipPatch: Record<string, unknown> = {
    payment_status: "completed",
    payment_intent_id: sessionId,
    ...(needsPiMerge ? { custom_fields: { ...cf, stripe_payment_intent: paymentIntent } } : {}),
  };

  // Atomic flip: only the caller that actually transitions pending -> completed
  // updates a row. A replayed event or a concurrent GET verify updates 0 rows.
  // A row a refund/dispute event already moved to 'refunded' (the money came
  // and went before this event was delivered) also updates 0 rows and, being
  // not 'completed', can never win the receipt claim below.
  const { data: updated, error: flipError } = await supabase
    .from("donations")
    .update(flipPatch)
    .eq("id", donationId)
    .eq("payment_status", "pending")
    .select("id")
    .maybeSingle();
  if (flipError) {
    // Stripe HAS captured the money at this point. Surface it so the caller
    // answers 500 and Stripe redelivers; a swallowed error would leave the
    // donor charged with the row stuck 'pending' and no receipt, forever.
    console.error(`${tag} failed to flip donation to completed`, {
      donationId,
      sessionId,
      error: flipError.message,
    });
    return { ok: false, reason: "db_error" };
  }
  const flipped = Boolean(updated);

  // Lost the flip (the donor's verify got there first): the pi merge above did
  // not apply, so store it separately on the already-completed row.
  if (!flipped && needsPiMerge && paymentIntent) {
    await mergeStripePaymentIntent(supabase, donationId, paymentIntent, tag);
  }

  const receipt = await claimAndSendReceipt(supabase, donationId, data, tag);
  if (!receipt.ok) return receipt;

  return {
    ok: true,
    flipped,
    receiptSent: receipt.receiptSent,
    statusBefore: String(data.payment_status ?? ""),
  };
}
