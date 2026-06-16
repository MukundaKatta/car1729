"use client";

import { useState, useEffect, useRef } from "react";
import { pushOverlay } from "@/lib/overlay-stack";
import Link from "next/link";
import {
  HeartHandshake,
  CalendarDays,
  Users,
  Trophy,
  Clock,
  MapPin,
  ChefHat,
  Heart,
  Megaphone,
} from "lucide-react";

type CommunityTab = "volunteer" | "annadanam" | "announcements";

const volunteerOpportunities = [
  {
    id: "vol-1",
    title: "Kitchen Seva (Annadanam)",
    description: "Help prepare and serve prasadam and community meals. No cooking experience required — training provided.",
    category: "Kitchen",
    shifts: ["Saturday 8 AM - 12 PM", "Sunday 8 AM - 12 PM", "Sunday 12 PM - 3 PM"],
    spotsAvailable: 5,
    icon: ChefHat,
  },
  {
    id: "vol-2",
    title: "Event Setup & Decoration",
    description: "Assist with decorating the temple mandapam, setting up stages, and arranging flowers for festivals and special events.",
    category: "Events",
    shifts: ["As needed — typically day before festivals"],
    spotsAvailable: 10,
    icon: CalendarDays,
  },
  {
    id: "vol-3",
    title: "Sunday School Teaching",
    description: "Teach Bala Vihar classes for children ages 5-12. Share stories from epics, lead shloka learning, and conduct cultural activities.",
    category: "Education",
    shifts: ["Sundays 10 AM - 11:30 AM"],
    spotsAvailable: 3,
    icon: Users,
  },
  {
    id: "vol-4",
    title: "Temple Administration",
    description: "Help with front desk reception, phone calls, scheduling, data entry, and general office management during temple hours.",
    category: "Admin",
    shifts: ["Weekdays 10 AM - 2 PM", "Weekends 9 AM - 1 PM"],
    spotsAvailable: 2,
    icon: Clock,
  },
  {
    id: "vol-5",
    title: "Social Media & Photography",
    description: "Capture temple events through photography/videography. Help manage social media accounts and create content.",
    category: "Media",
    shifts: ["Flexible — during events and festivals"],
    spotsAvailable: 4,
    icon: Heart,
  },
];

// Top-volunteer leaderboard is sourced from real seva hours. Empty until
// the volunteer tracking pipeline is wired; the leaderboard UI hides when
// this list is empty and shows a "Coming Soon" placeholder instead.
const topVolunteers: { name: string; hours: number; badge: string }[] = [];

const annadanamSchedule = [
  { date: "2026-03-22", day: "Sunday", meal: "Full South Indian Meal", servings: 100, volunteers: 8, status: "upcoming" as const },
  { date: "2026-04-26", day: "Sunday", meal: "North Indian Thali", servings: 100, volunteers: 5, status: "open" as const },
  { date: "2026-05-24", day: "Sunday", meal: "To be decided", servings: 100, volunteers: 3, status: "open" as const },
];

const announcements = [
  {
    id: "ann-1",
    title: "Ugadi 2026 Celebration Details",
    date: "2026-03-10",
    content: "Join us for a grand Ugadi celebration on March 29th. Program starts at 9 AM with Panchangam Sravanam, followed by cultural programs, and a community feast. Volunteers needed for food preparation and decoration.",
    priority: "high" as const,
  },
  {
    id: "ann-2",
    title: "New Yoga Classes Starting April",
    date: "2026-03-08",
    content: "We are excited to announce new morning yoga sessions starting April 1st. Classes will be held Mon/Wed/Fri at 6:30 AM led by Yoga Acharya Suresh. Registration is open.",
    priority: "normal" as const,
  },
  {
    id: "ann-3",
    title: "Temple Timing Update for Summer",
    date: "2026-03-05",
    content: "Starting April 1st, temple hours will be extended: Morning 8 AM - 1 PM, Evening 4 PM - 9 PM. This change will remain in effect through September.",
    priority: "normal" as const,
  },
  {
    id: "ann-4",
    title: "Building Fund Drive — Help Us Build the New Mandapam",
    date: "2026-03-01",
    content: "We are launching a fundraising drive for the new community mandapam. Target: $150,000. Every contribution counts. Gold donors ($5,000+) will have their names engraved on the donor wall.",
    priority: "high" as const,
  },
];

export default function CommunityPage() {
  const currentYear = new Date().getFullYear();
  const [activeTab, setActiveTab] = useState<CommunityTab>("volunteer");
  const [selectedOpp, setSelectedOpp] = useState<string | null>(null);
  const [volunteerName, setVolunteerName] = useState("");
  const [volunteerEmail, setVolunteerEmail] = useState("");
  const [volunteerPhone, setVolunteerPhone] = useState("");
  const [volunteerShifts, setVolunteerShifts] = useState<Set<string>>(new Set());
  const [volunteerNotes, setVolunteerNotes] = useState("");

  // Refs for dialog focus management (initial focus, focus trap, focus restore).
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  const emailTrimmed = volunteerEmail.trim();
  const emailInvalid =
    emailTrimmed.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed);

  const resetVolunteerForm = () => {
    setVolunteerName("");
    setVolunteerEmail("");
    setVolunteerPhone("");
    setVolunteerShifts(new Set());
    setVolunteerNotes("");
  };

  // Escape key handler, body scroll lock, initial focus, focus trap, and
  // focus restore for the volunteer modal.
  useEffect(() => {
    if (!selectedOpp) return;
    document.body.style.overflow = "hidden";
    // Remember the element that opened the dialog so focus can be restored.
    const opener = document.activeElement as HTMLElement | null;
    triggerRef.current = opener;
    const close = () => {
      setSelectedOpp(null);
      resetVolunteerForm();
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
        return;
      }
      // Focus trap: keep Tab/Shift+Tab inside the dialog.
      if (e.key === "Tab" && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const active = document.activeElement;
        if (e.shiftKey) {
          if (active === first || !dialogRef.current.contains(active)) {
            e.preventDefault();
            last.focus();
          }
        } else if (active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", handleKey);
    // Move initial focus into the dialog (first form field).
    firstFieldRef.current?.focus();
    // Android hardware back closes the modal (instead of navigating away).
    const unregister = pushOverlay(close);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKey);
      unregister();
      // Restore focus to the element that opened the dialog.
      triggerRef.current?.focus?.();
    };
  }, [selectedOpp]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="text-center">
        <HeartHandshake className="mx-auto h-10 w-10 text-temple-red" />
        <h1 className="mt-4 section-heading">Community Hub</h1>
        <p className="mt-3 mx-auto max-w-2xl text-gray-600">
          Serve, connect, and grow with our temple community.
          &quot;Vasudhaiva Kutumbakam&quot; — The world is one family.
        </p>
      </div>

      {/* Tabs — flex-wrap so the three pills never push the page wider than
          a phone viewport (this row caused ~35px of horizontal overflow). */}
      <div className="mt-8 flex flex-wrap justify-center gap-2" role="tablist" aria-label="Community sections">
        {([
          { id: "volunteer" as const, label: "Volunteer", icon: HeartHandshake },
          { id: "annadanam" as const, label: "Annadanam", icon: ChefHat },
          { id: "announcements" as const, label: "Announcements", icon: Megaphone },
        ]).map((tab, index, tabs) => (
          <button
            key={tab.id}
            id={`community-tab-${tab.id}`}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`community-panel-${tab.id}`}
            tabIndex={activeTab === tab.id ? 0 : -1}
            onClick={() => setActiveTab(tab.id)}
            onKeyDown={(e) => {
              if (e.key !== "ArrowRight" && e.key !== "ArrowLeft" && e.key !== "Home" && e.key !== "End") return;
              e.preventDefault();
              let next = index;
              if (e.key === "ArrowRight") next = (index + 1) % tabs.length;
              else if (e.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
              else if (e.key === "Home") next = 0;
              else if (e.key === "End") next = tabs.length - 1;
              const nextTab = tabs[next];
              setActiveTab(nextTab.id);
              document.getElementById(`community-tab-${nextTab.id}`)?.focus();
            }}
            className={`flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-temple-red text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <tab.icon className="h-4 w-4" aria-hidden="true" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-8">
        {/* Volunteer Tab */}
        {activeTab === "volunteer" && (
          <div className="grid gap-8 lg:grid-cols-3" id="community-panel-volunteer" role="tabpanel" aria-labelledby="community-tab-volunteer">
            <div className="lg:col-span-2 space-y-4">
              <h2 className="font-heading text-xl font-bold text-gray-900">
                Volunteer Opportunities
              </h2>
              {volunteerOpportunities.map((opp) => (
                <div key={opp.id} className="card p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-temple-cream text-temple-red">
                      <opp.icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{opp.title}</h3>
                      <p className="mt-1 text-sm text-gray-600">{opp.description}</p>
                      <div className="mt-3 space-y-1">
                        {opp.shifts.map((shift) => (
                          <div key={shift} className="flex items-center gap-2 text-sm text-gray-500">
                            <Clock className="h-3.5 w-3.5" /> {shift}
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-sm text-green-700 font-medium">
                          {opp.spotsAvailable} spots available
                        </span>
                        <button
                          className="btn-primary text-sm py-2"
                          onClick={() => setSelectedOpp(opp.id)}
                        >
                          Enquire
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Leaderboard */}
            <div>
              <div className="card sticky top-[calc(var(--header-h,96px)+8px)] p-5">
                <h2 className="flex items-center gap-2 font-heading text-lg font-bold text-gray-900">
                  <Trophy className="h-5 w-5 text-temple-gold" />
                  Top Volunteers ({currentYear})
                </h2>
                <div className="mt-4 space-y-3">
                  {topVolunteers.length === 0 ? (
                    <p className="rounded-lg bg-temple-ivory px-3 py-4 text-center text-sm text-gray-600">
                      We&rsquo;ll feature top volunteers here once seva hours
                      are tracked. Sign up for a shift to get started.
                    </p>
                  ) : (
                    topVolunteers.map((v, i) => (
                      <div key={v.name} className="flex items-center gap-3">
                        <span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                          i === 0 ? "bg-amber-100 text-amber-700" :
                          i === 1 ? "bg-gray-200 text-gray-700" :
                          i === 2 ? "bg-orange-100 text-orange-700" :
                          "bg-gray-100 text-gray-500"
                        }`}>
                          {i + 1}
                        </span>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{v.name}</p>
                          <p className="text-xs text-gray-500">{v.hours} hours</p>
                        </div>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          v.badge === "Gold Seva" ? "bg-amber-100 text-amber-700" :
                          v.badge === "Silver Seva" ? "bg-gray-200 text-gray-700" :
                          "bg-orange-100 text-orange-700"
                        }`}>
                          {v.badge}
                        </span>
                      </div>
                    ))
                  )}
                </div>
                <div className="mt-6 rounded-lg bg-temple-cream p-3 text-center">
                  <p className="text-sm font-semibold text-temple-maroon">
                    Temple Seva Points
                  </p>
                  <p className="mt-1 text-xs text-gray-600">
                    Earn points for volunteering, donations, and event attendance.
                    Redeem for temple merchandise or service discounts!
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Annadanam Tab */}
        {activeTab === "annadanam" && (
          <div className="space-y-6" id="community-panel-annadanam" role="tabpanel" aria-labelledby="community-tab-annadanam">
            <div className="card bg-gradient-to-r from-green-50 to-emerald-50 p-6">
              <h2 className="font-heading text-xl font-bold text-green-900">
                Annadanam — Community Meal Service
              </h2>
              <p className="mt-2 text-sm text-green-800">
                &quot;Annadanam Maha Danam&quot; — Offering food is the greatest donation.
                Join us every 4th Sunday for a free community meal open to all,
                regardless of religion, race, or background.
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg bg-white/70 p-3 text-center">
                  <p className="text-2xl font-bold text-green-700">1,200+</p>
                  <p className="text-xs text-gray-600">Meals served in 2025</p>
                </div>
                <div className="rounded-lg bg-white/70 p-3 text-center">
                  <p className="text-2xl font-bold text-green-700">45+</p>
                  <p className="text-xs text-gray-600">Regular volunteers</p>
                </div>
                <div className="rounded-lg bg-white/70 p-3 text-center">
                  <p className="text-2xl font-bold text-green-700">12</p>
                  <p className="text-xs text-gray-600">Events per year</p>
                </div>
              </div>
            </div>

            <h3 className="font-heading text-lg font-bold text-gray-900">
              Upcoming Annadanam Schedule
            </h3>
            {annadanamSchedule.map((event) => (
              <div key={event.date} className="card p-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h4 className="font-semibold text-gray-900">{event.meal}</h4>
                    <div className="mt-1 flex flex-wrap items-center gap-2 sm:gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1"><CalendarDays className="h-4 w-4" /> {event.date} ({event.day})</span>
                      <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> RNHT Dining Hall</span>
                      <span className="flex items-center gap-1"><Users className="h-4 w-4" /> {event.volunteers} volunteers</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      event.status === "upcoming" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                    }`}>
                      {event.status === "upcoming" ? "Confirmed" : "Needs Volunteers"}
                    </span>
                    <p className="mt-1 text-xs text-gray-400">{event.servings} servings planned</p>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    disabled
                    title="Online volunteer sign-up is coming soon"
                    className="btn-primary text-sm py-2 opacity-50 cursor-not-allowed"
                  >
                    Volunteer to Cook
                  </button>
                  <Link href="/donate" className="btn-outline text-sm py-2">
                    Donate Supplies
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Announcements Tab */}
        {activeTab === "announcements" && (
          <div className="space-y-4" id="community-panel-announcements" role="tabpanel" aria-labelledby="community-tab-announcements">
            {announcements.map((a) => (
              <div key={a.id} className={`card p-5 ${a.priority === "high" ? "border-l-4 border-l-temple-red" : ""}`}>
                {a.priority === "high" && (
                  <span className="inline-block rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700 mb-2">
                    Important
                  </span>
                )}
                <h3 className="font-heading text-lg font-bold text-gray-900">{a.title}</h3>
                <p className="mt-1 text-xs text-gray-400">{a.date}</p>
                <p className="mt-3 text-sm text-gray-600">{a.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Volunteer Sign-Up Modal */}
      {selectedOpp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="vol-signup-title" onClick={() => { setSelectedOpp(null); resetVolunteerForm(); }}>
          <div ref={dialogRef} className="w-full max-w-md max-h-[85vh] sm:max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 id="vol-signup-title" className="font-heading text-xl font-bold text-gray-900">
              Volunteer Enquiry
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {volunteerOpportunities.find((o) => o.id === selectedOpp)?.title}
            </p>
            <p className="mt-2 text-xs text-gray-500">
              This sends an enquiry — the temple will follow up to confirm your
              volunteering. Nothing is booked automatically yet.
            </p>
            <div className="mt-4 space-y-3">
              <div>
                <label htmlFor="vol-name" className="block text-sm font-medium text-gray-700">Full Name *</label>
                <input ref={firstFieldRef} id="vol-name" type="text" required aria-required="true" className="input-field mt-1" placeholder="Full Name *" value={volunteerName} onChange={(e) => setVolunteerName(e.target.value)} />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="vol-email" className="block text-sm font-medium text-gray-700">Email *</label>
                  <input id="vol-email" type="email" required aria-required="true" aria-invalid={emailInvalid} aria-describedby={emailInvalid ? "vol-email-error" : undefined} className="input-field mt-1" placeholder="Email *" value={volunteerEmail} onChange={(e) => setVolunteerEmail(e.target.value)} />
                  {emailInvalid && (
                    <p id="vol-email-error" className="mt-1 text-xs text-red-600">
                      Please enter a valid email address (e.g. name@example.com).
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="vol-phone" className="block text-sm font-medium text-gray-700">Phone</label>
                  <input id="vol-phone" type="tel" className="input-field mt-1" placeholder="Phone" value={volunteerPhone} onChange={(e) => setVolunteerPhone(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preferred Shifts
                </label>
                {volunteerOpportunities
                  .find((o) => o.id === selectedOpp)
                  ?.shifts.map((shift) => (
                    <label key={shift} className="flex items-center gap-2 py-2">
                      <input
                        type="checkbox"
                        className="rounded text-temple-red"
                        checked={volunteerShifts.has(shift)}
                        onChange={(e) =>
                          setVolunteerShifts((prev) => {
                            const next = new Set(prev);
                            if (e.target.checked) next.add(shift);
                            else next.delete(shift);
                            return next;
                          })
                        }
                      />
                      <span className="text-sm text-gray-700">{shift}</span>
                    </label>
                  ))}
              </div>
              <div>
                <label htmlFor="vol-notes" className="block text-sm font-medium text-gray-700">Experience / Notes</label>
                <textarea id="vol-notes" className="input-field mt-1" rows={2} placeholder="Any experience or notes..." value={volunteerNotes} onChange={(e) => setVolunteerNotes(e.target.value)} />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button className="btn-outline" onClick={() => { setSelectedOpp(null); resetVolunteerForm(); }}>Cancel</button>
              <button className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed" disabled={!volunteerName.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(volunteerEmail.trim())} onClick={() => {
                // Online volunteer sign-up isn't wired to a backend yet — be
                // honest instead of claiming a confirmation that never sends.
                alert("Online volunteer sign-up is coming soon. To volunteer now, please contact the temple at (512) 545-0473 or on WhatsApp and we'll add you.");
                setSelectedOpp(null);
                resetVolunteerForm();
              }}>
                Enquire
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
