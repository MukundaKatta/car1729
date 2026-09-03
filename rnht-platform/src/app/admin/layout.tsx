"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  BookOpen,
  Calendar as CalendarIcon,
  DollarSign,
  Newspaper,
  Users as UsersIcon,
  Image as ImageIcon,
  FileText,
  HeartHandshake,
  Loader2,
} from "lucide-react";
import { useIsAdmin } from "@/lib/admin";

/**
 * Client-side admin gate.
 *
 * Next.js middleware isn't available with `output: 'export'`, so we enforce
 * the role check in the layout. Non-admins are bounced to /.
 *
 * Server-side RLS on Supabase tables is still the real security boundary —
 * this layout is just UX (redirects, sidebar, loading state).
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAdmin, signedIn, loading } = useIsAdmin();

  useEffect(() => {
    if (loading || isAdmin) return;
    // Signed out: go sign in and come straight back here. Signed in but not an
    // admin: home. (Silently bouncing everyone to "/" made the admin think the
    // page was broken.)
    router.replace(signedIn ? "/" : "/login?next=%2Fadmin");
  }, [loading, isAdmin, signedIn, router]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 text-temple-maroon">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="font-heading text-lg">Checking access…</span>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    // Rendered briefly before the redirect fires.
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <p className="font-heading text-xl text-temple-maroon">
            {signedIn ? "Access denied" : "Please sign in"}
          </p>
          <p className="mt-2 text-gray-600">
            {signedIn
              ? "This area is reserved for temple administrators."
              : "Sign in with your temple admin account to open the dashboard."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:flex-row lg:px-8">
      <aside className="lg:w-60 lg:shrink-0">
        <nav className="sticky top-20 space-y-1">
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
            Admin
          </p>
          <AdminLink href="/admin" icon={<LayoutDashboard className="h-4 w-4" />} label="Dashboard" />
          <AdminLink href="/admin/news" icon={<Newspaper className="h-4 w-4" />} label="News & Updates" />
          <AdminLink href="/admin/services" icon={<FileText className="h-4 w-4" />} label="Services" />
          <AdminLink href="/admin/services/upload" icon={<FileText className="h-4 w-4" />} label="Services PDF" />
          <AdminLink href="/admin/priests" icon={<UsersIcon className="h-4 w-4" />} label="Priests" />
          <AdminLink href="/admin/donations" icon={<DollarSign className="h-4 w-4" />} label="Donations" />
          <AdminLink href="/admin/volunteers" icon={<HeartHandshake className="h-4 w-4" />} label="Volunteers" />
          <AdminLink href="/admin/bookings" icon={<BookOpen className="h-4 w-4" />} label="Bookings" />
          <AdminLink href="/admin/events" icon={<CalendarIcon className="h-4 w-4" />} label="Events" />
          <AdminLink href="/admin/slideshow" icon={<ImageIcon className="h-4 w-4" />} label="Slideshow" />
        </nav>
      </aside>
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}

function AdminLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-temple-gold/10 hover:text-temple-maroon"
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}
