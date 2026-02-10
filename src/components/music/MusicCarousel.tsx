"use client";

import { useRef } from "react";
import { Song, Album, Artist } from "@/hooks/useMusic";
import { MusicCard } from "./MusicCard";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MusicCarouselProps {
  items: (Song | Album | Artist)[];
  variant?: "default" | "artist" | "album";
}

export function MusicCarousel({ items, variant = "default" }: MusicCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === "left" ? scrollLeft - clientWidth : scrollLeft + clientWidth;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: "smooth" });
    }
  };

  return (
    <div className="relative group/carousel">
        <div
          ref={scrollRef}
          className="flex gap-4 md:gap-6 overflow-x-auto no-scrollbar scroll-smooth pb-4 px-1"
        >
          {items.map((item) => (
            <div 
              key={item.id} 
              className={cn(
                "min-w-[150px] sm:min-w-[180px] md:min-w-[200px] lg:min-w-[220px]",
                variant === "artist" && "min-w-[120px] sm:min-w-[140px] md:min-w-[160px] lg:min-w-[180px]"
              )}
            >
              <MusicCard item={item} variant={variant} />
            </div>
          ))}
        </div>


      <Button
        variant="ghost"
        size="icon"
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 opacity-0 group-hover/carousel:opacity-100 transition-opacity bg-background/80 backdrop-blur-md hidden md:flex rounded-full z-10 hover:bg-background"
        onClick={() => scroll("left")}
      >
        <ChevronLeft className="w-6 h-6" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 opacity-0 group-hover/carousel:opacity-100 transition-opacity bg-background/80 backdrop-blur-md hidden md:flex rounded-full z-10 hover:bg-background"
        onClick={() => scroll("right")}
      >
        <ChevronRight className="w-6 h-6" />
      </Button>
    </div>
  );
}
