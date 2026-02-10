"use client";

import { useMusic } from "@/hooks/useMusic";
import { Play, Pause, SkipBack, SkipForward, X, Maximize2, Volume2 } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { motion } from "framer-motion";
import { QueueSidebar } from "./QueueSidebar";

export function MusicPlayer() {
  const { 
    currentSong, 
    isPlaying, 
    togglePlay, 
    progress, 
    duration, 
    seek, 
    playNext, 
    playPrevious, 
    stopMusic,
    queue,
    getArtistsString
  } = useMusic();

  if (!currentSong) return null;

  const imageUrl = currentSong.image.find(img => img.quality === "500x500")?.link || currentSong.image[currentSong.image.length - 1].link;

  return (
    <motion.div 
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-0 left-0 right-0 z-[100] bg-background border-t border-border shadow-[0_-10px_40px_rgba(0,0,0,0.1)] pb-safe"
    >
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-muted overflow-hidden group/progress">
            <div 
              className="h-full bg-primary transition-all duration-300 ease-linear"
              style={{ width: `${(progress / (duration || 100)) * 100}%` }}
            />
            <Slider
              value={[progress]}
              max={duration || 100}
              step={0.1}
              onValueChange={([val]) => seek(val)}
              className="absolute inset-0 opacity-0 cursor-pointer h-1 z-10"
            />
            <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover/progress:opacity-100 transition-opacity pointer-events-none" />
          </div>

            <div className="max-w-7xl mx-auto px-4 h-14 md:h-16 flex items-center justify-between gap-2 md:gap-4">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <Link 
                  href={`/music/play/${currentSong.id}`}
                  className="flex items-center gap-2 md:gap-3 min-w-0 group"
                >
                  <div className="h-8 w-8 md:h-11 md:w-11 rounded-lg overflow-hidden flex-shrink-0 shadow-sm border border-border group-hover:scale-105 transition-transform">
                    <img
                      src={imageUrl}
                      alt={currentSong.name}
                      className="object-cover w-full h-full"
                    />
                  </div>
                    <div className="flex flex-col min-w-0">
                      <h4 className="font-bold text-[10px] md:text-xs truncate group-hover:text-primary transition-colors" dangerouslySetInnerHTML={{ __html: currentSong.name }} />
                      <p className="text-[10px] text-muted-foreground truncate opacity-70" dangerouslySetInnerHTML={{ __html: getArtistsString(currentSong.primaryArtists) }} />
                    </div>

                </Link>
              </div>

              <div className="flex items-center justify-end gap-1 md:gap-2">
                <div className="flex items-center bg-muted/30 backdrop-blur-md rounded-full px-1 py-0.5 border border-border/50">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={(e) => {
                      e.preventDefault();
                      playPrevious();
                    }}
                    className="text-muted-foreground hover:text-foreground h-8 w-8 rounded-full"
                  >
                    <SkipBack className="h-4 w-4 fill-current" />
                  </Button>
                  
                  <Button 
                    onClick={(e) => {
                      e.preventDefault();
                      togglePlay();
                    }}
                    variant="ghost"
                    size="icon" 
                    className="h-9 w-9 rounded-full text-foreground hover:scale-105 active:scale-95 transition-all"
                  >
                    {isPlaying ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 fill-current ml-0.5" />}
                  </Button>
          
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={(e) => {
                      e.preventDefault();
                      playNext();
                    }}
                    className="text-muted-foreground hover:text-foreground h-8 w-8 rounded-full"
                  >
                    <SkipForward className="h-4 w-4 fill-current" />
                  </Button>

                  <div className="w-[1px] h-4 bg-border mx-1" />

                  <QueueSidebar />

                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={(e) => {
                      e.preventDefault();
                      stopMusic();
                    }}
                    className="text-muted-foreground hover:text-red-500 transition-colors h-8 w-8 rounded-full"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="hidden md:flex items-center gap-1">
                  <Button variant="ghost" size="icon" asChild className="text-muted-foreground hover:text-foreground h-8 w-8 rounded-full bg-muted/30 border border-border/50">
                    <Link href={`/music/play/${currentSong.id}`}>
                      <Maximize2 className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
    </motion.div>
  );
}
