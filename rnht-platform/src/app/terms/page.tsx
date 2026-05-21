import type { Metadata } from "next";
import { canonicalPath } from "@/lib/site-metadata";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "Terms and conditions for using the Rudra Narayana Hindu Temple website.",
  alternates: {
    canonical: canonicalPath("/terms"),
  },
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="section-heading">Terms of Use</h1>

      <div className="mt-8 prose prose-sm max-w-none text-gray-700 space-y-6">
        <p>
          Rudra Narayana Hindu Temple (&quot;We&quot;, &quot;us&quot;, &quot;our&quot;) provides this web site (the
          &quot;Site&quot;) to supply general information about our services. You may use
          this site subject to your compliance with these terms and conditions.
        </p>

        <h2 className="text-lg font-bold text-gray-900">
          Your acceptance of these terms and conditions
        </h2>
        <p>
          Please take a few minutes to carefully review these terms and
          conditions. By accessing and using this Site you agree to follow and be
          bound by these terms and conditions. If you do not agree to follow and
          be bound by these terms and conditions, you may not access, use or
          download materials from this Site.
        </p>

        <h2 className="text-lg font-bold text-gray-900">
          These terms and conditions may change
        </h2>
        <p>
          We reserve the right to update or modify these terms and conditions at
          any time without prior notice. We will do so by posting an updated or
          modified version of these terms and conditions on this Site. Your use
          of this Site following any such change constitutes your agreement to
          follow and be bound by the revised terms and conditions. For this
          reason, we encourage you to review these terms and conditions every
          time you use this Site.
        </p>

        <h2 className="text-lg font-bold text-gray-900">Privacy statement</h2>
        <p>
          We are committed to respecting the personal privacy of the individuals
          who use this Site. The privacy statement posted on this site describes
          our current policies and practices with regard to the personal
          information collected by us through this Site. The privacy statement is
          part of these terms and conditions.
        </p>

        <h2 className="text-lg font-bold text-gray-900">
          Usernames, passwords and security
        </h2>
        <p>No usernames and passwords are collected by this Site.</p>

        <h2 className="text-lg font-bold text-gray-900">
          Ownership of this Site and its contents
        </h2>
        <p>
          This Site, including all its contents, such as text, images, and the
          HTML used to generate the pages (&quot;Materials&quot;), is our property or that
          of our suppliers, partners, or licensors and is protected by patent,
          trademark and/or copyright under United States and/or foreign laws.
          Except as otherwise provided in these terms and conditions, you may not
          use, download, upload, copy, print, display, perform, reproduce,
          publish, modify, delete, add to, license, post, transmit, or
          distribute any Materials from this Site in whole or in part, for any
          public or commercial purpose without our specific written permission.
        </p>

        <h2 className="text-lg font-bold text-gray-900">
          Your use of this Site
        </h2>
        <p>
          You may not use any robot, spider, scraper, or other automated means
          to access the Site for any purpose. You may not take any action that
          imposes, or may impose, in our sole discretion, an unreasonable or
          disproportionately large load on our infrastructure.
        </p>

        <h2 className="text-lg font-bold text-gray-900">
          Disclaimers
        </h2>
        <p>
          THE MATERIALS IN THIS SITE ARE PROVIDED &quot;AS IS&quot; AND WITHOUT WARRANTIES
          OF ANY KIND, EITHER EXPRESS OR IMPLIED. TO THE FULLEST EXTENT
          PERMISSIBLE PURSUANT TO APPLICABLE LAW, WE DISCLAIM ALL WARRANTIES,
          EXPRESS OR IMPLIED, INCLUDING, BUT NOT LIMITED TO, IMPLIED WARRANTIES
          OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE.
        </p>
        <p>
          WE DO NOT WARRANT THAT THE FUNCTIONS CONTAINED IN THE MATERIALS WILL
          BE UNINTERRUPTED OR ERROR-FREE, THAT DEFECTS WILL BE CORRECTED, OR
          THAT THIS SITE OR THE SERVER THAT MAKES IT AVAILABLE ARE FREE OF
          VIRUSES OR OTHER HARMFUL COMPONENTS.
        </p>

        <h2 className="text-lg font-bold text-gray-900">
          Limitation of liability
        </h2>
        <p>
          UNDER NO CIRCUMSTANCES, INCLUDING, BUT NOT LIMITED TO, NEGLIGENCE,
          SHALL WE BE LIABLE FOR ANY SPECIAL OR CONSEQUENTIAL DAMAGES THAT RESULT
          FROM THE USE OF, OR THE INABILITY TO USE, THE MATERIALS IN THIS SITE.
        </p>

        <h2 className="text-lg font-bold text-gray-900">
          Applicable laws
        </h2>
        <p>
          This Site is created and controlled by us in the State of Texas. As
          such, the laws of the State of Texas will govern these terms and
          conditions, without giving effect to any principles of conflicts of
          laws.
        </p>

        <h2 className="text-lg font-bold text-gray-900">
          General
        </h2>
        <p>
          We may revise these terms and conditions at any time by updating this
          posting. You should visit this page from time to time to review the
          then-current terms and conditions because they are binding on you.
          Certain provisions of these terms and conditions may be superseded by
          expressly designated legal notices or terms located on particular pages
          at this Site.
        </p>
      </div>
    </div>
  );
}
