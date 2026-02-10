"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { getDiscover, getImageUrl, getGenresByType, getMediaImages } from "@/lib/tmdb";
import { Play, Plus, ChevronLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useInView } from "react-intersection-observer";
import { motion } from "framer-motion";
import { SnakeLoader } from "@/components/ui/snake-loader";

interface Media {
  id: number;
  title?: string;
  name?: string;
  backdrop_path: string;
  poster_path: string;
  media_type: string;
  logoPath?: string | null;
}

function DiscoverContent() {
  const searchParams = useSearchParams();
  const type = (searchParams.get("type") as "movie" | "tv") || "movie";
  const genreId = parseInt(searchParams.get("id") || "0");

  const [items, setItems] = useState<Media[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [genreName, setGenreName] = useState("");

  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: "400px",
  });

  const fetchItems = useCallback(async (pageNum: number) => {
    if (loading) return;
    setLoading(true);
    try {
      const data = await getDiscover(type, { page: pageNum, genreId });
      
      if (data.results.length === 0) {
        setHasMore(false);
      } else {
        const enrichedResults = await Promise.all(
          data.results.map(async (item: any) => {
            try {
              const images = await getMediaImages(type, item.id);
              const enLogo = images.logos?.find((l: any) => l.iso_639_1 === "en") || images.logos?.[0];
              return {
                ...item,
                logoPath: enLogo ? enLogo.file_path : null
              };
            } catch {
              return { ...item, logoPath: null };
            }
          })
        );
        
        setItems(prev => pageNum === 1 ? enrichedResults : [...prev, ...enrichedResults]);
        setHasMore(pageNum < data.totalPages);
      }
    } catch (error) {
      console.error("Error fetching discover items:", error);
    } finally {
      setLoading(false);
    }
  }, [type, genreId, loading]);

  useEffect(() => {
    async function fetchGenreName() {
      if (genreId) {
        const genres = await getGenresByType(type);
        const genre = genres.find((g: any) => g.id === genreId);
        if (genre) setGenreName(genre.name);
      }
    }
    fetchGenreName();
    setItems([]);
    setPage(1);
    setHasMore(true);
    fetchItems(1);
  }, [type, genreId]);

  useEffect(() => {
    if (inView && hasMore && !loading) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchItems(nextPage);
    }
  }, [inView, hasMore, loading, page, fetchItems]);

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="pt-32 pb-8 px-4 md:px-8 max-w-[1600px] mx-auto">
        <header className="mb-12 flex flex-col gap-2">
          <div className="flex items-center gap-3 text-zinc-500 font-bold tracking-[0.2em] text-xs uppercase">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span>/</span>
            <span className="text-white">Discover</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter uppercase">
            {genreName || "Discover"}
            <span className="text-zinc-800 ml-4 block md:inline text-3xl md:text-5xl">{type === "movie" ? "Movies" : "TV Shows"}</span>
          </h1>
        </header>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {items.map((item, index) => (
                  <motion.div
                    key={`${item.id}-${index}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: (index % 12) * 0.05 }}
                    className="group relative will-change-transform"
                  >
                  <Link 
                    href={`/${type}/${item.id}`}
                    className="relative block aspect-video w-full overflow-hidden shadow-lg cursor-pointer bg-zinc-900 rounded-sm group-hover:ring-1 group-hover:ring-white/20 transition-all"
                  >
                    <Image
                      src={getImageUrl(item.backdrop_path || item.poster_path)}
                      alt={item.title || item.name || ""}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
                    />
                    
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 flex flex-col justify-end p-3 md:p-4">
                      <div className="w-full">
                        {item.logoPath ? (
                          <div className="relative h-8 md:h-10 w-full">
                            <Image
                              src={getImageUrl(item.logoPath)}
                              alt={item.title || item.name || ""}
                              fill
                              className="object-contain object-left drop-shadow-2xl"
                            />
                          </div>
                        ) : (
                          <span className="text-[10px] md:text-xs font-bold text-white uppercase tracking-tight block text-left leading-tight drop-shadow-lg line-clamp-2">
                            {item.title || item.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>

                </motion.div>
              ))}
            </div>

        {hasMore && (
          <div ref={ref} className="w-full py-20 flex justify-center">
            <SnakeLoader size="md" />
          </div>
        )}

        {!hasMore && items.length > 0 && (
          <div className="w-full py-20 text-center text-zinc-800 font-bold uppercase tracking-[0.3em] text-xs">
            End of results
          </div>
        )}
      </div>
    </div>
  );
}

export default function DiscoverPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <SnakeLoader size="lg" />
      </div>
    }>
      <DiscoverContent />
    </Suspense>
  );
}
