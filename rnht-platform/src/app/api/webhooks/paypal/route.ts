import { NextResponse } from "next/server";
import { capturePayPalOrder } from "@/lib/paypal-server";
import { getServiceSupabase } from "@/lib/supabase";
import { checkAndSendReceipt } from "@/lib/donation-receipts";

export async function POST(request: Request) {
  try {
    const { orderId } = (await request.json()) as { orderId: string };

    if (!orderId) {
      return NextResponse.json(
        { error: "Missing orderId" },
        { status: 400 }
      );
    }

    const result = await capturePayPalOrder(orderId);

    if (result.status === "COMPLETED" && result.donationId) {
      const supabase = getServiceSupabase();
      if (!supabase) {
        // 500 (not 503): a missing service key is a permanent misconfiguration.
        console.error("PayPal webhook: service Supabase not configured");
        return NextResponse.json({ error: "Server not configured" }, { status: 500 });
      }
      const { data, error } = await supabase
        .from("donations")
        .update({ payment_status: "completed" })
        .eq("id", result.donationId)
        .select("user_id, amount, fund_type")
        .maybeSingle();

      if (error) console.error("Failed to update donation:", error);

      const userId = (data as { user_id: string | null } | null)?.user_id ?? null;
      if (userId) {
        await checkAndSendReceipt(userId).catch((e) =>
          console.error("checkAndSendReceipt failed:", e)
        );
      }

      return NextResponse.json({
        status: result.status,
        amount: (data as { amount?: number } | null)?.amount ?? null,
        fundType: (data as { fund_type?: string } | null)?.fund_type ?? null,
      });
    }

    return NextResponse.json({ status: result.status });
  } catch (err) {
    console.error("PayPal capture error:", err);
    return NextResponse.json(
      { error: "Failed to capture PayPal payment" },
      { status: 500 }
    );
  }
}
