"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

interface Genre {
  id: number;
  name: string;
}

interface GenreCarouselProps {
  genres: Genre[];
  selectedGenreId?: number;
  onGenreSelect: (id?: number) => void;
}

export function GenreCarousel({ genres, selectedGenreId, onGenreSelect }: GenreCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className="relative w-full overflow-hidden mb-8">
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto no-scrollbar scroll-smooth pb-4 px-4"
      >
        <button
          onClick={() => onGenreSelect(undefined)}
          className={`px-6 py-2 rounded-full text-xs md:text-sm font-medium whitespace-nowrap transition-all duration-300 border ${
            !selectedGenreId
              ? "bg-white text-black border-white"
              : "bg-transparent text-white border-zinc-700 hover:border-white"
          }`}
        >
          All
        </button>
        {genres.map((genre) => (
          <button
            key={genre.id}
            onClick={() => onGenreSelect(genre.id)}
            className={`px-6 py-2 rounded-full text-xs md:text-sm font-medium whitespace-nowrap transition-all duration-300 border ${
              selectedGenreId === genre.id
                ? "bg-white text-black border-white"
                : "bg-transparent text-white border-zinc-700 hover:border-white"
            }`}
          >
            {genre.name}
          </button>
        ))}
      </div>
    </div>
  );
}
