"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Calendar as CalendarIcon, ArrowRight } from "lucide-react";
import { supabase } from "@/lib/supabase";

type EventRow = {
  id: string;
  title: string;
  start_date: string;
  event_type: string;
  location: string | null;
  is_recurring: boolean;
};

function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * "Today" in the temple's timezone (America/Chicago). A devotee viewing
 * from India otherwise sees their local today as highlighted, which can
 * be a day ahead of the temple and off-by-one for festival highlighting.
 */
function todayInTempleTz(): string {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  // en-CA emits YYYY-MM-DD, matching our event date format exactly.
  return fmt.format(new Date());
}

function monthLabel(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function eventsByDate(events: EventRow[]): Record<string, EventRow[]> {
  const map: Record<string, EventRow[]> = {};
  for (const e of events) {
    (map[e.start_date] ||= []).push(e);
  }
  return map;
}

export function HomeTempleCalendar() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  // Date-dependent state is initialized after mount so SSR HTML (which uses
  // build-time "today") always matches the client's first render. See React
  // error #425 — cursor/monthLabel previously diverged when the client
  // viewed a build from a prior month.
  const [cursor, setCursor] = useState<Date | null>(null);

  useEffect(() => {
    const d = new Date();
    setCursor(new Date(d.getFullYear(), d.getMonth(), 1));
  }, []);

  useEffect(() => {
    if (!cursor) return;
    async function load() {
      if (!supabase || !cursor) {
        setLoading(false);
        return;
      }
      const start = new Date(cursor);
      const end = new Date(cursor);
      end.setMonth(end.getMonth() + 1);
      end.setDate(end.getDate() + 7); // spill into next month for upcoming list
      const { data } = await supabase
        .from("events")
        .select("id, title, start_date, event_type, location, is_recurring")
        .gte("start_date", ymd(start))
        .lte("start_date", ymd(end))
        .order("start_date", { ascending: true });
      setEvents((data ?? []) as EventRow[]);
      setLoading(false);
    }
    load();
  }, [cursor]);

  if (!cursor) {
    return (
      <section className="bg-temple-cream py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="font-accent text-sm font-semibold tracking-[0.2em] uppercase text-temple-gold">
              Temple Calendar
            </p>
            <h2 className="mt-2 section-heading">Upcoming Events &amp; Festivals</h2>
            <div className="ornament-divider"><span>&#x2733;</span></div>
          </div>
        </div>
      </section>
    );
  }

  const map = eventsByDate(events);
  const firstOfMonth = new Date(cursor);
  const lastOfMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
  const startWeekday = firstOfMonth.getDay();
  const daysInMonth = lastOfMonth.getDate();
  const cells: Array<{ day: number | null; dateStr: string | null }> = [];
  for (let i = 0; i < startWeekday; i++) cells.push({ day: null, dateStr: null });
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = ymd(new Date(cursor.getFullYear(), cursor.getMonth(), d));
    cells.push({ day: d, dateStr });
  }
  while (cells.length % 7 !== 0) cells.push({ day: null, dateStr: null });

  const todayStr = todayInTempleTz();

  // Next 5 upcoming events (today or later).
  const upcoming = events
    .filter((e) => e.start_date >= todayStr)
    .slice(0, 5);

  return (
    <section className="bg-temple-cream py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="font-accent text-sm font-semibold tracking-[0.2em] uppercase text-temple-gold">
            Temple Calendar
          </p>
          <h2 className="mt-2 section-heading">Upcoming Events &amp; Festivals</h2>
          <div className="ornament-divider"><span>&#x2733;</span></div>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-5">
          {/* Mini month grid */}
          <div className="lg:col-span-3">
            <div className="rounded-2xl border border-temple-gold/20 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() =>
                    setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))
                  }
                  className="rounded-md p-2 text-temple-maroon hover:bg-temple-gold/10"
                  aria-label="Previous month"
                >
                  &larr;
                </button>
                <h3 className="font-heading text-xl font-bold text-temple-maroon">
                  {monthLabel(cursor)}
                </h3>
                <button
                  type="button"
                  onClick={() =>
                    setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))
                  }
                  className="rounded-md p-2 text-temple-maroon hover:bg-temple-gold/10"
                  aria-label="Next month"
                >
                  &rarr;
                </button>
              </div>

              <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs font-semibold uppercase text-gray-500">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                  <div key={d}>{d}</div>
                ))}
              </div>

              <div className="mt-2 grid grid-cols-7 gap-1">
                {cells.map((cell, i) => {
                  if (!cell.day) return <div key={i} className="aspect-square" />;
                  const hasEvent = !!map[cell.dateStr!]?.length;
                  const isToday = cell.dateStr === todayStr;
                  return (
                    <Link
                      key={i}
                      href={`/calendar#${cell.dateStr}`}
                      className={`flex aspect-square flex-col items-center justify-center rounded-lg text-sm transition-colors ${
                        isToday
                          ? "bg-temple-maroon text-temple-gold-light font-bold"
                          : hasEvent
                            ? "bg-temple-gold/15 text-temple-maroon font-semibold hover:bg-temple-gold/25"
                            : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <span>{cell.day}</span>
                      {hasEvent && !isToday && (
                        <span className="mt-0.5 h-1 w-1 rounded-full bg-temple-gold" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Side list */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-temple-gold/20 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 text-temple-maroon">
                <CalendarIcon className="h-5 w-5 text-temple-gold" />
                <h3 className="font-heading text-lg font-bold">Next Up</h3>
              </div>

              <div className="mt-4 space-y-3">
                {loading ? (
                  <p className="text-sm text-gray-500">Loading…</p>
                ) : upcoming.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    No events scheduled yet. Check back soon.
                  </p>
                ) : (
                  upcoming.map((e) => (
                    <Link
                      key={e.id}
                      href={`/calendar#${e.start_date}`}
                      className="block rounded-lg border border-gray-100 p-3 transition-colors hover:border-temple-gold/50 hover:bg-temple-gold/5"
                    >
                      <p className="text-xs font-semibold uppercase tracking-wider text-temple-gold">
                        {new Date(`${e.start_date}T00:00:00`).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                      <p className="mt-1 font-semibold text-temple-maroon">{e.title}</p>
                      {e.location && (
                        <p className="mt-0.5 text-xs text-gray-500">{e.location}</p>
                      )}
                    </Link>
                  ))
                )}
              </div>

              <Link
                href="/calendar"
                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-temple-red hover:underline"
              >
                Full Calendar
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
