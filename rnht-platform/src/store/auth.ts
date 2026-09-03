import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

export type FamilyMember = {
  id: string;
  name: string;
  relationship: string;
  gotra?: string;
  nakshatra?: string;
  rashi?: string;
  dob?: string;
};

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  gotra?: string;
  nakshatra?: string;
  rashi?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  familyMembers: FamilyMember[];
  createdAt: string;
};

export type Booking = {
  id: string;
  serviceName: string;
  serviceEmoji: string;
  date: string;
  time: string;
  status: "confirmed" | "pending" | "completed" | "cancelled";
  amount: number;
  priest?: string;
  location: string;
  notes?: string;
  createdAt: string;
};

export type Donation = {
  id: string;
  fund: string;
  amount: number;
  date: string;
  method: string;
  recurring: boolean;
  frequency?: "monthly" | "quarterly" | "annual";
  receiptId: string;
  taxDeductible: boolean;
  /** payment_status from the DB: "completed" | "pending" | etc. */
  status?: string;
};

export type ActivityItem = {
  id: string;
  type: "booking" | "donation" | "login" | "profile_update";
  title: string;
  description: string;
  date: string;
  amount?: number;
};

type AuthStore = {
  isAuthenticated: boolean;
  authUser: User | null;
  user: UserProfile | null;
  bookings: Booking[];
  donations: Donation[];
  activities: ActivityItem[];
  loading: boolean;
  initialized: boolean;

  // Auth actions. createUser=false (sign-in) prevents silently creating a new
  // account for an email/phone that doesn't exist yet.
  sendOtp: (email: string, name: string, createUser?: boolean) => Promise<AuthResult>;
  verifyOtp: (email: string, token: string) => Promise<AuthResult>;
  sendPhoneOtp: (phone: string, name: string, createUser?: boolean) => Promise<AuthResult>;
  verifyPhoneOtp: (phone: string, token: string) => Promise<AuthResult>;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;

  // Data actions
  updateProfile: (
    updates: Partial<UserProfile>
  ) => Promise<{ error?: string; emailChangePending?: boolean }>;
  addFamilyMember: (member: FamilyMember) => void;
  editFamilyMember: (id: string, updates: Partial<FamilyMember>) => void;
  removeFamilyMember: (id: string) => void;
  addBooking: (booking: Booking) => void;
  addDonation: (donation: Donation) => void;
  addActivity: (activity: ActivityItem) => void;
  fetchUserData: () => Promise<void>;
};

export type AuthResult = {
  error?: string;
  retryAfterSeconds?: number;
  channelSuggestion?: "phone" | "email";
};

function normalizeAuthError(message: string, channel: "email" | "phone"): AuthResult {
  const lower = message.toLowerCase();

  if (channel === "email" && (lower.includes("email rate limit exceeded") || lower.includes("rate limit"))) {
    return {
      error:
        "Too many email requests were sent recently. Please wait a minute and try again, or use phone verification right now.",
      retryAfterSeconds: 60,
      channelSuggestion: "phone",
    };
  }

  if (channel === "phone" && lower.includes("rate limit")) {
    return {
      error:
        "Too many phone verification requests were sent recently. Please wait a minute before requesting another code.",
      retryAfterSeconds: 60,
    };
  }

  // The most common verify-time failure: an expired or mistyped code. Supabase
  // surfaces this as a terse "Token has expired or is invalid" string with no
  // guidance — replace it with a clear, actionable message that tells the user
  // to request a fresh code instead of showing the raw backend text.
  if (
    lower.includes("expired") ||
    lower.includes("invalid") ||
    lower.includes("token")
  ) {
    return {
      error:
        "That code is incorrect or has expired. Please request a new code and try again.",
    };
  }

  return { error: message };
}

function profileRowToUserProfile(row: any): UserProfile {
  return {
    id: row.id,
    name: row.name || "",
    email: row.email || "",
    phone: row.phone || "",
    avatarUrl: row.avatar_url || undefined,
    gotra: row.gotra || undefined,
    nakshatra: row.nakshatra || undefined,
    rashi: row.rashi || undefined,
    address: row.address || undefined,
    city: row.city || undefined,
    state: row.state || undefined,
    zip: row.zip || undefined,
    familyMembers: row.family_members || [],
    createdAt: row.created_at || new Date().toISOString(),
  };
}

// Module-level guard so the onAuthStateChange listener is only ever registered
// once, even if initialize() is called from several places concurrently.
let authListenerRegistered = false;

/** Test-only: reset the one-time auth-listener guard between test cases. */
export function __resetAuthListenerForTests() {
  authListenerRegistered = false;
}

export const useAuthStore = create<AuthStore>()((set, get) => ({
  isAuthenticated: false,
  authUser: null,
  user: null,
  bookings: [],
  donations: [],
  activities: [],
  loading: false,
  initialized: false,

  initialize: async () => {
    // Synchronous guard: `initialized` only flips inside the async auth-change
    // callback, so without this two concurrent initialize() calls (e.g. global
    // + page) could both register an onAuthStateChange listener.
    if (get().initialized || authListenerRegistered) return;

    // If supabase is not configured (no env vars), mark as initialized immediately
    if (!supabase) {
      set({ initialized: true });
      return;
    }

    authListenerRegistered = true;
    // Listen for auth changes (catches magic link redirects + initial session)
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        set({
          authUser: session.user,
          isAuthenticated: true,
          initialized: true,
        });
        get().fetchUserData();
      } else {
        // No session: either INITIAL_SESSION with no user, or SIGNED_OUT
        set({
          isAuthenticated: false,
          authUser: null,
          user: null,
          bookings: [],
          donations: [],
          activities: [],
          initialized: true,
        });
      }
    });
  },

  sendOtp: async (email, name, createUser = true) => {
    if (!supabase) return { error: "Authentication is not configured" };
    set({ loading: true });
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        data: { name },
        shouldCreateUser: createUser,
        emailRedirectTo: `${typeof window !== "undefined" ? window.location.origin : ""}${process.env.NEXT_PUBLIC_BASE_PATH || ""}/auth/callback`,
      },
    });
    set({ loading: false });
    if (error) return normalizeAuthError(error.message, "email");
    return {};
  },

  verifyOtp: async (email, token) => {
    if (!supabase) return { error: "Authentication is not configured" };
    set({ loading: true });
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "email",
    });
    set({ loading: false });
    if (error) return normalizeAuthError(error.message, "email");
    // Set auth state immediately from the verified session instead of waiting for
    // the async onAuthStateChange listener — otherwise the UI hangs on the code
    // form until the listener (or a fallback timeout) fires. The listener still
    // runs and idempotently re-sets the same state.
    if (data?.user) {
      set({ authUser: data.user, isAuthenticated: true, initialized: true });
      get().fetchUserData();
    }
    return {};
  },

  sendPhoneOtp: async (phone, name, createUser = true) => {
    if (!supabase) return { error: "Authentication is not configured" };
    set({ loading: true });
    // Phone must be E.164 (e.g. "+15125550123"). normalizePhone() from
    // login/dashboard pages handles formatting; keep this method strict.
    const { error } = await supabase.auth.signInWithOtp({
      phone,
      options: {
        data: { name },
        shouldCreateUser: createUser,
      },
    });
    set({ loading: false });
    if (error) return normalizeAuthError(error.message, "phone");
    return {};
  },

  verifyPhoneOtp: async (phone, token) => {
    if (!supabase) return { error: "Authentication is not configured" };
    set({ loading: true });
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: "sms",
    });
    set({ loading: false });
    if (error) return normalizeAuthError(error.message, "phone");
    if (data?.user) {
      set({ authUser: data.user, isAuthenticated: true, initialized: true });
      get().fetchUserData();
    }
    return {};
  },

  logout: async () => {
    // Always clear the local session, even if the server sign-out call fails
    // (network error, already-expired token). Otherwise a thrown signOut() would
    // skip the set() below and leave isAuthenticated=true — the user appears
    // signed in on a device they tried to sign out of.
    try {
      if (supabase) await supabase.auth.signOut();
    } catch (e) {
      console.error("signOut failed; clearing local session anyway:", e);
    }
    set({
      isAuthenticated: false,
      authUser: null,
      user: null,
      bookings: [],
      donations: [],
      activities: [],
    });
  },

  fetchUserData: async () => {
    const authUser = get().authUser;
    if (!authUser || !supabase) return;

    // Fetch profile. maybeSingle() (not single()) so a not-yet-created row
    // returns data:null without an error — letting the fallback seed below run
    // for brand-new users during the profile-trigger delay.
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", authUser.id)
      .maybeSingle();

    if (profile) {
      set({ user: profileRowToUserProfile(profile) });
    } else if (!profileError && !get().user) {
      // No row yet (trigger delay) and nothing loaded — seed a fallback.
      // On a transient fetch error we keep any already-loaded profile rather
      // than clobbering it with an empty placeholder.
      set({
        user: {
          id: authUser.id,
          name: authUser.user_metadata?.name || "",
          email: authUser.email || "",
          phone: "",
          familyMembers: [],
          createdAt: authUser.created_at,
        },
      });
    } else if (profileError) {
      console.error("fetchUserData profile error:", profileError.message);
    }

    // Fetch bookings
    const { data: bookings } = await supabase
      .from("bookings")
      .select("*, services(name)")
      .eq("user_id", authUser.id)
      .order("created_at", { ascending: false });

    if (bookings) {
            set({
        bookings: bookings.map((b: any) => ({
          id: b.id,
          serviceName: b.services?.name || "Service",
          serviceEmoji: "🙏",
          date: b.booking_date,
          time: b.booking_time,
          status: b.status as Booking["status"],
          // PostgREST returns NUMERIC columns as strings — coerce so totals
          // sum instead of string-concatenating (mirrors the donations mapper).
          amount: Number(b.total_amount) || 0,
          priest: b.priest_name || undefined,
          location: "Temple",
          createdAt: b.created_at,
        })),
      });
    }

    // Fetch donations
    const { data: donations } = await supabase
      .from("donations")
      .select("*")
      .eq("user_id", authUser.id)
      .order("created_at", { ascending: false });

    if (donations) {
      set({
        donations: donations.map((d) => ({
          id: d.id,
          fund: d.fund_type || "General",
          // PostgREST returns NUMERIC columns as strings — coerce so totals
          // sum instead of string-concatenating.
          amount: Number(d.amount) || 0,
          date: d.created_at,
          method: d.payment_method,
          recurring: d.is_recurring,
          receiptId: `REC-${String(d.id).slice(0, 8).toUpperCase()}`,
          taxDeductible: true,
          status: d.payment_status,
        })),
      });
    }

    // Fetch activities
    const { data: activities } = await supabase
      .from("activities")
      .select("*")
      .eq("user_id", authUser.id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (activities) {
      set({
        activities: activities.map((a) => ({
          id: a.id,
          type: a.type,
          title: a.title,
          description: a.description || "",
          date: a.created_at,
          amount: a.amount || undefined,
        })),
      });
    }
  },

  updateProfile: async (updates) => {
    const authUser = get().authUser;
    if (!authUser) return { error: "Not authenticated" };
    if (!supabase) return { error: "Supabase is not configured" };

    // Validate any email being written. An empty string previously slipped
    // through (caller used `value && regex`), which wiped profiles.email; and an
    // invalid value must never reach the database. A user who signed up by phone
    // and never had an email may keep it blank, but a user who HAS an email
    // cannot clear it (that would break their contact/login address).
    const newEmail = updates.email !== undefined ? updates.email.trim() : undefined;
    if (newEmail !== undefined) {
      if (!newEmail) {
        if (authUser.email) return { error: "Email cannot be empty." };
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
        return { error: "Please enter a valid email address." };
      }
    }
    const emailChanging =
      newEmail !== undefined && newEmail !== "" && newEmail !== (authUser.email || "");

    // Update the AUTH identity FIRST when the email changes. OTP / magic-link
    // sign-in matches against auth.users.email, and Supabase emails a
    // confirmation link before the change takes effect. By doing this before the
    // profiles write, a rejected email (already-in-use, invalid) never leaves
    // profiles.email diverged from the auth identity.
    let emailChangePending = false;
    if (emailChanging) {
      const { error: authErr } = await supabase.auth.updateUser({
        email: newEmail!,
      });
      if (authErr) return { error: authErr.message };
      emailChangePending = true;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        ...(updates.name !== undefined && { name: updates.name }),
        // profiles.email is NEVER written from the client: it follows the auth
        // identity once Supabase confirms the new address (migration 016 syncs
        // it and rejects direct writes). Writing it early let anyone claim a
        // guest donor's giving history by typing their address.
        ...(updates.phone !== undefined && { phone: updates.phone }),
        ...(updates.gotra !== undefined && { gotra: updates.gotra }),
        ...(updates.nakshatra !== undefined && {
          nakshatra: updates.nakshatra,
        }),
        ...(updates.rashi !== undefined && { rashi: updates.rashi }),
        ...(updates.address !== undefined && { address: updates.address }),
        ...(updates.city !== undefined && { city: updates.city }),
        ...(updates.state !== undefined && { state: updates.state }),
        ...(updates.zip !== undefined && { zip: updates.zip }),
      })
      .eq("id", authUser.id);

    if (error) return { error: error.message };

    // Mirror exactly what was written to the DB. The email is deliberately NOT
    // mirrored: it stays the confirmed auth address until Supabase completes
    // the change (the caller shows the pending-confirmation notice).
    set((state) => ({
      user: state.user
        ? { ...state.user, ...updates, email: state.user.email }
        : null,
    }));
    return emailChangePending ? { emailChangePending: true } : {};
  },

  addFamilyMember: (member) => {
    const user = get().user;
    const authUser = get().authUser;
    if (!user || !authUser) return;

    const updated = [...user.familyMembers, member];
    set({ user: { ...user, familyMembers: updated } });

    if (supabase) {
      supabase
        .from("profiles")
        .update({ family_members: updated })
        .eq("id", authUser.id)
        .then(({ error }) => {
          // The write was previously fire-and-forget, so a failed save (RLS /
          // offline) silently reverted only on the next reload. Roll back the
          // optimistic update and log so the UI stays consistent with the DB.
          // Reverse only THIS op against the current list (remove the member we
          // added) rather than restoring a captured snapshot, so a concurrent
          // family-member edit that landed in between is not discarded.
          if (error) {
            console.error("addFamilyMember persist failed:", error);
            const cur = get().user;
            if (cur)
              set({
                user: {
                  ...cur,
                  familyMembers: cur.familyMembers.filter(
                    (m) => m.id !== member.id
                  ),
                },
              });
          }
        });
    }
  },

  editFamilyMember: (id, updates) => {
    const user = get().user;
    const authUser = get().authUser;
    if (!user || !authUser) return;

    const original = user.familyMembers.find((m) => m.id === id);
    const updated = user.familyMembers.map((m) =>
      m.id === id ? { ...m, ...updates } : m
    );
    set({ user: { ...user, familyMembers: updated } });

    if (supabase) {
      supabase
        .from("profiles")
        .update({ family_members: updated })
        .eq("id", authUser.id)
        .then(({ error }) => {
          // Same optimistic-write + rollback pattern as add/removeFamilyMember.
          // Reverse only THIS edit (restore the original fields of the one
          // member we changed) against the current list rather than restoring a
          // captured snapshot, so a concurrent family-member change that landed
          // in between is not discarded.
          if (error) {
            console.error("editFamilyMember persist failed:", error);
            const cur = get().user;
            if (cur && original)
              set({
                user: {
                  ...cur,
                  familyMembers: cur.familyMembers.map((m) =>
                    m.id === id ? original : m
                  ),
                },
              });
          }
        });
    }
  },

  removeFamilyMember: (id) => {
    const user = get().user;
    const authUser = get().authUser;
    if (!user || !authUser) return;

    const removedIndex = user.familyMembers.findIndex((m) => m.id === id);
    const removed = removedIndex >= 0 ? user.familyMembers[removedIndex] : undefined;
    const updated = user.familyMembers.filter((m) => m.id !== id);
    set({ user: { ...user, familyMembers: updated } });

    if (supabase) {
      supabase
        .from("profiles")
        .update({ family_members: updated })
        .eq("id", authUser.id)
        .then(({ error }) => {
          // Reverse only THIS op (re-insert the member we removed, at its
          // original index) against the current list rather than restoring a
          // captured snapshot, so a concurrent family-member change that landed
          // in between is not discarded.
          if (error) {
            console.error("removeFamilyMember persist failed:", error);
            const cur = get().user;
            if (cur && removed && !cur.familyMembers.some((m) => m.id === id)) {
              const restored = [...cur.familyMembers];
              restored.splice(
                Math.min(removedIndex, restored.length),
                0,
                removed
              );
              set({ user: { ...cur, familyMembers: restored } });
            }
          }
        });
    }
  },

  addBooking: (booking) =>
    set((state) => ({
      bookings: [booking, ...state.bookings],
      activities: [
        {
          id: "act-" + Date.now(),
          type: "booking",
          title: `Booked ${booking.serviceName}`,
          description: `${booking.date} at ${booking.time}`,
          date: new Date().toISOString().split("T")[0],
          amount: booking.amount,
        },
        ...state.activities,
      ],
    })),

  addDonation: (donation) => {
    // Optimistic, LOCAL-ONLY state update for the in-session UI. We deliberately
    // do NOT write the donation to Supabase here: a real donation row (with a
    // verified `payment_status: "completed"`) is created only server-side by the
    // payment-verification edge functions (Stripe verify / PayPal capture).
    // Inserting a "completed" donation straight from the client allowed any
    // signed-in user to fabricate paid, tax-deductible records — so that path is
    // removed. This local entry is ephemeral and is replaced by the real rows on
    // the next fetchUserData().
    set((state) => ({
      donations: [donation, ...state.donations],
      activities: [
        {
          id: "act-" + Date.now(),
          type: "donation",
          title: `Donated to ${donation.fund}`,
          description: `${donation.recurring ? "Recurring" : "One-time"} via ${donation.method}`,
          date: donation.date,
          amount: donation.amount,
        },
        ...state.activities,
      ],
    }));
  },

  addActivity: (activity) =>
    set((state) => ({
      activities: [activity, ...state.activities],
    })),
}));
