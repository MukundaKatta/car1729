"use client";

import { useState, useEffect } from "react";
import { Video, Calendar, Clock, Bell, MessageSquare, Play } from "lucide-react";

const liveStreams = [
  {
    id: "live-1",
    title: "Morning Aarti & Suprabhatam",
    schedule: "Daily 7:00 AM - 7:30 AM CST",
    description: "Start your day with the divine morning aarti and Suprabhatam at RNHT. Live from the main sanctum.",
    isLive: true,
    viewers: 34,
  },
  {
    id: "live-2",
    title: "Evening Aarti & Deeparadhana",
    schedule: "Daily 7:00 PM - 7:30 PM CST",
    description: "Join the evening Deeparadhana ceremony live. Experience the divine light offering to all deities.",
    isLive: false,
    viewers: 0,
  },
];

// Compute dynamic countdown
function computeCountdown(dateStr: string): string {
  const target = new Date(dateStr + "T00:00:00");
  const now = new Date();
  const diffMs = target.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return "past event";
  if (diffDays === 0) return "today";
  if (diffDays === 1) return "tomorrow";
  return `${diffDays} days`;
}

const upcomingStreamsData = [
  { id: "up-1", title: "Ugadi Special Abhishekam", date: "2026-03-29", displayDate: "March 29, 2026", time: "9:00 AM CST" },
  { id: "up-2", title: "Sri Rama Navami — Sita Rama Kalyanotsavam", date: "2026-04-07", displayDate: "April 7, 2026", time: "8:00 AM CST" },
  { id: "up-3", title: "Hanuman Jayanti Celebrations", date: "2026-04-13", displayDate: "April 13, 2026", time: "6:00 AM CST" },
];

// Drop streams whose scheduled date is already in the past so the "Upcoming
// Streams" panel never labels stale events as "in past event".
function futureOnly(streams: typeof upcomingStreamsData): typeof upcomingStreamsData {
  const now = new Date();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return streams.filter((s) => new Date(s.date + "T00:00:00") >= todayMidnight);
}

const pastRecordings = [
  { id: "rec-1", title: "Maha Shivaratri 2026 — Full Night Program", date: "Feb 27, 2026", duration: "6:45:00", views: 1240 },
  { id: "rec-2", title: "Pongal / Makar Sankranti 2026", date: "Jan 14, 2026", duration: "3:20:00", views: 890 },
  { id: "rec-3", title: "New Year Special Pooja 2026", date: "Jan 1, 2026", duration: "2:15:00", views: 650 },
  { id: "rec-4", title: "Diwali 2025 — Lakshmi Pooja & Fireworks", date: "Oct 20, 2025", duration: "4:30:00", views: 2100 },
  { id: "rec-5", title: "Ganesh Chaturthi 2025 — Visarjan", date: "Sep 7, 2025", duration: "2:45:00", views: 1560 },
];

export default function StreamingPage() {
  // Compute after mount so SSR and client agree on which streams are upcoming.
  const [upcomingStreams, setUpcomingStreams] = useState<typeof upcomingStreamsData>([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [chatMessages, setChatMessages] = useState([
    { user: "DevoteeR", color: "text-blue-600", text: "Om Namah Shivaya!" },
    { user: "PriyaS", color: "text-green-600", text: "Beautiful aarti today" },
    { user: "VenkatK", color: "text-purple-600", text: "Har Har Mahadev!" },
    { user: "MeeraJ", color: "text-red-600", text: "Jai Sri Ram" },
  ]);

  useEffect(() => {
    setUpcomingStreams(futureOnly(upcomingStreamsData));
  }, []);

  const handleSendChat = () => {
    if (!chatMessage.trim()) return;
    setChatMessages((prev) => [...prev, { user: "You", color: "text-temple-red", text: chatMessage.trim() }]);
    setChatMessage("");
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="text-center">
        <Video className="mx-auto h-10 w-10 text-temple-red" />
        <h1 className="mt-4 section-heading">Live Darshan & Streaming</h1>
        <p className="mt-3 mx-auto max-w-2xl text-gray-600">
          Experience the divine from anywhere. Watch live aarti, festival celebrations,
          and special ceremonies streamed directly from RNHT.
        </p>
      </div>

      {/* Live Streams */}
      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {liveStreams.map((stream) => (
            <div key={stream.id} className="card overflow-hidden mb-6">
              {/* Video Player Area */}
              <div className="relative flex aspect-video items-center justify-center bg-gray-900">
                {stream.isLive ? (
                  <>
                    <a
                      href="https://www.youtube.com/@rudranarayanahindutemple/live"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-center text-white transition-opacity hover:opacity-90"
                    >
                      <Play className="mx-auto h-16 w-16" />
                      <p className="mt-2 text-sm font-semibold">
                        Watch live on YouTube
                      </p>
                      <p className="text-xs opacity-70">Opens in a new tab</p>
                    </a>
                    <div className="absolute left-4 top-4 flex items-center gap-2">
                      <span className="flex items-center gap-1 rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white">
                        <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
                        LIVE
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="text-center text-gray-400">
                    <Clock className="mx-auto h-12 w-12" />
                    <p className="mt-2 text-sm">Next stream: {stream.schedule}</p>
                  </div>
                )}
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-heading text-lg font-bold text-gray-900">
                      {stream.title}
                    </h3>
                    <p className="text-sm text-gray-500">{stream.schedule}</p>
                  </div>
                  {stream.isLive && (
                    <button
                      className="btn-outline flex items-center gap-2 text-sm"
                      onClick={() => setChatOpen(!chatOpen)}
                    >
                      <MessageSquare className="h-4 w-4" />
                      Chat
                    </button>
                  )}
                </div>
                <p className="mt-2 text-sm text-gray-600">{stream.description}</p>
                <div className="mt-3 flex gap-2">
                  <button className="flex items-center gap-1 rounded-lg bg-temple-cream px-3 py-1.5 text-xs font-medium text-temple-maroon hover:bg-temple-gold/20" onClick={() => alert("Reminder set! We'll notify you before the stream begins.")}>
                    <Bell className="h-3.5 w-3.5" /> Set Reminder
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar — Chat / Upcoming */}
        <div className="space-y-6">
          {/* Live Chat */}
          {chatOpen && (
            <div className="card overflow-hidden">
              <div className="bg-gray-900 px-4 py-3 text-sm font-semibold text-white flex items-center justify-between">
                <span>Live Chat</span>
                <button onClick={() => setChatOpen(false)} className="text-gray-400 hover:text-white text-xs">
                  Close
                </button>
              </div>
              <div className="h-48 sm:h-64 overflow-y-auto p-3 space-y-2 text-sm bg-gray-50">
                {chatMessages.map((msg, i) => (
                  <div key={i}><span className={`font-semibold ${msg.color}`}>{msg.user}:</span> {msg.text}</div>
                ))}
              </div>
              <div className="border-t p-3">
                <div className="flex gap-2">
                  <input type="text" className="input-field flex-1 text-sm" placeholder="Type a message..." aria-label="Chat message" value={chatMessage} onChange={(e) => setChatMessage(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") handleSendChat(); }} />
                  <button className="btn-primary text-sm py-2 px-3" onClick={handleSendChat}>Send</button>
                </div>
              </div>
            </div>
          )}

          {/* Upcoming Streams */}
          <div className="card p-5">
            <h3 className="font-heading text-lg font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-temple-red" />
              Upcoming Streams
            </h3>
            <div className="mt-4 space-y-4">
              {upcomingStreams.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No streams on the schedule right now. Subscribe on YouTube to be notified when we go live.
                </p>
              ) : (
                upcomingStreams.map((stream) => (
                  <div key={stream.id} className="border-b border-gray-100 pb-3 last:border-0">
                    <h4 className="text-sm font-semibold text-gray-900">{stream.title}</h4>
                    <p className="text-xs text-gray-500">{stream.displayDate} at {stream.time}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                        in {computeCountdown(stream.date)}
                      </span>
                      <button className="flex items-center gap-1 text-xs text-temple-red hover:underline" onClick={() => alert("Reminder set! We'll notify you before the stream begins.")}>
                        <Bell className="h-3 w-3" /> Remind me
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Subscribe / Follow */}
          <div className="card p-5 bg-temple-cream/40">
            <h3 className="font-heading text-sm font-bold text-temple-maroon">
              Never miss a stream
            </h3>
            <p className="mt-2 text-xs text-gray-600">
              Subscribe on YouTube to be notified when we go live.
            </p>
            <a
              href="https://www.youtube.com/@rudranarayanahindutemple"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary mt-3 inline-flex w-full items-center justify-center gap-2 text-sm"
            >
              <Video className="h-4 w-4" />
              Subscribe on YouTube
            </a>
          </div>
        </div>
      </div>

      {/* Past Recordings */}
      <div className="mt-12">
        <h2 className="section-heading">Past Recordings</h2>
        <p className="mt-2 text-gray-600">Watch recordings of past festivals, ceremonies, and special events.</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pastRecordings.map((rec) => (
            <div key={rec.id} className="card overflow-hidden cursor-pointer" onClick={() => alert("Full recording playback coming soon!")}>
              <div className="relative flex h-36 items-center justify-center bg-gray-800">
                <Play className="h-10 w-10 text-white/50" />
                <span className="absolute bottom-2 right-2 rounded bg-black/70 px-2 py-0.5 text-xs text-white">
                  {rec.duration}
                </span>
              </div>
              <div className="p-4">
                <h3 className="text-sm font-semibold text-gray-900 line-clamp-2">{rec.title}</h3>
                <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                  <span>{rec.date}</span>
                  <span>{rec.views.toLocaleString()} views</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
