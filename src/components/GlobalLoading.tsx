"use client";

import { useGlobalLoading } from "@/hooks/useGlobalLoading";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";

export function GlobalLoading() {
  const { isLoading } = useGlobalLoading();

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, x: -20 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          exit={{ opacity: 0, scale: 0.8, x: -20 }}
          className="fixed bottom-6 left-6 z-[9999] flex items-center gap-3 px-5 py-2.5 bg-zinc-900/90 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)]"
        >
          <div className="relative flex items-center justify-center">
            <Loader2 className="w-4 h-4 text-primary animate-spin" />
            <div className="absolute inset-0 blur-sm bg-primary/20 animate-pulse rounded-full" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white leading-none">Loading</span>
            <span className="text-[8px] font-medium text-white/40 uppercase tracking-[0.1em] mt-0.5">Please wait...</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
