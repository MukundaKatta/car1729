"use client";

import { usePathname } from "next/navigation";

/**
 * Keeps page content readable on the deep-red mandala backdrop (#2).
 *
 * - Home (`/`) renders edge-to-edge: its sections are styled to sit directly
 *   on the red backdrop.
 * - Every other route is wrapped in a light "content sheet" so the existing
 *   dark text stays legible, with the red backdrop showing in the margins.
 */
export function PageSurface({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname === "/") {
    return <>{children}</>;
  }

  return (
    <div className="px-3 py-6 sm:px-5 sm:py-10">
      <div className="mx-auto max-w-6xl overflow-hidden rounded-[1.75rem] bg-temple-blush/95 shadow-[0_24px_70px_rgba(40,4,10,0.4)] ring-1 ring-temple-gold/25 backdrop-blur-sm">
        {children}
      </div>
    </div>
  );
}
