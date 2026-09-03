/**
 * Normalize a user-entered phone number to E.164, or null if invalid.
 *
 * Shared by /login and the dashboard inline sign-in so both surfaces validate
 * IDENTICALLY. They previously diverged: the dashboard accepted 8–15 digits and
 * blindly prepended +1, producing malformed numbers (e.g. "15125550123" ->
 * "+115125550123") that /login correctly rejected.
 *
 * Rules:
 *   - starts with "+": international — full E.164, 11–15 digits total.
 *   - no "+": assumed US — exactly 10 digits (rejects 7-digit fragments and
 *     11-digit "1NXXNXXXXXX" inputs, which belong in the "+" path).
 */
export function normalizePhone(input: string): string | null {
  // Strip invisible bidi/format marks (iOS Contacts wraps numbers in U+202A…U+202C,
  // some keyboards prefix U+200E) so a pasted number is not rejected as invalid.
  const trimmed = input.replace(/[\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g, "").trim();
  if (!trimmed) return null;
  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return null;
  if (hasPlus) {
    const e164 = `+${digits}`;
    if (!/^\+\d{11,15}$/.test(e164)) return null;
    return e164;
  }
  if (digits.length !== 10) return null;
  return `+1${digits}`;
}
