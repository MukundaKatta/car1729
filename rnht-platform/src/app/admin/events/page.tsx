"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Edit2, Trash2 } from "lucide-react";
import { sampleEvents } from "@/lib/sample-data";
import { EventCard } from "@/components/calendar/EventCard";
import type { Event } from "@/types/database";

const eventTypeLabels: Record<string, string> = {
  festival: "Festival",
  regular_pooja: "Regular Pooja",
  community: "Community Event",
  class: "Class",
};

export default function AdminEventsPage() {
  const [events, setEvents] = useState<Event[]>(sampleEvents);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  const deleteEvent = (id: string) => {
    if (confirm("Are you sure you want to delete this event?")) {
      setEvents((prev) => prev.filter((e) => e.id !== id));
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/admin"
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-temple-red"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        <strong>Note:</strong> Changes made here are local only and will not persist after page refresh. Full database-backed admin coming soon.
      </div>

      <div className="mt-4 flex items-center justify-between">
        <h1 className="section-heading">Manage Events</h1>
        <button
          className="btn-primary flex items-center gap-2"
          onClick={() => {
            setEditingEvent(null);
            setShowForm(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Add Event
        </button>
      </div>

      {/* Events Table */}
      <div className="mt-8 overflow-x-auto rounded-xl border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                Event
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">
                Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">
                Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">
                RSVPs
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {events.map((event) => (
              <tr key={event.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <p className="text-sm font-medium text-gray-900">
                    {event.title}
                  </p>
                  <p className="text-xs text-gray-500 line-clamp-1">
                    {event.description}
                  </p>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 hidden sm:table-cell">
                  {eventTypeLabels[event.event_type]}
                  {event.is_recurring && (
                    <span className="ml-1 text-xs text-gray-400">
                      (recurring)
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 hidden md:table-cell">
                  {event.start_date}
                  {event.start_time && ` at ${event.start_time}`}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 hidden md:table-cell">
                  {event.rsvp_enabled ? event.rsvp_count : "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => {
                        setEditingEvent(event);
                        setShowForm(true);
                      }}
                      className="rounded p-1 text-gray-400 hover:bg-blue-50 hover:text-blue-600"
                      aria-label={`Edit ${event.title}`}
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteEvent(event.id)}
                      className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                      aria-label={`Delete ${event.title}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Event Modal */}
      {showForm && (
        <EventFormModal
          event={editingEvent}
          onClose={() => setShowForm(false)}
          onSave={(event) => {
            if (editingEvent) {
              setEvents((prev) =>
                prev.map((e) => (e.id === event.id ? event : e))
              );
            } else {
              setEvents((prev) => [...prev, event]);
            }
            setShowForm(false);
          }}
        />
      )}
    </div>
  );
}

function EventFormModal({
  event,
  onClose,
  onSave,
}: {
  event: Event | null;
  onClose: () => void;
  onSave: (event: Event) => void;
}) {
  const isEditing = !!event;
  const [title, setTitle] = useState(event?.title ?? "");
  const [description, setDescription] = useState(event?.description ?? "");
  const [eventType, setEventType] = useState<string>(
    event?.event_type ?? "festival"
  );
  const [startDate, setStartDate] = useState(event?.start_date ?? "");
  const [startTime, setStartTime] = useState(event?.start_time ?? "");
  const [endTime, setEndTime] = useState(event?.end_time ?? "");
  const [location, setLocation] = useState(
    event?.location ?? "RNHT Main Temple Hall"
  );
  const [rsvpEnabled, setRsvpEnabled] = useState(event?.rsvp_enabled ?? true);

  const handleSave = () => {
    const newEvent: Event = {
      id: event?.id ?? `evt-${Date.now()}`,
      title,
      description,
      event_type: eventType as Event["event_type"],
      start_date: startDate,
      end_date: event?.end_date ?? startDate,
      start_time: startTime || null,
      end_time: endTime || null,
      location,
      image_url: event?.image_url ?? null,
      is_recurring: event?.is_recurring ?? false,
      recurrence_rule: event?.recurrence_rule ?? null,
      rsvp_enabled: rsvpEnabled,
      rsvp_count: event?.rsvp_count ?? 0,
      created_at: event?.created_at ?? new Date().toISOString(),
    };
    onSave(newEvent);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <h2 className="font-heading text-xl font-bold text-gray-900">
          {isEditing ? "Edit Event" : "Add New Event"}
        </h2>
        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Event Title *
            </label>
            <input
              type="text"
              className="input-field mt-1"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              className="input-field mt-1"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Event Type
              </label>
              <select
                className="input-field mt-1"
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
              >
                <option value="festival">Festival</option>
                <option value="regular_pooja">Regular Pooja</option>
                <option value="community">Community Event</option>
                <option value="class">Class</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Date *
              </label>
              <input
                type="date"
                className="input-field mt-1"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Start Time
              </label>
              <input
                type="time"
                className="input-field mt-1"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                End Time
              </label>
              <input
                type="time"
                className="input-field mt-1"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Location
            </label>
            <input
              type="text"
              className="input-field mt-1"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={rsvpEnabled}
              onChange={(e) => setRsvpEnabled(e.target.checked)}
              className="rounded text-temple-red"
            />
            <span className="text-sm text-gray-700">Enable RSVP</span>
          </label>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button className="btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn-primary"
            onClick={handleSave}
            disabled={!title || !startDate}
          >
            {isEditing ? "Save Changes" : "Add Event"}
          </button>
        </div>
      </div>
    </div>
  );
}
