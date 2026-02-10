"use client";

import { useEffect, useState, useRef } from "react";
import { getMediaImages, getImageUrl, getMediaVideos } from "@/lib/tmdb";
import { motion, AnimatePresence } from "framer-motion";
import { VolumeX, Play, Plus, ChevronLeft, Star, Heart, Download, ArrowDownToDot, Volume2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { useWatchlist } from "@/hooks/useWatchlist";
import { useAuth } from "@/hooks/useAuth";
import { AuthModal } from "@/components/AuthModal";
import { DownloadModal } from "./DownloadModal";

interface DetailsHeroProps {
  media: any;
  type: "movie" | "tv";
  onPlay?: () => void;
}

export function DetailsHero({ media, type, onPlay }: DetailsHeroProps) {
  const router = useRouter();
  const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useWatchlist();
  const { user } = useAuth();
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
    const iframeRef = useRef<HTMLIFrameElement>(null);


  const isFavorited = isInWatchlist(media.id, type);

  const toggleWatchlist = () => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }

    if (isFavorited) {
      removeFromWatchlist(media.id, type);
    } else {
      addToWatchlist({
        id: media.id,
        media_type: type,
        title: media.title,
        name: media.name,
        backdrop_path: media.backdrop_path,
        vote_average: media.vote_average,
        release_date: media.release_date,
        first_air_date: media.first_air_date,
      });
    }
  };

  const [logoPath, setLogoPath] = useState<string | null>(null);
  const [videoKey, setVideoKey] = useState<string | null>(null);
  const [showVideo, setShowVideo] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [videoEnded, setVideoEnded] = useState(false);

  useEffect(() => {
    async function fetchExtraDetails() {
      try {
        const [images, videos] = await Promise.all([
          getMediaImages(type, media.id),
          getMediaVideos(type, media.id)
        ]);

        const enLogo = images.logos?.find((l: any) => l.iso_639_1 === "en") || images.logos?.[0];
        setLogoPath(enLogo ? enLogo.file_path : null);

        const trailer = videos.find(
          (v: any) => v.site === "YouTube" && (v.type === "Trailer" || v.type === "Teaser")
        );
        setVideoKey(trailer ? trailer.key : null);
      } catch (error) {
        console.error("Error fetching extra details:", error);
      }
    }
    fetchExtraDetails();
  }, [media.id, type]);

  useEffect(() => {
    if (!videoKey || videoEnded) return;
    
    const showTimer = setTimeout(() => setShowVideo(true), 5000);
    
    const hideTimer = setTimeout(() => {
      setShowVideo(false);
      setVideoEnded(true);
    }, 35000); // 5s wait + 30s playback

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [videoKey, videoEnded]);

  // Handle mute/unmute via postMessage to avoid iframe reload
  useEffect(() => {
    if (iframeRef.current && showVideo) {
      const message = isMuted ? 'mute' : 'unMute';
      iframeRef.current.contentWindow?.postMessage(
        JSON.stringify({ event: 'command', func: message, args: [] }),
        '*'
      );
    }
  }, [isMuted, showVideo]);

  if (!media) return null;

  return (
    <div className="relative h-[85vh] w-full overflow-hidden bg-background text-foreground md:h-[90vh]">
      {/* Backdrop & Video */}
      <div className="absolute inset-0">
        <div
          className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000 ${
            showVideo ? "opacity-0" : "opacity-100"
          }`}
          style={{
            backgroundImage: `url(${getImageUrl(media.backdrop_path)})`,
          }}
        />

        {videoKey && showVideo && (
          <div className="absolute inset-0 h-full w-full overflow-hidden">
            <iframe
              ref={iframeRef}
              src={`https://www.youtube.com/embed/${videoKey}?autoplay=1&mute=1&controls=0&rel=0&showinfo=0&iv_load_policy=3&modestbranding=1&enablejsapi=1`}
              className="h-full w-full scale-[1.35] object-cover pointer-events-none"
              allow="autoplay; encrypted-media"
              frameBorder="0"
            />
          </div>
        )}

        {/* Overlay Gradients */}
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
      </div>

      {/* Back Button */}
      <button 
        onClick={() => router.back()}
        className="absolute left-6 top-8 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-background/40 text-foreground backdrop-blur-xl transition-all hover:bg-background/60 border border-border/10 md:left-16 lg:left-24"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>

        {/* Content */}
        <div className="relative z-10 flex h-full flex-col justify-end pb-12 px-6 md:pb-20 md:px-16 lg:px-24">
            <div className="max-w-3xl flex flex-col gap-6">
                  {/* Logo or Title - MOVES WHEN DETAILS HIDE */}
                  <motion.div
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ 
                      opacity: 1, 
                      x: 0,
                    }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="flex flex-col gap-4"
                  >
                    {logoPath ? (
                      <motion.img
                        layout
                        src={getImageUrl(logoPath)}
                        alt={media.title || media.name}
                        className="h-auto max-h-32 w-auto max-w-[300px] object-contain md:max-h-48 md:max-w-[450px]"
                      />
                    ) : (
                      <motion.h1 layout className="text-4xl font-bold md:text-6xl lg:text-7xl uppercase tracking-tighter">
                        {media.title || media.name}
                      </motion.h1>
                    )}
                  </motion.div>

                  {/* Rating & Genres - FADES OUT */}
                  <AnimatePresence>
                    {!showVideo && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                        animate={{ 
                          opacity: 1,
                          height: "auto",
                          marginBottom: 24,
                        }}
                        exit={{ 
                          opacity: 0,
                          height: 0,
                          marginBottom: 0,
                        }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        className="flex flex-wrap items-center gap-6 overflow-hidden"
                      >
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="flex items-center justify-center rounded-full bg-yellow-400/10 p-1.5 text-yellow-400">
                            <Star className="h-4 w-4 fill-current" />
                          </div>
                          <span className="text-xl font-black">{media.vote_average?.toFixed(1)}</span>
                        </div>
                        <div className="flex flex-wrap gap-2 max-w-full">
                          {media.genres?.map((genre: any) => (
                            <Badge
                              key={genre.id}
                              variant="secondary"
                              className="bg-primary/10 px-3 py-1 text-[10px] font-bold text-primary backdrop-blur-md uppercase tracking-widest border-none whitespace-nowrap"
                            >
                              {genre.name}
                            </Badge>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
    
                  {/* Overview - FADES OUT */}
                  <AnimatePresence>
                    {!showVideo && (
                      <motion.p 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ 
                          opacity: 1,
                          height: "auto",
                        }}
                        exit={{ 
                          opacity: 0,
                          height: 0,
                        }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
                        className="line-clamp-3 text-sm leading-relaxed text-zinc-300 md:text-base lg:text-lg lg:line-clamp-4 max-w-2xl font-medium overflow-hidden"
                      >
                        {media.overview}
                      </motion.p>
                    )}
                  </AnimatePresence>
    
                {/* Actions - ALWAYS VISIBLE */}
                <motion.div 
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="flex flex-wrap items-center gap-4 pt-4"
                >
                  <div className="relative flex flex-col items-center group/play">
                    <button 
                      onClick={onPlay}
                      className="flex items-center gap-3 rounded-full bg-white px-10 py-3.5 text-xs font-black text-black transition-all hover:scale-105 active:scale-95 uppercase tracking-[0.2em]"
                    >
                      <Play className="h-5 w-5 fill-current" />
                      PLAY
                    </button>
                    {type === "tv" && (
                      <div className="absolute top-full pt-3 flex flex-col items-center gap-1 text-[9px] font-black tracking-[0.3em] text-white/50 animate-pulse">
                        <span className="whitespace-nowrap">SEASON/EPISODE</span>
                        <ArrowDownToDot className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                    <button 
                      onClick={toggleWatchlist}
                      className={`flex h-12 w-12 items-center justify-center rounded-full backdrop-blur-md transition-all active:scale-95 border ${
                      isFavorited 
                        ? "bg-primary text-primary-foreground border-primary" 
                        : "bg-white/10 text-white hover:bg-white/20 border-white/10"
                      }`}
                    >
                      <Heart className={`h-5 w-5 ${isFavorited ? "fill-current" : ""}`} />
                    </button>

                      {type === "movie" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsDownloadModalOpen(true);
                          }}
                          className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition-all hover:bg-white/20 border border-white/10 active:scale-95"
                          title="Download Movie"
                        >
                          <Download className="h-5 w-5" />
                        </button>
                      )}


              </motion.div>
            </div>
        </div>

      {/* Mute Toggle */}
      <AnimatePresence>
        {showVideo && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => setIsMuted(!isMuted)}
            className="absolute top-8 right-6 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-xl transition-all hover:bg-black/60 border border-white/10 md:top-8 md:right-16 lg:right-24"
            >
              {isMuted ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
            </motion.button>

        )}
      </AnimatePresence>

      <DownloadModal 
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
        mediaItem={media}
        mediaType={type}
      />

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)}
        title="Login Required"
        description="You need to log in first to add this to your watchlist."
      />
    </div>
  );
}

