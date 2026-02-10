"use client";

import { useEffect, useState, useRef } from "react";
import { getTVSeasonDetails, getImageUrl } from "@/lib/tmdb";
import { motion } from "framer-motion";
import { Download, Play, ChevronLeft, ChevronRight } from "lucide-react";
import { DownloadModal } from "./DownloadModal";

interface TVEpisodesProps {
  tvId: number;
  seasons: any[];
  onPlay?: (season: number, episode: number) => void;
  mediaItem: any;
}

export function TVEpisodes({ tvId, seasons, onPlay, mediaItem }: TVEpisodesProps) {
  const [selectedSeason, setSelectedSeason] = useState(seasons[0]?.season_number || 1);
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadEpisode, setDownloadEpisode] = useState<{ season: number, episode: number } | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const scrollAmount = 400;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    async function fetchEpisodes() {
      setLoading(true);
      try {
        const data = await getTVSeasonDetails(tvId, selectedSeason);
        setEpisodes(data?.episodes || []);
      } catch (error) {
        console.error("Error fetching episodes:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchEpisodes();
  }, [tvId, selectedSeason]);

  return (
    <div className="px-6 py-12 md:px-16 lg:px-24">
      <div className="mb-10 flex flex-col gap-6">
        <h2 className="text-xl font-bold uppercase tracking-[0.2em] text-foreground">
          Episodes
        </h2>

        {/* Season Tabs */}
        <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide -mx-2 px-2">
          {seasons.map((s: any) => (
            <button
              key={s.id}
              onClick={() => setSelectedSeason(s.season_number)}
              className={`flex-none px-6 py-3 rounded-full text-[11px] font-black uppercase tracking-[0.2em] border ${
                selectedSeason === s.season_number
                  ? "bg-white text-black border-white"
                  : "bg-zinc-900/50 text-zinc-500 border-white/5"
              }`}
            >
              Season {s.season_number}
            </button>
          ))}
        </div>
      </div>

      {/* Episodes Carousel */}
      <div
        ref={scrollRef}
        className="flex gap-6 overflow-x-auto pb-10 scrollbar-hide"
      >
        {loading ? (
          [1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="flex-none w-[300px] md:w-[400px] aspect-[16/10] bg-zinc-900 animate-pulse rounded-2xl"
            />
          ))
        ) : (
          episodes.map((ep, index) => (
            <motion.div
              key={ep.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex-none w-[300px] md:w-[400px] cursor-pointer group"
              onClick={() => onPlay?.(selectedSeason, ep.episode_number)}
            >
              <div className="relative aspect-[16/9] overflow-hidden rounded-2xl bg-zinc-900 mb-6 shadow-2xl border border-white/5">
                <img
                  src={getImageUrl(
                    ep.still_path ||
                      seasons.find((s) => s.season_number === selectedSeason)
                        ?.poster_path
                  )}
                  alt={ep.name}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />

                {/* Play Icon */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none">
                  <div className="bg-primary/20 backdrop-blur-md p-5 rounded-full border border-white/20 text-white transform scale-90 group-hover:scale-100 transition-transform shadow-2xl">
                    <Play className="h-8 w-8 fill-current" />
                  </div>
                </div>

                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-transparent p-6 flex flex-col justify-between z-30">
                  <div className="flex justify-between items-start">
                    <span className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-[9px] font-black text-white uppercase tracking-[0.2em]">
                      S{selectedSeason}
                    </span>
                    <span className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-[9px] font-black text-white uppercase tracking-[0.2em]">
                      E{ep.episode_number}
                    </span>
                  </div>

                    <div className="flex justify-between items-end gap-4">
                      <h3 className="text-sm font-black text-white uppercase tracking-wider line-clamp-1">
                        {ep.name}
                      </h3>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDownloadEpisode({ season: selectedSeason, episode: ep.episode_number });
                        }}
                        className="bg-primary/80 hover:bg-primary p-2 rounded-full border border-white/10 text-white transition-all active:scale-95"
                        title="Download Episode"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    </div>

                </div>
              </div>

              <p className="px-2 text-[11px] font-medium text-zinc-500 line-clamp-2 leading-relaxed uppercase tracking-widest">
                {ep.overview || "No overview available for this episode."}
              </p>
            </motion.div>
          ))
        )}
      </div>

      {/* Scroll Buttons */}
      <div className="flex items-center justify-end px-4 gap-1">
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

      <DownloadModal 
        isOpen={!!downloadEpisode}
        onClose={() => setDownloadEpisode(null)}
        mediaItem={mediaItem}
        mediaType="tv"
        season={downloadEpisode?.season}
        episode={downloadEpisode?.episode}
      />
    </div>
  );
}
