import type { Metadata } from "next";
import {
  Phone,
  MapPin,
  Globe,
  BookOpen,
  MessageCircle,
} from "lucide-react";
import Link from "next/link";
import { canonicalPath } from "@/lib/site-metadata";

// First given name, skipping honorifics — so "Pt. Shri Aditya Sharma" -> "Aditya"
// (was naively name.split(" ")[1], which produced "Book with Shri").
function priestShortName(name: string): string {
  const honorifics = new Set(["pt", "pt.", "pandit", "shri", "sri", "sree", "smt", "smt."]);
  const parts = name.split(/\s+/).filter((p) => !honorifics.has(p.toLowerCase()));
  return parts[0] || name;
}

export const metadata: Metadata = {
  title: "Our Priests",
  description:
    "Meet the priests of Rudra Narayana Hindu Temple. Pt. Aditya Sharma (Founder) and Pt. Raghurama Sharma (Senior Priest) — experienced Vedic scholars serving Austin, TX.",
  alternates: {
    canonical: canonicalPath("/priests"),
  },
};

const priests = [
  {
    id: "priest-1",
    name: "Pt. Shri Aditya Sharma",
    title: "Founder & Head Priest",
    image: null,
    initials: "AS",
    experience: "20+ years",
    specialization: "Krishna Yajurvedam, Yajurveda Smartam, Vastu, Astrology",
    languages: ["English", "Telugu", "Tamil", "Hindi", "Sanskrit"],
    education: "Krishna Yajurvedam & Yajurveda Smartam — Andhra Pradesh, under Sri Vedanabhathla Sree Rama Murthy Garu",
    bio: "Pandit Shri Aditya Sharma is a highly respected Hindu priest with over 20 years of experience. Since 2013, he has been serving the Austin, Texas community, performing a wide range of pujas, from simple ceremonies to traditional weddings and various Homams/yagnas. He has also served as a senior priest at the Austin Hindu Temple for several years. Pandit Aditya Sharma is also the founder of Rudra Narayana Hindu Temple (RNHT), a cloud-based temple that aims to provide a global platform for spiritual growth, learning, and community building. He is passionate about teaching/mentoring kids in Purana Stotras.",
    services: ["All Poojas", "Weddings (Vivaham)", "Homams & Yagnas", "Gruhapravesam", "Upanayanam", "Vastu Consultation", "Jyotisham", "Muhoortham", "Stotra Classes for Kids"],
    availability: { atTemple: true, outsideTemple: true, online: true },
    phone: "(512) 545-0473",
    whatsapp: "https://wa.me/message/P3YRA2XY3GI7F1",
    stats: { experience: "20+ yrs", serving: "Since 2013", area: "Austin, TX" },
  },
  {
    id: "priest-2",
    name: "Pt. Shri Raghurama Sharma",
    title: "Senior Priest",
    image: null,
    initials: "RS",
    experience: "15+ years",
    specialization: "Krishna Yajurveda, Smartha Traditions, Panchadasa Karmas",
    languages: ["Telugu", "Tamil", "English"],
    education: "Krishna Yajur Veda under Sri Maddulapalli Suryanarayana Sharma Ghanapati Garu (Tirupati); Smartha from Sri Sannidhanam Sridhara Sharma Garu",
    bio: "Pandit Sri Raghurama Sharma is a distinguished Vedic scholar and priest with a rich background in Krishna Yajurveda and Smartha traditions. Prior to joining the Austin Hindu Temple in 2017, Panditji served as a Veda Pandit at Tirumala Tirupati Devasthanam and as a freelance priest at Srinivasa Swami Devasthanam, Nagole, Hyderabad. With over 15 years of expertise in Panchadasa Karmas, he has performed various rituals and cultural activities. He is passionate about mentoring kids in Purana Stotras, aiming to pass on the rich cultural heritage of Hinduism to the next generation.",
    services: ["All Poojas", "Panchadasa Karmas", "Weddings (Vivaham)", "Homams & Yagnas", "Cultural Activities", "Purana Stotras Mentoring"],
    availability: { atTemple: true, outsideTemple: true, online: false },
    phone: "(512) 998-0112",
    // His own number (was incorrectly pointing to Pt. Aditya's WhatsApp).
    whatsapp: "https://wa.me/15129980112",
    stats: { experience: "15+ yrs", serving: "Since 2017", area: "Texas" },
  },
];

export default function PriestsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="text-center">
        <BookOpen className="mx-auto h-10 w-10 text-temple-red" />
        <h1 className="mt-4 section-heading">Our Priests</h1>
        <p className="mt-3 mx-auto max-w-2xl text-gray-600">
          Our learned priests bring decades of Vedic knowledge and experience.
          Available for temple services, home ceremonies, and online consultations
          across the Austin, Texas area.
        </p>
      </div>

      <div className="mt-10 space-y-8">
        {priests.map((priest) => (
          <div key={priest.id} className="card overflow-hidden">
            <div className="flex flex-col md:flex-row">
              {/* Left — Profile */}
              <div className="flex flex-col items-center bg-gradient-to-b from-temple-cream to-white p-8 md:w-64 lg:w-72">
                {priest.image ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={priest.image}
                    alt={priest.name}
                    className="h-40 w-36 rounded-xl object-cover shadow-md ring-1 ring-temple-gold/30"
                  />
                ) : (
                  <div className="flex h-40 w-36 items-center justify-center rounded-xl bg-temple-red text-4xl font-heading font-bold text-white shadow-md ring-1 ring-temple-gold/30">
                    {priest.initials}
                  </div>
                )}
                <h2 className="mt-4 text-center font-heading text-xl font-bold text-gray-900">
                  {priest.name}
                </h2>
                <p className="text-sm text-temple-red font-semibold">{priest.title}</p>
                <p className="mt-1 text-xs text-gray-500">{priest.experience} experience</p>

                <div className="mt-4 flex flex-wrap justify-center gap-1">
                  {priest.languages.map((lang) => (
                    <span key={lang} className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
                      {lang}
                    </span>
                  ))}
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  {Object.entries(priest.stats).map(([key, val]) => (
                    <div key={key}>
                      <p className="text-base sm:text-lg font-bold text-temple-maroon">{val}</p>
                      <p className="text-xs text-gray-500 capitalize">{key}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 space-y-2 text-sm text-gray-500 w-full">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" /> {priest.phone}
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  {priest.availability.atTemple && (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700 flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> Temple
                    </span>
                  )}
                  {priest.availability.outsideTemple && (
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700 flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> Home
                    </span>
                  )}
                  {priest.availability.online && (
                    <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs text-purple-700 flex items-center gap-1">
                      <Globe className="h-3 w-3" /> Online
                    </span>
                  )}
                </div>
              </div>

              {/* Right — Details */}
              <div className="flex-1 p-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Education
                  </p>
                  <p className="mt-1 text-sm text-gray-700">{priest.education}</p>
                </div>
                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Specialization
                  </p>
                  <p className="mt-1 text-sm text-gray-700">{priest.specialization}</p>
                </div>
                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    About
                  </p>
                  <p className="mt-1 text-sm text-gray-600 leading-relaxed">{priest.bio}</p>
                </div>
                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Services Offered
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {priest.services.map((service) => (
                      <span key={service} className="rounded-lg bg-temple-cream px-3 py-1 text-xs font-medium text-temple-maroon">
                        {service}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <Link
                    href="/services"
                    className="btn-primary text-sm"
                  >
                    Book with {priestShortName(priest.name)}
                  </Link>
                  <a
                    href={priest.whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-700"
                    aria-label={`Message ${priest.name} on WhatsApp`}
                  >
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp
                  </a>
                  <a
                    href={`tel:+1${priest.phone.replace(/\D/g, "")}`}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-temple-gold/40 bg-temple-cream px-4 py-2.5 text-sm font-semibold text-temple-maroon transition-colors hover:bg-temple-gold/15"
                    aria-label={`Call ${priest.name}`}
                  >
                    <Phone className="h-4 w-4" />
                    Call
                  </a>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
