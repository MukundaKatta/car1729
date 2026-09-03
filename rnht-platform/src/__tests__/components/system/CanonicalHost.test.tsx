import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { canonicalRedirectTarget, CanonicalHost } from "@/components/system/CanonicalHost";

describe("canonicalRedirectTarget", () => {
  it("sends the Firebase default hosts and www to rnht.org, keeping path, query and hash", () => {
    expect(canonicalRedirectTarget("https://rnht-platform.web.app/donate/?fund=general#top")).toBe(
      "https://rnht.org/donate/?fund=general#top"
    );
    expect(canonicalRedirectTarget("https://rnht-platform.firebaseapp.com/")).toBe("https://rnht.org/");
    expect(canonicalRedirectTarget("https://WWW.rnht.org/services/")).toBe("https://rnht.org/services/");
  });

  it("leaves the canonical host, the native app, previews and garbage alone", () => {
    expect(canonicalRedirectTarget("https://rnht.org/")).toBeNull();
    expect(canonicalRedirectTarget("capacitor://localhost/dashboard/")).toBeNull();
    expect(canonicalRedirectTarget("http://localhost:3000/")).toBeNull();
    expect(canonicalRedirectTarget("https://mukundakatta.github.io/rnht/")).toBeNull();
    expect(canonicalRedirectTarget("not a url")).toBeNull();
  });
});

describe("<CanonicalHost />", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders nothing and does not redirect on the canonical host (jsdom is localhost)", () => {
    const { container } = render(<CanonicalHost />);
    expect(container).toBeEmptyDOMElement();
  });
});
