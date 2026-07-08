import Link from "next/link";
import Image from "next/image";
import { HeroSlideshow } from "@/components/hero/HeroSlideshow";
import { FestivalTicker } from "@/components/home/FestivalTicker";
import { HomePanchangamScroll } from "@/components/home/HomePanchangamScroll";
import { ReadyToBookPriests } from "@/components/home/ReadyToBookPriests";
import { TestimonialsCarousel } from "@/components/home/TestimonialsCarousel";
import {
  CheckCircle,
  MessageCircle,
  BookOpen,
  Heart,
  Sun,
} from "lucide-react";

const testimonials = [
  {
    name: "Srinivas R.",
    location: "Round Rock, TX",
    text: "Pandit Aditya ji performed our Gruhapravesam with such devotion and attention to detail. The entire family felt blessed. Highly recommend RNHT for all Vedic ceremonies.",
  },
  {
    name: "Lakshmi P.",
    location: "Kyle, TX",
    text: "We had our son's Upanayanam done by RNHT priests. They explained every step of the ritual beautifully. A truly authentic Vedic experience.",
  },
  {
    name: "Venkat K.",
    location: "Austin, TX",
    text: "The Navagraha Homam was performed with proper Vedic procedures. Pandit Raghurama Sharma's knowledge of mantras is exceptional. Very professional and punctual.",
  },
  {
    name: "Madhavi S.",
    location: "Cedar Park, TX",
    text: "Our Satyanarayana Vratham was conducted with such grace and patience. Every mantra felt meaningful, and our relatives kept praising how beautifully the pooja was organized.",
  },
  {
    name: "Prakash M.",
    location: "Austin, TX",
    text: "RNHT helped us with a housewarming ceremony on short notice and still made everything feel deeply traditional and well prepared. The guidance before the event was excellent too.",
  },
  {
    name: "Anitha V.",
    location: "Leander, TX",
    text: "Pandit ji explained each ritual in simple language so even our children could follow along. It felt spiritual, warm, and very personal to our family.",
  },
  {
    name: "Harish G.",
    location: "Plano, TX",
    text: "We invited RNHT for a Ganapathi Homam and were impressed by the punctuality, clarity, and authenticity. Everything was systematic from booking to completion.",
  },
  {
    name: "Deepa N.",
    location: "Houston, TX",
    text: "Their support during our naming ceremony was wonderful. The priests were calm, respectful, and gave our family the confidence that every step was being done properly.",
  },
  {
    name: "Rohit B.",
    location: "Frisco, TX",
    text: "From the first call to the final aashirvadam, the experience was seamless. RNHT brought a true temple atmosphere into our home for the ceremony.",
  },
  {
    name: "Supriya T.",
    location: "Sugar Land, TX",
    text: "The Rudrabhishekam was powerful and uplifting. We especially appreciated how carefully the priests honored our family customs while maintaining strict Vedic discipline.",
  },
  {
    name: "Kiran P.",
    location: "San Antonio, TX",
    text: "We have now booked multiple services through RNHT, and the consistency is what stands out most. Every ceremony feels sincere, disciplined, and spiritually elevating.",
  },
  {
    name: "Bhavana R.",
    location: "Irving, TX",
    text: "The baby shower pooja was beautifully performed and thoughtfully explained for our guests. Many of them asked for RNHT's number immediately after the ceremony.",
  },
  {
    name: "Naveen C.",
    location: "McKinney, TX",
    text: "RNHT priests brought both scholarship and kindness to our family event. They answered questions patiently and made the whole day feel blessed from beginning to end.",
  },
  {
    name: "Shilpa D.",
    location: "Pearland, TX",
    text: "What stood out most was the devotion. This did not feel rushed or transactional at all. The pooja felt sacred, intentional, and deeply rooted in tradition.",
  },
];

export default function HomePage() {
  return (
    <div className="bg-temple-ivory">
      {/* Visually-hidden page title: the hero is an image slideshow with no text
          heading, so this gives the homepage a single descriptive <h1> for SEO +
          screen-reader heading navigation without altering the visual design. */}
      <h1 className="sr-only">
        Rudra Narayana Hindu Temple — Pooja, Homam &amp; Vedic Services in Austin, Texas
      </h1>
      {/* Hero — Three-panel animated slideshow with Ken Burns effect */}
      <HeroSlideshow />

      {/* Action tiles — below hero. Four things devotees come here to do
          (replaces the old stat band + merges in the earlier CTA button row so
          the actions aren't duplicated). Each tile is a tappable link. */}
      <section className="border-b border-temple-gold/15 bg-[#25050F]">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-3 px-4 py-7 sm:grid-cols-4 sm:gap-5 sm:px-6 lg:px-8">
          <Link
            href="/services"
            className="group flex flex-col items-center rounded-[8px] border border-temple-gold/12 bg-white/[0.02] px-3 py-4 text-center transition-all duration-300 hover:-translate-y-0.5 hover:border-temple-gold/40 hover:bg-white/[0.05]"
          >
            <span aria-hidden="true" className="mb-3 flex h-11 w-11 items-center justify-center rounded-full border border-temple-gold/25 bg-temple-gold/10 text-temple-gold-light transition-colors group-hover:bg-temple-gold/20">
              <BookOpen className="h-5 w-5" />
            </span>
            <p className="font-heading text-base font-bold text-temple-gold-light sm:text-lg">
              Book a Pooja
            </p>
            <p className="mt-1 text-xs font-accent font-medium tracking-wide text-gray-300 sm:text-sm">
              36+ Vedic services
            </p>
          </Link>

          <a
            href="https://wa.me/message/P3YRA2XY3GI7F1"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col items-center rounded-[8px] border border-temple-gold/12 bg-white/[0.02] px-3 py-4 text-center transition-all duration-300 hover:-translate-y-0.5 hover:border-temple-gold/40 hover:bg-white/[0.05]"
          >
            <span aria-hidden="true" className="mb-3 flex h-11 w-11 items-center justify-center rounded-full border border-temple-gold/25 bg-temple-gold/10 text-temple-gold-light transition-colors group-hover:bg-temple-gold/20">
              {/* WhatsApp emblem (client 07-08) — same glyph as the footer icon */}
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
            </span>
            <p className="font-heading text-base font-bold text-temple-gold-light sm:text-lg">
              Join Temple WhatsApp Group
            </p>
            <p className="mt-1 text-xs font-accent font-medium tracking-wide text-gray-300 sm:text-sm">
              Ask Panditji &amp; get updates
            </p>
          </a>

          <Link
            href="/panchangam"
            className="group flex flex-col items-center rounded-[8px] border border-temple-gold/12 bg-white/[0.02] px-3 py-4 text-center transition-all duration-300 hover:-translate-y-0.5 hover:border-temple-gold/40 hover:bg-white/[0.05]"
          >
            <span aria-hidden="true" className="mb-3 flex h-11 w-11 items-center justify-center rounded-full border border-temple-gold/25 bg-temple-gold/10 text-temple-gold-light transition-colors group-hover:bg-temple-gold/20">
              <Sun className="h-5 w-5" />
            </span>
            <p className="font-heading text-base font-bold text-temple-gold-light sm:text-lg">
              Today&apos;s Panchangam
            </p>
            <p className="mt-1 text-xs font-accent font-medium tracking-wide text-gray-300 sm:text-sm">
              Tithi &amp; muhurtham
            </p>
          </Link>

          <Link
            href="/donate"
            className="group flex flex-col items-center rounded-[8px] border border-temple-gold/12 bg-white/[0.02] px-3 py-4 text-center transition-all duration-300 hover:-translate-y-0.5 hover:border-temple-gold/40 hover:bg-white/[0.05]"
          >
            <span aria-hidden="true" className="mb-3 flex h-11 w-11 items-center justify-center rounded-full border border-temple-gold/25 bg-temple-gold/10 text-temple-gold-light transition-colors group-hover:bg-temple-gold/20">
              <Heart className="h-5 w-5" />
            </span>
            <p className="font-heading text-base font-bold text-temple-gold-light sm:text-lg">
              Offer a Seva
            </p>
            <p className="mt-1 text-xs font-accent font-medium tracking-wide text-gray-300 sm:text-sm">
              Support the temple
            </p>
          </Link>
        </div>
      </section>

      {/* Upcoming festivals ticker (client 07-08) — scrolling strip under the
          action tiles, next to Today's Panchangam */}
      <FestivalTicker />

      {/* Panchangam scroll */}
      <HomePanchangamScroll />

      {/* Why Choose RNHT */}
      <section className="relative py-20 bg-white overflow-hidden">
        <div className="gold-particles" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="font-accent text-sm font-semibold tracking-[0.2em] uppercase text-temple-gold-deep">Our Promise</p>
            <h2 className="mt-2 section-heading">Why Choose RNHT</h2>
            <div className="ornament-divider"><span>&#x2733;</span></div>
            <p className="mx-auto max-w-xl text-gray-600 font-accent text-lg">
              Trusted by families across Texas and USA for authentic Vedic ceremonies
            </p>
          </div>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Authentic Vedic Rituals",
                desc: "Our priests follow traditional Vedic procedures with proper mantras from Krishna Yajurvedam, ensuring the sanctity of every ceremony.",
              },
              {
                title: "Experienced Priests",
                desc: "Over 35 years of combined experience. Both priests are trained in traditional Vedic knowledge with expertise in all 16 Samskaras.",
              },
              {
                title: "Home & Temple Services",
                desc: "We come to you. All ceremonies can be performed at your home, office, or any venue across Texas — not just at the temple.",
              },
              {
                title: "Personalized Attention",
                desc: "Every ceremony is customized to your family's traditions. We explain each step so you understand the spiritual significance.",
              },
              {
                title: "Multilingual Priests",
                desc: "Services conducted in English, Telugu, Tamil, Hindi, and Sanskrit to ensure every devotee feels at home.",
              },
              {
                title: "Tax-Deductible Donations",
                desc: "RNHT is a registered 501(c)(3) nonprofit. All donations and service contributions are tax-deductible.",
              },
            ].map((item) => (
              <div key={item.title} className="gold-corners flex gap-4 p-6 rounded-2xl bg-gradient-to-br from-temple-ivory/80 to-[#FFF8E7]/60 border border-temple-gold/10 transition-all duration-300 hover:shadow-gold-glow hover:border-temple-gold/25 hover:-translate-y-1">
                <CheckCircle className="mt-0.5 h-6 w-6 shrink-0 text-temple-gold" />
                <div>
                  <h3 className="font-heading font-bold text-temple-maroon text-lg">{item.title}</h3>
                  <p className="mt-2 text-sm text-gray-600 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative py-20 bg-temple-maroon-deep overflow-hidden">
        {/* Decorative background */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "40px 40px" }} />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="font-accent text-sm font-semibold tracking-[0.2em] uppercase text-temple-gold-light">Testimonials</p>
            <h2 className="mt-2 font-heading text-3xl font-bold text-white sm:text-4xl lg:text-[2.75rem] tracking-tight">What Devotees Say</h2>
            <div className="ornament-divider"><span className="!text-temple-gold-light">&#x2733;</span></div>
            <p className="mx-auto max-w-xl font-accent text-lg text-gray-300">
              Hear from families who have experienced our services
            </p>
          </div>
          <TestimonialsCarousel testimonials={testimonials} />
        </div>
      </section>

      {/* Nitya Pooja Seva */}
      <section className="relative py-20 bg-[#2A0612] overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(197,151,62,0.08)_0%,transparent_70%)]" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 items-center lg:grid-cols-2">
            <div className="relative mx-auto max-w-sm lg:max-w-none">
              <div className="relative rounded-xl overflow-hidden shadow-[0_0_40px_rgba(197,151,62,0.2)] border border-temple-gold/20">
                <Image
                  src="/nitya-pooja-seva.jpg"
                  alt="Nitya Pooja Seva — $365 yearly offering for daily worship services"
                  width={600}
                  height={900}
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>
            <div className="text-center lg:text-left">
              <p className="font-accent text-sm font-semibold tracking-[0.2em] uppercase text-temple-gold">Daily Worship</p>
              <h2 className="mt-2 font-heading text-3xl font-bold text-white sm:text-4xl tracking-tight">
                Nitya Pooja Seva
              </h2>
              <div className="mt-3 flex items-center justify-center lg:justify-start gap-3" aria-hidden="true">
                <span className="h-px w-12 bg-gradient-to-r from-transparent to-temple-gold/50" />
                <span className="text-temple-gold text-sm">&#x0950;</span>
                <span className="h-px w-12 bg-gradient-to-l from-transparent to-temple-gold/50" />
              </div>
              <p className="mt-4 text-gray-300 font-accent text-lg leading-relaxed">
                With the blessings of Lord Rudra Narayana, the temple offers the Nitya Pooja Scheme
                for the spiritual welfare of all devotees.
              </p>
              <ul className="mt-6 space-y-3 text-left">
                {["Nitya Deeparadhana", "Shodashopachara Seva", "Naivedyam", "Pushpa Archana", "Rudrabhishekam"].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-temple-gold-light font-accent">
                    <span aria-hidden="true" className="flex-shrink-0 w-5 h-5 rounded-full bg-temple-gold/20 flex items-center justify-center text-xs text-temple-gold">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex flex-wrap gap-4 justify-center lg:justify-start">
                <Link
                  href="/donate"
                  className="px-8 py-3.5 font-bold text-[#2A0612] text-lg"
                  style={{
                    background: "linear-gradient(135deg, #C5973E 0%, #E8D5A3 40%, #C5973E 100%)",
                    borderRadius: "4px",
                    boxShadow: "0 6px 30px rgba(197,151,62,0.35)",
                  }}
                >
                  $365/Year — Join Now
                </Link>
                <a
                  href="tel:+15125450473"
                  className="px-8 py-3.5 font-bold text-temple-gold-light text-lg border-2 border-temple-gold/50"
                  style={{ borderRadius: "4px" }}
                >
                  Call: (512) 545-0473
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA — WhatsApp + Donate */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl overflow-hidden shadow-gold-glow-lg">
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-temple-maroon-deep via-temple-maroon to-temple-red-dark" />
            <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "32px 32px" }} />
            {/* Gold border glow */}
            <div className="absolute inset-0 rounded-3xl ring-2 ring-inset ring-temple-gold/25" />
            {/* Corner ornaments */}
            <div className="absolute top-4 left-4 w-12 h-12 border-t-2 border-l-2 border-temple-gold/30 rounded-tl-lg" />
            <div className="absolute top-4 right-4 w-12 h-12 border-t-2 border-r-2 border-temple-gold/30 rounded-tr-lg" />
            <div className="absolute bottom-4 left-4 w-12 h-12 border-b-2 border-l-2 border-temple-gold/30 rounded-bl-lg" />
            <div className="absolute bottom-4 right-4 w-12 h-12 border-b-2 border-r-2 border-temple-gold/30 rounded-br-lg" />

            <div className="relative p-6 text-center sm:p-10 lg:p-16">
              <h2 className="font-heading text-3xl font-bold text-white sm:text-4xl lg:text-5xl tracking-tight">
                Ready to Book a Pooja?
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-gray-300 font-accent text-lg leading-relaxed">
                Contact us via WhatsApp for quick booking, or browse our services
                online. We serve the entire Austin metro and greater Texas area.
              </p>
              <ReadyToBookPriests />

              <div className="mt-10 flex flex-wrap justify-center gap-4">
                <Link
                  href="/donate"
                  className="btn-primary bg-temple-gold text-temple-maroon-deep hover:bg-temple-gold-light text-base px-8 py-4 font-bold"
                >
                  Donate Now
                </Link>
                <Link
                  href="/services"
                  className="btn-primary bg-white/10 text-white backdrop-blur hover:bg-white/20 text-base px-8 py-4"
                >
                  Browse Services
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
