"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { getGenresByType } from "@/lib/tmdb";
import { Film, Tv, X } from "lucide-react";

interface Genre {
  id: number;
  name: string;
}

interface GenreModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type MediaTab = "movie" | "tv";

export function GenreModal({ isOpen, onClose }: GenreModalProps) {
  const [movieGenres, setMovieGenres] = useState<Genre[]>([]);
  const [tvGenres, setTvGenres] = useState<Genre[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<MediaTab>("movie");
  const router = useRouter();

  useEffect(() => {
    if (!isOpen) return;
    setIsLoading(true);
    Promise.all([getGenresByType("movie"), getGenresByType("tv")])
      .then(([movie, tv]) => {
        setMovieGenres(movie);
        setTvGenres(tv);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  const handleGenreClick = (type: MediaTab, id: number) => {
    router.push(`/discover?type=${type}&id=${id}`);
    onClose();
  };

  const genres = activeTab === "movie" ? movieGenres : tvGenres;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Bottom Sheet */}
          <motion.div
            initial={{ y: "100%", opacity: 0.5 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 32, stiffness: 320, mass: 0.9 }}
            className="relative w-full max-w-md mx-4 mb-24 bg-neutral-950/95 border border-white/10 backdrop-blur-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            style={{ maxHeight: "75vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-0 flex-shrink-0">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-3 pb-3 flex-shrink-0">
              <h2 className="text-xl font-bold tracking-tight">Genres</h2>
              <button
                onClick={onClose}
                className="flex items-center justify-center w-8 h-8 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tab switcher */}
            <div className="flex items-center gap-2 px-4 pb-3 flex-shrink-0">
              {(["movie", "tv"] as MediaTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                    activeTab === tab
                      ? "bg-white text-black border-white"
                      : "bg-white/6 border-white/10 text-white/50 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {tab === "movie" ? <Film className="w-3.5 h-3.5" /> : <Tv className="w-3.5 h-3.5" />}
                  {tab === "movie" ? "Movies" : "TV Shows"}
                </button>
              ))}
            </div>

            {/* Genre grid — scrollable */}
            <div className="overflow-y-auto flex-1 overscroll-contain px-2 pb-3">
              {isLoading ? (
                <div className="grid grid-cols-2 gap-2 px-2">
                  {[...Array(12)].map((_, i) => (
                    <div key={i} className="h-12 bg-white/6 rounded-2xl animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="divide-y divide-white/5 rounded-2xl overflow-hidden bg-white/4">
                  {genres.map((genre, idx) => (
                    <button
                      key={genre.id}
                      onClick={() => handleGenreClick(activeTab, genre.id)}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/6 active:bg-white/8 transition-colors text-left"
                    >
                      <span className="text-sm font-medium text-white/80 hover:text-white">
                        {genre.name}
                      </span>
                      <span className="text-white/20 text-xs">›</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
