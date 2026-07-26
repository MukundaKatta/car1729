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
import { sendDonationReceipt } from "../_shared/receipt.ts";
import { sendPledgeNotification } from "../_shared/notify.ts";

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
  customFields?: Record<string, string>;
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

/**
 * Best-effort per-IP throttle for the public create endpoint.
 *
 * FAILS OPEN: if the limiter itself errors (RPC missing, DB blip) we let the
 * donation through and log it. Blocking a real devotee's gift because our
 * counter table hiccuped is far worse than letting a flood past for a minute.
 *
 * Returns true when the caller is over the limit.
 */
async function isRateLimited(
  req: Request,
  bucket: string,
  max: number,
  windowSeconds: number,
): Promise<boolean> {
  // Take the RIGHT-most x-forwarded-for entry, not the left-most. Measured on
  // this platform the proxy replaces the header with the true peer (rotating a
  // forged value through 15 requests still hit the limit, and an oversized one
  // is rejected upstream), so both ends agree today — but if the proxy ever
  // switched to appending, the left-most entry would be attacker-controlled and
  // every forged value would mint its own bucket. The right-most entry is the
  // one the trusted hop wrote under either behaviour.
  //
  // The key is length-bounded so an oversized header cannot blow the btree
  // index limit, error the RPC and ride the fail-open path as an off switch.
  // No IP available => a shared "unknown" bucket: stripping the header gets you
  // throttled with the other unknowns, never exempted.
  const xff = (req.headers.get("x-forwarded-for") ?? "").split(",");
  const ip = (
    xff[xff.length - 1]?.trim() ||
    req.headers.get("cf-connecting-ip") ||
    "unknown"
  ).slice(0, 64);
  try {
    const { data, error } = await supabase.rpc("check_rate_limit", {
      p_key: `${bucket}:${ip}`,
      p_max: max,
      p_window_seconds: windowSeconds,
    });
    if (error) {
      console.error("[donate:ratelimit] check failed — allowing", error.message);
      return false;
    }
    return data === false;
  } catch (e) {
    console.error("[donate:ratelimit] check threw — allowing", e);
    return false;
  }
}

const TOO_MANY = (retryAfterSeconds: number) =>
  new Response(
    JSON.stringify({
      error:
        "Too many donation attempts from this connection. Please wait a few " +
        "minutes and try again, or contact the temple if you need help.",
    }),
    {
      status: 429,
      headers: { ...jsonHeaders, "Retry-After": String(retryAfterSeconds) },
    },
  );

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
    customFields,
  } = body;

  if (
    !Number.isFinite(amount) ||
    amount <= 0 ||
    amount > 100000 ||
    !donorName ||
    !donorEmail ||
    // Validate email format server-side too — a direct API call bypasses the
    // client regex, and a malformed address silently breaks the tax receipt
    // while the donation is still marked completed.
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(donorEmail.trim())
  ) {
    return new Response(
      JSON.stringify({ error: "Missing or invalid required fields" }),
      { status: 400, headers: jsonHeaders },
    );
  }
  // Allowlist the payment method too. It is written straight to
  // payment_method, so an unknown value (e.g. "bitcoin") only failed at the DB
  // CHECK and surfaced as a 500 "Failed to create donation record"; worse, the
  // admin-only offline methods ("cash"/"offline") pass that CHECK, letting a
  // direct API call file rows that impersonate in-person gifts. Only the three
  // public rails are acceptable here — cash/offline belong to the admin
  // record-manual-donation flow.
  if (!["stripe", "paypal", "zelle"].includes(paymentMethod)) {
    return new Response(
      JSON.stringify({ error: "Unsupported payment method" }),
      { status: 400, headers: jsonHeaders },
    );
  }
  // Allowlist the fund: fund_type is plain TEXT with no DB constraint, so a
  // direct API call could otherwise insert arbitrary fund names. A fund is valid
  // if it is an ACTIVE row in donation_types (the admin-managed source of truth,
  // so funds added in the admin panel work) OR a hardcoded fundLabels key
  // (legacy/standard funds, e.g. deity sevas). Reject anything in neither.
  const { data: fundRow } = await supabase
    .from("donation_types")
    .select("name")
    .eq("slug", fundType)
    .eq("is_active", true)
    .maybeSingle();
  // hasOwnProperty, NOT `in`: `'toString' in fundLabels` (and other
  // Object.prototype keys like 'constructor'/'valueOf') is true via the
  // prototype chain, which would bypass the allowlist and later resolve the
  // label to a prototype function flowing into Stripe + the receipt.
  const inFundLabels =
    !!fundType && Object.prototype.hasOwnProperty.call(fundLabels, fundType);
  if (!fundRow && !inFundLabels) {
    return new Response(
      JSON.stringify({ error: "Unknown donation fund" }),
      { status: 400, headers: jsonHeaders },
    );
  }
  // Authoritative server-side rounding to whole cents (never trust the client).
  const cleanAmount = Math.round(amount * 100) / 100;
  // Re-validate the ROUNDED amount: the initial check tests the raw `amount`, so
  // a sub-cent value like 0.004 passes `amount > 0` but rounds to $0.00 — which
  // would otherwise insert a $0 Zelle pledge and email a $0 alert to the temple.
  if (cleanAmount <= 0) {
    return new Response(
      JSON.stringify({ error: "Donation amount is too small" }),
      { status: 400, headers: jsonHeaders },
    );
  }

  // Throttle only once the request is otherwise valid, so a devotee fumbling
  // the form doesn't burn their allowance — and so the checks sit in front of
  // everything expensive or side-effecting below (row insert, Stripe session,
  // PayPal order, temple alert email).
  //
  // The general ceiling is deliberately loose: a family behind one NAT/office
  // IP may legitimately give several times in a sitting. Zelle is tighter
  // because every pledge emails the temple, making it the inbox-spam vector.
  if (await isRateLimited(req, "donate", 8, 600)) {
    return TOO_MANY(600);
  }
  if (
    paymentMethod === "zelle" &&
    (await isRateLimited(req, "donate:zelle", 3, 600))
  ) {
    return TOO_MANY(600);
  }

  // Prefer the admin-managed name; fall back to the legacy label.
  const label = fundRow?.name ?? fundLabels[fundType] ?? "Donation";
  const userId = await resolveUserId(req);

  const { data: donation, error: dbError } = await supabase
    .from("donations")
    .insert({
      user_id: userId,
      donor_name: donorName,
      // Normalized so the guest back-link (and any later lookup) can match.
      donor_email: donorEmail.trim().toLowerCase(),
      amount: cleanAmount,
      fund_type: fundType,
      payment_method: paymentMethod,
      payment_status: "pending",
      is_recurring: false,
      message: message ?? null,
      is_anonymous: isAnonymous ?? false,
      custom_fields: customFields ?? {},
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
    // Best-effort: alert the temple so they can watch for the bank transfer and
    // mark it received. Never blocks the pledge (awaited but self-catching).
    const donorPhone =
      customFields && typeof customFields.donor_phone === "string"
        ? customFields.donor_phone
        : null;
    await sendPledgeNotification({
      donorName,
      donorEmail,
      donorPhone,
      amount: cleanAmount,
      fundLabel: label,
      method: "Zelle",
    }).catch((e) => console.error("[notify] pledge notification error:", e));
    return new Response(
      JSON.stringify({ ok: true, donationId: donation.id }),
      { headers: jsonHeaders },
    );
  }

  if (paymentMethod === "paypal") {
    let order;
    try {
      order = await createPayPalOrder({
        amount: cleanAmount,
        description: label,
        donationId: donation.id,
      });
    } catch (payErr) {
      // PayPal order-create failed (e.g. missing/invalid PAYPAL creds). Delete
      // the just-inserted pending donation so it doesn't linger as an orphan,
      // and return a clear error instead of an opaque 500.
      console.error("PayPal order create failed:", payErr);
      await supabase.from("donations").delete().eq("id", donation.id);
      return new Response(
        JSON.stringify({
          error:
            "Could not start the PayPal payment. Please try another payment method or contact the temple.",
        }),
        { status: 502, headers: jsonHeaders },
      );
    }
    await supabase
      .from("donations")
      .update({ payment_intent_id: order.id })
      .eq("id", donation.id);
    // Return orderId so the native app can capture/verify on return (the
    // redirect happens inside the in-app browser, which the WebView can't read).
    return new Response(JSON.stringify({ url: order.approvalUrl, orderId: order.id }), {
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
          unit_amount: Math.round(cleanAmount * 100),
          product_data: { name: label },
        },
        quantity: 1,
      },
    ],
    success_url:
      `${APP_URL}/donate?success=true&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${APP_URL}/donate`,
  });

  // Return sessionId so the native app can verify on return (the success_url
  // redirect lands in the in-app browser, which the app WebView can't observe).
  return new Response(JSON.stringify({ url: session.url, sessionId: session.id }), {
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

  // An unknown/garbage session id makes Stripe throw; without this catch it
  // surfaced as a 500 "Failed to process donation", so a donor returning with
  // a stale or mistyped link saw a server error instead of a clean "not
  // verified" answer (and the generic 500 hid real faults in the logs).
  let session: Awaited<ReturnType<typeof stripe.checkout.sessions.retrieve>>;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch (e) {
    // Only a genuine "no such session" is the donor's problem. A network blip
    // or auth failure against Stripe must NOT be reported as "not verified" —
    // that tells someone who really paid that their payment didn't count, and
    // an unlogged bare catch hid such outages entirely.
    const status = (e as { statusCode?: number })?.statusCode;
    const unknownSession = status === 404 || status === 400;
    console.error("[donate:verify] session retrieve failed", {
      sessionId,
      status,
      unknownSession,
      error: (e as Error)?.message,
    });
    return new Response(
      JSON.stringify(
        unknownSession
          ? { verified: false }
          : { error: "Could not reach the payment provider. Please try again." },
      ),
      { status: unknownSession ? 400 : 503, headers: jsonHeaders },
    );
  }
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
    .select("amount, fund_type, donor_email, donor_name, payment_status, user_id")
    .eq("id", donationId)
    .single();

  if (error || !data) {
    console.error("Supabase fetch error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to update donation" }),
      { status: 500, headers: jsonHeaders },
    );
  }

  // Resolve the receipt label from the admin-managed donation_types first, so
  // admin-created funds show their real name on the receipt; fall back to the
  // legacy fundLabels map, then a generic label.
  const { data: fundRow } = await supabase
    .from("donation_types")
    .select("name")
    .eq("slug", data.fund_type)
    .maybeSingle();
  const fundLabel = fundRow?.name ?? fundLabels[data.fund_type] ?? "Temple Fund";

  // Atomic flip: only the verify that actually transitions pending -> completed
  // updates a row and sends the receipt. Concurrent/refresh verifies update 0
  // rows, so the donor never receives duplicate receipts (matches paypal-capture).
  const { data: updated, error: flipError } = await supabase
    .from("donations")
    // Persist the Stripe session id too, so completed donations are linkable to
    // their checkout session for audit/lookup (mirrors the PayPal capture path).
    .update({ payment_status: "completed", payment_intent_id: sessionId })
    .eq("id", donationId)
    .eq("payment_status", "pending")
    .select("id")
    .maybeSingle();
  // Surface a DB failure on the completion flip: without this the error was
  // swallowed, so a transient failure left the donor charged (Stripe captured)
  // with the row stuck 'pending' and no receipt, invisible in logs.
  if (flipError) {
    console.error("[donate:verify] failed to flip donation to completed", {
      donationId,
      sessionId,
      error: flipError.message,
    });
  }
  // Claim the receipt on the dedicated `tax_receipt_sent` flag rather than on
  // the completion flip or on payment_intent_id.
  //
  // Flip-only was wrong: a parallel completer can mark the row completed first,
  // leaving this verify with 0 updated rows and the donor with no email.
  // payment_intent_id was also wrong as the marker — it is NOT exclusive to
  // this path (the PayPal rail stamps it at ORDER CREATION, so that claim could
  // never match) and the admin "Mark received" path emails a receipt without
  // touching it, so a later verify would claim an already-receipted gift and
  // send a SECOND 501(c)(3) receipt.
  //
  // tax_receipt_sent is a single flag every sender competes for, so exactly one
  // wins per donation no matter which path completes it.
  const { data: claimed, error: claimError } = await supabase
    .from("donations")
    .update({ tax_receipt_sent: true })
    .eq("id", donationId)
    .eq("payment_status", "completed")
    .eq("tax_receipt_sent", false)
    .select("id")
    .maybeSingle();
  if (claimError) {
    console.error("[donate:verify] receipt claim failed", {
      donationId,
      error: claimError.message,
    });
  }
  const wonReceipt = Boolean(claimed);
  if (wonReceipt) {
    // Back-link guest gifts to a matching devotee account by email (case-
    // insensitive), so the donation shows in their dashboard history and
    // counts toward the year-end acknowledgment — mirrors the manual
    // cash-receipt path. Signed-in donations already carry user_id from
    // session creation; guests who donated before signing up simply stay
    // unlinked until an account with that email exists.
    if (!data.user_id && data.donor_email) {
      // Exact match, never ilike: PostgREST forwards the value as a SQL LIKE
      // pattern, so a donor address containing "_" or "%" (both legal in the
      // email regex above) matches OTHER profiles — "john_smith@x.com" would
      // link the gift to "johnXsmith@x.com", exposing a stranger's donation in
      // that devotee's history and year-end tax total. Compare on a normalized
      // value, matching what record-manual-donation already does.
      const { data: prof, error: lookupError } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", data.donor_email.trim().toLowerCase())
        .maybeSingle();
      if (lookupError) {
        // Includes PGRST116 (multiple profiles share the address) — previously
        // discarded, so a collision silently skipped the back-link.
        console.error("[donate:verify] profile lookup failed", {
          donationId,
          error: lookupError.message,
        });
      }
      if (prof?.id) {
        const { error: linkError } = await supabase
          .from("donations")
          .update({ user_id: prof.id })
          .eq("id", donationId)
          .is("user_id", null);
        if (linkError) {
          console.error("[donate:verify] back-link failed", {
            donationId,
            error: linkError.message,
          });
        }
      }
    }
    await sendDonationReceipt({
      to: data.donor_email,
      donorName: data.donor_name,
      amount: Number(data.amount),
      fundLabel,
    });
  }

  return new Response(
    JSON.stringify({
      verified: true,
      // Supabase returns DECIMAL as a string — coerce so the client gets a number.
      amount: Number(data.amount),
      fundType: data.fund_type,
      fundLabel,
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
