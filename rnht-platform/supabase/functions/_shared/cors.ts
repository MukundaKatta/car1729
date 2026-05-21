// Shared CORS headers for browser callers (the rnht-platform.web.app site).
// Edge Functions reply to OPTIONS pre-flights with these and add them to
// every JSON response.
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

export const jsonHeaders = {
  ...corsHeaders,
  "Content-Type": "application/json",
};
