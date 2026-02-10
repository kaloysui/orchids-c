"use client";

import dynamic from "next/dynamic";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import ArrowLeftIcon from "@/components/netplayer/ArrowLeftIcon";
import ArrowRightIcon from "@/components/netplayer/ArrowRightIcon";
import { useTMDBShow, useTMDBSeason } from "@/components/netplayer/hooks/useTMDBShow";

const NetPlayer = dynamic(() => import("@/components/netplayer"), {
  ssr: false,
  loading: () => (
    <div className="h-screen w-screen flex items-center justify-center bg-black text-white">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-white" />
    </div>
  ),
});

interface PlayerClientProps {
  movieId?: string;
  tvId?: string;
  season?: number;
  episode?: number;
  title?: string;
  autoPlay?: boolean;
  onEnded?: () => void;
}

export default function PlayerClient(props: PlayerClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sidebarParam = searchParams.get("sidebar");
  const colorParam = searchParams.get("color");
  const [showSidebar, setShowSidebar] = useState(false);
  const [isSidebarDisabled, setIsSidebarDisabled] = useState(sidebarParam !== "on");
  const [selectedSeason, setSelectedSeason] = useState<number>(props.season || 1);
  const isTv = !!props.tvId;

  const themeColor = colorParam ? (colorParam.startsWith("#") ? colorParam : `#${colorParam}`) : "var(--primary)";

  const { showDetails } = useTMDBShow(props.tvId);
  const { episodes, loading: episodesLoading } = useTMDBSeason(props.tvId, selectedSeason);

  useEffect(() => {
    const sidebar = searchParams.get("sidebar");
    if (sidebar === "on") {
      setShowSidebar(false);
      setIsSidebarDisabled(false);
    } else if (sidebar === "off") {
      setShowSidebar(false);
      setIsSidebarDisabled(true);
    } else {
      setShowSidebar(false);
      setIsSidebarDisabled(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (props.season) {
      setSelectedSeason(props.season);
    }
  }, [props.season]);

  const handleEnded = () => {
    if (props.onEnded) {
      props.onEnded();
      return;
    }

    if (isTv && props.tvId && props.season && props.episode && episodes.length > 0) {
      const currentEpisodeIndex = episodes.findIndex(e => e.episode_number === props.episode);
      if (currentEpisodeIndex !== -1 && currentEpisodeIndex < episodes.length - 1) {
        const nextEpisode = episodes[currentEpisodeIndex + 1];
        const url = `/tv/${props.tvId}/${props.season}/${nextEpisode.episode_number}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
        router.push(url);
      } else if (currentEpisodeIndex !== -1 && currentEpisodeIndex === episodes.length - 1) {
        const nextSeasonNumber = props.season + 1;
        const nextSeason = showDetails?.seasons.find(s => s.season_number === nextSeasonNumber);
        if (nextSeason) {
          const url = `/tv/${props.tvId}/${nextSeasonNumber}/1${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
          router.push(url);
        }
      }
    }
  };

  return (
    <div 
      className="h-screen w-screen bg-black text-white overflow-hidden flex relative"
      style={{ "--theme-color": themeColor } as React.CSSProperties}
    >
      <div className="flex-1 h-full relative group">
        <NetPlayer 
          key={`${props.movieId}-${props.tvId}-${props.season}-${props.episode}`}
          {...props} 
          onEnded={handleEnded}
        />
      </div>

      {isTv && !isSidebarDisabled && (
        <button
          onClick={() => setShowSidebar(!showSidebar)}
          className={`absolute top-1/2 -translate-y-1/2 z-[60] bg-zinc-900/80 hover:bg-zinc-800 border border-white/10 p-2 rounded-full transition-all duration-500 shadow-2xl backdrop-blur-md group ${
            showSidebar ? "right-[21rem]" : "right-4"
          }`}
          title={showSidebar ? "Hide Sidebar" : "Show Sidebar"}
        >
          {showSidebar ? (
            <ArrowRightIcon className="w-5 h-5 text-zinc-400 group-hover:text-white transition-all duration-300 group-hover:translate-x-0.5" />
          ) : (
            <ArrowLeftIcon className="w-5 h-5 text-zinc-400 group-hover:text-white transition-all duration-300 group-hover:-translate-x-0.5" />
          )}
        </button>
      )}

      {isTv && (
        <div
          className={`absolute right-4 top-4 bottom-4 bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl transition-all duration-500 ease-in-out z-50 flex flex-col shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] ${
            showSidebar ? "w-80 translate-x-0 opacity-100" : "w-0 translate-x-full opacity-0 overflow-hidden border-none"
          }`}
        >
          <div className="p-6 space-y-6 flex-1 overflow-y-auto scrollbar-hide">
            <div className="space-y-4">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Series</label>
              {showDetails?.images?.logos && showDetails.images.logos.length > 0 ? (
                <div className="h-14 w-full relative group/logo flex items-center">
                  <img
                    src={`https://image.tmdb.org/t/p/w500${showDetails.images.logos[0].file_path}`}
                    alt={showDetails.name}
                    className="max-h-full max-w-full object-contain filter drop-shadow-2xl transition-transform duration-300 group-hover/logo:scale-105"
                  />
                </div>
              ) : (
                <p className="text-xl font-black text-white tracking-tight">{showDetails?.name || props.title || "TV Show"}</p>
              )}
            </div>
            
            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Select Season</label>
              <div className="relative group/season">
                  <select
                    value={selectedSeason}
                    onChange={(e) => setSelectedSeason(parseInt(e.target.value))}
                    className="w-full appearance-none bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm font-bold text-white hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer focus:outline-none focus:ring-2"
                    style={{ "--tw-ring-color": `color-mix(in srgb, ${themeColor}, transparent 50%)` } as React.CSSProperties}
                  >
                  {showDetails?.seasons
                    .filter(s => s.season_number > 0)
                    .map((s) => (
                      <option key={s.id} value={s.season_number} className="bg-zinc-900 text-white">
                        Season {s.season_number}
                      </option>
                    ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500 group-hover/season:text-white transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
                  Episodes <span className="text-zinc-600 ml-1">S{selectedSeason}</span>
                </label>
              </div>
              <div className="space-y-3">
                {episodesLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 space-y-4">
                      <div 
                        className="h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" 
                        style={{ borderColor: `color-mix(in srgb, ${themeColor}, transparent 80%)`, borderTopColor: themeColor } as React.CSSProperties}
                      />
                      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">Loading Episodes</p>
                    </div>
                ) : (
                  episodes.map((ep) => {
                    const isActive = props.season === selectedSeason && props.episode === ep.episode_number;
                    return (
                      <Link
                        key={ep.id}
                        href={`/tv/${props.tvId}/${selectedSeason}/${ep.episode_number}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`}
                        className={`flex flex-col gap-3 p-3 rounded-2xl transition-all duration-300 group ${
                          isActive
                            ? "border shadow-lg"
                            : "bg-zinc-900/30 border border-white/5 hover:bg-zinc-800/50 hover:border-white/10"
                        }`}
                          style={isActive ? { 
                            backgroundColor: `color-mix(in srgb, ${themeColor}, transparent 90%)`, 
                            borderColor: `color-mix(in srgb, ${themeColor}, transparent 70%)`,
                            boxShadow: `0 10px 15px -3px color-mix(in srgb, ${themeColor}, transparent 95%)`
                          } : {}}
                      >
                        <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-zinc-800 shadow-inner">
                          {ep.still_path ? (
                            <img
                              src={`https://image.tmdb.org/t/p/w400${ep.still_path}`}
                              alt={ep.name}
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-[10px] font-bold uppercase tracking-widest text-zinc-600">
                              No Preview
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
                          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                            <span className="text-[10px] font-black text-white/90 bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/10">
                              EP {ep.episode_number}
                            </span>
                          </div>
                            <div 
                              className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              style={{ backgroundColor: `color-mix(in srgb, ${themeColor}, transparent 80%)` }}
                            >
                            <div className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center shadow-2xl scale-75 group-hover:scale-100 transition-transform duration-300">
                              <div className="w-0 h-0 border-y-[6px] border-y-transparent border-l-[10px] border-l-white ml-1" />
                            </div>
                          </div>
                        </div>
                        <div className="space-y-1 px-1">
                          <p 
                            className="text-sm font-bold truncate transition-colors"
                            style={{ color: isActive ? themeColor : undefined }}
                          >
                            {ep.name}
                          </p>
                          <p className="text-[11px] text-zinc-500 line-clamp-2 leading-relaxed font-medium">
                            {ep.overview || "No description available."}
                          </p>
                        </div>
                      </Link>
                    );
                  })
                )}
              </div>
            </div>
          </div>
          
          <div className="p-5 border-t border-white/5 bg-black/20 rounded-b-2xl">
            <div className="flex items-center justify-center gap-2 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-500">
              <span className="h-px w-8 bg-zinc-800" />
                <p className="text-[10px] text-zinc-400 uppercase tracking-[0.4em] font-black">
                  NetPlayer
                </p>
              <span className="h-px w-8 bg-zinc-800" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
