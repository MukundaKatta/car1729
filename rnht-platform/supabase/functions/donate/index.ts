// Supabase Edge Function: donate
//
// Replaces the Next.js /api/donate route for the static-export Firebase
// deploy. Handles:
//   POST  /functions/v1/donate          create Stripe Checkout session or
//                                       PayPal order; returns redirect URL
//   GET   /functions/v1/donate?session_id=X
//                                       verify Stripe session, mark
//                                       donation paid, return summary
//
// Required secrets (set via `supabase secrets set ... --env-file ...`):
//   STRIPE_SECRET_KEY            (sk_live_... or sk_test_...)
//   PAYPAL_CLIENT_ID
//   PAYPAL_SECRET
//   PAYPAL_MODE                  "live" or "sandbox" (default sandbox)
//   APP_URL                      e.g. https://rnht-platform.web.app
//
// Supabase auto-provides: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
//
// Recurring donations are intentionally not implemented here — the
// previous Next.js route created Stripe subscriptions and relied on
// `invoice.payment_succeeded` webhooks. Wire webhooks next, then
// re-enable subscriptions client-side.

// deno-lint-ignore-file no-explicit-any
import Stripe from "https://esm.sh/stripe@14.21.0?target=denonext";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { corsHeaders, jsonHeaders } from "../_shared/cors.ts";
import { fundLabels } from "../_shared/fund-labels.ts";

const STRIPE_KEY = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
const PAYPAL_CLIENT_ID = Deno.env.get("PAYPAL_CLIENT_ID") ?? "";
const PAYPAL_SECRET = Deno.env.get("PAYPAL_SECRET") ?? "";
const PAYPAL_MODE = Deno.env.get("PAYPAL_MODE") ?? "sandbox";
const APP_URL = Deno.env.get("APP_URL") ?? "https://rnht-platform.web.app";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const stripe = new Stripe(STRIPE_KEY, {
  apiVersion: "2024-06-20",
  httpClient: Stripe.createFetchHttpClient(),
});

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
});

interface DonateRequest {
  amount: number;
  fundType: string;
  donorName: string;
  donorEmail: string;
  message?: string;
  isAnonymous?: boolean;
  paymentMethod?: "stripe" | "paypal" | "zelle";
}

// If the caller is a signed-in devotee, the client passes their Supabase
// session token in x-user-token. We verify it server-side (never trust a raw
// id from the client) and stamp user_id so the donation shows in their
// dashboard history.
async function resolveUserId(req: Request): Promise<string | null> {
  const token = req.headers.get("x-user-token");
  if (!token) return null;
  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error) return null;
    return data?.user?.id ?? null;
  } catch {
    return null;
  }
}

interface PayPalOrder {
  id: string;
  approvalUrl: string;
}

async function paypalAccessToken(): Promise<string> {
  const base = PAYPAL_MODE === "live"
    ? "api.paypal.com"
    : "api.sandbox.paypal.com";
  const res = await fetch(`https://${base}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: "Basic " + btoa(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) {
    throw new Error(`PayPal auth failed: ${res.status} ${await res.text()}`);
  }
  const json = await res.json();
  return json.access_token as string;
}

async function createPayPalOrder(args: {
  amount: number;
  description: string;
  donationId: string;
}): Promise<PayPalOrder> {
  const base = PAYPAL_MODE === "live"
    ? "api.paypal.com"
    : "api.sandbox.paypal.com";
  const token = await paypalAccessToken();
  const res = await fetch(`https://${base}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: args.donationId,
          amount: { currency_code: "USD", value: args.amount.toFixed(2) },
          description: args.description,
        },
      ],
      application_context: {
        return_url:
          `${APP_URL}/donate?success=true&provider=paypal&token={ORDER_ID}`,
        cancel_url: `${APP_URL}/donate`,
      },
    }),
  });
  if (!res.ok) {
    throw new Error(`PayPal order create failed: ${res.status} ${await res.text()}`);
  }
  const order = await res.json();
  const approval = (order.links ?? []).find(
    (l: { rel: string; href: string }) => l.rel === "approve",
  );
  if (!approval?.href) {
    throw new Error("PayPal order missing approval link");
  }
  // PayPal returns the literal string "{ORDER_ID}" in the approval URL
  // template only when redirected through to PayPal; the approval URL
  // PayPal hands back already contains the real order ID.
  return { id: order.id as string, approvalUrl: approval.href as string };
}

async function handleCreate(req: Request): Promise<Response> {
  const body = (await req.json()) as DonateRequest;
  const {
    amount,
    fundType,
    donorName,
    donorEmail,
    message,
    isAnonymous,
    paymentMethod = "stripe",
  } = body;

  if (!amount || amount <= 0 || !donorName || !donorEmail) {
    return new Response(
      JSON.stringify({ error: "Missing required fields" }),
      { status: 400, headers: jsonHeaders },
    );
  }

  const label = fundLabels[fundType] ?? "Donation";
  const userId = await resolveUserId(req);

  const { data: donation, error: dbError } = await supabase
    .from("donations")
    .insert({
      user_id: userId,
      donor_name: donorName,
      donor_email: donorEmail,
      amount,
      fund_type: fundType,
      payment_method: paymentMethod,
      payment_status: "pending",
      is_recurring: false,
      message: message ?? null,
      is_anonymous: isAnonymous ?? false,
    })
    .select("id")
    .single();

  if (dbError || !donation) {
    console.error("Supabase insert error:", dbError);
    return new Response(
      JSON.stringify({ error: "Failed to create donation record" }),
      { status: 500, headers: jsonHeaders },
    );
  }

  // Zelle moves money outside the app — record the pledge as a pending
  // donation (it shows in the donor's dashboard; admins mark it completed in
  // Admin → Donations once the transfer arrives in the bank).
  if (paymentMethod === "zelle") {
    return new Response(
      JSON.stringify({ ok: true, donationId: donation.id }),
      { headers: jsonHeaders },
    );
  }

  if (paymentMethod === "paypal") {
    const order = await createPayPalOrder({
      amount,
      description: label,
      donationId: donation.id,
    });
    await supabase
      .from("donations")
      .update({ payment_intent_id: order.id })
      .eq("id", donation.id);
    return new Response(JSON.stringify({ url: order.approvalUrl }), {
      headers: jsonHeaders,
    });
  }

  // Stripe (default)
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: donorEmail,
    metadata: {
      type: "donation",
      donation_id: donation.id,
    },
    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: Math.round(amount * 100),
          product_data: { name: label },
        },
        quantity: 1,
      },
    ],
    success_url:
      `${APP_URL}/donate?success=true&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${APP_URL}/donate`,
  });

  return new Response(JSON.stringify({ url: session.url }), {
    headers: jsonHeaders,
  });
}

async function handleVerify(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const sessionId = url.searchParams.get("session_id");
  if (!sessionId) {
    return new Response(JSON.stringify({ error: "Missing session_id" }), {
      status: 400,
      headers: jsonHeaders,
    });
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId);
  const donationId = session.metadata?.donation_id;
  if (
    session.metadata?.type !== "donation" ||
    session.status !== "complete" ||
    session.payment_status !== "paid" ||
    !donationId
  ) {
    return new Response(JSON.stringify({ verified: false }), {
      status: 400,
      headers: jsonHeaders,
    });
  }

  const { data, error } = await supabase
    .from("donations")
    .update({ payment_status: "completed" })
    .eq("id", donationId)
    .select("amount, fund_type")
    .single();

  if (error || !data) {
    console.error("Supabase update error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to update donation" }),
      { status: 500, headers: jsonHeaders },
    );
  }

  return new Response(
    JSON.stringify({
      verified: true,
      amount: data.amount,
      fundType: data.fund_type,
      fundLabel: fundLabels[data.fund_type] ?? "Temple Fund",
    }),
    { headers: jsonHeaders },
  );
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method === "POST") return await handleCreate(req);
    if (req.method === "GET") return await handleVerify(req);
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: jsonHeaders,
    });
  } catch (err) {
    console.error("Donate function error:", err);
    return new Response(
      JSON.stringify({ error: "Failed to process donation" }),
      { status: 500, headers: jsonHeaders },
    );
  }
});
