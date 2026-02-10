"use client";

import { Song, Album, Artist, useMusic } from "@/hooks/useMusic";
import { Play, Pause, Heart } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface MusicCardProps {
  item: Song | Album;
  variant?: "default" | "album";
}

export function MusicCard({ item, variant = "default" }: MusicCardProps) {
  const { currentSong, isPlaying, playSong, addToQueue, queue, getArtistsString } = useMusic();
  const router = useRouter();

  const isSong = (item: any): item is Song => "downloadUrl" in item;
  const isAlbum = (item: any): item is Album => !isSong(item) && variant === "album";

  const imageUrl = item.image.find(img => img.quality === "500x500")?.link || item.image[item.image.length - 1].link;

  const handleAction = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isSong(item)) {
      playSong(item);
      router.push(`/music/play/${item.id}`);
    } else if (isAlbum(item)) {
      router.push(`/music/album/${item.id}`);
    }
  };

  const handleAddToQueue = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isSong(item)) {
      addToQueue(item);
    }
  };

  const cleanString = (str: string) => {
    if (!str) return "";
    return str.replace(/&amp;/g, "&")
              .replace(/&quot;/g, '"')
              .replace(/&#039;/g, "'")
              .replace(/&lt;/g, "<")
              .replace(/&gt;/g, ">");
  };

    if (variant === "album") {
      const album = item as Album;
      return (
        <div 
          onClick={handleAction}
          className="group relative flex flex-col gap-3 transition-all cursor-pointer"
        >
            <div className="absolute top-3 right-3 z-20 transition-opacity duration-300">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      router.push(`/music/album/${album.id}`);
                    }}
                    className="p-2 rounded-full backdrop-blur-xl border border-white/10 text-white bg-black/40 hover:bg-black/60 transition-all duration-300 shadow-xl"
                  >
                    <Heart className="w-3.5 h-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <p className="text-[10px] font-bold uppercase tracking-wider">View Album</p>
                </TooltipContent>
              </Tooltip>
            </div>

            <div className="relative aspect-square overflow-hidden rounded-2xl bg-white/[0.02] border border-white/5">

            <img
              src={imageUrl}
              alt={album.name}
              className="object-cover w-full h-full transition-all duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center transition-all duration-500 opacity-0 group-hover:opacity-100 backdrop-blur-[2px]">
              <div className="w-12 h-12 flex items-center justify-center rounded-full bg-white text-black shadow-2xl scale-90 group-hover:scale-100 transition-transform duration-500">
                <Play className="w-6 h-6 fill-current ml-1" />
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-1 px-1 text-center">
            <h3 className="font-semibold text-xs md:text-sm truncate text-foreground/90 group-hover:text-primary transition-colors">
              {cleanString(album.name)}
            </h3>
            <p className="text-[10px] text-muted-foreground/50 truncate font-medium">
              {cleanString(getArtistsString(album.primaryArtists))}
            </p>
          </div>
        </div>
      );
    }
  
    // Default Song view
    const song = item as Song;
    const isCurrentSong = currentSong?.id === song.id;
    const isInQueue = queue.some(s => s.id === song.id);
  
    return (
      <div 
        onClick={handleAction}
        className="group relative flex flex-col gap-3 transition-all cursor-pointer"
      >
        <div className="relative aspect-square overflow-hidden rounded-2xl bg-white/[0.02] border border-white/5">
          <img
            src={imageUrl}
            alt={song.name}
            className="object-cover w-full h-full transition-all duration-700 group-hover:scale-110"
          />
          
            <div className="absolute top-3 right-3 z-20 transition-opacity duration-300">
            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  onClick={handleAddToQueue}
                  className={cn(
                    "p-2 rounded-full backdrop-blur-xl border transition-all duration-300 shadow-xl",
                    isInQueue ? "bg-primary border-primary text-primary-foreground" : "bg-black/40 border-white/10 text-white hover:bg-black/60"
                  )}
                >
                  <Heart className={cn("w-3.5 h-3.5", isInQueue && "fill-current")} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p className="text-[10px] font-bold uppercase tracking-wider">{isInQueue ? "In Queue" : "Queue"}</p>
              </TooltipContent>
            </Tooltip>
          </div>
  
          <div className={cn(
            "absolute inset-0 bg-black/40 flex items-center justify-center transition-all duration-500 opacity-0 group-hover:opacity-100 backdrop-blur-[2px]",
            isCurrentSong && "opacity-100 bg-black/60"
          )}>
            <div className="w-12 h-12 flex items-center justify-center rounded-full bg-white text-black shadow-2xl scale-90 group-hover:scale-100 transition-transform duration-500">
              {isCurrentSong && isPlaying ? (
                <Pause className="w-6 h-6 fill-current" />
              ) : (
                <Play className="w-6 h-6 fill-current ml-1" />
              )}
            </div>
          </div>
        </div>
  
        <div className="flex flex-col gap-1 px-1 text-center">
          <h3 className="font-semibold text-xs md:text-sm truncate text-foreground/90 group-hover:text-primary transition-colors">
            {cleanString(song.name)}
          </h3>
          <p className="text-[10px] text-muted-foreground/50 truncate font-medium">
            {cleanString(getArtistsString(song.primaryArtists))}
          </p>
        </div>
      </div>
    );
}

