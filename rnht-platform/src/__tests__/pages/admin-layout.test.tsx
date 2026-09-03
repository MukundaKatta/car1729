import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

const replace = vi.fn();

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace, back: vi.fn() }),
  usePathname: () => "/admin",
}));

const adminState = { isAdmin: false, signedIn: true, loading: false };

vi.mock("@/lib/admin", () => ({
  useIsAdmin: () => adminState,
}));

import AdminLayout from "@/app/admin/layout";

describe("AdminLayout", () => {
  beforeEach(() => {
    replace.mockClear();
    adminState.isAdmin = false;
    adminState.signedIn = true;
    adminState.loading = false;
  });

  it("shows a loading state while the admin role check is in flight", () => {
    adminState.loading = true;
    render(
      <AdminLayout>
        <p>child content</p>
      </AdminLayout>
    );
    expect(screen.getByText(/Checking access/i)).toBeInTheDocument();
    expect(screen.queryByText("child content")).not.toBeInTheDocument();
  });

  it("redirects non-admin users to '/' and shows an access-denied fallback", async () => {
    adminState.loading = false;
    adminState.isAdmin = false;
    render(
      <AdminLayout>
        <p>child content</p>
      </AdminLayout>
    );
    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith("/");
    });
    expect(screen.getByText(/Access denied/i)).toBeInTheDocument();
    expect(screen.queryByText("child content")).not.toBeInTheDocument();
  });

  it("renders children + sidebar nav for verified admins", () => {
    adminState.loading = false;
    adminState.isAdmin = true;
    render(
      <AdminLayout>
        <p>child content</p>
      </AdminLayout>
    );
    expect(screen.getByText("child content")).toBeInTheDocument();
    // Sidebar links land here
    expect(screen.getByRole("link", { name: /Dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /News & Updates/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Donations/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Priests/i })).toBeInTheDocument();
  });
  it("sends a signed-out visitor to the login page with a return path", async () => {
    adminState.loading = false;
    adminState.isAdmin = false;
    adminState.signedIn = false;
    render(<AdminLayout><div>secret</div></AdminLayout>);
    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith("/login?next=%2Fadmin");
    });
    expect(screen.getByText(/Please sign in/i)).toBeInTheDocument();
    expect(screen.queryByText("secret")).not.toBeInTheDocument();
  });
});
