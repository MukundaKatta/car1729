export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string;
          email: string;
          phone: string | null;
          avatar_url: string | null;
          gotra: string | null;
          nakshatra: string | null;
          rashi: string | null;
          address: string | null;
          city: string | null;
          state: string | null;
          zip: string | null;
          family_members: FamilyMember[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          email: string;
          phone?: string | null;
          avatar_url?: string | null;
          gotra?: string | null;
          nakshatra?: string | null;
          rashi?: string | null;
          address?: string | null;
          city?: string | null;
          state?: string | null;
          zip?: string | null;
          family_members?: FamilyMember[] | null;
        };
        Update: {
          name?: string;
          email?: string;
          phone?: string | null;
          avatar_url?: string | null;
          gotra?: string | null;
          nakshatra?: string | null;
          rashi?: string | null;
          address?: string | null;
          city?: string | null;
          state?: string | null;
          zip?: string | null;
          family_members?: FamilyMember[] | null;
        };
      };
      activities: {
        Row: {
          id: string;
          user_id: string;
          type: "booking" | "donation" | "login" | "profile_update";
          title: string;
          description: string | null;
          amount: number | null;
          created_at: string;
        };
        Insert: {
          user_id: string;
          type: "booking" | "donation" | "login" | "profile_update";
          title: string;
          description?: string | null;
          amount?: number | null;
        };
        Update: {
          user_id?: string;
          type?: "booking" | "donation" | "login" | "profile_update";
          title?: string;
          description?: string | null;
          amount?: number | null;
        };
      };
      service_categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          icon: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          name: string;
          slug: string;
          description?: string | null;
          icon?: string | null;
          sort_order: number;
        };
        Update: Partial<{
          name: string;
          slug: string;
          description: string | null;
          icon: string | null;
          sort_order: number;
        }>;
      };
      services: {
        Row: {
          id: string;
          category_id: string;
          name: string;
          slug: string;
          short_description: string;
          full_description: string | null;
          significance: string | null;
          items_to_bring: string[] | null;
          whats_included: string[] | null;
          image_url: string | null;
          price: number | null;
          price_type: "fixed" | "tiered" | "custom" | "donation";
          price_tiers: PriceTier[] | null;
          suggested_donation: number | null;
          duration_minutes: number;
          location_type: "at_temple" | "outside_temple" | "both";
          is_active: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          category_id: string;
          name: string;
          slug: string;
          short_description: string;
          full_description?: string | null;
          significance?: string | null;
          items_to_bring?: string[] | null;
          whats_included?: string[] | null;
          image_url?: string | null;
          price?: number | null;
          price_type: "fixed" | "tiered" | "custom" | "donation";
          price_tiers?: PriceTier[] | null;
          suggested_donation?: number | null;
          duration_minutes: number;
          location_type: "at_temple" | "outside_temple" | "both";
          is_active: boolean;
          sort_order: number;
        };
        Update: Partial<{
          category_id: string;
          name: string;
          slug: string;
          short_description: string;
          full_description: string | null;
          significance: string | null;
          items_to_bring: string[] | null;
          whats_included: string[] | null;
          image_url: string | null;
          price: number | null;
          price_type: "fixed" | "tiered" | "custom" | "donation";
          price_tiers: PriceTier[] | null;
          suggested_donation: number | null;
          duration_minutes: number;
          location_type: "at_temple" | "outside_temple" | "both";
          is_active: boolean;
          sort_order: number;
        }>;
      };
      bookings: {
        Row: {
          id: string;
          user_id: string | null;
          service_id: string;
          booking_date: string;
          booking_time: string;
          status: "pending" | "confirmed" | "completed" | "cancelled";
          devotee_name: string;
          devotee_email: string;
          devotee_phone: string | null;
          gotra: string | null;
          nakshatra: string | null;
          rashi: string | null;
          special_instructions: string | null;
          family_members: FamilyMember[] | null;
          total_amount: number;
          payment_status: "pending" | "paid" | "refunded";
          payment_intent_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id?: string | null;
          service_id: string;
          booking_date: string;
          booking_time: string;
          status: "pending" | "confirmed" | "completed" | "cancelled";
          devotee_name: string;
          devotee_email: string;
          devotee_phone?: string | null;
          gotra?: string | null;
          nakshatra?: string | null;
          rashi?: string | null;
          special_instructions?: string | null;
          family_members?: FamilyMember[] | null;
          total_amount: number;
          payment_status: "pending" | "paid" | "refunded";
          payment_intent_id?: string | null;
        };
        Update: Partial<{
          user_id: string | null;
          service_id: string;
          booking_date: string;
          booking_time: string;
          status: "pending" | "confirmed" | "completed" | "cancelled";
          devotee_name: string;
          devotee_email: string;
          devotee_phone: string | null;
          gotra: string | null;
          nakshatra: string | null;
          rashi: string | null;
          special_instructions: string | null;
          family_members: FamilyMember[] | null;
          total_amount: number;
          payment_status: "pending" | "paid" | "refunded";
          payment_intent_id: string | null;
        }>;
      };
      events: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          event_type: "festival" | "regular_pooja" | "community" | "class";
          start_date: string;
          end_date: string | null;
          start_time: string | null;
          end_time: string | null;
          location: string | null;
          image_url: string | null;
          is_recurring: boolean;
          recurrence_rule: string | null;
          rsvp_enabled: boolean;
          rsvp_count: number;
          created_at: string;
        };
        Insert: {
          title: string;
          description?: string | null;
          event_type: "festival" | "regular_pooja" | "community" | "class";
          start_date: string;
          end_date?: string | null;
          start_time?: string | null;
          end_time?: string | null;
          location?: string | null;
          image_url?: string | null;
          is_recurring: boolean;
          recurrence_rule?: string | null;
          rsvp_enabled: boolean;
        };
        Update: Partial<{
          title: string;
          description: string | null;
          event_type: "festival" | "regular_pooja" | "community" | "class";
          start_date: string;
          end_date: string | null;
          start_time: string | null;
          end_time: string | null;
          location: string | null;
          image_url: string | null;
          is_recurring: boolean;
          recurrence_rule: string | null;
          rsvp_enabled: boolean;
        }>;
      };
      donations: {
        Row: {
          id: string;
          user_id: string | null;
          donor_name: string;
          donor_email: string;
          amount: number;
          fund_type: string;
          payment_method: "stripe" | "paypal" | "zelle";
          payment_status: "pending" | "completed" | "failed" | "refunded";
          is_recurring: boolean;
          message: string | null;
          is_anonymous: boolean;
          created_at: string;
        };
        Insert: {
          user_id?: string | null;
          donor_name: string;
          donor_email: string;
          amount: number;
          fund_type: string;
          payment_method: "stripe" | "paypal" | "zelle";
          payment_status: "pending" | "completed" | "failed" | "refunded";
          is_recurring: boolean;
          message?: string | null;
          is_anonymous: boolean;
        };
        Update: Partial<{
          user_id: string | null;
          donor_name: string;
          donor_email: string;
          amount: number;
          fund_type: string;
          payment_method: "stripe" | "paypal" | "zelle";
          payment_status: "pending" | "completed" | "failed" | "refunded";
          is_recurring: boolean;
          message: string | null;
          is_anonymous: boolean;
        }>;
      };
    };
    Views: Record<string, never>;
    Functions: {
      // Visitor counter (migration 015_site_visits). Both are SECURITY DEFINER:
      // record_visit is callable by anon/authenticated and returns nothing;
      // visit_stats is admin-only and returns a single aggregate row.
      record_visit: {
        Args: { p_visitor: string; p_path: string; p_platform?: "web" | "app" };
        Returns: undefined;
      };
      visit_stats: {
        Args: Record<string, never>;
        Returns: {
          today: number;
          last_7_days: number;
          last_30_days: number;
          all_time: number;
          unique_30_days: number;
          app_30_days: number;
        }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type PriceTier = {
  name: string;
  price: number;
  description: string;
};

export type FamilyMember = {
  name: string;
  gotra?: string;
  nakshatra?: string;
  relationship?: string;
};

export type Service = Database["public"]["Tables"]["services"]["Row"];
export type ServiceCategory =
  Database["public"]["Tables"]["service_categories"]["Row"];
export type Booking = Database["public"]["Tables"]["bookings"]["Row"];
export type Event = Database["public"]["Tables"]["events"]["Row"];
export type Donation = Database["public"]["Tables"]["donations"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type ActivityRow = Database["public"]["Tables"]["activities"]["Row"];

// ---- Added in migration-002-feature-package ----
// We don't encode these into the Database shape (it's an incomplete stub)
// — just export plain types used by the feature code.

export type NewsPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body_markdown: string;
  hero_image_url: string | null;
  category: "announcement" | "festival" | "update" | "event";
  is_published: boolean;
  published_at: string | null;
  author_id: string | null;
  created_at: string;
  updated_at: string;
};

export type Priest = {
  id: string;
  name: string;
  title: string;
  bio: string;
  image_url: string | null;
  phone: string | null;
  whatsapp_url: string | null;
  email: string | null;
  years_experience: number | null;
  specializations: string[];
  languages: string[];
  is_head: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type VolunteerOpportunity = {
  id: string;
  title: string;
  description: string;
  whatsapp_group_url: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  schedule: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type DonationTypeCustomField = {
  key: string;
  label: string;
  type: "text" | "number";
  required?: boolean;
};

export type DonationType = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  custom_fields: DonationTypeCustomField[];
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ServicePdf = {
  id: string;
  file_name: string;
  storage_path: string;
  public_url: string;
  uploaded_by: string | null;
  is_current: boolean;
  is_active: boolean;
  created_at: string;
};
