// Sends a donation thank-you / tax receipt via the Resend REST API.
// Safe no-op (logs and returns) when RESEND_API_KEY is not configured, so the
// donation flow never fails just because email isn't wired up yet.
//
// Required secrets to actually send:
//   RESEND_API_KEY   — Resend API key
//   RECEIPT_FROM     — verified sender, e.g. "RNHT Temple <receipts@your-domain.org>"

/** "REC-" + the first 8 hex digits of the donation id, uppercased — the same
 *  number the dashboard, the admin PDF receipt and the year-end letter show. */
export function receiptNumberFor(donationId: string): string {
  return "REC-" + String(donationId).replace(/-/g, "").slice(0, 8).toUpperCase();
}

const TEMPLE_EIN = "93-2940113";

export async function sendDonationReceipt(args: {
  to: string;
  donorName?: string | null;
  amount: number;
  fundLabel: string;
  /** Receipt number to print (see receiptNumberFor). Optional for older callers. */
  receiptNumber?: string | null;
  /** When the gift was received; defaults to now. */
  date?: string | Date | null;
}): Promise<void> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  const from =
    Deno.env.get("RECEIPT_FROM") ??
    "Rudra Narayana Hindu Temple <receipts@rnht.org>";

  if (!apiKey || !args.to) {
    console.log("[receipt] RESEND_API_KEY or recipient missing — skipping email");
    return;
  }

  const esc = (s: string) =>
    s.replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string),
    );
  const usd = `$${Number(args.amount).toFixed(2)}`;
  const rawName = args.donorName?.trim() || "Devotee";
  const name = esc(rawName);
  const when = args.date ? new Date(args.date) : new Date();
  const dateStr = (Number.isNaN(when.getTime()) ? new Date() : when).toLocaleDateString("en-US", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const rec = args.receiptNumber?.trim() || "";
  const html = `
    <div style="font-family:Arial,sans-serif;color:#333;max-width:560px;margin:0 auto">
      <h2 style="color:#7a1f2b">Thank you for your generosity, ${name} 🙏</h2>
      <p>We gratefully acknowledge your donation of <strong>${usd}</strong>
         to the <strong>${args.fundLabel}</strong>.</p>
      <p style="font-size:13px;color:#555">${rec ? `Receipt No: <strong>${esc(rec)}</strong> &middot; ` : ""}Date: ${dateStr}</p>
      <p>Rudra Narayana Hindu Temple is a registered 501(c)(3) nonprofit
         organization (EIN ${TEMPLE_EIN}); your donation is tax-deductible to the
         extent allowed by law. No goods or services were provided in exchange
         for this contribution. Please retain this email as your receipt.</p>
      <p style="color:#888;font-size:12px">Rudra Narayana Hindu Temple · 2025 Rushing Ranch Path, Georgetown, TX 78628</p>
    </div>`;
  const text =
    `Thank you for your generosity, ${rawName}.\n\n` +
    `We gratefully acknowledge your donation of ${usd} to the ${args.fundLabel}.\n` +
    `${rec ? `Receipt No: ${rec} | ` : ""}Date: ${dateStr}\n\n` +
    `RNHT is a registered 501(c)(3) nonprofit (EIN ${TEMPLE_EIN}); your donation is ` +
    `tax-deductible to the extent allowed by law. No goods or services were provided ` +
    `in exchange for this contribution. Please retain this email as your receipt.\n\n` +
    `Rudra Narayana Hindu Temple, 2025 Rushing Ranch Path, Georgetown, TX 78628`;

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

/**
 * Emails a donor their official donation-receipt PDF as an attachment. Used by
 * the admin Manual Donation Receipt flow (cash / offline gifts). The wording
 * matches the client's spec verbatim: subject "Thank You for Your Donation" and
 * the approved thank-you body. Returns `true` only when Resend accepted the
 * send; returns `false` (never throws) when the key/recipient is missing or the
 * API rejects it, so the caller can surface a precise result to the admin.
 *
 * Required secrets to actually send: RESEND_API_KEY, RECEIPT_FROM.
 */
export async function sendDonationReceiptPdf(args: {
  to: string;
  donorName?: string | null;
  /** Base64-encoded PDF (no data-URI prefix). */
  pdfBase64: string;
  /** Attachment filename, e.g. "RNHT-Donation-Receipt-REC-1a2b3c4d.pdf". */
  filename: string;
}): Promise<boolean> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  const from =
    Deno.env.get("RECEIPT_FROM") ??
    "Rudra Narayana Hindu Temple <receipts@rnht.org>";

  if (!apiKey || !args.to || !args.pdfBase64) {
    console.log("[receipt-pdf] RESEND_API_KEY, recipient, or PDF missing — skipping email");
    return false;
  }

  const esc = (s: string) =>
    s.replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string),
    );
  const rawName = args.donorName?.trim() || "Devotee";
  const name = esc(rawName);
  const html = `
    <div style="font-family:Arial,sans-serif;color:#333;max-width:560px;margin:0 auto">
      <h2 style="color:#7a1f2b">Thank you for your generous donation, ${name} 🙏</h2>
      <p>Thank you for your generous donation. Please find your donation receipt
         attached.</p>
      <p>Rudra Narayana Hindu Temple is a registered 501(c)(3) nonprofit
         organization; your donation is tax-deductible to the extent allowed by
         law. Please retain the attached receipt for your records.</p>
      <p style="color:#888;font-size:12px">Rudra Narayana Hindu Temple · Georgetown, TX</p>
    </div>`;
  const text =
    `Thank you for your generous donation, ${rawName}.\n\n` +
    `Thank you for your generous donation. Please find your donation receipt attached.\n\n` +
    `RNHT is a registered 501(c)(3) nonprofit; your donation is tax-deductible to the ` +
    `extent allowed by law. Please retain the attached receipt for your records.\n\n` +
    `Rudra Narayana Hindu Temple, Georgetown, TX`;

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
        subject: "Thank You for Your Donation",
        html,
        text,
        attachments: [{ filename: args.filename, content: args.pdfBase64 }],
      }),
    });
    if (!res.ok) {
      console.error("[receipt-pdf] send failed:", res.status, await res.text());
      return false;
    }
    return true;
  } catch (e) {
    console.error("[receipt-pdf] send error:", e);
    return false;
  }
}
