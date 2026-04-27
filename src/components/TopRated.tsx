"use client";

import { useEffect, useState, useRef } from "react";
import { getTopRatedByType, getImageUrl } from "@/lib/tmdb";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { useGlobalLoading } from "@/hooks/useGlobalLoading";
import Link from "next/link";

interface Media {
  id: number;
  media_type: "movie" | "tv";
  poster_path: string;
  backdrop_path: string;
  title?: string;
  name?: string;
  vote_average?: number;
  release_date?: string;
  first_air_date?: string;
}

export function TopRated() {
  const [data, setData] = useState<{ movie: Media[]; tv: Media[] }>({ movie: [], tv: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"movie" | "tv">("movie");
  const scrollRef = useRef<HTMLDivElement>(null);
  const { setIsLoading } = useGlobalLoading();

  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      try {
        const [movieResults, tvResults] = await Promise.all([
          getTopRatedByType("movie"),
          getTopRatedByType("tv"),
        ]);
        setData({
          movie: movieResults.slice(0, 10).map((i: any) => ({ ...i, media_type: "movie" })),
          tv: tvResults.slice(0, 10).map((i: any) => ({ ...i, media_type: "tv" })),
        });
      } catch {}
      setLoading(false);
    }
    fetchAll();
  }, []);

  const topRated = data[activeTab];

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const { scrollLeft, clientWidth } = scrollRef.current;
    scrollRef.current.scrollTo({ left: scrollLeft + (dir === "left" ? -clientWidth * 0.8 : clientWidth * 0.8), behavior: "smooth" });
  };

  const TabButton = ({ type, label }: { type: "movie" | "tv"; label: string }) => (
    <button
      onClick={() => setActiveTab(type)}
      className={`relative py-1.5 text-[10px] font-bold tracking-[0.2em] transition-all ${
        activeTab === type ? "text-white" : "text-zinc-500 hover:text-white"
      }`}
    >
      {label}
      {activeTab === type && (
        <motion.div
          layoutId="topRatedTab"
          className="absolute -bottom-1 left-0 w-full h-[2px] bg-white shadow-[0_0_8px_rgba(255,255,255,0.5)]"
        />
      )}
    </button>
  );

  if (loading) {
    return (
      <section className="w-full py-10 px-0">
        <div className="flex items-center justify-between mb-6 px-4">
          <h2 className="text-lg font-bold text-white uppercase tracking-[0.2em]">
            Top <span className="text-zinc-500">Rated</span>
          </h2>
        </div>
        <div className="flex gap-3 px-4 overflow-x-auto scrollbar-hide">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex-none w-[140px] sm:w-[160px]">
              <div className="aspect-[2/3] rounded-2xl bg-zinc-800 animate-pulse" />
              <div className="mt-2.5 space-y-1.5">
                <div className="h-3.5 bg-zinc-800 rounded animate-pulse w-4/5" />
                <div className="h-3 bg-zinc-800 rounded animate-pulse w-3/5" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="w-full py-10 px-0 overflow-visible relative">
      <div className="flex items-center justify-between mb-6 px-4">
        <h2 className="text-lg font-bold text-white uppercase tracking-[0.2em]">
          Top <span className="text-zinc-500">Rated</span>
        </h2>
      </div>

      <div
        ref={scrollRef}
        className="flex overflow-x-auto gap-3 scrollbar-hide px-4 scroll-smooth mb-5 overscroll-x-contain"
        style={{ touchAction: "pan-x pinch-zoom" }}
      >
        {topRated.map((item, index) => {
          const title = item.title || item.name || "";
          const year = (item.release_date || item.first_air_date || "").slice(0, 4);
          const rating = item.vote_average ? item.vote_average.toFixed(1) : null;
          const typeLabel = activeTab === "movie" ? "Movie" : "TV Show";

          return (
            <motion.div
              key={`${item.id}-${activeTab}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04, duration: 0.3 }}
              className="flex-none w-[140px] sm:w-[160px] md:w-[180px] group"
            >
              <Link
                href={`/${activeTab}/${item.id}`}
                onClick={() => setIsLoading(true)}
                className="block"
              >
                <div className="aspect-[2/3] rounded-2xl overflow-hidden bg-zinc-900 shadow-lg">
                  <img
                    src={getImageUrl(item.poster_path)}
                    alt={title}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
              </Link>

              {/* Info below */}
              <div className="mt-2.5 px-0.5">
                <p className="text-[13px] font-semibold text-white line-clamp-1 leading-tight">
                  {title}
                </p>
                <div className="flex items-center gap-1 mt-1 text-[11px] text-white/45">
                  {rating && (
                    <>
                      <Star className="w-2.5 h-2.5 fill-yellow-600 text-yellow-600 flex-shrink-0" />
                      <span>{rating}</span>
                      <span className="text-white/20">·</span>
                    </>
                  )}
                  {year && <><span>{year}</span><span className="text-white/20">·</span></>}
                  <span>{typeLabel}</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="flex items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <TabButton type="movie" label="MOVIE" />
          <TabButton type="tv" label="TV" />
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => scroll("left")} className="p-1.5 rounded-full bg-zinc-900/80 text-white hover:bg-white hover:text-black transition-all border border-white/10">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={() => scroll("right")} className="p-1.5 rounded-full bg-zinc-900/80 text-white hover:bg-white hover:text-black transition-all border border-white/10">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
