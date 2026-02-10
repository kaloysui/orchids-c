"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { getDiscover, getImageUrl, getGenresByType } from "@/lib/tmdb";
import { motion } from "framer-motion";
import { SnakeLoader } from "@/components/ui/snake-loader";
import { GenreCarousel } from "@/components/GenreCarousel";
import Link from "next/link";

interface Media {
  id: number;
  media_type: "movie" | "tv";
  poster_path: string;
  backdrop_path: string;
  title?: string;
  name?: string;
  logoPath?: string | null;
}

interface Genre {
  id: number;
  name: string;
}

export default function MoviesPage() {
  const [movies, setMovies] = useState<Media[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [selectedGenreId, setSelectedGenreId] = useState<number | undefined>();
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  
  const observer = useRef<IntersectionObserver | null>(null);
  const lastElementRef = useCallback((node: HTMLDivElement) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

  useEffect(() => {
    async function fetchGenres() {
      try {
        const movieGenres = await getGenresByType("movie");
        setGenres(movieGenres);
      } catch (error) {
        console.error("Error fetching genres:", error);
      }
    }
    fetchGenres();
  }, []);

  useEffect(() => {
    async function fetchMovies() {
      setLoading(true);
      try {
        const data = await getDiscover("movie", { page, genreId: selectedGenreId });
        
          const movies = data.results.map((item: any) => ({
            ...item,
            logoPath: null
          }));

          setMovies(prev => page === 1 ? movies : [...prev, ...movies]);
        setHasMore(data.totalPages > page);
        setLoading(false);
        setInitialLoading(false);
      } catch (error) {
        console.error("Error fetching movies:", error);
        setLoading(false);
        setInitialLoading(false);
      }
    }
    fetchMovies();
  }, [page, selectedGenreId]);

  const handleGenreSelect = (id?: number) => {
    setSelectedGenreId(id);
    setPage(1);
    setMovies([]);
    setInitialLoading(true);
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <SnakeLoader size="lg" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background pt-32 pb-20 px-4 md:px-16 lg:px-24 scroll-smooth">
      <h1 className="text-2xl font-bold text-white uppercase tracking-[0.2em] mb-8">
        Movies
      </h1>

      <GenreCarousel 
        genres={genres} 
        selectedGenreId={selectedGenreId} 
        onGenreSelect={handleGenreSelect} 
      />
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {movies.map((movie, index) => (
          <Link
            key={`${movie.id}-${index}`}
            href={`/movie/${movie.id}`}
            className="group relative block"
          >
            <motion.div
              ref={index === movies.length - 1 ? lastElementRef : null}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="relative aspect-video w-full overflow-hidden shadow-lg cursor-pointer bg-zinc-900 rounded-sm"
            >
              <img
                src={getImageUrl(movie.backdrop_path)}
                alt={movie.title || movie.name}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 flex flex-col justify-end p-3 md:p-4">
                <div className="w-full">
                  {movie.logoPath ? (
                    <img
                      src={getImageUrl(movie.logoPath)}
                      alt={movie.title || movie.name}
                      className="h-auto max-h-8 md:max-h-10 w-full object-contain object-left drop-shadow-2xl"
                    />
                  ) : (
                    <span className="text-[10px] md:text-xs font-bold text-white uppercase tracking-tight block text-left leading-tight drop-shadow-lg">
                      {movie.title || movie.name}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          </Link>
        ))}
      </div>

      {hasMore && (
        <div ref={lastElementRef} className="w-full flex justify-center py-20">
          <SnakeLoader size="md" />
        </div>
      )}
    </main>
  );
}
