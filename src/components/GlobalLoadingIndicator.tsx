"use client";

import { useGlobalLoading } from "@/hooks/useGlobalLoading";
import { motion, AnimatePresence } from "framer-motion";
import { SnakeLoader } from "@/components/ui/snake-loader";

export function GlobalLoadingIndicator() {
  const { isLoading } = useGlobalLoading();

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, x: -10 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          exit={{ opacity: 0, scale: 0.8, x: -10 }}
          className="fixed bottom-6 left-6 z-[9999] flex items-center gap-3 px-4 py-2 bg-background/80 backdrop-blur-2xl border border-primary/20 rounded-full shadow-[0_0_30px_-5px_rgba(var(--primary),0.3)]"
        >
          <div className="relative flex items-center justify-center scale-75">
            <SnakeLoader size="sm" />
            <div className="absolute inset-0 bg-primary/10 blur-md rounded-full" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/80">Loading</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
