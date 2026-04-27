"use client";

import { DetailsHero } from "@/components/details/DetailsHero";
import { MoreLikeThis } from "@/components/details/MoreLikeThis";
import { Cast } from "@/components/details/Cast";
import { TVEpisodes } from "@/components/details/TVEpisodes";
import { Player } from "@/components/details/Player";
import { useState } from "react";
import { AnimatePresence } from "framer-motion";

interface TVContentProps {
  tv: any;
  cast: any;
  initialSeason?: number;
  initialEpisode?: number;
}

export function TVContent({ tv, cast, initialSeason, initialEpisode }: TVContentProps) {
  const [playerState, setPlayerState] = useState<{
    isPlaying: boolean;
    season: number;
    episode: number;
  }>({
    isPlaying: !!(initialSeason && initialEpisode),
    season: initialSeason || 1,
    episode: initialEpisode || 1,
  });

  const handlePlay = (season: number = 1, episode: number = 1) => {
    setPlayerState({
      isPlaying: true,
      season,
      episode,
    });
  };

  return (
    <>
      <main className="min-h-screen bg-background">
        <DetailsHero
          media={tv}
          type="tv"
          onPlay={() => handlePlay(1, 1)}
        />
        {(tv.overview || tv.tagline) && (
          <div className="px-6 py-8 md:px-16 lg:px-24 flex flex-col gap-6">
            {tv.overview && (
              <div className="flex flex-col gap-3">
                <span className="text-[10px] font-black tracking-[0.25em] text-zinc-500 uppercase">Overview</span>
                <p className="max-w-3xl text-sm leading-relaxed text-zinc-300 md:text-base lg:text-lg">
                  {tv.overview}
                </p>
              </div>
            )}
            {tv.tagline && (
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-black tracking-[0.25em] text-zinc-500 uppercase">Tagline</span>
                <p className="max-w-2xl text-base leading-snug text-zinc-300 md:text-lg lg:text-xl font-medium italic tracking-wide">
                  &ldquo;{tv.tagline}&rdquo;
                </p>
              </div>
            )}
          </div>
        )}
          <TVEpisodes
            tvId={tv.id} 
            seasons={tv.seasons} 
            onPlay={handlePlay}
            mediaItem={tv}
          />

        <Cast cast={cast} />
        <MoreLikeThis id={tv.id} type="tv" />
      </main>

      <AnimatePresence>
        {playerState.isPlaying && (
          <Player 
            type="tv" 
            tmdbId={tv.id} 
            season={playerState.season}
            episode={playerState.episode}
            onBack={() => setPlayerState(prev => ({ ...prev, isPlaying: false }))} 
          />
        )}
      </AnimatePresence>
    </>
  );
}
