// Supabase Edge Function: delete-account
//
// Real in-app account deletion (Apple Guideline 5.1.1(v) / Google Play data
// deletion). The client sends the signed-in user's session token in
// x-user-token; we verify it server-side, then use the service role to delete
// the auth user. FK cascades on auth.users remove the profile and dependent
// rows; donations are retained for financial records but de-linked (user_id
// set null) so no personal account remains.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { corsHeaders, jsonHeaders } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: jsonHeaders,
    });
  }

  try {
    const token = req.headers.get("x-user-token") ?? "";
    if (!token) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: jsonHeaders,
      });
    }

    // Verify the token and resolve the caller's own user id — a user can only
    // ever delete themselves.
    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    const userId = userData?.user?.id;
    if (userErr || !userId) {
      return new Response(JSON.stringify({ error: "Invalid session" }), {
        status: 401,
        headers: jsonHeaders,
      });
    }

    // Retain donation rows for the temple's financial/tax records, but strip
    // the personal link so the deleted account leaves no PII association.
    // Check the error: if the de-link fails we must NOT proceed to delete the
    // auth user, or those donations would be orphaned to a now-missing account.
    const { error: unlinkErr } = await admin
      .from("donations")
      .update({ user_id: null })
      .eq("user_id", userId);
    if (unlinkErr) {
      console.error("delete-account unlink error:", unlinkErr);
      return new Response(JSON.stringify({ error: "Failed to delete account" }), {
        status: 500,
        headers: jsonHeaders,
      });
    }

    // Delete the auth user (cascades profile + user-owned rows via FK).
    const { error: delErr } = await admin.auth.admin.deleteUser(userId);
    if (delErr) {
      console.error("delete-account error:", delErr);
      return new Response(JSON.stringify({ error: "Failed to delete account" }), {
        status: 500,
        headers: jsonHeaders,
      });
    }

    return new Response(JSON.stringify({ ok: true }), { headers: jsonHeaders });
  } catch (err) {
    console.error("delete-account exception:", err);
    return new Response(JSON.stringify({ error: "Failed to delete account" }), {
      status: 500,
      headers: jsonHeaders,
    });
  }
});
