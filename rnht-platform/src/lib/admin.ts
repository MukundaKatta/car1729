import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

/**
 * Server/shared helper: check whether a user id has the is_admin flag set
 * on their profiles row. Returns false when supabase isn't configured
 * (static builds) or the user isn't signed in.
 */
export async function isAdmin(userId: string | undefined | null): Promise<boolean> {
  if (!userId) return false;
  if (!supabase) return false;
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", userId)
      .maybeSingle();
    if (error) return false;
    return Boolean(data?.is_admin);
  } catch {
    return false;
  }
}

/**
 * Client hook: subscribes to the current auth session and returns
 * { isAdmin, signedIn, loading } based on the session and the profiles.is_admin
 * flag. signedIn lets the admin layout send a signed-OUT visitor to /login
 * (with a return path) instead of silently bouncing them to the homepage.
 *
 * Used by admin page components to render a loading state while the
 * middleware hasn't kicked in yet (e.g. during client-side navigation).
 */
export function useIsAdmin() {
  const [state, setState] = useState<{ isAdmin: boolean; signedIn: boolean; loading: boolean }>({
    isAdmin: false,
    signedIn: false,
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;
    async function check() {
      if (!supabase) {
        if (!cancelled) setState({ isAdmin: false, signedIn: false, loading: false });
        return;
      }
      try {
        const { data: sess } = await supabase.auth.getSession();
        const uid = sess.session?.user.id;
        const admin = await isAdmin(uid);
        if (!cancelled) setState({ isAdmin: admin, signedIn: Boolean(uid), loading: false });
      } catch {
        // A failed session lookup must not throw an unhandled rejection — treat
        // it as "not an admin" and stop loading (the admin layout still guards
        // server-side / on its own check).
        if (!cancelled) setState({ isAdmin: false, signedIn: false, loading: false });
      }
    }
    check();
    const { data: sub } = supabase?.auth.onAuthStateChange(() => {
      check();
    }) ?? { data: { subscription: { unsubscribe() {} } } as unknown as { subscription: { unsubscribe(): void } } };
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  return state;
}
