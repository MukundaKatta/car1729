import { jsPDF } from "jspdf";
import { formatCurrency } from "@/lib/utils";
import { prettyFund } from "@/lib/fund";
import { SIGNATURE_DATA_URL, LOGO_DATA_URL, STAMP_DATA_URL } from "@/lib/receipt-assets";
import type { Donation } from "@/store/auth";

// Compact, temple-timezone (US Central) date for the receipt table rows.
// The long weekday+month form ("Wednesday, September 24, 2026") is ~125pt wide
// and overflowed the 106pt Date column into the Receipt # column; this short
// form ("Sep 24, 2026") fits, and using the temple tz keeps the row date
// consistent with the tax-year bucketing on the dashboard.
function receiptDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "--";
  return d.toLocaleDateString("en-US", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

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
const LETTERHEAD_IMAGE: string | undefined = LOGO_DATA_URL; // temple seal (same as the homepage/header logo)
const STAMP_IMAGE: string | undefined = STAMP_DATA_URL; // official stamp, client-provided 2026-07-21
const SIGNATURE_IMAGE: string | undefined = SIGNATURE_DATA_URL; // Venkata Panchagnula (President), client-provided 2026-07-13

const MAROON: [number, number, number] = [94, 10, 31];
const GOLD: [number, number, number] = [197, 151, 62];
const GRAY: [number, number, number] = [90, 90, 90];
const SHADE: [number, number, number] = [245, 240, 232];
const INK: [number, number, number] = [40, 40, 40];
const CREAM: [number, number, number] = [250, 245, 235];
const CREAM_INK: [number, number, number] = [235, 220, 200];

type RGB = [number, number, number];
const setFill = (doc: jsPDF, c: RGB) => doc.setFillColor(c[0], c[1], c[2]);
const setStroke = (doc: jsPDF, c: RGB) => doc.setDrawColor(c[0], c[1], c[2]);
const setInk = (doc: jsPDF, c: RGB) => doc.setTextColor(c[0], c[1], c[2]);

/**
 * Draws the shared maroon letterhead band (temple seal + name + address + EIN +
 * IRS status). Used by both the year-end acknowledgment and the single-donation
 * receipt so the two documents share one identical header.
 */
function drawLetterhead(doc: jsPDF, pageW: number, margin: number): void {
  setFill(doc, MAROON);
  doc.rect(0, 0, pageW, 104, "F");
  if (LETTERHEAD_IMAGE) {
    try {
      // The temple seal is designed for a light background; back it with a cream
      // disc + gold ring so it reads crisply on the maroon letterhead band.
      setFill(doc, CREAM);
      doc.circle(margin + 32, 52, 34, "F");
      setStroke(doc, GOLD);
      doc.setLineWidth(1.2);
      doc.circle(margin + 32, 52, 34, "S");
      doc.addImage(LETTERHEAD_IMAGE, "PNG", margin, 20, 64, 64);
    } catch {
      /* fall through to placeholder */
    }
  } else {
    setStroke(doc, GOLD);
    doc.setLineWidth(1);
    doc.roundedRect(margin, 24, 56, 56, 6, 6, "S");
    doc.setFontSize(7);
    setInk(doc, GOLD);
    doc.text("LOGO", margin + 28, 55, { align: "center" });
  }
  setInk(doc, [255, 255, 255]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.text(TEMPLE.name.toUpperCase(), margin + 92, 40);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  setInk(doc, CREAM_INK);
  doc.text(TEMPLE.addressLines.join(", "), margin + 92, 56);
  doc.text(TEMPLE.ein, margin + 92, 70);
  setInk(doc, GOLD);
  doc.text(TEMPLE.status, margin + 92, 84);
}

/**
 * Draws the shared footer: the official-stamp block on the left and the
 * president's authorized-signature block on the right, at vertical position
 * `footY`. Used by both receipt documents.
 */
function drawStampAndSignature(
  doc: jsPDF,
  pageW: number,
  margin: number,
  footY: number,
): void {
  if (STAMP_IMAGE) {
    try {
      // The official stamp is circular (408x420 source, aspect ~0.971): draw it
      // 82x84 so it isn't stretched, roughly centered over the old placeholder
      // slot. No caption — a real stamp labels itself.
      doc.addImage(STAMP_IMAGE, "PNG", margin + 19, footY - 2, 82, 84);
    } catch {
      /* ignore */
    }
  } else {
    setStroke(doc, GRAY);
    doc.setLineWidth(0.7);
    doc.setLineDashPattern([3, 3], 0);
    doc.roundedRect(margin, footY, 120, 80, 6, 6, "S");
    doc.setLineDashPattern([], 0);
    setInk(doc, GRAY);
    doc.setFontSize(7.5);
    doc.text("Official Temple Stamp", margin + 60, footY + 92, { align: "center" });
  }

  const sigX = pageW - margin - 210;
  if (SIGNATURE_IMAGE) {
    try {
      // 85x48 keeps the signature's real ~1.77 aspect ratio (the old 120x44
      // would have stretched it), centered over the signature line (sigX+105)
      // and sitting just above it.
      doc.addImage(SIGNATURE_IMAGE, "PNG", sigX + 63, footY - 8, 85, 48);
    } catch {
      /* ignore */
    }
  }
  setStroke(doc, GRAY);
  doc.setLineWidth(0.7);
  doc.line(sigX, footY + 42, sigX + 210, footY + 42);
  setInk(doc, INK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(SIGNER.name, sigX + 105, footY + 58, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(SIGNER.title, sigX + 105, footY + 72, { align: "center" });
  setInk(doc, GRAY);
  doc.text(SIGNER.org, sigX + 105, footY + 85, { align: "center" });
}

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
function buildTaxAcknowledgmentDoc(opts: TaxReceiptOptions): jsPDF {
  const { donorEmail, year, donations } = opts;
  const donorName = pdfSafeText(opts.donorName);
  const donorAddress = pdfSafeText(opts.donorAddress);

  const doc = new jsPDF({ unit: "pt", format: "letter" });
  // Document metadata — title/subject/author for accessibility + file identity.
  doc.setProperties({
    title: `RNHT Donation Acknowledgment ${year}`,
    subject: `Year-End Charitable Donation Acknowledgment — Tax Year ${year}`,
    author: TEMPLE.name,
    creator: TEMPLE.name,
  });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 54;
  const contentW = pageW - margin * 2;

  const fill = (c: [number, number, number]) => doc.setFillColor(c[0], c[1], c[2]);
  const stroke = (c: [number, number, number]) => doc.setDrawColor(c[0], c[1], c[2]);
  const ink = (c: [number, number, number]) => doc.setTextColor(c[0], c[1], c[2]);

  // ── Letterhead ──
  drawLetterhead(doc, pageW, margin);

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
  // Wrap each field to the content width — a long donor name/address/email used
  // to be drawn on a single line and overflowed off the right edge of the page.
  const writeLine = (text: string) => {
    const lines = doc.splitTextToSize(text, contentW) as string[];
    doc.text(lines, margin, y);
    y += lines.length * 14 + 2;
  };
  writeLine(`Date: December 31, ${year}`);
  writeLine("To:");
  writeLine(`Devotee Name: ${donorName || "—"}`);
  if (donorAddress) writeLine(`Address: ${donorAddress}`);
  if (donorEmail) writeLine(`Email: ${donorEmail}`);
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
  writeLine(`Dear ${donorName || "Devotee"},`);
  y += 4;
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
  // Sort oldest-first, treating an unparseable date as 0 so a bad date can't
  // make the comparator return NaN (which yields an undefined row order).
  const ts = (s: string) => {
    const t = new Date(s).getTime();
    return Number.isNaN(t) ? 0 : t;
  };
  const sorted = [...donations].sort((a, b) => ts(a.date) - ts(b.date));
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
    doc.text(fitText(doc, receiptDate(d.date), colReceipt - colDate - 8), colDate, y + 13);
    // Clamp the receipt # too: a missing receiptId falls back to a full UUID
    // (d.id) that otherwise runs into the Donation Type column.
    doc.text(fitText(doc, d.receiptId || d.id, colType - colReceipt - 8), colReceipt, y + 13);
    doc.text(fitText(doc, prettyFund(d.fund), colAmount - colType - 70), colType, y + 13);
    doc.text(formatCurrency(d.amount), colAmount, y + 13, { align: "right" });
    // Sum in whole cents so the printed rows always add up to the printed total
    // (summing raw floats could drift by a cent vs. the rounded per-row amounts).
    total += Math.round(d.amount * 100);
    y += rowH;
  }
  total = total / 100;

  // If the table ended too low, the total + IRS disclosure + stamp/signature
  // block (~250pt) would overflow off the bottom of the page. Move it to a
  // fresh page instead of clipping the signature.
  if (y > pageH - 280) {
    doc.addPage();
    y = margin;
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
  drawStampAndSignature(doc, pageW, margin, footY);

  return doc;
}

/**
 * Downloads the year-end acknowledgment in the browser (on-demand admin/devotee
 * use). Client-side only.
 */
/**
 * jsPDF's built-in Helvetica only encodes Latin-1; any other character makes it
 * switch encodings and garble the WHOLE line ("Rāma Śarmā" -> "R m a  Z a r m").
 * Strip accents (Śrī -> Sri) and replace anything still outside Latin-1.
 */
export function pdfSafeText(value: string | null | undefined): string {
  if (!value) return "";
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\u0009\u000a\u000d\u0020-\u00ff]/g, "?")
    .replace(/\?{2,}/g, "?");
}

export function generateTaxReceiptPdf(opts: TaxReceiptOptions): void {
  buildTaxAcknowledgmentDoc(opts).save(
    `RNHT-Donation-Acknowledgment-${opts.year}.pdf`,
  );
}

/**
 * Builds the year-end acknowledgment and returns it as emailable artifacts
 * (base64 to attach + a Blob for a local copy). Does NOT download — used by the
 * year-end batch send. Runs in any jsPDF-capable runtime (browser or Node).
 */
export function buildYearEndReceiptArtifacts(
  opts: TaxReceiptOptions,
): DonationReceiptArtifacts {
  const doc = buildTaxAcknowledgmentDoc(opts);
  const filename = `RNHT-Donation-Acknowledgment-${opts.year}.pdf`;
  const arrayBuffer = doc.output("arraybuffer") as ArrayBuffer;
  const blob = new Blob([arrayBuffer], { type: "application/pdf" });
  const base64 = arrayBufferToBase64(arrayBuffer);
  return { base64, blob, filename };
}

export interface DonationReceiptOptions {
  donorName: string;
  donorEmail: string;
  /** Donor's full mailing address (for the IRS acknowledgment), when collected. */
  donorAddress?: string;
  amount: number;
  /** Human-readable donation-type / fund name, e.g. "General Temple Donation". */
  fundLabel: string;
  /** Receipt number, e.g. "REC-1a2b3c4d". */
  receiptId: string;
  /** Optional admin note printed on the receipt. */
  note?: string;
  /** Date the gift was received (defaults to now). */
  date?: Date;
}

export interface DonationReceiptArtifacts {
  /** The PDF as a base64 string (no data-URI prefix) — for emailing as an attachment. */
  base64: string;
  /** The PDF as a Blob — for offering a local download copy. */
  blob: Blob;
  filename: string;
}

/**
 * Builds a single-gift "Official Donation Receipt" for a cash/offline donation
 * the temple received in person (the admin Manual Donation Receipt flow). It
 * shares the year-end acknowledgment's letterhead and signature/stamp footer,
 * but covers one gift, dated the day it was received. Returns the PDF as both a
 * base64 string (to email as an attachment) and a Blob (to download a copy); it
 * does NOT auto-download. Client-side only (uses jsPDF + btoa/Blob).
 */
export function generateDonationReceiptPdf(
  opts: DonationReceiptOptions,
): DonationReceiptArtifacts {
  const { donorEmail, amount, receiptId } = opts;
  const donorName = pdfSafeText(opts.donorName);
  const donorAddress = pdfSafeText(opts.donorAddress);
  const fundLabel = pdfSafeText(opts.fundLabel);
  const note = pdfSafeText(opts.note);
  const date = opts.date ?? new Date();

  const doc = new jsPDF({ unit: "pt", format: "letter" });
  doc.setProperties({
    title: `RNHT Donation Receipt ${receiptId}`,
    subject: `Official Donation Receipt — ${fundLabel}`,
    author: TEMPLE.name,
    creator: TEMPLE.name,
  });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 54;
  const contentW = pageW - margin * 2;

  // ── Letterhead ──
  drawLetterhead(doc, pageW, margin);

  let y = 138;

  // ── Title ──
  setInk(doc, MAROON);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text("OFFICIAL DONATION RECEIPT", pageW / 2, y, { align: "center" });
  setStroke(doc, GOLD);
  doc.setLineWidth(1);
  doc.line(margin, y + 8, pageW - margin, y + 8);
  y += 30;

  // ── Receipt no + date row ──
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  setInk(doc, INK);
  doc.text(`Receipt No: ${receiptId}`, margin, y);
  doc.text(`Date: ${receiptDate(date.toISOString())}`, pageW - margin, y, {
    align: "right",
  });
  y += 24;

  // ── Donor block ──
  setInk(doc, GRAY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("RECEIVED WITH GRATITUDE FROM", margin, y);
  y += 16;
  setInk(doc, INK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  const nameLines = doc.splitTextToSize(donorName || "Devotee", contentW) as string[];
  doc.text(nameLines, margin, y);
  y += nameLines.length * 16;
  if (donorEmail) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    setInk(doc, GRAY);
    const emailLines = doc.splitTextToSize(donorEmail, contentW) as string[];
    doc.text(emailLines, margin, y);
    y += emailLines.length * 13;
  }
  // Full mailing address (per the temple CPA — needed for the IRS acknowledgment).
  // The admin can type it multi-line; render each entered line.
  if (donorAddress && donorAddress.trim()) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    setInk(doc, GRAY);
    const addrInput = donorAddress.trim().split(/\r?\n/).filter(Boolean).join(", ");
    const addrLines = doc.splitTextToSize(addrInput, contentW) as string[];
    doc.text(addrLines, margin, y);
    y += addrLines.length * 13;
  }
  y += 16;

  // ── Amount / donation-type box ──
  const boxH = 58;
  setFill(doc, SHADE);
  doc.rect(margin, y, contentW, boxH, "F");
  setStroke(doc, GOLD);
  doc.setLineWidth(0.8);
  doc.rect(margin, y, contentW, boxH, "S");
  setInk(doc, GRAY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("DONATION TYPE", margin + 16, y + 22);
  setInk(doc, INK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(fitText(doc, fundLabel, contentW * 0.58), margin + 16, y + 42);
  setInk(doc, GRAY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("AMOUNT", pageW - margin - 16, y + 22, { align: "right" });
  setInk(doc, MAROON);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(19);
  doc.text(formatCurrency(amount), pageW - margin - 16, y + 44, { align: "right" });
  y += boxH + 22;

  // ── Optional note ──
  if (note && note.trim()) {
    setInk(doc, GRAY);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("NOTE", margin, y);
    y += 14;
    setInk(doc, INK);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const noteLines = doc.splitTextToSize(note.trim(), contentW) as string[];
    doc.text(noteLines, margin, y);
    y += noteLines.length * 13 + 14;
  }

  // ── Thank-you sentence ──
  setInk(doc, INK);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const body =
    `On behalf of Rudra Narayana Hindu Temple, we sincerely thank you for your ` +
    `generous donation. Your support sustains the temple's worship, annadanam, and ` +
    `community service.`;
  const bodyLines = doc.splitTextToSize(body, contentW) as string[];
  doc.text(bodyLines, margin, y);
  y += bodyLines.length * 14 + 16;

  // ── IRS Required Disclosure ──
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  setInk(doc, INK);
  doc.text("IRS Required Disclosure", margin, y);
  y += 14;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  setInk(doc, GRAY);
  const disclosure1 =
    "No goods or services were provided in exchange for this contribution, other than " +
    "intangible religious benefits, in accordance with IRS regulations.";
  const d1 = doc.splitTextToSize(disclosure1, contentW) as string[];
  doc.text(d1, margin, y);
  y += d1.length * 11 + 8;
  const disclosure2 =
    "Rudra Narayana Hindu Temple is a registered 501(c)(3) nonprofit organization. This " +
    "receipt serves as an official acknowledgment for income tax purposes under Section " +
    "170(f)(8) of the Internal Revenue Code.";
  const d2 = doc.splitTextToSize(disclosure2, contentW) as string[];
  doc.text(d2, margin, y);
  y += d2.length * 11 + 20;

  // ── Stamp + signature ──
  // A long note could push the content down; keep the footer on the page.
  if (y > pageH - 170) {
    doc.addPage();
    y = margin + 20;
  }
  const footY = Math.max(y, pageH - 150);
  drawStampAndSignature(doc, pageW, margin, footY);

  const filename = `RNHT-Donation-Receipt-${receiptId}.pdf`;
  const arrayBuffer = doc.output("arraybuffer") as ArrayBuffer;
  const blob = new Blob([arrayBuffer], { type: "application/pdf" });
  const base64 = arrayBufferToBase64(arrayBuffer);
  return { base64, blob, filename };
}

/** Base64-encode an ArrayBuffer in the browser (plain index loop; no spread). */
function arrayBufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Truncate text with an ellipsis so a long donation-type name can't overflow
// into the amount column.
function fitText(doc: jsPDF, text: string, maxW: number): string {
  if (doc.getTextWidth(text) <= maxW) return text;
  let t = text;
  while (t.length > 1 && doc.getTextWidth(t + "…") > maxW) t = t.slice(0, -1);
  return t + "…";
}
