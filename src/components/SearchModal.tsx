"use client";

import { useState, useEffect, useCallback, memo, useMemo, useRef } from "react";
import { searchMulti, getImageUrl } from "@/lib/tmdb";
import { AnimatePresence, motion } from "framer-motion";
import { Search, ChevronDown, X, Clock, Star, ChevronRight } from "lucide-react";
import Link from "next/link";
import { debounce } from "@/lib/utils";
import { useGlobalLoading } from "@/hooks/useGlobalLoading";

type MediaFilter = "all" | "movie" | "tv";

interface RecentSearchItem {
  query: string;
  timestamp: number;
}

const RECENT_KEY = "bcine_recent_queries";
const MAX_RECENT = 15;

function getRecentSearches(): RecentSearchItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
function saveRecentQuery(query: string) {
  if (!query.trim()) return;
  const existing = getRecentSearches().filter(
    (r) => r.query.toLowerCase() !== query.toLowerCase()
  );
  const updated = [{ query, timestamp: Date.now() }, ...existing].slice(0, MAX_RECENT);
  localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
}
function clearAllRecent() {
  localStorage.removeItem(RECENT_KEY);
}

const GENRE_MAP: Record<number, string> = {
  28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy", 80: "Crime",
  99: "Documentary", 18: "Drama", 10751: "Family", 14: "Fantasy", 36: "History",
  27: "Horror", 10402: "Music", 9648: "Mystery", 10749: "Romance",
  878: "Science Fiction", 10770: "TV Movie", 53: "Thriller", 10752: "War",
  37: "Western", 10759: "Action & Adventure", 10762: "Kids", 10763: "News",
  10764: "Reality", 10765: "Sci-Fi & Fantasy", 10766: "Soap", 10767: "Talk",
  10768: "War & Politics",
};
function genreNames(ids: number[]) {
  return (ids || []).slice(0, 2).map((id) => GENRE_MAP[id]).filter(Boolean).join(", ");
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [mediaFilter, setMediaFilter] = useState<MediaFilter>("all");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [recentSearches, setRecentSearches] = useState<RecentSearchItem[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const filterLabels: Record<MediaFilter, string> = {
    all: "Movies & TV Shows",
    movie: "Movies",
    tv: "TV Shows",
  };

  // Reset & focus on open
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setResults([]);
      setRecentSearches(getRecentSearches());
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  // Close on escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  const handleSearch = useCallback(
    debounce(async (q: string) => {
      if (!q.trim()) { setResults([]); setLoading(false); return; }
      setLoading(true);
      try {
        const data = await searchMulti(q);
        setResults((data.results || []).filter((i: any) => i.media_type !== "person"));
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 380),
    []
  );

  useEffect(() => {
    if (query) setLoading(true);
    handleSearch(query);
  }, [query, handleSearch]);

  const displayItems = useMemo(() => {
    if (mediaFilter === "all") return results;
    return results.filter((item) => {
      const type = item.media_type || (item.title ? "movie" : "tv");
      return type === mediaFilter;
    });
  }, [results, mediaFilter]);

  const handleItemClick = (item: any) => {
    saveRecentQuery(query.trim());
    onClose();
  };

  const handleRecentClick = (q: string) => {
    setQuery(q);
    inputRef.current?.focus();
  };

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

          {/* Modal Sheet */}
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

            {/* Header row */}
            <div className="flex items-center justify-between px-5 pt-3 pb-3 flex-shrink-0">
              <h2 className="text-xl font-bold tracking-tight">Search</h2>
              <div className="flex items-center gap-2">
                {/* Filter dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowFilterDropdown((v) => !v)}
                    className="flex items-center gap-1.5 bg-white/8 border border-white/10 rounded-xl px-3 py-1.5 text-xs font-medium text-white/70 hover:text-white hover:bg-white/12 transition-all"
                  >
                    {filterLabels[mediaFilter]}
                    <ChevronDown className={`w-3.5 h-3.5 text-white/40 transition-transform duration-200 ${showFilterDropdown ? "rotate-180" : ""}`} />
                  </button>
                  <AnimatePresence>
                    {showFilterDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: -4, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -4, scale: 0.97 }}
                        transition={{ duration: 0.12 }}
                        className="absolute right-0 top-full mt-1.5 w-44 bg-neutral-900 border border-white/10 rounded-2xl overflow-hidden z-50 shadow-2xl"
                      >
                        {(["all", "movie", "tv"] as MediaFilter[]).map((f) => (
                          <button
                            key={f}
                            onClick={() => { setMediaFilter(f); setShowFilterDropdown(false); }}
                            className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                              mediaFilter === f
                                ? "text-white bg-white/10 font-medium"
                                : "text-white/50 hover:text-white hover:bg-white/5"
                            }`}
                          >
                            {filterLabels[f]}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Close */}
                <button
                  onClick={onClose}
                  className="flex items-center justify-center w-8 h-8 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Search input */}
            <div className="relative flex items-center px-4 pb-3 flex-shrink-0">
              <Search className="absolute left-8 w-4 h-4 text-white/35 pointer-events-none" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type here to search..."
                className="w-full bg-white/6 border border-white/10 rounded-2xl py-3.5 pl-11 pr-10 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-white/20 transition-all"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="absolute right-8 text-white/35 hover:text-white transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Scrollable content */}
            <div className="overflow-y-auto flex-1 overscroll-contain">

              {/* Recent Searches */}
              {!query && recentSearches.length > 0 && (
                <div className="px-2 pb-3">
                  <div className="flex items-center justify-between px-3 py-1.5">
                    <span className="text-[11px] font-semibold text-white/35 tracking-widest uppercase">Recent</span>
                    <button
                      onClick={() => { clearAllRecent(); setRecentSearches([]); }}
                      className="text-xs text-white/35 hover:text-white transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="divide-y divide-white/5 rounded-2xl overflow-hidden bg-white/4">
                    {recentSearches.map((item) => (
                      <button
                        key={item.timestamp}
                        onClick={() => handleRecentClick(item.query)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/6 transition-colors text-left"
                      >
                        <Clock className="w-3.5 h-3.5 text-white/25 flex-shrink-0" />
                        <span className="text-sm text-white/60">{item.query}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty prompt */}
              {!query && recentSearches.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 text-white/20">
                  <Search className="w-8 h-8 mb-2 opacity-40" />
                  <p className="text-sm">Search movies & TV shows</p>
                </div>
              )}

              {/* Loading spinner */}
              {query && loading && results.length === 0 && (
                <div className="flex items-center justify-center py-10">
                  <div className="w-5 h-5 rounded-full border-2 border-white/15 border-t-white animate-spin" />
                </div>
              )}

              {/* No results */}
              {query && !loading && displayItems.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 text-white/25 text-sm">
                  <p>No results for "{query}"</p>
                </div>
              )}

              {/* Results */}
              {query && displayItems.length > 0 && (
                <div className="px-2 pb-3">
                  <div className="divide-y divide-white/5 rounded-2xl overflow-hidden bg-white/4">
                    <AnimatePresence mode="popLayout">
                      {displayItems.map((item, idx) => (
                        <ResultRow
                          key={`${item.id}-${idx}`}
                          item={item}
                          index={idx}
                          onItemClick={handleItemClick}
                          isLast={idx === displayItems.length - 1}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/* ── Result Row ── */
const ResultRow = memo(({
  item, index, onItemClick, isLast,
}: {
  item: any; index: number; onItemClick: (item: any) => void; isLast: boolean;
}) => {
  const { setIsLoading } = useGlobalLoading();
  const title = item.title || item.name || "";
  const mediaType = item.media_type || (item.title ? "movie" : "tv");
  const year = (item.release_date || item.first_air_date || "").slice(0, 4);
  const rating = item.vote_average ? item.vote_average.toFixed(1) : null;
  const genres = genreNames(item.genre_ids || []);
  const posterPath = item.poster_path || item.backdrop_path;
  const typeLabel = mediaType === "movie" ? "Movie" : "TV Show";

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ delay: index < 6 ? index * 0.025 : 0, duration: 0.2 }}
    >
      <Link
        href={`/${mediaType}/${item.id}`}
        onClick={() => { onItemClick(item); setIsLoading(true); }}
        className="flex items-center gap-3 px-4 py-3 hover:bg-white/6 active:bg-white/8 transition-colors"
      >
        {/* Poster */}
        <div className="flex-shrink-0 w-12 h-[68px] rounded-lg overflow-hidden bg-white/5">
          {posterPath ? (
            <img
              src={getImageUrl(posterPath, "w185")}
              alt={title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Search className="w-4 h-4 text-white/20" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-white line-clamp-1 mb-0.5">{title}</p>
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[12px] text-white/40">
            <span>{typeLabel}</span>
            {year && <><span className="text-white/15">|</span><span>{year}</span></>}
            {rating && (
              <><span className="text-white/15">|</span>
              <span className="flex items-center gap-0.5">
                <Star className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400" />{rating}
              </span></>
            )}
            {genres && <><span className="text-white/15">|</span><span className="line-clamp-1">{genres}</span></>}
          </div>
        </div>

        {/* Chevron */}
        <ChevronRight className="flex-shrink-0 w-4 h-4 text-white/15" />
      </Link>
    </motion.div>
  );
});
ResultRow.displayName = "ResultRow";
