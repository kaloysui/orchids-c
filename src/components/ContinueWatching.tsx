"use client";

import { useContinueWatching } from "@/hooks/useContinueWatching";
import { getImageUrl } from "@/lib/tmdb";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { useGlobalLoading } from "@/hooks/useGlobalLoading";
import Link from "next/link";
import { useRef } from "react";

export function ContinueWatching() {
  const { items, removeItem } = useContinueWatching();
  const scrollRef = useRef<HTMLDivElement>(null);
  const { setIsLoading } = useGlobalLoading();

  if (items.length === 0) return null;

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo =
        direction === "left"
          ? scrollLeft - clientWidth * 0.7
          : scrollLeft + clientWidth * 0.7;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: "smooth" });
    }
  };

  return (
    <section className="w-full py-10 px-0 overflow-visible relative group/section">
      <div className="flex items-center justify-between mb-4 px-4 md:px-8">
          <h2 className="text-base font-bold text-white uppercase tracking-[0.15em]">
            Continue <span className="text-zinc-500">Watching</span>
          </h2>
        </div>

        <div
          ref={scrollRef}
          className="flex overflow-x-auto gap-3 scrollbar-hide px-4 md:px-8 scroll-smooth overscroll-x-contain"
        >
        {items.map((item, index) => (
          <motion.div
            key={`${item.id}-${item.media_type}-${item.season || ""}-${item.episode || ""}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.04, duration: 0.3, ease: "easeOut" }}
            className="flex-none w-[220px] sm:w-[260px] md:w-[300px] group/card"
          >
            <Link
              href={`/${item.media_type}/${item.id}${item.media_type === "tv" ? `?s=${item.season}&e=${item.episode}` : ""}`}
              onClick={() => setIsLoading(true)}
              className="relative block aspect-video w-full overflow-hidden rounded-2xl bg-zinc-900 shadow-lg"
            >
              {/* Backdrop Image */}
              <img
                src={getImageUrl(item.backdrop_path || item.poster_path)}
                alt={item.title || item.name}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-105"
              />

              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

              {/* Delete Button */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  removeItem(item.id, item.media_type);
                }}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 backdrop-blur-sm text-white/70 hover:text-white hover:bg-black/80 transition-all opacity-0 group-hover/card:opacity-100 z-10"
              >
                <Trash2 className="w-3 h-3" />
              </button>

              {/* Logo / Title at center bottom */}
              <div className="absolute bottom-4 left-0 right-0 px-3 flex flex-col items-center">
                {item.logoPath ? (
                  <img
                    src={getImageUrl(item.logoPath)}
                    alt={item.title || item.name}
                    className="h-6 sm:h-7 w-auto max-w-[70%] object-contain drop-shadow-lg"
                    loading="lazy"
                  />
                ) : (
                  <p className="text-xs sm:text-sm font-semibold text-white line-clamp-1 drop-shadow-lg text-center">
                    {item.title || item.name}
                  </p>
                )}
              </div>

              {/* Progress Bar */}
              <div className="absolute bottom-0 left-0 w-full h-1 bg-white/10 z-20 rounded-b-2xl overflow-hidden">
                <div
                  className="h-full bg-primary shadow-[0_0_8px_var(--primary)] transition-all duration-300"
                  style={{ width: `${item.progress}%` }}
                />
              </div>
            </Link>
          </motion.div>
        ))}
        </div>

        {/* Arrows at bottom */}
        <div className="flex items-center justify-end px-4 md:px-8 mt-3">
          <div className="flex items-center gap-1">
            <button
              onClick={() => scroll("left")}
              className="p-1.5 rounded-full bg-zinc-900/80 text-white hover:bg-white hover:text-black transition-all border border-white/10"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => scroll("right")}
              className="p-1.5 rounded-full bg-zinc-900/80 text-white hover:bg-white hover:text-black transition-all border border-white/10"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>
    );
  }
