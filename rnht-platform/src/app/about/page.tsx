import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { canonicalPath } from "@/lib/site-metadata";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about Rudra Narayana Hindu Temple (RNHT), founded in 2022 by Pandit Aditya Sharma. Serving Austin, Texas with traditional Vedic rituals and community programs.",
  alternates: {
    canonical: canonicalPath("/about"),
  },
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="text-center">
        <BookOpen className="mx-auto h-10 w-10 text-temple-red" />
        <h1 className="mt-4 section-heading">About Us</h1>
      </div>

      <div className="mt-10 prose prose-lg mx-auto max-w-3xl text-gray-700">
        <p>
          <strong>Rudra Narayana Hindu Temple (RNHT)</strong> is a sacred haven
          for devotees seeking <em>spiritual growth, peace, and connection</em>{" "}
          with the <em>divine</em>. RNHT provides a platform for spiritual
          growth, learning, and community building, accessible to devotees from
          all over the world.
        </p>

        <p>
          Rudra Narayana Hindu Temple was founded by Pandit Aditya Sharma, who
          had a vision to create a spiritual hub for the community. With his
          dedication and perseverance, RNHT was{" "}
          <strong>established in 2022</strong>. Later, Pandit Raghuram Sharma
          joined Pandit Aditya Sharma, bringing his own expertise and passion to
          the temple. Together, they have guided RNHT to become a{" "}
          <strong>thriving spiritual center</strong>, offering a range of
          programs and services that cater to the diverse needs of the community.
        </p>

        <p>
          From daily pujas and cultural events to educational programs and
          charitable initiatives, RNHT has become a beacon of hope, inspiration,
          and spiritual growth for countless individuals and families.
        </p>

        <p>
          We offer services, including traditional{" "}
          <strong>weddings, pujas, and other rituals</strong>, in the{" "}
          <strong>Austin, Texas area</strong>. Our experienced priests are
          dedicated to providing personalized and meaningful spiritual
          experiences for individuals and families.
        </p>

        <p>
          After serving the community for many years, Pandit Aditya Sharma and
          Pandit Raghuram Sharma wanted to take their vision to the next level by
          establishing a <strong>Vedic experience</strong> for devotees. They
          aimed to create a sacred space where individuals could immerse
          themselves in the ancient wisdom of the Vedas, experience the richness
          of culture, and connect with the divine on a deeper level. This vision
          has become a reality, and RNHT continues to evolve and grow, offering a
          unique and transformative experience for all who connect with us.
        </p>
      </div>

      <div className="mt-12 text-center space-x-4">
        <Link href="/priests" className="btn-primary">
          Meet Our Priests
        </Link>
        <Link href="/services" className="btn-secondary">
          View Services
        </Link>
        <Link href="/contact" className="btn-outline">
          Contact Us
        </Link>
      </div>
    </div>
  );
}
