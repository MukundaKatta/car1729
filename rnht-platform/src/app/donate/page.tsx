"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  Heart,
  CreditCard,
  ShieldCheck,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { useLanguageStore } from "@/store/language";
import { t } from "@/lib/i18n/translations";
import { supabase } from "@/lib/supabase";
import type { DonationType, DonationTypeCustomField } from "@/types/database";
import { useAuthStore } from "@/store/auth";

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

export default function DonatePage() {
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
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [error, setError] = useState("");
  const [confirmedAmount, setConfirmedAmount] = useState<number | null>(null);
  const [confirmedFundName, setConfirmedFundName] = useState<string | null>(null);
  const locale = useLanguageStore((s) => s.locale);
  const searchParams = useSearchParams();
  const authUser = useAuthStore((s) => s.user);

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

  // Prefill donor email / name from the logged-in user.
  useEffect(() => {
    if (authUser) {
      if (!donorEmail) setDonorEmail(authUser.email);
      if (!donorName) setDonorName(authUser.name);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser]);

  // Handle return from Stripe or PayPal
  useEffect(() => {
    if (searchParams.get("success") !== "true") return;

    const token = searchParams.get("token");
    const provider = searchParams.get("provider");
    const sessionId = searchParams.get("session_id");
    let cancelled = false;

    async function verifyDonation() {
      setVerifyingPayment(true);
      setProcessing(true);
      setError("");

      try {
        if (token && provider === "paypal") {
          const response = await fetch("/api/webhooks/paypal", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId: token }),
          });
          const data = await response.json();

          if (!response.ok || data.status !== "COMPLETED") {
            throw new Error("Payment capture failed");
          }

          if (cancelled) return;

          setConfirmedAmount(typeof data.amount === "number" ? data.amount : null);
          setConfirmedFundName(data.fundType ? donationFundLabel(data.fundType) : null);
          setSubmitted(true);
          return;
        }

        if (!sessionId) {
          throw new Error("Missing session ID");
        }

        const response = await fetch(`/api/donate?session_id=${encodeURIComponent(sessionId)}`);
        const data = await response.json();

        if (!response.ok || !data.verified) {
          throw new Error("Payment verification failed");
        }

        if (cancelled) return;

        setConfirmedAmount(typeof data.amount === "number" ? data.amount : null);
        setConfirmedFundName(data.fundLabel || null);
        setSubmitted(true);
      } catch {
        if (!cancelled) {
          setError("We couldn't verify your donation yet. Please contact the temple before trying again.");
        }
      } finally {
        if (!cancelled) {
          setVerifyingPayment(false);
          setProcessing(false);
        }
      }
    }

    void verifyDonation();

    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  const activeFund = fundTypes.find((f) => f.slug === fundTypeSlug) ?? fundTypes[0] ?? null;
  const customFields: DonationTypeCustomField[] = activeFund?.custom_fields ?? [];
  const amount = customAmount ? parseFloat(customAmount) : NaN;
  const effectiveAmount = !isNaN(amount) && amount > 0 ? amount : 0;
  const displayedAmount = confirmedAmount ?? effectiveAmount;
  const displayedFundName = confirmedFundName ?? activeFund?.name ?? "Temple Fund";

  function setCustomField(key: string, value: string) {
    setCustomFieldValues((prev) => ({ ...prev, [key]: value }));
  }

  const handleDonate = async () => {
    setProcessing(true);
    setError("");
    try {
      if (paymentMethod === "stripe" || paymentMethod === "paypal") {
        const response = await fetch("/api/donate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: effectiveAmount,
            fundType: activeFund?.slug ?? fundTypeSlug,
            donorName,
            donorEmail,
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
          window.location.href = data.url;
          return;
        }
      }
      setSubmitted(true);
    } catch {
      setError("Payment processing failed. Please try again.");
    } finally {
      setProcessing(false);
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
          Your donation of <strong>{formatCurrency(displayedAmount)}</strong> to
          the {displayedFundName} has been received.
        </p>
        <div className="mt-6 rounded-lg bg-green-50 p-4 text-sm text-green-800">
          <p>
            A tax-deductible receipt will be emailed to you. RNHT is a
            registered 501(c)(3) nonprofit organization.
          </p>
          {paymentMethod === "zelle" && (
            <p className="mt-2 font-semibold">
              Please send your Zelle payment of {formatCurrency(displayedAmount)}{" "}
              to (512) 545-0473
            </p>
          )}
        </div>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link href="/" className="btn-outline">
            Return Home
          </Link>
          <button className="btn-primary" onClick={() => setSubmitted(false)}>
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
        <p className="mt-2 text-sm text-gray-500">
          All donations are tax-deductible under 501(c)(3).
        </p>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-5">
        {/* Left column — form */}
        <div className="lg:col-span-3 space-y-6">
          {error && searchParams.get("success") === "true" && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              {error}
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
              <label className="block text-sm font-medium text-gray-700">
                Enter amount (USD)
              </label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  $
                </span>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  placeholder="Enter any amount"
                  className="input-field pl-7"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Donor info */}
          <div className="card p-5">
            <h2 className="font-heading text-lg font-bold text-gray-900">
              Your Information
            </h2>
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
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
                <label className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <input
                  type="text"
                  className="input-field mt-1"
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                  placeholder="Your name (optional)"
                />
              </div>
              {customFields.map((field) => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-gray-700">
                    {field.label}
                    {field.required && <span className="text-red-500">*</span>}
                  </label>
                  <input
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
                  <strong>Phone:</strong> (512) 545-0473
                </p>
                <p>
                  <strong>Name:</strong> Rudra Narayana Hindu Temple
                </p>
              </div>
            )}

            {error && (
              <div className="mt-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-800">
                {error}
              </div>
            )}

            <button
              className="btn-primary mt-6 w-full"
              onClick={handleDonate}
              disabled={
                !donorEmail ||
                !donorEmail.includes("@") ||
                effectiveAmount <= 0 ||
                processing ||
                verifyingPayment
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
