// Pure event routing for the stripe-webhook edge function.
//
// Deliberately free of Deno globals, network calls and imports so the very
// same module is (a) bundled into the Deno function and (b) unit-tested from
// vitest (src/__tests__/lib/stripe-webhook-events.test.ts) — Deno is not part
// of the Node toolchain here. Keep it that way: every side effect (DB, Stripe
// API, email) belongs in stripe-webhook/index.ts or _shared/complete-donation.ts.
//
// Contract: given a verified Stripe event, decide WHAT the function should do
// and extract the few fields it needs, normalised (ids unwrapped from
// expanded objects, cents converted to dollars). Anything the function does
// not act on comes back as { kind: "ignore", reason } so it can be logged and
// acknowledged with 200 (Stripe must not retry irrelevant events forever).

export type StripeEventLike = {
  id: string;
  type: string;
  /** Unix seconds (Stripe `event.created`). */
  created?: number;
  data: { object: unknown };
};

export type CheckoutCompletedAction = {
  kind: "checkout_completed";
  donationId: string;
  /** Checkout Session id (cs_…): what donations.payment_intent_id stores. */
  sessionId: string;
  /** PaymentIntent id (pi_…): what refund and dispute events carry. */
  paymentIntent: string | null;
  /**
   * What Stripe actually collected, in CENTS as sent (null when the session
   * carries no amount_total). Cross-checked against donations.amount before
   * the flip so a session that merely NAMES a donation_id cannot complete a
   * row for a different amount.
   */
  amountTotal: number | null;
  /** Lowercase ISO code as sent (null when absent). Must be "usd". */
  currency: string | null;
};

export type RefundSource =
  | "charge.refunded"
  | "charge.dispute.created"
  | "charge.dispute.funds_withdrawn";

export type RefundAction = {
  kind: "refund";
  source: RefundSource;
  paymentIntent: string | null;
  chargeId: string | null;
  /** Dollars. Stripe sends integer cents; converted here exactly once. */
  amountRefunded: number;
  /** Dollars; null when the event does not carry the original charge amount. */
  amountCharged: number | null;
  /** true = only part of the gift went back; null = unknown (dispute without an expanded charge). */
  partial: boolean | null;
  reason: string | null;
  /** ISO instant of the Stripe event when it carries `created`, else null. */
  occurredAt: string | null;
};

export type ReinstateSource =
  | "charge.dispute.funds_reinstated"
  | "charge.dispute.closed";

/**
 * The temple WON a dispute: Stripe put the withheld funds back. Only ever
 * reverses a refund that a charge.dispute.* event caused, never a genuine
 * charge.refunded (the function enforces that against the stored record).
 */
export type ReinstateAction = {
  kind: "reinstate";
  source: ReinstateSource;
  paymentIntent: string | null;
  chargeId: string | null;
  /** Dollars reinstated (the dispute amount). */
  amount: number;
  occurredAt: string | null;
};

export type IgnoreAction = { kind: "ignore"; reason: string };

export type WebhookAction =
  | CheckoutCompletedAction
  | RefundAction
  | ReinstateAction
  | IgnoreAction;

/** Events the Stripe dashboard endpoint must be subscribed to. */
export const CHECKOUT_EVENTS = [
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
] as const;
export const REFUND_EVENTS = [
  "charge.refunded",
  "charge.dispute.created",
  "charge.dispute.funds_withdrawn",
] as const;
export const REINSTATE_EVENTS = [
  "charge.dispute.closed",
  "charge.dispute.funds_reinstated",
] as const;
export const ALL_WEBHOOK_EVENTS = [
  ...CHECKOUT_EVENTS,
  ...REFUND_EVENTS,
  ...REINSTATE_EVENTS,
] as const;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Rec = Record<string, unknown>;

function isRecord(v: unknown): v is Rec {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Stripe fields typed `string | ExpandedObject | null` → the id, or null. */
function idOf(v: unknown): string | null {
  if (typeof v === "string") return v || null;
  if (isRecord(v) && typeof v.id === "string") return v.id || null;
  return null;
}

function centsToDollars(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? Math.round(v) / 100 : null;
}

function occurredAt(event: StripeEventLike): string | null {
  return typeof event.created === "number" && Number.isFinite(event.created)
    ? new Date(event.created * 1000).toISOString()
    : null;
}

function ignore(reason: string): IgnoreAction {
  return { kind: "ignore", reason };
}

/**
 * Why a Checkout Session must NOT complete a donation row, or null when they
 * line up. Lives here (not in complete-donation.ts) so it stays pure and
 * unit-tested. Semantics of amountTotal / currency: undefined = the caller
 * has nothing to check against (skip); null = the caller expected to check
 * and the session carried nothing (refuse — a completion that cannot be
 * verified is not a completion).
 */
export function checkoutMismatch(
  row: { amount: unknown; payment_method: string | null },
  amountTotal: number | null | undefined,
  currency: string | null | undefined,
): string | null {
  if (row.payment_method !== "stripe") {
    return `row payment_method is ${JSON.stringify(row.payment_method)}, not "stripe"`;
  }
  if (currency !== undefined) {
    if (currency === null) return "session carries no currency";
    if (currency.toLowerCase() !== "usd") {
      return `session currency is ${JSON.stringify(currency)}, not "usd"`;
    }
  }
  if (amountTotal !== undefined) {
    if (amountTotal === null || !Number.isFinite(amountTotal)) {
      return "session carries no amount_total";
    }
    const expected = Number(row.amount);
    if (!Number.isFinite(expected) || Math.abs(amountTotal / 100 - expected) > 0.005) {
      return `session amount_total ${amountTotal} cents != row amount ${String(row.amount)}`;
    }
  }
  return null;
}

export function routeStripeEvent(event: StripeEventLike): WebhookAction {
  const obj = event?.data?.object;
  if (!isRecord(obj)) return ignore("event has no data.object");

  if (
    event.type === "checkout.session.completed" ||
    event.type === "checkout.session.async_payment_succeeded"
  ) {
    // Same gate as donate/index.ts handleVerify: our donation sessions carry
    // metadata {type:'donation', donation_id} and must be complete AND paid.
    // Anything else (a future booking checkout, a session that expired, a
    // delayed-settlement method still 'unpaid') is not a completed gift.
    const meta = isRecord(obj.metadata) ? obj.metadata : {};
    if (meta.type !== "donation") {
      return ignore(
        `metadata.type is ${JSON.stringify(meta.type ?? null)}, not "donation"`,
      );
    }
    const donationId =
      typeof meta.donation_id === "string" ? meta.donation_id.trim() : "";
    // donations.id is a uuid PK; a non-uuid would make the lookup itself error.
    if (!UUID_RE.test(donationId)) {
      return ignore("metadata.donation_id missing or not a uuid");
    }
    if (obj.status !== "complete") {
      return ignore(`session.status is ${JSON.stringify(obj.status ?? null)}`);
    }
    if (obj.payment_status !== "paid") {
      return ignore(
        `session.payment_status is ${JSON.stringify(obj.payment_status ?? null)} ` +
          "(delayed payment method? checkout.session.async_payment_succeeded follows)",
      );
    }
    const sessionId = typeof obj.id === "string" ? obj.id : "";
    if (!sessionId) return ignore("session has no id");
    return {
      kind: "checkout_completed",
      donationId,
      sessionId,
      paymentIntent: idOf(obj.payment_intent),
      // Kept in cents (no rounding here): complete-donation compares against
      // the row's dollar amount with a half-cent tolerance.
      amountTotal:
        typeof obj.amount_total === "number" && Number.isFinite(obj.amount_total)
          ? obj.amount_total
          : null,
      currency: typeof obj.currency === "string" ? obj.currency.toLowerCase() : null,
    };
  }

  if (event.type === "charge.refunded") {
    // Fires for BOTH partial and full refunds; amount_refunded is cumulative.
    const amountRefunded = centsToDollars(obj.amount_refunded) ?? 0;
    if (amountRefunded <= 0) return ignore("charge.refunded with amount_refunded 0");
    const amountCharged = centsToDollars(obj.amount);
    // charge.refunds is only present when the endpoint's API version still
    // embeds it (pre 2022-11-15) — newest refund first when it is.
    const refunds =
      isRecord(obj.refunds) && Array.isArray(obj.refunds.data) ? obj.refunds.data : [];
    const latest = refunds.find(isRecord);
    const reason = latest && typeof latest.reason === "string" ? latest.reason : null;
    return {
      kind: "refund",
      source: "charge.refunded",
      paymentIntent: idOf(obj.payment_intent),
      chargeId: typeof obj.id === "string" ? obj.id : null,
      amountRefunded,
      amountCharged,
      partial:
        amountCharged === null ? obj.refunded !== true : amountRefunded < amountCharged,
      reason,
      occurredAt: occurredAt(event),
    };
  }

  if (
    event.type === "charge.dispute.created" ||
    event.type === "charge.dispute.funds_withdrawn"
  ) {
    const status = typeof obj.status === "string" ? obj.status : "";
    // An inquiry / early-fraud "warning_*" dispute does NOT withdraw funds: the
    // gift is still in the temple's account, so it stays 'completed'. If it
    // escalates to a chargeback Stripe sends charge.dispute.funds_withdrawn,
    // which is handled unconditionally below.
    if (event.type === "charge.dispute.created" && status.startsWith("warning_")) {
      return ignore(`dispute status ${status}: funds not withdrawn`);
    }
    const amountRefunded = centsToDollars(obj.amount) ?? 0;
    if (amountRefunded <= 0) return ignore("dispute with amount 0");
    const charge = obj.charge;
    const amountCharged = isRecord(charge) ? centsToDollars(charge.amount) : null;
    return {
      kind: "refund",
      source: event.type,
      paymentIntent:
        idOf(obj.payment_intent) ?? (isRecord(charge) ? idOf(charge.payment_intent) : null),
      chargeId: idOf(charge),
      amountRefunded,
      amountCharged,
      partial: amountCharged === null ? null : amountRefunded < amountCharged,
      reason: typeof obj.reason === "string" && obj.reason ? `dispute:${obj.reason}` : "dispute",
      occurredAt: occurredAt(event),
    };
  }

  if (
    event.type === "charge.dispute.closed" ||
    event.type === "charge.dispute.funds_reinstated"
  ) {
    // funds_reinstated is Stripe's explicit "money is back" signal and is
    // acted on whatever the status. closed fires for every outcome (won, lost,
    // warning_closed); only a WON dispute returns the funds, so the others
    // are ignored — a lost one already flipped the row via funds_withdrawn.
    const status = typeof obj.status === "string" ? obj.status : "";
    if (event.type === "charge.dispute.closed" && status !== "won") {
      return ignore(`dispute closed with status ${JSON.stringify(status || null)}: nothing to reinstate`);
    }
    const amount = centsToDollars(obj.amount) ?? 0;
    if (amount <= 0) return ignore("dispute reinstatement with amount 0");
    const charge = obj.charge;
    return {
      kind: "reinstate",
      source: event.type,
      paymentIntent:
        idOf(obj.payment_intent) ?? (isRecord(charge) ? idOf(charge.payment_intent) : null),
      chargeId: idOf(charge),
      amount,
      occurredAt: occurredAt(event),
    };
  }

  return ignore(`unhandled event type ${event.type}`);
}
