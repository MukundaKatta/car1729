import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  capturePayPalOrder,
  supabaseUpdate,
  supabaseEq,
  supabaseSelect,
  supabaseMaybeSingle,
  fromMock,
  checkAndSendReceipt,
} = vi.hoisted(() => {
  const capturePayPalOrder = vi.fn();
  const supabaseUpdate = vi.fn().mockReturnThis();
  const supabaseEq = vi.fn().mockReturnThis();
  const supabaseSelect = vi.fn().mockReturnThis();
  const supabaseMaybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
  const fromMock = vi.fn(() => ({
    update: supabaseUpdate,
    eq: supabaseEq,
    select: supabaseSelect,
    maybeSingle: supabaseMaybeSingle,
  }));
  const checkAndSendReceipt = vi.fn().mockResolvedValue(undefined);
  return {
    capturePayPalOrder,
    supabaseUpdate,
    supabaseEq,
    supabaseSelect,
    supabaseMaybeSingle,
    fromMock,
    checkAndSendReceipt,
  };
});

vi.mock("@/lib/paypal-server", () => ({
  capturePayPalOrder,
}));

vi.mock("@/lib/supabase", () => ({
  getServiceSupabase: () => ({ from: fromMock }),
  supabase: { auth: {}, from: fromMock },
}));

vi.mock("@/lib/donation-receipts", () => ({
  checkAndSendReceipt,
}));

import { POST } from "@/app/api/webhooks/paypal/route";

function jsonRequest(body: unknown) {
  return new Request("http://localhost/api/webhooks/paypal", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/webhooks/paypal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    supabaseMaybeSingle.mockResolvedValue({ data: null, error: null });
  });

  it("returns 400 when orderId is missing", async () => {
    const res = await POST(jsonRequest({}));
    expect(res.status).toBe(400);
    const json = (await res.json()) as { error: string };
    expect(json.error).toMatch(/missing orderid/i);
    expect(capturePayPalOrder).not.toHaveBeenCalled();
  });

  it("captures and marks donation completed on COMPLETED status", async () => {
    capturePayPalOrder.mockResolvedValueOnce({
      status: "COMPLETED",
      donationId: "don-9",
    });

    const res = await POST(jsonRequest({ orderId: "ORD-1" }));
    expect(res.status).toBe(200);
    const json = (await res.json()) as { status: string };
    expect(json.status).toBe("COMPLETED");
    expect(capturePayPalOrder).toHaveBeenCalledWith("ORD-1");
    expect(fromMock).toHaveBeenCalledWith("donations");
    expect(supabaseUpdate).toHaveBeenCalledWith({ payment_status: "completed" });
    expect(supabaseEq).toHaveBeenCalledWith("id", "don-9");
  });

  it("fires checkAndSendReceipt when donation has a user_id", async () => {
    capturePayPalOrder.mockResolvedValueOnce({
      status: "COMPLETED",
      donationId: "don-9",
    });
    supabaseMaybeSingle.mockResolvedValueOnce({
      data: { user_id: "user-1" },
      error: null,
    });

    const res = await POST(jsonRequest({ orderId: "ORD-2" }));
    expect(res.status).toBe(200);
    expect(checkAndSendReceipt).toHaveBeenCalledWith("user-1");
  });

  it("skips receipt when user_id is null", async () => {
    capturePayPalOrder.mockResolvedValueOnce({
      status: "COMPLETED",
      donationId: "don-9",
    });
    supabaseMaybeSingle.mockResolvedValueOnce({ data: { user_id: null }, error: null });

    await POST(jsonRequest({ orderId: "ORD-3" }));
    expect(checkAndSendReceipt).not.toHaveBeenCalled();
  });

  it("does not touch supabase when capture status is not COMPLETED", async () => {
    capturePayPalOrder.mockResolvedValueOnce({ status: "PENDING", donationId: "don-x" });
    const res = await POST(jsonRequest({ orderId: "ORD-4" }));
    expect(res.status).toBe(200);
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("returns 500 when capture throws", async () => {
    capturePayPalOrder.mockRejectedValueOnce(new Error("PayPal boom"));
    const res = await POST(jsonRequest({ orderId: "ORD-5" }));
    expect(res.status).toBe(500);
    const json = (await res.json()) as { error: string };
    expect(json.error).toMatch(/failed to capture/i);
  });
});
