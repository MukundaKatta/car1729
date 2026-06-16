import Link from "next/link";
import { Heart, Star, Crown, Award, Gift, Download } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

const festivalSponsorships = [
  {
    id: "fs-1",
    festival: "Ugadi 2026",
    date: "March 29, 2026",
    tiers: [
      { name: "Bronze", price: 101, perks: ["Name in program booklet", "Prasadam"] },
      { name: "Silver", price: 251, perks: ["Name announced during event", "Priority seating", "Special prasadam"] },
      { name: "Gold", price: 501, perks: ["Name on event banner", "Front row seating", "Special prasadam", "Deity photo with frame"] },
      { name: "Platinum", price: 1001, perks: ["Title sponsor recognition", "VIP seating", "Personalized blessing", "Commemorative gift", "Deity photo"] },
    ],
  },
  {
    id: "fs-2",
    festival: "Sri Rama Navami 2026",
    date: "April 7, 2026",
    tiers: [
      { name: "Bronze", price: 101, perks: ["Name in program booklet", "Prasadam"] },
      { name: "Silver", price: 251, perks: ["Name announced during ceremony", "Priority seating", "Special prasadam"] },
      { name: "Gold", price: 501, perks: ["Name on Kalyanotsavam banner", "Front row seating", "Special prasadam", "Deity photo"] },
      { name: "Platinum", price: 1116, perks: ["Title sponsor — Kalyanotsavam", "VIP seating", "Personalized blessing from priest", "Commemorative gift"] },
    ],
  },
];

const deityOrnaments = [
  { deity: "Sri Rudra Narayana", items: [
    { name: "Gold Crown (Kiritam)", price: 5016, desc: "Gold-plated crown for the main deity" },
    { name: "Silver Kavacham", price: 3516, desc: "Silver armor covering for the deity" },
    { name: "Silk Vastram Set", price: 516, desc: "Premium silk clothing for the deity" },
    { name: "Flower Garland (Daily)", price: 51, desc: "Sponsor daily fresh flower garland" },
  ]},
  { deity: "Lord Ganesha", items: [
    { name: "Gold Ornament Set", price: 2516, desc: "Complete gold-plated ornament set" },
    { name: "Modak Offering (108)", price: 108, desc: "108 modaks offered during special pooja" },
  ]},
  { deity: "Goddess Lakshmi", items: [
    { name: "Gold Jewelry Set", price: 5016, desc: "Traditional jewelry including necklace, bangles, and earrings" },
    { name: "Silk Saree", price: 251, desc: "Premium silk saree for the goddess" },
  ]},
  { deity: "Lord Hanuman", items: [
    { name: "Sindoor Alankaram", price: 151, desc: "Special sindoor decoration for Lord Hanuman" },
    { name: "Vadamala (108 Vadas)", price: 75, desc: "Garland of 108 vadas offered on Tuesdays/Saturdays" },
    { name: "Butter Alankaram", price: 516, desc: "Special butter decoration ceremony" },
  ]},
];

const serviceBundles = [
  {
    name: "New Home Package",
    services: ["Ganapathi Homam", "Vastu Pooja", "Gruhapravesam", "Satyanarayana Vratam"],
    individualTotal: 604,
    bundlePrice: 501,
    savings: 103,
    duration: "Full Day (6-8 hours)",
  },
  {
    name: "Wedding Ceremony Package",
    services: ["Ganapathi Homam", "Navagraha Shanti", "Vivah Sanskar", "Satyanarayana Vratam"],
    individualTotal: 1504,
    bundlePrice: 1251,
    savings: 253,
    duration: "Full Day (8-10 hours)",
  },
  {
    name: "Baby Ceremony Package",
    services: ["Namakaranam (Naming)", "Annaprasana (First Food)", "Aksharabhyasam (First Letters)"],
    individualTotal: 453,
    bundlePrice: 351,
    savings: 102,
    duration: "Per ceremony (1-2 hours each)",
  },
  {
    name: "Monthly Wellness Package",
    services: ["Archana (4x)", "Abhishekam (1x)", "Satyanarayana Vratam (1x)"],
    individualTotal: 146,
    bundlePrice: 116,
    savings: 30,
    duration: "Spread across the month",
  },
];

const tierIcons: Record<string, React.ElementType> = {
  Bronze: Award,
  Silver: Star,
  Gold: Crown,
  Platinum: Crown,
};

const tierColors: Record<string, string> = {
  Bronze: "border-orange-300 bg-orange-50",
  Silver: "border-gray-300 bg-gray-50",
  Gold: "border-amber-400 bg-amber-50",
  Platinum: "border-purple-400 bg-purple-50",
};

export default function SponsorshipPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="text-center">
        <Gift className="mx-auto h-10 w-10 text-temple-red" />
        <h1 className="mt-4 section-heading">Sponsorship & Packages</h1>
        <p className="mt-3 mx-auto max-w-2xl text-gray-600">
          Sponsor temple festivals, deity ornaments, and save with bundled service
          packages. All sponsorships are tax-deductible.
        </p>
      </div>

      {/* Service Bundles */}
      <section className="mt-12">
        <h2 className="font-heading text-xl font-bold text-gray-900">
          Service Packages (Save up to 25%)
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Popular service combinations at discounted bundle prices.
        </p>
        <div className="mt-6 grid gap-4 sm:gap-6 sm:grid-cols-2">
          {serviceBundles.map((bundle) => (
            <div key={bundle.name} className="card overflow-hidden">
              <div className="bg-gradient-to-r from-temple-cream to-temple-gold/10 px-5 py-3">
                <h3 className="font-heading text-lg font-bold text-temple-maroon">
                  {bundle.name}
                </h3>
              </div>
              <div className="p-5">
                <ul className="space-y-1">
                  {bundle.services.map((s) => (
                    <li key={s} className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="h-1.5 w-1.5 rounded-full bg-temple-red" />
                      {s}
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-xs text-gray-500">{bundle.duration}</p>
                <div className="mt-4 flex items-end justify-between">
                  <div>
                    <p className="text-sm text-gray-500 line-through">
                      {formatCurrency(bundle.individualTotal)}
                    </p>
                    <p className="text-2xl font-bold text-temple-red">
                      {formatCurrency(bundle.bundlePrice)}
                    </p>
                  </div>
                  <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                    Save {formatCurrency(bundle.savings)}
                  </span>
                </div>
                <Link href="/services" className="btn-primary mt-4 w-full text-center block text-sm">
                  Book Package
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Festival Sponsorship */}
      <section className="mt-16">
        <h2 className="font-heading text-xl font-bold text-gray-900">
          Festival Sponsorship
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Sponsor upcoming festivals and receive recognition during the event.
        </p>
        {festivalSponsorships.map((festival) => (
          <div key={festival.id} className="mt-6">
            <h3 className="font-heading text-lg font-bold text-gray-900">
              {festival.festival}
              <span className="ml-2 text-sm font-normal text-gray-500">
                {festival.date}
              </span>
            </h3>
            <div className="mt-4 grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {festival.tiers.map((tier) => {
                const Icon = tierIcons[tier.name] || Star;
                return (
                  <div key={tier.name} className={`rounded-xl border-2 p-5 ${tierColors[tier.name]}`}>
                    <div className="flex items-center gap-2">
                      <Icon className="h-5 w-5" />
                      <h4 className="font-heading font-bold text-gray-900">{tier.name}</h4>
                    </div>
                    <p className="mt-2 text-2xl font-bold text-temple-red">
                      {formatCurrency(tier.price)}
                    </p>
                    <ul className="mt-3 space-y-1.5">
                      {tier.perks.map((perk) => (
                        <li key={perk} className="flex items-start gap-2 text-xs text-gray-600">
                          <Heart className="mt-0.5 h-3 w-3 flex-shrink-0 text-temple-red" />
                          {perk}
                        </li>
                      ))}
                    </ul>
                    <button
                      disabled
                      title="Online sponsorship is coming soon"
                      className="btn-primary mt-4 w-full text-xs py-2.5 px-4 opacity-50 cursor-not-allowed"
                    >
                      Coming Soon
                    </button>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 text-right">
              <button
                disabled
                title="The sponsorship PDF is coming soon"
                className="flex items-center gap-1 text-sm text-gray-400 cursor-not-allowed ml-auto"
              >
                <Download className="h-4 w-4" /> Sponsorship PDF (coming soon)
              </button>
            </div>
          </div>
        ))}
      </section>

      {/* Deity Ornament Sponsorship */}
      <section className="mt-16">
        <h2 className="font-heading text-xl font-bold text-gray-900">
          Deity Ornament & Alankaram Sponsorship
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Sponsor sacred ornaments and special alankaram for our temple deities.
        </p>
        <div className="mt-6 space-y-6">
          {deityOrnaments.map((deity) => (
            <div key={deity.deity} className="card overflow-hidden">
              <div className="bg-temple-cream px-5 py-3">
                <h3 className="font-heading text-lg font-bold text-temple-maroon">
                  {deity.deity}
                </h3>
              </div>
              <div className="divide-y divide-gray-100">
                {deity.items.map((item) => (
                  <div key={item.name} className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 sm:px-5 py-3 sm:py-4 gap-2 sm:gap-4">
                    <div>
                      <p className="font-semibold text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-500">{item.desc}</p>
                    </div>
                    <div className="flex items-center gap-3 sm:gap-4">
                      <p className="text-lg font-bold text-temple-red">
                        {formatCurrency(item.price)}
                      </p>
                      <button
                        disabled
                        title="Online sponsorship is coming soon"
                        className="btn-primary text-xs py-2.5 px-4 opacity-50 cursor-not-allowed"
                      >
                        Coming Soon
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
