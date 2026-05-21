// Supabase Edge Function: paypal-capture
//
// Captures a PayPal order after the donor approves. The client posts the
// PayPal order ID returned in the callback URL; we hit PayPal's capture
// endpoint and mark the matching donations row as paid.
//
// Required secrets:
//   PAYPAL_CLIENT_ID
//   PAYPAL_SECRET
//   PAYPAL_MODE                  "live" or "sandbox"
//
// Supabase auto-provides SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.

// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { corsHeaders, jsonHeaders } from "../_shared/cors.ts";

const PAYPAL_CLIENT_ID = Deno.env.get("PAYPAL_CLIENT_ID") ?? "";
const PAYPAL_SECRET = Deno.env.get("PAYPAL_SECRET") ?? "";
const PAYPAL_MODE = Deno.env.get("PAYPAL_MODE") ?? "sandbox";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
});

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
  return (await res.json()).access_token as string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: jsonHeaders,
    });
  }

  try {
    const body = (await req.json()) as { orderId?: string };
    const orderId = body.orderId;
    if (!orderId) {
      return new Response(JSON.stringify({ error: "Missing orderId" }), {
        status: 400,
        headers: jsonHeaders,
      });
    }

    const base = PAYPAL_MODE === "live"
      ? "api.paypal.com"
      : "api.sandbox.paypal.com";
    const token = await paypalAccessToken();

    const captureRes = await fetch(
      `https://${base}/v2/checkout/orders/${orderId}/capture`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    );
    const captureData: any = await captureRes.json();

    const donationId = captureData?.purchase_units?.[0]?.reference_id ?? null;

    if (captureData.status === "COMPLETED" && donationId) {
      const { data } = await supabase
        .from("donations")
        .update({ payment_status: "completed" })
        .eq("id", donationId)
        .select("amount, fund_type")
        .maybeSingle();

      return new Response(
        JSON.stringify({
          status: captureData.status,
          amount: data?.amount ?? null,
          fundType: data?.fund_type ?? null,
        }),
        { headers: jsonHeaders },
      );
    }

    return new Response(
      JSON.stringify({ status: captureData.status ?? "UNKNOWN" }),
      { headers: jsonHeaders },
    );
  } catch (err) {
    console.error("PayPal capture error:", err);
    return new Response(
      JSON.stringify({ error: "Failed to capture PayPal payment" }),
      { status: 500, headers: jsonHeaders },
    );
  }
});
