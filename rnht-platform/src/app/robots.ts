import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-metadata";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Personal / authenticated areas shouldn't be indexed.
      disallow: ["/admin", "/dashboard", "/profile"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
