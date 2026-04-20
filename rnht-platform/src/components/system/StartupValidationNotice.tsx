"use client";

import { getEnvValidationResult, hasBlockingEnvIssues } from "@/lib/env";

export function StartupValidationNotice() {
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  const validation = getEnvValidationResult();
  if (!hasBlockingEnvIssues()) {
    return null;
  }

  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <div className="mx-auto max-w-7xl">
        <p className="font-semibold">Local setup needs a few environment values before auth and admin flows work.</p>
        <p className="mt-1">
          Copy <code className="rounded bg-white px-1 py-0.5 text-xs">.env.example</code> to{" "}
          <code className="rounded bg-white px-1 py-0.5 text-xs">.env.local</code> and fill in:
        </p>
        <ul className="mt-2 list-disc pl-5">
          {validation.missingCore.map((key) => (
            <li key={key}>
              <code className="rounded bg-white px-1 py-0.5 text-xs">{key}</code>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
