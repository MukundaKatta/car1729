import Link from "next/link";
import Image from "next/image";
import { HeroSlideshow } from "@/components/hero/HeroSlideshow";
import { HomePanchangamScroll } from "@/components/home/HomePanchangamScroll";
import { ReadyToBookPriests } from "@/components/home/ReadyToBookPriests";
import { TestimonialsCarousel } from "@/components/home/TestimonialsCarousel";
import {
  CheckCircle,
  MessageCircle,
  BookOpen,
  Heart,
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
    location: "Georgetown, TX",
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
      {/* Hero — Three-panel animated slideshow with Ken Burns effect */}
      <HeroSlideshow />

      {/* Stats Bar — below hero */}
      <section className="border-b border-temple-gold/15 bg-[#25050F]">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-3 px-4 py-7 sm:grid-cols-4 sm:gap-5 sm:px-6 lg:px-8">
          {[
            { value: "Est. 2022", label: "Serving the Community", icon: "🙏" },
            { value: "50+", label: "Vedic Services Offered", icon: "🪔" },
            { value: "2", label: "Experienced Priests", icon: "📿" },
            { value: "12+", label: "Texas Cities Served", icon: "📍" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="group rounded-[8px] border border-temple-gold/12 bg-white/[0.02] px-3 py-4 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]"
            >
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-temple-gold/20 bg-temple-gold/10 text-lg">
                {stat.icon}
              </div>
              <p className="font-heading text-lg font-bold text-temple-gold-light sm:text-2xl">
                {stat.value}
              </p>
              <p className="mt-1 text-xs font-accent font-medium tracking-wide text-gray-300 sm:text-sm">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Quick Action Bar — primary CTAs moved here from the hero */}
      <section className="border-b border-temple-gold/15 bg-[#25050F] text-white">
        <div className="mx-auto flex max-w-5xl flex-col items-stretch justify-center gap-3 px-4 py-5 sm:flex-row sm:items-center sm:gap-4 sm:px-6 lg:px-8">
          <a
            href="https://wa.me/message/P3YRA2XY3GI7F1"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-white transition-all duration-300 hover:-translate-y-0.5 hover:brightness-110 sm:flex-none sm:min-w-[200px]"
            style={{ background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)" }}
          >
            <MessageCircle className="h-4 w-4" />
            Join WhatsApp Group
          </a>
          <Link
            href="/services"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-temple-maroon-deep transition-all duration-300 hover:-translate-y-0.5 hover:brightness-110 sm:flex-none sm:min-w-[180px]"
            style={{ background: "linear-gradient(135deg, #B8872E 0%, #E8D5A3 45%, #C5973E 100%)" }}
          >
            <BookOpen className="h-4 w-4" />
            Book Pooja
          </Link>
          <Link
            href="/donate"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border-[1.5px] border-temple-gold/70 bg-temple-maroon/30 px-6 py-3 text-sm font-bold text-temple-gold-light backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:bg-temple-maroon/50 sm:flex-none sm:min-w-[180px]"
          >
            <Heart className="h-4 w-4" />
            Donate
          </Link>
        </div>
      </section>

      {/* Panchangam scroll */}
      <HomePanchangamScroll />

      {/* Why Choose RNHT */}
      <section className="relative py-20 bg-white overflow-hidden">
        <div className="gold-particles" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="font-accent text-sm font-semibold tracking-[0.2em] uppercase text-temple-gold">Our Promise</p>
            <h2 className="mt-2 section-heading">Why Choose RNHT</h2>
            <div className="ornament-divider"><span>&#x2733;</span></div>
            <p className="mx-auto max-w-xl text-gray-600 font-accent text-lg">
              Trusted by families across Texas for authentic Vedic ceremonies
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
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-temple-gold/20 flex items-center justify-center text-xs text-temple-gold">✓</span>
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
