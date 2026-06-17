import { NextResponse } from "next/server";
import { getStripeServer } from "@/lib/stripe-server";
import { getServiceSupabase } from "@/lib/supabase";
import { checkAndSendReceipt } from "@/lib/donation-receipts";
import type Stripe from "stripe";

export async function POST(request: Request) {
  const sig = request.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("Missing STRIPE_WEBHOOK_SECRET");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  let event: Stripe.Event;
  try {
    const body = await request.text();
    event = getStripeServer().webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = getServiceSupabase();
  if (!supabase) {
    console.error("Stripe webhook: service Supabase not configured");
    return NextResponse.json({ error: "Server not configured" }, { status: 503 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const type = session.metadata?.type;

    if (type === "booking") {
      const bookingIds = JSON.parse(session.metadata?.booking_ids || "[]");
      if (bookingIds.length) {
        const { error } = await supabase
          .from("bookings")
          .update({
            payment_status: "paid",
            payment_intent_id: session.payment_intent as string,
            status: "confirmed",
          })
          .in("id", bookingIds);

        if (error) console.error("Failed to update bookings:", error);
      }
    } else if (type === "donation") {
      const donationId = session.metadata?.donation_id;
      if (donationId) {
        const { data, error } = await supabase
          .from("donations")
          .update({ payment_status: "completed" })
          .eq("id", donationId)
          .select("user_id")
          .maybeSingle();

        if (error) console.error("Failed to update donation:", error);
        // Fire the tax-summary check for logged-in donors. Errors are
        // swallowed so a failing email doesn't invalidate the webhook.
        const userId = (data as { user_id: string | null } | null)?.user_id ?? null;
        if (userId) {
          await checkAndSendReceipt(userId).catch((e) =>
            console.error("checkAndSendReceipt failed:", e)
          );
        }
      }
    }
  }

  if (event.type === "invoice.payment_succeeded") {
    const invoice = event.data.object as Stripe.Invoice;
    const subId = invoice.subscription as string;
    if (subId) {
      const subscription = await getStripeServer().subscriptions.retrieve(subId);
      const donationId = subscription.metadata?.donation_id;
      if (donationId) {
        const { data, error } = await supabase
          .from("donations")
          .update({ payment_status: "completed" })
          .eq("id", donationId)
          .select("user_id")
          .maybeSingle();

        if (error) console.error("Failed to update recurring donation:", error);
        const userId = (data as { user_id: string | null } | null)?.user_id ?? null;
        if (userId) {
          await checkAndSendReceipt(userId).catch((e) =>
            console.error("checkAndSendReceipt failed:", e)
          );
        }
      }
    }
  }

  return NextResponse.json({ received: true });
}
