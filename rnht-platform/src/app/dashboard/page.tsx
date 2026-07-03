"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  getEmailAuthCooldownSeconds,
  readEmailAuthCooldownUntil,
  writeEmailAuthCooldownUntil,
} from "@/lib/email-auth-cooldown";
import { useAuthStore } from "@/store/auth";
import { normalizePhone } from "@/lib/phone";
import {
  User,
  Heart,
  CalendarCheck,
  Activity,
  LogOut,
  CreditCard,
  Clock,
  CheckCircle2,
  XCircle,
  Receipt,
  RefreshCw,
  UserPlus,
  Trash2,
  Edit3,
  Save,
  Mail,
  Phone,
  MapPin,
  Star,
  MessageCircle,
  DollarSign,
  TrendingUp,
} from "lucide-react";

type Tab = "overview" | "bookings" | "donations" | "profile";

/* ─── Login Form (shown when not authenticated) ─── */
function LoginForm() {
  const { sendOtp, verifyOtp, sendPhoneOtp, verifyPhoneOtp } = useAuthStore();
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signup");
  const [method, setMethod] = useState<"phone" | "email">("phone");
  const [step, setStep] = useState<"form" | "phone_otp" | "email_sent">("form");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  // Email verification code — completes sign-in inside the native apps,
  // where the email link only signs in the system browser.
  const [emailCode, setEmailCode] = useState("");
  const [normalizedPhone, setNormalizedPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailCooldownUntil, setEmailCooldownUntil] = useState(0);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const until = readEmailAuthCooldownUntil();
    setEmailCooldownUntil(until);
    setNow(Date.now());
  }, []);

  useEffect(() => {
    writeEmailAuthCooldownUntil(emailCooldownUntil);
  }, [emailCooldownUntil]);

  useEffect(() => {
    if (emailCooldownUntil <= Date.now()) {
      if (emailCooldownUntil !== 0) setEmailCooldownUntil(0);
      return;
    }
    const interval = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => window.clearInterval(interval);
  }, [emailCooldownUntil]);

  const emailCooldownSeconds = getEmailAuthCooldownSeconds(emailCooldownUntil, now);
  const startEmailCooldown = (seconds: number) => {
    setNow(Date.now());
    setEmailCooldownUntil(Date.now() + seconds * 1000);
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (authMode === "signup" && !name.trim()) return;
    setLoading(true);
    setError("");
    if (method === "email") {
      if (!email.trim()) {
        setLoading(false);
        return;
      }
      const result = await sendOtp(email, authMode === "signup" ? name : "", authMode === "signup");
      setLoading(false);
      if (result.error) {
        setError(result.error);
        if (result.retryAfterSeconds) startEmailCooldown(result.retryAfterSeconds);
      } else {
        startEmailCooldown(60);
        setStep("email_sent");
      }
    } else {
      const e164 = normalizePhone(phone);
      if (!e164) {
        setLoading(false);
        setError("Please enter a valid phone number.");
        return;
      }
      setNormalizedPhone(e164);
      const result = await sendPhoneOtp(e164, authMode === "signup" ? name : "", authMode === "signup");
      setLoading(false);
      if (result.error) setError(result.error);
      else setStep("phone_otp");
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 6) return;
    setLoading(true);
    setError("");
    const result = await verifyPhoneOtp(normalizedPhone, otp);
    setLoading(false);
    if (result.error) {
      setError(result.error);
    }
    // On success, auth state change listener in the store handles the rest
  };

  useEffect(() => {
    if (step !== "email_sent" || !supabase) return;

    let cancelled = false;

    const checkSession = async () => {
      if (!supabase) return;
      const { data: { session } } = await supabase.auth.getSession();
      if (!cancelled && session?.user) {
        window.location.reload();
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
  }, [step]);

  const handleEmailConfirmed = async () => {
    if (!supabase) return;
    setLoading(true);
    setError("");
    const { data: { session } } = await supabase.auth.getSession();
    setLoading(false);
    if (session?.user) {
      window.location.reload();
      return;
    }
    setError("We do not see an active session yet. Please open the latest email and click the confirmation link in the same browser.");
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-temple-gold/10 border border-temple-gold/20">
            <User className="h-8 w-8 text-temple-gold" />
          </div>
          <h1 className="font-heading text-3xl font-bold text-temple-maroon">
            Devotee Portal
          </h1>
          <p className="mt-2 text-gray-500 font-accent text-lg">
            {authMode === "signup"
              ? "Create your devotee account to manage services, donations & more"
              : "Sign in to manage your services, donations & more"}
          </p>
        </div>

        <div className="card p-8">
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              {error}
            </div>
          )}
          {step === "form" ? (
            <form onSubmit={handleSendOtp} className="space-y-5">
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
                      ? "New devotees can start their portal with a secure email link or phone code."
                      : "Sign in to view bookings, donations, and your family details."}
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
                    For existing devotees
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
                    For first-time devotees
                  </div>
                </button>
              </div>
              </div>
              <div className="rounded-xl border border-temple-gold/20 bg-temple-cream/40 px-4 py-3 text-sm text-gray-700">
                {authMode === "signup"
                  ? "First-time devotees can create their portal account here using a phone verification code or an email confirmation link."
                  : "Already have a devotee account? Use your phone verification code or email sign-in link."}
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
                  Choose Sign-In Method
                </p>
              <div className="flex rounded-2xl border border-gray-200 bg-gray-50/80 p-1.5">
                <button
                  type="button"
                  onClick={() => setMethod("phone")}
                  className={`flex-1 rounded-xl border py-3 text-sm font-semibold transition-all ${
                    method === "phone"
                      ? "border-temple-maroon bg-temple-maroon text-white shadow-[0_12px_30px_rgba(96,10,31,0.16)]"
                      : "border-transparent bg-transparent text-gray-500 hover:border-temple-maroon hover:bg-temple-maroon hover:text-white hover:shadow-[0_12px_30px_rgba(96,10,31,0.16)]"
                  }`}
                >
                  Phone
                </button>
                <button
                  type="button"
                  onClick={() => setMethod("email")}
                  className={`flex-1 rounded-xl border py-3 text-sm font-semibold transition-all ${
                    method === "email"
                      ? "border-temple-maroon bg-temple-maroon text-white shadow-[0_12px_30px_rgba(96,10,31,0.16)]"
                      : "border-transparent bg-transparent text-gray-500 hover:border-temple-maroon hover:bg-temple-maroon hover:text-white hover:shadow-[0_12px_30px_rgba(96,10,31,0.16)]"
                  }`}
                >
                  Email
                </button>
              </div>
              </div>
              {authMode === "signup" && (
              <div>
                <label htmlFor="dash-login-name" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Full Name
                </label>
                <input
                  id="dash-login-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field"
                  placeholder="Enter your name"
                  required
                />
              </div>
              )}
              {method === "email" ? (
                <div>
                  <label htmlFor="dash-login-email" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Email Address
                  </label>
                  <input
                    id="dash-login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              ) : (
                <div>
                  <label htmlFor="dash-login-phone" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Phone Number
                  </label>
                  <input
                    id="dash-login-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="input-field"
                    placeholder="(512) 555-0123"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    US defaults to +1. International: include country code.
                  </p>
                </div>
              )}
              {method === "email" && emailCooldownSeconds > 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  Please wait {emailCooldownSeconds}s before sending another email. Phone verification is available right away.
                </div>
              )}
              <button
                type="submit"
                disabled={loading || (method === "email" && emailCooldownSeconds > 0)}
                className="btn-primary w-full"
              >
                {loading
                  ? "Sending Code..."
                  : method === "email" && emailCooldownSeconds > 0
                    ? `Try Email Again in ${emailCooldownSeconds}s`
                  : authMode === "signup"
                    ? method === "email"
                      ? "Send Email Confirmation Link"
                      : "Create Account with Phone"
                    : method === "email"
                      ? "Send Sign-In Link"
                      : "Continue with Phone"}
              </button>
              {method === "email" && emailCooldownSeconds > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setMethod("phone");
                    setError("");
                  }}
                  className="w-full text-sm font-medium text-temple-red hover:underline"
                >
                  Use Phone Instead
                </button>
              )}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white px-3 text-gray-400 font-accent">or</span>
                </div>
              </div>
              <a
                href="https://wa.me/message/P3YRA2XY3GI7F1"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary w-full bg-green-600 hover:bg-green-500"
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                Contact via WhatsApp
              </a>
            </form>
          ) : step === "phone_otp" ? (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <p className="text-sm text-gray-600 text-center font-accent">
                We sent a verification code to <strong>{normalizedPhone}</strong>
              </p>
              <div>
                <label htmlFor="dash-login-otp" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Enter OTP
                </label>
                <input
                  id="dash-login-otp"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="input-field text-center text-2xl tracking-[0.5em] font-mono"
                  placeholder="------"
                  maxLength={6}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading || otp.length < 6}
                className="btn-primary w-full"
              >
                {loading
                  ? "Verifying..."
                  : authMode === "signup"
                    ? "Verify & Create Account"
                    : "Verify & Sign In"}
              </button>
              <button
                type="button"
                onClick={() => setStep("form")}
                className="w-full text-sm text-gray-500 hover:text-temple-red transition-colors"
              >
                Use a different number
              </button>
            </form>
          ) : (
            <div className="space-y-5 text-center">
              <div className="space-y-2">
                <p className="text-sm text-gray-600 font-accent">
                  We sent a confirmation email to
                </p>
                <p className="text-xl font-semibold text-gray-900 break-all">{email}</p>
              </div>
              {/* Code entry — the only path that completes inside the
                  native apps (the email link signs in the system browser). */}
              <div className="rounded-xl border border-temple-gold/30 bg-white px-4 py-4 text-left">
                <label htmlFor="dash-email-otp" className="block text-sm font-medium text-temple-maroon">
                  Enter the verification code from the email
                </label>
                <div className="mt-3 flex gap-2">
                  <input
                    id="dash-email-otp"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="e.g. 60216421"
                    className="input-field flex-1 text-center tracking-[0.2em]"
                    value={emailCode}
                    onChange={(e) => setEmailCode(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  />
                  <button
                    type="button"
                    className="btn-primary px-5"
                    disabled={loading || emailCode.length < 6}
                    onClick={async () => {
                      setLoading(true);
                      setError("");
                      const result = await verifyOtp(email, emailCode);
                      setLoading(false);
                      if (result.error) setError(result.error);
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
                  After you confirm, come back here and tap the button below. We will refresh your devotee portal automatically when the session is ready.
                </p>
              </div>
              <button
                type="button"
                onClick={handleEmailConfirmed}
                disabled={loading}
                className="btn-primary w-full"
              >
                {loading
                  ? "Checking Confirmation..."
                  : authMode === "signup"
                    ? "I Confirmed My Email"
                    : "I Clicked the Sign-In Link"}
              </button>
              <button
                type="button"
                onClick={async () => {
                  setLoading(true);
                  setError("");
                  const result = await sendOtp(email, authMode === "signup" ? name : "", authMode === "signup");
                  setLoading(false);
                  if (result.error) {
                    setError(result.error);
                    if (result.retryAfterSeconds) startEmailCooldown(result.retryAfterSeconds);
                  } else {
                    startEmailCooldown(60);
                  }
                }}
                disabled={loading || emailCooldownSeconds > 0}
                className="w-full text-sm font-medium text-temple-red hover:underline"
              >
                {emailCooldownSeconds > 0 ? `Resend Email in ${emailCooldownSeconds}s` : "Resend Email"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMethod("phone");
                  setStep("form");
                  setError("");
                }}
                className="w-full text-sm text-gray-500 hover:text-temple-red transition-colors"
              >
                Use Phone Instead
              </button>
              <button
                type="button"
                onClick={() => setStep("form")}
                className="w-full text-sm text-gray-500 hover:text-temple-red transition-colors"
              >
                Use a different email
              </button>
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-gray-400 font-accent">
          By signing in, you agree to our{" "}
          <Link href="/terms" className="text-temple-gold hover:underline">Terms</Link>
          {" "}&amp;{" "}
          <Link href="/privacy" className="text-temple-gold hover:underline">Privacy Policy</Link>
        </p>
      </div>
    </div>
  );
}

/* ─── Status Badge ─── */
function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { icon: typeof CheckCircle2; className: string; label: string }> = {
    confirmed: { icon: CheckCircle2, className: "bg-green-50 text-green-700 border-green-200", label: "Confirmed" },
    completed: { icon: CheckCircle2, className: "bg-blue-50 text-blue-700 border-blue-200", label: "Completed" },
    pending: { icon: Clock, className: "bg-yellow-50 text-yellow-700 border-yellow-200", label: "Pending" },
    cancelled: { icon: XCircle, className: "bg-red-50 text-red-700 border-red-200", label: "Cancelled" },
  };
  const c = config[status] || config.pending;
  const Icon = c.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${c.className}`}>
      <Icon className="h-3.5 w-3.5" />
      {c.label}
    </span>
  );
}

/* ─── Overview Tab ─── */
function OverviewTab() {
  const { user, bookings, donations, activities } = useAuthStore();
  // Only completed donations count toward the giving total (exclude pending
  // Zelle pledges / abandoned checkouts).
  const completedDonations = donations.filter((d) => d.status === "completed" || d.status === undefined);
  const totalDonated = completedDonations.reduce((s, d) => s + d.amount, 0);
  const totalBookings = bookings.length;
  const upcomingBookings = bookings.filter((b) => b.status === "confirmed" || b.status === "pending");
  // Match the Donations tab's "Recurring total", which counts completed
  // donations only — a pending/failed recurring pledge must not inflate the
  // Overview "Recurring" stat while the Donations tab shows $0.
  const recurringDonations = completedDonations.filter((d) => d.recurring);

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div className="card p-8 bg-gradient-to-r from-temple-maroon-deep to-temple-maroon text-white">
        <h1 className="font-heading text-2xl font-bold">
          Namaste{user?.name?.trim() ? `, ${user.name.trim().split(" ")[0]}` : ""}!
        </h1>
        <p className="mt-2 text-gray-300 font-accent text-lg">
          Welcome to your devotee portal. Manage your services, donations, and spiritual journey.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/services" className="btn-primary bg-temple-gold text-temple-maroon-deep hover:bg-temple-gold-light font-bold text-sm px-5 py-2.5">
            Book a Service
          </Link>
          <Link href="/donate" className="btn-primary bg-white/10 text-white border border-white/20 hover:bg-white/20 text-sm px-5 py-2.5">
            Make a Donation
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Total Donated", value: formatCurrency(totalDonated), icon: DollarSign, color: "text-green-600 bg-green-50" },
          { label: "Services Booked", value: totalBookings, icon: CalendarCheck, color: "text-blue-600 bg-blue-50" },
          { label: "Upcoming", value: upcomingBookings.length, icon: Clock, color: "text-amber-600 bg-amber-50" },
          { label: "Recurring", value: recurringDonations.length, icon: RefreshCw, color: "text-purple-600 bg-purple-50" },
        ].map((stat) => (
          <div key={stat.label} className="card p-5">
            <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${stat.color}`}>
              <stat.icon className="h-5 w-5" />
            </div>
            <p className="mt-3 font-heading text-2xl font-bold text-temple-maroon">{stat.value}</p>
            <p className="text-sm text-gray-500 font-accent">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Upcoming Bookings */}
      {upcomingBookings.length > 0 && (
        <div>
          <h3 className="font-heading text-lg font-bold text-temple-maroon mb-4">Upcoming Services</h3>
          <div className="space-y-3">
            {upcomingBookings.map((b) => (
              <div key={b.id} className="card p-5 flex items-center gap-4">
                <span className="text-2xl">{b.serviceEmoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{b.serviceName}</p>
                  <p className="text-sm text-gray-500">{b.date} at {b.time} &middot; {b.location}</p>
                </div>
                <StatusBadge status={b.status} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div>
        <h3 className="font-heading text-lg font-bold text-temple-maroon mb-4">Recent Activity</h3>
        <div className="card divide-y divide-gray-100">
          {activities.length === 0 && (
            <p className="p-6 text-center text-sm text-gray-500 font-accent">
              No recent activity yet. Your bookings and donations will appear here.
            </p>
          )}
          {activities.slice(0, 5).map((a) => (
            <div key={a.id} className="flex items-center gap-4 p-4">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                a.type === "donation" ? "bg-green-50 text-green-600" :
                a.type === "booking" ? "bg-blue-50 text-blue-600" :
                "bg-gray-50 text-gray-600"
              }`}>
                {a.type === "donation" ? <Heart className="h-4 w-4" /> :
                 a.type === "booking" ? <CalendarCheck className="h-4 w-4" /> :
                 <Activity className="h-4 w-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{a.title}</p>
                <p className="text-xs text-gray-500">{a.description}</p>
              </div>
              <div className="text-right shrink-0">
                {a.amount && <p className="text-sm font-semibold text-gray-900">{formatCurrency(a.amount)}</p>}
                <p className="text-xs text-gray-400">{formatDate(a.date)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Bookings Tab ─── */
function BookingsTab() {
  const bookings = useAuthStore((s) => s.bookings);
  const [filter, setFilter] = useState<"all" | "upcoming" | "completed">("all");

  const filtered = bookings.filter((b) => {
    if (filter === "upcoming") return b.status === "confirmed" || b.status === "pending";
    if (filter === "completed") return b.status === "completed";
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-xl font-bold text-temple-maroon">My Bookings</h2>
        <Link href="/services" className="btn-primary text-sm px-5 py-2.5">
          Book New Service
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(["all", "upcoming", "completed"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
              filter === f
                ? "bg-temple-maroon text-white"
                : "bg-temple-cream text-gray-600 hover:bg-temple-cream-dark"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Booking Cards */}
      <div className="space-y-4">
        {filtered.map((b) => (
          <div key={b.id} className="card p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-temple-cream text-2xl">
                {b.serviceEmoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <h3 className="font-heading font-bold text-gray-900 text-lg">{b.serviceName}</h3>
                  <StatusBadge status={b.status} />
                </div>
                <div className="mt-3 grid gap-2 text-sm text-gray-600 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="flex items-center gap-1.5">
                    <CalendarCheck className="h-4 w-4 text-gray-400" />
                    {b.date}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-gray-400" />
                    {b.time}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    {b.location}
                  </div>
                  {b.priest && (
                    <div className="flex items-center gap-1.5">
                      <User className="h-4 w-4 text-gray-400" />
                      {b.priest}
                    </div>
                  )}
                </div>
              </div>
              <p className="text-lg font-heading font-bold text-temple-maroon shrink-0">{formatCurrency(b.amount)}</p>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
              <p className="text-xs text-gray-400">Booking ID: {b.id}</p>
              {(b.status === "confirmed" || b.status === "pending") && (
                <div className="flex gap-2">
                  <a
                    href="https://wa.me/message/P3YRA2XY3GI7F1"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-green-600 font-medium hover:underline flex items-center gap-1"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    Contact Priest
                  </a>
                </div>
              )}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="card p-12 text-center">
            <CalendarCheck className="mx-auto h-10 w-10 text-gray-300" />
            <p className="mt-3 text-gray-500 font-accent">No bookings found</p>
            <Link href="/services" className="btn-primary mt-4 text-sm">
              Browse Services
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Donations Tab ─── */
function DonationsTab() {
  const { donations, user } = useAuthStore();
  const [showQuickDonate, setShowQuickDonate] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState(51);
  const [selectedFund, setSelectedFund] = useState("General Temple Donation");
  const [receiptYear, setReceiptYear] = useState<number | "">("");
  const [generatingReceipt, setGeneratingReceipt] = useState(false);

  const completedDonations = donations.filter((d) => d.status === "completed" || d.status === undefined);
  const totalDonated = completedDonations.reduce((s, d) => s + d.amount, 0);
  const recurringTotal = completedDonations.filter((d) => d.recurring).reduce((s, d) => s + d.amount, 0);

  // Tax years that actually have completed gifts, newest first — the receipt is
  // generated per calendar (tax) year.
  const receiptYears = Array.from(
    new Set(
      completedDonations
        .map((d) => new Date(d.date).getFullYear())
        .filter((yr) => Number.isFinite(yr)),
    ),
  ).sort((a, b) => b - a);
  const activeReceiptYear: number | "" = receiptYear || receiptYears[0] || "";

  // Build + download an official tax-receipt PDF for the selected year. jsPDF is
  // dynamically imported so it stays out of the main dashboard bundle.
  const handleEarnReceipt = async () => {
    const yr = Number(activeReceiptYear);
    if (!yr) return;
    const yearDonations = completedDonations.filter(
      (d) => new Date(d.date).getFullYear() === yr,
    );
    if (yearDonations.length === 0) return;
    setGeneratingReceipt(true);
    try {
      const { generateTaxReceiptPdf } = await import("@/lib/tax-receipt-pdf");
      generateTaxReceiptPdf({
        donorName: user?.name || "",
        donorEmail: user?.email || "",
        donorAddress: user?.address || undefined,
        year: yr,
        donations: yearDonations,
        generatedAt: new Date(),
      });
    } finally {
      setGeneratingReceipt(false);
    }
  };

  // Stable slugs mirroring the donate page's fund mapping. Passing the slug
  // (not the display name) lets the donate page match the requested fund even
  // when donation_types is unseeded — a name-only deep-link would silently fall
  // back to "General" and mis-attribute the gift.
  const fundSlugByLabel: Record<string, string> = {
    "General Temple Donation": "general",
    "Festival Donation": "festival",
  };

  const handleQuickDonate = () => {
    // Redirect to donate page with pre-selected fund and amount
    // instead of creating a donation record without payment
    const fundParam = fundSlugByLabel[selectedFund] ?? selectedFund;
    window.location.href = `/donate?fund=${encodeURIComponent(fundParam)}&amount=${selectedAmount}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-heading text-xl font-bold text-temple-maroon">My Donations</h2>
        <div className="flex flex-wrap items-center gap-2">
          {receiptYears.length > 0 && (
            <>
              <label htmlFor="receipt-year" className="sr-only">
                Tax year for receipt
              </label>
              <select
                id="receipt-year"
                value={activeReceiptYear}
                onChange={(e) => setReceiptYear(Number(e.target.value))}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-700 focus:border-temple-gold focus:outline-none"
                aria-label="Tax year for receipt"
              >
                {receiptYears.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
              <button
                onClick={handleEarnReceipt}
                disabled={generatingReceipt}
                className="btn-outline text-sm px-4 py-2.5 disabled:opacity-60"
              >
                <Receipt className="mr-2 inline h-4 w-4" />
                {generatingReceipt ? "Preparing…" : "Earn Tax Receipt"}
              </button>
            </>
          )}
          <button onClick={() => setShowQuickDonate(!showQuickDonate)} className="btn-primary text-sm px-5 py-2.5">
            <Heart className="mr-2 h-4 w-4" />
            Donate Now
          </button>
        </div>
      </div>

      {/* Quick Donate Panel */}
      {showQuickDonate && (
        <div className="card p-6 border-temple-gold/20 bg-temple-cream/30">
          <h3 className="font-heading font-bold text-temple-maroon mb-4">Quick Donation</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Donation</label>
              <div className="flex flex-wrap gap-2">
                {["General Temple Donation", "Festival Donation"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setSelectedFund(f)}
                    className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                      selectedFund === f
                        ? "bg-temple-gold text-white"
                        : "bg-white border border-gray-200 text-gray-600 hover:border-temple-gold"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
              <div className="flex flex-wrap gap-2">
                {[11, 21, 51, 101, 251, 501].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setSelectedAmount(amt)}
                    className={`rounded-lg px-5 py-2.5 text-sm font-bold transition-all ${
                      selectedAmount === amt
                        ? "bg-temple-maroon text-white shadow-md"
                        : "bg-white border border-gray-200 text-gray-700 hover:border-temple-gold"
                    }`}
                  >
                    ${amt}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={handleQuickDonate} className="btn-primary">
                Donate ${selectedAmount}
              </button>
              <button onClick={() => setShowQuickDonate(false)} className="btn-outline text-sm">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card p-5 text-center">
          <DollarSign className="mx-auto h-6 w-6 text-green-600" />
          <p className="mt-2 font-heading text-2xl font-bold text-temple-maroon">{formatCurrency(totalDonated)}</p>
          <p className="text-sm text-gray-500 font-accent">Total Donated</p>
        </div>
        <div className="card p-5 text-center">
          <RefreshCw className="mx-auto h-6 w-6 text-purple-600" />
          <p className="mt-2 font-heading text-2xl font-bold text-temple-maroon">{formatCurrency(recurringTotal)}</p>
          <p className="text-sm text-gray-500 font-accent">Recurring total</p>
        </div>
        <div className="card p-5 text-center">
          <Receipt className="mx-auto h-6 w-6 text-blue-600" />
          <p className="mt-2 font-heading text-2xl font-bold text-temple-maroon">{completedDonations.length}</p>
          <p className="text-sm text-gray-500 font-accent">Tax Receipts</p>
        </div>
      </div>

      {/* Donation History */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-heading font-bold text-gray-900">Donation History</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {donations.map((d) => {
            // A receipt only exists once the gift is verified/received. Pending
            // gifts (e.g. a Zelle pledge awaiting bank confirmation) show a
            // status instead of a receipt ID that isn't valid yet. Failed /
            // cancelled gifts must be labelled as such, not silently shown as
            // "Pending" (which read as "still processing").
            const isCompleted = d.status === "completed" || d.status === undefined;
            const isFailed = d.status === "failed" || d.status === "cancelled";
            return (
            <div key={d.id} className="flex items-center gap-4 px-6 py-4 hover:bg-temple-ivory/50 transition-colors">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                d.recurring ? "bg-purple-50 text-purple-600" : "bg-green-50 text-green-600"
              }`}>
                {d.recurring ? <RefreshCw className="h-4 w-4" /> : <Heart className="h-4 w-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm">{d.fund}</p>
                <p className="text-xs text-gray-500">
                  {formatDate(d.date)} · {d.method}
                  {d.recurring && d.frequency ? ` · ${d.frequency}` : ""}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-heading font-bold text-temple-maroon">{formatCurrency(d.amount)}</p>
                {isCompleted ? (
                  <p className="text-xs text-gray-400">{d.receiptId}</p>
                ) : isFailed ? (
                  <p className="text-xs font-accent text-red-600">
                    {d.status === "cancelled" ? "Cancelled" : "Failed"}
                  </p>
                ) : (
                  <p className="text-xs font-accent text-amber-600">Pending</p>
                )}
              </div>
            </div>
            );
          })}
          {donations.length === 0 && (
            <div className="px-6 py-10 text-center text-sm text-gray-500">
              No donations yet. Your giving history will appear here.
            </div>
          )}
        </div>
      </div>

      <p className="text-center text-xs text-gray-400 font-accent">
        All donations to RNHT are tax-deductible under 501(c)(3). Contact us for a copy of your tax receipt.
      </p>
    </div>
  );
}

/* ─── Profile Tab ─── */
function ProfileTab() {
  const { user, updateProfile, addFamilyMember, removeFamilyMember, logout } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    gotra: user?.gotra || "",
    nakshatra: user?.nakshatra || "",
    rashi: user?.rashi || "",
    address: user?.address || "",
    city: user?.city || "",
    state: user?.state || "",
    zip: user?.zip || "",
  });
  const [showAddFamily, setShowAddFamily] = useState(false);
  const [newMember, setNewMember] = useState({ name: "", relationship: "", gotra: "" });
  const [saveError, setSaveError] = useState("");
  const [saveNotice, setSaveNotice] = useState("");

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        gotra: user.gotra || "",
        nakshatra: user.nakshatra || "",
        rashi: user.rashi || "",
        address: user.address || "",
        city: user.city || "",
        state: user.state || "",
        zip: user.zip || "",
      });
    }
  }, [user]);

  const handleSave = async () => {
    setSaveError("");
    setSaveNotice("");
    const result = await updateProfile(form);
    if (result.error) {
      // Keep the form open so the user can correct the input and retry —
      // previously the error was discarded and the edit appeared to succeed.
      setSaveError(result.error);
      return;
    }
    setEditing(false);
    setSaveNotice(
      result.emailChangePending
        ? "Saved. Check your inbox to confirm the new email — your current email stays active for sign-in until you confirm."
        : "Profile saved."
    );
  };

  const handleAddMember = () => {
    if (!newMember.name.trim() || !newMember.relationship.trim()) return;
    addFamilyMember({
      // UUID, not a timestamp — avoids same-millisecond id collisions.
      id: "fm-" + crypto.randomUUID(),
      name: newMember.name,
      relationship: newMember.relationship,
      gotra: newMember.gotra || undefined,
    });
    setNewMember({ name: "", relationship: "", gotra: "" });
    setShowAddFamily(false);
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-xl font-bold text-temple-maroon">My Profile</h2>
        <div className="flex gap-2">
          {editing ? (
            <>
              <button onClick={handleSave} className="btn-primary text-sm px-4 py-2">
                <Save className="mr-1.5 h-4 w-4" /> Save
              </button>
              <button onClick={() => setEditing(false)} className="btn-outline text-sm px-4 py-2">
                Cancel
              </button>
            </>
          ) : (
            <button onClick={() => setEditing(true)} className="btn-outline text-sm px-4 py-2">
              <Edit3 className="mr-1.5 h-4 w-4" /> Edit Profile
            </button>
          )}
        </div>
      </div>

      {saveError && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {saveError}
        </div>
      )}
      {saveNotice && (
        <div role="status" className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {saveNotice}
        </div>
      )}

      {/* Personal Info */}
      <div className="card p-6">
        <h3 className="font-heading font-bold text-gray-900 mb-5">Personal Information</h3>
        <div className="grid gap-5 sm:grid-cols-2">
          {[
            { label: "Full Name", key: "name" as const, icon: User, inputType: "text" as const },
            { label: "Email", key: "email" as const, icon: Mail, inputType: "email" as const },
            // Phone is the sign-in identity for phone-OTP devotees. Editing it
            // here would only change profiles.phone, leaving the auth identity
            // (and thus the OTP login number) on the OLD value — so it's shown
            // read-only with guidance to contact the temple to change it.
            { label: "Phone", key: "phone" as const, icon: Phone, inputType: "tel" as const, readOnly: true },
            { label: "Address", key: "address" as const, icon: MapPin, inputType: "text" as const },
            { label: "City", key: "city" as const, icon: MapPin, inputType: "text" as const },
            { label: "State", key: "state" as const, icon: MapPin, inputType: "text" as const },
          ].map((field) => (
            <div key={field.key}>
              <label htmlFor={`dash-profile-${field.key}`} className="block text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
                <field.icon className="h-3 w-3" />
                {field.label}
              </label>
              {editing && !field.readOnly ? (
                <input
                  id={`dash-profile-${field.key}`}
                  type={field.inputType}
                  value={form[field.key]}
                  onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                  className="input-field"
                />
              ) : (
                <p className="text-sm font-medium text-gray-900">{user[field.key] || "—"}</p>
              )}
              {editing && field.readOnly && (
                <p className="mt-1 text-xs text-gray-400">
                  Contact the temple to update your phone number — it is used to sign in.
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Vedic Info */}
      <div className="card p-6">
        <h3 className="font-heading font-bold text-gray-900 mb-5">Vedic Information</h3>
        <div className="grid gap-5 sm:grid-cols-3">
          {[
            { label: "Gotra", key: "gotra" as const },
            { label: "Nakshatra", key: "nakshatra" as const },
            { label: "Rashi", key: "rashi" as const },
          ].map((field) => (
            <div key={field.key}>
              <label htmlFor={`dash-vedic-${field.key}`} className="block text-xs font-medium text-gray-500 mb-1">
                <Star className="inline h-3 w-3 mr-1" />
                {field.label}
              </label>
              {editing ? (
                <input
                  id={`dash-vedic-${field.key}`}
                  type="text"
                  value={form[field.key]}
                  onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                  className="input-field"
                />
              ) : (
                <p className="text-sm font-medium text-gray-900">{user[field.key] || "—"}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Family Members */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-heading font-bold text-gray-900">Family Members</h3>
          <button onClick={() => setShowAddFamily(!showAddFamily)} className="text-sm font-semibold text-temple-gold hover:text-temple-gold-dark flex items-center gap-1">
            <UserPlus className="h-4 w-4" /> Add Member
          </button>
        </div>
        {showAddFamily && (
          <div className="mb-5 p-4 rounded-xl bg-temple-cream/50 border border-temple-gold/10 space-y-3">
            <div className="grid gap-3 sm:grid-cols-3">
              <input
                type="text"
                placeholder="Name"
                aria-label="Full Name"
                value={newMember.name}
                onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                className="input-field"
              />
              <input
                type="text"
                placeholder="Relationship (e.g. Spouse)"
                aria-label="Relationship"
                value={newMember.relationship}
                onChange={(e) => setNewMember({ ...newMember, relationship: e.target.value })}
                className="input-field"
              />
              <input
                type="text"
                placeholder="Gotra (optional)"
                aria-label="Gotra"
                value={newMember.gotra}
                onChange={(e) => setNewMember({ ...newMember, gotra: e.target.value })}
                className="input-field"
              />
            </div>
            <div className="flex gap-2">
              <button onClick={handleAddMember} className="btn-primary text-sm px-4 py-2">Add</button>
              <button onClick={() => setShowAddFamily(false)} className="btn-outline text-sm px-4 py-2">Cancel</button>
            </div>
          </div>
        )}
        {user.familyMembers.length > 0 ? (
          <div className="space-y-2">
            {user.familyMembers.map((m) => (
              <div key={m.id} className="flex items-center justify-between rounded-xl bg-temple-ivory p-4">
                <div>
                  <p className="font-semibold text-gray-900">{m.name}</p>
                  <p className="text-xs text-gray-500">{m.relationship}{m.gotra ? ` · ${m.gotra} Gotra` : ""}</p>
                </div>
                <button
                  onClick={() => removeFamilyMember(m.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-4 font-accent">No family members added yet</p>
        )}
      </div>

      {/* Sign Out */}
      <button
        onClick={logout}
        className="flex items-center gap-2 text-sm font-medium text-red-600 hover:text-red-700 transition-colors"
      >
        <LogOut className="h-4 w-4" />
        Sign Out
      </button>

      {/* Account management — Apple Guideline 5.1.1(v) requires in-app account
          deletion to be reachable via normal navigation. The full delete flow
          lives on /profile; link to it so a reviewer/user can find it. */}
      <Link
        href="/profile?tab=preferences"
        className="mt-3 flex items-center gap-2 text-sm font-medium text-gray-500 transition-colors hover:text-temple-maroon"
      >
        <Trash2 className="h-4 w-4" />
        Account settings &amp; delete account
      </Link>
    </div>
  );
}

/* ─── Main Dashboard Page ─── */
// useSearchParams() forces a CSR bailout under static export unless wrapped in
// <Suspense> — otherwise /dashboard prerendered to a bare "Loading…" shell.
export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="h-80 animate-pulse rounded-3xl bg-temple-ivory" />
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}

function DashboardContent() {
  const { isAuthenticated, initialized, initialize } = useAuthStore();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    const requestedTab = searchParams.get("tab");
    if (
      requestedTab === "overview" ||
      requestedTab === "bookings" ||
      requestedTab === "donations" ||
      requestedTab === "profile"
    ) {
      setActiveTab(requestedTab);
    }
  }, [searchParams]);

  if (!initialized) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-temple-gold/20 border-t-temple-gold" />
          <p className="text-gray-500 font-accent">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  const tabs: { id: Tab; label: string; icon: typeof User }[] = [
    { id: "overview", label: "Overview", icon: Activity },
    { id: "bookings", label: "Bookings", icon: CalendarCheck },
    { id: "donations", label: "Donations", icon: Heart },
    { id: "profile", label: "Profile", icon: User },
  ];

  return (
    <div className="bg-temple-ivory min-h-screen">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Tab Navigation */}
        <div
          role="tablist"
          aria-label="Devotee portal sections"
          className="flex gap-1 rounded-2xl bg-white p-1.5 shadow-premium mb-8 overflow-x-auto"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              id={`dash-tab-${tab.id}`}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`dash-panel-${tab.id}`}
              tabIndex={activeTab === tab.id ? 0 : -1}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-temple-maroon text-white shadow-md"
                  : "text-gray-600 hover:bg-temple-cream hover:text-temple-maroon"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div
          role="tabpanel"
          id={`dash-panel-${activeTab}`}
          aria-labelledby={`dash-tab-${activeTab}`}
        >
          {activeTab === "overview" && <OverviewTab />}
          {activeTab === "bookings" && <BookingsTab />}
          {activeTab === "donations" && <DonationsTab />}
          {activeTab === "profile" && <ProfileTab />}
        </div>
      </div>
    </div>
  );
}
