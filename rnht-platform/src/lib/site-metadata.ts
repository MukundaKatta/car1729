export const SITE_URL = "https://rnht.org";

export const siteMetadataBase = new URL(SITE_URL);

export function canonicalPath(path: string) {
  if (!path || path === "/") {
    return "/";
  }

  return `${path.replace(/\/+$/, "")}/`;
}
