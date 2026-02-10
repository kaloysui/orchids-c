"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getGenresByType } from "@/lib/tmdb";
import { Film, Tv, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Genre {
  id: number;
  name: string;
}

interface GenreModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GenreModal({ isOpen, onClose }: GenreModalProps) {
  const [movieGenres, setMovieGenres] = useState<Genre[]>([]);
  const [tvGenres, setTvGenres] = useState<Genre[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchGenres() {
      try {
        const [movie, tv] = await Promise.all([
          getGenresByType("movie"),
          getGenresByType("tv"),
        ]);
        setMovieGenres(movie);
        setTvGenres(tv);
      } catch (error) {
        console.error("Failed to fetch genres:", error);
      } finally {
        setIsLoading(false);
      }
    }

    if (isOpen) {
      fetchGenres();
    }
  }, [isOpen]);

  const handleGenreClick = (type: "movie" | "tv", id: number) => {
    router.push(`/discover?type=${type}&id=${id}`);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl bg-background/90 border-border/50 text-foreground backdrop-blur-xl p-0 overflow-hidden rounded-[3rem] outline-none shadow-2xl">
        <DialogHeader className="p-10 pb-4 bg-transparent border-none">
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-1.5 bg-muted rounded-full mb-4 md:hidden" />
            <DialogTitle className="text-4xl md:text-5xl font-black tracking-tighter uppercase italic">
              Genres
            </DialogTitle>
            <p className="text-muted-foreground font-medium uppercase tracking-[0.2em] text-[10px]">Select your vibe</p>
          </div>
        </DialogHeader>

        <div className="p-6 md:p-10 pt-4 max-h-[70vh] overflow-y-auto overscroll-contain">
          <Tabs defaultValue="movie" className="w-full flex flex-col items-center">

          <TabsList className="bg-muted/50 p-1 mb-10 rounded-full border border-border/50 backdrop-blur-xl">
            <TabsTrigger value="movie" className="flex items-center gap-2 px-8 py-2.5 rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-transform duration-300 active:scale-95 text-xs font-bold uppercase tracking-wider">
              <Film className="w-3.5 h-3.5" />
              Movies
            </TabsTrigger>
            <TabsTrigger value="tv" className="flex items-center gap-2 px-8 py-2.5 rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-transform duration-300 active:scale-95 text-xs font-bold uppercase tracking-wider">
              <Tv className="w-3.5 h-3.5" />
              TV Shows
            </TabsTrigger>
          </TabsList>

          <TabsContent value="movie" className="mt-0 outline-none w-full will-change-transform">
            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="h-16 bg-muted/30 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {movieGenres.map((genre) => (
                  <button
                    key={genre.id}
                    onClick={() => handleGenreClick("movie", genre.id)}
                    className="group relative h-16 flex items-center justify-center px-6 rounded-2xl bg-card border border-border/50 hover:bg-primary hover:text-primary-foreground transition-all duration-300 text-center backdrop-blur-md will-change-transform active:scale-95 shadow-sm"
                  >
                    <span className="font-bold text-xs uppercase tracking-tight">
                      {genre.name}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="tv" className="mt-0 outline-none w-full will-change-transform">
            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="h-16 bg-muted/30 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {tvGenres.map((genre) => (
                  <button
                    key={genre.id}
                    onClick={() => handleGenreClick("tv", genre.id)}
                    className="group relative h-16 flex items-center justify-center px-6 rounded-2xl bg-card border border-border/50 hover:bg-primary hover:text-primary-foreground transition-all duration-300 text-center backdrop-blur-md will-change-transform active:scale-95 shadow-sm"
                  >
                    <span className="font-bold text-xs uppercase tracking-tight">
                      {genre.name}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DialogContent>
    </Dialog>

  );
}
