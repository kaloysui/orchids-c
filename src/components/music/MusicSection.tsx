"use client";

import { useState, useEffect } from "react";
import { Song, Album, Artist } from "@/hooks/useMusic";
import { Skeleton } from "@/components/ui/skeleton";
import { MusicCarousel } from "./MusicCarousel";

interface MusicSectionProps {
  title: string;
  query: string;
  variant?: "default" | "artist" | "album";
}

export function MusicSection({ title, query, variant = "default" }: MusicSectionProps) {
  const [items, setItems] = useState<(Song | Album | Artist)[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        let endpoint = "search/songs";
        if (variant === "artist") endpoint = "search/artists";
        if (variant === "album") endpoint = "search/albums";

        const res = await fetch(`https://jiosaavn-api-privatecvc2.vercel.app/${endpoint}?query=${encodeURIComponent(query)}`);
        const data = await res.json();
        
        if (data.status === "SUCCESS") {
          setItems(data.data.results);
        }
      } catch (error) {
        console.error(`Error fetching ${title}:`, error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchItems();
  }, [query, title, variant]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {title && <h2 className="text-2xl font-black tracking-tight px-1">{title}</h2>}
        <div className="flex gap-4 overflow-x-hidden">
          {[...Array(6)].map((_, i) => (
            <div 
              key={i} 
              className={variant === "artist" 
                ? "min-w-[120px] sm:min-w-[140px] md:min-w-[160px] lg:min-w-[180px] space-y-3"
                : "min-w-[150px] sm:min-w-[180px] md:min-w-[200px] lg:min-w-[220px] space-y-3"
              }
            >
              <Skeleton className={variant === "artist" ? "aspect-square rounded-full" : "aspect-square rounded-xl"} />
              <div className="space-y-1.5 flex flex-col items-center">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-1">
        {title && <h2 className="text-2xl md:text-3xl font-black tracking-tight">{title}</h2>}
      </div>
      <MusicCarousel items={items} variant={variant} />
      <div className="h-px bg-border/50 w-full" />
    </div>
  );
}
