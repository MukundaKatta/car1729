"use client";

import { useState, useMemo, useEffect } from "react";
import { sampleEvents } from "@/lib/sample-data";
import { EventCard } from "@/components/calendar/EventCard";
import { supabase } from "@/lib/supabase";

const eventTypes = [
  { value: "all", label: "All Events" },
  { value: "festival", label: "Festivals" },
  { value: "regular_pooja", label: "Regular Poojas" },
  { value: "community", label: "Community" },
  { value: "class", label: "Classes" },
];

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// "Today" in YYYY-MM-DD format, same shape as event.start_date. Comparing
// "YYYY-MM-DD" strings lexicographically matches chronological order.
function todayYmd(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function CalendarPage() {
  const [filterType, setFilterType] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [view, setView] = useState<"list" | "calendar">("list");
  // Month-grid: tapping a day shows its events below the grid — the in-cell
  // text chips are unreadable at phone cell widths, so they're dots on mobile.
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  // Load the live events table (admin-managed), same source the homepage uses.
  // Falls back to the bundled sample events when the backend is empty/down.
  const [events, setEvents] = useState(sampleEvents);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    async function loadEvents() {
      if (!supabase) {
        if (!cancelled) setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("start_date", { ascending: true });
      if (!cancelled && !error && data && data.length) {
        setEvents(data as typeof sampleEvents);
      }
      if (!cancelled) setLoading(false);
    }
    loadEvents();
    return () => {
      cancelled = true;
    };
  }, []);

  // List view surfaces upcoming events (today onward) and recurring series
  // (weekly bhajans, monthly vratams). Calendar view keeps the month grid
  // so devotees can still scroll through past months for reference.
  const filteredEvents = useMemo(() => {
    const today = todayYmd();
    return events
      .filter((event) => {
        if (filterType !== "all" && event.event_type !== filterType) return false;
        if (view === "list") {
          if (!event.is_recurring && event.start_date < today) return false;
        }
        return true;
      })
      .sort((a, b) => a.start_date.localeCompare(b.start_date));
  }, [filterType, view, events]);

  // Calendar grid
  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(selectedYear, selectedMonth, 1).getDay();
  const calendarDays = Array.from({ length: 42 }, (_, i) => {
    const dayNum = i - firstDayOfMonth + 1;
    if (dayNum < 1 || dayNum > daysInMonth) return null;
    return dayNum;
  });

  const getEventsForDay = (day: number) => {
    const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return events.filter((e) => {
      if (e.start_date !== dateStr) return false;
      if (filterType !== "all" && e.event_type !== filterType) return false;
      return true;
    });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="section-heading">Temple Calendar</h1>
        <p className="mt-3 text-gray-600">
          Stay connected with festivals, poojas, community events, and classes
        </p>
      </div>

      {/* Controls */}
      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {eventTypes.map((type) => (
            <button
              key={type.value}
              onClick={() => setFilterType(type.value)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                filterType === type.value
                  ? "bg-temple-red text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setView("list")}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              view === "list"
                ? "bg-temple-red text-white"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            List
          </button>
          <button
            onClick={() => setView("calendar")}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              view === "calendar"
                ? "bg-temple-red text-white"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            Calendar
          </button>
        </div>
      </div>

      {view === "calendar" && loading && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="h-11 w-11 animate-pulse rounded-lg bg-temple-ivory" />
            <div className="h-7 w-40 animate-pulse rounded bg-temple-ivory" />
            <div className="h-11 w-11 animate-pulse rounded-lg bg-temple-ivory" />
          </div>
          <div className="rounded-xl border border-gray-200 overflow-hidden">
            <div className="grid grid-cols-7 gap-px bg-gray-200">
              {Array.from({ length: 42 }).map((_, i) => (
                <div
                  key={i}
                  className="min-h-[48px] animate-pulse bg-temple-ivory sm:min-h-[80px]"
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {view === "calendar" && !loading && (
        <div className="mt-6">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => {
                setSelectedDay(null);
                if (selectedMonth === 0) {
                  setSelectedMonth(11);
                  setSelectedYear((y) => y - 1);
                } else {
                  setSelectedMonth((m) => m - 1);
                }
              }}
              className="btn-outline min-h-[44px] min-w-[44px] px-3 py-1"
              aria-label="Previous month"
            >
              &larr;
            </button>
            <h3 className="text-xl font-heading font-bold">
              {months[selectedMonth]} {selectedYear}
            </h3>
            <button
              onClick={() => {
                setSelectedDay(null);
                if (selectedMonth === 11) {
                  setSelectedMonth(0);
                  setSelectedYear((y) => y + 1);
                } else {
                  setSelectedMonth((m) => m + 1);
                }
              }}
              className="btn-outline min-h-[44px] min-w-[44px] px-3 py-1"
              aria-label="Next month"
            >
              &rarr;
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="rounded-xl border border-gray-200 overflow-hidden overflow-x-auto">
            <div className="grid grid-cols-7 bg-gray-50 text-center text-xs font-semibold text-gray-600">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <div key={d} className="py-2">
                  <span className="sm:hidden">{d[0]}</span><span className="hidden sm:inline">{d}</span>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-px bg-gray-200">
              {calendarDays.map((day, idx) => {
                const events = day ? getEventsForDay(day) : [];
                const isSelected = day !== null && selectedDay === day;
                return (
                  <div
                    key={idx}
                    role={day && events.length ? "button" : undefined}
                    tabIndex={day && events.length ? 0 : undefined}
                    onClick={() =>
                      day && events.length && setSelectedDay(isSelected ? null : day)
                    }
                    onKeyDown={(e) => {
                      if (day && events.length && (e.key === "Enter" || e.key === " ")) {
                        e.preventDefault();
                        setSelectedDay(isSelected ? null : day);
                      }
                    }}
                    className={`min-h-[48px] bg-white p-1 sm:min-h-[80px] ${!day ? "bg-gray-50" : ""} ${
                      events.length ? "cursor-pointer" : ""
                    } ${isSelected ? "ring-2 ring-inset ring-temple-gold" : ""}`}
                  >
                    {day && (
                      <>
                        <span className="text-xs text-gray-700 sm:text-sm">{day}</span>
                        {/* Phones: dots (titles are unreadable at ~50px cell widths) */}
                        <div className="mt-1 flex flex-wrap gap-0.5 sm:hidden">
                          {events.map((event) => (
                            <span
                              key={event.id}
                              className={`h-2 w-2 rounded-full ${
                                event.event_type === "festival"
                                  ? "bg-amber-500"
                                  : event.event_type === "regular_pooja"
                                    ? "bg-red-500"
                                    : event.event_type === "community"
                                      ? "bg-green-500"
                                      : "bg-blue-500"
                              }`}
                            />
                          ))}
                        </div>
                        {/* sm+: text chips */}
                        <div className="mt-1 hidden space-y-1 sm:block">
                          {events.map((event) => (
                            <div
                              key={event.id}
                              className={`truncate rounded px-1 py-0.5 text-[10px] font-medium ${
                                event.event_type === "festival"
                                  ? "bg-amber-100 text-amber-800"
                                  : event.event_type === "regular_pooja"
                                    ? "bg-red-100 text-red-800"
                                    : event.event_type === "community"
                                      ? "bg-green-100 text-green-800"
                                      : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              {event.title}
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Tapped-day detail (primary on phones; harmless on desktop) */}
            {selectedDay !== null && getEventsForDay(selectedDay).length > 0 && (
              <div className="border-t border-gray-200 bg-temple-cream/40 p-4">
                <p className="text-sm font-semibold text-temple-maroon">
                  {months[selectedMonth]} {selectedDay}, {selectedYear}
                </p>
                <div className="mt-2 space-y-2">
                  {getEventsForDay(selectedDay).map((event) => (
                    <div key={event.id} className="flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2 text-sm">
                      <span className="font-medium text-gray-800">{event.title}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                          event.event_type === "festival"
                            ? "bg-amber-100 text-amber-800"
                            : event.event_type === "regular_pooja"
                              ? "bg-red-100 text-red-800"
                              : event.event_type === "community"
                                ? "bg-green-100 text-green-800"
                                : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {event.event_type.replace("_", " ")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Event List */}
      {view === "list" && loading && (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-2xl bg-temple-ivory" />
          ))}
        </div>
      )}

      {view === "list" && !loading && (
        filteredEvents.length > 0 ? (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <p className="mt-12 text-center text-gray-500">
            No upcoming events in this category right now. Check back soon or
            switch to the month view to browse other dates.
          </p>
        )
      )}
    </div>
  );
}
