import { NextResponse } from "next/server";
import { getStripeServer } from "@/lib/stripe-server";
import { createPayPalOrder } from "@/lib/paypal-server";
import { getServiceSupabase } from "@/lib/supabase";
import type Stripe from "stripe";

interface DonateRequest {
  amount: number;
  fundType: string;
  donorName: string;
  donorEmail: string;
  message?: string;
  isAnonymous?: boolean;
  isRecurring?: boolean;
  recurringFrequency?: "monthly" | "quarterly" | "annual";
  paymentMethod?: "stripe" | "paypal" | "zelle";
}

const fundLabels: Record<string, string> = {
  general: "General Temple Donation",
  building: "Building Donation",
  priest: "Priest Donation",
  annadanam: "Annadanam Donation",
  festival: "Festival Donation",
  education: "Education Donation",
  "rudra-narayana": "Sri Rudra Narayana Seva",
  ganesha: "Lord Ganesha Seva",
  lakshmi: "Goddess Lakshmi Seva",
  hanuman: "Lord Hanuman Seva",
  shiva: "Lord Shiva Seva",
  rama: "Lord Rama Seva",
};

function mapFrequency(freq: string): Stripe.Checkout.SessionCreateParams.LineItem.PriceData.Recurring {
  switch (freq) {
    case "quarterly":
      return { interval: "month", interval_count: 3 };
    case "annual":
      return { interval: "year" };
    default:
      return { interval: "month" };
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as DonateRequest;
    const { amount, fundType, donorName, donorEmail, message, isAnonymous, isRecurring, recurringFrequency, paymentMethod = "stripe" } = body;

    if (
      !Number.isFinite(amount) ||
      amount <= 0 ||
      amount > 100000 ||
      !donorName ||
      !donorEmail ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(donorEmail).trim())
    ) {
      return NextResponse.json(
        { error: "Missing or invalid required fields" },
        { status: 400 }
      );
    }
    // Allowlist the fund (matches the Supabase edge function) — fund_type is
    // unconstrained TEXT, so reject anything not in the canonical registry.
    if (!fundType || !(fundType in fundLabels)) {
      return NextResponse.json({ error: "Unknown donation fund" }, { status: 400 });
    }

    const supabase = getServiceSupabase();
    if (!supabase) {
      return NextResponse.json(
        { error: "Server is not configured for payments." },
        { status: 503 }
      );
    }
    const label = fundLabels[fundType] || "Donation";
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Insert donation record
    const { data: donation, error: dbError } = await supabase
      .from("donations")
      .insert({
        donor_name: donorName,
        donor_email: donorEmail,
        amount,
        fund_type: fundType,
        payment_method: paymentMethod,
        payment_status: "pending",
        is_recurring: isRecurring || false,
        message: message || null,
        is_anonymous: isAnonymous || false,
      })
      .select("id")
      .single();

    if (dbError) {
      console.error("Supabase error:", dbError);
      return NextResponse.json(
        { error: "Failed to create donation record" },
        { status: 500 }
      );
    }

    // PayPal flow
    if (paymentMethod === "paypal") {
      const order = await createPayPalOrder({
        amount,
        description: label,
        donationId: donation.id,
        returnUrl: `${appUrl}/donate?success=true&provider=paypal&token={ORDER_ID}`,
        cancelUrl: `${appUrl}/donate`,
      });

      // Store PayPal order ID for capture later
      await supabase
        .from("donations")
        .update({ payment_intent_id: order.id })
        .eq("id", donation.id);

      return NextResponse.json({ url: order.approvalUrl });
    }

    // Stripe flow
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer_email: donorEmail,
      metadata: {
        type: "donation",
        donation_id: donation.id,
      },
      success_url: `${appUrl}/donate?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/donate`,
    };

    if (isRecurring && recurringFrequency) {
      sessionParams.mode = "subscription";
      sessionParams.subscription_data = {
        metadata: {
          type: "donation",
          donation_id: donation.id,
        },
      };
      sessionParams.line_items = [
        {
          price_data: {
            currency: "usd",
            unit_amount: Math.round(amount * 100),
            product_data: { name: `${label} (Recurring)` },
            recurring: mapFrequency(recurringFrequency),
          },
          quantity: 1,
        },
      ];
    } else {
      sessionParams.mode = "payment";
      sessionParams.line_items = [
        {
          price_data: {
            currency: "usd",
            unit_amount: Math.round(amount * 100),
            product_data: { name: label },
          },
          quantity: 1,
        },
      ];
    }

    const session = await getStripeServer().checkout.sessions.create(sessionParams);

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Donate error:", err);
    return NextResponse.json(
      { error: "Failed to create donation session" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("session_id");

  if (!sessionId) {
    return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
  }

  try {
    const session = await getStripeServer().checkout.sessions.retrieve(sessionId);
    const donationId = session.metadata?.donation_id;

    if (
      session.metadata?.type !== "donation" ||
      session.status !== "complete" ||
      session.payment_status !== "paid" ||
      !donationId
    ) {
      return NextResponse.json({ verified: false }, { status: 400 });
    }

    const supabase = getServiceSupabase();
    if (!supabase) {
      return NextResponse.json({ error: "Server is not configured." }, { status: 503 });
    }
    const { data, error } = await supabase
      .from("donations")
      .update({ payment_status: "completed" })
      .eq("id", donationId)
      .select("amount, fund_type")
      .single();

    if (error) {
      console.error("Failed to update donation:", error);
      return NextResponse.json(
        { error: "Failed to update donation" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      verified: true,
      amount: data.amount,
      fundType: data.fund_type,
      fundLabel: fundLabels[data.fund_type] || "Temple Fund",
    });
  } catch (err) {
    console.error("Donate verify error:", err);
    return NextResponse.json(
      { error: "Failed to verify donation session" },
      { status: 500 }
    );
  }
}
