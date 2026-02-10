"use client";

import { getImageUrl } from "@/lib/tmdb";
import { motion } from "framer-motion";

interface CastProps {
  cast: any[];
}

export function Cast({ cast }: CastProps) {
  if (!cast || cast.length === 0) return null;

  return (
    <div className="px-6 py-12 md:px-16 lg:px-24">
      <h2 className="mb-8 text-xl font-bold uppercase tracking-[0.2em] text-foreground">
        Main <span className="text-zinc-500">Characters</span>
      </h2>
      
      <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-hide">
        {cast.slice(0, 15).map((person, index) => (
                <motion.div
                  key={person.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex-none w-28 md:w-36 text-center"
                >
                  <div className="relative aspect-square w-full overflow-hidden rounded-full bg-zinc-900 mb-4 shadow-[0_0_30px_rgba(0,0,0,0.5)] border-2 border-white/5">
                    {person.profile_path ? (
                    <img
                      src={getImageUrl(person.profile_path)}
                      alt={person.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-zinc-700 font-black uppercase tracking-widest text-[10px] bg-gradient-to-br from-zinc-800 to-zinc-900">
                      {person.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="space-y-1.5 px-2">
                  <h3 className="text-[11px] font-black text-white uppercase tracking-wider leading-tight line-clamp-1 transition-colors">
                    {person.name}
                  </h3>
                <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest line-clamp-1 italic opacity-60">
                  {person.character}
                </p>
              </div>
            </motion.div>
        ))}
      </div>
    </div>
  );
}
