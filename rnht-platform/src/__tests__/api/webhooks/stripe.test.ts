import { describe, it, expect, vi, beforeEach } from "vitest";
import Stripe from "stripe";

const WEBHOOK_SECRET = "whsec_test_" + "a".repeat(40);
process.env.STRIPE_WEBHOOK_SECRET = WEBHOOK_SECRET;
process.env.STRIPE_SECRET_KEY = "sk_test_dummy_for_tests";

const realStripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16" as Stripe.LatestApiVersion,
});

const {
  supabaseUpdate,
  supabaseEq,
  supabaseIn,
  supabaseSelect,
  supabaseMaybeSingle,
  fromMock,
  checkAndSendReceipt,
} = vi.hoisted(() => {
  const supabaseUpdate = vi.fn().mockReturnThis();
  const supabaseEq = vi.fn().mockReturnThis();
  const supabaseIn = vi.fn().mockResolvedValue({ error: null });
  const supabaseSelect = vi.fn().mockReturnThis();
  const supabaseMaybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
  const fromMock = vi.fn(() => ({
    update: supabaseUpdate,
    eq: supabaseEq,
    in: supabaseIn,
    select: supabaseSelect,
    maybeSingle: supabaseMaybeSingle,
  }));
  const checkAndSendReceipt = vi.fn().mockResolvedValue(undefined);
  return {
    supabaseUpdate,
    supabaseEq,
    supabaseIn,
    supabaseSelect,
    supabaseMaybeSingle,
    fromMock,
    checkAndSendReceipt,
  };
});

vi.mock("@/lib/supabase", () => ({
  getServiceSupabase: () => ({ from: fromMock }),
  supabase: { auth: {}, from: fromMock },
}));

vi.mock("@/lib/stripe-server", () => ({
  getStripeServer: () => realStripe,
}));

vi.mock("@/lib/donation-receipts", () => ({
  checkAndSendReceipt,
}));

import { POST } from "@/app/api/webhooks/stripe/route";

function signedRequest(payload: unknown) {
  const body = JSON.stringify(payload);
  const header = realStripe.webhooks.generateTestHeaderString({
    payload: body,
    secret: WEBHOOK_SECRET,
  });
  return new Request("http://localhost/api/webhooks/stripe", {
    method: "POST",
    headers: { "stripe-signature": header, "content-type": "application/json" },
    body,
  });
}

function buildEvent<T extends Stripe.Event.Type>(type: T, object: unknown): Stripe.Event {
  return {
    id: "evt_test_" + Math.random().toString(36).slice(2),
    object: "event",
    api_version: "2023-10-16",
    created: Math.floor(Date.now() / 1000),
    type,
    data: { object } as Stripe.Event["data"],
    livemode: false,
    pending_webhooks: 0,
    request: { id: null, idempotency_key: null },
  } as unknown as Stripe.Event;
}

describe("POST /api/webhooks/stripe", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    supabaseIn.mockResolvedValue({ error: null });
    supabaseMaybeSingle.mockResolvedValue({ data: null, error: null });
  });

  it("returns 400 when stripe-signature header is missing", async () => {
    const req = new Request("http://localhost/api/webhooks/stripe", {
      method: "POST",
      body: "{}",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = (await res.json()) as { error: string };
    expect(json.error).toMatch(/missing signature/i);
  });

  it("returns 400 when signature is invalid", async () => {
    const req = new Request("http://localhost/api/webhooks/stripe", {
      method: "POST",
      headers: { "stripe-signature": "t=1,v1=bogus" },
      body: JSON.stringify({ type: "checkout.session.completed" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = (await res.json()) as { error: string };
    expect(json.error).toMatch(/invalid signature/i);
  });

  it("returns 500 when STRIPE_WEBHOOK_SECRET is missing", async () => {
    const saved = process.env.STRIPE_WEBHOOK_SECRET;
    delete process.env.STRIPE_WEBHOOK_SECRET;
    try {
      const req = new Request("http://localhost/api/webhooks/stripe", {
        method: "POST",
        headers: { "stripe-signature": "t=1,v1=x" },
        body: "{}",
      });
      const res = await POST(req);
      expect(res.status).toBe(500);
    } finally {
      process.env.STRIPE_WEBHOOK_SECRET = saved;
    }
  });

  it("accepts a valid booking checkout.session.completed and marks bookings paid", async () => {
    const event = buildEvent("checkout.session.completed", {
      id: "cs_test_1",
      object: "checkout.session",
      payment_intent: "pi_test_1",
      metadata: { type: "booking", booking_ids: JSON.stringify(["bk-1", "bk-2"]) },
    });

    const res = await POST(signedRequest(event));
    expect(res.status).toBe(200);
    const json = (await res.json()) as { received: boolean };
    expect(json.received).toBe(true);

    expect(fromMock).toHaveBeenCalledWith("bookings");
    expect(supabaseUpdate).toHaveBeenCalledWith({
      payment_status: "paid",
      payment_intent_id: "pi_test_1",
      status: "confirmed",
    });
    expect(supabaseIn).toHaveBeenCalledWith("id", ["bk-1", "bk-2"]);
  });

  it("accepts a valid donation checkout.session.completed and marks donation completed", async () => {
    supabaseMaybeSingle.mockResolvedValueOnce({ data: { user_id: null }, error: null });
    const event = buildEvent("checkout.session.completed", {
      id: "cs_test_2",
      object: "checkout.session",
      metadata: { type: "donation", donation_id: "don-42" },
    });

    const res = await POST(signedRequest(event));
    expect(res.status).toBe(200);

    expect(fromMock).toHaveBeenCalledWith("donations");
    expect(supabaseUpdate).toHaveBeenCalledWith({ payment_status: "completed" });
    expect(supabaseEq).toHaveBeenCalledWith("id", "don-42");
  });

  it("skips booking update when booking_ids is empty", async () => {
    const event = buildEvent("checkout.session.completed", {
      id: "cs_test_3",
      object: "checkout.session",
      metadata: { type: "booking", booking_ids: JSON.stringify([]) },
    });
    const res = await POST(signedRequest(event));
    expect(res.status).toBe(200);
    expect(supabaseIn).not.toHaveBeenCalled();
  });

  it("ignores unrelated event types with 200", async () => {
    const event = buildEvent("customer.created", {
      id: "cus_test",
      object: "customer",
    });
    const res = await POST(signedRequest(event));
    expect(res.status).toBe(200);
    expect(fromMock).not.toHaveBeenCalled();
  });
});
