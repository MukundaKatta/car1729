-- migration-004-slides-columns.sql
--
-- Fix: admin slideshow CRUD was fully broken — the store wrote columns that
-- don't exist on `slides` (type, cta_text, show_text) and used the wrong names
-- for others (url/cta_link/is_active vs the actual image_url/link_url/active),
-- plus injected a non-UUID client id into the uuid PK. The store is realigned
-- to the real column names; this migration adds the three genuinely-missing
-- columns the admin UI needs (video slides, CTA label, show/hide overlay text).

ALTER TABLE public.slides
  ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'image',
  ADD COLUMN IF NOT EXISTS cta_text text,
  ADD COLUMN IF NOT EXISTS show_text boolean NOT NULL DEFAULT true;
