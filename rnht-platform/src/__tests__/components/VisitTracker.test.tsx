import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, waitFor } from "@testing-library/react";

const { rpcMock } = vi.hoisted(() => ({ rpcMock: vi.fn() }));

vi.mock("@/lib/supabase", () => ({
  supabase: { rpc: rpcMock },
}));
vi.mock("@/lib/capacitor", () => ({
  isNative: vi.fn(() => false),
}));

import { VisitTracker } from "@/components/VisitTracker";
import { isNative } from "@/lib/capacitor";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Replace window.<name> with a stub; returns a restore function. */
function stubStorage(name: "localStorage" | "sessionStorage", value: unknown) {
  const original = Object.getOwnPropertyDescriptor(window, name);
  Object.defineProperty(window, name, { configurable: true, value });
  return () => {
    if (original) Object.defineProperty(window, name, original);
    else delete (window as unknown as Record<string, unknown>)[name];
  };
}

describe("VisitTracker", () => {
  beforeEach(() => {
    rpcMock.mockReset().mockResolvedValue({ data: null, error: null });
    vi.mocked(isNative).mockReturnValue(false);
    window.sessionStorage.clear();
    window.localStorage.clear();
    window.history.pushState({}, "", "/");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders nothing", () => {
    const { container } = render(<VisitTracker />);
    expect(container).toBeEmptyDOMElement();
  });

  it("records one web visit with a persisted 36-char visitor id", () => {
    window.history.pushState({}, "", "/services");
    render(<VisitTracker />);

    expect(rpcMock).toHaveBeenCalledTimes(1);
    const [fn, args] = rpcMock.mock.calls[0];
    expect(fn).toBe("record_visit");
    expect(args).toEqual({
      p_visitor: expect.stringMatching(UUID_RE),
      p_path: "/services",
      p_platform: "web",
    });
    expect(args.p_visitor).toHaveLength(36);
    expect(window.localStorage.getItem("rnht_vid")).toBe(args.p_visitor);
    expect(window.sessionStorage.getItem("rnht_visit_logged")).toBe("1");
  });

  it('reports platform "app" inside the native shell', () => {
    vi.mocked(isNative).mockReturnValue(true);
    render(<VisitTracker />);
    expect(rpcMock).toHaveBeenCalledWith(
      "record_visit",
      expect.objectContaining({ p_platform: "app" })
    );
  });

  it("does not record again in the same session, and reuses the id in a new one", () => {
    const first = render(<VisitTracker />);
    first.unmount();
    render(<VisitTracker />);
    expect(rpcMock).toHaveBeenCalledTimes(1);
    const id = rpcMock.mock.calls[0][1].p_visitor;

    // New browser session on the same device: logged again, same visitor id.
    window.sessionStorage.clear();
    render(<VisitTracker />);
    expect(rpcMock).toHaveBeenCalledTimes(2);
    expect(rpcMock.mock.calls[1][1].p_visitor).toBe(id);
  });

  it("skips admin pages entirely", () => {
    window.history.pushState({}, "", "/admin/bookings");
    render(<VisitTracker />);
    expect(rpcMock).not.toHaveBeenCalled();
    expect(window.sessionStorage.getItem("rnht_visit_logged")).toBeNull();
  });

  it("survives a rejected rpc without throwing", async () => {
    rpcMock.mockRejectedValue(new Error("network down"));
    const debug = vi.spyOn(console, "debug").mockImplementation(() => {});
    expect(() => render(<VisitTracker />)).not.toThrow();
    await waitFor(() => expect(debug).toHaveBeenCalled());
  });

  it("survives an rpc that resolves with an error", async () => {
    rpcMock.mockResolvedValue({ data: null, error: { message: "permission denied" } });
    const debug = vi.spyOn(console, "debug").mockImplementation(() => {});
    render(<VisitTracker />);
    await waitFor(() =>
      expect(debug).toHaveBeenCalledWith("Visit not recorded:", "permission denied")
    );
  });

  it("still records when storage throws (private mode)", () => {
    const throwing = {
      getItem() {
        throw new Error("blocked");
      },
      setItem() {
        throw new Error("blocked");
      },
    };
    const restoreSession = stubStorage("sessionStorage", throwing);
    const restoreLocal = stubStorage("localStorage", throwing);
    try {
      expect(() => render(<VisitTracker />)).not.toThrow();
      expect(rpcMock).toHaveBeenCalledTimes(1);
      expect(rpcMock.mock.calls[0][1].p_visitor).toMatch(UUID_RE);
    } finally {
      restoreSession();
      restoreLocal();
    }
  });

  it("falls back to a Math.random id when crypto.randomUUID is unavailable", () => {
    Object.defineProperty(crypto, "randomUUID", { configurable: true, value: undefined });
    try {
      render(<VisitTracker />);
      const id = rpcMock.mock.calls[0][1].p_visitor;
      expect(id).toHaveLength(36);
      expect(id).toMatch(UUID_RE);
    } finally {
      delete (crypto as unknown as Record<string, unknown>).randomUUID;
    }
  });
});
