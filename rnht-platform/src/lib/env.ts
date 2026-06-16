export type EnvValidationResult = {
  missingCore: string[];
  missingPayments: string[];
  missingEmail: string[];
};

function isBlank(value: string | undefined) {
  return !value || !value.trim();
}

function collectMissing(env: NodeJS.ProcessEnv, keys: string[]) {
  return keys.filter((key) => isBlank(env[key]));
}

export function getEnvValidationResult(env: NodeJS.ProcessEnv = process.env): EnvValidationResult {
  return {
    missingCore: collectMissing(env, [
      "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      "NEXT_PUBLIC_APP_URL",
    ]),
    missingPayments: collectMissing(env, [
      "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
      "STRIPE_SECRET_KEY",
      "PAYPAL_CLIENT_ID",
      "PAYPAL_SECRET",
    ]),
    missingEmail: collectMissing(env, [
      "RESEND_API_KEY",
      "RNHT_EMAIL_FROM",
    ]),
  };
}

export function hasBlockingEnvIssues(env: NodeJS.ProcessEnv = process.env) {
  return getEnvValidationResult(env).missingCore.length > 0;
}

export function hasPaymentEnvIssues(env: NodeJS.ProcessEnv = process.env) {
  return getEnvValidationResult(env).missingPayments.length > 0;
}

export function hasEmailEnvIssues(env: NodeJS.ProcessEnv = process.env) {
  return getEnvValidationResult(env).missingEmail.length > 0;
}

let didLogEnvConfigWarnings = false;

/**
 * Surfaces missing payment/email configuration as an operator-visible warning.
 * Unlike StartupValidationNotice (dev-only UI, missingCore-only), this runs in
 * every environment including production so a deploy missing PAYPAL_SECRET /
 * STRIPE_SECRET_KEY / RESEND_API_KEY is not silently treated as healthy.
 * Safe to call repeatedly; it only logs once per process.
 */
export function logEnvConfigWarnings(env: NodeJS.ProcessEnv = process.env) {
  if (didLogEnvConfigWarnings) return;
  didLogEnvConfigWarnings = true;

  const { missingPayments, missingEmail } = getEnvValidationResult(env);

  if (missingPayments.length > 0) {
    console.warn(
      `[env] Missing payment configuration: ${missingPayments.join(
        ", ",
      )}. Donations relying on these keys will fail.`,
    );
  }
  if (missingEmail.length > 0) {
    console.warn(
      `[env] Missing email configuration: ${missingEmail.join(
        ", ",
      )}. Tax receipts and notification emails will not be sent.`,
    );
  }
}

export function parseEmailList(value: string | undefined): string[] {
  const raw = value?.trim();
  if (!raw) return [];
  return raw
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

export function getAdminRoleConfig(env: NodeJS.ProcessEnv = process.env) {
  return {
    approverEmails: parseEmailList(env.NEXT_PUBLIC_RNHT_ADMIN_APPROVER_EMAILS),
    editorEmails: parseEmailList(env.NEXT_PUBLIC_RNHT_ADMIN_EDITOR_EMAILS),
  };
}
