"use client";

import { useEffect, useState, useRef } from "react";
import { getTrendingByType, getImageUrl } from "@/lib/tmdb";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Plus, ChevronLeft, ChevronRight, Star } from "lucide-react";
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

export function TopTrendingToday() {
  const [data, setData] = useState<{ movie: Media[], tv: Media[] }>({ movie: [], tv: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"movie" | "tv">("movie");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchAllTrending() {
      setLoading(true);
      try {
        const [movieResults, tvResults] = await Promise.all([
          getTrendingByType("movie"),
          getTrendingByType("tv")
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
        console.error("Error fetching trending data:", error);
        setLoading(false);
      }
    }
    fetchAllTrending();
  }, []);

  const { setIsLoading } = useGlobalLoading();
  const trending = data[activeTab];

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
            layoutId="activeTab"
            className="absolute -bottom-1 left-0 w-full h-[2px] bg-white shadow-[0_0_8px_rgba(255,255,255,0.5)]"
          />
        )}
      </button>
    );

    if (loading && trending.length === 0) {
      return (
        <div className="w-full py-10 px-0">
          <div className="flex items-center justify-between mb-8 px-4">
            <h2 className="text-lg font-bold text-foreground uppercase tracking-[0.2em]">
              Top <span className="text-zinc-500">Trending</span>
            </h2>
          </div>
              <div className="flex overflow-x-auto gap-2 px-4 scrollbar-hide">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="flex-none w-[150px] sm:w-[170px] md:w-[200px] aspect-[2/3] animate-pulse bg-zinc-800" />
              ))}
            </div>

        </div>
      );
    }

    return (
      <section className="w-full py-10 px-0 overflow-visible relative group/section">
        <div className="flex items-center justify-between mb-8 px-4">
          <h2 className="text-lg font-bold text-white uppercase tracking-[0.2em]">
            Top <span className="text-zinc-500">Trending</span>
          </h2>
        </div>
        
        <div 
          ref={scrollRef}
          className="flex overflow-x-auto gap-2 scrollbar-hide px-4 scroll-smooth mb-6 overscroll-x-contain"
        >
            {trending.map((item, index) => (
                  <motion.div
                    key={`${item.id}-${activeTab}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="relative flex-none w-[150px] sm:w-[170px] md:w-[200px] group will-change-transform"
                  >

                        <Link 
                          href={`/${activeTab}/${item.id}`}
                          onClick={() => setIsLoading(true)}
                          className="relative block aspect-[2/3] w-full overflow-hidden shadow-lg cursor-pointer bg-zinc-900"
                        >
                          <img
                            src={getImageUrl(item.poster_path)}
                            alt={item.title || item.name}
                            loading="lazy"
                            decoding="async"
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 will-change-transform"
                          />
                          
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

                        </Link>

              </motion.div>
          ))}
      </div>

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
