"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { getProviderContent, getImageUrl } from "@/lib/tmdb";
import { motion } from "framer-motion";
import { Play, Plus, ChevronLeft, ChevronRight, Star } from "lucide-react";

interface Media {
  id: number;
  media_type: "movie" | "tv";
  poster_path: string;
  backdrop_path: string;
  title?: string;
  name?: string;
  logoPath?: string | null;
  logoError?: boolean;
  vote_average?: number;
  release_date?: string;
  first_air_date?: string;
}

const NETWORKS = [
  { id: "netflix", label: "NETFLIX", providerId: 8 },
  { id: "disney", label: "DISNEY+", providerId: 337 },
  { id: "hbo", label: "HBO MAX", providerId: 1899 },
  { id: "hulu", label: "HULU", providerId: 15 },
  { id: "prime", label: "PRIME VIDEO", providerId: 119 },
  { id: "apple", label: "APPLE TV+", providerId: 350 },
  { id: "peacock", label: "PEACOCK", providerId: 386 },
  { id: "paramount", label: "PARAMOUNT+", providerId: 531 },
];

export function WatchNowOn() {
  const [data, setData] = useState<Record<string, Media[]>>({});
  const [loading, setLoading] = useState(true);
  const [activeNetwork, setActiveNetwork] = useState(NETWORKS[0].id);
  const [erroredLogos, setErroredLogos] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleLogoError = (id: string) => {
    setErroredLogos(prev => new Set(prev).add(id));
  };

    useEffect(() => {
      async function fetchNetwork() {
        const network = NETWORKS.find(n => n.id === activeNetwork);
        if (!network || data[activeNetwork]?.length > 0) return;
        
        setLoading(true);
        try {
          const response = await getProviderContent(
            network.providerId,
            (network as any).networkId
          );
          
          const filtered = response.results.filter((item: any) => item.backdrop_path);
          const top15 = filtered.slice(0, 15).map((item: any) => ({
            ...item,
            logoPath: null
          }));

          setData(prev => ({ ...prev, [activeNetwork]: top15 }));
          setLoading(false);
        } catch (error) {
          console.error("Error fetching network data:", error);
          setLoading(false);
        }
      }
      fetchNetwork();
    }, [activeNetwork]);

  const currentItems = data[activeNetwork] || [];

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === "left" 
        ? scrollLeft - clientWidth * 0.8 
        : scrollLeft + clientWidth * 0.8;
      
      scrollRef.current.scrollTo({
        left: scrollTo,
        behavior: "smooth"
      });
    }
  };

  const NetworkTab = ({ id, label }: { id: string, label: string }) => (
    <button
      onClick={() => setActiveNetwork(id)}
      className={`relative py-1.5 text-[10px] font-bold tracking-[0.2em] transition-all whitespace-nowrap ${
        activeNetwork === id 
          ? "text-primary" 
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {label}
      {activeNetwork === id && (
        <motion.div
          layoutId="activeNetworkTab"
          className="absolute -bottom-1 left-0 w-full h-[2px] bg-white shadow-[0_0_8px_rgba(255,255,255,0.5)]"
        />
      )}
    </button>
  );

  const activeNetworkLabel = NETWORKS.find(n => n.id === activeNetwork)?.label;

  if (loading && currentItems.length === 0) {
    return (
      <div className="w-full py-10 px-0">
        <div className="flex items-center justify-between mb-8 px-4">
          <h2 className="text-lg font-bold text-foreground uppercase tracking-[0.2em]">
            Watch Now On {activeNetworkLabel}
          </h2>
        </div>
        <div className="flex overflow-x-auto gap-2 px-4 scrollbar-hide">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="flex-none w-[150px] sm:w-[170px] md:w-[200px] aspect-[2/3] animate-pulse bg-zinc-800" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <section className="w-full py-10 px-0 overflow-visible relative group/section">
      <div className="flex items-center justify-between mb-8 px-4">
        <h2 className="text-lg font-bold text-foreground uppercase tracking-[0.2em]">
          Watch Now On {activeNetworkLabel}
        </h2>
      </div>
      
        <div 
          ref={scrollRef}
          className="flex overflow-x-auto gap-2 scrollbar-hide px-4 scroll-smooth mb-6 overscroll-x-contain"
        >
            {currentItems.map((item, index) => (
                <Link
                  key={`${item.id}-${activeNetwork}`}
                  href={`/${item.media_type}/${item.id}`}
                  className="relative flex-none w-[150px] sm:w-[170px] md:w-[200px] group"
                >
                    <div className="relative aspect-[2/3] w-full overflow-hidden shadow-lg cursor-pointer bg-zinc-900">
                      <img
                        src={getImageUrl(item.poster_path)}
                        alt={item.title || item.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
  
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity duration-300 z-10">
                        <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/60 backdrop-blur-md border border-white/10 w-fit rounded-full flex items-center gap-1">
                          <Star className="w-2.5 h-2.5 text-yellow-500 fill-yellow-500" />
                          <p className="text-[10px] text-yellow-500 font-bold">
                            {Math.floor(item.vote_average || 0)}
                          </p>
                        </div>
                        {(item.release_date || item.first_air_date) && (
                          <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/60 backdrop-blur-md border border-white/10 w-fit rounded-full">
                            <p className="text-[10px] text-white font-bold">
                              {(item.release_date || item.first_air_date || "").split("-")[0]}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                </Link>
            ))}
        </div>

      <div className="flex items-center justify-between px-4 mt-2">
        <div className="flex items-center gap-6 overflow-x-auto scrollbar-hide">
          {NETWORKS.map((network) => (
            <NetworkTab key={network.id} id={network.id} label={network.label} />
          ))}
        </div>
        <div className="flex items-center gap-1 ml-4">
          <button
            onClick={() => scroll("left")}
            className="p-1.5 rounded-full bg-zinc-900/80 text-white hover:bg-white hover:text-black transition-all border border-white/10"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll("right")}
            className="p-1.5 rounded-full bg-zinc-900/80 text-white hover:bg-white hover:text-black transition-all border border-white/10"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
