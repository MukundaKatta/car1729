"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Calendar,
  BookOpen,
  DollarSign,
  TrendingUp,
  Clock,
  Newspaper,
  HeartHandshake,
  Users as UsersIcon,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { formatCurrency } from "@/lib/utils";

type Stats = {
  totalBookings: number;
  donationRevenueYtd: number;
  serviceRevenueYtd: number;
  activeServices: number;
};

type RecentBooking = {
  id: string;
  devotee_name: string;
  booking_date: string;
  total_amount: number;
  status: string;
  service_name: string | null;
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-green-100 text-green-800",
  completed: "bg-blue-100 text-blue-800",
  cancelled: "bg-red-100 text-red-800",
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recent, setRecent] = useState<RecentBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!supabase) {
        setLoading(false);
        return;
      }
      setLoadError(null);
      try {
      const year = new Date().getFullYear();
      const yearStart = `${year}-01-01`;

      const [bookingsTotal, donationsYtd, serviceRevenueYtd, activeServices, recentBookings] =
        await Promise.all([
          supabase.from("bookings").select("id", { count: "exact", head: true }),
          supabase
            .from("donations")
            .select("amount")
            .eq("payment_status", "completed")
            .gte("created_at", yearStart),
          supabase
            .from("bookings")
            .select("total_amount")
            .eq("payment_status", "paid")
            .gte("created_at", yearStart),
          supabase.from("services").select("id", { count: "exact", head: true }).eq("is_active", true),
          supabase
            .from("bookings")
            .select("id, devotee_name, booking_date, total_amount, status, services(name)")
            .order("created_at", { ascending: false })
            .limit(5),
        ]);

      const donationSum = (donationsYtd.data ?? []).reduce((a, r) => a + Number(r.amount ?? 0), 0);
      const serviceSum = (serviceRevenueYtd.data ?? []).reduce((a, r) => a + Number(r.total_amount ?? 0), 0);

      setStats({
        totalBookings: bookingsTotal.count ?? 0,
        donationRevenueYtd: donationSum,
        serviceRevenueYtd: serviceSum,
        activeServices: activeServices.count ?? 0,
      });

      const recentRows = (recentBookings.data ?? []).map((r) => {
        // Supabase types the joined relation loosely; defensively narrow.
        const rel = (r as unknown as { services: { name: string } | { name: string }[] | null }).services;
        const serviceName = Array.isArray(rel) ? (rel[0]?.name ?? null) : (rel?.name ?? null);
        return {
          id: r.id as string,
          devotee_name: (r.devotee_name as string) ?? "",
          booking_date: (r.booking_date as string) ?? "",
          total_amount: Number(r.total_amount ?? 0),
          status: (r.status as string) ?? "pending",
          service_name: serviceName,
        };
      });
      setRecent(recentRows);
      } catch (e) {
        // Without this, a single rejected query would skip setLoading(false)
        // and leave the dashboard stuck on the loading skeletons forever.
        console.error("Admin dashboard load failed:", e);
        setLoadError(
          "Could not load dashboard data. Please check your connection and reload."
        );
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const statCards = stats
    ? [
        {
          label: "Total Bookings",
          value: String(stats.totalBookings),
          icon: BookOpen,
          color: "text-blue-600 bg-blue-50",
        },
        {
          label: "Donations (YTD)",
          value: formatCurrency(stats.donationRevenueYtd),
          icon: DollarSign,
          color: "text-green-600 bg-green-50",
        },
        {
          label: "Service Revenue (YTD)",
          value: formatCurrency(stats.serviceRevenueYtd),
          icon: TrendingUp,
          color: "text-amber-600 bg-amber-50",
        },
        {
          label: "Active Services",
          value: String(stats.activeServices),
          icon: LayoutDashboard,
          color: "text-purple-600 bg-purple-50",
        },
      ]
    : [];

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-heading flex items-center gap-2">
            <LayoutDashboard className="h-8 w-8 text-temple-red" />
            Admin Dashboard
          </h1>
          <p className="mt-1 text-gray-600">
            Manage temple services, bookings, events, and donations
          </p>
        </div>
      </div>

      {loadError && (
        <div role="alert" className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {loadError}
        </div>
      )}

      {/* Stats */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="card h-28 animate-pulse p-5" />
            ))
          : statCards.map((stat) => (
              <div key={stat.label} className="card p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">{stat.label}</p>
                    <p className="mt-1 text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`rounded-lg p-3 ${stat.color}`}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                </div>
              </div>
            ))}
      </div>

      {/* Quick Links */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <QuickLink
          href="/admin/news"
          icon={<Newspaper className="h-8 w-8 text-temple-gold" />}
          title="News & Updates"
          subtitle="Publish festivals and announcements"
        />
        <QuickLink
          href="/admin/services"
          icon={<LayoutDashboard className="h-8 w-8 text-temple-gold" />}
          title="Manage Services"
          subtitle="Add, edit, or remove services"
        />
        <QuickLink
          href="/admin/donations"
          icon={<DollarSign className="h-8 w-8 text-temple-gold" />}
          title="Donations"
          subtitle="Types, inflow, and reporting"
        />
        <QuickLink
          href="/admin/priests"
          icon={<UsersIcon className="h-8 w-8 text-temple-gold" />}
          title="Priests"
          subtitle="Manage priest profiles and routing"
        />
        <QuickLink
          href="/admin/volunteers"
          icon={<HeartHandshake className="h-8 w-8 text-temple-gold" />}
          title="Volunteers"
          subtitle="Volunteer groups and WhatsApp links"
        />
        <QuickLink
          href="/admin/events"
          icon={<Calendar className="h-8 w-8 text-temple-gold" />}
          title="Manage Events"
          subtitle="Temple calendar and festivals"
        />
        <QuickLink
          href="/admin/bookings"
          icon={<BookOpen className="h-8 w-8 text-temple-gold" />}
          title="View Bookings"
          subtitle="Track all service bookings"
        />
      </div>

      {/* Recent Bookings */}
      <div className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-heading font-bold text-gray-900">
            Recent Bookings
          </h2>
          <Link href="/admin/bookings" className="text-sm text-temple-red hover:underline">
            View all
          </Link>
        </div>
        <div className="mt-4 overflow-x-auto rounded-xl border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Booking</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Service</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 hidden sm:table-cell">Devotee</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 hidden md:table-cell">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-500">
                    Loading…
                  </td>
                </tr>
              ) : recent.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-500">
                    No bookings yet.
                  </td>
                </tr>
              ) : (
                recent.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-900">{b.id.slice(0, 8)}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{b.service_name ?? "—"}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 hidden sm:table-cell">{b.devotee_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 hidden md:table-cell">{b.booking_date}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                      {formatCurrency(b.total_amount)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          statusColors[b.status] ?? "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Today's Schedule — purely informational, keep as static for now */}
      <div className="mt-10">
        <h2 className="text-xl font-heading font-bold text-gray-900 flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Today&apos;s Schedule
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          Wire this up once an availability / schedule source is defined.
        </p>
      </div>
    </div>
  );
}

function QuickLink({
  href,
  icon,
  title,
  subtitle,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <Link href={href} className="card flex items-center gap-4 p-5 hover:border-temple-gold">
      {icon}
      <div>
        <p className="font-semibold text-gray-900">{title}</p>
        <p className="text-sm text-gray-500">{subtitle}</p>
      </div>
    </Link>
  );
}
