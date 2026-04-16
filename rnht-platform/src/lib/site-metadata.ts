export const SITE_URL = "https://rnht-platform.web.app";

export const siteMetadataBase = new URL(SITE_URL);

export function canonicalPath(path: string) {
  if (!path || path === "/") {
    return "/";
  }

  return `${path.replace(/\/+$/, "")}/`;
}
