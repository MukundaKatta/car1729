"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  User,
  Users,
  Calendar,
  Heart,
  Star,
  Bell,
  Settings,
  Plus,
  Trash2,
  Download,
  BookOpen,
  Clock,
  Loader2,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useAuthStore } from "@/store/auth";
import { supabase } from "@/lib/supabase";
import { deleteAccountUrl, edgeFunctionHeaders } from "@/lib/edge-functions";
import { pushOverlay } from "@/lib/overlay-stack";

type Tab = "profile" | "family" | "bookings" | "donations" | "preferences";

const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "profile", label: "My Profile", icon: User },
  { id: "family", label: "Family", icon: Users },
  { id: "bookings", label: "Bookings", icon: Calendar },
  { id: "donations", label: "Donations", icon: Heart },
  { id: "preferences", label: "Preferences", icon: Settings },
];

const nakshatras = [
  "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra",
  "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni",
  "Uttara Phalguni", "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha",
  "Jyeshtha", "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana",
  "Dhanishtha", "Shatabhisha", "Purva Bhadrapada", "Uttara Bhadrapada", "Revati",
];

const rashis = [
  "Mesha (Aries)", "Vrishabha (Taurus)", "Mithuna (Gemini)",
  "Karka (Cancer)", "Simha (Leo)", "Kanya (Virgo)",
  "Tula (Libra)", "Vrischika (Scorpio)", "Dhanu (Sagittarius)",
  "Makara (Capricorn)", "Kumbha (Aquarius)", "Meena (Pisces)",
];

type FamilyMember = {
  id: string;
  name: string;
  relationship: string;
  gotra: string;
  nakshatra: string;
  rashi: string;
  dob: string;
};

export default function ProfilePage() {
  const router = useRouter();
  const {
    isAuthenticated,
    initialized,
    initialize,
    logout,
    user,
    bookings: storeBookings,
    donations: storeDonations,
    updateProfile,
    addFamilyMember,
    removeFamilyMember,
  } = useAuthStore();
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // Android back button: close the delete-confirm dialog instead of navigating.
  useEffect(() => {
    if (!showDeleteConfirm) return;
    return pushOverlay(() => setShowDeleteConfirm(false));
  }, [showDeleteConfirm]);

  const handleDeleteAccount = async () => {
    setDeleting(true);
    setDeleteError("");
    try {
      const token = supabase
        ? (await supabase.auth.getSession()).data.session?.access_token
        : undefined;
      if (!token) {
        setDeleteError("Your session has expired. Please sign in again.");
        setDeleting(false);
        return;
      }
      const res = await fetch(deleteAccountUrl(), {
        method: "POST",
        headers: edgeFunctionHeaders({ "Content-Type": "application/json", "x-user-token": token }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setDeleteError(data.error || "Could not delete your account. Please try again.");
        setDeleting(false);
        return;
      }
      await logout();
      router.push("/");
    } catch {
      setDeleteError("Could not delete your account. Please try again.");
      setDeleting(false);
    }
  };

  // Allow deep-linking to a specific tab (e.g. /profile?tab=preferences from the
  // dashboard "delete account" link, so account deletion is reachable directly).
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get("tab") as Tab | null;
  const initialTab: Tab = tabs.some((t) => t.id === requestedTab)
    ? (requestedTab as Tab)
    : "profile";
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [showAddFamily, setShowAddFamily] = useState(false);
  const [newMember, setNewMember] = useState({ name: "", relationship: "", gotra: "", nakshatra: "", rashi: "", dob: "" });
  const [bookingFilter, setBookingFilter] = useState<"all" | "upcoming" | "completed">("all");

  // Profile form controlled state
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formGotra, setFormGotra] = useState("");
  const [formNakshatra, setFormNakshatra] = useState("");
  const [formRashi, setFormRashi] = useState("");
  const [saving, setSaving] = useState(false);

  // Initialize auth on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Auth guard: redirect if not authenticated once initialized
  useEffect(() => {
    if (initialized && !isAuthenticated) {
      router.push("/login");
    }
  }, [initialized, isAuthenticated, router]);

  // Sync form fields when user data loads
  useEffect(() => {
    if (user) {
      setFormName(user.name || "");
      setFormEmail(user.email || "");
      setFormPhone(user.phone || "");
      setFormAddress(user.address || "");
      setFormGotra(user.gotra || "");
      setFormNakshatra(user.nakshatra || "");
      setFormRashi(user.rashi || "");
    }
  }, [user]);

  // Sync family members from store
  useEffect(() => {
    if (user?.familyMembers) {
      setFamilyMembers(
        user.familyMembers.map((fm) => ({
          id: fm.id,
          name: fm.name,
          relationship: fm.relationship,
          gotra: fm.gotra || "",
          nakshatra: fm.nakshatra || "",
          rashi: fm.rashi || "",
          dob: fm.dob || "",
        }))
      );
    }
  }, [user?.familyMembers]);

  // Show loading spinner while initializing
  if (!initialized) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-temple-red" />
      </div>
    );
  }

  // Not authenticated: show a brief redirect message while the effect
  // above pushes the user to /login. Beats a blank page if the redirect
  // is slow or the auth backend is unreachable.
  if (!isAuthenticated) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-temple-red" />
        <p className="mt-4 text-sm text-gray-600">
          Redirecting to sign in&hellip;
        </p>
        <Link
          href="/login"
          className="mt-4 text-sm font-semibold text-temple-red hover:underline"
        >
          Go to sign in now
        </Link>
      </div>
    );
  }

  const handleSignOut = async () => {
    await logout();
    router.push("/login");
  };

  const handleSaveProfile = async () => {
    // Validate before writing so malformed contact details aren't persisted.
    if (!formName.trim()) {
      setSaveError("Please enter your name.");
      return;
    }
    if (formEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formEmail.trim())) {
      setSaveError("Please enter a valid email address.");
      return;
    }
    if (formPhone.trim() && formPhone.replace(/\D/g, "").length < 10) {
      setSaveError("Please enter a valid phone number.");
      return;
    }
    setSaving(true);
    setSaveError("");
    setSaveSuccess(false);
    const result = await updateProfile({
      name: formName.trim(),
      email: formEmail.trim(),
      phone: formPhone.trim(),
      address: formAddress,
      gotra: formGotra,
      nakshatra: formNakshatra,
      rashi: formRashi,
    });
    setSaving(false);
    if (result?.error) {
      setSaveError(result.error);
    } else {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  const handleAddFamilyMember = () => {
    // Trim so a whitespace-only name can't create a blank-titled card.
    if (!newMember.name.trim() || !newMember.relationship.trim()) return;
    const member: FamilyMember = {
      // UUID, not a millisecond timestamp — two quick adds in the same ms would
      // otherwise collide and a single remove would delete both.
      id: `fm-${crypto.randomUUID()}`,
      ...newMember,
      name: newMember.name.trim(),
      relationship: newMember.relationship.trim(),
    };
    // Persist to store (which syncs to Supabase)
    addFamilyMember(member);
    setNewMember({ name: "", relationship: "", gotra: "", nakshatra: "", rashi: "", dob: "" });
    setShowAddFamily(false);
  };

  const handleDeleteFamilyMember = (id: string) => {
    removeFamilyMember(id);
  };

  // Derive bookings from store data, falling back to empty array
  const bookings = storeBookings.map((b) => ({
    id: b.id,
    service: b.serviceName,
    date: b.date,
    time: b.time,
    status: b.status,
    amount: b.amount,
    priest: b.priest || "",
    location: b.location,
  }));

  const donations = storeDonations.map((d) => ({
    id: d.id,
    fund: d.fund,
    date: d.date,
    amount: d.amount,
    method: d.method,
    recurring: d.recurring,
    status: d.status,
  }));

  const filteredBookings = bookings.filter((b) => {
    if (bookingFilter === "all") return true;
    if (bookingFilter === "upcoming") return b.status === "confirmed" || b.status === "pending";
    return b.status === "completed";
  });

  // Only completed gifts count toward the giving total — matches the dashboard
  // (a pending Zelle pledge or unverified card payment must not inflate it).
  const totalDonated = donations
    .filter((d) => d.status === "completed" || d.status === undefined)
    .reduce((s, d) => s + d.amount, 0);

  // Derive initials from user name
  const initials = (user?.name || "")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "??";

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Profile Header */}
      <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-temple-red text-3xl font-heading font-bold text-white">
          {initials}
        </div>
        <div className="flex-1">
          <h1 className="font-heading text-2xl font-bold text-gray-900">
            {user?.name || "Devotee"}
          </h1>
          <p className="text-gray-600">
            {user?.email || ""}{user?.phone ? ` | ${user.phone}` : ""}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {user?.gotra && (
              <span className="inline-flex items-center gap-1 rounded-full bg-temple-cream px-3 py-1 text-xs font-medium text-temple-maroon">
                <Star className="h-3 w-3" /> Gotra: {user.gotra}
              </span>
            )}
            {user?.nakshatra && (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                Nakshatra: {user.nakshatra}
              </span>
            )}
            {user?.rashi && (
              <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700">
                Rashi: {user.rashi}
              </span>
            )}
          </div>
        </div>
        <button onClick={handleSignOut} className="btn-outline text-sm">
          Sign Out
        </button>
      </div>

      {/* Quick Stats (Seva Points removed — it had no data source and always
          showed 0, which read as broken). */}
      <div className="mt-8 grid grid-cols-3 gap-4">
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-temple-red">{bookings.length}</p>
          <p className="text-xs text-gray-500">Total Bookings</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{formatCurrency(totalDonated)}</p>
          <p className="text-xs text-gray-500">Total Donated</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{familyMembers.length}</p>
          <p className="text-xs text-gray-500">Family Members</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-8 flex gap-1 overflow-x-auto rounded-xl border border-gray-200 bg-gray-50 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-white text-temple-red shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div className="card p-6">
            <h2 className="font-heading text-lg font-bold text-gray-900">
              Personal Details
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="profile-name" className="block text-sm font-medium text-gray-700">Full Name</label>
                <input id="profile-name" type="text" autoComplete="name" className="input-field mt-1" value={formName} onChange={(e) => setFormName(e.target.value)} />
              </div>
              <div>
                <label htmlFor="profile-email" className="block text-sm font-medium text-gray-700">Email</label>
                <input id="profile-email" type="email" autoComplete="email" className="input-field mt-1" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} />
              </div>
              <div>
                <label htmlFor="profile-phone" className="block text-sm font-medium text-gray-700">Phone</label>
                <input id="profile-phone" type="tel" autoComplete="tel" className="input-field mt-1" value={formPhone} onChange={(e) => setFormPhone(e.target.value)} />
              </div>
              <div>
                <label htmlFor="profile-address" className="block text-sm font-medium text-gray-700">Address</label>
                <input id="profile-address" type="text" autoComplete="street-address" className="input-field mt-1" value={formAddress} onChange={(e) => setFormAddress(e.target.value)} />
              </div>
              <div>
                <label htmlFor="profile-gotra" className="block text-sm font-medium text-gray-700">Gotra</label>
                <input id="profile-gotra" type="text" className="input-field mt-1" value={formGotra} onChange={(e) => setFormGotra(e.target.value)} />
              </div>
              <div>
                <label htmlFor="profile-nakshatra" className="block text-sm font-medium text-gray-700">Nakshatra</label>
                <select id="profile-nakshatra" className="input-field mt-1" value={formNakshatra} onChange={(e) => setFormNakshatra(e.target.value)}>
                  <option value="">Select...</option>
                  {nakshatras.map((n) => (<option key={n} value={n}>{n}</option>))}
                </select>
              </div>
              <div>
                <label htmlFor="profile-rashi" className="block text-sm font-medium text-gray-700">Rashi</label>
                <select id="profile-rashi" className="input-field mt-1" value={formRashi} onChange={(e) => setFormRashi(e.target.value)}>
                  <option value="">Select...</option>
                  {rashis.map((r) => (<option key={r} value={r}>{r}</option>))}
                </select>
              </div>
            </div>
            <div className="mt-6">
              <button className="btn-primary" onClick={handleSaveProfile} disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </button>
              {saveError && (
                <p className="mt-3 text-sm text-red-600">{saveError}</p>
              )}
              {saveSuccess && (
                <p className="mt-3 text-sm text-green-600">Profile saved successfully!</p>
              )}
            </div>
          </div>
        )}

        {/* Family Tab */}
        {activeTab === "family" && (
          <div className="space-y-4">
            <h2 className="font-heading text-lg font-bold text-gray-900">Family</h2>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Add family members for quick Sankalp during pooja bookings.
              </p>
              <button className="btn-primary flex items-center gap-2 text-sm" onClick={() => setShowAddFamily(true)}>
                <Plus className="h-4 w-4" /> Add Member
              </button>
            </div>
            {familyMembers.map((member) => (
              <div key={member.id} className="card p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{member.name}</h3>
                    <p className="text-sm text-gray-500">{member.relationship}</p>
                  </div>
                  <button onClick={() => handleDeleteFamilyMember(member.id)} className="rounded p-1 text-gray-400 hover:text-red-500">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                  <div><span className="text-gray-500">Gotra:</span> <span className="font-medium">{member.gotra}</span></div>
                  <div><span className="text-gray-500">Nakshatra:</span> <span className="font-medium">{member.nakshatra}</span></div>
                  <div><span className="text-gray-500">Rashi:</span> <span className="font-medium">{member.rashi}</span></div>
                  <div><span className="text-gray-500">DOB:</span> <span className="font-medium">{member.dob}</span></div>
                </div>
              </div>
            ))}
            {/* Spiritual Milestones */}
            <div className="card p-5">
              <h3 className="font-heading text-lg font-bold text-gray-900">
                Family Spiritual Dashboard
              </h3>
              <p className="mt-1 text-sm text-gray-500">Track spiritual milestones for your family</p>
              <div className="mt-4 space-y-3">
                {familyMembers.length > 0 ? (
                  <div className="flex items-center gap-3 rounded-lg bg-amber-50 p-3">
                    <Clock className="h-5 w-5 text-amber-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-amber-900">Spiritual milestones</p>
                      <p className="text-xs text-amber-700">Consult with a priest for upcoming ceremonies</p>
                    </div>
                    <Link href="/services?category=astrology-vastu" className="text-xs font-semibold text-temple-red hover:underline">Book</Link>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
                    <Calendar className="h-5 w-5 text-gray-500" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Add family members to track milestones</p>
                      <p className="text-xs text-gray-500">Spiritual milestones will appear here</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            {showAddFamily && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-label="Add Family Member" onClick={() => setShowAddFamily(false)}>
                <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                  <h3 className="font-heading text-lg font-bold">Add Family Member</h3>
                  <div className="mt-4 space-y-3">
                    <input type="text" className="input-field" placeholder="Full Name" aria-label="Full Name" value={newMember.name} onChange={(e) => setNewMember((p) => ({ ...p, name: e.target.value }))} />
                    <select className="input-field" aria-label="Relationship" value={newMember.relationship} onChange={(e) => setNewMember((p) => ({ ...p, relationship: e.target.value }))}>
                      <option value="">Relationship</option>
                      <option>Spouse</option><option>Son</option><option>Daughter</option>
                      <option>Father</option><option>Mother</option><option>Other</option>
                    </select>
                    <input type="text" className="input-field" placeholder="Gotra" aria-label="Gotra" value={newMember.gotra} onChange={(e) => setNewMember((p) => ({ ...p, gotra: e.target.value }))} />
                    <select className="input-field" aria-label="Nakshatra" value={newMember.nakshatra} onChange={(e) => setNewMember((p) => ({ ...p, nakshatra: e.target.value }))}>
                      <option value="">Nakshatra</option>
                      {nakshatras.map((n) => (<option key={n} value={n}>{n}</option>))}
                    </select>
                    <select className="input-field" aria-label="Rashi" value={newMember.rashi} onChange={(e) => setNewMember((p) => ({ ...p, rashi: e.target.value }))}>
                      <option value="">Rashi</option>
                      {rashis.map((r) => (<option key={r} value={r}>{r}</option>))}
                    </select>
                    <input type="date" className="input-field" aria-label="Date of Birth" value={newMember.dob} onChange={(e) => setNewMember((p) => ({ ...p, dob: e.target.value }))} />
                  </div>
                  <div className="mt-6 flex justify-end gap-3">
                    <button className="btn-outline" onClick={() => setShowAddFamily(false)}>Cancel</button>
                    <button className="btn-primary" onClick={handleAddFamilyMember} disabled={!newMember.name || !newMember.relationship}>Add Member</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Bookings Tab */}
        {activeTab === "bookings" && (
          <div className="space-y-4">
            <h2 className="font-heading text-lg font-bold text-gray-900">Bookings</h2>
            <div className="flex flex-wrap gap-2">
              {(["all", "upcoming", "completed"] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setBookingFilter(filter)}
                  className={`rounded-full px-4 py-1.5 text-xs font-semibold ${
                    bookingFilter === filter
                      ? "bg-temple-red text-white"
                      : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>
            {filteredBookings.length === 0 && (
              <div className="card p-8 text-center">
                <Calendar className="mx-auto h-10 w-10 text-gray-300" />
                <p className="mt-3 text-sm text-gray-500">No bookings found.</p>
                <Link href="/services" className="mt-2 inline-block text-sm font-semibold text-temple-red hover:underline">
                  Browse Services
                </Link>
              </div>
            )}
            {filteredBookings.map((booking) => (
              <div key={booking.id} className="card p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{booking.service}</h3>
                    <p className="text-sm text-gray-500">{booking.id}{booking.priest ? ` | Priest: ${booking.priest}` : ""}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    booking.status === "confirmed" ? "bg-green-100 text-green-700" :
                    booking.status === "pending" ? "bg-amber-100 text-amber-700" :
                    "bg-gray-100 text-gray-600"
                  }`}>
                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> {booking.date}</span>
                  <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {booking.time}</span>
                  <span className="font-semibold text-temple-red">{formatCurrency(booking.amount)}</span>
                </div>
                {booking.status === "confirmed" && (
                  <div className="mt-3 flex gap-2">
                    <button className="text-xs text-blue-600 hover:underline" onClick={() => alert("Coming soon! Contact us at (512) 545-0473")}>Reschedule</button>
                    <button className="text-xs text-red-600 hover:underline" onClick={() => alert("Coming soon! Contact us at (512) 545-0473")}>Cancel</button>
                  </div>
                )}
                {booking.status === "completed" && (
                  <button className="mt-2 text-xs text-temple-red hover:underline" onClick={() => alert("Coming soon! Contact us at (512) 545-0473")}>Rebook this service</button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Donations Tab */}
        {activeTab === "donations" && (
          <div className="space-y-4">
            <h2 className="font-heading text-lg font-bold text-gray-900">Donations</h2>
            <div className="card bg-gradient-to-r from-green-50 to-emerald-50 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Donations</p>
                  <p className="text-3xl font-bold text-green-700">{formatCurrency(totalDonated)}</p>
                  <p className="mt-1 text-xs text-gray-500">Tax-deductible under 501(c)(3)</p>
                </div>
                <button className="btn-outline flex items-center gap-2 text-sm" onClick={() => alert("Feature coming soon!")}>
                  <Download className="h-4 w-4" /> Tax Summary
                </button>
              </div>
            </div>
            {donations.length === 0 && (
              <div className="card p-8 text-center">
                <Heart className="mx-auto h-10 w-10 text-gray-300" />
                <p className="mt-3 text-sm text-gray-500">No donations yet.</p>
                <Link href="/donate" className="mt-2 inline-block text-sm font-semibold text-temple-red hover:underline">
                  Make a Donation
                </Link>
              </div>
            )}
            {donations.map((d) => (
              <div key={d.id} className="card p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{d.fund}</h3>
                    <p className="text-sm text-gray-500">{d.id} | via {d.method}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">{formatCurrency(d.amount)}</p>
                    {d.recurring && <span className="text-xs text-blue-600">Monthly</span>}
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                  <Calendar className="h-4 w-4" /> {formatDate(d.date)}
                  <button className="ml-auto text-xs text-temple-red hover:underline" onClick={() => alert("Feature coming soon!")}>Download Receipt</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Preferences Tab */}
        {activeTab === "preferences" && (
          <div className="space-y-6">
            <h2 className="font-heading text-lg font-bold text-gray-900">Preferences</h2>
            <div className="card p-5">
              <h3 id="pref-language-label" className="font-heading text-lg font-bold text-gray-900">Preferred Language</h3>
              <select id="pref-language" aria-labelledby="pref-language-label" className="input-field mt-3 max-w-xs">
                <option>English</option>
                <option>Telugu</option>
                <option>Hindi</option>
                <option>Tamil</option>
                <option>Kannada</option>
                <option>Marathi</option>
                <option>Malayalam</option>
                <option>Gujarati</option>
                <option>Bengali</option>
                <option>Punjabi</option>
              </select>
            </div>
            <div className="card p-5">
              <h3 className="font-heading text-lg font-bold text-gray-900 flex items-center gap-2">
                <Bell className="h-5 w-5" /> Communication Preferences
              </h3>
              <div className="mt-4 space-y-3">
                {[
                  { label: "Push Notifications", desc: "Daily panchangam, event reminders, booking updates" },
                  { label: "Email Notifications", desc: "Booking confirmations, donation receipts, newsletters" },
                  { label: "SMS Alerts", desc: "Booking reminders, festival alerts" },
                  { label: "WhatsApp Updates", desc: "Temple announcements, community news" },
                ].map((item) => (
                  <label key={item.label} className="flex items-start gap-3">
                    <input type="checkbox" defaultChecked className="mt-1 rounded text-temple-red" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{item.label}</p>
                      <p className="text-xs text-gray-500">{item.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            <div className="card p-5">
              <h3 className="font-heading text-lg font-bold text-gray-900 flex items-center gap-2">
                <Star className="h-5 w-5" /> Spiritual Preferences
              </h3>
              <div className="mt-4 space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Preferred Deities</label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {["Lord Ganesha", "Lord Vishnu", "Lord Shiva", "Goddess Lakshmi", "Lord Hanuman", "Lord Rama"].map((deity) => (
                      <label key={deity} className="flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1.5 text-sm">
                        <input type="checkbox" className="rounded text-temple-red" />
                        {deity}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label htmlFor="pref-dietary" className="block text-sm font-medium text-gray-700">Dietary Restrictions (for Prasadam)</label>
                  <select id="pref-dietary" className="input-field mt-1 max-w-xs">
                    <option>None</option>
                    <option>Vegan</option>
                    <option>No Nuts</option>
                    <option>No Dairy</option>
                    <option>Gluten Free</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="card border-red-200 p-5">
              <h3 className="font-heading text-lg font-bold text-red-700">Data & Privacy</h3>
              <p className="mt-2 text-sm text-gray-600">
                You can export or delete your data at any time. GDPR compliant.
              </p>
              <div className="mt-4 flex gap-3">
                <button className="btn-outline text-sm flex items-center gap-2" onClick={() => alert("Data export is coming soon! Contact us at (512) 545-0473 for assistance.")}>
                  <Download className="h-4 w-4" /> Export My Data
                </button>
                <button className="rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50" onClick={() => { setDeleteError(""); setShowDeleteConfirm(true); }}>
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="delete-account-title">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 id="delete-account-title" className="font-heading text-xl font-bold text-red-700">Delete your account?</h3>
            <p className="mt-3 text-sm text-gray-600">
              This permanently deletes your devotee account and personal profile
              (name, contact details, family members, and preferences). This
              cannot be undone. Your past donation records are retained by the
              temple for tax/accounting purposes but are no longer linked to you.
            </p>
            {deleteError && (
              <p className="mt-3 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-800">{deleteError}</p>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <button
                className="btn-outline text-sm"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                onClick={handleDeleteAccount}
                disabled={deleting}
              >
                {deleting ? (<><Loader2 className="h-4 w-4 animate-spin" /> Deleting…</>) : "Delete My Account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
