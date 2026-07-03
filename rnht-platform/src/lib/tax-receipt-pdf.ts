import { jsPDF } from "jspdf";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Donation } from "@/store/auth";

// Temple identity used on the receipt letterhead — matches the client's
// donation-template PDF (2026-07-03) verbatim.
const TEMPLE = {
  name: "Rudra Narayana Hindu Temple",
  addressLines: ["2025 Rushing Ranch Path", "Georgetown, TX 78628", "United States"],
  ein: "Federal Tax Identification Number: 93-2940113",
  status: "IRS Status: 501(c)(3) Religious Non-Profit Organization",
};

// Signer block from the client's template.
const SIGNER = {
  name: "Venkata Panchagnula",
  title: "President",
  org: "Rudra Narayana Hindu Temple",
};

// Placeholder asset slots — when the client sends the official letterhead, stamp,
// and authorized-signature PNGs, set these to the (bundled or data-URL) image
// sources and the render code below will draw them in place of the placeholders.
const LETTERHEAD_IMAGE: string | undefined = undefined; // TODO(client): temple logo/emblem
const STAMP_IMAGE: string | undefined = undefined; // TODO(client): official stamp PNG
const SIGNATURE_IMAGE: string | undefined = undefined; // TODO(client): signature PNG

const MAROON: [number, number, number] = [94, 10, 31];
const GOLD: [number, number, number] = [197, 151, 62];
const GRAY: [number, number, number] = [90, 90, 90];
const SHADE: [number, number, number] = [245, 240, 232];
const INK: [number, number, number] = [40, 40, 40];

export interface TaxReceiptOptions {
  donorName: string;
  donorEmail: string;
  /** Devotee mailing address, when set on the profile. */
  donorAddress?: string;
  /** Calendar/tax year the receipt covers. */
  year: number;
  /** Donations already filtered to `year` and to completed/received gifts. */
  donations: Donation[];
  /** When the receipt is generated (defaults to now). Injectable for tests. */
  generatedAt?: Date;
}

/**
 * Generates the "Year-End Charitable Donation Acknowledgment" PDF for one tax
 * year and triggers a download. The letter follows the client's template PDF
 * exactly (2026-07-03): letterhead, date/devotee block, subject, the approved
 * thank-you sentence, the transaction table (in place of the template's summary
 * box), the IRS Required Disclosure, and the president's signature block. The
 * template's crossed-out passages are intentionally omitted. Client-side only
 * (jsPDF); stamp/signature render as placeholders until the PNGs arrive.
 */
export function generateTaxReceiptPdf(opts: TaxReceiptOptions): void {
  const { donorName, donorEmail, donorAddress, year, donations } = opts;

  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 54;
  const contentW = pageW - margin * 2;

  const fill = (c: [number, number, number]) => doc.setFillColor(c[0], c[1], c[2]);
  const stroke = (c: [number, number, number]) => doc.setDrawColor(c[0], c[1], c[2]);
  const ink = (c: [number, number, number]) => doc.setTextColor(c[0], c[1], c[2]);

  // ── Letterhead ──
  fill(MAROON);
  doc.rect(0, 0, pageW, 104, "F");
  if (LETTERHEAD_IMAGE) {
    try {
      doc.addImage(LETTERHEAD_IMAGE, "PNG", margin, 20, 64, 64);
    } catch {
      /* fall through to placeholder */
    }
  } else {
    stroke(GOLD);
    doc.setLineWidth(1);
    doc.roundedRect(margin, 24, 56, 56, 6, 6, "S");
    doc.setFontSize(7);
    ink(GOLD);
    doc.text("LOGO", margin + 28, 55, { align: "center" });
  }
  ink([255, 255, 255]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.text(TEMPLE.name.toUpperCase(), margin + 72, 40);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  ink([235, 220, 200]);
  doc.text(TEMPLE.addressLines.join(", "), margin + 72, 56);
  doc.text(TEMPLE.ein, margin + 72, 70);
  ink(GOLD);
  doc.text(TEMPLE.status, margin + 72, 84);

  let y = 138;

  // ── Title (per template) ──
  ink(MAROON);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("YEAR-END CHARITABLE DONATION ACKNOWLEDGMENT", pageW / 2, y, {
    align: "center",
  });
  stroke(GOLD);
  doc.setLineWidth(1);
  doc.line(margin, y + 8, pageW - margin, y + 8);
  y += 30;

  // ── Date / devotee block (template fields) ──
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  ink(INK);
  doc.text(`Date: December 31, ${year}`, margin, y);
  y += 16;
  doc.text("To:", margin, y);
  y += 16;
  doc.text(`Devotee Name: ${donorName || "—"}`, margin, y);
  y += 16;
  if (donorAddress) {
    doc.text(`Address: ${donorAddress}`, margin, y);
    y += 16;
  }
  if (donorEmail) {
    doc.text(`Email: ${donorEmail}`, margin, y);
    y += 16;
  }
  y += 6;

  // ── Subject ──
  doc.setFont("helvetica", "bold");
  doc.text(
    `Subject: Acknowledgment of Charitable Contributions – Tax Year ${year}`,
    margin,
    y,
  );
  y += 20;

  // ── Salutation + approved body sentence (crossed-out passages omitted) ──
  doc.setFont("helvetica", "normal");
  doc.text(`Dear ${donorName || "Devotee"},`, margin, y);
  y += 18;
  const body =
    `On behalf of Rudra Narayana Hindu Temple, we sincerely thank you for your ` +
    `generous donations made during the calendar year ${year}.`;
  const bodyLines = doc.splitTextToSize(body, contentW) as string[];
  doc.text(bodyLines, margin, y);
  y += bodyLines.length * 13 + 12;

  // ── Transaction table (replaces the template's summary box, per client) ──
  const colDate = margin + 6;
  const colReceipt = margin + 112;
  const colType = margin + 252;
  const colAmount = pageW - margin - 6;
  const rowH = 20;

  const drawTableHeader = () => {
    fill(MAROON);
    doc.rect(margin, y, contentW, 22, "F");
    ink([255, 255, 255]);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Date", colDate, y + 15);
    doc.text("Receipt #", colReceipt, y + 15);
    doc.text("Donation Type", colType, y + 15);
    doc.text("Amount", colAmount, y + 15, { align: "right" });
    y += 22;
  };
  drawTableHeader();

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  let total = 0;
  let shaded = false;
  const sorted = [...donations].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
  for (const d of sorted) {
    // Leave room at the bottom for the total + disclosure + signature block.
    if (y + rowH > pageH - 210) {
      doc.addPage();
      y = margin;
      drawTableHeader();
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
    }
    if (shaded) {
      fill(SHADE);
      doc.rect(margin, y, contentW, rowH, "F");
    }
    shaded = !shaded;
    ink(INK);
    doc.text(formatDate(d.date), colDate, y + 13);
    doc.text(d.receiptId || d.id, colReceipt, y + 13);
    doc.text(fitText(doc, d.fund, colAmount - colType - 70), colType, y + 13);
    doc.text(formatCurrency(d.amount), colAmount, y + 13, { align: "right" });
    total += d.amount;
    y += rowH;
  }

  // ── Total ──
  stroke(GOLD);
  doc.setLineWidth(1);
  doc.line(margin, y, pageW - margin, y);
  y += 6;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  ink(MAROON);
  doc.text(`Total Charitable Contributions — ${year}`, colDate, y + 13);
  doc.text(formatCurrency(total), colAmount, y + 13, { align: "right" });
  y += 34;

  // ── IRS Required Disclosure (template wording, verbatim) ──
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  ink(INK);
  doc.text("IRS Required Disclosure", margin, y);
  y += 14;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  ink(GRAY);
  const disclosure1 =
    "No goods or services were provided in exchange for your contributions, other than " +
    "intangible religious benefits, in accordance with IRS regulations.";
  const d1 = doc.splitTextToSize(disclosure1, contentW) as string[];
  doc.text(d1, margin, y);
  y += d1.length * 11 + 8;
  const disclosure2 =
    "This letter serves as an official acknowledgment for income tax purposes under " +
    "Section 170(f)(8) of the Internal Revenue Code.";
  const d2 = doc.splitTextToSize(disclosure2, contentW) as string[];
  doc.text(d2, margin, y);
  y += d2.length * 11 + 20;

  // ── Stamp (left) + signature block (right, per template) ──
  const footY = Math.max(y, pageH - 150);
  if (STAMP_IMAGE) {
    try {
      doc.addImage(STAMP_IMAGE, "PNG", margin, footY, 96, 80);
    } catch {
      /* ignore */
    }
  } else {
    stroke(GRAY);
    doc.setLineWidth(0.7);
    doc.setLineDashPattern([3, 3], 0);
    doc.roundedRect(margin, footY, 120, 80, 6, 6, "S");
    doc.setLineDashPattern([], 0);
    ink(GRAY);
    doc.setFontSize(7.5);
    doc.text("Official Temple Stamp", margin + 60, footY + 92, { align: "center" });
  }

  const sigX = pageW - margin - 210;
  if (SIGNATURE_IMAGE) {
    try {
      doc.addImage(SIGNATURE_IMAGE, "PNG", sigX + 45, footY - 6, 120, 44);
    } catch {
      /* ignore */
    }
  }
  stroke(GRAY);
  doc.setLineWidth(0.7);
  doc.line(sigX, footY + 42, sigX + 210, footY + 42);
  ink(INK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(SIGNER.name, sigX + 105, footY + 58, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(SIGNER.title, sigX + 105, footY + 72, { align: "center" });
  ink(GRAY);
  doc.text(SIGNER.org, sigX + 105, footY + 85, { align: "center" });

  doc.save(`RNHT-Donation-Acknowledgment-${year}.pdf`);
}

// Truncate text with an ellipsis so a long donation-type name can't overflow
// into the amount column.
function fitText(doc: jsPDF, text: string, maxW: number): string {
  if (doc.getTextWidth(text) <= maxW) return text;
  let t = text;
  while (t.length > 1 && doc.getTextWidth(t + "…") > maxW) t = t.slice(0, -1);
  return t + "…";
}
