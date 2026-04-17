const EMAIL_AUTH_COOLDOWN_KEY = "rnht_email_auth_cooldown_until";

export function readEmailAuthCooldownUntil(): number {
  if (typeof window === "undefined") return 0;
  const raw = window.localStorage.getItem(EMAIL_AUTH_COOLDOWN_KEY);
  const value = raw ? Number(raw) : 0;
  return Number.isFinite(value) ? value : 0;
}

export function writeEmailAuthCooldownUntil(until: number) {
  if (typeof window === "undefined") return;
  if (until > Date.now()) {
    window.localStorage.setItem(EMAIL_AUTH_COOLDOWN_KEY, String(until));
  } else {
    window.localStorage.removeItem(EMAIL_AUTH_COOLDOWN_KEY);
  }
}

export function getEmailAuthCooldownSeconds(until: number, now = Date.now()) {
  return Math.max(0, Math.ceil((until - now) / 1000));
}
