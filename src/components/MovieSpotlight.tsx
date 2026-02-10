"use client";

import { useEffect, useState, useCallback } from "react";
import { getTrending, getMediaImages, getGenres, getImageUrl, getMediaDetails } from "@/lib/tmdb";
import { motion, AnimatePresence } from "framer-motion";
import { Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SnakeLoader } from "@/components/ui/snake-loader";
import { useGlobalLoading } from "@/hooks/useGlobalLoading";
import Link from "next/link";

interface Media {
  id: number;
  media_type: "movie" | "tv";
  backdrop_path: string;
  poster_path: string;
  genre_ids: number[];
  overview: string;
  vote_average: number;
  title?: string;
  name?: string;
  tagline?: string;
}

interface Genre {
  id: number;
  name: string;
}

export function MovieSpotlight() {
  const { setIsLoading } = useGlobalLoading();
  const [trendingList, setTrendingList] = useState<Media[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [media, setMedia] = useState<Media | null>(null);
  const [logoPath, setLogoPath] = useState<string | null>(null);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch initial data
  useEffect(() => {
    async function fetchInitialData() {
      try {
        const [trending, allGenres] = await Promise.all([
          getTrending(),
          getGenres()
        ]);
        setTrendingList(trending.slice(0, 10)); // Limit to top 10 for spotlight
        setGenres(allGenres);
      } catch (error) {
        console.error("Error fetching initial spotlight data:", error);
      }
    }
    fetchInitialData();
  }, []);

  // Fetch details for current index
  useEffect(() => {
    async function fetchMediaDetails() {
      if (trendingList.length === 0) return;

      const currentItem = trendingList[currentIndex];

      try {
        const [details, images] = await Promise.all([
          getMediaDetails(currentItem.media_type, currentItem.id),
          getMediaImages(currentItem.media_type, currentItem.id)
        ]);

        setMedia({ ...currentItem, tagline: details.tagline });

        const enLogo = images.logos?.find((l: any) => l.iso_639_1 === "en") || images.logos?.[0];
        setLogoPath(enLogo ? enLogo.file_path : null);

        setLoading(false);
      } catch (error) {
        console.error("Error fetching media details:", error);
      }
    }
    fetchMediaDetails();
  }, [currentIndex, trendingList]);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % trendingList.length);
  }, [trendingList.length]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + trendingList.length) % trendingList.length);
  }, [trendingList.length]);

  // Auto-advance timer
  useEffect(() => {
    if (trendingList.length === 0) return;
    
    const timer = setInterval(() => {
      nextSlide();
    }, 30000);

    return () => clearInterval(timer);
  }, [nextSlide, trendingList.length]);

  if (loading || !media) {
    return (
      <div className="flex h-[80vh] w-full items-center justify-center bg-background">
        <SnakeLoader size="lg" />
      </div>
    );
  }

  const mediaGenres = (media.genre_ids || [])
    .map(id => genres.find(g => g.id === id)?.name)
    .filter(Boolean);

  const handleDragEnd = (event: any, info: any) => {
    const threshold = 50;
    if (info.offset.x > threshold) {
      prevSlide();
    } else if (info.offset.x < -threshold) {
      nextSlide();
    }
  };

  return (
    <motion.div 
      className="group relative h-[80vh] w-full overflow-hidden bg-background text-foreground"
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.2}
      onDragEnd={handleDragEnd}
    >
      {/* Backdrop */}
      <AnimatePresence mode="wait">
        <motion.div
          key={media.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="absolute inset-0"
        >
            {/* Static Backdrop Image */}
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-100 transition-opacity duration-1000"
              style={{
                backgroundImage: `url(${getImageUrl(media.backdrop_path)})`,
              }}
            />

          {/* Overlay Gradients - These usually stay dark for readability, but can be semi-transparent */}
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <div className="relative z-10 flex h-full flex-col justify-end pb-12 px-6 md:pb-20 md:px-16 lg:px-24 pointer-events-none">
        <AnimatePresence mode="wait">
          <motion.div
            key={media.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl space-y-4"
          >
            {/* Logo */}
            <div className="flex flex-col gap-2">
              {logoPath ? (
                <img
                  src={getImageUrl(logoPath)}
                  alt={media.title || media.name}
                  className="h-auto max-h-32 w-auto max-w-[300px] object-contain md:max-h-48 md:max-w-[450px]"
                />
              ) : (
                <h1 className="text-4xl font-bold md:text-6xl text-foreground">
                  {media.title || media.name}
                </h1>
              )}
            </div>

            {/* Tagline */}
            {media.tagline && (
              <p className="text-sm font-medium italic text-muted-foreground md:text-base">
                {media.tagline}
              </p>
            )}

            {/* Metadata */}
            <div className="flex flex-wrap items-center gap-4 text-foreground">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center rounded-full bg-yellow-400/10 p-1.5 text-yellow-500">
                  <Star className="h-4 w-4 fill-current" />
                </div>
                <span className="text-lg font-bold">{(media.vote_average ?? 0).toFixed(1)}</span>
              </div>
              <div className="h-1 w-1 rounded-full bg-muted-foreground" />
              <div className="flex flex-wrap gap-2">
                {mediaGenres.slice(0, 3).map((genre, idx) => (
                  <Badge
                    key={idx}
                    variant="secondary"
                    className="bg-primary/10 px-3 py-0.5 text-xs font-medium text-primary backdrop-blur-md hover:bg-primary/20"
                  >
                    {genre}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col items-start pt-6">
                <div className="relative flex flex-col items-start gap-2.5">
                  <Link 
                    href={`/${media.media_type}/${media.id}`}
                    onClick={() => setIsLoading(true)}
                    className="text-[10px] font-bold tracking-[0.4em] text-foreground uppercase transition-all hover:tracking-[0.5em] hover:text-primary pointer-events-auto"
                  >
                    Details
                  </Link>
                  <div className="h-[1px] w-20 bg-gradient-to-r from-primary to-transparent" />
                </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Progress Indicators */}
      <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 gap-2 pointer-events-auto">
        {trendingList.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`h-1 rounded-full transition-all duration-300 ${
              idx === currentIndex ? "w-8 bg-primary" : "w-2 bg-primary/20"
            }`}
          />
        ))}
      </div>

      {/* Media Type (Bottom Right) */}
        <div className="absolute bottom-12 right-6 z-20 flex items-center md:bottom-20 md:right-16 lg:right-24 pointer-events-auto">
          <span className="text-[11px] font-medium tracking-[0.3em] text-foreground/70 uppercase">
            <span className="mr-3 text-foreground/30">|</span>
            {media.media_type === "movie" ? "Movie" : "TV"}
          </span>
        </div>
    </motion.div>
  );
}
