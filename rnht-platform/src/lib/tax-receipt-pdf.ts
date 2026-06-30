import { jsPDF } from "jspdf";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Donation } from "@/store/auth";

// Temple identity used on the receipt letterhead. Address matches the donation
// receipt on file. EIN is a placeholder until the client provides the real one.
const TEMPLE = {
  name: "Rudra Narayana Hindu Temple",
  addressLines: ["2025 Rushing Ranch Path", "Georgetown, TX 78628"],
  ein: "EIN: __-_______", // TODO(client): replace with the temple's real EIN
  status: "A registered 501(c)(3) non-profit organization",
};

// Placeholder asset slots — when the client sends the official letterhead, stamp,
// and authorized-signature images, set these to the (bundled or data-URL) image
// sources and the render code below will draw them in place of the placeholders.
const LETTERHEAD_IMAGE: string | undefined = undefined; // TODO(client): header artwork
const STAMP_IMAGE: string | undefined = undefined; // TODO(client): official stamp
const SIGNATURE_IMAGE: string | undefined = undefined; // TODO(client): signature

const MAROON: [number, number, number] = [94, 10, 31];
const GOLD: [number, number, number] = [197, 151, 62];
const GRAY: [number, number, number] = [90, 90, 90];
const SHADE: [number, number, number] = [245, 240, 232];
const INK: [number, number, number] = [40, 40, 40];

export interface TaxReceiptOptions {
  donorName: string;
  donorEmail: string;
  /** Calendar/tax year the receipt covers. */
  year: number;
  /** Donations already filtered to `year` and to completed/received gifts. */
  donations: Donation[];
  /** When the receipt is generated (defaults to now). Injectable for tests. */
  generatedAt?: Date;
}

/**
 * Generates an official annual donation (tax) receipt PDF for one tax year and
 * triggers a download. Client-side only (uses jsPDF). The letterhead/stamp/
 * signature render as placeholders until the client's images are supplied above.
 */
export function generateTaxReceiptPdf(opts: TaxReceiptOptions): void {
  const { donorName, donorEmail, year, donations } = opts;
  const generatedAt = opts.generatedAt ?? new Date();

  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 54;
  const contentW = pageW - margin * 2;

  const fill = (c: [number, number, number]) => doc.setFillColor(c[0], c[1], c[2]);
  const stroke = (c: [number, number, number]) => doc.setDrawColor(c[0], c[1], c[2]);
  const ink = (c: [number, number, number]) => doc.setTextColor(c[0], c[1], c[2]);

  // ── Letterhead band ──
  fill(MAROON);
  doc.rect(0, 0, pageW, 96, "F");
  if (LETTERHEAD_IMAGE) {
    try {
      doc.addImage(LETTERHEAD_IMAGE, "PNG", margin, 18, 60, 60);
    } catch {
      /* fall through to placeholder */
    }
  } else {
    stroke(GOLD);
    doc.setLineWidth(1);
    doc.roundedRect(margin, 22, 52, 52, 6, 6, "S");
    doc.setFontSize(7);
    ink(GOLD);
    doc.text("LOGO", margin + 26, 51, { align: "center" });
  }
  ink([255, 255, 255]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(TEMPLE.name, margin + 68, 42);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  ink(GOLD);
  doc.text(TEMPLE.status, margin + 68, 58);
  ink([235, 220, 200]);
  doc.setFontSize(8);
  doc.text(`${TEMPLE.addressLines.join("  •  ")}  •  ${TEMPLE.ein}`, margin + 68, 72);

  let y = 132;

  // ── Title ──
  ink(MAROON);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text(`Official Annual Donation Receipt — ${year}`, margin, y);
  y += 24;

  // ── Donor block ──
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  ink(INK);
  doc.text(`Donor: ${donorName || "—"}`, margin, y);
  y += 15;
  if (donorEmail) {
    doc.text(`Email: ${donorEmail}`, margin, y);
    y += 15;
  }
  doc.text(`Tax year: January 1 – December 31, ${year}`, margin, y);
  y += 15;
  ink(GRAY);
  doc.setFontSize(8.5);
  doc.text(`Receipt issued: ${formatDate(generatedAt)}`, margin, y);
  y += 24;

  // ── Table ──
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
    // Leave room at the bottom for the total + statement + signature block.
    if (y + rowH > pageH - 150) {
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
  doc.text(`Total contributions for ${year}`, colDate, y + 13);
  doc.text(formatCurrency(total), colAmount, y + 13, { align: "right" });
  y += 32;

  // ── IRS statement ──
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  ink(GRAY);
  const statement =
    "No goods or services were provided by Rudra Narayana Hindu Temple in exchange for these " +
    "contributions. This receipt confirms tax-deductible charitable donations under Section 501(c)(3) " +
    "of the Internal Revenue Code. Please retain it for your records and consult your tax advisor " +
    "regarding deductibility.";
  const stmtLines = doc.splitTextToSize(statement, contentW) as string[];
  doc.text(stmtLines, margin, y);
  y += stmtLines.length * 11 + 26;

  // ── Stamp + signature (placeholders until the client's images arrive) ──
  const footY = Math.max(y, pageH - 132);
  // Official stamp (left)
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
  }
  ink(GRAY);
  doc.setFontSize(7.5);
  doc.text("Official Temple Stamp", margin + 60, footY + 92, { align: "center" });

  // Authorized signature (right)
  const sigX = pageW - margin - 200;
  if (SIGNATURE_IMAGE) {
    try {
      doc.addImage(SIGNATURE_IMAGE, "PNG", sigX + 40, footY + 16, 120, 44);
    } catch {
      /* ignore */
    }
  }
  stroke(GRAY);
  doc.setLineWidth(0.7);
  doc.line(sigX, footY + 64, sigX + 200, footY + 64);
  doc.text("Authorized Signature", sigX + 100, footY + 78, { align: "center" });

  doc.save(`RNHT-Tax-Receipt-${year}.pdf`);
}

// Truncate text with an ellipsis so a long donation-type name can't overflow
// into the amount column.
function fitText(doc: jsPDF, text: string, maxW: number): string {
  if (doc.getTextWidth(text) <= maxW) return text;
  let t = text;
  while (t.length > 1 && doc.getTextWidth(t + "…") > maxW) t = t.slice(0, -1);
  return t + "…";
}
