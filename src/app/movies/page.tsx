"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { getDiscover, getImageUrl, getGenresByType } from "@/lib/tmdb";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { SnakeLoader } from "@/components/ui/snake-loader";
import { GenreCarousel } from "@/components/GenreCarousel";
import Link from "next/link";

interface Media {
  id: number;
  poster_path: string;
  title?: string;
  name?: string;
  vote_average?: number;
  release_date?: string;
}

interface Genre { id: number; name: string; }

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
    observer.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore) setPage((p) => p + 1);
    });
    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

  useEffect(() => { getGenresByType("movie").then(setGenres).catch(() => {}); }, []);

  useEffect(() => {
    async function fetchMovies() {
      setLoading(true);
      try {
        const data = await getDiscover("movie", { page, genreId: selectedGenreId });
        setMovies((prev) => page === 1 ? data.results : [...prev, ...data.results]);
        setHasMore(data.totalPages > page);
      } catch {}
      setLoading(false);
      setInitialLoading(false);
    }
    fetchMovies();
  }, [page, selectedGenreId]);

  const handleGenreSelect = (id?: number) => {
    setSelectedGenreId(id); setPage(1); setMovies([]); setInitialLoading(true);
  };

  if (initialLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><SnakeLoader size="lg" /></div>;
  }

  return (
    <main className="min-h-screen bg-background pt-10 pb-20 px-4 md:px-16 lg:px-24">
      <h1 className="text-2xl font-bold text-white uppercase tracking-[0.2em] mb-8">Movies</h1>
      <GenreCarousel genres={genres} selectedGenreId={selectedGenreId} onGenreSelect={handleGenreSelect} />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
        {movies.map((movie, index) => {
          const title = movie.title || movie.name || "";
          const year = (movie.release_date || "").slice(0, 4);
          const rating = movie.vote_average ? movie.vote_average.toFixed(1) : null;
          return (
            <Link key={`${movie.id}-${index}`} href={`/movie/${movie.id}`} className="group block">
              <motion.div
                ref={index === movies.length - 1 ? lastElementRef : null}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
              >
                <div className="aspect-[2/3] rounded-2xl overflow-hidden bg-zinc-900 shadow-lg">
                  <img src={getImageUrl(movie.poster_path)} alt={title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                </div>
                <div className="mt-2.5 px-0.5">
                  <p className="text-[13px] font-semibold text-white line-clamp-1 leading-tight">{title}</p>
                  <div className="flex items-center gap-1 mt-1 text-[11px] text-white/45">
                    {rating && <><Star className="w-2.5 h-2.5 fill-yellow-600 text-yellow-600 flex-shrink-0" /><span>{rating}</span><span className="text-white/20">·</span></>}
                    {year && <><span>{year}</span><span className="text-white/20">·</span></>}
                    <span>Movie</span>
                  </div>
                </div>
              </motion.div>
            </Link>
          );
        })}
      </div>
      {hasMore && <div ref={lastElementRef} className="w-full flex justify-center py-20"><SnakeLoader size="md" /></div>}
    </main>
  );
}
