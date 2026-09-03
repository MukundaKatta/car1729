import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => "/admin",
}));

const { rpcMock } = vi.hoisted(() => ({ rpcMock: vi.fn() }));

// One aggregate row, as the visit_stats() set-returning function reports it.
const VISIT_ROW = {
  today: 3,
  last_7_days: 21,
  last_30_days: 88,
  all_time: 1234,
  unique_30_days: 64,
  app_30_days: 19,
};

vi.mock("@/lib/supabase", () => ({
  supabase: {
    rpc: rpcMock,
    from: (table: string) => {
      if (table === "bookings") {
        return {
          select: (_cols: string, opts?: { count?: string; head?: boolean }) => {
            if (opts?.head) {
              return Promise.resolve({ count: 47, error: null });
            }
            return {
              eq: () => ({
                gte: () => Promise.resolve({ data: [{ total_amount: 101 }, { total_amount: 51 }], error: null }),
              }),
              order: () => ({
                limit: () =>
                  Promise.resolve({
                    data: [
                      {
                        id: "booking-1",
                        devotee_name: "Ramesh Kumar",
                        booking_date: "2026-03-15",
                        total_amount: 101,
                        status: "confirmed",
                        services: { name: "Ganapathi Homam" },
                      },
                    ],
                    error: null,
                  }),
              }),
            };
          },
        };
      }
      if (table === "donations") {
        return {
          select: () => ({
            eq: () => ({
              gte: () =>
                Promise.resolve({ data: [{ amount: 200 }, { amount: 150 }], error: null }),
            }),
          }),
        };
      }
      if (table === "services") {
        return {
          select: (_cols: string, opts?: { count?: string; head?: boolean }) => {
            if (opts?.head) {
              return {
                eq: () => Promise.resolve({ count: 12, error: null }),
              };
            }
            return Promise.resolve({ data: [], error: null });
          },
        };
      }
      return {
        select: () => ({
          eq: () => Promise.resolve({ data: [], error: null }),
        }),
      };
    },
  },
}));

import AdminDashboard from "@/app/admin/page";

describe("Admin dashboard", () => {
  beforeEach(() => {
    rpcMock.mockReset().mockResolvedValue({ data: [VISIT_ROW], error: null });
  });

  it("renders the dashboard heading and description", () => {
    render(<AdminDashboard />);
    expect(
      screen.getByRole("heading", { name: /Admin Dashboard/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/Manage temple services/i)).toBeInTheDocument();
  });

  it("renders the four stat cards", async () => {
    render(<AdminDashboard />);
    await waitFor(() => {
      expect(screen.getByText("Total Bookings")).toBeInTheDocument();
    });
    expect(screen.getByText("Donations (YTD)")).toBeInTheDocument();
    expect(screen.getByText("Service Revenue (YTD)")).toBeInTheDocument();
    expect(screen.getByText("Active Services")).toBeInTheDocument();
  });

  it("renders real numbers from Supabase", async () => {
    render(<AdminDashboard />);
    await waitFor(() => {
      // 47 bookings total
      expect(screen.getByText("47")).toBeInTheDocument();
    });
    // Active services count from the services.head query
    expect(screen.getByText("12")).toBeInTheDocument();
    // Donation sum 200 + 150 = $350.00
    expect(screen.getByText("$350.00")).toBeInTheDocument();
    // Service sum 101 + 51 = $152.00
    expect(screen.getByText("$152.00")).toBeInTheDocument();
  });

  it("renders quick links to the major admin areas", async () => {
    render(<AdminDashboard />);
    expect(screen.getByRole("link", { name: /News & Updates/i })).toHaveAttribute(
      "href",
      "/admin/news"
    );
    expect(screen.getByRole("link", { name: /Manage Services/i })).toHaveAttribute(
      "href",
      "/admin/services"
    );
    expect(screen.getByRole("link", { name: /Donations/i, exact: false } as any)).toBeTruthy();
    expect(screen.getByRole("link", { name: /Volunteers/i })).toHaveAttribute(
      "href",
      "/admin/volunteers"
    );
  });

  it("renders the most recent booking from the DB", async () => {
    render(<AdminDashboard />);
    await waitFor(() => {
      expect(screen.getByText("Ganapathi Homam")).toBeInTheDocument();
    });
    expect(screen.getByText("Ramesh Kumar")).toBeInTheDocument();
    expect(screen.getByText("$101.00")).toBeInTheDocument();
  });

  it("renders the Visitors card from the visit_stats RPC", async () => {
    render(<AdminDashboard />);
    await waitFor(() => {
      expect(screen.getByText("Visitors")).toBeInTheDocument();
    });
    expect(rpcMock).toHaveBeenCalledWith("visit_stats");
    expect(screen.getByText("Today")).toBeInTheDocument();
    expect(screen.getByText("Last 7 days")).toBeInTheDocument();
    expect(screen.getByText("Last 30 days")).toBeInTheDocument();
    expect(screen.getByText("All time")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("21")).toBeInTheDocument();
    expect(screen.getByText("88")).toBeInTheDocument();
    expect(screen.getByText((1234).toLocaleString())).toBeInTheDocument();
    expect(
      screen.getByText("64 unique visitors and 19 app opens in the last 30 days")
    ).toBeInTheDocument();
  });

  it("shows n/a for visitors when the RPC rejects, keeping the other stats", async () => {
    rpcMock.mockRejectedValue(new Error("network down"));
    vi.spyOn(console, "debug").mockImplementation(() => {});
    render(<AdminDashboard />);
    await waitFor(() => {
      expect(screen.getByText("47")).toBeInTheDocument();
    });
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("$350.00")).toBeInTheDocument();
    expect(screen.getByText("$152.00")).toBeInTheDocument();
    expect(screen.getByText("Visitors")).toBeInTheDocument();
    expect(screen.getAllByText("n/a")).toHaveLength(4);
    expect(screen.getByText("Visitor stats could not be loaded.")).toBeInTheDocument();
    // A visitor-counter failure is not a dashboard load error.
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows n/a (not \"not set up\") when visit_stats refuses a non-admin (42501)", async () => {
    rpcMock.mockResolvedValue({ data: null, error: { code: "42501", message: "admin only" } });
    render(<AdminDashboard />);
    await waitFor(() => {
      expect(screen.getByText("Visitor stats could not be loaded.")).toBeInTheDocument();
    });
    expect(screen.getAllByText("n/a")).toHaveLength(4);
    expect(screen.queryByText("Visitor counter not set up yet")).not.toBeInTheDocument();
    expect(screen.getByText("47")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("explains when the visitor counter is not set up yet (RPC missing)", async () => {
    rpcMock.mockResolvedValue({
      data: null,
      error: {
        code: "PGRST202",
        message: "Could not find the function public.visit_stats without parameters in the schema cache",
      },
    });
    render(<AdminDashboard />);
    await waitFor(() => {
      expect(screen.getByText("Visitor counter not set up yet")).toBeInTheDocument();
    });
    expect(screen.getByText("47")).toBeInTheDocument();
    expect(screen.queryByText("n/a")).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
