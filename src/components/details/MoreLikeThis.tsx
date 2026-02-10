"use client";

import { useEffect, useState } from "react";
import { getSimilar, getImageUrl, getMediaImages } from "@/lib/tmdb";
import { motion } from "framer-motion";
import { Play, Plus } from "lucide-react";
import Link from "next/link";

interface MoreLikeThisProps {
  id: number;
  type: "movie" | "tv";
}

export function MoreLikeThis({ id, type }: MoreLikeThisProps) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSimilar() {
      try {
        const results = await getSimilar(type, id);
        
        // Enrich with logos for consistent design
        const enriched = await Promise.all(
          results.slice(0, 12).map(async (item: any) => {
            try {
              const images = await getMediaImages(type, item.id);
              const enLogo = images.logos?.find((l: any) => l.iso_639_1 === "en") || images.logos?.[0];
              return { ...item, logoPath: enLogo ? enLogo.file_path : null };
            } catch {
              return { ...item, logoPath: null };
            }
          })
        );

        setItems(enriched);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching similar content:", error);
        setLoading(false);
      }
    }
    fetchSimilar();
  }, [id, type]);

  if (loading) {
    return (
      <div className="px-6 py-12 md:px-16 lg:px-24">
        <h2 className="mb-8 text-xl font-bold uppercase tracking-[0.2em] text-foreground">
          More <span className="text-zinc-500">Like This</span>
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="aspect-video animate-pulse rounded-sm bg-zinc-900" />
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) return null;

  return (
    <div className="px-6 py-12 md:px-16 lg:px-24">
      <h2 className="mb-8 text-xl font-bold uppercase tracking-[0.2em] text-foreground">
        More <span className="text-zinc-500">Like This</span>
      </h2>
      
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((item, index) => (
          <Link 
            key={item.id} 
            href={`/${type}/${item.id}`}
            className="group relative block aspect-video overflow-hidden rounded-sm bg-zinc-900 shadow-lg transition-transform duration-300 hover:scale-[1.02] active:scale-95"
          >
            <img
              src={getImageUrl(item.backdrop_path)}
              alt={item.title || item.name}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 flex flex-col justify-end p-4">
              <div className="w-full">
                {item.logoPath ? (
                  <img
                    src={getImageUrl(item.logoPath)}
                    alt={item.title || item.name}
                    className="h-auto max-h-10 w-full object-contain object-left drop-shadow-2xl"
                  />
                ) : (
                  <span className="text-xs font-bold text-white uppercase tracking-tight block text-left leading-tight drop-shadow-lg">
                    {item.title || item.name}
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
