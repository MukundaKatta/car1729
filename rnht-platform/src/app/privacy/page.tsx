import type { Metadata } from "next";
import { canonicalPath } from "@/lib/site-metadata";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy policy and cookie information for Rudra Narayana Hindu Temple website.",
  alternates: {
    canonical: canonicalPath("/privacy"),
  },
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="section-heading">Privacy Policy</h1>
      <p className="mt-2 text-sm text-gray-500">Last updated 22 Feb 2025</p>

      <div className="mt-8 prose prose-sm max-w-none text-gray-700 space-y-6">
        <h2 className="text-lg font-bold text-gray-900">Cookie Policy</h2>
        <p>
          Our website uses Cookies, as almost all websites do, to help provide
          you with the best experience we can.
        </p>

        <h2 className="text-lg font-bold text-gray-900">What are Cookies?</h2>
        <p>
          Cookies are small text files which a website may install on your
          computer or mobile device when you first visit a site or page. A Cookie
          will help the website, or another website, to recognize your device the
          next time you visit. Web beacons or other similar files can also do the
          same thing. We use the term &quot;Cookies&quot; in this policy to refer to all
          files that collect information in this way.
        </p>
        <p>
          There are many functions Cookies serve. For example, they can help us
          to remember your preferences, analyze how well our website is
          performing, or even allow us to recommend content we believe will be
          most relevant to you.
        </p>
        <p>
          Certain Cookies contain Personal Information &ndash; for example, if you
          click to &quot;remember me&quot; when logging in, a cookie will store your
          username.
        </p>
        <p className="font-semibold">
          No tracking or targeting cookies are used by our website.
        </p>
        <p>
          We may collect data that personally identifies you. This data is
          collected only when you voluntarily provide it to us. We do not sell
          this data to any 3rd party.
        </p>
        <p>
          To learn more about how businesses use cookies go to:{" "}
          <a
            href="https://www.allaboutcookies.org"
            target="_blank"
            rel="noopener noreferrer"
            className="text-temple-red hover:underline"
          >
            www.allaboutcookies.org
          </a>
        </p>
        <p>
          However, if you use your browser settings to block all Cookies
          (including essential Cookies) you may not be able to access all or
          parts of our site.
        </p>

        <h2 className="text-lg font-bold text-gray-900">
          Links to other web sites
        </h2>
        <p>
          This Site may contain embedded content from, or links to, web sites
          operated by other companies, including websites operated by our
          third-party service providers, our affiliates, and other third parties
          including social media websites such as YouTube, Twitter, LinkedIn or
          Facebook.
        </p>
        <p>
          As a result, when you visit a page with embedded content, or follow a
          link to a third-party site, you may be presented with Cookies from
          these websites. We have no control or liability over these Cookies, so
          you should check the relevant third party&apos;s cookie policy for more
          information.
        </p>
        <p>
          We also offer a &quot;share page&quot; widget on some of our web pages, where
          content can be shared easily on sites such as Facebook, Twitter and
          LinkedIn. These sites may use a cookie when you are logged into their
          service. We have no control or liability over these cookies, so you
          should check the relevant third party&apos;s Cookie Policy for more
          information.
        </p>
      </div>
    </div>
  );
}
