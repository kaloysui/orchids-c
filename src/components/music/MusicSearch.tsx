"use client";

import { useState, useEffect } from "react";
import { Loader2, Music2, Disc, User } from "lucide-react";
import { Song, Album, Artist } from "@/hooks/useMusic";
import { MusicCard } from "./MusicCard";
import { cn } from "@/lib/utils";

interface MusicSearchProps {
  initialQuery?: string;
  onClose?: () => void;
}

type SearchTab = "songs" | "albums";

export function MusicSearch({ initialQuery = "", onClose }: MusicSearchProps) {
  const [results, setResults] = useState<(Song | Album)[]>([]);
  const [activeTab, setActiveTab] = useState<SearchTab>("songs");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchResults = async (searchQuery: string, type: SearchTab) => {
      const finalQuery = searchQuery || "amazing 2026";
      setIsLoading(true);
      try {
        let endpoint = "search/songs";
        if (type === "albums") endpoint = "search/albums";

        const res = await fetch(`https://jiosaavn-api-privatecvc2.vercel.app/${endpoint}?query=${encodeURIComponent(finalQuery)}`);
        const data = await res.json();
        if (data.status === "SUCCESS") {
          setResults(data.data.results);
        } else {
          setResults([]);
        }
      } catch (error) {
        console.error("Search error:", error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    const debounce = setTimeout(() => fetchResults(initialQuery, activeTab), initialQuery ? 300 : 0);
    return () => clearTimeout(debounce);
  }, [initialQuery, activeTab]);

  const tabs: { id: SearchTab; label: string; icon: any }[] = [
    { id: "songs", label: "Songs", icon: Music2 },
    { id: "albums", label: "Albums", icon: Disc },
  ];

  return (
    <div className="w-full space-y-12 pb-32">
      <div className="flex items-center gap-1 p-1 bg-white/5 rounded-full w-fit mx-auto border border-white/5 backdrop-blur-md">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setResults([]);
            }}
            className={cn(
              "flex items-center gap-2 px-6 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] transition-all",
              activeTab === tab.id
                ? "bg-foreground text-background shadow-lg"
                : "text-muted-foreground/60 hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading && results.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Loader2 className="h-6 w-6 text-muted-foreground/20 animate-spin" />
          <p className="text-muted-foreground/40 font-bold text-[10px] tracking-[0.3em] uppercase">Searching</p>
        </div>
      )}

      <div className="space-y-10">
        <div className="flex items-center justify-center">
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-border/30" />
            <h2 className="text-[10px] font-bold tracking-[0.4em] text-muted-foreground/40 uppercase">
              {initialQuery ? (
                <div className="flex items-center gap-2">
                  <span>{activeTab}</span>
                  <span>Results</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span>Trending</span>
                  <span>{activeTab}</span>
                </div>
              )}
            </h2>
            <span className="h-px w-8 bg-border/30" />
          </div>
        </div>

        {results.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-6 gap-y-12">
            {results.map((item: any) => (
              <MusicCard 
                key={item.id} 
                item={item} 
                variant={activeTab === "albums" ? "album" : "default"} 
              />
            ))}
          </div>
        ) : !isLoading && (
          <div className="text-center py-24 border border-dashed border-white/5 rounded-3xl">
            <p className="text-[10px] font-bold text-muted-foreground/30 uppercase tracking-[0.3em]">No {activeTab} found</p>
          </div>
        )}
      </div>
    </div>
);
}

