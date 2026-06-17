"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setError(true);
      return;
    }

    // Navigate at most once. The check-and-set is synchronous (single-threaded
    // JS), so the listener and the timeout's async getSession can't both replace
    // — previously the timeout checked the flag BEFORE its await, leaving a
    // window for a double router.replace.
    let navigated = false;
    const goToDashboard = () => {
      if (navigated) return;
      navigated = true;
      router.replace("/dashboard");
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        goToDashboard();
      } else if (event === "SIGNED_OUT" || event === "TOKEN_REFRESHED") {
        // Ignore these events
      }
    });

    // Fallback: check session after timeout
    const timeout = setTimeout(async () => {
      if (navigated) return;
      // Show the error screen rather than silently stranding the user on the
      // "Signing you in…" spinner if supabase became unavailable.
      if (!supabase) {
        setError(true);
        return;
      }
      const { data: { session } } = await supabase.auth.getSession();
      if (navigated) return;
      if (session) {
        goToDashboard();
      } else {
        setError(true);
      }
    }, 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [router]);

  if (error) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600 text-2xl">
            !
          </div>
          <h1 className="text-xl font-heading font-bold text-gray-900">
            Sign In Failed
          </h1>
          <p className="mt-2 text-gray-600">
            We couldn&apos;t complete your sign-in. The link may have expired or was already used.
          </p>
          <button
            onClick={() => router.replace("/login")}
            className="btn-primary mt-6"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-temple-gold/20 border-t-temple-gold" />
        <p className="text-gray-500 font-accent text-lg">
          Signing you in...
        </p>
      </div>
    </div>
  );
}
