import { describe, it, expect } from "vitest";
import { safeHref } from "@/lib/url";

describe("safeHref", () => {
  it("allows the schemes the app uses", () => {
    expect(safeHref("https://wa.me/15125450473")).toBe("https://wa.me/15125450473");
    expect(safeHref("http://example.org")).toBe("http://example.org");
    expect(safeHref("tel:+15125450473")).toBe("tel:+15125450473");
    expect(safeHref("mailto:temple@example.org")).toBe("mailto:temple@example.org");
  });

  it("rejects dangerous schemes (stored XSS)", () => {
    expect(safeHref("javascript:alert(1)")).toBeUndefined();
    // eslint-disable-next-line no-script-url
    expect(safeHref("  JavaScript:alert(1)")).toBeUndefined();
    expect(safeHref("data:text/html,<script>alert(1)</script>")).toBeUndefined();
    expect(safeHref("vbscript:msgbox(1)")).toBeUndefined();
  });

  it("passes through relative/anchor links", () => {
    expect(safeHref("/donate")).toBe("/donate");
    expect(safeHref("#top")).toBe("#top");
  });

  it("assumes https for bare hosts and passes protocol-relative urls through", () => {
    expect(safeHref("wa.me/15125450473")).toBe("https://wa.me/15125450473");
    // Protocol-relative is safe as-is (browser uses the page's scheme).
    expect(safeHref("//cdn.example.org/x")).toBe("//cdn.example.org/x");
  });

  it("returns undefined for empty/nullish input", () => {
    expect(safeHref("")).toBeUndefined();
    expect(safeHref(null)).toBeUndefined();
    expect(safeHref(undefined)).toBeUndefined();
    expect(safeHref("   ")).toBeUndefined();
  });
});
