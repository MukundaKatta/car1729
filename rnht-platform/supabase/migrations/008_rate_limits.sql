-- Rate limiting for the public donate endpoint.
--
-- Probing prod showed 10 concurrent donation creates from a single IP all
-- succeeded in ~2s: nothing throttles the public endpoint, so anyone can spam
-- pending rows into the admin inflow (and, for Zelle, one "new pledge" email to
-- the temple per request). This adds a shared fixed-window counter.
--
-- The counter lives in the DB rather than in edge-function memory because edge
-- functions are stateless and horizontally scaled — an in-process Map would
-- reset constantly and be trivially bypassed.

CREATE TABLE IF NOT EXISTS public.rate_limits (
  key TEXT PRIMARY KEY,
  window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  count INTEGER NOT NULL DEFAULT 0
);

-- Only the service role (which bypasses RLS) may touch this table: it is
-- infrastructure, never client data. RLS on with no policies = deny-all for
-- anon/authenticated.
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS rate_limits_window_start_idx
  ON public.rate_limits (window_start);

-- Atomically count one hit against `p_key` and report whether it is allowed.
--
-- The whole check is a single INSERT ... ON CONFLICT DO UPDATE ... RETURNING,
-- so concurrent requests serialize on the row lock: a burst of N parallel
-- calls yields N distinct counts, never N reads of the same stale value (the
-- read-then-write version would let a flood slip through).
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_key TEXT,
  p_max INTEGER,
  p_window_seconds INTEGER
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
  v_expired BOOLEAN;
BEGIN
  INSERT INTO public.rate_limits AS rl (key, window_start, count)
  VALUES (p_key, now(), 1)
  ON CONFLICT (key) DO UPDATE
    SET count = CASE
          WHEN rl.window_start < now() - make_interval(secs => p_window_seconds)
          THEN 1
          ELSE rl.count + 1
        END,
        window_start = CASE
          WHEN rl.window_start < now() - make_interval(secs => p_window_seconds)
          THEN now()
          ELSE rl.window_start
        END
  RETURNING rl.count INTO v_count;

  -- Opportunistic GC so the table cannot grow without bound as IPs rotate.
  -- Runs on ~0.5% of calls, and only touches windows that are long dead.
  IF random() < 0.005 THEN
    DELETE FROM public.rate_limits WHERE window_start < now() - INTERVAL '1 day';
  END IF;

  RETURN v_count <= p_max;
END;
$$;

-- The edge functions call this with the service role; no other role needs it.
REVOKE ALL ON FUNCTION public.check_rate_limit(TEXT, INTEGER, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.check_rate_limit(TEXT, INTEGER, INTEGER) FROM anon, authenticated;
