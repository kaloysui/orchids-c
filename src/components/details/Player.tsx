"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import { ChevronLeft, Layers, ChevronDown, Check } from "lucide-react";
import React from "react";
import { useContinueWatching } from "@/hooks/useContinueWatching";
import { getMediaDetails, getMediaImages } from "@/lib/tmdb";
import dynamic from "next/dynamic";

const NetPlayer = dynamic(() => import("@/components/netplayer"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-black">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-white" />
        <p className="text-white/50 text-sm font-medium animate-pulse">Initializing Player...</p>
      </div>
    </div>
  ),
});

interface PlayerProps {
  type: "movie" | "tv";
  tmdbId: number;
  season?: number;
  episode?: number;
  onBack: () => void;
}

const themeColors: Record<string, string> = {
  light: "3b82f6", // Deep Blue
  dark: "ffffff",
  "theme-amoled": "ffffff",
  "theme-red": "ef4444",
  "theme-teal": "14b8a6",
  "theme-orange": "f97316",
  "theme-violet": "8b5cf6",
  "theme-brown": "92400e",
};

export function Player({ type, tmdbId, season, episode, onBack }: PlayerProps) {
  const { theme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [playerMode, setPlayerMode] = React.useState<"native" | "legacy">("legacy");
    const [provider, setProvider] = React.useState("beech");
    const [autoPlay, setAutoPlay] = React.useState(true);
    const { saveItem } = useContinueWatching();
    const [mediaDetails, setMediaDetails] = React.useState<any>(null);
    const [logoPath, setLogoPath] = React.useState<string | null>(null);
    
    const [currentSeason, setCurrentSeason] = React.useState(season || 1);
    const [currentEpisode, setCurrentEpisode] = React.useState(episode || 1);

    const providerUrls: Record<string, string> = {
      beech: "native",
      cedar: "https://player.videasy.net",
      buke: "https://vidsrc.cc",
    };

    React.useEffect(() => {
      setMounted(true);
      const savedAutoPlay = localStorage.getItem("player_autoplay") !== "false";
    const savedProvider = localStorage.getItem("player_provider") || "beech";
        
        setAutoPlay(savedAutoPlay);
        setProvider(savedProvider);
        setPlayerMode(savedProvider === "beech" ? "native" : "legacy");

      async function fetchData() {
        try {
          const [details, images] = await Promise.all([
            getMediaDetails(type, tmdbId),
            getMediaImages(type, tmdbId)
          ]);
          setMediaDetails(details);
          const enLogo = images.logos?.find((l: any) => l.iso_639_1 === "en") || images.logos?.[0];
          const logo = enLogo ? enLogo.file_path : null;
          setLogoPath(logo);

          // Preserve existing progress if resuming, otherwise start at 0
          const stored = localStorage.getItem("bcine-continue-watching");
          let existingProgress = 0;
          let existingCurrentTime: number | undefined;
          let existingDuration: number | undefined;
          if (stored) {
            try {
              const items = JSON.parse(stored);
              const existing = items.find((i: any) => i.id === tmdbId && i.media_type === type);
              if (existing) {
                existingProgress = existing.progress || 0;
                existingCurrentTime = existing.currentTime;
                existingDuration = existing.duration;
              }
            } catch {}
          }

          saveItem({
            id: tmdbId,
            media_type: type,
            title: details.title || details.name,
            name: details.name || details.title,
            backdrop_path: details.backdrop_path,
            poster_path: details.poster_path,
            logoPath: logo,
            season: currentSeason,
            episode: currentEpisode,
            progress: existingProgress,
            currentTime: existingCurrentTime,
            duration: existingDuration,
          });
        } catch (error) {
          console.error("Failed to fetch media details:", error);
        }
      }
      fetchData();
    }, [type, tmdbId, currentSeason, currentEpisode]);
  
    const color = mounted ? (themeColors[theme as string] || "3b82f6") : "3b82f6";

    const getEmbedUrl = () => {
      if (provider === "cedar") {
        const baseUrl = type === "movie"
          ? `https://player.videasy.net/movie/${tmdbId}`
          : `https://player.videasy.net/tv/${tmdbId}/${currentSeason}/${currentEpisode}`;
        return `${baseUrl}?overlay=true&color=${color}&episodeSelector=true&autoplay=${autoPlay ? "1" : "0"}`;
      } else {
        // Default to BUKE (VIDSRC)
        const baseUrl = type === "movie"
          ? `https://embedmaster.link/71q0q5j5pc4fhtyk/movie/${tmdbId}`
          : `https://embedmaster.link/71q0q5j5pc4fhtyk/tv/${tmdbId}/${currentSeason}/${currentEpisode}`;
        return `${baseUrl}?color=${color}&auto_play=${autoPlay ? "1" : "0"}`;
      }
    };

    const handleProgress = React.useCallback((currentTime: number, duration: number) => {
      if (!mediaDetails) return;
      const progress = Math.min(Math.round((currentTime / duration) * 100), 100);
      
      saveItem({
        id: tmdbId,
        media_type: type,
        title: mediaDetails.title || mediaDetails.name,
        name: mediaDetails.name || mediaDetails.title,
        backdrop_path: mediaDetails.backdrop_path,
        poster_path: mediaDetails.poster_path,
        logoPath: logoPath,
        season: currentSeason,
        episode: currentEpisode,
        progress,
        currentTime,
        duration,
      });
    }, [mediaDetails, logoPath, tmdbId, type, currentSeason, currentEpisode, saveItem]);

    // Track progress for embed (iframe) player using elapsed time
    const embedStartTimeRef = React.useRef<number | null>(null);

    React.useEffect(() => {
      if (playerMode !== "legacy" || !mediaDetails) return;

      // Start tracking when embed loads
      embedStartTimeRef.current = Date.now();

      // Estimate total duration in seconds
      // Movies: use runtime from TMDB (in minutes). TV: episode_run_time or default 45min
      const runtimeMinutes =
        mediaDetails.runtime ||
        (mediaDetails.episode_run_time?.[0]) ||
        45;
      const totalDurationSec = runtimeMinutes * 60;

      const interval = setInterval(() => {
        if (!embedStartTimeRef.current) return;
        const elapsedSec = (Date.now() - embedStartTimeRef.current) / 1000;
        const progress = Math.min(Math.round((elapsedSec / totalDurationSec) * 100), 95);

        saveItem({
          id: tmdbId,
          media_type: type,
          title: mediaDetails.title || mediaDetails.name,
          name: mediaDetails.name || mediaDetails.title,
          backdrop_path: mediaDetails.backdrop_path,
          poster_path: mediaDetails.poster_path,
          logoPath: logoPath,
          season: currentSeason,
          episode: currentEpisode,
          progress,
          currentTime: elapsedSec,
          duration: totalDurationSec,
        });
      }, 30000); // Update every 30 seconds

      return () => {
        // Save final progress on unmount
        if (embedStartTimeRef.current) {
          const elapsedSec = (Date.now() - embedStartTimeRef.current) / 1000;
          const progress = Math.min(Math.round((elapsedSec / totalDurationSec) * 100), 95);
          saveItem({
            id: tmdbId,
            media_type: type,
            title: mediaDetails.title || mediaDetails.name,
            name: mediaDetails.name || mediaDetails.title,
            backdrop_path: mediaDetails.backdrop_path,
            poster_path: mediaDetails.poster_path,
            logoPath: logoPath,
            season: currentSeason,
            episode: currentEpisode,
            progress,
            currentTime: elapsedSec,
            duration: totalDurationSec,
          });
        }
        clearInterval(interval);
      };
    }, [playerMode, mediaDetails, logoPath, tmdbId, type, currentSeason, currentEpisode, saveItem]);

    const handlePlayerError = () => {
      console.log("Player failed, trying fallback...");
      if (playerMode === "native") {
        setPlayerMode("legacy");
        setProvider("cedar");
      } else if (provider === "cedar") {
        setProvider("buke");
      } else {
        // All options exhausted
        console.error("All player sources failed");
      }
    };

    const handleAutoNext = (next?: { season?: number; episode?: number }) => {
      if (next?.season !== undefined && next?.episode !== undefined) {
        setCurrentSeason(next.season);
        setCurrentEpisode(next.episode);
      }
    };

    // Sources dropdown
    const [sourcesOpen, setSourcesOpen] = React.useState(false);
    const sourcesRef = React.useRef<HTMLDivElement>(null);

    const sources = [
      { id: "beech", name: "BCINE", description: "Auto play · Auto next", mode: "native" as const },
      { id: "cedar", name: "CEDAR", description: "Recommended", mode: "legacy" as const },
      { id: "buke",  name: "BUKE",  description: "Auto play", mode: "legacy" as const },
    ];

    const handleSourceSwitch = (id: string, mode: "native" | "legacy") => {
      setProvider(id);
      setPlayerMode(mode);
      localStorage.setItem("player_provider", id);
      setSourcesOpen(false);
    };

    // Close on outside click
    React.useEffect(() => {
      if (!sourcesOpen) return;
      const handler = (e: MouseEvent) => {
        if (sourcesRef.current && !sourcesRef.current.contains(e.target as Node)) {
          setSourcesOpen(false);
        }
      };
      document.addEventListener("mousedown", handler);
      return () => document.removeEventListener("mousedown", handler);
    }, [sourcesOpen]);

    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black overflow-hidden"
      >
        <div className="relative h-full w-full">
          {/* Top-left controls: Back + Sources */}
          <div className="absolute top-6 left-6 z-[120] flex items-center gap-2 md:top-8 md:left-8">
            {/* Back Button */}
            <button
              onClick={onBack}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white/70 backdrop-blur-md transition-all hover:bg-black/60 hover:text-white hover:scale-110 active:scale-95"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>

            {/* Sources Dropdown */}
            <div ref={sourcesRef} className="relative">
              <button
                onClick={() => setSourcesOpen((v) => !v)}
                className="flex h-10 items-center gap-1.5 rounded-full bg-black/40 px-3.5 text-white/70 backdrop-blur-md transition-all hover:bg-black/60 hover:text-white active:scale-95 text-xs font-semibold tracking-wide"
              >
                <Layers className="h-4 w-4" />
                <span>{sources.find((s) => s.id === provider)?.name ?? "Source"}</span>
                <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${sourcesOpen ? "rotate-180" : ""}`} />
              </button>

              <AnimatePresence>
                {sourcesOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.96 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    style={{ transformOrigin: "top left" }}
                    className="absolute left-0 top-12 w-56 rounded-2xl bg-black/85 backdrop-blur-2xl border border-white/10 shadow-2xl overflow-hidden"
                  >
                    <div className="px-4 py-2.5 border-b border-white/10">
                      <p className="text-[10px] text-white/35 uppercase tracking-widest font-bold">Sources</p>
                    </div>
                    <div className="p-1.5 space-y-0.5">
                      {sources.map((s) => {
                        const active = provider === s.id;
                        return (
                          <button
                            key={s.id}
                            onClick={() => handleSourceSwitch(s.id, s.mode)}
                            className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all text-left ${
                              active
                                ? "bg-white/10 text-white"
                                : "text-white/55 hover:bg-white/5 hover:text-white/90"
                            }`}
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold tracking-wide">{s.name}</p>
                              <p className="text-[10px] text-white/35 mt-0.5">{s.description}</p>
                            </div>
                            {active && <Check className="h-3.5 w-3.5 text-white/70 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
  
          <AnimatePresence mode="wait">
            {playerMode === "native" ? (
              <motion.div
                key="native"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full w-full"
              >
                  <NetPlayer 
                    movieId={type === "movie" ? tmdbId.toString() : undefined}
                    tvId={type === "tv" ? tmdbId.toString() : undefined}
                    season={currentSeason}
                    episode={currentEpisode}
                    autoPlay={autoPlay}
                    themeColor={`#${color}`}
                    onError={handlePlayerError}
                    onEnded={() => {}} 
                    onProgress={handleProgress}
                    onAutoNext={(next) => handleAutoNext(next)}
                  />
              </motion.div>
            ) : (
            <motion.div
              key="legacy"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full w-full"
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex gap-4 opacity-0 hover:opacity-100 transition-opacity">
                 {/* Provider selectors could go here if legacy player is active */}
              </div>
              <iframe
                src={getEmbedUrl()}
                className="h-full w-full border-none"
                allowFullScreen
                allow="autoplay; encrypted-media"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
