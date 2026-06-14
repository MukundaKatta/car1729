import { Calendar, Clock, MapPin, Users, CalendarPlus, Repeat } from "lucide-react";
import type { Event } from "@/types/database";
import { formatDate } from "@/lib/utils";
import { describeRecurrence } from "@/lib/recurrence";

const eventTypeColors: Record<
  string,
  { bg: string; text: string; dot: string }
> = {
  festival: {
    bg: "bg-amber-50",
    text: "text-amber-800",
    dot: "bg-amber-500",
  },
  regular_pooja: {
    bg: "bg-red-50",
    text: "text-red-800",
    dot: "bg-red-500",
  },
  community: {
    bg: "bg-green-50",
    text: "text-green-800",
    dot: "bg-green-500",
  },
  class: { bg: "bg-blue-50", text: "text-blue-800", dot: "bg-blue-500" },
};

const eventTypeLabels: Record<string, string> = {
  festival: "Festival",
  regular_pooja: "Regular Pooja",
  community: "Community",
  class: "Class",
};

function buildGoogleCalendarUrl(event: Event): string {
  const startDate = event.start_date.replace(/-/g, "");
  const endDate = event.end_date
    ? event.end_date.replace(/-/g, "")
    : startDate;

  let dates = `${startDate}/${endDate}`;
  if (event.start_time && event.end_time) {
    const startTime = event.start_time.replace(/:/g, "") + "00";
    const endTime = event.end_time.replace(/:/g, "") + "00";
    dates = `${startDate}T${startTime}/${endDate || startDate}T${endTime}`;
  }

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates,
    details: event.description || "",
    location: event.location || "Rudra Narayana Hindu Temple, Austin, TX",
    // Interpret the (floating) event times in the temple's timezone, so the
    // event lands at the correct local time regardless of the viewer's zone.
    ctz: "America/Chicago",
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function EventCard({ event }: { event: Event }) {
  const colors =
    eventTypeColors[event.event_type] || eventTypeColors.community;

  // For recurring events the start_date is only the first occurrence, so it
  // goes stale ("March 14" forever). Show the cadence instead; fall back to the
  // absolute date if the rule is missing/unparseable.
  const cadence = event.is_recurring
    ? describeRecurrence(event.recurrence_rule)
    : null;

  return (
    <article className="card overflow-hidden group">
      <div
        className={`flex items-center gap-2 px-4 py-2 ${colors.bg} ${colors.text}`}
      >
        <span className={`h-2 w-2 rounded-full ${colors.dot}`} aria-hidden="true" />
        <span className="text-xs font-semibold uppercase tracking-wide">
          {eventTypeLabels[event.event_type]}
        </span>
        {event.is_recurring && (
          <span className="ml-auto text-xs opacity-60">Recurring</span>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-heading text-lg font-bold text-gray-900 group-hover:text-temple-red transition-colors">
          {event.title}
        </h3>
        {event.description && (
          <p className="mt-2 text-sm text-gray-600 line-clamp-3">
            {event.description}
          </p>
        )}
        <div className="mt-4 space-y-2 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            {cadence ? (
              <>
                <Repeat className="h-4 w-4" aria-hidden="true" />
                <span>{cadence}</span>
              </>
            ) : (
              <>
                <Calendar className="h-4 w-4" aria-hidden="true" />
                <span>{formatDate(event.start_date)}</span>
              </>
            )}
          </div>
          {event.start_time && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" aria-hidden="true" />
              <span>
                {event.start_time}
                {event.end_time && ` - ${event.end_time}`}
              </span>
            </div>
          )}
          {event.location && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" aria-hidden="true" />
              <span>{event.location}</span>
            </div>
          )}
        </div>
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {event.rsvp_enabled && (
              <span className="flex items-center gap-1 text-sm text-gray-500">
                <Users className="h-4 w-4" aria-hidden="true" />
                {event.rsvp_count} attending
              </span>
            )}
          </div>
          <div className="flex gap-2">
            {!event.is_recurring && (
              <a
                href={buildGoogleCalendarUrl(event)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                aria-label={`Add ${event.title} to Google Calendar`}
              >
                <CalendarPlus className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Add to Cal</span>
              </a>
            )}
            {event.rsvp_enabled && (
              <button className="rounded-lg bg-temple-red px-4 py-1.5 text-xs font-semibold text-white hover:bg-temple-red-dark transition-colors">
                RSVP
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
