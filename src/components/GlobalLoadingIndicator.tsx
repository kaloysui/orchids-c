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
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="fixed top-4 right-4 z-[9999] flex items-center justify-center"
        >
          <div className="relative flex items-center justify-center scale-75">
            <SnakeLoader size="sm" />
            <div className="absolute inset-0 bg-primary/10 blur-md rounded-full" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
