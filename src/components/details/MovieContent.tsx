"use client";

import { DetailsHero } from "@/components/details/DetailsHero";
import { MoreLikeThis } from "@/components/details/MoreLikeThis";
import { Cast } from "@/components/details/Cast";
import { Player } from "@/components/details/Player";
import { useState } from "react";
import { AnimatePresence } from "framer-motion";

interface MovieContentProps {
  movie: any;
  cast: any;
}

export function MovieContent({ movie, cast }: MovieContentProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <>
      <main className="min-h-screen bg-background">
        <DetailsHero
          media={movie}
          type="movie"
          onPlay={() => setIsPlaying(true)}
        />
        {(movie.overview || movie.tagline) && (
          <div className="px-6 py-8 md:px-16 lg:px-24 flex flex-col gap-6">
            {movie.overview && (
              <div className="flex flex-col gap-3">
                <span className="text-[10px] font-black tracking-[0.25em] text-zinc-500 uppercase">Overview</span>
                <p className="max-w-3xl text-sm leading-relaxed text-zinc-300 md:text-base lg:text-lg">
                  {movie.overview}
                </p>
              </div>
            )}
            {movie.tagline && (
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-black tracking-[0.25em] text-zinc-500 uppercase">Tagline</span>
                <p className="max-w-2xl text-base leading-snug text-zinc-300 md:text-lg lg:text-xl font-medium italic tracking-wide">
                  &ldquo;{movie.tagline}&rdquo;
                </p>
              </div>
            )}
          </div>
        )}
        <Cast cast={cast} />
        <MoreLikeThis id={movie.id} type="movie" />
      </main>

      <AnimatePresence>
        {isPlaying && (
          <Player 
            type="movie" 
            tmdbId={movie.id} 
            onBack={() => setIsPlaying(false)} 
          />
        )}
      </AnimatePresence>
    </>
  );
}
