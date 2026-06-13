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
  return routes.map((r) => ({
    url: `${SITE_URL}${r || "/"}`,
    changeFrequency: "weekly",
    priority: r === "" ? 1 : 0.7,
  }));
}
