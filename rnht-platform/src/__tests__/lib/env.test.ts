import { describe, expect, it } from "vitest";
import { getAdminRoleConfig, getEnvValidationResult, parseEmailList } from "@/lib/env";

describe("env helpers", () => {
  it("reports missing core setup keys", () => {
    const result = getEnvValidationResult({
      NEXT_PUBLIC_SUPABASE_URL: "",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "",
      NEXT_PUBLIC_APP_URL: "",
    } as unknown as NodeJS.ProcessEnv);

    expect(result.missingCore).toEqual([
      "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      "NEXT_PUBLIC_APP_URL",
    ]);
  });

  it("parses comma-delimited email lists", () => {
    expect(parseEmailList(" lead@example.com,ops@example.com ,, ")).toEqual([
      "lead@example.com",
      "ops@example.com",
    ]);
  });

  it("returns admin role config from env", () => {
    const config = getAdminRoleConfig({
      NEXT_PUBLIC_RNHT_ADMIN_APPROVER_EMAILS: "approver@example.com",
      NEXT_PUBLIC_RNHT_ADMIN_EDITOR_EMAILS: "editor@example.com,editor2@example.com",
    } as unknown as NodeJS.ProcessEnv);

    expect(config.approverEmails).toEqual(["approver@example.com"]);
    expect(config.editorEmails).toEqual(["editor@example.com", "editor2@example.com"]);
  });
});
