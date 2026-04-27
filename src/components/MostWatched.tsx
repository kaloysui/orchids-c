"use client";

import { useEffect, useState, useRef } from "react";
import { getPopularByType, getImageUrl } from "@/lib/tmdb";
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

export function MostWatched() {
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
          getPopularByType("movie"),
          getPopularByType("tv"),
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

  const popular = data[activeTab];

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
          layoutId="mostWatchedTab"
          className="absolute -bottom-1 left-0 w-full h-[2px] bg-white shadow-[0_0_8px_rgba(255,255,255,0.5)]"
        />
      )}
    </button>
  );

  if (loading) {
    return (
      <section className="w-full py-10 px-0">
        <div className="flex items-end gap-3 mb-6 px-4">
          <h2 className="text-5xl sm:text-6xl font-black text-white/10 leading-none tracking-tight uppercase">TOP10</h2>
          <p className="text-[10px] font-bold tracking-[0.3em] text-zinc-500 uppercase mb-1">Content Today</p>
        </div>
        <div className="flex gap-1 px-4 overflow-x-auto scrollbar-hide">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex-none flex items-end">
              <div className="w-16 text-[80px] font-black text-zinc-800 leading-none select-none -mr-2">{i}</div>
              <div>
                <div className="w-[130px] sm:w-[150px] aspect-[2/3] rounded-2xl bg-zinc-800 animate-pulse" />
                <div className="mt-2 space-y-1.5 w-[130px] sm:w-[150px]">
                  <div className="h-3.5 bg-zinc-800 rounded animate-pulse w-4/5" />
                  <div className="h-3 bg-zinc-800 rounded animate-pulse w-3/5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="w-full py-10 px-0 overflow-visible relative">
      {/* TOP 10 Header */}
      <div className="flex items-end gap-3 mb-6 px-4">
        <h2 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black leading-none tracking-tight uppercase tmdb-top10-title">
          TOP10
        </h2>
        <div className="flex flex-col mb-1">
          <p className="text-[10px] sm:text-xs font-bold tracking-[0.3em] text-zinc-400 uppercase">Content</p>
          <p className="text-[10px] sm:text-xs font-bold tracking-[0.3em] text-zinc-400 uppercase">Today</p>
        </div>
      </div>

      {/* Scrollable cards */}
      <div
        ref={scrollRef}
        className="flex overflow-x-auto overflow-y-hidden gap-1 sm:gap-2 scrollbar-hide pl-4 pr-8 scroll-smooth mb-5 overscroll-x-contain"
        style={{ touchAction: "pan-x pinch-zoom" }}
      >
        {popular.map((item, index) => {
          const title = item.title || item.name || "";
          const year = (item.release_date || item.first_air_date || "").slice(0, 4);
          const rating = item.vote_average ? item.vote_average.toFixed(1) : null;
          const typeLabel = activeTab === "movie" ? "Movie" : "TV Show";

          return (
            <motion.div
              key={`${item.id}-${activeTab}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="relative flex-none group"
            >
              <div className="flex items-end">
                {/* Rank number */}
                <div className="relative z-0 flex-shrink-0 -mr-2 sm:-mr-3 tmdb-num-wrap">
                  <span className="tmdb-rank-number text-[100px] sm:text-[120px] md:text-[140px] font-black leading-none select-none">
                    {index + 1}
                  </span>
                </div>

                {/* Poster + info */}
                <div className="relative z-10 flex-shrink-0">
                  <Link
                    href={`/${activeTab}/${item.id}`}
                    onClick={() => setIsLoading(true)}
                    className="block"
                  >
                    <div className="w-[130px] sm:w-[150px] md:w-[170px] aspect-[2/3] rounded-2xl overflow-hidden bg-zinc-900 shadow-2xl">
                      <img
                        src={getImageUrl(item.poster_path)}
                        alt={title}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                  </Link>

                  {/* Info below poster */}
                  <div className="mt-2.5 px-0.5 w-[130px] sm:w-[150px] md:w-[170px]">
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
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Tabs + arrows */}
      <div className="flex items-center justify-between px-4 mt-2">
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
