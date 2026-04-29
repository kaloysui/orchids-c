"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { getCollectionDetails, getImageUrl } from "@/lib/tmdb";
import { useGlobalLoading } from "@/hooks/useGlobalLoading";

const COLLECTION_IDS = [
  86311,  // MCU
  10,     // Star Wars
  1241,   // Harry Potter
  645,    // James Bond
  119,    // Lord of the Rings
  531241, // Spider-Man
  328,    // Jurassic Park
  9485,   // Fast & Furious
  87359,  // Mission: Impossible
  10194,  // Toy Story
  295,    // Pirates of the Caribbean
  403374, // John Wick
  8650,   // Transformers
  157463, // Despicable Me
  263,    // Batman
  84,     // Indiana Jones
  2157,   // Shrek
  8354,   // Ice Age
  43563,  // Kung Fu Panda
  161223, // How to Train Your Dragon
];

interface Collection {
  id: number;
  name: string;
  poster_path: string;
  parts?: any[];
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function CollectionsModal({ isOpen, onClose }: Props) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { setIsLoading: setGlobalLoading } = useGlobalLoading();

  useEffect(() => {
    if (!isOpen || collections.length > 0) return;
    setIsLoading(true);
    Promise.all(
      COLLECTION_IDS.map((id) =>
        getCollectionDetails(id).catch(() => null)
      )
    )
      .then((results) => setCollections(results.filter(Boolean) as Collection[]))
      .finally(() => setIsLoading(false));
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  const handleClick = (id: number) => {
    setGlobalLoading(true);
    router.push(`/collections/${id}`);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Bottom Sheet */}
          <motion.div
            initial={{ y: "100%", opacity: 0.5 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 32, stiffness: 320, mass: 0.9 }}
            className="relative w-full max-w-md mx-4 mb-24 bg-neutral-950/95 border border-white/10 backdrop-blur-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            style={{ maxHeight: "75vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-0 flex-shrink-0">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-3 pb-3 flex-shrink-0">
              <h2 className="text-xl font-bold tracking-tight">Collections</h2>
              <button
                onClick={onClose}
                className="flex items-center justify-center w-8 h-8 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* List */}
            <div className="overflow-y-auto flex-1 overscroll-contain px-2 pb-3">
              {isLoading ? (
                <div className="divide-y divide-white/5 rounded-2xl overflow-hidden bg-white/4">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3 px-4 py-3">
                      <div className="w-9 h-12 rounded-lg bg-white/8 animate-pulse flex-shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3.5 bg-white/8 rounded animate-pulse w-3/4" />
                        <div className="h-2.5 bg-white/5 rounded animate-pulse w-1/4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="divide-y divide-white/5 rounded-2xl overflow-hidden bg-white/4">
                  {collections.map((col) => (
                    <button
                      key={col.id}
                      onClick={() => handleClick(col.id)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/6 active:bg-white/8 transition-colors text-left"
                    >
                      {/* Poster thumb */}
                      <div className="flex-shrink-0 w-9 h-12 rounded-lg overflow-hidden bg-white/8">
                        {col.poster_path && (
                          <img
                            src={getImageUrl(col.poster_path)}
                            alt={col.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white/80 line-clamp-1">{col.name}</p>
                        {col.parts?.length ? (
                          <p className="text-xs text-white/30 mt-0.5">{col.parts.length} films</p>
                        ) : null}
                      </div>
                      <span className="text-white/20 text-xs flex-shrink-0">›</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
