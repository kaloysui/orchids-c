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
  logoPath?: string | null;
  vote_average?: number;
  release_date?: string;
  first_air_date?: string;
}

export function MostWatched() {
  const [data, setData] = useState<{ movie: Media[], tv: Media[] }>({ movie: [], tv: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"movie" | "tv">("movie");
  const scrollRef = useRef<HTMLDivElement>(null);
  const { setIsLoading } = useGlobalLoading();

  useEffect(() => {
    async function fetchAllPopular() {
      setLoading(true);
      try {
        const [movieResults, tvResults] = await Promise.all([
          getPopularByType("movie"),
          getPopularByType("tv")
        ]);

          const processItems = (items: any[], type: "movie" | "tv") => {
            return items.slice(0, 10).map((item: any) => ({
              ...item,
              media_type: type,
              logoPath: null
            }));
          };

          setData({
            movie: processItems(movieResults, "movie"),
            tv: processItems(tvResults, "tv")
          });
        setLoading(false);
      } catch (error) {
        console.error("Error fetching popular data:", error);
        setLoading(false);
      }
    }
    fetchAllPopular();
  }, []);

  const popular = data[activeTab];

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === "left" 
        ? scrollLeft - clientWidth * 0.8 
        : scrollLeft + clientWidth * 0.8;
      
      scrollRef.current.scrollTo({
        left: scrollTo,
        behavior: "smooth"
      });
    }
  };

  const TabButton = ({ type, label }: { type: "movie" | "tv", label: string }) => (
    <button
      onClick={() => setActiveTab(type)}
      className={`relative py-1.5 text-[10px] font-bold tracking-[0.2em] transition-all ${
        activeTab === type 
          ? "text-white" 
          : "text-zinc-500 hover:text-white"
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

  if (loading && popular.length === 0) {
    return (
      <div className="w-full py-10 px-0">
        <div className="flex items-start gap-3 mb-8 px-4">
          <div className="flex flex-col">
            <h2 className="text-5xl sm:text-6xl md:text-7xl font-black text-white/10 leading-none tracking-tight">
              TOP10
            </h2>
            <p className="text-[10px] font-bold tracking-[0.3em] text-zinc-500 uppercase mt-1 ml-0.5">
              Content Today
            </p>
          </div>
        </div>
          <div className="flex overflow-x-auto gap-6 px-4 scrollbar-hide">
            {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex-none w-[150px] sm:w-[170px] md:w-[200px] aspect-[2/3] animate-pulse bg-zinc-800" />
              ))}
          </div>
      </div>
    );
  }

  return (
    <section className="w-full py-10 px-0 overflow-visible relative">
      {/* TOP 10 Header */}
      <div className="flex items-end justify-between mb-6 px-4">
        <div className="flex items-end gap-3">
            <h2 className="text-5xl sm:text-6xl md:text-7xl font-black leading-none tracking-tight">
              <span className="text-transparent bg-clip-text" style={{
                WebkitTextStroke: '1.5px color-mix(in oklch, var(--primary) 50%, transparent)',
              }}>TOP</span>
              <span className="text-transparent bg-clip-text" style={{
                WebkitTextStroke: '2px color-mix(in oklch, var(--primary) 60%, transparent)',
              }}>10</span>
            </h2>
          <div className="flex flex-col mb-1">
            <p className="text-[10px] sm:text-xs font-bold tracking-[0.3em] text-zinc-400 uppercase">
              Content
            </p>
            <p className="text-[10px] sm:text-xs font-bold tracking-[0.3em] text-zinc-400 uppercase">
              Today
            </p>
          </div>
        </div>
      </div>

      {/* Scrollable cards with rank numbers */}
      <div className="relative">
        <div 
          ref={scrollRef}
          className="flex overflow-x-auto overflow-y-hidden gap-1 sm:gap-2 scrollbar-hide pl-4 pr-8 scroll-smooth mb-6 overscroll-x-contain overscroll-y-none"
            style={{ touchAction: 'pan-x pinch-zoom' }}
        >
          {popular.map((item, index) => (
            <motion.div
              key={`${item.id}-${activeTab}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="relative flex-none group will-change-transform"
            >
              <div className="flex items-end">
                  {/* Large ranking number */}
                  <div className="relative z-0 flex-shrink-0 -mr-2 sm:-mr-3">
                      <span 
                          className="text-[100px] sm:text-[120px] md:text-[140px] font-black leading-none select-none"
                        style={{
                          color: 'transparent',
                          WebkitTextStroke: '2px color-mix(in oklch, var(--primary) 30%, transparent)',
                          filter: 'drop-shadow(0 0 20px color-mix(in oklch, var(--primary) 10%, transparent))',
                        }}
                      >
                      {index + 1}
                    </span>
                  </div>

                  {/* Poster card */}
                  <Link 
                    href={`/${activeTab}/${item.id}`}
                    onClick={() => setIsLoading(true)}
                      className="relative z-10 block w-[150px] sm:w-[170px] md:w-[200px] aspect-[2/3] overflow-hidden shadow-2xl cursor-pointer bg-zinc-900 flex-shrink-0"
                  >
                  <img
                    src={getImageUrl(item.poster_path)}
                    alt={item.title || item.name}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 will-change-transform"
                  />

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity duration-300 z-10">
                    <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/60 backdrop-blur-md border border-white/10 w-fit rounded-full flex items-center gap-1">
                      <Star className="w-2.5 h-2.5 text-yellow-500 fill-yellow-500" />
                      <p className="text-[10px] text-yellow-500 font-bold">
                        {Math.floor(item.vote_average || 0)}
                      </p>
                    </div>
                    {(item.release_date || item.first_air_date) && (
                      <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/60 backdrop-blur-md border border-white/10 w-fit rounded-full">
                        <p className="text-[10px] text-white font-bold">
                          {(item.release_date || item.first_air_date || "").split("-")[0]}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Bottom gradient */}
                  <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>

        </div>

        {/* Bottom tabs + arrows */}
        <div className="flex items-center justify-between px-4 mt-2">
          <div className="flex items-center gap-6">
            <TabButton type="movie" label="MOVIE" />
            <TabButton type="tv" label="TV" />
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => scroll("left")}
              className="p-1.5 rounded-full bg-zinc-900/80 text-white hover:bg-white hover:text-black transition-all border border-white/10"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll("right")}
              className="p-1.5 rounded-full bg-zinc-900/80 text-white hover:bg-white hover:text-black transition-all border border-white/10"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
    </section>
  );
}
