import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-metadata";

// Public, indexable routes (admin/dashboard/profile are excluded — see robots).
const routes = [
  "",
  "/services",
  "/priests",
  "/panchangam",
  "/calendar",
  "/gallery",
  "/donate",
  "/about",
  "/news",
  "/community",
  "/education",
  "/sponsorship",
  "/streaming",
  "/transparency",
  "/privacy",
  "/terms",
  "/login",
];

export default function sitemap(): MetadataRoute.Sitemap {
  // Site uses trailingSlash:true, so emit canonical trailing-slash URLs to match
  // each page's rel=canonical (avoids 301-redirect URLs in the sitemap).
  return routes.map((r) => ({
    url: r === "" ? `${SITE_URL}/` : `${SITE_URL}${r}/`,
    changeFrequency: "weekly",
    priority: r === "" ? 1 : 0.7,
  }));
}
