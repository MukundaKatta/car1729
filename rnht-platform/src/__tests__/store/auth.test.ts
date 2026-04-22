import { describe, it, expect, beforeEach, vi, type Mock } from "vitest";
import { useAuthStore } from "@/store/auth";
import type {
  UserProfile,
  Booking,
  Donation,
  ActivityItem,
  FamilyMember,
} from "@/store/auth";

// ── Supabase mock ───────────────────────────────────────────────────────────

const mockSignInWithOtp = vi.fn();
const mockVerifyOtp = vi.fn();
const mockSignOut = vi.fn();
const mockOnAuthStateChange = vi.fn();

// Chainable query builder that tracks calls.
// The builder is "thenable" so that `await supabase.from("x").update({}).eq(...)` resolves.
function createQueryBuilder() {
  const builder: any = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    update: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    // Make the builder itself thenable so `await builder` resolves to { data: null, error: null }.
    // This is required because the store awaits chains like `.update().eq()`.
    then: vi.fn((resolve?: (v: any) => any, reject?: (e: any) => any) => {
      return Promise.resolve({ data: null, error: null }).then(resolve, reject);
    }),
  };
  return builder;
}

let queryBuilders: Record<string, ReturnType<typeof createQueryBuilder>> = {};

function getBuilder(table: string) {
  if (!queryBuilders[table]) {
    queryBuilders[table] = createQueryBuilder();
  }
  return queryBuilders[table];
}

const mockFrom = vi.fn((...args: any[]) => getBuilder(args[0] as string));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      signInWithOtp: (...args: any[]) => mockSignInWithOtp(...args),
      verifyOtp: (...args: any[]) => mockVerifyOtp(...args),
      signOut: (...args: any[]) => mockSignOut(...args),
      onAuthStateChange: (...args: any[]) => mockOnAuthStateChange(...args),
    },
    from: (...args: any[]) => mockFrom(...args),
  },
}));

// ── Helpers ──────────────────────────────────────────────────────────────────

const mockAuthUser = {
  id: "user-123",
  email: "test@temple.org",
  user_metadata: { name: "Rama" },
  created_at: "2025-01-01T00:00:00.000Z",
} as any;

const mockProfile: UserProfile = {
  id: "user-123",
  name: "Rama",
  email: "test@temple.org",
  phone: "5125550000",
  gotra: "Bharadvaja",
  nakshatra: "Ashwini",
  rashi: "Mesha",
  address: "123 Temple St",
  city: "Austin",
  state: "TX",
  zip: "78701",
  familyMembers: [],
  createdAt: "2025-01-01T00:00:00.000Z",
};

const sampleBooking: Booking = {
  id: "bk-1",
  serviceName: "Ganesh Pooja",
  serviceEmoji: "🙏",
  date: "2026-04-01",
  time: "09:00",
  status: "confirmed",
  amount: 51,
  priest: "Pandit Ji",
  location: "Temple",
  createdAt: "2026-03-01T00:00:00.000Z",
};

const sampleDonation: Donation = {
  id: "don-1",
  fund: "General Fund",
  amount: 108,
  date: "2026-03-01",
  method: "stripe",
  recurring: false,
  receiptId: "REC-don-1",
  taxDeductible: true,
};

const sampleActivity: ActivityItem = {
  id: "act-1",
  type: "login",
  title: "Logged in",
  description: "User logged in",
  date: "2026-03-01",
};

function resetStore() {
  useAuthStore.setState({
    isAuthenticated: false,
    authUser: null,
    user: null,
    bookings: [],
    donations: [],
    activities: [],
    loading: false,
    initialized: false,
  });
}

function setAuthenticatedState(
  overrides: Partial<ReturnType<typeof useAuthStore.getState>> = {}
) {
  useAuthStore.setState({
    isAuthenticated: true,
    authUser: mockAuthUser,
    user: { ...mockProfile },
    ...overrides,
  });
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("useAuthStore", () => {
  beforeEach(() => {
    resetStore();
    vi.clearAllMocks();
    queryBuilders = {};
  });

  // ── 1. Initial state ──────────────────────────────────────────────────────

  describe("initial state", () => {
    it("starts unauthenticated with empty data", () => {
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.authUser).toBeNull();
      expect(state.user).toBeNull();
      expect(state.bookings).toEqual([]);
      expect(state.donations).toEqual([]);
      expect(state.activities).toEqual([]);
      expect(state.loading).toBe(false);
      expect(state.initialized).toBe(false);
    });
  });

  // ── 2. sendOtp ─────────────────────────────────────────────────────────────

  describe("sendOtp", () => {
    it("sends OTP successfully and sets loading", async () => {
      mockSignInWithOtp.mockResolvedValueOnce({ error: null });

      const result = await useAuthStore.getState().sendOtp("test@temple.org", "Rama");

      expect(mockSignInWithOtp).toHaveBeenCalledWith({
        email: "test@temple.org",
        options: {
          data: { name: "Rama" },
          emailRedirectTo: expect.stringContaining("/auth/callback"),
        },
      });
      expect(result).toEqual({});
      expect(useAuthStore.getState().loading).toBe(false);
    });

    it("sets loading to true during the request", async () => {
      let resolveOtp: (v: any) => void;
      const otpPromise = new Promise((r) => {
        resolveOtp = r;
      });
      mockSignInWithOtp.mockReturnValueOnce(otpPromise);

      const promise = useAuthStore.getState().sendOtp("test@temple.org", "Rama");
      expect(useAuthStore.getState().loading).toBe(true);

      resolveOtp!({ error: null });
      await promise;
      expect(useAuthStore.getState().loading).toBe(false);
    });

    it("returns error message on failure", async () => {
      mockSignInWithOtp.mockResolvedValueOnce({
        error: { message: "Rate limit exceeded" },
      });

      const result = await useAuthStore.getState().sendOtp("bad@example.com", "X");

      expect(result).toEqual({ error: "Rate limit exceeded" });
      expect(useAuthStore.getState().loading).toBe(false);
    });
  });

  // ── 3. verifyOtp ───────────────────────────────────────────────────────────

  describe("verifyOtp", () => {
    it("verifies OTP successfully", async () => {
      mockVerifyOtp.mockResolvedValueOnce({ error: null });

      const result = await useAuthStore.getState().verifyOtp("test@temple.org", "123456");

      expect(mockVerifyOtp).toHaveBeenCalledWith({
        email: "test@temple.org",
        token: "123456",
        type: "email",
      });
      expect(result).toEqual({});
      expect(useAuthStore.getState().loading).toBe(false);
    });

    it("sets loading to true during verification", async () => {
      let resolveVerify: (v: any) => void;
      const verifyPromise = new Promise((r) => {
        resolveVerify = r;
      });
      mockVerifyOtp.mockReturnValueOnce(verifyPromise);

      const promise = useAuthStore.getState().verifyOtp("test@temple.org", "123456");
      expect(useAuthStore.getState().loading).toBe(true);

      resolveVerify!({ error: null });
      await promise;
      expect(useAuthStore.getState().loading).toBe(false);
    });

    it("returns error message on invalid OTP", async () => {
      mockVerifyOtp.mockResolvedValueOnce({
        error: { message: "Token has expired or is invalid" },
      });

      const result = await useAuthStore.getState().verifyOtp("test@temple.org", "000000");

      expect(result).toEqual({ error: "Token has expired or is invalid" });
      expect(useAuthStore.getState().loading).toBe(false);
    });
  });

  // ── 4. logout ──────────────────────────────────────────────────────────────

  describe("logout", () => {
    it("clears all state and calls signOut", async () => {
      setAuthenticatedState({
        bookings: [sampleBooking],
        donations: [sampleDonation],
        activities: [sampleActivity],
      });
      mockSignOut.mockResolvedValueOnce({ error: null });

      await useAuthStore.getState().logout();

      expect(mockSignOut).toHaveBeenCalled();
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.authUser).toBeNull();
      expect(state.user).toBeNull();
      expect(state.bookings).toEqual([]);
      expect(state.donations).toEqual([]);
      expect(state.activities).toEqual([]);
    });
  });

  // ── 5. initialize ─────────────────────────────────────────────────────────

  describe("initialize", () => {
    it("registers an auth state change listener", async () => {
      mockOnAuthStateChange.mockReturnValueOnce({
        data: { subscription: { unsubscribe: vi.fn() } },
      });

      await useAuthStore.getState().initialize();

      expect(mockOnAuthStateChange).toHaveBeenCalledTimes(1);
      expect(mockOnAuthStateChange).toHaveBeenCalledWith(expect.any(Function));
    });

    it("does nothing if already initialized", async () => {
      useAuthStore.setState({ initialized: true });
      mockOnAuthStateChange.mockReturnValueOnce({
        data: { subscription: { unsubscribe: vi.fn() } },
      });

      await useAuthStore.getState().initialize();

      expect(mockOnAuthStateChange).not.toHaveBeenCalled();
    });

    it("sets authenticated state when session has a user", async () => {
      // Fully reset store AND clear all mocks to ensure clean state
      resetStore();
      vi.clearAllMocks();
      queryBuilders = {};

      // Set up the mock for fetchUserData supabase calls
      const profileBuilder = createQueryBuilder();
      profileBuilder.single.mockResolvedValue({ data: null, error: null });
      queryBuilders["profiles"] = profileBuilder;

      const bookingsBuilder = createQueryBuilder();
      bookingsBuilder.order.mockResolvedValue({ data: null });
      queryBuilders["bookings"] = bookingsBuilder;

      const donationsBuilder = createQueryBuilder();
      donationsBuilder.order.mockResolvedValue({ data: null });
      queryBuilders["donations"] = donationsBuilder;

      const activitiesBuilder = createQueryBuilder();
      activitiesBuilder.limit.mockResolvedValue({ data: null });
      queryBuilders["activities"] = activitiesBuilder;

      mockOnAuthStateChange.mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      });

      await useAuthStore.getState().initialize();

      // Verify onAuthStateChange was called and extract the callback
      expect(mockOnAuthStateChange).toHaveBeenCalledTimes(1);
      const authCallback = mockOnAuthStateChange.mock.calls[0][0];
      expect(typeof authCallback).toBe("function");

      // Simulate auth state change with a session
      await authCallback("SIGNED_IN", { user: mockAuthUser });

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.authUser).toEqual(mockAuthUser);
      expect(state.initialized).toBe(true);
    });

    it("clears state when session has no user", async () => {
      setAuthenticatedState();
      // Reset initialized so initialize() runs
      useAuthStore.setState({ initialized: false });

      let authCallback: (event: string, session: any) => void;
      mockOnAuthStateChange.mockImplementation((cb) => {
        authCallback = cb;
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      });

      await useAuthStore.getState().initialize();
      authCallback!("INITIAL_SESSION", null);

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.authUser).toBeNull();
      expect(state.user).toBeNull();
      expect(state.initialized).toBe(true);
    });
  });

  // ── 6. addFamilyMember ─────────────────────────────────────────────────────

  describe("addFamilyMember", () => {
    const member: FamilyMember = {
      id: "fm-1",
      name: "Sita",
      relationship: "Spouse",
      gotra: "Bharadvaja",
    };

    it("adds a family member to the user profile", () => {
      setAuthenticatedState();

      useAuthStore.getState().addFamilyMember(member);

      const state = useAuthStore.getState();
      expect(state.user!.familyMembers).toHaveLength(1);
      expect(state.user!.familyMembers[0]).toEqual(member);
    });

    it("persists family members to Supabase", () => {
      setAuthenticatedState();
      const builder = createQueryBuilder();
      queryBuilders["profiles"] = builder;

      useAuthStore.getState().addFamilyMember(member);

      expect(mockFrom).toHaveBeenCalledWith("profiles");
      expect(builder.update).toHaveBeenCalledWith({
        family_members: [member],
      });
      expect(builder.eq).toHaveBeenCalledWith("id", "user-123");
    });

    it("does nothing if user is not set", () => {
      useAuthStore.setState({ authUser: mockAuthUser, user: null });

      useAuthStore.getState().addFamilyMember(member);

      // Should not throw or call supabase
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it("does nothing if authUser is not set", () => {
      useAuthStore.setState({ authUser: null, user: mockProfile });

      useAuthStore.getState().addFamilyMember(member);

      expect(mockFrom).not.toHaveBeenCalled();
    });

    it("appends to existing family members", () => {
      const existingMember: FamilyMember = {
        id: "fm-0",
        name: "Lakshman",
        relationship: "Brother",
      };
      setAuthenticatedState({
        user: { ...mockProfile, familyMembers: [existingMember] },
      });

      useAuthStore.getState().addFamilyMember(member);

      expect(useAuthStore.getState().user!.familyMembers).toHaveLength(2);
      expect(useAuthStore.getState().user!.familyMembers[0]).toEqual(existingMember);
      expect(useAuthStore.getState().user!.familyMembers[1]).toEqual(member);
    });
  });

  // ── 7. removeFamilyMember ──────────────────────────────────────────────────

  describe("removeFamilyMember", () => {
    const member1: FamilyMember = {
      id: "fm-1",
      name: "Sita",
      relationship: "Spouse",
    };
    const member2: FamilyMember = {
      id: "fm-2",
      name: "Lakshman",
      relationship: "Brother",
    };

    it("removes a family member by id", () => {
      setAuthenticatedState({
        user: { ...mockProfile, familyMembers: [member1, member2] },
      });
      const builder = createQueryBuilder();
      queryBuilders["profiles"] = builder;

      useAuthStore.getState().removeFamilyMember("fm-1");

      const members = useAuthStore.getState().user!.familyMembers;
      expect(members).toHaveLength(1);
      expect(members[0].id).toBe("fm-2");
    });

    it("persists removal to Supabase", () => {
      setAuthenticatedState({
        user: { ...mockProfile, familyMembers: [member1, member2] },
      });
      const builder = createQueryBuilder();
      queryBuilders["profiles"] = builder;

      useAuthStore.getState().removeFamilyMember("fm-1");

      expect(builder.update).toHaveBeenCalledWith({
        family_members: [member2],
      });
      expect(builder.eq).toHaveBeenCalledWith("id", "user-123");
    });

    it("does nothing if user is null", () => {
      useAuthStore.setState({ authUser: mockAuthUser, user: null });

      useAuthStore.getState().removeFamilyMember("fm-1");

      expect(mockFrom).not.toHaveBeenCalled();
    });

    it("does nothing if authUser is null", () => {
      useAuthStore.setState({ authUser: null, user: mockProfile });

      useAuthStore.getState().removeFamilyMember("fm-1");

      expect(mockFrom).not.toHaveBeenCalled();
    });

    it("handles removing non-existent member (no-op on list)", () => {
      setAuthenticatedState({
        user: { ...mockProfile, familyMembers: [member1] },
      });
      const builder = createQueryBuilder();
      queryBuilders["profiles"] = builder;

      useAuthStore.getState().removeFamilyMember("fm-999");

      // Still persists, just with same members minus the non-existent one
      expect(useAuthStore.getState().user!.familyMembers).toEqual([member1]);
    });
  });

  // ── 8. addBooking ──────────────────────────────────────────────────────────

  describe("addBooking", () => {
    it("adds booking to the beginning of the list", () => {
      const existingBooking = { ...sampleBooking, id: "bk-0" };
      useAuthStore.setState({ bookings: [existingBooking] });

      useAuthStore.getState().addBooking(sampleBooking);

      const bookings = useAuthStore.getState().bookings;
      expect(bookings).toHaveLength(2);
      expect(bookings[0].id).toBe("bk-1");
      expect(bookings[1].id).toBe("bk-0");
    });

    it("creates an activity for the booking", () => {
      useAuthStore.getState().addBooking(sampleBooking);

      const activities = useAuthStore.getState().activities;
      expect(activities).toHaveLength(1);
      expect(activities[0].type).toBe("booking");
      expect(activities[0].title).toBe("Booked Ganesh Pooja");
      expect(activities[0].description).toContain("2026-04-01");
      expect(activities[0].description).toContain("09:00");
      expect(activities[0].amount).toBe(51);
    });

    it("activity id starts with act-", () => {
      useAuthStore.getState().addBooking(sampleBooking);

      const activities = useAuthStore.getState().activities;
      expect(activities[0].id).toMatch(/^act-/);
    });
  });

  // ── 9. addDonation ─────────────────────────────────────────────────────────

  describe("addDonation", () => {
    it("adds donation to the beginning of the list", () => {
      const existing = { ...sampleDonation, id: "don-0" };
      useAuthStore.setState({ donations: [existing] });

      useAuthStore.getState().addDonation(sampleDonation);

      const donations = useAuthStore.getState().donations;
      expect(donations).toHaveLength(2);
      expect(donations[0].id).toBe("don-1");
    });

    it("creates an activity for the donation", () => {
      useAuthStore.getState().addDonation(sampleDonation);

      const activities = useAuthStore.getState().activities;
      expect(activities).toHaveLength(1);
      expect(activities[0].type).toBe("donation");
      expect(activities[0].title).toBe("Donated to General Fund");
      expect(activities[0].description).toContain("One-time");
      expect(activities[0].description).toContain("stripe");
      expect(activities[0].amount).toBe(108);
    });

    it("describes recurring donations correctly", () => {
      const recurringDonation: Donation = {
        ...sampleDonation,
        recurring: true,
        frequency: "monthly",
      };

      useAuthStore.getState().addDonation(recurringDonation);

      const activities = useAuthStore.getState().activities;
      expect(activities[0].description).toContain("Recurring");
    });

    it("persists donation to Supabase when authenticated", () => {
      setAuthenticatedState();
      const donationsBuilder = createQueryBuilder();
      const activitiesBuilder = createQueryBuilder();
      queryBuilders["donations"] = donationsBuilder;
      queryBuilders["activities"] = activitiesBuilder;

      useAuthStore.getState().addDonation(sampleDonation);

      expect(mockFrom).toHaveBeenCalledWith("donations");
      expect(donationsBuilder.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: "user-123",
          amount: 108,
          fund_type: "General Fund",
          payment_method: "stripe",
          payment_status: "completed",
          is_recurring: false,
          is_anonymous: false,
        })
      );

      expect(mockFrom).toHaveBeenCalledWith("activities");
      expect(activitiesBuilder.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: "user-123",
          type: "donation",
          title: "Donated to General Fund",
          amount: 108,
        })
      );
    });

    it("does not persist to Supabase when not authenticated", () => {
      useAuthStore.setState({ authUser: null });

      useAuthStore.getState().addDonation(sampleDonation);

      // Donation is still added to state
      expect(useAuthStore.getState().donations).toHaveLength(1);
      // But supabase is not called (from is not called for donations/activities)
      expect(mockFrom).not.toHaveBeenCalled();
    });
  });

  // ── 10. addActivity ────────────────────────────────────────────────────────

  describe("addActivity", () => {
    it("adds activity to the beginning of the list", () => {
      const existing: ActivityItem = { ...sampleActivity, id: "act-0" };
      useAuthStore.setState({ activities: [existing] });

      useAuthStore.getState().addActivity(sampleActivity);

      const activities = useAuthStore.getState().activities;
      expect(activities).toHaveLength(2);
      expect(activities[0].id).toBe("act-1");
      expect(activities[1].id).toBe("act-0");
    });

    it("can add different activity types", () => {
      const profileActivity: ActivityItem = {
        id: "act-pu",
        type: "profile_update",
        title: "Updated profile",
        description: "Changed name",
        date: "2026-03-01",
      };

      useAuthStore.getState().addActivity(profileActivity);

      expect(useAuthStore.getState().activities[0].type).toBe("profile_update");
    });
  });

  // ── 11. updateProfile ──────────────────────────────────────────────────────

  describe("updateProfile", () => {
    it("updates user state and calls Supabase", async () => {
      setAuthenticatedState();
      const builder = createQueryBuilder();
      queryBuilders["profiles"] = builder;

      await useAuthStore.getState().updateProfile({ name: "Shri Rama", gotra: "Vasishtha" });

      // Verify state update
      const user = useAuthStore.getState().user!;
      expect(user.name).toBe("Shri Rama");
      expect(user.gotra).toBe("Vasishtha");
      // Other fields remain
      expect(user.email).toBe("test@temple.org");

      // Verify Supabase call
      expect(builder.update).toHaveBeenCalledWith({
        name: "Shri Rama",
        gotra: "Vasishtha",
      });
      expect(builder.eq).toHaveBeenCalledWith("id", "user-123");
    });

    it("handles partial updates with only some fields", async () => {
      setAuthenticatedState();
      const builder = createQueryBuilder();
      queryBuilders["profiles"] = builder;

      await useAuthStore.getState().updateProfile({ phone: "5125559999" });

      expect(builder.update).toHaveBeenCalledWith({ phone: "5125559999" });
      expect(useAuthStore.getState().user!.phone).toBe("5125559999");
    });

    it("does nothing when authUser is null", async () => {
      useAuthStore.setState({ authUser: null, user: mockProfile });

      await useAuthStore.getState().updateProfile({ name: "Nobody" });

      expect(mockFrom).not.toHaveBeenCalled();
    });

    it("keeps user null if it was null before update", async () => {
      useAuthStore.setState({ authUser: mockAuthUser, user: null });
      const builder = createQueryBuilder();
      queryBuilders["profiles"] = builder;

      await useAuthStore.getState().updateProfile({ name: "Test" });

      // The set callback produces null when state.user is null
      expect(useAuthStore.getState().user).toBeNull();
    });

    it("handles all profile fields", async () => {
      setAuthenticatedState();
      const builder = createQueryBuilder();
      queryBuilders["profiles"] = builder;

      const allUpdates = {
        name: "New Name",
        email: "new@email.com",
        phone: "0000000000",
        gotra: "G",
        nakshatra: "N",
        rashi: "R",
        address: "456 Ave",
        city: "Dallas",
        state: "TX",
        zip: "75001",
      };

      await useAuthStore.getState().updateProfile(allUpdates);

      expect(builder.update).toHaveBeenCalledWith({
        name: "New Name",
        email: "new@email.com",
        phone: "0000000000",
        gotra: "G",
        nakshatra: "N",
        rashi: "R",
        address: "456 Ave",
        city: "Dallas",
        state: "TX",
        zip: "75001",
      });
    });
  });

  // ── 12. fetchUserData with existing profile ────────────────────────────────

  describe("fetchUserData", () => {
    it("fetches and maps profile from Supabase", async () => {
      useAuthStore.setState({ authUser: mockAuthUser, isAuthenticated: true });

      const profileBuilder = createQueryBuilder();
      profileBuilder.single.mockResolvedValue({
        data: {
          id: "user-123",
          name: "Rama",
          email: "test@temple.org",
          phone: "5125550000",
          avatar_url: "https://example.com/avatar.jpg",
          gotra: "Bharadvaja",
          nakshatra: "Ashwini",
          rashi: "Mesha",
          address: "123 Temple St",
          city: "Austin",
          state: "TX",
          zip: "78701",
          family_members: [{ id: "fm-1", name: "Sita", relationship: "Spouse" }],
          created_at: "2025-01-01T00:00:00.000Z",
        },
        error: null,
      });
      queryBuilders["profiles"] = profileBuilder;

      const bookingsBuilder = createQueryBuilder();
      bookingsBuilder.order.mockResolvedValue({
        data: [
          {
            id: "bk-1",
            services: { name: "Ganesh Pooja" },
            booking_date: "2026-04-01",
            booking_time: "09:00",
            status: "confirmed",
            total_amount: 51,
            devotee_name: "Devotee Name",
            priest_name: "Pandit Ji",
            created_at: "2026-03-01T00:00:00.000Z",
          },
        ],
      });
      queryBuilders["bookings"] = bookingsBuilder;

      const donationsBuilder = createQueryBuilder();
      donationsBuilder.order.mockResolvedValue({
        data: [
          {
            id: "don-abcdefgh-1234",
            fund_type: "Temple Construction",
            amount: 500,
            created_at: "2026-02-15T00:00:00.000Z",
            payment_method: "stripe",
            is_recurring: true,
          },
        ],
      });
      queryBuilders["donations"] = donationsBuilder;

      const activitiesBuilder = createQueryBuilder();
      activitiesBuilder.limit.mockResolvedValue({
        data: [
          {
            id: "act-abc",
            type: "login",
            title: "Logged in",
            description: "Session started",
            created_at: "2026-03-01T00:00:00.000Z",
            amount: null,
          },
        ],
      });
      queryBuilders["activities"] = activitiesBuilder;

      await useAuthStore.getState().fetchUserData();

      const state = useAuthStore.getState();

      // Profile
      expect(state.user).not.toBeNull();
      expect(state.user!.name).toBe("Rama");
      expect(state.user!.avatarUrl).toBe("https://example.com/avatar.jpg");
      expect(state.user!.familyMembers).toHaveLength(1);
      expect(state.user!.familyMembers[0].name).toBe("Sita");
      expect(state.user!.gotra).toBe("Bharadvaja");

      // Bookings
      expect(state.bookings).toHaveLength(1);
      expect(state.bookings[0].serviceName).toBe("Ganesh Pooja");
      expect(state.bookings[0].serviceEmoji).toBe("🙏");
      expect(state.bookings[0].date).toBe("2026-04-01");
      expect(state.bookings[0].time).toBe("09:00");
      expect(state.bookings[0].status).toBe("confirmed");
      expect(state.bookings[0].amount).toBe(51);
      expect(state.bookings[0].priest).toBe("Pandit Ji");
      expect(state.bookings[0].location).toBe("Temple");

      // Donations
      expect(state.donations).toHaveLength(1);
      expect(state.donations[0].fund).toBe("Temple Construction");
      expect(state.donations[0].amount).toBe(500);
      expect(state.donations[0].method).toBe("stripe");
      expect(state.donations[0].recurring).toBe(true);
      expect(state.donations[0].receiptId).toBe("REC-don-abcd");
      expect(state.donations[0].taxDeductible).toBe(true);

      // Activities
      expect(state.activities).toHaveLength(1);
      expect(state.activities[0].type).toBe("login");
      expect(state.activities[0].title).toBe("Logged in");
      expect(state.activities[0].amount).toBeUndefined();
    });

    it("verifies correct Supabase query construction", async () => {
      useAuthStore.setState({ authUser: mockAuthUser, isAuthenticated: true });

      const profileBuilder = createQueryBuilder();
      profileBuilder.single.mockResolvedValue({ data: null, error: null });
      queryBuilders["profiles"] = profileBuilder;

      const bookingsBuilder = createQueryBuilder();
      bookingsBuilder.order.mockResolvedValue({ data: null });
      queryBuilders["bookings"] = bookingsBuilder;

      const donationsBuilder = createQueryBuilder();
      donationsBuilder.order.mockResolvedValue({ data: null });
      queryBuilders["donations"] = donationsBuilder;

      const activitiesBuilder = createQueryBuilder();
      activitiesBuilder.limit.mockResolvedValue({ data: null });
      queryBuilders["activities"] = activitiesBuilder;

      await useAuthStore.getState().fetchUserData();

      // Profiles: from("profiles").select("*").eq("id", ...).single()
      expect(mockFrom).toHaveBeenCalledWith("profiles");
      expect(profileBuilder.select).toHaveBeenCalledWith("*");
      expect(profileBuilder.eq).toHaveBeenCalledWith("id", "user-123");

      // Bookings: from("bookings").select("*, services(name)").eq("user_id", ...).order(...)
      expect(mockFrom).toHaveBeenCalledWith("bookings");
      expect(bookingsBuilder.select).toHaveBeenCalledWith("*, services(name)");
      expect(bookingsBuilder.eq).toHaveBeenCalledWith("user_id", "user-123");
      expect(bookingsBuilder.order).toHaveBeenCalledWith("created_at", {
        ascending: false,
      });

      // Donations: from("donations").select("*").eq("user_id", ...).order(...)
      expect(mockFrom).toHaveBeenCalledWith("donations");
      expect(donationsBuilder.select).toHaveBeenCalledWith("*");

      // Activities: from("activities").select("*").eq("user_id", ...).order(...).limit(20)
      expect(mockFrom).toHaveBeenCalledWith("activities");
      expect(activitiesBuilder.limit).toHaveBeenCalledWith(20);
    });

    // ── 13. fetchUserData with no profile (fallback) ─────────────────────────

    it("creates fallback profile when no profile exists", async () => {
      useAuthStore.setState({ authUser: mockAuthUser, isAuthenticated: true });

      const profileBuilder = createQueryBuilder();
      profileBuilder.single.mockResolvedValue({ data: null, error: null });
      queryBuilders["profiles"] = profileBuilder;

      const bookingsBuilder = createQueryBuilder();
      bookingsBuilder.order.mockResolvedValue({ data: null });
      queryBuilders["bookings"] = bookingsBuilder;

      const donationsBuilder = createQueryBuilder();
      donationsBuilder.order.mockResolvedValue({ data: null });
      queryBuilders["donations"] = donationsBuilder;

      const activitiesBuilder = createQueryBuilder();
      activitiesBuilder.limit.mockResolvedValue({ data: null });
      queryBuilders["activities"] = activitiesBuilder;

      await useAuthStore.getState().fetchUserData();

      const user = useAuthStore.getState().user!;
      expect(user.id).toBe("user-123");
      expect(user.name).toBe("Rama"); // from user_metadata
      expect(user.email).toBe("test@temple.org"); // from authUser.email
      expect(user.phone).toBe("");
      expect(user.familyMembers).toEqual([]);
      expect(user.createdAt).toBe("2025-01-01T00:00:00.000Z");
    });

    it("fallback profile uses empty name when metadata is missing", async () => {
      const userNoMetadata = {
        ...mockAuthUser,
        user_metadata: {},
      };
      useAuthStore.setState({ authUser: userNoMetadata, isAuthenticated: true });

      const profileBuilder = createQueryBuilder();
      profileBuilder.single.mockResolvedValue({ data: null, error: null });
      queryBuilders["profiles"] = profileBuilder;

      const bookingsBuilder = createQueryBuilder();
      bookingsBuilder.order.mockResolvedValue({ data: null });
      queryBuilders["bookings"] = bookingsBuilder;

      const donationsBuilder = createQueryBuilder();
      donationsBuilder.order.mockResolvedValue({ data: null });
      queryBuilders["donations"] = donationsBuilder;

      const activitiesBuilder = createQueryBuilder();
      activitiesBuilder.limit.mockResolvedValue({ data: null });
      queryBuilders["activities"] = activitiesBuilder;

      await useAuthStore.getState().fetchUserData();

      expect(useAuthStore.getState().user!.name).toBe("");
    });

    it("does nothing when authUser is null", async () => {
      useAuthStore.setState({ authUser: null });

      await useAuthStore.getState().fetchUserData();

      expect(mockFrom).not.toHaveBeenCalled();
      expect(useAuthStore.getState().user).toBeNull();
    });

    it("handles booking with missing service name", async () => {
      useAuthStore.setState({ authUser: mockAuthUser, isAuthenticated: true });

      const profileBuilder = createQueryBuilder();
      profileBuilder.single.mockResolvedValue({ data: null, error: null });
      queryBuilders["profiles"] = profileBuilder;

      const bookingsBuilder = createQueryBuilder();
      bookingsBuilder.order.mockResolvedValue({
        data: [
          {
            id: "bk-2",
            services: null, // no joined service
            booking_date: "2026-05-01",
            booking_time: "10:00",
            status: "pending",
            total_amount: 25,
            devotee_name: null,
            created_at: "2026-04-01T00:00:00.000Z",
          },
        ],
      });
      queryBuilders["bookings"] = bookingsBuilder;

      const donationsBuilder = createQueryBuilder();
      donationsBuilder.order.mockResolvedValue({ data: null });
      queryBuilders["donations"] = donationsBuilder;

      const activitiesBuilder = createQueryBuilder();
      activitiesBuilder.limit.mockResolvedValue({ data: null });
      queryBuilders["activities"] = activitiesBuilder;

      await useAuthStore.getState().fetchUserData();

      expect(useAuthStore.getState().bookings[0].serviceName).toBe("Service");
    });

    it("handles donation with missing fund_type", async () => {
      useAuthStore.setState({ authUser: mockAuthUser, isAuthenticated: true });

      const profileBuilder = createQueryBuilder();
      profileBuilder.single.mockResolvedValue({ data: null, error: null });
      queryBuilders["profiles"] = profileBuilder;

      const bookingsBuilder = createQueryBuilder();
      bookingsBuilder.order.mockResolvedValue({ data: null });
      queryBuilders["bookings"] = bookingsBuilder;

      const donationsBuilder = createQueryBuilder();
      donationsBuilder.order.mockResolvedValue({
        data: [
          {
            id: "don-nullfund-999",
            fund_type: null,
            amount: 25,
            created_at: "2026-01-01T00:00:00.000Z",
            payment_method: "cash",
            is_recurring: false,
          },
        ],
      });
      queryBuilders["donations"] = donationsBuilder;

      const activitiesBuilder = createQueryBuilder();
      activitiesBuilder.limit.mockResolvedValue({ data: null });
      queryBuilders["activities"] = activitiesBuilder;

      await useAuthStore.getState().fetchUserData();

      expect(useAuthStore.getState().donations[0].fund).toBe("General");
    });

    it("maps activity amount correctly (null becomes undefined)", async () => {
      useAuthStore.setState({ authUser: mockAuthUser, isAuthenticated: true });

      const profileBuilder = createQueryBuilder();
      profileBuilder.single.mockResolvedValue({ data: null, error: null });
      queryBuilders["profiles"] = profileBuilder;

      const bookingsBuilder = createQueryBuilder();
      bookingsBuilder.order.mockResolvedValue({ data: null });
      queryBuilders["bookings"] = bookingsBuilder;

      const donationsBuilder = createQueryBuilder();
      donationsBuilder.order.mockResolvedValue({ data: null });
      queryBuilders["donations"] = donationsBuilder;

      const activitiesBuilder = createQueryBuilder();
      activitiesBuilder.limit.mockResolvedValue({
        data: [
          {
            id: "act-with-amt",
            type: "donation",
            title: "Donated",
            description: "Big donation",
            created_at: "2026-01-01T00:00:00.000Z",
            amount: 1000,
          },
          {
            id: "act-no-amt",
            type: "login",
            title: "Login",
            description: null,
            created_at: "2026-01-02T00:00:00.000Z",
            amount: null,
          },
        ],
      });
      queryBuilders["activities"] = activitiesBuilder;

      await useAuthStore.getState().fetchUserData();

      const activities = useAuthStore.getState().activities;
      expect(activities[0].amount).toBe(1000);
      expect(activities[0].description).toBe("Big donation");
      expect(activities[1].amount).toBeUndefined();
      expect(activities[1].description).toBe("");
    });

    it("maps profile row with missing optional fields", async () => {
      useAuthStore.setState({ authUser: mockAuthUser, isAuthenticated: true });

      const profileBuilder = createQueryBuilder();
      profileBuilder.single.mockResolvedValue({
        data: {
          id: "user-123",
          name: null,
          email: null,
          phone: null,
          avatar_url: null,
          gotra: null,
          nakshatra: null,
          rashi: null,
          address: null,
          city: null,
          state: null,
          zip: null,
          family_members: null,
          created_at: null,
        },
        error: null,
      });
      queryBuilders["profiles"] = profileBuilder;

      const bookingsBuilder = createQueryBuilder();
      bookingsBuilder.order.mockResolvedValue({ data: null });
      queryBuilders["bookings"] = bookingsBuilder;

      const donationsBuilder = createQueryBuilder();
      donationsBuilder.order.mockResolvedValue({ data: null });
      queryBuilders["donations"] = donationsBuilder;

      const activitiesBuilder = createQueryBuilder();
      activitiesBuilder.limit.mockResolvedValue({ data: null });
      queryBuilders["activities"] = activitiesBuilder;

      await useAuthStore.getState().fetchUserData();

      const user = useAuthStore.getState().user!;
      expect(user.name).toBe("");
      expect(user.email).toBe("");
      expect(user.phone).toBe("");
      expect(user.avatarUrl).toBeUndefined();
      expect(user.gotra).toBeUndefined();
      expect(user.nakshatra).toBeUndefined();
      expect(user.rashi).toBeUndefined();
      expect(user.address).toBeUndefined();
      expect(user.city).toBeUndefined();
      expect(user.state).toBeUndefined();
      expect(user.zip).toBeUndefined();
      expect(user.familyMembers).toEqual([]);
      // created_at should fall back to current date
      expect(user.createdAt).toBeTruthy();
    });
  });
});
