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
