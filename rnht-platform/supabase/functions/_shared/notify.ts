// Notifies the temple of a new pending pledge — specifically Zelle, which
// settles OUTSIDE the app (a bank transfer with no webhook), so the temple has
// to watch for the money and manually confirm it. This email tells them who
// pledged, how much, and how to reach them, so no pledge is silently missed.
//
// Best-effort: no-ops when RESEND_API_KEY or TEMPLE_NOTIFY_EMAIL is unset, and
// swallows/loguses any send error, so a donation is NEVER blocked by email.
//
// Secrets:
//   RESEND_API_KEY       — Resend API key
//   RECEIPT_FROM         — verified sender (shared with the receipt path)
//   TEMPLE_NOTIFY_EMAIL  — where the temple wants pledge alerts delivered

export async function sendPledgeNotification(args: {
  donorName?: string | null;
  donorEmail: string;
  donorPhone?: string | null;
  amount: number;
  fundLabel: string;
  method: string;
}): Promise<void> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  const to = Deno.env.get("TEMPLE_NOTIFY_EMAIL");
  const from =
    Deno.env.get("RECEIPT_FROM") ??
    "Rudra Narayana Hindu Temple <receipts@rnht.org>";

  if (!apiKey || !to) {
    console.log("[notify] RESEND_API_KEY or TEMPLE_NOTIFY_EMAIL missing — skipping pledge alert");
    return;
  }

  const esc = (s: string) =>
    s.replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string),
    );
  const usd = `$${Number(args.amount).toFixed(2)}`;
  const name = esc(args.donorName?.trim() || "A devotee");
  const email = esc(args.donorEmail.trim());
  const phone = args.donorPhone?.trim() ? esc(args.donorPhone.trim()) : "";
  const method = esc(args.method);
  const fund = esc(args.fundLabel);

  const contactLine = phone ? `${email} · ${phone}` : email;
  const html = `
    <div style="font-family:Arial,sans-serif;color:#333;max-width:560px;margin:0 auto">
      <h2 style="color:#7a1f2b">New ${method} pledge — please watch for the transfer</h2>
      <p><strong>${name}</strong> pledged <strong>${usd}</strong> to the
         <strong>${fund}</strong> via ${method}.</p>
      <table style="border-collapse:collapse;font-size:14px">
        <tr><td style="padding:2px 8px 2px 0;color:#888">Amount</td><td><strong>${usd}</strong></td></tr>
        <tr><td style="padding:2px 8px 2px 0;color:#888">Fund</td><td>${fund}</td></tr>
        <tr><td style="padding:2px 8px 2px 0;color:#888">Contact</td><td>${contactLine}</td></tr>
      </table>
      <p style="margin-top:16px">Once the ${method} transfer arrives in the temple's
         account, open <strong>Admin → Donations → Inflow</strong> and click
         <strong>Mark received</strong> on this pledge.</p>
      <p style="color:#888;font-size:12px">Rudra Narayana Hindu Temple · Austin, TX</p>
    </div>`;
  const text =
    `New ${method} pledge — please watch for the transfer.\n\n` +
    `${args.donorName?.trim() || "A devotee"} pledged ${usd} to the ${args.fundLabel} via ${method}.\n` +
    `Contact: ${contactLine}\n\n` +
    `When the transfer arrives, open Admin → Donations → Inflow and click "Mark received".\n\n` +
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
        to: [to],
        subject: `New ${method} pledge: ${usd} from ${args.donorName?.trim() || "a devotee"}`,
        html,
        text,
      }),
    });
    if (!res.ok) {
      console.error("[notify] send failed:", res.status, await res.text());
    }
  } catch (e) {
    console.error("[notify] send error:", e);
  }
}
