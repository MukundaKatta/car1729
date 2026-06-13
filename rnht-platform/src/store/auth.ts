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
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error?: string }>;
  addFamilyMember: (member: FamilyMember) => void;
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
    if (get().initialized) return;

    // If supabase is not configured (no env vars), mark as initialized immediately
    if (!supabase) {
      set({ initialized: true });
      return;
    }

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
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "email",
    });
    set({ loading: false });
    if (error) return normalizeAuthError(error.message, "email");
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
    const { error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: "sms",
    });
    set({ loading: false });
    if (error) return normalizeAuthError(error.message, "phone");
    return {};
  },

  logout: async () => {
    if (supabase) await supabase.auth.signOut();
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
    if (!authUser) return;

    // Fetch profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", authUser.id)
      .single();

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
          amount: b.total_amount,
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
          receiptId: `REC-${d.id.slice(0, 8)}`,
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

    const { error } = await supabase
      .from("profiles")
      .update({
        ...(updates.name !== undefined && { name: updates.name }),
        ...(updates.email !== undefined && { email: updates.email }),
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

    set((state) => ({
      user: state.user ? { ...state.user, ...updates } : null,
    }));
    return {};
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
        .then();
    }
  },

  removeFamilyMember: (id) => {
    const user = get().user;
    const authUser = get().authUser;
    if (!user || !authUser) return;

    const updated = user.familyMembers.filter((m) => m.id !== id);
    set({ user: { ...user, familyMembers: updated } });

    if (supabase) {
      supabase
        .from("profiles")
        .update({ family_members: updated })
        .eq("id", authUser.id)
        .then();
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
    const authUser = get().authUser;

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

    // Persist to Supabase
    if (authUser) {
      supabase
        .from("donations")
        .insert({
          user_id: authUser.id,
          donor_name: get().user?.name || "",
          donor_email: get().user?.email || "",
          amount: donation.amount,
          fund_type: donation.fund,
          payment_method: "stripe" as const,
          payment_status: "completed" as const,
          is_recurring: donation.recurring,
          is_anonymous: false,
        })
        .then();

      supabase
        .from("activities")
        .insert({
          user_id: authUser.id,
          type: "donation",
          title: `Donated to ${donation.fund}`,
          description: `${donation.recurring ? "Recurring" : "One-time"} donation`,
          amount: donation.amount,
        })
        .then();
    }
  },

  addActivity: (activity) =>
    set((state) => ({
      activities: [activity, ...state.activities],
    })),
}));
