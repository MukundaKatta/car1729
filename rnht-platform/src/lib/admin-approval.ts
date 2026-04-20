"use client";

import { useEffect, useMemo, useState } from "react";
import { getAdminRoleConfig } from "@/lib/env";

export type AdminRole = "viewer" | "editor" | "approver";
export type SensitiveAdminAction =
  | "delete_service"
  | "delete_news_post"
  | "delete_donation_type"
  | "publish_news_post"
  | "activate_service"
  | "deactivate_service"
  | "activate_donation_type"
  | "deactivate_donation_type";

export type PendingAdminApproval = {
  id: string;
  action: SensitiveAdminAction;
  resourceLabel: string;
  requestedBy: string;
  reason: string;
  requestedAt: string;
  status: "pending";
};

const STORAGE_KEY = "rnht_admin_pending_approvals";

const ROLE_RANK: Record<AdminRole, number> = {
  viewer: 0,
  editor: 1,
  approver: 2,
};

const REQUIRED_ROLE: Record<SensitiveAdminAction, AdminRole> = {
  delete_service: "approver",
  delete_news_post: "approver",
  delete_donation_type: "approver",
  publish_news_post: "editor",
  activate_service: "editor",
  deactivate_service: "editor",
  activate_donation_type: "editor",
  deactivate_donation_type: "editor",
};

export function resolveAdminRole(email: string | null | undefined): AdminRole {
  const normalizedEmail = (email || "").trim().toLowerCase();
  const { approverEmails, editorEmails } = getAdminRoleConfig();

  if (!normalizedEmail) {
    return approverEmails.length || editorEmails.length ? "editor" : "approver";
  }
  if (approverEmails.includes(normalizedEmail)) return "approver";
  if (editorEmails.includes(normalizedEmail)) return "editor";
  if (approverEmails.length || editorEmails.length) return "editor";
  return "approver";
}

export function canPerformSensitiveAction(role: AdminRole, action: SensitiveAdminAction) {
  return ROLE_RANK[role] >= ROLE_RANK[REQUIRED_ROLE[action]];
}

export function queuePendingApproval(
  approvals: PendingAdminApproval[],
  approval: Omit<PendingAdminApproval, "id" | "requestedAt" | "status">
) {
  return [
    {
      ...approval,
      id: `${approval.action}-${Date.now()}`,
      requestedAt: new Date().toISOString(),
      status: "pending" as const,
    },
    ...approvals,
  ];
}

function loadPendingApprovals(): PendingAdminApproval[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persistPendingApprovals(approvals: PendingAdminApproval[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(approvals));
}

export function useSensitiveAdminApproval(email: string | null | undefined) {
  const adminRole = useMemo(() => resolveAdminRole(email), [email]);
  const [pendingApprovals, setPendingApprovals] = useState<PendingAdminApproval[]>([]);

  useEffect(() => {
    setPendingApprovals(loadPendingApprovals());
  }, []);

  function addPendingApproval(action: SensitiveAdminAction, resourceLabel: string, reason: string) {
    const next = queuePendingApproval(pendingApprovals, {
      action,
      resourceLabel,
      requestedBy: email || "unknown-admin",
      reason,
    });
    setPendingApprovals(next);
    persistPendingApprovals(next);
    return next[0];
  }

  function dismissPendingApproval(id: string) {
    const next = pendingApprovals.filter((approval) => approval.id !== id);
    setPendingApprovals(next);
    persistPendingApprovals(next);
  }

  async function confirmOrQueue(options: {
    action: SensitiveAdminAction;
    resourceLabel: string;
    confirmMessage: string;
    approvalReason: string;
    run: () => Promise<void>;
  }) {
    if (canPerformSensitiveAction(adminRole, options.action)) {
      if (!window.confirm(options.confirmMessage)) return { executed: false, approvalQueued: false };
      await options.run();
      return { executed: true, approvalQueued: false };
    }

    addPendingApproval(options.action, options.resourceLabel, options.approvalReason);
    return { executed: false, approvalQueued: true };
  }

  return {
    adminRole,
    pendingApprovals,
    dismissPendingApproval,
    confirmOrQueue,
  };
}
