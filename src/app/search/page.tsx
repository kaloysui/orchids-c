"use client";

import { useState, useEffect, useCallback, memo, useMemo, useRef } from "react";
import { searchMulti, getTrending, getImageUrl, getMediaImages } from "@/lib/tmdb";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ChevronDown, ChevronLeft, ChevronRight, X, Clock } from "lucide-react";
import Link from "next/link";
import { debounce } from "@/lib/utils";
import { SnakeLoader } from "@/components/ui/snake-loader";
import { useGlobalLoading } from "@/hooks/useGlobalLoading";

type MediaFilter = "all" | "movie" | "tv";

interface RecentSearchItem {
  id: number;
  media_type: "movie" | "tv";
  title: string;
  backdrop_path: string | null;
  logo_path: string | null;
}

const RECENT_SEARCH_KEY = "bcine_recent_searches";
const MAX_RECENT = 20;

function getRecentSearches(): RecentSearchItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_SEARCH_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRecentSearch(item: RecentSearchItem) {
  const existing = getRecentSearches().filter((r) => r.id !== item.id);
  const updated = [item, ...existing].slice(0, MAX_RECENT);
  localStorage.setItem(RECENT_SEARCH_KEY, JSON.stringify(updated));
}

function removeRecentSearch(id: number) {
  const updated = getRecentSearches().filter((r) => r.id !== id);
  localStorage.setItem(RECENT_SEARCH_KEY, JSON.stringify(updated));
}

function clearAllRecentSearches() {
  localStorage.removeItem(RECENT_SEARCH_KEY);
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [trending, setTrending] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [mediaFilter, setMediaFilter] = useState<MediaFilter>("all");
  const [showDropdown, setShowDropdown] = useState(false);
  const [recentSearches, setRecentSearches] = useState<RecentSearchItem[]>([]);
  const recentScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setRecentSearches(getRecentSearches());
  }, []);

  useEffect(() => {
    async function init() {
      try {
        const trendingData = await getTrending();
        const filtered = trendingData.filter((item: any) => item.media_type !== "person");
        setTrending(filtered.slice(0, 18));
      } catch (error) {
        console.error("Error initializing:", error);
      }
    }
    init();
  }, []);

  const handleSearch = useCallback(
    debounce(async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        const data = await searchMulti(searchQuery);
        const filteredResults = (data.results || []).filter(
          (item: any) => item.media_type !== "person"
        );
        setResults(filteredResults);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setLoading(false);
      }
    }, 500),
    []
  );

  useEffect(() => {
    handleSearch(query);
  }, [query, handleSearch]);

  const displayItems = useMemo(() => {
    const base = query ? results : trending;
    if (mediaFilter === "all") return base;
    return base.filter((item) => {
      const type = item.media_type || (item.title ? "movie" : "tv");
      return type === mediaFilter;
    });
  }, [results, trending, query, mediaFilter]);

  const filterLabels: Record<MediaFilter, string> = {
    all: "Movies & TV Shows",
    movie: "Movies",
    tv: "TV Shows",
  };

  const handleItemClick = async (item: any) => {
    const mediaType = item.media_type || (item.title ? "movie" : "tv");
    const title = item.title || item.name;

    let logoPath: string | null = null;
    try {
      const images = await getMediaImages(mediaType, item.id);
      const enLogo = images.logos?.find((l: any) => l.iso_639_1 === "en") || images.logos?.[0];
      logoPath = enLogo?.file_path || null;
    } catch {}

    const recentItem: RecentSearchItem = {
      id: item.id,
      media_type: mediaType,
      title,
      backdrop_path: item.backdrop_path,
      logo_path: logoPath,
    };
    saveRecentSearch(recentItem);
    setRecentSearches(getRecentSearches());
  };

  const handleRemoveRecent = (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    e.stopPropagation();
    removeRecentSearch(id);
    setRecentSearches(getRecentSearches());
  };

  const handleClearAll = () => {
    clearAllRecentSearches();
    setRecentSearches([]);
  };

  const scrollRecent = (direction: "left" | "right") => {
    if (recentScrollRef.current) {
      const { scrollLeft, clientWidth } = recentScrollRef.current;
      const scrollTo =
        direction === "left"
          ? scrollLeft - clientWidth * 0.7
          : scrollLeft + clientWidth * 0.7;
      recentScrollRef.current.scrollTo({ left: scrollTo, behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground pt-20 pb-20">
      {/* Search Section */}
      <div className="relative px-6 pt-8 pb-6">
        <div className="mx-auto max-w-lg bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 space-y-3">
          {/* Category Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="w-full flex items-center justify-between bg-zinc-800/60 border border-zinc-700 rounded-xl px-4 py-3.5 text-left text-sm text-zinc-300 transition-colors hover:border-zinc-600"
            >
              <span>{filterLabels[mediaFilter]}</span>
              <ChevronDown
                className={`w-4 h-4 text-zinc-500 transition-transform ${showDropdown ? "rotate-180" : ""}`}
              />
            </button>

            <AnimatePresence>
              {showDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="absolute left-0 right-0 top-full mt-1 bg-zinc-800 border border-zinc-700 rounded-xl overflow-hidden z-30 shadow-xl"
                >
                  {(["all", "movie", "tv"] as MediaFilter[]).map((f) => (
                    <button
                      key={f}
                      onClick={() => {
                        setMediaFilter(f);
                        setShowDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                        mediaFilter === f
                          ? "bg-white/10 text-white"
                          : "text-zinc-400 hover:bg-zinc-700/50 hover:text-white"
                      }`}
                    >
                      {filterLabels[f]}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Search Input */}
          <div className="relative flex items-center">
            <Search className="absolute left-4 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type here to search..."
              className="w-full bg-zinc-800/60 border border-zinc-700 rounded-xl py-3.5 pl-11 pr-4 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors"
              autoFocus
            />
          </div>
        </div>
      </div>

      {/* Recent Searches Section */}
      {!query && recentSearches.length > 0 && (
        <section className="w-full pt-2 pb-6 overflow-visible relative group/section">
          <div className="flex items-center justify-between mb-4 px-4 md:px-8">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-zinc-500" />
                <h2 className="text-base font-bold text-white uppercase tracking-[0.15em]">
                  Recent <span className="text-zinc-500">Searches</span>
                </h2>
              </div>
              <button
                onClick={handleClearAll}
                className="text-xs text-zinc-500 hover:text-white transition-colors px-2 py-1 rounded-lg hover:bg-zinc-800"
              >
                Clear All
              </button>
            </div>

            <div
              ref={recentScrollRef}
              className="flex overflow-x-auto gap-3 scrollbar-hide px-4 md:px-8 scroll-smooth overscroll-x-contain"
            >
              {recentSearches.map((item, index) => (
                <RecentSearchCard
                  key={item.id}
                  item={item}
                  index={index}
                  onRemove={handleRemoveRecent}
                />
              ))}
            </div>

            {/* Arrows at bottom */}
            <div className="flex items-center justify-end px-4 md:px-8 mt-3">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => scrollRecent("left")}
                  className="p-1.5 rounded-full bg-zinc-900/80 text-white hover:bg-white hover:text-black transition-all border border-white/10"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => scrollRecent("right")}
                  className="p-1.5 rounded-full bg-zinc-900/80 text-white hover:bg-white hover:text-black transition-all border border-white/10"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
        </section>
      )}

      {/* Results / Trending Section */}
      <div className="px-4 md:px-8 max-w-7xl mx-auto mt-2">
        {/* Section Header */}
        <div className="mb-4">
          {query ? (
            loading ? (
              <div className="flex items-center gap-3">
                <SnakeLoader size="sm" />
                <span className="text-sm text-zinc-400 italic">
                  Searching <span className="text-white font-semibold">&quot;{query}&quot;</span>...
                </span>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-1 h-6 bg-primary rounded-full" />
                  <h2 className="text-xl font-bold">Search Results</h2>
                </div>
                <p className="text-zinc-500 text-sm">{displayItems.length} results found</p>
              </div>
            )
          ) : (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-1 h-6 bg-primary rounded-full" />
                <h2 className="text-xl font-bold">Trending Today</h2>
              </div>
              <p className="text-zinc-500 text-sm">{displayItems.length} results found</p>
            </div>
          )}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
          {displayItems.map((item, idx) => (
            <SearchCard
              key={`${item.id}-${mediaFilter}`}
              item={item}
              index={idx}
              onItemClick={handleItemClick}
            />
          ))}
        </div>

        {query && !loading && results.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
            <Search className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-lg">No results found for &quot;{query}&quot;</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Recent Search Card ─── */
const RecentSearchCard = memo(
  ({
    item,
    index,
    onRemove,
  }: {
    item: RecentSearchItem;
    index: number;
    onRemove: (e: React.MouseEvent, id: number) => void;
  }) => {
    const { setIsLoading } = useGlobalLoading();

    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.04, duration: 0.3, ease: "easeOut" }}
        className="flex-none w-[220px] sm:w-[260px] md:w-[300px] group/card"
      >
        <Link
          href={`/${item.media_type}/${item.id}`}
          onClick={() => setIsLoading(true)}
          className="relative block aspect-video w-full overflow-hidden rounded-2xl bg-zinc-900 shadow-lg"
        >
          {/* Backdrop Image */}
          {item.backdrop_path ? (
            <img
              src={getImageUrl(item.backdrop_path)}
              alt={item.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
              <Search className="w-8 h-8 text-zinc-700" />
            </div>
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

          {/* Remove button */}
          <button
            onClick={(e) => onRemove(e, item.id)}
            className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 backdrop-blur-sm text-white/70 hover:text-white hover:bg-black/80 transition-all opacity-0 group-hover/card:opacity-100 z-10"
          >
            <X className="w-3 h-3" />
          </button>

            {/* Logo + Title at center bottom */}
            <div className="absolute bottom-0 left-0 right-0 p-3 flex flex-col items-center">
              {item.logo_path ? (
                <img
                  src={getImageUrl(item.logo_path)}
                  alt={item.title}
                  className="h-6 sm:h-7 w-auto max-w-[70%] object-contain drop-shadow-lg"
                  loading="lazy"
                />
              ) : (
                <p className="text-xs sm:text-sm font-semibold text-white line-clamp-1 drop-shadow-lg text-center">
                  {item.title}
                </p>
              )}
            </div>
        </Link>
      </motion.div>
    );
  }
);
RecentSearchCard.displayName = "RecentSearchCard";

/* ─── Search / Trending Card ─── */
const SearchCard = memo(
  ({
    item,
    index,
    onItemClick,
  }: {
    item: any;
    index: number;
    onItemClick: (item: any) => void;
  }) => {
    const title = item.title || item.name;
    const mediaType = item.media_type || (item.title ? "movie" : "tv");

    if (!item.poster_path && !item.backdrop_path) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: index < 12 ? index * 0.04 : 0,
          duration: 0.35,
          ease: "easeOut",
        }}
        className="group"
      >
        <Link href={`/${mediaType}/${item.id}`} onClick={() => onItemClick(item)}>
          <div className="relative aspect-[2/3] overflow-hidden bg-zinc-900">
            <img
              src={getImageUrl(item.poster_path || item.backdrop_path)}
              alt={title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute bottom-0 left-0 right-0 p-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <p className="text-xs font-semibold line-clamp-2 drop-shadow-lg">{title}</p>
            </div>
          </div>
        </Link>
      </motion.div>
    );
  }
);
SearchCard.displayName = "SearchCard";
