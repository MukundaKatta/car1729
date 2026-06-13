"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Calendar as CalendarIcon, Newspaper } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { NewsPost } from "@/types/database";

/**
 * Public news & updates listing.
 *
 * Static-export compatible: no dynamic `/news/[slug]` routes. Direct
 * links land here with `?slug=...` which expands the matching post.
 */
export default function NewsPage() {
  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [activeSlug, setActiveSlug] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      setActiveSlug(params.get("slug"));
    }
  }, []);

  useEffect(() => {
    async function load() {
      if (!supabase) {
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from("news_posts")
        .select("*")
        .eq("is_published", true)
        .order("published_at", { ascending: false, nullsFirst: false });
      if (error) setLoadError(true);
      setPosts((data ?? []) as unknown as NewsPost[]);
      setLoading(false);
    }
    load();
  }, []);

  const active = useMemo(
    () => posts.find((p) => p.slug === activeSlug) ?? null,
    [posts, activeSlug]
  );

  if (active) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <button
          onClick={() => {
            setActiveSlug(null);
            window.history.replaceState(null, "", "/news");
          }}
          className="inline-flex items-center gap-2 text-sm text-temple-red hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          All News
        </button>
        <article className="mt-6">
          {active.hero_image_url && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={active.hero_image_url}
              alt=""
              className="aspect-[16/9] w-full rounded-2xl object-cover"
            />
          )}
          <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-temple-gold">
            {active.category}
          </p>
          <h1 className="mt-2 font-heading text-3xl font-bold text-temple-maroon sm:text-4xl">
            {active.title}
          </h1>
          {active.published_at && (
            <p className="mt-2 flex items-center gap-2 text-sm text-gray-500">
              <CalendarIcon className="h-4 w-4" />
              {new Date(active.published_at).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          )}
          {active.excerpt && (
            <p className="mt-6 text-lg text-gray-700">{active.excerpt}</p>
          )}
          {active.body_markdown && (
            <div className="prose prose-lg mt-6 max-w-none whitespace-pre-wrap text-gray-800">
              {active.body_markdown}
            </div>
          )}
        </article>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="text-center">
        <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-temple-gold/10 border border-temple-gold/20">
          <Newspaper className="h-7 w-7 text-temple-gold" />
        </div>
        <h1 className="mt-4 section-heading">News &amp; Updates</h1>
        <p className="mx-auto mt-3 max-w-xl text-gray-600">
          Festivals, announcements, and community updates from the temple.
        </p>
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-48 animate-pulse rounded-2xl bg-temple-ivory" />
            ))
          : posts.length === 0
            ? (
              <p className="col-span-full py-12 text-center text-gray-500">
                {loadError
                  ? "We couldn't load the latest news right now. Please try again shortly."
                  : "No news or updates have been posted yet. Please check back soon."}
              </p>
            )
            : posts.map((post) => (
                <Link
                  key={post.id}
                  href={`/news?slug=${encodeURIComponent(post.slug)}`}
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveSlug(post.slug);
                    window.history.pushState(null, "", `/news?slug=${post.slug}`);
                    window.scrollTo(0, 0);
                  }}
                  className="card group flex flex-col overflow-hidden p-0 transition-all hover:border-temple-gold/40"
                >
                  {post.hero_image_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={post.hero_image_url}
                      alt=""
                      className="h-40 w-full object-cover"
                    />
                  ) : (
                    <div className="h-40 w-full bg-gradient-to-br from-temple-maroon to-[#5E0A1F]" />
                  )}
                  <div className="flex flex-1 flex-col p-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-temple-gold">
                      {post.category}
                    </p>
                    <h3 className="mt-2 font-heading text-lg font-bold text-temple-maroon transition-colors group-hover:text-temple-red">
                      {post.title}
                    </h3>
                    {post.excerpt && (
                      <p className="mt-2 line-clamp-3 text-sm text-gray-600">
                        {post.excerpt}
                      </p>
                    )}
                    {post.published_at && (
                      <p className="mt-3 text-xs text-gray-500">
                        {new Date(post.published_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
      </div>
    </div>
  );
}
