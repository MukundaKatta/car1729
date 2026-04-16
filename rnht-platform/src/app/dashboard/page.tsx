"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuthStore } from "@/store/auth";
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

/** Normalize to E.164. Same behaviour as login page. */
function normalizePhone(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return null;
  const e164 = hasPlus ? `+${digits}` : `+1${digits}`;
  if (!/^\+\d{8,15}$/.test(e164)) return null;
  return e164;
}

/* ─── Login Form (shown when not authenticated) ─── */
function LoginForm() {
  const { sendOtp, verifyOtp, sendPhoneOtp, verifyPhoneOtp } = useAuthStore();
  const [method, setMethod] = useState<"phone" | "email">("phone");
  const [step, setStep] = useState<"form" | "otp">("form");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [normalizedPhone, setNormalizedPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError("");
    if (method === "email") {
      if (!email.trim()) {
        setLoading(false);
        return;
      }
      const result = await sendOtp(email, name);
      setLoading(false);
      if (result.error) setError(result.error);
      else setStep("otp");
    } else {
      const e164 = normalizePhone(phone);
      if (!e164) {
        setLoading(false);
        setError("Please enter a valid phone number.");
        return;
      }
      setNormalizedPhone(e164);
      const result = await sendPhoneOtp(e164, name);
      setLoading(false);
      if (result.error) setError(result.error);
      else setStep("otp");
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 6) return;
    setLoading(true);
    setError("");
    const result = method === "email"
      ? await verifyOtp(email, otp)
      : await verifyPhoneOtp(normalizedPhone, otp);
    setLoading(false);
    if (result.error) {
      setError(result.error);
    }
    // On success, auth state change listener in the store handles the rest
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
            Sign in or create your devotee account to manage services, donations &amp; more
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
              <div className="rounded-xl border border-temple-gold/20 bg-temple-cream/40 px-4 py-3 text-sm text-gray-700">
                First-time devotees can create their portal account here with a one-time code.
              </div>
              <div className="flex rounded-lg border border-gray-200 p-1">
                <button
                  type="button"
                  onClick={() => setMethod("phone")}
                  className={`flex-1 rounded-md py-2 text-sm font-semibold transition-colors ${
                    method === "phone"
                      ? "bg-temple-maroon text-white"
                      : "text-gray-600 hover:text-temple-maroon"
                  }`}
                >
                  Phone
                </button>
                <button
                  type="button"
                  onClick={() => setMethod("email")}
                  className={`flex-1 rounded-md py-2 text-sm font-semibold transition-colors ${
                    method === "email"
                      ? "bg-temple-maroon text-white"
                      : "text-gray-600 hover:text-temple-maroon"
                  }`}
                >
                  Email
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field"
                  placeholder="Enter your name"
                  required
                />
              </div>
              {method === "email" ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Email Address
                  </label>
                  <input
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
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Phone Number
                  </label>
                  <input
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
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full"
              >
                {loading
                  ? "Sending Code..."
                  : method === "email"
                    ? "Continue with Email"
                    : "Continue with Phone"}
              </button>
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
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <p className="text-sm text-gray-600 text-center font-accent">
                We sent a verification code to{" "}
                <strong>{method === "email" ? email : normalizedPhone}</strong>
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Enter OTP
                </label>
                <input
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
                {loading ? "Verifying..." : "Verify & Continue"}
              </button>
              <button
                type="button"
                onClick={() => setStep("form")}
                className="w-full text-sm text-gray-500 hover:text-temple-red transition-colors"
              >
                {method === "email" ? "Use a different email" : "Use a different number"}
              </button>
            </form>
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
  const totalDonated = donations.reduce((s, d) => s + d.amount, 0);
  const totalBookings = bookings.length;
  const upcomingBookings = bookings.filter((b) => b.status === "confirmed" || b.status === "pending");
  const recurringDonations = donations.filter((d) => d.recurring);

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div className="card p-8 bg-gradient-to-r from-temple-maroon-deep to-temple-maroon text-white">
        <h2 className="font-heading text-2xl font-bold">
          Namaste, {user?.name?.split(" ")[0]}!
        </h2>
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
          { label: "Total Donated", value: `$${totalDonated}`, icon: DollarSign, color: "text-green-600 bg-green-50" },
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
                {a.amount && <p className="text-sm font-semibold text-gray-900">${a.amount}</p>}
                <p className="text-xs text-gray-400">{a.date}</p>
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
              <p className="text-lg font-heading font-bold text-temple-maroon shrink-0">${b.amount}</p>
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
  const { donations } = useAuthStore();
  const addDonation = useAuthStore((s) => s.addDonation);
  const [showQuickDonate, setShowQuickDonate] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState(51);
  const [selectedFund, setSelectedFund] = useState("General Temple Fund");

  const totalDonated = donations.reduce((s, d) => s + d.amount, 0);
  const recurringTotal = donations.filter((d) => d.recurring).reduce((s, d) => s + d.amount, 0);

  const handleQuickDonate = () => {
    // Redirect to donate page with pre-selected fund and amount
    // instead of creating a donation record without payment
    window.location.href = `/donate?fund=${encodeURIComponent(selectedFund)}&amount=${selectedAmount}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-xl font-bold text-temple-maroon">My Donations</h2>
        <button onClick={() => setShowQuickDonate(!showQuickDonate)} className="btn-primary text-sm px-5 py-2.5">
          <Heart className="mr-2 h-4 w-4" />
          Donate Now
        </button>
      </div>

      {/* Quick Donate Panel */}
      {showQuickDonate && (
        <div className="card p-6 border-temple-gold/20 bg-temple-cream/30">
          <h3 className="font-heading font-bold text-temple-maroon mb-4">Quick Donation</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Fund</label>
              <div className="flex flex-wrap gap-2">
                {["General Temple Fund", "Annadanam Fund", "Priest Fund", "Building Fund", "Education Fund"].map((f) => (
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
          <p className="mt-2 font-heading text-2xl font-bold text-temple-maroon">${totalDonated}</p>
          <p className="text-sm text-gray-500 font-accent">Total Donated</p>
        </div>
        <div className="card p-5 text-center">
          <RefreshCw className="mx-auto h-6 w-6 text-purple-600" />
          <p className="mt-2 font-heading text-2xl font-bold text-temple-maroon">${recurringTotal}/mo</p>
          <p className="text-sm text-gray-500 font-accent">Recurring</p>
        </div>
        <div className="card p-5 text-center">
          <Receipt className="mx-auto h-6 w-6 text-blue-600" />
          <p className="mt-2 font-heading text-2xl font-bold text-temple-maroon">{donations.length}</p>
          <p className="text-sm text-gray-500 font-accent">Tax Receipts</p>
        </div>
      </div>

      {/* Donation History */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-heading font-bold text-gray-900">Donation History</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {donations.map((d) => (
            <div key={d.id} className="flex items-center gap-4 px-6 py-4 hover:bg-temple-ivory/50 transition-colors">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                d.recurring ? "bg-purple-50 text-purple-600" : "bg-green-50 text-green-600"
              }`}>
                {d.recurring ? <RefreshCw className="h-4 w-4" /> : <Heart className="h-4 w-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm">{d.fund}</p>
                <p className="text-xs text-gray-500">
                  {d.date} &middot; {d.method}
                  {d.recurring && ` &middot; ${d.frequency}`}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-heading font-bold text-temple-maroon">${d.amount}</p>
                <p className="text-xs text-gray-400">{d.receiptId}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="text-center text-xs text-gray-400 font-accent">
        All donations to RNHT are tax-deductible under 501(c)(3). Receipts are available for download.
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
    await updateProfile(form);
    setEditing(false);
  };

  const handleAddMember = () => {
    if (!newMember.name.trim() || !newMember.relationship.trim()) return;
    addFamilyMember({
      id: "fm-" + Date.now(),
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

      {/* Personal Info */}
      <div className="card p-6">
        <h3 className="font-heading font-bold text-gray-900 mb-5">Personal Information</h3>
        <div className="grid gap-5 sm:grid-cols-2">
          {[
            { label: "Full Name", key: "name" as const, icon: User },
            { label: "Email", key: "email" as const, icon: Mail },
            { label: "Phone", key: "phone" as const, icon: Phone },
            { label: "Address", key: "address" as const, icon: MapPin },
            { label: "City", key: "city" as const, icon: MapPin },
            { label: "State", key: "state" as const, icon: MapPin },
          ].map((field) => (
            <div key={field.key}>
              <label className="block text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
                <field.icon className="h-3 w-3" />
                {field.label}
              </label>
              {editing ? (
                <input
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
              <label className="block text-xs font-medium text-gray-500 mb-1">
                <Star className="inline h-3 w-3 mr-1" />
                {field.label}
              </label>
              {editing ? (
                <input
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
                value={newMember.name}
                onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                className="input-field"
              />
              <input
                type="text"
                placeholder="Relationship (e.g. Spouse)"
                value={newMember.relationship}
                onChange={(e) => setNewMember({ ...newMember, relationship: e.target.value })}
                className="input-field"
              />
              <input
                type="text"
                placeholder="Gotra (optional)"
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
                  <p className="text-xs text-gray-500">{m.relationship}{m.gotra ? ` &middot; ${m.gotra} Gotra` : ""}</p>
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
    </div>
  );
}

/* ─── Main Dashboard Page ─── */
export default function DashboardPage() {
  const { isAuthenticated, initialized, initialize } = useAuthStore();
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  useEffect(() => {
    initialize();
  }, [initialize]);

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
        <div className="flex gap-1 rounded-2xl bg-white p-1.5 shadow-premium mb-8 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
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
        {activeTab === "overview" && <OverviewTab />}
        {activeTab === "bookings" && <BookingsTab />}
        {activeTab === "donations" && <DonationsTab />}
        {activeTab === "profile" && <ProfileTab />}
      </div>
    </div>
  );
}
