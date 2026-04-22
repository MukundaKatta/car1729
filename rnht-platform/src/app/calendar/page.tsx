"use client";

import { useState, useMemo } from "react";
import { sampleEvents } from "@/lib/sample-data";
import { EventCard } from "@/components/calendar/EventCard";

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

  // List view surfaces upcoming events (today onward) and recurring series
  // (weekly bhajans, monthly vratams). Calendar view keeps the month grid
  // so devotees can still scroll through past months for reference.
  const filteredEvents = useMemo(() => {
    const today = todayYmd();
    return sampleEvents
      .filter((event) => {
        if (filterType !== "all" && event.event_type !== filterType) return false;
        if (view === "list") {
          if (!event.is_recurring && event.start_date < today) return false;
        }
        return true;
      })
      .sort((a, b) => a.start_date.localeCompare(b.start_date));
  }, [filterType, view]);

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
    return sampleEvents.filter((e) => {
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

      {view === "calendar" && (
        <div className="mt-6">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => {
                if (selectedMonth === 0) {
                  setSelectedMonth(11);
                  setSelectedYear((y) => y - 1);
                } else {
                  setSelectedMonth((m) => m - 1);
                }
              }}
              className="btn-outline px-3 py-1"
              aria-label="Previous month"
            >
              &larr;
            </button>
            <h3 className="text-xl font-heading font-bold">
              {months[selectedMonth]} {selectedYear}
            </h3>
            <button
              onClick={() => {
                if (selectedMonth === 11) {
                  setSelectedMonth(0);
                  setSelectedYear((y) => y + 1);
                } else {
                  setSelectedMonth((m) => m + 1);
                }
              }}
              className="btn-outline px-3 py-1"
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
                return (
                  <div
                    key={idx}
                    className={`min-h-[48px] sm:min-h-[80px] bg-white p-1 ${!day ? "bg-gray-50" : ""}`}
                  >
                    {day && (
                      <>
                        <span className="text-xs sm:text-sm text-gray-700">{day}</span>
                        <div className="mt-1 space-y-1">
                          {events.map((event) => (
                            <div
                              key={event.id}
                              className={`truncate rounded px-1 py-0.5 text-[8px] sm:text-[10px] font-medium ${
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
          </div>
        </div>
      )}

      {/* Event List */}
      {view === "list" && (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}
