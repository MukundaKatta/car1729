"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, Phone as PhoneIcon, ArrowRight, ShieldCheck, CheckCircle, Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { supabase } from "@/lib/supabase";
import { isNative } from "@/lib/capacitor";
import { normalizePhone } from "@/lib/phone";
import {
  getEmailAuthCooldownSeconds,
  readEmailAuthCooldownUntil,
  writeEmailAuthCooldownUntil,
} from "@/lib/email-auth-cooldown";

type AuthStep = "method" | "email" | "email_sent" | "phone" | "phone_otp" | "success";

// Basic email shape check so we don't send magic links to malformed addresses.
const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

/**
 * Normalize a user-entered phone number to E.164 format.
 * - Strips all non-digit characters except a leading "+"
 * - If no "+", assumes US and prepends "+1"
 * - Returns null if the result isn't a plausible E.164 number
 */
export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, sendOtp, verifyOtp, sendPhoneOtp, verifyPhoneOtp, initialize } = useAuthStore();
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [step, setStep] = useState<AuthStep>("method");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [normalizedPhone, setNormalizedPhone] = useState("");
  const [name, setName] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  // Code from the sign-in email — lets users finish auth without leaving the
  // page. Essential in the native apps: the email link opens the system
  // browser, whose session never reaches the app's webview.
  const [emailCode, setEmailCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailCooldownUntil, setEmailCooldownUntil] = useState(0);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    const requestedMode = searchParams.get("mode");
    if (requestedMode === "signup" || requestedMode === "signin") {
      setAuthMode(requestedMode);
    }
  }, [searchParams]);

  useEffect(() => {
    const until = readEmailAuthCooldownUntil();
    setEmailCooldownUntil(until);
    setNow(Date.now());
  }, []);

  useEffect(() => {
    writeEmailAuthCooldownUntil(emailCooldownUntil);
  }, [emailCooldownUntil]);

  // Phone OTP resend throttle (mirrors the email cooldown).
  const [phoneCooldownUntil, setPhoneCooldownUntil] = useState(0);

  // One ticker advances `now` every second while EITHER cooldown is counting
  // down, so both the email and phone "Resend" countdowns tick and re-enable.
  // (Previously this was gated only on the email cooldown, which froze the
  // phone countdown forever in a pure phone-login flow.)
  useEffect(() => {
    const latest = Math.max(emailCooldownUntil, phoneCooldownUntil);
    if (latest <= Date.now()) return;
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [emailCooldownUntil, phoneCooldownUntil]);

  // Clear an expired email cooldown (also clears the persisted value).
  useEffect(() => {
    if (emailCooldownUntil !== 0 && emailCooldownUntil <= now) setEmailCooldownUntil(0);
  }, [now, emailCooldownUntil]);

  const emailCooldownSeconds = getEmailAuthCooldownSeconds(emailCooldownUntil, now);
  const startEmailCooldown = (seconds: number) => {
    setNow(Date.now());
    setEmailCooldownUntil(Date.now() + seconds * 1000);
  };

  const phoneCooldownSeconds = getEmailAuthCooldownSeconds(phoneCooldownUntil, now);
  const startPhoneCooldown = (seconds: number) => {
    setNow(Date.now());
    setPhoneCooldownUntil(Date.now() + seconds * 1000);
  };

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (step !== "email_sent" || !supabase) return;

    let cancelled = false;

    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!cancelled && session?.user) {
        router.replace("/dashboard");
      }
    };

    const timeout = window.setTimeout(checkSession, 1500);
    const handleFocus = () => {
      void checkSession();
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
      window.removeEventListener("focus", handleFocus);
    };
  }, [router, step]);

  const handleSendOtp = async () => {
    setError("");
    setLoading(true);
    const result = await sendOtp(email, authMode === "signup" ? name : "", authMode === "signup");
    setLoading(false);
    if (result.error) {
      setError(result.error);
      if (result.retryAfterSeconds) startEmailCooldown(result.retryAfterSeconds);
    } else {
      startEmailCooldown(60);
      setStep("email_sent");
    }
  };

  const handleResendOtp = async () => {
    setError("");
    setLoading(true);
    const result = await sendOtp(email, authMode === "signup" ? name : "", authMode === "signup");
    setLoading(false);
    if (result.error) {
      setError(result.error);
      if (result.retryAfterSeconds) startEmailCooldown(result.retryAfterSeconds);
    } else {
      // Restart the throttle on a successful resend (was missing, so the
      // cooldown never re-armed and the button could be spammed).
      startEmailCooldown(60);
    }
  };

  const handleEmailConfirmed = async () => {
    if (!supabase) {
      setError("Authentication is not configured");
      return;
    }
    setError("");
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    setLoading(false);
    // Don't eagerly navigate here — let the auth store catch up and drive the
    // redirect via the isAuthenticated effect below, so navigation waits for
    // auth state instead of racing ahead of it.
    if (session?.user) {
      return;
    }
    setError("We do not see an active session yet. Please open the latest email and click the confirmation link in the same browser.");
  };

  const handleSendPhoneOtp = async () => {
    setError("");
    const e164 = normalizePhone(phone);
    if (!e164) {
      setError("Please enter a valid phone number (e.g. (512) 555-0123).");
      return;
    }
    setNormalizedPhone(e164);
    setLoading(true);
    const result = await sendPhoneOtp(e164, authMode === "signup" ? name : "", authMode === "signup");
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      startPhoneCooldown(60);
      setStep("phone_otp");
    }
  };

  const handleVerifyPhoneOtp = async () => {
    setError("");
    setLoading(true);
    const token = otp.join("");
    const result = await verifyPhoneOtp(normalizedPhone, token);
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      setStep("success");
    }
  };

  const handleResendPhoneOtp = async () => {
    if (phoneCooldownSeconds > 0) return;
    setError("");
    setLoading(true);
    const result = await sendPhoneOtp(normalizedPhone, authMode === "signup" ? name : "", authMode === "signup");
    setLoading(false);
    if (result.error) setError(result.error);
    else startPhoneCooldown(60);
  };

  const handleGoogleSignIn = async () => {
    setError("");
    if (!supabase) {
      setError("Authentication is not configured");
      return;
    }
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}${process.env.NEXT_PUBLIC_BASE_PATH || ""}/auth/callback`,
      },
    });
    if (err) {
      setError(err.message);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    // iOS/Android SMS autofill can inject the whole code into one box —
    // distribute the digits across the boxes instead of discarding them.
    if (value.length > 1) {
      const digits = value.replace(/\D/g, "").slice(0, 6 - index).split("");
      if (!digits.length) return;
      const newOtp = [...otp];
      digits.forEach((d, di) => {
        newOtp[index + di] = d;
      });
      setOtp(newOtp);
      document.getElementById(`otp-${Math.min(index + digits.length, 5)}`)?.focus();
      return;
    }
    const newOtp = [...otp];
    // Strip non-digits so a typed/pasted letter can't fill a box and enable
    // Verify (matches the multi-char paste path and the dashboard OTP input).
    const digit = value.replace(/\D/g, "")[0] || "";
    newOtp[index] = digit;
    setOtp(newOtp);
    if (digit && index < 5) {
      const next = document.getElementById(`otp-${index + 1}`);
      next?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prev = document.getElementById(`otp-${index - 1}`);
      prev?.focus();
    }
  };

  // Handle paste of full OTP code
  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(""));
      const last = document.getElementById("otp-5");
      last?.focus();
    }
  };

  if (step === "success") {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 py-16 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
          <CheckCircle className="h-10 w-10 text-green-600" />
        </div>
        <h1 className="mt-6 font-heading text-2xl font-bold text-gray-900">
          Welcome to RNHT!
        </h1>
        <p className="mt-3 text-gray-600">
          You have been successfully signed in. You can now book services,
          manage your family profiles, and track your spiritual journey.
        </p>
        <div className="mt-8 flex gap-4">
          <Link href="/dashboard" className="btn-primary">
            My Dashboard
          </Link>
          <Link href="/services" className="btn-outline">
            Book a Pooja
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 py-16">
      <div className="w-full">
        {/* Temple logo */}
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-temple-red text-2xl font-heading font-bold text-white">
            R
          </div>
          <h1 className="mt-4 font-heading text-2xl font-bold text-gray-900">
            Devotee Sign In / Sign Up
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            {authMode === "signup"
              ? "Create your devotee account with a secure email link or phone code"
              : "Access your devotee profile, booking history, and more"}
          </p>
        </div>

        <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          {/* Error display */}
          {error && (
            <div
              role="alert"
              aria-live="polite"
              aria-atomic="true"
              className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          {/* Step: Choose method */}
          {step === "method" && (
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="text-center">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-temple-gold-dark">
                    Account Access
                  </p>
                  <h2 className="mt-2 font-heading text-2xl font-bold text-temple-maroon">
                    {authMode === "signup" ? "Create Your Devotee Account" : "Welcome Back"}
                  </h2>
                  <p className="mt-2 text-sm text-gray-500">
                    {authMode === "signup"
                      ? "Choose phone or email to create your devotee portal."
                      : "Choose how you would like to sign in to your devotee portal."}
                  </p>
                </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setAuthMode("signin")}
                  className={`rounded-2xl border px-4 py-4 text-left transition-all ${
                    authMode === "signin"
                      ? "border-temple-maroon bg-temple-maroon text-white shadow-[0_12px_30px_rgba(96,10,31,0.16)]"
                      : "border-gray-200 bg-white text-gray-700 hover:border-temple-gold/40 hover:bg-temple-cream/40"
                  }`}
                >
                  <div className="text-base font-bold">Sign In</div>
                  <div className={`mt-1 text-xs ${authMode === "signin" ? "text-white/80" : "text-gray-500"}`}>
                    Existing devotees
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode("signup")}
                  className={`rounded-2xl border px-4 py-4 text-left transition-all ${
                    authMode === "signup"
                      ? "border-temple-maroon bg-temple-maroon text-white shadow-[0_12px_30px_rgba(96,10,31,0.16)]"
                      : "border-gray-200 bg-white text-gray-700 hover:border-temple-gold/40 hover:bg-temple-cream/40"
                  }`}
                >
                  <div className="text-base font-bold">Sign Up</div>
                  <div className={`mt-1 text-xs ${authMode === "signup" ? "text-white/80" : "text-gray-500"}`}>
                    First-time devotees
                  </div>
                </button>
              </div>
              </div>
              <div className="rounded-xl border border-temple-gold/20 bg-temple-cream/40 px-4 py-3 text-sm text-gray-700">
                {authMode === "signup"
                  ? "New devotees can create their portal account here using phone, email, or Google."
                  : "Returning devotees can sign in here using phone, email, or Google."}
              </div>
              <button
                onClick={() => { setError(""); setStep("phone"); }}
                className="group flex w-full items-center gap-4 rounded-xl border border-gray-200 p-4 text-left transition-colors hover:border-temple-maroon hover:bg-temple-maroon hover:text-white"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-600 transition-colors group-hover:bg-white/15 group-hover:text-white">
                  <PhoneIcon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 group-hover:text-white">
                    {authMode === "signup" ? "Create Account with Phone" : "Continue with Phone"}
                  </p>
                  <p className="text-xs text-gray-500 group-hover:text-white/80">
                    {authMode === "signup"
                      ? "We'll text you a 6-digit code to create your devotee account"
                      : "We'll text you a 6-digit code to sign in to your account"}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-white" />
              </button>

              <button
                onClick={() => { setError(""); setStep("email"); }}
                className="group flex w-full items-center gap-4 rounded-xl border border-gray-200 p-4 text-left transition-colors hover:border-temple-maroon hover:bg-temple-maroon hover:text-white"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600 transition-colors group-hover:bg-white/15 group-hover:text-white">
                  <Mail className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 group-hover:text-white">
                    {authMode === "signup" ? "Create Account with Email" : "Sign In with Email"}
                  </p>
                  <p className="text-xs text-gray-500 group-hover:text-white/80">
                    {authMode === "signup"
                      ? "We'll email you a confirmation link to create your devotee account"
                      : "We'll email you a sign-in link for your devotee portal"}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-white" />
              </button>

              {/* Google OAuth opens the system browser and cannot return a
                  session to the native WebView (no deep-link handler), so it is
                  hidden in the apps; email/phone code sign-in work in-app. */}
              {!isNative() && (
              <>
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">
                    Or continue with
                  </span>
                </div>
              </div>

              <button
                onClick={handleGoogleSignIn}
                className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 py-3.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 hover:border-gray-300"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </button>
              </>
              )}
            </div>
          )}

          {/* Step: Email input */}
          {step === "email" && (
            <div className="space-y-4">
              <button
                onClick={() => { setStep("method"); setError(""); }}
                className="rounded text-sm text-gray-500 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-temple-red focus-visible:ring-offset-2"
              >
                &larr; Back
              </button>
              <div>
                <label htmlFor="email-name" className="block text-sm font-medium text-gray-700">
                  Your Name
                </label>
                <input
                  id="email-name"
                  type="text"
                  autoComplete="name"
                  className="input-field mt-1"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                />
              </div>
              {authMode === "signin" && (
                <p className="-mt-2 text-xs text-gray-500">
                  Name is only needed when creating a new devotee account.
                </p>
              )}
              <div>
                <label htmlFor="email-address" className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <input
                  id="email-address"
                  type="email"
                  autoComplete="email"
                  className="input-field mt-1"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              {emailCooldownSeconds > 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  Please wait {emailCooldownSeconds}s before sending another email. Phone verification is available right away.
                </div>
              )}
              <button
                className="btn-primary w-full flex items-center justify-center gap-2"
                disabled={!isValidEmail(email) || (authMode === "signup" && !name.trim()) || loading || emailCooldownSeconds > 0}
                onClick={handleSendOtp}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending Code...
                  </>
                ) : (
                  emailCooldownSeconds > 0
                    ? `Try Email Again in ${emailCooldownSeconds}s`
                    : authMode === "signup"
                      ? "Send Email Confirmation Link"
                      : "Send Sign-In Link"
                )}
              </button>
              {emailCooldownSeconds > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setStep("phone");
                    setError("");
                  }}
                  className="w-full text-sm font-medium text-temple-red hover:underline"
                >
                  Use Phone Instead
                </button>
              )}
            </div>
          )}

          {/* Step: Phone input */}
          {step === "phone" && (
            <div className="space-y-4">
              <button
                onClick={() => { setStep("method"); setError(""); }}
                className="rounded text-sm text-gray-500 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-temple-red focus-visible:ring-offset-2"
              >
                &larr; Back
              </button>
              <div>
                <label htmlFor="phone-name" className="block text-sm font-medium text-gray-700">
                  Your Name
                </label>
                <input
                  id="phone-name"
                  type="text"
                  autoComplete="name"
                  className="input-field mt-1"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                />
              </div>
              {authMode === "signin" && (
                <p className="-mt-2 text-xs text-gray-500">
                  Name is only needed when creating a new devotee account.
                </p>
              )}
              <div>
                <label htmlFor="phone-number" className="block text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <input
                  id="phone-number"
                  type="tel"
                  autoComplete="tel"
                  className="input-field mt-1"
                  placeholder="(512) 555-0123"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                <p className="mt-1 text-xs text-gray-500">
                  US numbers default to +1. For international, include the
                  country code (e.g. +44 7700 900123).
                </p>
              </div>
              {phoneCooldownSeconds > 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  Please wait {phoneCooldownSeconds}s before sending another code.
                </div>
              )}
              <button
                className="btn-primary w-full flex items-center justify-center gap-2"
                disabled={!phone.trim() || (authMode === "signup" && !name.trim()) || loading || phoneCooldownSeconds > 0}
                onClick={handleSendPhoneOtp}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending Code...
                  </>
                ) : (
                  phoneCooldownSeconds > 0
                    ? `Try Again in ${phoneCooldownSeconds}s`
                    : authMode === "signup"
                      ? "Create Account with Phone"
                      : "Send Verification Code"
                )}
              </button>
            </div>
          )}

          {/* Step: Phone OTP verification */}
          {step === "phone_otp" && (
            <div className="space-y-4 text-center">
              <button
                onClick={() => {
                  setStep("phone");
                  setError("");
                  setOtp(["", "", "", "", "", ""]);
                }}
                className="rounded text-sm text-gray-500 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-temple-red focus-visible:ring-offset-2"
              >
                &larr; Back
              </button>
              <div>
                <p className="text-sm text-gray-600">
                  Enter the 6-digit code sent to
                </p>
                <p className="font-semibold text-gray-900">{normalizedPhone}</p>
              </div>
              <div className="flex justify-center gap-2">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    id={`otp-${i}`}
                    type="text"
                    inputMode="numeric"
                    autoComplete={i === 0 ? "one-time-code" : "off"}
                    className="h-12 w-12 rounded-lg border border-gray-300 text-center text-lg font-semibold focus:border-temple-red focus:outline-none focus:ring-2 focus:ring-temple-red/20"
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    onPaste={i === 0 ? handleOtpPaste : undefined}
                    autoFocus={i === 0}
                    aria-label={`Digit ${i + 1}`}
                  />
                ))}
              </div>
              <button
                className="btn-primary w-full flex items-center justify-center gap-2"
                disabled={otp.some((d) => !d) || loading}
                onClick={handleVerifyPhoneOtp}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  authMode === "signup" ? "Verify & Create Account" : "Verify & Sign In"
                )}
              </button>
              <button
                onClick={handleResendPhoneOtp}
                disabled={loading || phoneCooldownSeconds > 0}
                className="text-sm text-temple-red hover:underline disabled:opacity-50"
              >
                {phoneCooldownSeconds > 0 ? `Resend Code in ${phoneCooldownSeconds}s` : "Resend Code"}
              </button>
            </div>
          )}

          {/* Step: Email confirmation */}
          {step === "email_sent" && (
            <div className="space-y-4 text-center">
              <button
                onClick={() => {
                  setStep("email");
                  setError("");
                  setEmailCode("");
                }}
                className="rounded text-sm text-gray-500 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-temple-red focus-visible:ring-offset-2"
              >
                &larr; Back
              </button>
              <div>
                <p className="text-sm text-gray-600">
                  We sent a confirmation link to
                </p>
                <p className="font-semibold text-gray-900">{email}</p>
              </div>
              {/* Code entry — works everywhere, and is the ONLY path that
                  completes inside the native apps (the email link signs you
                  in in the system browser, not the app). */}
              <div className="rounded-xl border border-temple-gold/30 bg-white px-4 py-4 text-left">
                <label htmlFor="email-otp" className="text-sm font-medium text-temple-maroon">
                  Enter the verification code from the email
                </label>
                <div className="mt-3 flex gap-2">
                  <input
                    id="email-otp"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="e.g. 60216421"
                    className="input-field flex-1 text-center tracking-[0.2em]"
                    value={emailCode}
                    onChange={(e) => setEmailCode(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  />
                  <button
                    className="btn-primary px-5"
                    disabled={loading || emailCode.length < 6}
                    onClick={async () => {
                      setLoading(true);
                      setError("");
                      const result = await verifyOtp(email, emailCode);
                      setLoading(false);
                      // On success, advance to the success screen immediately
                      // (mirrors the phone-OTP path) instead of leaving the user
                      // on the code form waiting for a background session check.
                      if (result.error) setError(result.error);
                      else setStep("success");
                    }}
                  >
                    Verify
                  </button>
                </div>
              </div>
              <div className="rounded-xl border border-temple-gold/20 bg-temple-cream/40 px-4 py-4 text-left text-sm text-gray-700">
                <p className="font-medium text-temple-maroon">
                  Or open the email and click the confirmation link to finish {authMode === "signup" ? "creating your account" : "signing in"}.
                </p>
                <p className="mt-2 text-gray-600">
                  After you confirm, come back here and tap the button below. We will also check again automatically when this page regains focus.
                </p>
              </div>
              <button
                className="btn-primary w-full flex items-center justify-center gap-2"
                disabled={loading}
                onClick={handleEmailConfirmed}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Checking Confirmation...
                  </>
                ) : (
                  authMode === "signup" ? "I Confirmed My Email" : "I Clicked the Sign-In Link"
                )}
              </button>
              <button
                onClick={handleResendOtp}
                disabled={loading || emailCooldownSeconds > 0}
                className="text-sm text-temple-red hover:underline disabled:opacity-50"
              >
                {emailCooldownSeconds > 0 ? `Resend Email in ${emailCooldownSeconds}s` : "Resend Email"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep("phone");
                  setError("");
                }}
                className="text-sm text-gray-500 hover:text-temple-red"
              >
                Use Phone Instead
              </button>
            </div>
          )}
        </div>

        {/* Guest note */}
        <div className="mt-6 flex items-center gap-2 justify-center text-xs text-gray-500">
          <ShieldCheck className="h-4 w-4 text-green-600" />
          <span>
            Guest checkout is also available when booking services.
          </span>
        </div>
      </div>
    </div>
  );
}
