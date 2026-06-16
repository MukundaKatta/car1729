"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

type Booking = {
  id: string;
  service: string;
  devotee: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  amount: number;
  status: string;
  gotra: string;
  nakshatra: string;
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-green-100 text-green-800",
  completed: "bg-blue-100 text-blue-800",
  cancelled: "bg-red-100 text-red-800",
};

export default function AdminBookingsPage() {
  const [bookingsData, setBookingsData] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  async function refresh() {
    if (!supabase) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("bookings")
      .select(
        "id, devotee_name, devotee_email, devotee_phone, booking_date, booking_time, status, total_amount, gotra, nakshatra, services(name)"
      )
      .order("created_at", { ascending: false });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    const rows = (data ?? []).map((r) => {
      // Supabase types the joined relation loosely; defensively narrow.
      const rel = (r as unknown as { services: { name: string } | { name: string }[] | null }).services;
      const serviceName = Array.isArray(rel) ? (rel[0]?.name ?? null) : (rel?.name ?? null);
      const row = r as Record<string, unknown>;
      return {
        id: row.id as string,
        service: serviceName ?? "—",
        devotee: (row.devotee_name as string) ?? "",
        email: (row.devotee_email as string) ?? "",
        phone: (row.devotee_phone as string) ?? "",
        date: (row.booking_date as string) ?? "",
        time: (row.booking_time as string) ?? "",
        amount: Number(row.total_amount ?? 0),
        status: (row.status as string) ?? "pending",
        gotra: (row.gotra as string) ?? "",
        nakshatra: (row.nakshatra as string) ?? "",
      };
    });
    setBookingsData(rows);
    setError(null);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  // Escape key handler and body scroll lock for booking modal
  useEffect(() => {
    if (!selectedBooking) return;
    document.body.style.overflow = "hidden";
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedBooking(null);
    };
    document.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKey);
    };
  }, [selectedBooking]);

  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    if (!supabase) return;
    // Select the updated row back so we can confirm a row was actually written.
    // Without this, an UPDATE that matches zero rows (e.g. a missing admin RLS
    // policy silently filtering the row) returns no error, and the optimistic UI
    // below would falsely show the booking as confirmed/cancelled while nothing
    // persisted — the change vanishes on reload.
    const { data, error } = await supabase
      .from("bookings")
      .update({ status: newStatus })
      .eq("id", bookingId)
      .select("id");
    if (error) {
      setError(error.message);
      return;
    }
    if (!data || data.length === 0) {
      setError(
        "The booking status could not be saved (no row was updated). You may not have permission to change this booking. Please reload and try again."
      );
      return;
    }
    setBookingsData((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b))
    );
    setSelectedBooking((prev) =>
      prev && prev.id === bookingId ? { ...prev, status: newStatus } : prev
    );
  };

  const filteredBookings = bookingsData.filter((b) => {
    if (filterStatus !== "all" && b.status !== filterStatus) return false;
    if (
      searchQuery &&
      !b.devotee.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !b.id.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !b.service.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/admin"
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-temple-red"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      <h1 className="mt-4 section-heading">Booking Management</h1>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Search & Filters */}
      <div className="mt-6 flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            aria-label="Search bookings by name, ID, or service"
            placeholder="Search by name, ID, or service..."
            className="input-field pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select
          aria-label="Filter bookings by status"
          className="input-field w-40"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Bookings Table */}
      <div className="mt-6 overflow-x-auto rounded-xl border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                Booking ID
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                Service
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">
                Devotee
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">
                Date & Time
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                Amount
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-sm text-gray-500">
                  Loading…
                </td>
              </tr>
            ) : filteredBookings.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-sm text-gray-500">
                  No bookings found.
                </td>
              </tr>
            ) : (
              filteredBookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-mono text-gray-900">
                    {booking.id}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {booking.service}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 hidden sm:table-cell">
                    {booking.devotee}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 hidden md:table-cell">
                    {booking.date} at {booking.time}
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                    {formatCurrency(booking.amount)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[booking.status] ?? "bg-gray-100 text-gray-800"}`}
                    >
                      {booking.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setSelectedBooking(booking)}
                      className="text-sm text-temple-red hover:underline"
                      aria-label={`View booking ${booking.id}`}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" onClick={() => setSelectedBooking(null)}>
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-xl font-bold text-gray-900">
                Booking Details
              </h2>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setSelectedBooking(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                &times;
              </button>
            </div>
            <div className="mt-4 space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-gray-500">Booking ID</span>
                  <p className="font-mono font-semibold">
                    {selectedBooking.id}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Status</span>
                  <p>
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[selectedBooking.status] ?? "bg-gray-100 text-gray-800"}`}
                    >
                      {selectedBooking.status}
                    </span>
                  </p>
                </div>
              </div>
              <hr />
              <div>
                <span className="text-gray-500">Service</span>
                <p className="font-semibold">{selectedBooking.service}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-gray-500">Date</span>
                  <p>{selectedBooking.date}</p>
                </div>
                <div>
                  <span className="text-gray-500">Time</span>
                  <p>{selectedBooking.time}</p>
                </div>
              </div>
              <hr />
              <div>
                <span className="text-gray-500">Devotee</span>
                <p className="font-semibold">{selectedBooking.devotee}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-gray-500">Email</span>
                  <p>{selectedBooking.email}</p>
                </div>
                <div>
                  <span className="text-gray-500">Phone</span>
                  <p>{selectedBooking.phone}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-gray-500">Gotra</span>
                  <p>{selectedBooking.gotra}</p>
                </div>
                <div>
                  <span className="text-gray-500">Nakshatra</span>
                  <p>{selectedBooking.nakshatra}</p>
                </div>
              </div>
              <hr />
              <div>
                <span className="text-gray-500">Amount</span>
                <p className="text-xl font-bold text-temple-red">
                  {formatCurrency(selectedBooking.amount)}
                </p>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              {selectedBooking.status === "pending" && (
                <button
                  className="btn-primary flex-1"
                  onClick={() => updateBookingStatus(selectedBooking.id, "confirmed")}
                >
                  Confirm
                </button>
              )}
              {selectedBooking.status === "confirmed" && (
                <button
                  className="btn-primary flex-1"
                  onClick={() => updateBookingStatus(selectedBooking.id, "completed")}
                >
                  Mark Completed
                </button>
              )}
              {selectedBooking.status !== "cancelled" &&
                selectedBooking.status !== "completed" && (
                  <button
                    className="btn-outline flex-1 text-red-600 border-red-300 hover:bg-red-50"
                    onClick={() => updateBookingStatus(selectedBooking.id, "cancelled")}
                  >
                    Cancel
                  </button>
                )}
              <button
                className="btn-outline flex-1"
                onClick={() => setSelectedBooking(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
