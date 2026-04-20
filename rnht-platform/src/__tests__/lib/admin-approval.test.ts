import { describe, expect, it, vi } from "vitest";
import {
  canPerformSensitiveAction,
  queuePendingApproval,
  resolveAdminRole,
} from "@/lib/admin-approval";

vi.mock("@/lib/env", () => ({
  getAdminRoleConfig: () => ({
    approverEmails: ["approver@rnht.org"],
    editorEmails: ["editor@rnht.org"],
  }),
}));

describe("admin approval helpers", () => {
  it("resolves approver and editor roles from env-configured emails", () => {
    expect(resolveAdminRole("approver@rnht.org")).toBe("approver");
    expect(resolveAdminRole("editor@rnht.org")).toBe("editor");
    expect(resolveAdminRole("someone-else@rnht.org")).toBe("editor");
  });

  it("checks whether a role can perform a sensitive action", () => {
    expect(canPerformSensitiveAction("approver", "delete_service")).toBe(true);
    expect(canPerformSensitiveAction("editor", "delete_service")).toBe(false);
    expect(canPerformSensitiveAction("editor", "publish_news_post")).toBe(true);
  });

  it("queues pending approvals with audit metadata", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-20T12:00:00Z"));

    const approvals = queuePendingApproval([], {
      action: "delete_news_post",
      resourceLabel: "Festival update",
      requestedBy: "editor@rnht.org",
      reason: "Delete outdated festival update",
    });

    expect(approvals).toHaveLength(1);
    expect(approvals[0].status).toBe("pending");
    expect(approvals[0].requestedAt).toBe("2026-04-20T12:00:00.000Z");
    expect(approvals[0].reason).toContain("festival");

    vi.useRealTimers();
  });
});
