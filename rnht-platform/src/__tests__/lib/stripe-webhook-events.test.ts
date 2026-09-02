import { describe, it, expect } from "vitest";
import {
  routeStripeEvent,
  checkoutMismatch,
  CHECKOUT_EVENTS,
  REFUND_EVENTS,
  REINSTATE_EVENTS,
  ALL_WEBHOOK_EVENTS,
  type StripeEventLike,
} from "../../../supabase/functions/_shared/stripe-webhook-events";

const DONATION_ID = "0b6d2c2e-8d5e-4c58-9d1a-8a3a2c0e1f11";

function ev(type: string, object: unknown, extra: Partial<StripeEventLike> = {}): StripeEventLike {
  return { id: "evt_test_1", type, data: { object }, ...extra };
}

function session(overrides: Record<string, unknown> = {}) {
  return {
    id: "cs_test_abc",
    object: "checkout.session",
    status: "complete",
    payment_status: "paid",
    payment_intent: "pi_test_123",
    amount_total: 10000,
    currency: "usd",
    metadata: { type: "donation", donation_id: DONATION_ID },
    ...overrides,
  };
}

describe("routeStripeEvent: checkout", () => {
  it("routes a paid donation session to checkout_completed with the ids and amount it needs", () => {
    expect(routeStripeEvent(ev("checkout.session.completed", session()))).toEqual({
      kind: "checkout_completed",
      donationId: DONATION_ID,
      sessionId: "cs_test_abc",
      paymentIntent: "pi_test_123",
      amountTotal: 10000,
      currency: "usd",
    });
  });

  it("keeps amount_total in cents, lowercases currency, and nulls both when absent", () => {
    expect(
      routeStripeEvent(ev("checkout.session.completed", session({ amount_total: 2550, currency: "USD" }))),
    ).toMatchObject({ amountTotal: 2550, currency: "usd" });
    expect(
      routeStripeEvent(ev("checkout.session.completed", session({ amount_total: null, currency: null }))),
    ).toMatchObject({ kind: "checkout_completed", amountTotal: null, currency: null });
    expect(
      routeStripeEvent(ev("checkout.session.completed", session({ amount_total: "10000" }))),
    ).toMatchObject({ amountTotal: null });
  });

  it("unwraps an expanded payment_intent object and tolerates a null one", () => {
    const expanded = routeStripeEvent(
      ev("checkout.session.completed", session({ payment_intent: { id: "pi_obj", object: "payment_intent" } })),
    );
    expect(expanded).toMatchObject({ kind: "checkout_completed", paymentIntent: "pi_obj" });
    const none = routeStripeEvent(ev("checkout.session.completed", session({ payment_intent: null })));
    expect(none).toMatchObject({ kind: "checkout_completed", paymentIntent: null });
  });

  it("treats async_payment_succeeded exactly like completed (delayed methods settle later)", () => {
    expect(routeStripeEvent(ev("checkout.session.async_payment_succeeded", session()))).toMatchObject({
      kind: "checkout_completed",
      donationId: DONATION_ID,
    });
  });

  it("ignores sessions that are not donations", () => {
    const r = routeStripeEvent(
      ev("checkout.session.completed", session({ metadata: { type: "booking", booking_ids: "[]" } })),
    );
    expect(r.kind).toBe("ignore");
    expect((r as { reason: string }).reason).toMatch(/not "donation"/);
  });

  it("ignores a donation session that is complete but not paid (unpaid delayed method)", () => {
    const r = routeStripeEvent(ev("checkout.session.completed", session({ payment_status: "unpaid" })));
    expect(r).toMatchObject({ kind: "ignore" });
    expect((r as { reason: string }).reason).toMatch(/payment_status is "unpaid"/);
  });

  it("ignores a session whose status is not complete", () => {
    const r = routeStripeEvent(ev("checkout.session.completed", session({ status: "expired" })));
    expect(r).toMatchObject({ kind: "ignore" });
  });

  it("ignores a donation_id that is missing or not a uuid (would error the PK lookup)", () => {
    expect(
      routeStripeEvent(ev("checkout.session.completed", session({ metadata: { type: "donation" } }))).kind,
    ).toBe("ignore");
    expect(
      routeStripeEvent(
        ev("checkout.session.completed", session({ metadata: { type: "donation", donation_id: "1 OR 1=1" } })),
      ).kind,
    ).toBe("ignore");
  });

  it("trims whitespace around a valid donation_id", () => {
    const r = routeStripeEvent(
      ev("checkout.session.completed", session({ metadata: { type: "donation", donation_id: ` ${DONATION_ID} ` } })),
    );
    expect(r).toMatchObject({ kind: "checkout_completed", donationId: DONATION_ID });
  });
});

describe("checkoutMismatch: the session must be a USD Stripe payment of exactly the row's amount", () => {
  const row = (overrides: Partial<{ amount: unknown; payment_method: string | null }> = {}) => ({
    amount: "100.00", // Supabase returns numeric as a string
    payment_method: "stripe",
    ...overrides,
  });

  it("accepts an exact match, including a numeric amount and an uppercase currency", () => {
    expect(checkoutMismatch(row(), 10000, "usd")).toBeNull();
    expect(checkoutMismatch(row({ amount: 100 }), 10000, "USD")).toBeNull();
    expect(checkoutMismatch(row({ amount: 25.5 }), 2550, "usd")).toBeNull();
  });

  it("rejects a session that names the row but paid a different amount (the $0.50-for-$100,000 case)", () => {
    expect(checkoutMismatch(row({ amount: 100000 }), 50, "usd")).toMatch(/amount_total 50 cents != row amount 100000/);
    expect(checkoutMismatch(row(), 10001, "usd")).toMatch(/amount_total/);
    expect(checkoutMismatch(row(), 9999, "usd")).toMatch(/amount_total/);
  });

  it("rejects a non-USD currency and a non-Stripe row (a pending Zelle/PayPal pledge cannot be completed by a card session)", () => {
    expect(checkoutMismatch(row(), 10000, "eur")).toMatch(/currency is "eur"/);
    expect(checkoutMismatch(row({ payment_method: "zelle" }), 10000, "usd")).toMatch(/payment_method is "zelle"/);
    expect(checkoutMismatch(row({ payment_method: "paypal" }), 10000, "usd")).toMatch(/payment_method/);
    expect(checkoutMismatch(row({ payment_method: null }), 10000, "usd")).toMatch(/payment_method is null/);
  });

  it("refuses when the caller expected to verify but the session carried nothing (null), and skips when told nothing (undefined)", () => {
    expect(checkoutMismatch(row(), null, "usd")).toMatch(/no amount_total/);
    expect(checkoutMismatch(row(), 10000, null)).toMatch(/no currency/);
    expect(checkoutMismatch(row(), undefined, undefined)).toBeNull();
    // payment_method is always checked, even with nothing else to compare.
    expect(checkoutMismatch(row({ payment_method: "zelle" }), undefined, undefined)).toMatch(/payment_method/);
  });

  it("rejects a row whose amount is not a number at all", () => {
    expect(checkoutMismatch(row({ amount: "abc" }), 10000, "usd")).toMatch(/amount_total/);
    expect(checkoutMismatch(row({ amount: null }), 10000, "usd")).toMatch(/amount_total/);
  });
});

describe("routeStripeEvent: refunds", () => {
  const charge = (overrides: Record<string, unknown> = {}) => ({
    id: "ch_test_1",
    object: "charge",
    amount: 10000,
    amount_refunded: 10000,
    refunded: true,
    payment_intent: "pi_test_123",
    refunds: { object: "list", data: [{ id: "re_1", reason: "requested_by_customer" }] },
    ...overrides,
  });

  it("maps a full charge.refunded to a refund action in dollars", () => {
    const r = routeStripeEvent(ev("charge.refunded", charge(), { created: 1_700_000_000 }));
    expect(r).toEqual({
      kind: "refund",
      source: "charge.refunded",
      paymentIntent: "pi_test_123",
      chargeId: "ch_test_1",
      amountRefunded: 100,
      amountCharged: 100,
      partial: false,
      reason: "requested_by_customer",
      occurredAt: new Date(1_700_000_000 * 1000).toISOString(),
    });
  });

  it("flags a partial refund and keeps the cumulative amount", () => {
    const r = routeStripeEvent(ev("charge.refunded", charge({ amount_refunded: 2550, refunded: false })));
    expect(r).toMatchObject({ kind: "refund", amountRefunded: 25.5, amountCharged: 100, partial: true });
  });

  it("copes with a charge that has no embedded refunds list (API >= 2022-11-15) and no created", () => {
    const r = routeStripeEvent(ev("charge.refunded", charge({ refunds: undefined })));
    expect(r).toMatchObject({ kind: "refund", reason: null, occurredAt: null });
  });

  it("falls back to the `refunded` flag for partial when the charge amount is absent", () => {
    const r = routeStripeEvent(ev("charge.refunded", charge({ amount: undefined, refunded: false })));
    expect(r).toMatchObject({ kind: "refund", amountCharged: null, partial: true });
  });

  it("ignores a charge.refunded that refunded nothing", () => {
    expect(routeStripeEvent(ev("charge.refunded", charge({ amount_refunded: 0 }))).kind).toBe("ignore");
  });

  it("keeps a null payment_intent (the function logs and acknowledges it)", () => {
    const r = routeStripeEvent(ev("charge.refunded", charge({ payment_intent: null })));
    expect(r).toMatchObject({ kind: "refund", paymentIntent: null });
  });
});

describe("routeStripeEvent: disputes", () => {
  const dispute = (overrides: Record<string, unknown> = {}) => ({
    id: "dp_test_1",
    object: "dispute",
    amount: 5000,
    charge: "ch_test_1",
    payment_intent: "pi_test_123",
    reason: "fraudulent",
    status: "needs_response",
    ...overrides,
  });

  it("treats a chargeback (funds withdrawn) as a refund", () => {
    const r = routeStripeEvent(ev("charge.dispute.created", dispute()));
    expect(r).toEqual({
      kind: "refund",
      source: "charge.dispute.created",
      paymentIntent: "pi_test_123",
      chargeId: "ch_test_1",
      amountRefunded: 50,
      amountCharged: null,
      partial: null,
      reason: "dispute:fraudulent",
      occurredAt: null,
    });
  });

  it("ignores an inquiry / early-fraud warning: funds are not withdrawn", () => {
    const r = routeStripeEvent(ev("charge.dispute.created", dispute({ status: "warning_needs_response" })));
    expect(r).toMatchObject({ kind: "ignore" });
    expect((r as { reason: string }).reason).toMatch(/funds not withdrawn/);
  });

  it("always treats charge.dispute.funds_withdrawn as a refund, whatever the status", () => {
    const r = routeStripeEvent(
      ev("charge.dispute.funds_withdrawn", dispute({ status: "warning_under_review" })),
    );
    expect(r).toMatchObject({ kind: "refund", source: "charge.dispute.funds_withdrawn", amountRefunded: 50 });
  });

  it("uses an expanded charge for the payment intent, charge id and partial flag", () => {
    const r = routeStripeEvent(
      ev(
        "charge.dispute.created",
        dispute({
          payment_intent: null,
          charge: { id: "ch_exp", object: "charge", amount: 10000, payment_intent: "pi_from_charge" },
        }),
      ),
    );
    expect(r).toMatchObject({
      kind: "refund",
      paymentIntent: "pi_from_charge",
      chargeId: "ch_exp",
      amountCharged: 100,
      partial: true,
    });
  });

  it("labels a dispute with no reason generically", () => {
    const r = routeStripeEvent(ev("charge.dispute.created", dispute({ reason: undefined })));
    expect(r).toMatchObject({ kind: "refund", reason: "dispute" });
  });

  describe("won: funds come back", () => {
    it("routes charge.dispute.closed with status won to reinstate", () => {
      const r = routeStripeEvent(
        ev("charge.dispute.closed", dispute({ status: "won" }), { created: 1_700_000_000 }),
      );
      expect(r).toEqual({
        kind: "reinstate",
        source: "charge.dispute.closed",
        paymentIntent: "pi_test_123",
        chargeId: "ch_test_1",
        amount: 50,
        occurredAt: new Date(1_700_000_000 * 1000).toISOString(),
      });
    });

    it("ignores charge.dispute.closed for every other outcome (lost already flipped via funds_withdrawn)", () => {
      for (const status of ["lost", "warning_closed", "needs_response", undefined]) {
        const r = routeStripeEvent(ev("charge.dispute.closed", dispute({ status })));
        expect(r.kind).toBe("ignore");
        expect((r as { reason: string }).reason).toMatch(/nothing to reinstate/);
      }
    });

    it("always routes charge.dispute.funds_reinstated to reinstate, whatever the status", () => {
      const r = routeStripeEvent(ev("charge.dispute.funds_reinstated", dispute({ status: "under_review" })));
      expect(r).toMatchObject({ kind: "reinstate", source: "charge.dispute.funds_reinstated", amount: 50 });
    });

    it("takes the payment intent and charge id from an expanded charge", () => {
      const r = routeStripeEvent(
        ev(
          "charge.dispute.funds_reinstated",
          dispute({
            payment_intent: null,
            charge: { id: "ch_exp", object: "charge", payment_intent: "pi_from_charge" },
          }),
        ),
      );
      expect(r).toMatchObject({ kind: "reinstate", paymentIntent: "pi_from_charge", chargeId: "ch_exp" });
    });

    it("ignores a reinstatement of nothing", () => {
      expect(routeStripeEvent(ev("charge.dispute.funds_reinstated", dispute({ amount: 0 }))).kind).toBe("ignore");
    });
  });
});

describe("routeStripeEvent: everything else", () => {
  it("ignores unrelated event types", () => {
    const r = routeStripeEvent(ev("invoice.payment_succeeded", { id: "in_1", object: "invoice" }));
    expect(r).toMatchObject({ kind: "ignore" });
    expect((r as { reason: string }).reason).toMatch(/unhandled event type invoice.payment_succeeded/);
  });

  it("ignores an event with no data.object", () => {
    expect(routeStripeEvent({ id: "evt", type: "charge.refunded", data: { object: null } }).kind).toBe("ignore");
    expect(routeStripeEvent({ id: "evt", type: "charge.refunded", data: { object: [] } }).kind).toBe("ignore");
  });

  it("publishes the exact event names the Stripe endpoint must subscribe to", () => {
    expect([...CHECKOUT_EVENTS, ...REFUND_EVENTS, ...REINSTATE_EVENTS]).toEqual([
      "checkout.session.completed",
      "checkout.session.async_payment_succeeded",
      "charge.refunded",
      "charge.dispute.created",
      "charge.dispute.funds_withdrawn",
      "charge.dispute.closed",
      "charge.dispute.funds_reinstated",
    ]);
    expect(ALL_WEBHOOK_EVENTS).toEqual([...CHECKOUT_EVENTS, ...REFUND_EVENTS, ...REINSTATE_EVENTS]);
  });

  it("routes every subscribed event type to a non-ignore action given a well-formed object", () => {
    const paid = session();
    const charge = { id: "ch", amount: 100, amount_refunded: 100, refunded: true, payment_intent: "pi" };
    const dispute = { id: "dp", amount: 100, charge: "ch", payment_intent: "pi", status: "won" };
    const objects: Record<string, unknown> = {
      "checkout.session.completed": paid,
      "checkout.session.async_payment_succeeded": paid,
      "charge.refunded": charge,
      "charge.dispute.created": { ...dispute, status: "needs_response" },
      "charge.dispute.funds_withdrawn": dispute,
      "charge.dispute.closed": dispute,
      "charge.dispute.funds_reinstated": dispute,
    };
    for (const type of ALL_WEBHOOK_EVENTS) {
      expect(routeStripeEvent(ev(type, objects[type])).kind, type).not.toBe("ignore");
    }
  });
});
