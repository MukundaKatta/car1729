// Sends a donation thank-you / tax receipt via the Resend REST API.
// Safe no-op (logs and returns) when RESEND_API_KEY is not configured, so the
// donation flow never fails just because email isn't wired up yet.
//
// Required secrets to actually send:
//   RESEND_API_KEY   — Resend API key
//   RECEIPT_FROM     — verified sender, e.g. "RNHT Temple <receipts@your-domain.org>"

export async function sendDonationReceipt(args: {
  to: string;
  donorName?: string | null;
  amount: number;
  fundLabel: string;
}): Promise<void> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  const from =
    Deno.env.get("RECEIPT_FROM") ??
    "Rudra Narayana Hindu Temple <receipts@rudranarayanahindutemple.org>";

  if (!apiKey || !args.to) {
    console.log("[receipt] RESEND_API_KEY or recipient missing — skipping email");
    return;
  }

  const usd = `$${Number(args.amount).toFixed(2)}`;
  const name = args.donorName?.trim() || "Devotee";
  const html = `
    <div style="font-family:Arial,sans-serif;color:#333;max-width:560px;margin:0 auto">
      <h2 style="color:#7a1f2b">Thank you for your generosity, ${name} 🙏</h2>
      <p>We gratefully acknowledge your donation of <strong>${usd}</strong>
         to the <strong>${args.fundLabel}</strong>.</p>
      <p>Rudra Narayana Hindu Temple is a registered 501(c)(3) nonprofit
         organization; your donation is tax-deductible to the extent allowed by
         law. Please retain this email as your receipt.</p>
      <p style="color:#888;font-size:12px">Rudra Narayana Hindu Temple · Austin, TX</p>
    </div>`;
  const text =
    `Thank you for your generosity, ${name}.\n\n` +
    `We gratefully acknowledge your donation of ${usd} to the ${args.fundLabel}.\n\n` +
    `RNHT is a registered 501(c)(3) nonprofit; your donation is tax-deductible ` +
    `to the extent allowed by law. Please retain this email as your receipt.\n\n` +
    `Rudra Narayana Hindu Temple, Austin, TX`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [args.to],
        subject: `Your RNHT donation receipt — ${usd}`,
        html,
        text,
      }),
    });
    if (!res.ok) {
      console.error("[receipt] send failed:", res.status, await res.text());
    }
  } catch (e) {
    console.error("[receipt] send error:", e);
  }
}
