"use client";

import { useEffect, useState, useRef } from "react";
import { getTVSeasonDetails, getImageUrl } from "@/lib/tmdb";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Play, ChevronDown, Check } from "lucide-react";
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
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [downloadEpisode, setDownloadEpisode] = useState<{ season: number; episode: number } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedSeasonLabel = `Season ${selectedSeason}`;

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
    <div className="mx-6 my-4 md:mx-16 lg:mx-24 rounded-2xl bg-zinc-900/60 border border-white/5 backdrop-blur-sm px-6 py-8">
      {/* Header + Season Dropdown */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xs font-black uppercase tracking-[0.25em] text-zinc-400">
          Episodes
        </h2>

        {/* Custom Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((v) => !v)}
            className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-semibold pl-4 pr-3 py-2 rounded-xl border border-white/10 transition-colors"
          >
            {selectedSeasonLabel}
            <ChevronDown
              className={`h-4 w-4 text-zinc-400 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`}
            />
          </button>

          <AnimatePresence>
            {dropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.97 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="absolute right-0 top-full mt-2 z-50 min-w-[160px] rounded-xl bg-zinc-800 border border-white/10 shadow-2xl overflow-hidden"
              >
                <div className="max-h-64 overflow-y-auto py-1">
                  {seasons.map((s: any) => (
                    <button
                      key={s.id}
                      onClick={() => {
                        setSelectedSeason(s.season_number);
                        setDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 text-sm font-medium text-left transition-colors ${
                        selectedSeason === s.season_number
                          ? "bg-white/10 text-white"
                          : "text-zinc-300 hover:bg-white/5"
                      }`}
                    >
                      Season {s.season_number}
                      {selectedSeason === s.season_number && (
                        <Check className="h-4 w-4 text-primary shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Episode List — scrollable */}
      <div className="flex flex-col gap-2 max-h-[560px] overflow-y-auto pr-1 scrollbar-hide">
        {loading
          ? [1, 2, 3, 4].map((i) => (
              <div key={i} className="flex gap-4 p-2 animate-pulse">
                <div className="flex-none w-[140px] md:w-[180px] aspect-[16/9] rounded-xl bg-zinc-800" />
                <div className="flex flex-col gap-2 flex-1 py-1">
                  <div className="h-3 w-16 rounded bg-zinc-800" />
                  <div className="h-5 w-40 rounded bg-zinc-800" />
                  <div className="h-3 w-24 rounded bg-zinc-800" />
                  <div className="h-3 w-full rounded bg-zinc-800" />
                </div>
              </div>
            ))
          : episodes.map((ep, index) => (
              <motion.div
                key={ep.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                onClick={() => onPlay?.(selectedSeason, ep.episode_number)}
                className="flex gap-4 cursor-pointer group rounded-xl p-2 hover:bg-white/5 transition-colors"
              >
                {/* Thumbnail */}
                <div className="relative flex-none w-[140px] md:w-[180px] aspect-[16/9] rounded-xl overflow-hidden bg-zinc-800">
                  <img
                    src={getImageUrl(
                      ep.still_path ||
                        seasons.find((s) => s.season_number === selectedSeason)?.poster_path
                    )}
                    alt={ep.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/50">
                    <Play className="h-7 w-7 fill-white text-white drop-shadow-lg" />
                  </div>
                </div>

                {/* Info */}
                <div className="flex flex-col gap-1 flex-1 min-w-0 py-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] font-black text-yellow-400 uppercase tracking-wider shrink-0">
                      E{ep.episode_number}
                    </span>
                    <h3 className="text-sm font-bold text-white truncate md:text-base">
                      {ep.name}
                    </h3>
                  </div>

                  {ep.vote_average > 0 && (
                    <div className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                      <span className="text-xs font-semibold text-zinc-400">
                        {ep.vote_average.toFixed(1)}
                      </span>
                    </div>
                  )}

                  <p className="text-xs leading-relaxed text-zinc-500 line-clamp-2 mt-0.5">
                    {ep.overview || "No overview available."}
                  </p>
                </div>
              </motion.div>
            ))}
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
