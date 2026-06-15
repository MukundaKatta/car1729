"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Heart,
  CreditCard,
  ShieldCheck,
  CheckCircle,
  LogIn,
  UserPlus,
  Receipt,
} from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { useLanguageStore } from "@/store/language";
import { t } from "@/lib/i18n/translations";
import { supabase } from "@/lib/supabase";
import { isNative } from "@/lib/capacitor";
import type { DonationType, DonationTypeCustomField } from "@/types/database";
import { useAuthStore } from "@/store/auth";
import {
  donateCreateUrl,
  donateVerifyUrl,
  edgeFunctionHeaders,
  paypalCaptureUrl,
} from "@/lib/edge-functions";

// Fallback fund types used when Supabase isn't configured (e.g. during
// static builds) so the form still renders.
const fallbackFunds: Pick<DonationType, "id" | "slug" | "name" | "description" | "custom_fields">[] = [
  {
    id: "general",
    slug: "general",
    name: "General Temple Fund",
    description: "Unrestricted contribution supporting all temple activities",
    custom_fields: [],
  },
];

// Temple Zelle contact number — kept in one place so the three places that
// surface it (success screen, payment panel, Zelle section) stay in sync.
const ZELLE_PHONE = "(512) 545-0473";

const donationFundLabels: Record<string, string> = {
  general: "General Temple Fund",
  building: "Building Fund",
  priest: "Priest Fund",
  annadanam: "Annadanam Fund",
  festival: "Festival Fund",
  education: "Education Fund",
};

function donationFundLabel(slug: string) {
  return donationFundLabels[slug] || "Temple Fund";
}

// useSearchParams() forces a CSR bailout under static export unless it sits
// inside a <Suspense> boundary — without this the whole /donate route prerendered
// to an empty "Loading…" shell (blank flash for users, no body for crawlers).
// Wrapping here lets the route prerender this real header/skeleton fallback.
function DonateFallback() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="text-center">
        <Heart className="mx-auto h-10 w-10 text-temple-red" />
        <h1 className="mt-4 section-heading">Support Our Temple</h1>
        <p className="mt-3 text-gray-600">
          Your contributions help maintain the temple and support community programs.
        </p>
        <p className="mt-2 text-sm font-semibold text-gray-900">
          All donations are tax-deductible under 501(c)(3).
        </p>
      </div>
      <div className="mt-8 h-64 animate-pulse rounded-3xl bg-temple-ivory" />
    </div>
  );
}

export default function DonatePage() {
  return (
    <Suspense fallback={<DonateFallback />}>
      <DonateContent />
    </Suspense>
  );
}

function DonateContent() {
  const [fundTypes, setFundTypes] = useState<DonationType[]>([]);
  const [customAmount, setCustomAmount] = useState("");
  const [fundTypeSlug, setFundTypeSlug] = useState("general");
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({});
  const [donorName, setDonorName] = useState("");
  const [donorEmail, setDonorEmail] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"stripe" | "zelle" | "paypal">(
    "stripe"
  );
  const [submitted, setSubmitted] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [nativePaymentOpened, setNativePaymentOpened] = useState(false);
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [error, setError] = useState("");
  // Errors from verifying a returned Stripe/PayPal payment are tracked
  // separately from form-submit errors. Reading searchParams at render to tell
  // them apart is unreliable — replaceState strips ?success but useSearchParams
  // doesn't react to it, so the value goes stale and a later form error would
  // render in the wrong place.
  const [verifyError, setVerifyError] = useState("");
  const [confirmedAmount, setConfirmedAmount] = useState<number | null>(null);
  const [confirmedFundName, setConfirmedFundName] = useState<string | null>(null);
  const locale = useLanguageStore((s) => s.locale);
  const searchParams = useSearchParams();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authUser = useAuthStore((s) => s.user);
  const fetchUserData = useAuthStore((s) => s.fetchUserData);

  // Load fund types from DB; fall back gracefully if Supabase isn't set up.
  useEffect(() => {
    async function load() {
      if (!supabase) {
        setFundTypes(fallbackFunds as DonationType[]);
        return;
      }
      const { data } = await supabase
        .from("donation_types")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      if (data && data.length) {
        setFundTypes(data as unknown as DonationType[]);
      } else {
        setFundTypes(fallbackFunds as DonationType[]);
      }
    }
    load();
  }, []);

  // Quick Donate deep-link from the dashboard: ?fund=<slug-or-name>&amount=<n>.
  // (Previously these params were ignored, so Quick Donate did nothing.)
  useEffect(() => {
    if (!fundTypes.length) return;
    const fundParam = searchParams.get("fund");
    const amountParam = searchParams.get("amount");
    if (fundParam) {
      const match = fundTypes.find(
        (f) =>
          f.slug === fundParam ||
          f.name?.toLowerCase() === fundParam.toLowerCase(),
      );
      if (match) setFundTypeSlug(match.slug);
    }
    if (amountParam && Number(amountParam) > 0) {
      setCustomAmount(String(Number(amountParam)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fundTypes]);

  // Prefill donor email / name from the logged-in user.
  useEffect(() => {
    if (authUser) {
      if (!donorEmail) setDonorEmail(authUser.email);
      if (!donorName) setDonorName(authUser.name);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser]);

  // Handle return from Stripe or PayPal. Runs EXACTLY ONCE per return: read the
  // params, strip them immediately, then verify. The ref guard prevents a
  // re-render — e.g. from the replaceState below, or from our own setState, both
  // of which can make useSearchParams re-emit under the static export — from
  // re-entering this effect and cancelling the in-flight verification before it
  // can mark the donation confirmed. (Previously a `cancelled` cleanup aborted
  // verifyDonation on that re-run, so the confirmation screen never appeared.)
  const returnHandledRef = useRef(false);
  useEffect(() => {
    if (searchParams.get("success") !== "true") return;
    if (returnHandledRef.current) return;
    returnHandledRef.current = true;

    const token = searchParams.get("token");
    const provider = searchParams.get("provider");
    const sessionId = searchParams.get("session_id");

    // Strip ?success/&session_id up front (after capturing them) so a refresh or
    // native re-focus can't re-run verification against an already-consumed session.
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", window.location.pathname);
    }

    async function verifyDonation() {
      setVerifyingPayment(true);
      setProcessing(true);
      setVerifyError("");

      try {
        if (token && provider === "paypal") {
          const response = await fetch(paypalCaptureUrl(), {
            method: "POST",
            headers: edgeFunctionHeaders({ "Content-Type": "application/json" }),
            body: JSON.stringify({ orderId: token }),
          });
          const data = await response.json();

          if (!response.ok || data.status !== "COMPLETED") {
            throw new Error("Payment capture failed");
          }

          setConfirmedAmount(Number(data.amount) > 0 ? Number(data.amount) : null);
          setConfirmedFundName(
            data.fundLabel || (data.fundType ? donationFundLabel(data.fundType) : null),
          );
          setSubmitted(true);
          return;
        }

        if (!sessionId) {
          throw new Error("Missing session ID");
        }

        const response = await fetch(donateVerifyUrl(sessionId), {
          headers: edgeFunctionHeaders(),
        });
        const data = await response.json();

        if (!response.ok || !data.verified) {
          throw new Error("Payment verification failed");
        }

        setConfirmedAmount(Number(data.amount) > 0 ? Number(data.amount) : null);
        setConfirmedFundName(data.fundLabel || null);
        setSubmitted(true);
      } catch {
        setVerifyError("We couldn't verify your donation yet. Please contact the temple before trying again.");
      } finally {
        setVerifyingPayment(false);
        setProcessing(false);
      }
    }

    void verifyDonation();
  }, [searchParams]);

  const activeFund = fundTypes.find((f) => f.slug === fundTypeSlug) ?? fundTypes[0] ?? null;
  const customFields: DonationTypeCustomField[] = activeFund?.custom_fields ?? [];
  // The form isn't a <form>, so HTML `required` never fires — enforce required
  // custom fields ourselves before allowing submit.
  const requiredFieldsMissing = customFields.some(
    (f) => f.required && !(customFieldValues[f.key] ?? "").trim(),
  );
  const amount = customAmount ? parseFloat(customAmount) : NaN;
  // Round to whole cents and cap at a sane maximum, so we never send sub-cent
  // values or overflow the DECIMAL(10,2) column / Stripe's integer limit.
  const MAX_DONATION = 100000;
  const effectiveAmount =
    !isNaN(amount) && amount > 0
      ? Math.min(Math.round(amount * 100) / 100, MAX_DONATION)
      : 0;
  const displayedAmount = confirmedAmount ?? effectiveAmount;
  const displayedFundName = confirmedFundName ?? activeFund?.name ?? "Temple Fund";

  function setCustomField(key: string, value: string) {
    setCustomFieldValues((prev) => ({ ...prev, [key]: value }));
  }

  // Synchronous guard against a same-tick double-submit (the `processing` state
  // update is async, so two fast clicks could both pass the disabled check and
  // create duplicate donation records).
  const submittingRef = useRef(false);

  // Native payment reconciliation. On native, the Stripe/PayPal redirect lands
  // inside the in-app browser overlay (not the app WebView), so the ?success
  // verify effect never fires and a paid donation would stay "pending" forever.
  // We stash the created session/order id when opening the overlay, then verify
  // it when the user returns (Browser "browserFinished").
  const nativePaymentRef = useRef<{
    provider: "stripe" | "paypal";
    id: string;
    amount: number;
    fundName: string;
  } | null>(null);

  const reconcileNativePayment = useCallback(async () => {
    const pending = nativePaymentRef.current;
    if (!pending || !pending.id) return;
    setVerifyingPayment(true);
    try {
      let ok = false;
      let amount = pending.amount;
      let fundName = pending.fundName;
      if (pending.provider === "paypal") {
        const res = await fetch(paypalCaptureUrl(), {
          method: "POST",
          headers: edgeFunctionHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify({ orderId: pending.id }),
        });
        const d = await res.json();
        ok = res.ok && d.status === "COMPLETED";
        if (ok) {
          if (Number(d.amount) > 0) amount = Number(d.amount);
          if (d.fundLabel) fundName = d.fundLabel;
        }
      } else {
        const res = await fetch(donateVerifyUrl(pending.id), {
          headers: edgeFunctionHeaders(),
        });
        const d = await res.json();
        ok = res.ok && d.verified;
        if (ok) {
          if (Number(d.amount) > 0) amount = Number(d.amount);
          if (d.fundLabel) fundName = d.fundLabel;
        }
      }
      if (ok) {
        nativePaymentRef.current = null;
        setConfirmedAmount(amount);
        setConfirmedFundName(fundName);
        setSubmitted(true);
        if (isAuthenticated) void fetchUserData();
      } else {
        // Cancelled / not completed — re-enable the form so the user can retry.
        setNativePaymentOpened(false);
      }
    } catch {
      setNativePaymentOpened(false);
    } finally {
      setVerifyingPayment(false);
      setProcessing(false);
    }
  }, [isAuthenticated, fetchUserData]);

  // Re-verify a native payment when the donor returns from the in-app browser.
  useEffect(() => {
    if (!isNative()) return;
    let cancelled = false;
    let handle: { remove: () => void } | null = null;
    void (async () => {
      const { Browser } = await import("@capacitor/browser");
      const listener = await Browser.addListener("browserFinished", () => {
        void reconcileNativePayment();
      });
      if (cancelled) listener.remove();
      else handle = listener;
    })();
    return () => {
      cancelled = true;
      handle?.remove();
    };
  }, [reconcileNativePayment]);

  const handleDonate = async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setProcessing(true);
    setError("");
    // Also clear any stale payment-verification error so it doesn't linger
    // above a fresh donation attempt.
    setVerifyError("");
    try {
      // Signed-in devotees: pass the session token so the backend can verify
      // it and link the donation to their account (dashboard history).
      const extraHeaders: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (supabase) {
        const { data } = await supabase.auth.getSession();
        if (data.session?.access_token) {
          extraHeaders["x-user-token"] = data.session.access_token;
        }
      }

      // All methods create a donation record — Zelle is recorded as a pending
      // pledge (the transfer itself happens in the donor's banking app).
      const response = await fetch(donateCreateUrl(), {
        method: "POST",
        headers: edgeFunctionHeaders(extraHeaders),
        body: JSON.stringify({
          amount: effectiveAmount,
          fundType: activeFund?.slug ?? fundTypeSlug,
          // The name field is optional in the UI, but the backend requires a
          // non-empty donorName — default so blank names don't 400 silently.
          donorName: donorName.trim() || "Anonymous",
          donorEmail: donorEmail.trim(),
          customFields: customFieldValues,
          paymentMethod,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Payment processing failed.");
        return;
      }
      if (data.url) {
        if (isNative()) {
          // In the native app, navigating window.location would load the
          // external checkout INSIDE the app's WebView and trap the user with
          // no way back. Open it in the system browser overlay instead; the
          // app stays mounted underneath. When the user returns we refresh so
          // the completed donation shows in their dashboard.
          const { Browser } = await import("@capacitor/browser");
          // Stash the created payment id so we can verify it when the donor
          // returns (browserFinished) — the redirect happens in the overlay.
          nativePaymentRef.current = {
            provider: paymentMethod === "paypal" ? "paypal" : "stripe",
            id: data.sessionId || data.orderId || "",
            amount: effectiveAmount,
            fundName:
              activeFund?.name ??
              donationFundLabel(activeFund?.slug ?? fundTypeSlug),
          };
          await Browser.open({ url: data.url });
          setNativePaymentOpened(true);
          return;
        }
        window.location.href = data.url;
        return;
      }
      setSubmitted(true);
      // Refresh dashboard data so the new (e.g. Zelle) donation shows without
      // a hard reload when the donor navigates to their dashboard.
      if (isAuthenticated) void fetchUserData();
    } catch {
      setError("Payment processing failed. Please try again.");
    } finally {
      setProcessing(false);
      submittingRef.current = false;
    }
  };

  if (submitted) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <CheckCircle className="mx-auto h-20 w-20 text-green-500" />
        <h1 className="mt-6 text-3xl font-heading font-bold text-gray-900">
          {t("donate.thankYou", locale)}
        </h1>
        <p className="mt-4 text-lg text-gray-600">
          {paymentMethod === "zelle" ? (
            <>
              Your pledge of <strong>{formatCurrency(displayedAmount)}</strong> to
              the {displayedFundName} has been recorded. Please complete it via
              Zelle to finish your donation.
            </>
          ) : (
            <>
              Your donation of <strong>{formatCurrency(displayedAmount)}</strong> to
              the {displayedFundName} has been received.
            </>
          )}
        </p>
        <div className="mt-6 rounded-lg bg-green-50 p-4 text-sm text-green-800">
          <p>
            {paymentMethod === "zelle"
              ? "Once we receive your Zelle transfer, we'll mark it complete and email your tax-deductible receipt. RNHT is a registered 501(c)(3) nonprofit organization."
              : "A tax-deductible receipt will be emailed to you. RNHT is a registered 501(c)(3) nonprofit organization."}
          </p>
          {isAuthenticated && (
            <p className="mt-2">
              Because you donated through your devotee account, your giving
              history stays connected to your profile for tax-document access.
            </p>
          )}
          {paymentMethod === "zelle" && (
            <p className="mt-2 font-semibold">
              Please send your Zelle payment of {formatCurrency(displayedAmount)}{" "}
              to {ZELLE_PHONE}
            </p>
          )}
        </div>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link href="/" className="btn-outline">
            Return Home
          </Link>
          {isAuthenticated && (
            <Link href="/dashboard?tab=donations" className="btn-outline">
              View Tax Documents
            </Link>
          )}
          <button
            className="btn-primary"
            onClick={() => {
              // Clear the previous confirmation so the next success screen
              // doesn't show a stale amount/fund.
              setSubmitted(false);
              setConfirmedAmount(null);
              setConfirmedFundName(null);
              setNativePaymentOpened(false);
              setCustomAmount("");
              setCustomFieldValues({});
            }}
          >
            Make Another Donation
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="text-center">
        <Heart className="mx-auto h-10 w-10 text-temple-red" />
        <h1 className="mt-4 section-heading">{t("donate.title", locale)}</h1>
        <p className="mt-3 text-gray-600">{t("donate.subtitle", locale)}</p>
        <p className="mt-2 text-sm font-semibold text-gray-900">
          All donations are tax-deductible under 501(c)(3).
        </p>
      </div>

      {/* Nitya Pooja Seva — featured offering card (client request).
          Image + content; no contact number; Join Now → Google Form. */}
      <section className="mt-8 overflow-hidden rounded-3xl border border-temple-gold/25 bg-gradient-to-br from-[#2A0612] to-[#3a0a1c] shadow-premium">
        <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-2 lg:items-center">
          <div className="mx-auto w-full max-w-xs lg:max-w-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/nitya-pooja-seva.jpg`}
              alt="Nitya Pooja Seva — $365 yearly offering for daily worship services"
              className="aspect-[4/3] w-full rounded-xl border border-temple-gold/30 object-cover shadow-[0_0_40px_rgba(197,151,62,0.2)]"
            />
          </div>
          <div className="text-center lg:text-left">
            <p className="font-accent text-xs font-semibold uppercase tracking-[0.28em] text-temple-gold">
              Daily Worship
            </p>
            <h2 className="mt-2 font-heading text-3xl font-bold text-white">
              Nitya Pooja Seva
            </h2>
            <p className="mt-4 font-accent text-base leading-relaxed text-gray-300">
              With the blessings of Lord Rudra Narayana, the temple offers the
              Nitya Pooja Scheme for the spiritual welfare of all devotees.
            </p>
            <ul className="mt-5 space-y-2.5 text-left">
              {[
                "Nitya Deeparadhana",
                "Shodashopachara Seva",
                "Naivedyam",
                "Pushpa Archana",
                "Rudrabhishekam",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-3 font-accent text-temple-gold-light"
                >
                  <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-temple-gold/20 text-xs text-temple-gold">
                    &#x2713;
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-7">
              <a
                href="https://docs.google.com/forms/d/e/1FAIpQLSe77eeHv8sIScrCMnSuPeMlPwU4FK00wpU65x20_E3p8g5hvA/viewform"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-8 py-3.5 text-lg font-bold text-[#2A0612]"
                style={{
                  background:
                    "linear-gradient(135deg, #C5973E 0%, #E8D5A3 40%, #C5973E 100%)",
                  borderRadius: "4px",
                  boxShadow: "0 6px 30px rgba(197,151,62,0.35)",
                }}
              >
                $365/Year &mdash; Join Now
              </a>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-8 rounded-3xl border border-temple-gold/20 bg-white/95 p-6 shadow-premium">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-temple-gold">
              Donate Your Way
            </p>
            <h2 className="mt-2 font-heading text-2xl font-bold text-temple-maroon">
              Guest donation stays open, and devotee account options are here too
            </h2>
            <p className="mt-3 text-sm leading-7 text-gray-600">
              You can continue as a guest exactly as before. If you are already
              a devotee, sign in before donating so your giving history stays
              tied to your account for future tax-document access.
            </p>
          </div>

          {isAuthenticated ? (
            <div className="w-full rounded-2xl border border-green-200 bg-green-50 p-5 text-left lg:min-w-[280px] lg:w-auto">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-green-700">
                Devotee Account Active
              </p>
              <p className="mt-2 text-sm font-semibold text-gray-900">
                {authUser?.name || authUser?.email || "Signed in"}
              </p>
              <p className="mt-2 text-sm leading-6 text-green-800">
                Donations made in this session can stay connected to your
                devotee portal for receipts and year-end tax records.
              </p>
              <Link
                href="/dashboard?tab=donations"
                className="mt-4 inline-flex items-center gap-2 rounded-full border border-green-300 px-4 py-2 text-sm font-semibold text-green-800 transition hover:bg-green-100"
              >
                <Receipt className="h-4 w-4" />
                Open My Donations
              </Link>
            </div>
          ) : (
            <div className="grid w-full gap-3 sm:min-w-[300px] sm:w-auto sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <Link
                href="/login?mode=signin"
                className="flex items-start gap-3 rounded-2xl border border-temple-gold/20 bg-temple-cream/40 p-4 transition hover:border-temple-gold hover:bg-temple-cream"
              >
                <LogIn className="mt-0.5 h-5 w-5 text-temple-maroon" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    Already a devotee?
                  </p>
                  <p className="mt-1 text-xs leading-5 text-gray-600">
                    Sign in, donate, and keep your receipts under one account.
                  </p>
                </div>
              </Link>
              <Link
                href="/login?mode=signup"
                className="flex items-start gap-3 rounded-2xl border border-temple-gold/20 bg-white p-4 transition hover:border-temple-gold hover:bg-temple-cream/30"
              >
                <UserPlus className="mt-0.5 h-5 w-5 text-temple-maroon" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    New devotee?
                  </p>
                  <p className="mt-1 text-xs leading-5 text-gray-600">
                    Create your account now, or continue with guest donation below.
                  </p>
                </div>
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-5">
        {/* Left column — form */}
        <div className="lg:col-span-3 space-y-6">
          {verifyError && (
            <div
              aria-live="polite"
              aria-atomic="true"
              className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
            >
              {verifyError}
            </div>
          )}
          {/* Fund */}
          <div className="card p-5">
            <h2 className="font-heading text-lg font-bold text-gray-900">
              Choose a Fund
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {fundTypes.map((fund) => (
                <label
                  key={fund.id}
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                    fundTypeSlug === fund.slug
                      ? "border-temple-red bg-red-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="fund"
                    checked={fundTypeSlug === fund.slug}
                    onChange={() => {
                      setFundTypeSlug(fund.slug);
                      setCustomFieldValues({});
                      setError("");
                      setVerifyError("");
                    }}
                    className="mt-1 text-temple-red"
                  />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{fund.name}</p>
                    {fund.description && (
                      <p className="text-xs text-gray-500">{fund.description}</p>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Amount */}
          <div className="card p-5">
            <h2 className="font-heading text-lg font-bold text-gray-900">Amount</h2>
            <div className="mt-4">
              <label
                htmlFor="donation-amount"
                className="block text-sm font-medium text-gray-700"
              >
                Enter amount (USD)
              </label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  $
                </span>
                <input
                  id="donation-amount"
                  type="number"
                  inputMode="decimal"
                  min="1"
                  max="100000"
                  step="0.01"
                  placeholder="Enter any amount"
                  className="input-field pl-7"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                />
              </div>
              {!isNaN(amount) && amount > MAX_DONATION && (
                <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800">
                  The maximum online donation is{" "}
                  {formatCurrency(MAX_DONATION)}. Your donation will be capped at
                  this amount — please contact the temple to give more.
                </p>
              )}
            </div>
          </div>

          {/* Donor info */}
          <div className="card p-5">
            <h2 className="font-heading text-lg font-bold text-gray-900">
              Your Information
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              {isAuthenticated
                ? "Signed-in devotees can keep receipts and tax records aligned with their account."
                : "Guest donations are welcome. If you sign in first, your donation history can stay tied to your devotee account."}
            </p>
            <div className="mt-4 space-y-4">
              <div>
                <label
                  htmlFor="donor-email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  id="donor-email"
                  type="email"
                  className="input-field mt-1"
                  value={donorEmail}
                  onChange={(e) => setDonorEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  Required — your receipt will be sent here.
                </p>
              </div>
              <div>
                <label
                  htmlFor="donor-name"
                  className="block text-sm font-medium text-gray-700"
                >
                  Full Name
                </label>
                <input
                  id="donor-name"
                  type="text"
                  className="input-field mt-1"
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                  placeholder="Your name (optional)"
                />
              </div>
              {customFields.map((field) => (
                <div key={field.key}>
                  <label
                    htmlFor={`custom-field-${field.key}`}
                    className="block text-sm font-medium text-gray-700"
                  >
                    {field.label}
                    {field.required && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    id={`custom-field-${field.key}`}
                    type={field.type === "number" ? "number" : "text"}
                    className="input-field mt-1"
                    value={customFieldValues[field.key] ?? ""}
                    onChange={(e) => setCustomField(field.key, e.target.value)}
                    required={field.required}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column — payment */}
        <div className="lg:col-span-2">
          <div className="card sticky top-[calc(var(--header-h,96px)+8px)] p-5">
            <h2 className="font-heading text-lg font-bold text-gray-900">Payment</h2>

            <div className="mt-4 rounded-lg bg-temple-cream p-4 text-center">
              <p className="text-sm text-gray-600">Your Donation</p>
              <p className="text-3xl font-bold text-temple-red">
                {formatCurrency(effectiveAmount)}
              </p>
              <p className="text-xs text-gray-500">{activeFund?.name}</p>
            </div>

            <div className="mt-4 space-y-3">
              <PaymentRadio
                id="stripe"
                label="Card / Apple Pay"
                icon={<CreditCard className="h-5 w-5 text-gray-600" />}
                current={paymentMethod}
                onChange={setPaymentMethod}
              />
              <PaymentRadio
                id="paypal"
                label="PayPal"
                icon={<span className="text-sm font-bold text-blue-600">P</span>}
                current={paymentMethod}
                onChange={setPaymentMethod}
              />
              <PaymentRadio
                id="zelle"
                label="Zelle"
                icon={<span className="text-lg">💸</span>}
                current={paymentMethod}
                onChange={setPaymentMethod}
              />
            </div>

            {paymentMethod === "zelle" && (
              <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
                <p>
                  <strong>Phone:</strong> {ZELLE_PHONE}
                </p>
                <p>
                  <strong>Name:</strong> Rudra Narayana Hindu Temple
                </p>
              </div>
            )}

            {error && (
              <div
                aria-live="polite"
                aria-atomic="true"
                className="mt-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-800"
              >
                {error}
              </div>
            )}

            {nativePaymentOpened && (
              <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
                Your secure payment page has opened in the browser. After you
                finish paying, return to the app — your donation will appear in
                your dashboard once confirmed.
              </div>
            )}

            <button
              className="btn-primary mt-6 w-full"
              onClick={handleDonate}
              disabled={
                !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(donorEmail.trim()) ||
                effectiveAmount <= 0 ||
                requiredFieldsMissing ||
                processing ||
                verifyingPayment ||
                // Stay disabled after the native payment overlay opens until the
                // donor returns (reconcile clears it on cancel / shows success).
                nativePaymentOpened
              }
            >
              {processing
                ? verifyingPayment
                  ? "Verifying donation..."
                  : "Processing..."
                : `Donate ${formatCurrency(effectiveAmount)}`}
            </button>

            <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
              <ShieldCheck className="h-4 w-4 text-green-600" />
              <span>Secure & tax-deductible. 501(c)(3) nonprofit.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Donate via Zelle — moved from the (removed) Contact page */}
      <div className="mt-8 rounded-2xl border border-temple-gold/20 bg-temple-cream/50 p-6">
        <h3 className="font-heading text-lg font-bold text-gray-900">
          Donate via Zelle
        </h3>
        <p className="mt-2 text-sm text-gray-600">
          Send donations directly via Zelle to:{" "}
          <strong className="text-temple-maroon">{ZELLE_PHONE}</strong>
        </p>
      </div>
    </div>
  );
}

function PaymentRadio({
  id,
  label,
  icon,
  current,
  onChange,
}: {
  id: "stripe" | "paypal" | "zelle";
  label: string;
  icon: React.ReactNode;
  current: string;
  onChange: (v: "stripe" | "paypal" | "zelle") => void;
}) {
  const active = current === id;
  return (
    <label
      className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
        active ? "border-temple-red bg-red-50" : "border-gray-200"
      }`}
    >
      <input
        type="radio"
        name="donatePayment"
        checked={active}
        onChange={() => onChange(id)}
      />
      {icon}
      <span className="text-sm font-medium">{label}</span>
    </label>
  );
}
