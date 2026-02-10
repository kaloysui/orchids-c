"use client";

import { use, useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { getProviderContent, getImageUrl } from "@/lib/tmdb";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, Star, Play, Calendar, Film, Tv, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Media {
  id: number;
  media_type: "movie" | "tv";
  poster_path: string;
  backdrop_path: string;
  title?: string;
  name?: string;
  vote_average: number;
  release_date?: string;
  first_air_date?: string;
  popularity: number;
}

export default function StudioDetailsPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = use(paramsPromise);
  const searchParams = useSearchParams();
  const providerId = searchParams.get("providerId");
  const companyId = searchParams.get("companyId");
  const studioName = searchParams.get("name") || "Studio";

  const [items, setItems] = useState<Media[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  
  const observerTarget = useRef<HTMLDivElement>(null);

  const fetchContent = useCallback(async (pageNum: number, isInitial: boolean = false) => {
    if (isInitial) setLoading(true);
    else setLoadingMore(true);

    try {
      const { results, totalPages } = await getProviderContent(
        providerId ? parseInt(providerId) : undefined,
        undefined,
        companyId ? parseInt(companyId) : undefined,
        pageNum
      );

      if (isInitial) {
        setItems(results as Media[]);
      } else {
        setItems(prev => {
          const newItems = results.filter(
            (newItem: any) => !prev.some(item => item.id === newItem.id && item.media_type === newItem.media_type)
          );
          return [...prev, ...newItems];
        });
      }

      setHasMore(pageNum < totalPages);
    } catch (error) {
      console.error("Error fetching studio content:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [providerId, companyId]);

  useEffect(() => {
    setItems([]);
    setPage(1);
    setHasMore(true);
    fetchContent(1, true);
  }, [providerId, companyId, fetchContent]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          setPage(prev => {
            const next = prev + 1;
            fetchContent(next);
            return next;
          });
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, fetchContent]);

  const featured = items[0];

  return (
    <main className="min-h-screen bg-background pb-24 text-foreground selection:bg-primary selection:text-primary-foreground">
      {/* Dynamic Header */}
      <div className="relative h-[60vh] w-full overflow-hidden">
        <AnimatePresence mode="wait">
          {featured && (
            <motion.div
              key={featured.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0"
            >
              <Image
                src={getImageUrl(featured.backdrop_path)}
                alt={studioName}
                fill
                className="object-cover opacity-40 scale-105 blur-sm"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
            </motion.div>
          )}
        </AnimatePresence>
        
        <div className="absolute inset-0 flex flex-col justify-center items-center px-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl w-full text-center space-y-6"
          >
            <Link 
              href="/studios"
              className="inline-flex items-center gap-2 text-[10px] font-black text-muted-foreground hover:text-primary transition-colors uppercase tracking-[0.4em] mb-8 group"
            >
              <ChevronLeft className="w-3 h-3 transition-transform group-hover:-translate-x-1" />
              Return Studios
            </Link>

            <h1 className="text-5xl md:text-9xl font-black text-foreground tracking-tighter uppercase italic drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]">
              {studioName}
            </h1>
            
            <div className="flex items-center justify-center gap-6 text-[10px] font-black uppercase tracking-[0.5em] text-primary/60">
              <span className="h-[1px] w-16 bg-gradient-to-r from-transparent to-primary/30" />
              Vault Collection
              <span className="h-[1px] w-16 bg-gradient-to-l from-transparent to-primary/30" />
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 -mt-20 relative z-10">
        {loading && items.length === 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="aspect-[2/3] bg-card/50 animate-pulse rounded-2xl border border-border" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6">
              {items.map((item, index) => (
                <motion.div
                  key={`${item.id}-${item.media_type}-${index}`}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: (index % 12) * 0.02 }}
                >
                  <Link
                    href={`/${item.media_type}/${item.id}`}
                    className="group block space-y-3"
                  >
                    <div className="relative aspect-[2/3] overflow-hidden rounded-2xl bg-card border border-border transition-all duration-500 group-hover:scale-[1.03] group-hover:border-primary/50 group-hover:shadow-[0_0_30px_-10px_rgba(var(--primary),0.3)]">
                      <Image
                        src={getImageUrl(item.poster_path)}
                        alt={item.title || item.name || ""}
                        fill
                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 16vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      
                      <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-50 group-hover:scale-100 duration-500">
                        <div className="p-4 rounded-full bg-primary text-primary-foreground shadow-2xl ring-4 ring-primary/20">
                          <Play className="w-6 h-6 fill-current" />
                        </div>
                      </div>
  
                      <div className="absolute top-3 left-3 px-2 py-1 bg-background/60 backdrop-blur-xl border border-border rounded-lg text-[9px] font-black uppercase tracking-widest text-foreground flex items-center gap-1.5">
                        {item.media_type === "movie" ? <Film className="w-2.5 h-2.5" /> : <Tv className="w-2.5 h-2.5" />}
                        {item.media_type === "movie" ? "Movie" : "TV"}
                      </div>
  
                      {item.vote_average > 0 && (
                        <div className="absolute top-3 right-3 px-2 py-1 bg-primary/90 backdrop-blur-xl rounded-lg text-[10px] font-black text-primary-foreground flex items-center gap-1.5 shadow-lg">
                          <Star className="w-3 h-3 fill-current" />
                          {item.vote_average.toFixed(1)}
                        </div>
                      )}
                    </div>
  
                    <div className="space-y-1 px-1">
                      <h3 className="text-[11px] font-black uppercase tracking-wider text-foreground group-hover:text-primary transition-colors line-clamp-1">
                        {item.title || item.name}
                      </h3>
                      <div className="flex items-center gap-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(item.release_date || item.first_air_date || "").getFullYear() || "N/A"}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* Infinite Scroll Trigger */}
            <div 
              ref={observerTarget} 
              className="w-full py-12 flex justify-center items-center"
            >
              {loadingMore && (
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground animate-pulse">
                    Loading More Records
                  </span>
                </div>
              )}
              {!hasMore && items.length > 0 && (
                <div className="flex flex-col items-center gap-4 opacity-30">
                  <div className="h-[1px] w-24 bg-gradient-to-r from-transparent via-border to-transparent" />
                  <span className="text-[10px] font-black uppercase tracking-[0.4em]">
                    End of Collection
                  </span>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
