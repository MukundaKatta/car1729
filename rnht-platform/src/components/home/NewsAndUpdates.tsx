"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Newspaper, ArrowRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { NewsPost } from "@/types/database";

type Props = {
  limit?: number;
  compact?: boolean;
};

/**
 * Shows the most recent published news_posts.
 * `compact` (used on /contact) drops the section header + extra chrome.
 */
export function NewsAndUpdates({ limit = 3, compact = false }: Props) {
  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!supabase) {
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("news_posts")
        .select(
          "id, slug, title, excerpt, hero_image_url, category, is_published, published_at, created_at"
        )
        .eq("is_published", true)
        .order("published_at", { ascending: false, nullsFirst: false })
        .limit(limit);
      setPosts((data ?? []) as unknown as NewsPost[]);
      setLoading(false);
    }
    load();
  }, [limit]);

  if (loading) {
    return (
      <div className={compact ? "space-y-3" : "mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8"}>
        {!compact && (
          <div className="text-center">
            <h2 className="section-heading">News &amp; Updates</h2>
          </div>
        )}
        <div className={`mt-6 grid gap-4 ${compact ? "" : "sm:grid-cols-3"}`}>
          {Array.from({ length: limit }).map((_, i) => (
            <div key={i} className="h-80 animate-pulse rounded-2xl bg-temple-ivory" />
          ))}
        </div>
      </div>
    );
  }

  if (posts.length === 0 && compact) return null;

  if (posts.length === 0) {
    return (
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="font-accent text-sm font-semibold tracking-[0.2em] uppercase text-temple-gold">
              Latest
            </p>
            <h2 className="mt-2 section-heading">News &amp; Updates</h2>
            <div className="ornament-divider"><span>&#x2733;</span></div>
            <p className="mx-auto max-w-xl text-gray-600 font-accent text-lg">
              Temple announcements and upcoming festivals will appear here.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const cards = (
    <div className={`grid gap-6 ${compact ? "" : "sm:grid-cols-3"}`}>
      {posts.map((post) => (
        <Link
          key={post.id}
          href={`/news?slug=${encodeURIComponent(post.slug)}`}
          className="card group flex flex-col overflow-hidden p-0 transition-all hover:border-temple-gold/40"
        >
          {post.hero_image_url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={post.hero_image_url}
              alt={post.title}
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
              <p className="mt-2 line-clamp-3 text-sm text-gray-600">{post.excerpt}</p>
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
  );

  if (compact) return <div>{cards}</div>;

  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-temple-gold/10 border border-temple-gold/20">
            <Newspaper className="h-7 w-7 text-temple-gold" />
          </div>
          <p className="font-accent text-sm font-semibold tracking-[0.2em] uppercase text-temple-gold">
            Latest
          </p>
          <h2 className="mt-2 section-heading">News &amp; Updates</h2>
          <div className="ornament-divider"><span>&#x2733;</span></div>
          <p className="mx-auto max-w-xl text-gray-600 font-accent text-lg">
            Festivals, announcements, and community updates
          </p>
        </div>
        <div className="mt-12">{cards}</div>
        <div className="mt-10 text-center">
          <Link href="/news" className="btn-outline inline-flex items-center gap-2">
            All News
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
