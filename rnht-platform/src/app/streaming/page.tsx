import type { Metadata } from "next";
import { Bell, Calendar, MessageCircle, Video, Youtube } from "lucide-react";
import { canonicalPath } from "@/lib/site-metadata";

export const metadata: Metadata = {
  title: "Live Darshan & Streaming",
  description:
    "Live darshan, festival streams, and recordings from Rudra Narayana Hindu Temple. Subscribe on YouTube to get notified when we go live.",
  alternates: {
    canonical: canonicalPath("/streaming"),
  },
};

const dailySchedule = [
  {
    name: "Morning Aarti & Suprabhatam",
    time: "Daily 7:00 AM - 7:30 AM CT",
    detail:
      "Start your day with the morning aarti and Suprabhatam from the main sanctum.",
  },
  {
    name: "Evening Aarti & Deeparadhana",
    time: "Daily 7:00 PM - 7:30 PM CT",
    detail:
      "Evening Deeparadhana ceremony — the divine light offering to the deities.",
  },
];

const upcomingHighlights = [
  {
    name: "Festival darshan and special pujas",
    detail:
      "We stream major festivals and special pujas live. Schedule is announced ahead of each festival on our YouTube channel and WhatsApp group.",
  },
];

const youtubeChannelUrl =
  "https://www.youtube.com/@rudranarayanahindutemple";
// The temple's WhatsApp GROUP invite (same as the home page). The old
// wa.me/message/... link opened a 1:1 chat with the priest, not the broadcast
// group this "Join the WhatsApp updates" CTA describes.
const whatsappGroupUrl = "https://chat.whatsapp.com/KLh44fIVck13OSEokGIfAa";

export default function StreamingPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="text-center">
        <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full border border-temple-gold/25 bg-temple-gold/10">
          <Video className="h-7 w-7 text-temple-red" />
        </div>
        <h1 className="mt-4 section-heading">Live Darshan &amp; Streaming</h1>
        <p className="mx-auto mt-3 max-w-2xl text-gray-600">
          Watch live aarti, festival celebrations, and special ceremonies from
          RNHT. We stream on YouTube. Subscribe to be notified the moment we go
          live.
        </p>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <a
          href={youtubeChannelUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-4 rounded-2xl border border-temple-gold/15 bg-gradient-to-br from-temple-ivory to-[#FFF8E7]/70 p-5 shadow-premium transition-all duration-300 hover:-translate-y-1 hover:border-temple-gold/35 hover:shadow-premium-lg"
        >
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-red-600 text-white">
            <Youtube className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <p className="font-heading text-lg font-bold text-temple-maroon">
              Subscribe on YouTube
            </p>
            <p className="text-sm text-gray-600">
              Get notified each time we start a live darshan.
            </p>
          </div>
        </a>

        <a
          href={whatsappGroupUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-4 rounded-2xl border border-temple-gold/15 bg-gradient-to-br from-temple-ivory to-[#FFF8E7]/70 p-5 shadow-premium transition-all duration-300 hover:-translate-y-1 hover:border-temple-gold/35 hover:shadow-premium-lg"
        >
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-green-600 text-white">
            <MessageCircle className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <p className="font-heading text-lg font-bold text-temple-maroon">
              Join the WhatsApp updates
            </p>
            <p className="text-sm text-gray-600">
              Festival timings and live-stream reminders sent ahead of time.
            </p>
          </div>
        </a>
      </div>

      <section className="mt-12">
        <h2 className="flex items-center gap-2 font-heading text-xl font-bold text-temple-maroon">
          <Calendar className="h-5 w-5 text-temple-gold" />
          Regular live darshan schedule
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {dailySchedule.map((item) => (
            <div
              key={item.name}
              className="rounded-2xl border border-temple-gold/15 bg-white p-5 shadow-premium"
            >
              <p className="font-heading text-lg font-bold text-temple-maroon">
                {item.name}
              </p>
              <p className="mt-1 text-sm font-semibold text-temple-gold-deep">
                {item.time}
              </p>
              <p className="mt-2 text-sm text-gray-600">{item.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="flex items-center gap-2 font-heading text-xl font-bold text-temple-maroon">
          <Bell className="h-5 w-5 text-temple-gold" />
          Festival &amp; special streams
        </h2>
        <div className="mt-4 space-y-3">
          {upcomingHighlights.map((item) => (
            <div
              key={item.name}
              className="rounded-2xl border border-temple-gold/15 bg-temple-ivory/50 p-5"
            >
              <p className="font-heading text-base font-bold text-temple-maroon">
                {item.name}
              </p>
              <p className="mt-2 text-sm text-gray-600">{item.detail}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm text-gray-500">
          Past recordings live on our{" "}
          <a
            href={youtubeChannelUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-temple-red hover:underline"
          >
            YouTube channel
          </a>
          .
        </p>
      </section>
    </div>
  );
}
